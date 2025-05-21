import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { databases } from '../lib/appwrite';
import { Query } from 'appwrite';
import { styles } from '../constants/PendingServicesScreen.styles';

const DATABASE_ID = 'ServiceVale';
const COLLECTION_ID = 'orders_id';

type Service = {
  id: string;
  serviceType: string;
  clientName: string;
  address: string;
  phone: string;
  amount: string;
  status: string;
  date: string;
  serviceBoy: string;
};

const PendingServicesScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServices = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('status', 'pending'),
          Query.orderDesc('$createdAt')
        ]
      );
      const formattedServices = response.documents.map(doc => ({
        id: doc.$id,
        serviceType: doc.serviceType,
        clientName: doc.clientName,
        address: doc.address,
        phone: doc.phoneNumber,
        amount: doc.billAmount,
        status: doc.status,
        date: new Date(doc.$createdAt).toLocaleString(),
        serviceBoy: doc.serviceboyName
      }));
      setServices(formattedServices);
    } catch (error) {
      console.error('Error fetching services:', error);
      Alert.alert('Error', 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    if (params.newService) {
      try {
        const newService = JSON.parse(params.newService as string);
        setServices(prev => [{
          id: newService.id,
          serviceType: newService.serviceType,
          clientName: newService.clientName,
          address: newService.address,
          phone: newService.phoneNumber,
          amount: `₹${newService.billAmount || '0'}`,
          status: 'pending',
          date: 'Just now',
          serviceBoy: newService.serviceboyName
        }, ...prev]);
      } catch (error) {
        console.error('Error parsing new service:', error);
      }
    }
  }, [params.newService]);

  const handleComplete = async (id: string) => {
    Alert.alert(
      'Complete Service',
      'Are you sure this service is completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              await databases.updateDocument(
                DATABASE_ID,
                COLLECTION_ID,
                id,
                { status: 'completed' }
              );
              setServices(prev => prev.filter(service => service.id !== id));
              const completedService = services.find(service => service.id === id);
              if (completedService) {
                router.push({
                  pathname: '/completed',
                  params: {
                    completedService: JSON.stringify(completedService)
                  }
                });
              }
            } catch (error) {
              console.error('Error completing service:', error);
              Alert.alert('Error', 'Failed to complete service');
            }
          }
        }
      ]
    );
  };

  const renderServiceItem = ({ item }: { item: Service }) => (
      <TouchableOpacity
        style={styles.serviceCard}
        >
      <View style={styles.serviceHeader}>
        <Text style={styles.serviceType}>{item.serviceType}</Text>
        <View style={[styles.statusBadge, styles.pendingBadge]}>
          <Text style={styles.statusText}>Pending</Text>
        </View>
      </View>
      <View style={styles.serviceDetails}>
        <View style={styles.detailRow}>
          <MaterialIcons name="person" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{item.clientName}</Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialIcons name="location-on" size={16} color="#6B7280" />
          <Text style={styles.detailText} numberOfLines={1} ellipsizeMode="tail">
            {item.address}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialIcons name="phone" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{item.phone}</Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="currency-inr" size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            {isNaN(Number(item.amount)) ? '0' : Number(item.amount).toLocaleString('en-IN')}
          </Text>
        </View>
      </View>
      <View style={styles.serviceFooter}>
        <Text style={styles.serviceBoyText}>Assigned to: {item.serviceBoy}</Text>
        <Text style={styles.dateText}>{item.date}</Text>
      </View>
      <TouchableOpacity
        style={styles.completeButton}
        onPress={() => handleComplete(item.id)}
      >
        <Text style={styles.completeButtonText}>Mark as Completed</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {services.length > 0 ? (
        <FlatList
          data={services}
          renderItem={renderServiceItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <MaterialIcons name="pending-actions" size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>No pending services</Text>
          <Text style={styles.emptySubtext}>All your services are up to date</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default PendingServicesScreen;
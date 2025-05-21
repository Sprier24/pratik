import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, SafeAreaView, TouchableOpacity, } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { databases } from '../lib/appwrite';
import { Query } from 'appwrite';
import { useLocalSearchParams } from 'expo-router';
import { styles } from '../constants/CompletedServicesScreen.styles';

const DATABASE_ID = 'ServiceVale';
const COLLECTION_ID = 'orders_id';

type Service = {
  id: string;
  title: string;
  status: string;
  serviceType: string;
  clientName: string;
  address: string;
  phone: string;
  amount: string;
  serviceBoy?: string;
  date: string;
};

const CompletedServicesScreen = () => {
  const params = useLocalSearchParams();
  const [completedServices, setCompletedServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompletedServices = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('status', 'completed'),
          Query.orderDesc('$createdAt')
        ]
      );
      const formattedServices = response.documents.map(doc => ({
        id: doc.$id,
        title: `${doc.serviceType} - ${doc.clientName}`,
        status: doc.status,
        serviceType: doc.serviceType,
        clientName: doc.clientName,
        address: doc.address,
        phone: doc.phoneNumber,
        amount: doc.billAmount,
        serviceBoy: doc.serviceboyName,
        date: new Date(doc.$createdAt).toLocaleString()
      }));
      setCompletedServices(formattedServices);
    } catch (error) {
      console.error('Error fetching completed services:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedServices();
    if (params.completedService) {
      try {
        const newService = JSON.parse(params.completedService as string);
        setCompletedServices(prev => [{
          id: newService.id,
          title: `${newService.serviceType} - ${newService.clientName}`,
          status: 'Completed',
          serviceType: newService.serviceType,
          clientName: newService.clientName,
          address: newService.address,
          phone: newService.phone,
          amount: newService.amount,
          serviceBoy: newService.serviceBoy,
          date: newService.date || 'Just now'
        }, ...prev]);
      } catch (error) {
        console.error('Error parsing completed service:', error);
      }
    }
  }, [params.completedService]);

  const renderServiceCard = ({ item }: { item: Service }) => (
    <TouchableOpacity
      style={styles.serviceCard}
      onPress={() => {
        router.push({
          pathname: '/bill',
          params: {
            serviceData: JSON.stringify({
              serviceType: item.serviceType,
              serviceBoyName: item.serviceBoy,
              customerName: item.clientName,
              address: item.address,
              contactNumber: item.phone,
              serviceCharge: item.amount
            }),
          },
        });
      }}
    >
      <View style={styles.serviceHeader}>
        <Text style={styles.serviceType}>{item.serviceType}</Text>
        <View style={[styles.statusBadge, styles.completedBadge]}>
          <Text style={styles.statusText}>Completed</Text>
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
          <Text style={styles.detailText}>{Number(item.amount).toLocaleString('en-IN')}</Text>
        </View>
      </View>
      <View style={styles.serviceFooter}>
        <Text style={styles.serviceBoyText}>Assigned to: {item.serviceBoy}</Text>
        <Text style={styles.dateText}>{item.date}</Text>
      </View>
    </TouchableOpacity>
  );
  return (
    <SafeAreaView style={styles.container}>
      {completedServices.length > 0 ? (
        <FlatList
          data={completedServices}
          renderItem={renderServiceCard}
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

export default CompletedServicesScreen;
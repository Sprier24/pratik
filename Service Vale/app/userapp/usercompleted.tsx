import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { databases, account } from '../../lib/appwrite';
import { Query } from 'appwrite';
import { styles } from '../../constants/userapp/CompletedServicesScreenuser.styles';

const DATABASE_ID = '681c428b00159abb5e8b';
const COLLECTION_ID = '681d92600018a87c1478';

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
  serviceDate: string;
  serviceTime: string;
  serviceboyEmail: string;
};

const CompletedServicesScreenUser = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const params = useLocalSearchParams();

  const fetchServices = async () => {
    try {
      const currentUser = await account.get();
      const email = currentUser.email;
      setUserEmail(email);

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('status', 'completed'),
          Query.equal('serviceboyEmail', email),
          Query.orderDesc('$createdAt')
        ]
      );

      const formattedServices = response.documents.map(doc => {
        let displayDate = '';
        if (doc.serviceDate) {
          const [year, month, day] = doc.serviceDate.split('-');
          displayDate = `${day}/${month}/${year}`;
        }
        
        let displayTime = '';
        if (doc.serviceTime) {
          const [hours, minutes] = doc.serviceTime.split(':');
          const hourNum = parseInt(hours);
          const ampm = hourNum >= 12 ? 'PM' : 'AM';
          const displayHour = hourNum % 12 || 12;
          displayTime = `${displayHour}:${minutes} ${ampm}`;
        }

        return {
          id: doc.$id,
          serviceType: doc.serviceType,
          clientName: doc.clientName,
          address: doc.address,
          phone: doc.phoneNumber,
          amount: doc.billAmount,
          status: doc.status,
          date: new Date(doc.$createdAt).toLocaleString(),
          serviceBoy: doc.serviceboyName,
          serviceDate: displayDate,
          serviceTime: displayTime,
          serviceboyEmail: doc.serviceboyEmail
        };
      });

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

    if (params.completedService) {
      try {
        const newService = JSON.parse(params.completedService as string);
        if (newService.serviceboyEmail === userEmail) {
          const formattedService = {
            id: newService.id,
            serviceType: newService.serviceType,
            clientName: newService.clientName,
            address: newService.address,
            phone: newService.phone,
            amount: newService.amount,
            status: 'completed',
            date: newService.date || 'Just now',
            serviceBoy: newService.serviceBoy,
            serviceDate: newService.serviceDate || '',
            serviceTime: newService.serviceTime || '',
            serviceboyEmail: newService.serviceboyEmail || ''
          };
          
          setServices(prev => [formattedService, ...prev]);
        }
      } catch (error) {
        console.error('Error parsing completed service:', error);
      }
    }
  }, [params.completedService, userEmail]);

    const handleMoveToPending = async (id: string) => {
    Alert.alert(
        'Move to Pending',
        'Are you sure you want to move this service back to pending?',
        [
        { text: 'Cancel', style: 'cancel' },
        {
            text: 'Move',
            onPress: async () => {
            try {
                await databases.updateDocument(
                DATABASE_ID,
                COLLECTION_ID,
                id,
                { status: 'pending' }
                );
                
                setServices(prev => prev.filter(service => service.id !== id));
                
                const movedService = services.find(service => service.id === id);
                if (movedService) {
                router.push({
                    pathname: '/userapp/userpending',
                    params: {
                    movedService: JSON.stringify({
                        ...movedService,
                        status: 'pending'
                    })
                    }
                });
                }
            } catch (error) {
                console.error('Error moving service:', error);
                Alert.alert('Error', 'Failed to move service to pending');
            }
            }
        }
        ]
    );
    };

    const renderServiceItem = ({ item }: { item: Service }) => (
    <TouchableOpacity 
        style={styles.serviceCard}
        onPress={() => {
        router.push({
            pathname: '/userapp/userbill',
            params: {
            serviceData: JSON.stringify({
                serviceType: item.serviceType,
                serviceBoyName: item.serviceBoy || 'userName',
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
          <MaterialIcons name="phone" size={16} color="#6B7280"/>
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
        <Text style={styles.dateText}>
          {item.serviceDate && item.serviceTime ? 
            `${item.serviceDate} • ${item.serviceTime}` : 
            item.date}
        </Text>
      </View>
    <TouchableOpacity
      style={styles.moveToPendingButton}
      onPress={(e) => {
        e.stopPropagation(); // Prevent card press
        handleMoveToPending(item.id);
      }}
    >
      <Text style={styles.moveToPendingButtonText}>Move to Pending</Text>
    </TouchableOpacity>
  </TouchableOpacity>
);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Completed Services</Text>
        <View style={styles.headerCountContainer}>
          <Text style={styles.headerCountText}>{services.length}</Text>
        </View>
      </View>

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
          <MaterialIcons name="check-circle" size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>No completed services found</Text>
          <Text style={styles.emptySubtext}>You haven't completed any services yet</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default CompletedServicesScreenUser;
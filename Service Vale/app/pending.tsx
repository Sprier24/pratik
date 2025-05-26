import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, SafeAreaView, TouchableOpacity, Alert, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { databases } from '../lib/appwrite';
import { Query } from 'appwrite';
import { styles } from '../constants/PendingServicesScreen.styles';

const DATABASE_ID = '681c428b00159abb5e8b';
const COLLECTION_ID = '681d92600018a87c1478';
const USERS_COLLECTION_ID = '681c429800281e8a99bd'; 

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

type User = {
  id: string;
  name: string;
};

const PendingServicesScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]); 
  const [loading, setLoading] = useState(true);
  const [serviceBoys, setServiceBoys] = useState<User[]>([]);
  const [selectedServiceBoy, setSelectedServiceBoy] = useState<string | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const fetchServiceBoys = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        USERS_COLLECTION_ID
      );
      
      const boys = response.documents.map(doc => ({
        id: doc.$id,
        name: doc.name
      }));
      
      setServiceBoys(boys);
    } catch (error) {
      console.error('Error fetching service boys:', error);
    }
  };

// Update the fetchServices function
  const fetchServices = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('status', 'pending'),
          Query.orderAsc('serviceDate'),
          Query.orderAsc('serviceTime')
        ]
      );

      const formattedServices = response.documents.map(doc => {
        // Convert stored yyyy-mm-dd to display dd/mm/yyyy
        const [year, month, day] = doc.serviceDate.split('-');
        const displayDate = `${day}/${month}/${year}`;
        
        // Convert stored 24-hour time to AM/PM
        const [hours, minutes] = doc.serviceTime.split(':');
        const hourNum = parseInt(hours);
        const ampm = hourNum >= 12 ? 'PM' : 'AM';
        const displayHour = hourNum % 12 || 12;
        const displayTime = `${displayHour}:${minutes} ${ampm}`;

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
          serviceboyEmail: doc.serviceboyEmail,
          serviceDate: displayDate, // dd/mm/yyyy format
          serviceTime: displayTime, // AM/PM format
          sortDate: doc.serviceDate, // Keep original for sorting
          sortTime: doc.serviceTime  // Keep original for sorting
        };
      });

      // Client-side sorting as fallback
      formattedServices.sort((a, b) => {
        if (a.sortDate !== b.sortDate) {
          return a.sortDate.localeCompare(b.sortDate);
        }
        return a.sortTime.localeCompare(b.sortTime);
      });

      setAllServices(formattedServices);
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
    fetchServiceBoys();

    if (params.newService) {
      try {
        const newService = JSON.parse(params.newService as string);
        const formattedService = {
          id: newService.id,
          serviceType: newService.serviceType,
          clientName: newService.clientName,
          address: newService.address,
          phone: newService.phoneNumber,
          amount: `₹${newService.billAmount || '0'}`,
          status: 'pending',
          date: 'Just now',
          serviceBoy: newService.serviceboyName,
          serviceDate: newService.serviceDate || '',
          serviceTime: newService.serviceTime || '',
          serviceboyEmail: newService.serviceboyEmail || ''
        };
        
        // Add to beginning of array (will be sorted properly on next fetch)
        setAllServices(prev => [formattedService, ...prev]);
        setServices(prev => {
          if (!selectedServiceBoy || selectedServiceBoy === newService.serviceboyName) {
            return [formattedService, ...prev];
          }
          return prev;
        });
        
        // Immediately refetch to get proper sorting
        fetchServices();
      } catch (error) {
        console.error('Error parsing new service:', error);
      }
    }
  }, [params.newService]);

  // Count pending orders by service boy
  const countPendingByServiceBoy = () => {
    const counts: Record<string, number> = { 'All': allServices.length };
    
    serviceBoys.forEach(boy => {
      counts[boy.name] = allServices.filter(service => service.serviceBoy === boy.name).length;
    });
    
    return counts;
  };

  const filterServices = (serviceBoyName: string | null) => {
    setSelectedServiceBoy(serviceBoyName);
    if (!serviceBoyName) {
      setServices(allServices);
    } else {
      const filtered = allServices.filter(service => 
        service.serviceBoy === serviceBoyName
      );
      setServices(filtered);
    }
    setFilterModalVisible(false);
  };

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
              
              setAllServices(prev => prev.filter(service => service.id !== id));
              setServices(prev => prev.filter(service => service.id !== id));
              
              const completedService = allServices.find(service => service.id === id);
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

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Service',
      'Are you sure you want to delete this service order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await databases.deleteDocument(
                DATABASE_ID,
                COLLECTION_ID,
                id
              );
              
              // Remove from local state
              setAllServices(prev => prev.filter(service => service.id !== id));
              setServices(prev => prev.filter(service => service.id !== id));
              
              Alert.alert('Success', 'Service order deleted successfully');
            } catch (error) {
              console.error('Error deleting service:', error);
              Alert.alert('Error', 'Failed to delete service order');
            }
          }
        }
      ]
    );
  };

  const renderServiceItem = ({ item }: { item: Service }) => (
    <TouchableOpacity style={styles.serviceCard}>
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
        <Text 
          style={styles.serviceBoyText}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          Assigned to: {item.serviceBoy}
        </Text>
        <Text style={styles.dateText}>
          {item.serviceDate} • {item.serviceTime}
        </Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.completeButton, styles.actionButton]}
          onPress={() => handleComplete(item.id)}
        >
          <Text style={styles.completeButtonText}>Complete</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.deleteButton, styles.actionButton]}
          onPress={() => handleDelete(item.id)}
        >
          <Text style={styles.completeButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Filter Button */}
      <TouchableOpacity 
        style={styles.filterButton}
        onPress={() => setFilterModalVisible(true)}
      >
        <Text style={styles.filterButtonText}>
          {selectedServiceBoy ? `Filter: ${selectedServiceBoy}` : 'Filter by Service Boy'}
        </Text>
        <MaterialIcons name="filter-list" size={20} color="#fff" />
      </TouchableOpacity>

      {/* Header with count */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pending Services</Text>
        <View style={styles.headerCountContainer}>
          <Text style={styles.headerCountText}>
            {selectedServiceBoy 
              ? `${services.length} of ${countPendingByServiceBoy()[selectedServiceBoy] || 0}`
              : services.length
            }
          </Text>
        </View>
      </View>

      {/* Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Service Boy</Text>
            
            <TouchableOpacity 
              style={styles.filterOption}
              onPress={() => filterServices(null)}
            >
              <View style={styles.filterOptionContainer}>
                <Text style={styles.filterOptionText}>All Service Boys</Text>
                <Text style={styles.countBadge}>{countPendingByServiceBoy()['All']}</Text>
              </View>
            </TouchableOpacity>
            
            {serviceBoys.map((boy) => (
              <TouchableOpacity 
                key={boy.id}
                style={styles.filterOption}
                onPress={() => filterServices(boy.name)}
              >
                <View style={styles.filterOptionContainer}>
                  <Text style={styles.filterOptionText}>{boy.name}</Text>
                  <Text style={styles.countBadge}>{countPendingByServiceBoy()[boy.name] || 0}</Text>
                </View>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {services.length > 0 ? (
      <FlatList
        data={services}
        renderItem={renderServiceItem}
        keyExtractor={(item) => item.id || Math.random().toString()} // Fallback if id is missing
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
      ) : (
        <View style={styles.emptyState}>
          <MaterialIcons name="pending-actions" size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>
            {selectedServiceBoy 
              ? `No pending services for ${selectedServiceBoy}`
              : 'No pending services'}
          </Text>
          <Text style={styles.emptySubtext}>All services are up to date</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default PendingServicesScreen;
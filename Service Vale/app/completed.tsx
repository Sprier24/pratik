import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, SafeAreaView, TouchableOpacity, Modal, Alert, } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { databases } from '../lib/appwrite';
import { Query } from 'appwrite';
import { styles } from '../constants/CompletedServicesScreen.styles';

const DATABASE_ID = '681c428b00159abb5e8b';
const COLLECTION_ID = '681d92600018a87c1478';
const USERS_COLLECTION_ID = '681c429800281e8a99bd';

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

type User = {
  id: string;
  name: string;
};

const CompletedServicesScreen = () => {
  const params = useLocalSearchParams();
  const [completedServices, setCompletedServices] = useState<Service[]>([]);
  const [allCompletedServices, setAllCompletedServices] = useState<Service[]>([]);
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

      setAllCompletedServices(formattedServices);
      setCompletedServices(formattedServices);
    } catch (error) {
      console.error('Error fetching completed services:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedServices();
    fetchServiceBoys();

    if (params.completedService) {
      try {
        const newService = JSON.parse(params.completedService as string);
        const formattedService = {
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
        };
        
        setAllCompletedServices(prev => [formattedService, ...prev]);
        setCompletedServices(prev => {
          if (!selectedServiceBoy || selectedServiceBoy === newService.serviceBoy) {
            return [formattedService, ...prev];
          }
          return prev;
        });
      } catch (error) {
        console.error('Error parsing completed service:', error);
      }
    }

    if (params.movedService) {
    try {
      const movedService = JSON.parse(params.movedService as string);
      const formattedService = {
        id: movedService.id,
        title: `${movedService.serviceType} - ${movedService.clientName}`,
        status: 'pending', 
        serviceType: movedService.serviceType,
        clientName: movedService.clientName,
        address: movedService.address,
        phone: movedService.phone,
        amount: movedService.amount,
        serviceBoy: movedService.serviceBoy,
        date: movedService.date || 'Just now',
        serviceDate: movedService.serviceDate, 
        serviceTime: movedService.serviceTime  
      };
      
      setAllCompletedServices(prev => [formattedService, ...prev]);
      setCompletedServices(prev => {
        if (!selectedServiceBoy || selectedServiceBoy === movedService.serviceBoy) {
          return [formattedService, ...prev];
        }
        return prev;
      });
    } catch (error) {
      console.error('Error parsing moved service:', error);
    }
  }
  }, [params.completedService]);

  const countCompletedByServiceBoy = () => {
    const counts: Record<string, number> = { 'All': allCompletedServices.length };
    
    serviceBoys.forEach(boy => {
      counts[boy.name] = allCompletedServices.filter(service => service.serviceBoy === boy.name).length;
    });
    
    return counts;
  };

  const filterServices = (serviceBoyName: string | null) => {
    setSelectedServiceBoy(serviceBoyName);
    if (!serviceBoyName) {
      setCompletedServices(allCompletedServices);
    } else {
      const filtered = allCompletedServices.filter(service => 
        service.serviceBoy === serviceBoyName
      );
      setCompletedServices(filtered);
    }
    setFilterModalVisible(false);
  };

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
              
              const serviceToMove = completedServices.find(service => service.id === id);
              if (serviceToMove) {
                setAllCompletedServices(prev => prev.filter(service => service.id !== id));
                setCompletedServices(prev => prev.filter(service => service.id !== id));
                
                 router.push({
                  pathname: '/pending',
                  params: {
                    movedService: JSON.stringify({
                      ...serviceToMove,
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
      </View>
      
      {/* Add this button to move back to pending */}
      <TouchableOpacity
        style={styles.moveToPendingButton}
        onPress={(e) => {
          e.stopPropagation(); 
          handleMoveToPending(item.id);
        }}
      >
        <Text style={styles.moveToPendingButtonText}>Move to Pending</Text>
      </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Completed Services</Text>
        <View style={styles.headerCountContainer}>
          <Text style={styles.headerCountText}>
            {selectedServiceBoy 
              ? `${completedServices.length} of ${countCompletedByServiceBoy()[selectedServiceBoy] || 0}`
              : completedServices.length
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
                <Text style={styles.countBadge}>{countCompletedByServiceBoy()['All']}</Text>
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
                  <Text style={styles.countBadge}>{countCompletedByServiceBoy()[boy.name] || 0}</Text>
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

      {completedServices.length > 0 ? (
      <FlatList
        data={completedServices}
        renderItem={renderServiceCard}
        keyExtractor={(item) => item.id || Math.random().toString()} 
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
      ) : (
        <View style={styles.emptyState}>
          <MaterialIcons name="check-circle" size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>
            {selectedServiceBoy 
              ? `No completed services for ${selectedServiceBoy}`
              : 'No completed services'}
          </Text>
          <Text style={styles.emptySubtext}>All services are pending</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default CompletedServicesScreen;
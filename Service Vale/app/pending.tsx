import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, SafeAreaView, TouchableOpacity, Alert, Modal, ActivityIndicator, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons, MaterialIcons, Feather } from '@expo/vector-icons';
import { databases } from '../lib/appwrite';
import { Query } from 'appwrite';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, isSameDay } from 'date-fns';
import { Linking } from 'react-native';
import { styles } from '../constants/PendingServicesScreen.styles';

const DATABASE_ID = 'servicevale-database';
const COLLECTION_ID = 'orders-id';
const USERS_COLLECTION_ID = 'engineer-id';

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
  serviceboyContact: string;
  sortDate: string;
  sortTime: string;
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
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [, setFilterType] = useState<'serviceBoy' | 'date'>('serviceBoy');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const itemsPerPage = 10;
  const [totalPendingCount, setTotalPendingCount] = useState(0);
  const [engineerCounts, setEngineerCounts] = useState<Record<string, number>>({});

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
      console.error('Error fetching engineer :', error);
    }
  };

  const fetchServices = async (page = 1, isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('status', 'pending'),
          Query.orderAsc('serviceDate'),
          Query.orderAsc('serviceTime'),
          Query.limit(itemsPerPage),
          Query.offset((page - 1) * itemsPerPage)
        ]
      );

      const formattedServices = response.documents.map(doc => {
        const [year, month, day] = doc.serviceDate.split('-');
        const displayDate = `${day}/${month}/${year}`;
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
          serviceboyContact: doc.serviceboyContact,
          serviceDate: displayDate,
          serviceTime: displayTime,
          sortDate: doc.serviceDate,
          sortTime: doc.serviceTime
        };
      });

      if (isLoadMore) {
        setAllServices(prev => [...prev, ...formattedServices]);
        setServices(prev => [...prev, ...formattedServices]);
      } else {
        setAllServices(formattedServices);
        setServices(formattedServices);
      }

      const totalCount = response.total;
      setTotalPages(Math.ceil(totalCount / itemsPerPage));
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching services :', error);
      Alert.alert('Error', 'Failed to load services');
    } finally {
      if (isLoadMore) {
        setIsLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  const fetchTotalPendingCount = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.equal('status', 'pending')]
      );
      setTotalPendingCount(response.total);
    } catch (error) {
      console.error('Error fetching total pending count :', error);
    }
  };

  const fetchEngineerCounts = async () => {
    try {
      const boysResponse = await databases.listDocuments(
        DATABASE_ID,
        USERS_COLLECTION_ID
      );

      const boys = boysResponse.documents.map(doc => doc.name);
      const counts: Record<string, number> = {
        'All Service Engineers': 0
      };

      const allResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.equal('status', 'pending')]
      );

      counts['All Service Engineers'] = allResponse.total;
      await Promise.all(boys.map(async (name) => {
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID,
          [
            Query.equal('status', 'pending'),
            Query.equal('serviceboyName', name)
          ]
        );
        counts[name] = response.total;
      }));

      setEngineerCounts(counts);
    } catch (error) {
      console.error('Error fetching engineer counts :', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchServiceBoys();
      await fetchEngineerCounts();
      fetchServices();
      fetchTotalPendingCount();
    };

    loadData();
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
          serviceDate: newService.serviceDate ?
            newService.serviceDate.split('-').reverse().join('/') : '',
          serviceTime: newService.serviceTime || '',
          serviceboyEmail: newService.serviceboyEmail || '',
          serviceboyContact: newService.serviceboyContact || '',
          sortDate: newService.serviceDate || '',
          sortTime: newService.serviceTime || ''
        };

        setAllServices(prev => [formattedService, ...prev]);
        setServices(prev => {
          if ((!selectedServiceBoy || selectedServiceBoy === newService.serviceboyName) &&
            (!dateFilter || isSameDay(new Date(newService.serviceDate.split('-').join('/')), dateFilter))) {
            return [formattedService, ...prev];
          }
          return prev;
        });
        fetchServices();
      } catch (error) {
        console.error('Error parsing new service :', error);
      }
    }
  }, [params.newService]);

  const loadMoreServices = () => {
    if (!isLoadingMore && currentPage < totalPages) {
      fetchServices(currentPage + 1, true);
    }
  };

  const countPendingByServiceBoy = () => {
    return engineerCounts;
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
              const completedAt = new Date().toISOString();
              await databases.updateDocument(
                DATABASE_ID,
                COLLECTION_ID,
                id,
                {
                  status: 'completed',
                  completedAt,
                }
              );
              setTotalPendingCount(prev => prev - 1);
              await fetchEngineerCounts();
              setAllServices(prev => prev.filter(service => service.id !== id));
              setServices(prev => prev.filter(service => service.id !== id));
              const completedService = allServices.find(service => service.id === id);
              if (completedService) {
                router.push({
                  pathname: '/completed',
                  params: {
                    completedService: JSON.stringify({
                      ...completedService,
                      status: 'completed',
                      completedAt
                    })
                  }
                });
              }
            } catch (error) {
              console.error('Error completing service :', error);
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
              setTotalPendingCount(prev => prev - 1);
              setTotalPendingCount(prev => prev - 1);
              setAllServices(prev => prev.filter(service => service.id !== id));
              setServices(prev => prev.filter(service => service.id !== id));
              Alert.alert('Success', 'Service order deleted successfully.');
            } catch (error) {
              console.error('Error deleting service :', error);
              Alert.alert('Error', 'Failed to delete service order');
            }
          }
        }
      ]
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'dismissed') {
      return;
    }
    if (selectedDate) {
      setDateFilter(selectedDate);
      applyFilters(selectedServiceBoy, selectedDate);
    }
  };

  const applyFilters = (serviceBoy: string | null, date: Date | null) => {
    let filtered = allServices;
    if (serviceBoy) {
      filtered = filtered.filter(service => service.serviceBoy === serviceBoy);
    }
    if (date) {
      filtered = filtered.filter(service => {
        const [day, month, year] = service.serviceDate.split('/');
        const serviceDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return isSameDay(serviceDate, date);
      });
    }
    setServices(filtered);
    setCurrentPage(1);
  };

  const onRefresh = () => {
    fetchServices(1);
    fetchTotalPendingCount();
    fetchEngineerCounts();
  };

  const filterServices = (serviceBoyName: string | null) => {
    setSelectedServiceBoy(serviceBoyName);
    applyFilters(serviceBoyName, dateFilter);
    setFilterModalVisible(false);
  };

  const clearDateFilter = () => {
    setDateFilter(null);
    applyFilters(selectedServiceBoy, null);
  };

  const clearServiceBoyFilter = () => {
    setSelectedServiceBoy(null);
    applyFilters(null, dateFilter);
  };

  const sendManualWhatsAppNotification = (service: Service) => {
    const message = `Hello! ${service.clientName},\n\n` +
      `We are from Service Vale\n\n` +
      `Your ${service.serviceType} service is scheduled for :\n` +
      `📅 Date : ${service.serviceDate}\n` +
      `⏰ Time : ${service.serviceTime}\n\n` +
      `Service Engineer Details :\n` +
      `👨‍🔧 Engineer Name : ${service.serviceBoy}\n` +
      `Service Charge : ₹${service.amount}\n\n` +
      `Please be ready for the service. For any queries, contact us : 635-320-2602\n\n` +
      `Thank you for choosing our service!`;
    const phone = service.phone.replace(/\D/g, '');
    const url = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Error', 'WhatsApp is not installed');
      }
    });
  };

  const renderServiceItem = ({ item }: { item: Service }) => (
    <View style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <View style={styles.serviceTypeContainer}>
          <MaterialIcons
            name="construction"
            size={20}
            color="#5E72E4"
            style={styles.serviceIcon}
          />
          <Text style={styles.serviceType}>{item.serviceType}</Text>
        </View>

        <View style={styles.serviceActions}>
          <View style={[styles.statusBadge, styles.pendingBadge]}>
            <Text style={styles.statusText}>Pending</Text>
          </View>
        </View>
      </View>

      <View style={styles.serviceDetails}>
        <View style={styles.detailRow}>
          <MaterialIcons name="person" size={20} color="#718096" />
          <Text style={styles.detailText}>{item.clientName}</Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialIcons name="location-on" size={20} color="#718096" />
          <Text style={styles.detailText}>
            {item.address}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialIcons name="phone" size={20} color="#718096" />
          <Text style={styles.detailText}>{item.phone}</Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="currency-inr" size={20} color="#718096" />
          <Text style={styles.detailText}>
            {isNaN(Number(item.amount)) ? '0' : Number(item.amount).toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      <View style={styles.serviceFooter}>
        <View style={styles.dateContainer}>
          <MaterialIcons name="access-time" size={18} color="#718096" />
          <Text style={styles.dateText}>
            {item.serviceDate} • {item.serviceTime}
          </Text>
        </View>

        <Text style={styles.serviceBoyText}>
          {item.serviceBoy}
        </Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.whatsappButton}
          onPress={() => sendManualWhatsAppNotification(item)}
        >
          <MaterialCommunityIcons name="whatsapp" size={20} color="#FFF" />
          <Text style={styles.whatsappButtonText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.completeButton}
          onPress={() => handleComplete(item.id)}
        >
          <MaterialIcons name="check-circle" size={20} color="#FFF" />
          <Text style={styles.completeButtonText}>Complete</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id)}
        >
          <MaterialIcons name="delete" size={20} color="#FFF" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.push('/home')}>
            <Feather name="arrow-left" size={25} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pending Services</Text>
        </View>

        <View style={styles.headerCount}>
          <Text style={styles.headerCountText}>{totalPendingCount}</Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, selectedServiceBoy && styles.activeFilter]}
          onPress={() => {
            setFilterType('serviceBoy');
            setFilterModalVisible(true);
          }}
        >
          <MaterialIcons name="engineering" size={20} color={selectedServiceBoy ? "#FFF" : "#5E72E4"} />
          <Text style={[styles.filterButtonText, selectedServiceBoy && styles.activeFilterText]}>
            {selectedServiceBoy ? selectedServiceBoy : 'Filter by Engineer'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, dateFilter && styles.activeFilter]}
          onPress={() => setShowDatePicker(true)}
        >
          <MaterialIcons name="today" size={20} color={dateFilter ? "#FFF" : "#5E72E4"} />
          <Text style={[styles.filterButtonText, dateFilter && styles.activeFilterText]}>
            {dateFilter ? format(dateFilter, 'dd MMM yyyy') : 'Filter by date'}
          </Text>
        </TouchableOpacity>
      </View>

      {(selectedServiceBoy || dateFilter) && (
        <View style={styles.activeFiltersContainer}>
          {selectedServiceBoy && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>{selectedServiceBoy}</Text>
              <TouchableOpacity onPress={clearServiceBoyFilter}>
                <Feather name="x" size={15} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}

          {dateFilter && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>{format(dateFilter, 'dd MMM yyyy')}</Text>
              <TouchableOpacity onPress={clearDateFilter}>
                <Feather name="x" size={15} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {showDatePicker && (
        <DateTimePicker
          value={dateFilter || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Service Engineer</Text>
            <FlatList
              style={{ maxHeight: '90%' }}
              contentContainerStyle={styles.scrollContent}
              data={[{ id: 'all', name: 'All Service Engineers' }, ...serviceBoys]}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.serviceCard}
                  onPress={() => filterServices(item.name === 'All Service Engineers' ? null : item.name)}
                >
                  <View style={styles.serviceHeader}>
                    <Text style={styles.serviceType}>{item.name}</Text>
                    <View style={[styles.statusBadge, styles.pendingBadge]}>
                      <Text style={styles.statusText}>
                        {countPendingByServiceBoy()[item.name] || 0} Pending
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={true}
            />

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
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMoreServices}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={loading && !isLoadingMore}
              onRefresh={onRefresh}
            />
          }
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color="#5E72E4" />
                <Text style={styles.loadingMoreText}>Loading more services...</Text>
              </View>
            ) : null
          }
        />
      ) : (
        <View style={styles.emptyState}>
          <MaterialIcons name="pending-actions" size={50} color="#A0AEC0" />
          <Text style={styles.emptyText}>
            {selectedServiceBoy
              ? `No pending services for ${selectedServiceBoy}`
              : dateFilter
                ? `No pending services on ${format(dateFilter, 'MMMM d, yyyy')}`
                : 'No pending services'
            }
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default PendingServicesScreen;
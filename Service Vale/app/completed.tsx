import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, SafeAreaView, TouchableOpacity, Alert, Modal, RefreshControl, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons, MaterialIcons, Feather } from '@expo/vector-icons';
import { databases } from '../lib/appwrite';
import { Query } from 'appwrite';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, isSameDay } from 'date-fns';
import { styles } from '../constants/CompletedServicesScreen.styles';

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
  completedAt?: string;
};

type User = {
  id: string;
  name: string;
};

const AdminCompletedServicesScreen = () => {
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const itemsPerPage = 10;
  const [filterType, setFilterType] = useState<'serviceBoy' | 'date'>('serviceBoy');
  const [engineerCounts, setEngineerCounts] = useState<Record<string, number>>({});
  const [totalCompleteCount, setTotalCompleteCount] = useState(0);

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
      console.error('Error fetching engineer:', error);
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
          Query.equal('status', 'completed'),
          Query.orderDesc('completedAt'),
          Query.limit(itemsPerPage),
          Query.offset((page - 1) * itemsPerPage)
        ]
      );
      const formattedServices = response.documents.map(doc => {
        const rawCompletedAt = doc.completedAt || doc.$updatedAt || doc.$createdAt;
        let serviceDateDisplay = '';
        if (doc.serviceDate) {
          const [year, month, day] = doc.serviceDate.split('-');
          serviceDateDisplay = `${day}/${month}/${year}`;
        }
        let serviceTimeDisplay = '';
        if (doc.serviceTime) {
          const [hours, minutes] = doc.serviceTime.split(':');
          const hourNum = parseInt(hours);
          const ampm = hourNum >= 12 ? 'PM' : 'AM';
          const displayHour = hourNum % 12 || 12;
          serviceTimeDisplay = `${displayHour}:${minutes} ${ampm}`;
        }
        return {
          id: doc.$id,
          serviceType: doc.serviceType,
          clientName: doc.clientName,
          address: doc.address,
          phone: doc.phoneNumber,
          amount: doc.billAmount,
          status: doc.status,
          date: rawCompletedAt ? new Date(rawCompletedAt).toLocaleString() : '',
          serviceBoy: doc.serviceboyName,
          serviceboyEmail: doc.serviceboyEmail,
          serviceDate: serviceDateDisplay,
          serviceTime: serviceTimeDisplay,
          completedAt: rawCompletedAt
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
        [Query.equal('status', 'completed')]
      );
      counts['All Service Engineers'] = allResponse.total;
      await Promise.all(boys.map(async (name) => {
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID,
          [
            Query.equal('status', 'completed'),
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

  const fetchTotalCompleteCount = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.equal('status', 'completed')]
      );
      setTotalCompleteCount(response.total);
    } catch (error) {
      console.error('Error fetching total completed count :', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchServiceBoys();
      await fetchEngineerCounts();
      fetchServices();
      fetchTotalCompleteCount();
    };
    loadData();
    if (params.completedService) {
      try {
        const newService = JSON.parse(params.completedService as string);
        const formattedService = {
          id: newService.id,
          serviceType: newService.serviceType,
          clientName: newService.clientName,
          address: newService.address,
          phone: newService.phoneNumber,
          amount: newService.amount,
          status: 'completed',
          date: newService.date || 'Just now',
          serviceBoy: newService.serviceBoy,
          serviceboyEmail: newService.serviceboyEmail,
          serviceDate: newService.serviceDate || '',
          serviceTime: newService.serviceTime || '',
          completedAt: newService.completedAt
        };
        setAllServices(prev => [formattedService, ...prev]);
        setServices(prev => {
          if (
            (!selectedServiceBoy || selectedServiceBoy === newService.serviceBoy) &&
            (!dateFilter || (newService.completedAt && isSameDay(new Date(newService.completedAt), dateFilter)))
          ) {
            return [formattedService, ...prev];
          }
          return prev;
        });
      } catch (error) {
        console.error('Error parsing completed service :', error);
      }
    }
  }, [params.completedService]);

  const loadMoreServices = () => {
    if (!isLoadingMore && currentPage < totalPages) {
      fetchServices(currentPage + 1, true);
    }
  };

  const formatToAmPm = (isoString: string) => {
    const date = new Date(isoString);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}/${month}/${year} • ${hours}:${minutesStr} ${ampm}`;
  };

  const countCompletedByServiceBoy = () => {
    return engineerCounts;
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
        if (!service.completedAt) return false;
        const completedDate = new Date(service.completedAt);
        return isSameDay(completedDate, date);
      });
    }
    setServices(filtered);
    setCurrentPage(1);
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

  const handleCreateBill = (service: Service) => {
    router.push({
      pathname: '/bill',
      params: {
        serviceData: JSON.stringify({
          serviceType: service.serviceType,
          clientName: service.clientName,
          address: service.address,
          phone: service.phone,
          serviceCharge: service.amount,
          serviceDate: service.serviceDate,
          serviceTime: service.serviceTime,
          serviceBoy: service.serviceBoy
        })
      }
    });
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
              await fetchEngineerCounts();
              const serviceToMove = allServices.find(service => service.id === id);
              if (serviceToMove) {
                setAllServices(prev => prev.filter(service => service.id !== id));
                setServices(prev => prev.filter(service => service.id !== id));
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
              console.error('Error moving service :', error);
              Alert.alert('Error', 'Failed to move service to pending');
            }
          }
        }
      ]
    );
  };

  const onRefresh = () => {
    fetchServices(1);
    fetchEngineerCounts();
    fetchTotalCompleteCount();
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

        <View style={[styles.statusBadge, styles.completedBadge]}>
          <Text style={styles.statusText}>Completed</Text>
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
          <MaterialIcons name="check-circle" size={18} color="#718096" />
          <Text style={styles.dateText}>
            {item.completedAt
              ? `${formatToAmPm(item.completedAt)}`
              : 'Completion time not available'}
          </Text>
        </View>
        <Text style={styles.serviceBoyText}>
          {item.serviceBoy}
        </Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.createBillButton}
          onPress={() => handleCreateBill(item)}
        >
          <MaterialIcons name="receipt-long" size={20} color="#FFF" />
          <Text style={styles.createBillButtonText}>Create Bill</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.moveToPendingButton}
          onPress={() => handleMoveToPending(item.id)}
        >
          <MaterialIcons name="pending-actions" size={20} color="#FFF" />
          <Text style={styles.moveToPendingButtonText}>Back to Pending</Text>
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
          <Text style={styles.headerTitle}>Completed Services</Text>
        </View>

        <View style={styles.headerCount}>
          <Text style={styles.headerCountText}>{totalCompleteCount}</Text>
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
                <Feather name="x" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}
          
          {dateFilter && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>{format(dateFilter, 'dd MMM yyyy')}</Text>
              <TouchableOpacity onPress={clearDateFilter}>
                <Feather name="x" size={16} color="#FFF" />
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
                    <View style={[styles.statusBadge, styles.completedBadge]}>
                      <Text style={styles.statusText}>
                        {countCompletedByServiceBoy()[item.name] || 0} completed
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              refreshControl={
                <RefreshControl
                  refreshing={loading}
                  onRefresh={fetchEngineerCounts}
                />
              }
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
          <MaterialIcons name="check-circle" size={50} color="#A0AEC0" />
          <Text style={styles.emptyText}>
            {selectedServiceBoy
              ? `No completed services for ${selectedServiceBoy}`
              : dateFilter
                ? `No services completed on ${format(dateFilter, 'MMMM d, yyyy')}`
                : 'No completed services'
            }
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default AdminCompletedServicesScreen;
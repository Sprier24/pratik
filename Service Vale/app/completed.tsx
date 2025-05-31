import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, SafeAreaView, TouchableOpacity, Alert, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
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

const CompletedServicesScreen = () => {
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
  const [filterType, setFilterType] = useState<'serviceBoy' | 'date'>('serviceBoy');

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

  const fetchServices = async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('status', 'completed'),
          Query.orderDesc('completedAt')
        ]
      );
      const formattedServices = response.documents.map(doc => {
        let formattedCompletedAt = '';
        if (doc.completedAt) {
          formattedCompletedAt = formatToAmPm(doc.completedAt);
        }
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
          date: doc.completedAt ? new Date(doc.completedAt).toLocaleString() : new Date(doc.$createdAt).toLocaleString(),
          serviceBoy: doc.serviceboyName,
          serviceboyEmail: doc.serviceboyEmail,
          serviceDate: serviceDateDisplay,
          serviceTime: serviceTimeDisplay,
          completedAt: doc.completedAt
        };
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
          if ((!selectedServiceBoy || selectedServiceBoy === newService.serviceBoy) &&
            (!dateFilter || (newService.completedAt && isSameDay(new Date(newService.completedAt), dateFilter)))) {
            return [formattedService, ...prev];
          }
          return prev;
        });
      } catch (error) {
        console.error('Error parsing completed service:', error);
      }
    }
  }, [params.completedService]);

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
    const counts: Record<string, number> = { 'All': allServices.length };
    serviceBoys.forEach(boy => {
      counts[boy.name] = allServices.filter(service => service.serviceBoy === boy.name).length;
    });
    return counts;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
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
          pathname: '/bill',
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
        <Text
          style={styles.serviceBoyText}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          Assigned to: {item.serviceBoy}
        </Text>
        <Text style={styles.completedTimeText}>
          {item.completedAt
            ? ` ${formatToAmPm(item.completedAt)}`
            : item.serviceDate && item.serviceTime
              ? `${item.serviceDate} • ${item.serviceTime}`
              : item.date}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.moveToPendingButton}
        onPress={() => handleMoveToPending(item.id)}
      >
        <Text style={styles.moveToPendingButtonText}>Move to Pending</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedServiceBoy && styles.activeFilter
          ]}
          onPress={() => {
            setFilterType('serviceBoy');
            setFilterModalVisible(true);
          }}
        >
          <Text style={styles.filterButtonText}>
            {selectedServiceBoy ? `Boy: ${selectedServiceBoy}` : 'Filter by Boy'}
          </Text>
          <MaterialIcons name="filter-list" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            dateFilter && styles.activeFilter
          ]}
          onPress={() => {
            setFilterType('date');
            setShowDatePicker(true);
          }}
        >
          <Text style={styles.filterButtonText}>
            {dateFilter ? format(dateFilter, 'dd/MM/yy') : 'Filter by Date'}
          </Text>
          <MaterialIcons name="event" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {(selectedServiceBoy || dateFilter) && (
        <View style={styles.activeFiltersContainer}>
          <Text style={styles.activeFiltersText}>Active filters:</Text>
          {selectedServiceBoy && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>Boy: {selectedServiceBoy}</Text>
              <TouchableOpacity onPress={() => filterServices(null)}>
                <MaterialIcons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
          {dateFilter && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>{format(dateFilter, 'dd/MM/yy')}</Text>
              <TouchableOpacity onPress={clearDateFilter}>
                <MaterialIcons name="close" size={16} color="#fff" />
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

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Completed Services</Text>
        <View style={styles.headerCountContainer}>
          <Text style={styles.headerCountText}>
            {services.length} {selectedServiceBoy && `of ${countCompletedByServiceBoy()[selectedServiceBoy] || 0}`}
          </Text>
        </View>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Service Boy</Text>
            <View style={styles.modalScrollBox}>
              <TouchableOpacity
                style={styles.filterOption}
                onPress={() => filterServices(null)}
              >
                <View style={styles.filterOptionContainer}>
                  <Text style={styles.filterOptionText}>All Service Boys</Text>
                  <Text style={styles.countBadge}>{countCompletedByServiceBoy()['All']}</Text>
                </View>
              </TouchableOpacity>
              <FlatList
                data={serviceBoys}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.filterOption}
                    onPress={() => filterServices(item.name)}
                  >
                    <View style={styles.filterOptionContainer}>
                      <Text style={styles.filterOptionText}>{item.name}</Text>
                      <Text style={styles.countBadge}>
                        {countCompletedByServiceBoy()[item.name] || 0}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                showsVerticalScrollIndicator={true}
              />
            </View>
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
        />
      ) : (
        <View style={styles.emptyState}>
          <MaterialIcons name="check-circle" size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>
            {selectedServiceBoy
              ? `No completed services for ${selectedServiceBoy}`
              : dateFilter
                ? `No services completed on ${format(dateFilter, 'MMMM d, yyyy')}`
                : 'No completed services'
            }
          </Text>
          <Text style={styles.emptySubtext}>All services are pending</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default CompletedServicesScreen;
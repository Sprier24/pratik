import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons, MaterialIcons, Feather } from '@expo/vector-icons';
import { databases, account } from '../../lib/appwrite';
import { Query } from 'appwrite';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, isSameDay } from 'date-fns';
import { styles } from '../../constants/userapp/CompletedServicesScreenuser.styles';

const DATABASE_ID = 'servicevale-database';
const COLLECTION_ID = 'orders-id';

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
  formattedCompletedAt?: string;
};

const CompletedServicesScreenUser = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const params = useLocalSearchParams();
  const router = useRouter();
  const [limit] = useState(25);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const fetchServices = async (loadMore = false) => {
    try {
      const currentUser = await account.get();
      const email = currentUser.email;
      setUserEmail(email);

      const currentOffset = loadMore ? offset : 0;

      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('status', 'completed'),
          Query.equal('serviceboyEmail', email),
          Query.orderDesc('completedAt'),
          Query.limit(limit),
          Query.offset(currentOffset)
        ]
      );

      if (!loadMore) {
        const countResponse = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID,
          [
            Query.equal('status', 'completed'),
            Query.equal('serviceboyEmail', email),
            Query.select(['$id'])
          ]
        );
        setTotalCount(countResponse.total);
      }

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
      if (loadMore) {
        setServices(prev => [...prev, ...formattedServices]);
        setAllServices(prev => [...prev, ...formattedServices]);
        setOffset(currentOffset + limit);
        setHasMore(response.documents.length === limit);
      } else {
        setServices(formattedServices);
        setAllServices(formattedServices);
        setOffset(limit);
        setHasMore(response.documents.length === limit);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      Alert.alert('Error', 'Failed to load services');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchServices();
  };

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
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
            serviceboyEmail: newService.serviceboyEmail || '',
            completedAt: newService.completedAt
          };
          setAllServices(prev => [formattedService, ...prev]);
          setServices(prev => {
            if (!dateFilter || (newService.completedAt && isSameDay(new Date(newService.completedAt), dateFilter))) {
              return [formattedService, ...prev];
            }
            return prev;
          });
          setTotalCount(prev => prev + 1);
        }
      } catch (error) {
        console.error('Error parsing completed service:', error);
      }
    }
  }, [params.completedService, userEmail]);

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

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'dismissed') {
      return;
    }
    if (selectedDate) {
      setDateFilter(selectedDate);
      filterByDate(selectedDate);
    }
  };

  const filterByDate = (date: Date) => {
    const filtered = allServices.filter(service => {
      if (!service.completedAt) return false;
      const completedDate = new Date(service.completedAt);
      return isSameDay(completedDate, date);
    });
    setServices(filtered);
  };

  const clearDateFilter = () => {
    setDateFilter(null);
    setServices(allServices);
  };

  const handleCreateBill = (service: Service) => {
    router.push({
      pathname: '/userapp/userbill',
      params: {
        serviceData: JSON.stringify({
          clientName: service.clientName,
          address: service.address,
          phone: service.phone,
          serviceType: service.serviceType,
          amount: service.amount,
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
              setAllServices(prev => prev.filter(service => service.id !== id));
              setServices(prev => prev.filter(service => service.id !== id));
              setTotalCount(prev => prev - 1);
              const movedService = allServices.find(service => service.id === id);
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
    <View style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <View style={styles.serviceTypeContainer}>
          <MaterialCommunityIcons
            name="tools"
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
          <MaterialIcons name="person" size={18} color="#718096" />
          <Text style={styles.detailText}>{item.clientName}</Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialIcons name="location-on" size={18} color="#718096" />
          <Text style={styles.detailText}>
            {item.address}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialIcons name="phone" size={18} color="#718096" />
          <Text style={styles.detailText}>{item.phone}</Text>
        </View>

        <View style={styles.detailRow}>
          <MaterialCommunityIcons name="currency-inr" size={18} color="#718096" />
          <Text style={styles.detailText}>
            {isNaN(Number(item.amount)) ? '0' : Number(item.amount).toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      <View style={styles.serviceFooter}>
        <View style={styles.dateContainer}>
          <MaterialIcons name="check-circle" size={16} color="#718096" />
          <Text style={styles.dateText}>
            {item.completedAt
              ? `${formatToAmPm(item.completedAt)}`
              : 'Completion time not available'}
          </Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.createBillButton}
          onPress={() => handleCreateBill(item)}
        >
          <MaterialCommunityIcons name="file-document" size={20} color="#FFF" />
          <Text style={styles.createBillButtonText}>Create Bill</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.moveToPendingButton}
          onPress={() => handleMoveToPending(item.id)}
        >
          <MaterialIcons name="pending-actions" size={20} color="#FFF" />
          <Text style={styles.moveToPendingButtonText}>Move to Pending</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const loadMoreServices = () => {
    if (!loading && hasMore) {
      fetchServices(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Completed Services</Text>
        </View>

        <View style={styles.headerCount}>
          <Text style={styles.headerCountText}>{totalCount}</Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Feather name="calendar" size={18} color="#5E72E4" />
          <Text style={styles.filterButtonText}>
            {dateFilter ? format(dateFilter, 'dd MMM yyyy') : 'Filter by date'}
          </Text>
        </TouchableOpacity>

        {dateFilter && (
          <TouchableOpacity
            style={styles.clearFilterButton}
            onPress={clearDateFilter}
          >
            <Feather name="x" size={16} color="#5E72E4" />
            <Text style={styles.clearFilterText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={dateFilter || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5E72E4" />
        </View>
      ) : services.length > 0 ? (
        <FlatList
          data={services}
          renderItem={renderServiceItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMoreServices}
          onEndReachedThreshold={0.5}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListFooterComponent={
            hasMore && !refreshing ? (
              <View style={styles.loadingMoreContainer}>
                <ActivityIndicator size="small" color="#5E72E4" />
              </View>
            ) : null
          }
        />
      ) : (
        <View style={styles.emptyState}>
          <MaterialIcons name="check-circle" size={48} color="#A0AEC0" />
          <Text style={styles.emptyText}>
            {dateFilter
              ? `No services completed on ${format(dateFilter, 'MMMM d, yyyy')}`
              : 'No completed services'
            }
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default CompletedServicesScreenUser;
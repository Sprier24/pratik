import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, SafeAreaView, TouchableOpacity, Alert, Modal, ActivityIndicator, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons, MaterialIcons, Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, isSameDay } from 'date-fns';
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { styles } from '../../constants/PendingServicesScreen.styles';
import Constants from 'expo-constants';

const BASE_URL = `${Constants.expoConfig?.extra?.apiUrl}/order`;
const ENGINEER_URL = `${Constants.expoConfig?.extra?.apiUrl}/engineer`;

type Service = {
  id: string;
  serviceType: string;  
  clientName: string;
  address: string;
  phone: string;
  amount: string;
  status: string;
  createdAt: string;
  serviceboyName: string;
  serviceDate: string;
  serviceTime: string;
  serviceBoyEmail: string;
  serviceBoyContactNumber: string;

  services?: { name: string; charge: string }[];
  totalAmount?: string;
};

type Engineer = {
  id: string;
  name: string;
  email: string;
  engineerName?: string;
};

const PendingServicesScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentEngineer, setCurrentEngineer] = useState<Engineer | null>(null);
  const [dateFilter, setDateFilter] = useState<Date | null>(
    params.date ? new Date(String(params.date)) : null
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [totalPendingCount, setTotalPendingCount] = useState(0);

  const getCurrentEngineer = async (): Promise<Engineer | null> => {
    try {
      console.log('Getting current engineer data...');
      
      const storageKeys = ['currentEngineer', 'userData', 'engineerData', 'user'];
      
      for (const key of storageKeys) {
        try {
          const engineerData = await AsyncStorage.getItem(key);
          if (engineerData) {
            console.log(`Found engineer data in ${key}:`, engineerData);
            const parsedData = JSON.parse(engineerData);
            
            if (parsedData.engineerName || parsedData.name) {
              return {
                id: parsedData.id || parsedData._id || 'unknown',
                name: parsedData.engineerName || parsedData.name,
                email: parsedData.email || '',
                engineerName: parsedData.engineerName || parsedData.name
              };
            }
            
            if (Array.isArray(parsedData) && parsedData.length > 0) {
              const firstItem = parsedData[0];
              return {
                id: firstItem.id || firstItem._id || 'unknown',
                name: firstItem.engineerName || firstItem.name,
                email: firstItem.email || '',
                engineerName: firstItem.engineerName || firstItem.name
              };
            }
          }
        } catch (error) {
          console.log(`No data found in ${key}`);
        }
      }

      if (params.engineerId || params.engineerName) {
        console.log('Found engineer data in params:', params);
        return {
          id: String(params.engineerId || 'unknown'),
          name: String(params.engineerName || 'Unknown Engineer'),
          email: String(params.engineerEmail || ''),
          engineerName: String(params.engineerName || 'Unknown Engineer')
        };
      }

      try {
        console.log('Trying to fetch current engineer from API...');
        const response = await fetch(`${ENGINEER_URL}/me`);
        if (response.ok) {
          const data = await response.json();
          console.log('API response for current engineer:', data);
          
          if (data.engineerName || data.name) {
            const engineer = {
              id: data.id || data._id || 'unknown',
              name: data.engineerName || data.name,
              email: data.email || '',
              engineerName: data.engineerName || data.name
            };
            
            await AsyncStorage.setItem('currentEngineer', JSON.stringify(engineer));
            return engineer;
          }
        }
      } catch (apiError) {
        console.log('API call for current engineer failed:', apiError);
      }

      console.log('No engineer data found anywhere');
      return null;
      
    } catch (error) {
      console.error('Error getting current engineer:', error);
      return null;
    }
  };

  const groupServices = (servicesList: Service[]): Service[] => {
    const grouped: Record<string, Service> = {};
    
    servicesList.forEach(service => {
      const key = `${service.clientName}-${service.phone}-${service.serviceDate}-${service.serviceboyName}-${service.serviceTime}`;
      
      if (!grouped[key]) {
        
        grouped[key] = {
          ...service,
          id: key, 
          services: [{ name: service.serviceType, charge: service.amount }],
          totalAmount: service.amount
        };
      } else {
        
        grouped[key].services!.push({ 
          name: service.serviceType, 
          charge: service.amount 
        });
        
        const total = grouped[key].services!.reduce((sum, s) => 
          sum + (parseFloat(s.charge) || 0), 0
        );
        grouped[key].totalAmount = total.toString();
        
        grouped[key].serviceType = grouped[key].services!.map(s => s.name).join(', ');
      }
    });
    
    return Object.values(grouped);
  };

  const updateUrlParams = (date: Date | null) => {
    const newParams: Record<string, string> = {};

    if (date) {
      newParams.date = date.toISOString();
    }

    router.setParams(newParams);
  };

  const fetchAllServices = async () => {
    try {
      setLoading(true);

      const engineer = await getCurrentEngineer();
      console.log('Current engineer:', engineer);
      setCurrentEngineer(engineer);

      if (!engineer) {
        Alert.alert(
          'Login Required', 
          'Please login as an engineer to view services',
          [
            { 
              text: 'OK', 
              onPress: () => router.push('/login') 
            }
          ]
        );
        setLoading(false);
        return;
      }

      const countParams = `?status=pending&engineerId=${encodeURIComponent(engineer.name)}`;
      console.log('Fetching count with params:', countParams);
      
      const countResponse = await fetch(`${BASE_URL}/count${countParams}`);
      const countData = await countResponse.json();
      const totalCount = countData.count || 0;
      console.log('Total count:', totalCount);

      const servicesParams = `?status=pending&engineerId=${encodeURIComponent(engineer.name)}&limit=${totalCount}`;
      console.log('Fetching services with params:', servicesParams);
      
      const response = await fetch(`${BASE_URL}/status${servicesParams}`);
      const data = await response.json();
      console.log('Services API response:', data);

      if (!data.result || !Array.isArray(data.result)) {
        console.error('Unexpected API response format:', data);
        
        const servicesArray = data.result || data.services || data.data || [];
        if (Array.isArray(servicesArray)) {
          console.log('Using alternative data structure');
          data.result = servicesArray;
        } else {
          Alert.alert('Error', 'Failed to load services - invalid data format');
          return;
        }
      }

      const formattedServices = data.result.map((service: any) => {
        let displayDate = '';
        if (service.serviceDate) {
          const [year, month, day] = service.serviceDate.split('-');
          displayDate = `${day}/${month}/${year}`;
        }

        let displayTime = '';
        if (service.serviceTime) {
          const [hours, minutes] = service.serviceTime.split(':');
          const hourNum = parseInt(hours);
          const ampm = hourNum >= 12 ? 'PM' : 'AM';
          const displayHour = hourNum % 12 || 12;
          displayTime = `${displayHour}:${minutes} ${ampm}`;
        }

        return {
          id: service.id || service._id,
          serviceType: service.serviceType,
          clientName: service.clientName,
          address: service.address,
          phone: service.phoneNumber || service.phone,
          amount: service.billAmount?.toString() || service.amount?.toString() || '0',
          status: service.status,
          createdAt: service.createdAt,
          serviceboyName: service.serviceboyName || service.engineerName,
          serviceBoyEmail: service.serviceboyEmail || service.engineerEmail,
          serviceBoyContactNumber: service.serviceboyContactNumber || service.engineerContactNumber,
          serviceDate: displayDate,
          serviceTime: displayTime
        };
      });

      console.log('Formatted services:', formattedServices);

      const groupedServices = groupServices(formattedServices);
      setAllServices(groupedServices);
      applyFilters(dateFilter, groupedServices);
      
      setTotalPendingCount(groupedServices.length);
    } catch (error) {
      console.error('Error fetching services:', error);
      Alert.alert('Error', 'Failed to load services. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleNewService = async (newServiceData: string) => {
    try {
      const newService = JSON.parse(newServiceData);
      const formattedService = {
        id: newService.id,
        serviceType: newService.serviceType,
        clientName: newService.clientName,
        address: newService.address,
        phone: newService.phoneNumber,
        amount: newService.billAmount.toString(),
        status: 'pending',
        createdAt: newService.createdAt,
        serviceboyName: newService.serviceboyName,
        serviceDate: newService.serviceDate ?
          newService.serviceDate.split('-').reverse().join('/') : '',
        serviceTime: newService.serviceTime || '',
        serviceBoyEmail: newService.serviceboyEmail || '',
        serviceBoyContactNumber: newService.serviceboyContactNumber || ''
      };

      const engineer = await getCurrentEngineer();
      if (engineer && formattedService.serviceboyName === engineer.name) {
        setAllServices(prev => {
          const updated = [formattedService, ...prev];
          const grouped = groupServices(updated);
          return grouped;
        });
        
        setServices(prev => {
          const updated = [formattedService, ...prev];
          const grouped = groupServices(updated);
          if (!dateFilter || (newService.serviceDate && isSameDay(new Date(newService.serviceDate.split('-').join('/')), dateFilter))) {
            return grouped;
          }
          return prev;
        });
        
        setTotalPendingCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error parsing new service:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchAllServices();
    };

    loadData();
  }, []);

  useEffect(() => {
    if (params.newService) {
      handleNewService(String(params.newService));
    }
  }, [params.newService]);

  const handleCreateBill = (service: Service) => {
    router.push({
      pathname: '/userapp/userbill',
      params: {
        serviceData: JSON.stringify({
          serviceType: service.serviceType,
          serviceBoy: service.serviceboyName,
          clientName: service.clientName,
          address: service.address,
          phone: service.phone,
          serviceCharge: service.totalAmount || service.amount,
          serviceDate: service.serviceDate,
          serviceTime: service.serviceTime,
          services: service.services || [{ name: service.serviceType, charge: service.amount }]
        })
      }
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'dismissed') {
      return;
    }
    if (selectedDate) {
      setDateFilter(selectedDate);
      updateUrlParams(selectedDate);
      applyFilters(selectedDate);
    }
  };

  const applyFilters = (date: Date | null, servicesToFilter = allServices) => {
    let filtered = servicesToFilter;
    
    if (date) {
      filtered = filtered.filter(service => {
        if (!service.serviceDate) return false;
        const [day, month, year] = service.serviceDate.split('/');
        const serviceDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return isSameDay(serviceDate, date);
      });
    }
    setServices(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllServices();
  };

  const clearDateFilter = () => {
    setDateFilter(null);
    updateUrlParams(null);
    applyFilters(null);
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
          <Text style={styles.serviceType}>
            {item.services && item.services.length > 1 
              ? `${item.services.length} Services` 
              : item.serviceType
            }
          </Text>
        </View>

        <View style={styles.serviceActions}>
          <View style={[styles.statusBadge, styles.pendingBadge]}>
            <Text style={styles.statusText}>Pending</Text>
          </View>
        </View>
      </View>

      {item.services && item.services.length > 0 && (
        <View style={styles.servicesListContainer}>
          {item.services.map((service, index) => (
            <View key={index} style={styles.serviceItem}>
              <View style={styles.serviceNameContainer}>
                <MaterialCommunityIcons 
                  name="circle-small" 
                  size={24} 
                  color="#5E72E4" 
                />
                <Text style={styles.serviceNameText}>
                  {service.name}
                </Text>
              </View>
              <View style={styles.serviceChargeContainer}>
                <MaterialCommunityIcons name="currency-inr" size={16} color="#718096" />
                <Text style={styles.serviceChargeText}>
                  {service.charge}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

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
          <Text style={[styles.detailText, { fontWeight: 'bold', color: '#2D3748' }]}>
            Total: ₹{item.totalAmount || item.amount}
          </Text>
        </View>
      </View>

      <View style={styles.serviceFooter}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MaterialIcons name="access-time" size={18} color="#718096" style={{ marginRight: 4 }} />
            <Text style={styles.dateText}>
              {item.serviceDate ? item.serviceDate : 'N/A'} • {item.serviceTime ? item.serviceTime : 'N/A'}
            </Text>
          </View>

          <Text style={[styles.serviceBoyText, { fontWeight: '600', color: '#2D3748' }]}>
            {item.serviceboyName ? item.serviceboyName : 'No Engineer'}
          </Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.billbutton}
          onPress={() => handleCreateBill(item)}
        >
          <MaterialIcons name="receipt-long" size={20} color="#FFF" />
          <Text style={styles.whatsappButtonText}>Bill</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.push('/userapp/home')}>
            <Feather name="arrow-left" size={25} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {'Jobs Services'}
          </Text>
        </View>

        <View style={styles.headerCount}>
          <Text style={styles.headerCountText}>{totalPendingCount}</Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
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

      {dateFilter && (
        <View style={styles.activeFiltersContainer}>
          <View style={styles.filterChip}>
            <Text style={styles.filterChipText}>{format(dateFilter, 'dd MMM yyyy')}</Text>
            <TouchableOpacity onPress={clearDateFilter}>
              <Feather name="x" size={15} color="#FFF" />
            </TouchableOpacity>
          </View>
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

      {loading ? (
        <View style={styles.loadingMoreContainer}>
          <ActivityIndicator size="large" color="#5E72E4" />
          <Text style={styles.loadingMoreText}>Loading services...</Text>
        </View>
      ) : services.length > 0 ? (
        <FlatList
          data={services}
          renderItem={renderServiceItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        />
      ) : (
        <View style={styles.emptyState}>
          <MaterialIcons name="pending-actions" size={50} color="#A0AEC0" />
          <Text style={styles.emptyText}>
            {dateFilter
              ? `No pending services on ${format(dateFilter, 'MMMM d, yyyy')}`
              : currentEngineer
                ? `No pending services`
                : 'Please login as an engineer to view services'
            }
          </Text>
          
        </View>
      )}
    </SafeAreaView>
  );
};

export default PendingServicesScreen;
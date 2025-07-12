import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ActivityIndicator, TouchableOpacity, Alert, SectionList, Modal, TextInput } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons, Feather, Ionicons } from '@expo/vector-icons';
import { account, databases } from '../../lib/appwrite';
import { Query } from 'react-native-appwrite';
import { styles } from '../../constants/userapp/UserEngineerDetail.styles';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, isSameDay } from 'date-fns';

const DATABASE_ID = '681c428b00159abb5e8b';
const COLLECTION_ID = 'bill_ID';
const PAYMENTS_COLLECTION_ID = 'commission_ID';

type TransactionItem = {
  id: string;
  date: string;
  amount: number;
  type: 'commission' | 'payment';
  customerName?: string;
  billNumber?: string;
  serviceType?: string;
};

type SectionData = {
  title: string;
  data: TransactionItem[];
  totalAmount?: number;
  isMonth?: boolean;
};

type TransactionsData = {
  commissions: SectionData[];
  payments: SectionData[];
};

const UserEngineerDetail = () => {
  const [transactions, setTransactions] = useState<TransactionsData>({
    commissions: [],
    payments: []
  });
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionsData>({
    commissions: [],
    payments: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'commissions' | 'payments'>('commissions');
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [userName, setUserName] = useState('');
  const [currentMonthCommission, setCurrentMonthCommission] = useState(0);
  const [currentMonthPayments, setCurrentMonthPayments] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const groupByDate = (items: TransactionItem[], groupByMonth = false): SectionData[] => {
    const grouped: { [key: string]: TransactionItem[] } = {};

    items.forEach(item => {
      const date = new Date(item.date);
      let key: string;

      if (groupByMonth) {
        // Group by month if older than 1 month
        const now = new Date();
        const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));

        if (date < oneMonthAgo) {
          key = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
        } else {
          key = date.toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          });
        }
      } else {
        key = date.toLocaleDateString('en-IN', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });
      }

      if (!grouped[key]) {
        grouped[key] = [];
      }

      grouped[key].push(item);
    });

    return Object.keys(grouped)
      .map(key => {
        const dayTransactions = grouped[key].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const totalAmount = dayTransactions.reduce((sum, item) => sum + item.amount, 0);
        const isMonth = key.split(' ').length === 2;

        return {
          title: key,
          data: dayTransactions,
          totalAmount,
          isMonth
        };
      })
      .sort((a, b) => {
        if (a.isMonth && !b.isMonth) return 1;
        if (!a.isMonth && b.isMonth) return -1;
        if (a.isMonth && b.isMonth) {
          return new Date(b.data[0].date).getTime() - new Date(a.data[0].date).getTime();
        }
        return new Date(b.data[0].date).getTime() - new Date(a.data[0].date).getTime();
      });
  };

  const fetchUserData = async () => {
    try {
      const currentUser = await account.get();
      const userResponse = await databases.listDocuments(
        DATABASE_ID,
        '681c429800281e8a99bd',
        [Query.equal('email', currentUser.email)]
      );
      if (userResponse.documents.length > 0) {
        setUserName(userResponse.documents[0].name);
      }
      return userResponse.documents[0]?.name;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return '';
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const name = await fetchUserData();
      if (!name) return;

      const today = new Date();
      const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

      // Fetch all commissions (for all-time data)
      const allCommissionsResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.equal('serviceBoyName', name)]
      );

      // Fetch current month commissions (for monthly total)
      const currentMonthCommissionsResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('serviceBoyName', name),
          Query.greaterThanEqual('date', startOfCurrentMonth)
        ]
      );

      // Calculate current month commission (will reset monthly)
      const monthCommission = currentMonthCommissionsResponse.documents.reduce((sum, doc) => {
        return sum + (parseFloat(doc.serviceCharge) * 0.25);
      }, 0);
      setCurrentMonthCommission(monthCommission);

      // Fetch all payments (for all-time data)
      const allPaymentsResponse = await databases.listDocuments(
        DATABASE_ID,
        PAYMENTS_COLLECTION_ID,
        [Query.equal('engineerName', name)]
      );

      // Fetch current month payments (for monthly total)
      const currentMonthPaymentsResponse = await databases.listDocuments(
        DATABASE_ID,
        PAYMENTS_COLLECTION_ID,
        [
          Query.equal('engineerName', name),
          Query.greaterThanEqual('date', startOfCurrentMonth)
        ]
      );

      // Calculate current month payments (will reset monthly)
      const monthPayments = currentMonthPaymentsResponse.documents.reduce((sum, doc) => {
        return sum + parseFloat(doc.amount);
      }, 0);
      setCurrentMonthPayments(monthPayments);

      const commissionItems: TransactionItem[] = allCommissionsResponse.documents.map(doc => ({
        id: doc.$id,
        date: doc.date,
        amount: parseFloat(doc.serviceCharge) * 0.25,
        type: 'commission',
        customerName: doc.customerName,
        billNumber: doc.billNumber,
        serviceType: doc.serviceType,
        status: 'pending'
      }));

      const paymentItems: TransactionItem[] = allPaymentsResponse.documents.map(doc => ({
        id: doc.$id,
        date: doc.date,
        amount: parseFloat(doc.amount),
        type: 'payment',
        status: 'completed'
      }));

      const commissionSections = groupByDate(commissionItems, true);
      const paymentSections = groupByDate(paymentItems, true);

      const newTransactions = {
        commissions: commissionSections,
        payments: paymentSections
      };

      setTransactions(newTransactions);

      // If there's an active date filter, reapply it
      if (dateFilter) {
        const startOfDay = new Date(dateFilter);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dateFilter);
        endOfDay.setHours(23, 59, 59, 999);
        filterByDateRange(startOfDay, endOfDay);
      } else {
        setFilteredTransactions(newTransactions);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load commission details');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotalCommission = (): number => {
    return transactions.commissions.reduce((sum: number, section: SectionData) =>
      sum + section.data.reduce((sectionSum: number, item: TransactionItem) =>
        sectionSum + item.amount, 0), 0);
  };

  const calculateTotalPayments = (): number => {
    return transactions.payments.reduce((sum: number, section: SectionData) =>
      sum + section.data.reduce((sectionSum: number, item: TransactionItem) =>
        sectionSum + item.amount, 0), 0);
  };

  const formatItemDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);

    if (event.type === 'dismissed') {
      return;
    }

    if (selectedDate) {
      setDateFilter(selectedDate);
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      filterByDateRange(startOfDay, endOfDay);
    }
  };

  const filterByDateRange = (startDate: Date, endDate: Date) => {
    const filteredCommissions = transactions.commissions.map(section => ({
      ...section,
      data: section.data.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= startDate && itemDate <= endDate;
      })
    })).filter(section => section.data.length > 0);

    const filteredPayments = transactions.payments.map(section => ({
      ...section,
      data: section.data.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= startDate && itemDate <= endDate;
      })
    })).filter(section => section.data.length > 0);

    setFilteredTransactions({
      commissions: filteredCommissions,
      payments: filteredPayments
    });
  };

  const clearDateFilter = () => {
    setDateFilter(null);
    setFilteredTransactions(transactions);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5E72E4" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Commissions</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={styles.calendarButton}
        >
          <Feather name="calendar" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {dateFilter && (
        <View style={styles.activeFiltersContainer}>
          <View style={styles.filterChip}>
            <Text style={styles.filterChipText}>
              {format(dateFilter, 'dd MMM yyyy')}
            </Text>
            <TouchableOpacity
              onPress={clearDateFilter}
              style={styles.filterChipClose}
            >
              <Feather name="x" size={16} color="#FFF" />
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

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, styles.commissionCard]}>
          <Text style={styles.summaryLabel}>Monthly Commission</Text>
          <Text style={styles.summaryValue}>
            ₹{currentMonthCommission.toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </Text>
        </View>
        <View style={[styles.summaryCard, styles.paymentCard]}>
          <Text style={styles.summaryLabel}>Monthly Paid</Text>
          <Text style={styles.summaryValue}>
            ₹{currentMonthPayments.toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </Text>
        </View>
        <View style={[styles.summaryCard, styles.pendingCard]}>
          <Text style={styles.summaryLabel}>Pending</Text>
          <Text style={[styles.summaryValue, styles.pendingValue]}>
            ₹{(calculateTotalCommission() - calculateTotalPayments()).toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'commissions' && styles.activeTab]}
          onPress={() => setActiveTab('commissions')}
        >
          <Text style={[styles.tabText, activeTab === 'commissions' && styles.activeTabText]}>Commissions</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'payments' && styles.activeTab]}
          onPress={() => setActiveTab('payments')}
        >
          <Text style={[styles.tabText, activeTab === 'payments' && styles.activeTabText]}>Payments</Text>
        </TouchableOpacity>
      </View>

      <SectionList
        sections={activeTab === 'commissions' ? filteredTransactions.commissions : filteredTransactions.payments}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderSectionHeader={({ section }) => (
          <View style={[
            styles.sectionHeader,
            section.isMonth && styles.monthSectionHeader
          ]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.sectionHeaderText}>
                {section.title}
                {section.isMonth && " (Monthly Summary)"}
              </Text>
              {activeTab === 'commissions' && (
                <Text style={[styles.sectionHeaderAmount]}>
                  ₹{section.totalAmount?.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </Text>
              )}
              {activeTab === 'payments' && (
                <Text style={styles.sectionHeaderAmount1}>
                  ₹{section.totalAmount?.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </Text>
              )}
            </View>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <View style={styles.itemLeft}>
              <View style={styles.itemIconContainer}>
                <MaterialIcons
                  name={item.type === 'commission' ? 'engineering' : 'payment'}
                  size={20}
                  color={item.type === 'commission' ? '#5E72E4' : '#38A169'}
                />
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemTitle}>
                  {item.type === 'commission' ?
                    `${item.billNumber}` :
                    'Payment Received'}
                </Text>
                {item.type === 'commission' && item.customerName && (
                  <Text style={styles.itemSubtitle}>
                    {item.serviceType}
                  </Text>
                )}
                <View style={styles.itemBottomRow}>
                  <Text style={styles.itemDate}>
                    {formatItemDate(item.date)}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.amountContainer}>
              <Text style={[
                styles.itemAmount,
                item.type === 'payment' ? styles.paymentAmount : styles.commissionAmount
              ]}>
                ₹{item.amount.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeTab === 'commissions' ? 'No commissions found' : 'No payments found'}
              {dateFilter && ` on ${format(dateFilter, 'dd MMM yyyy')}`}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default UserEngineerDetail;
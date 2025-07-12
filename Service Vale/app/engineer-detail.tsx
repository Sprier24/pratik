import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ActivityIndicator, TouchableOpacity, Alert, SectionList, Modal, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons, Feather, Ionicons } from '@expo/vector-icons';
import { databases } from '../lib/appwrite';
import { Query, ID } from 'react-native-appwrite';
import { styles } from '../constants/EngineerDetail.styles';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, isSameDay, startOfMonth } from 'date-fns';

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
  selected?: boolean;
  status?: 'completed' | 'pending';
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

const EngineerDetailScreen = () => {
  const { engineerId, engineerName } = useLocalSearchParams();
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
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentMonthCommission, setCurrentMonthCommission] = useState(0); // New state for current month commission
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
        // For both commissions and payments, group by month if older than 1 month
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
        // For commissions without month grouping
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
        const isMonth = key.split(' ').length === 2; // If it's just month and year

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

  const fetchData = async () => {
    try {
      const today = new Date();
      const startOfCurrentMonth = startOfMonth(today).toISOString();

      // Fetch all commissions for this engineer (for all-time data)
      const allCommissionsResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.equal('serviceBoyName', engineerName)]
      );

      // Fetch current month commissions for this engineer
      const currentMonthCommissionsResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('serviceBoyName', engineerName),
          Query.greaterThanEqual('date', startOfCurrentMonth)
        ]
      );

      // Calculate current month commission
      const monthCommission = currentMonthCommissionsResponse.documents.reduce((sum, doc) => {
        return sum + (parseFloat(doc.serviceCharge) * 0.25);
      }, 0);
      setCurrentMonthCommission(monthCommission);

      const commissionItems: TransactionItem[] = allCommissionsResponse.documents.map(doc => ({
        id: doc.$id,
        date: doc.date,
        amount: parseFloat(doc.serviceCharge) * 0.25,
        type: 'commission',
        customerName: doc.customerName,
        billNumber: doc.billNumber,
        serviceType: doc.serviceType,
        selected: false
      }));

      // Fetch all payments for this engineer
      const paymentsResponse = await databases.listDocuments(
        DATABASE_ID,
        PAYMENTS_COLLECTION_ID,
        [Query.equal('engineerId', engineerId)]
      );

      // Fetch current month payments for this engineer
      const currentMonthPaymentsResponse = await databases.listDocuments(
        DATABASE_ID,
        PAYMENTS_COLLECTION_ID,
        [
          Query.equal('engineerId', engineerId),
          Query.greaterThanEqual('date', startOfCurrentMonth)
        ]
      );

      // Calculate current month payments
      const monthPayments = currentMonthPaymentsResponse.documents.reduce((sum, doc) => {
        return sum + parseFloat(doc.amount);
      }, 0);
      setCurrentMonthPayments(monthPayments);

      const paymentItems: TransactionItem[] = paymentsResponse.documents.map(doc => ({
        id: doc.$id,
        date: doc.date,
        amount: parseFloat(doc.amount),
        type: 'payment',
        selected: false
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
      Alert.alert('Error', 'Failed to load engineer details');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!paymentAmount) {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      await databases.createDocument(
        DATABASE_ID,
        PAYMENTS_COLLECTION_ID,
        ID.unique(),
        {
          engineerId: engineerId,
          engineerName: engineerName,
          amount: amount.toString(),
          date: new Date().toISOString()
        }
      );

      await fetchData();
      setPaymentAmount('');
      setShowPaymentModal(false);
      Alert.alert('Success', `Payment of ₹${amount.toLocaleString('en-IN')} recorded`);
    } catch (error) {
      console.error('Error recording payment:', error);
      Alert.alert('Error', 'Failed to record payment');
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);

    if (event.type === 'dismissed') {
      // User canceled the picker, don't change anything
      return;
    }

    if (selectedDate) {
      // Set the filter date and apply the filter immediately
      setDateFilter(selectedDate);

      // Create date range for the selected day (from start to end of day)
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Apply filter immediately
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
          <Text style={styles.headerTitle}>{engineerName}</Text>
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

      {calculateTotalCommission() - calculateTotalPayments() > 0 && (
        <TouchableOpacity
          style={styles.payButton}
          onPress={() => setShowPaymentModal(true)}
        >
          <Feather name="plus" size={20} color="#FFF" />
          <Text style={styles.payButtonText}>Make Payment</Text>
        </TouchableOpacity>
      )}

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
        renderItem={({ item, section }) => (
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
                    'Payment to Engineer'}
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

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Make Payment</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Feather name="x" size={24} color="#718096" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.modalSubtitle}>To: {engineerName}</Text>

              <View style={styles.paymentSummary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Pending Amount:</Text>
                  <Text style={[styles.summaryValue, styles.pendingValue]}>
                    ₹{(calculateTotalCommission() - calculateTotalPayments()).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              <TextInput
                style={styles.paymentInput}
                placeholder="Enter amount"
                placeholderTextColor="#A0AEC0"
                keyboardType="numeric"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
              />

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handlePayment}
              >
                <Text style={styles.submitButtonText}>Confirm Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default EngineerDetailScreen;
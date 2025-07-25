import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { AntDesign, MaterialIcons, Feather } from '@expo/vector-icons';
import { account, databases } from '../../lib/appwrite';
import { RefreshControl } from 'react-native';
import { Query } from 'react-native-appwrite';
import { styles } from '../../constants/userapp/HomeScreenuser.styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DATABASE_ID = '681c428b00159abb5e8b';
const COLLECTION_ID = 'bill_ID';
const ORDERS_COLLECTION_ID = '681d92600018a87c1478';
const NOTIFICATIONS_COLLECTION_ID = 'note_id';
const PAYMENTS_COLLECTION_ID = 'commission_ID';
const { width } = Dimensions.get('window');

const HomeScreenuser = () => {
  const [dailyRevenue, setDailyRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCommission, setTotalCommission] = useState(0);
  const [pendingCommission, setPendingCommission] = useState(0);
  const [userName, setUserName] = useState('');
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    try {
      await account.deleteSession('current');
      Alert.alert('Logged Out', 'You have been successfully logged out');
      router.replace('/');
    } catch (error) {
      console.error('Logout Error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
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

  const fetchRevenueData = async () => {
    try {
      const name = await fetchUserData();
      if (!name) return;

      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

      const dailyBills = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.greaterThanEqual('date', startOfDay),
          Query.equal('serviceBoyName', name),
          Query.orderDesc('date')
        ]
      );

      const monthlyBills = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.greaterThanEqual('date', startOfMonth),
          Query.equal('serviceBoyName', name),
          Query.orderDesc('date')
        ]
      );

      const dailyTotal = dailyBills.documents.reduce((sum, bill) => sum + parseFloat(bill.total || 0), 0);
      const monthlyTotal = monthlyBills.documents.reduce((sum, bill) => sum + parseFloat(bill.total || 0), 0);

      setDailyRevenue(dailyTotal);
      setMonthlyRevenue(monthlyTotal);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    }
  };

  const fetchCommissionData = async () => {
    try {
      const name = await fetchUserData();
      if (!name) return;

      const today = new Date();
      const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

      const currentMonthBills = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('serviceBoyName', name),
          Query.greaterThanEqual('date', startOfCurrentMonth)
        ]
      );

      const allBills = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.equal('serviceBoyName', name)]
      );

      const payments = await databases.listDocuments(
        DATABASE_ID,
        PAYMENTS_COLLECTION_ID,
        [Query.equal('engineerName', name)]
      );

      const total = currentMonthBills.documents.reduce((sum, bill) => {
        return sum + (parseFloat(bill.serviceCharge || '0') * 0.25);
      }, 0);

      const totalCommissionsAllTime = allBills.documents.reduce((sum, bill) => {
        return sum + (parseFloat(bill.serviceCharge || '0') * 0.25);
      }, 0);

      const totalPayments = payments.documents.reduce((sum, payment) => {
        return sum + parseFloat(payment.amount || '0');
      }, 0);

      const pending = totalCommissionsAllTime - totalPayments;

      setTotalCommission(total);
      setPendingCommission(pending);
    } catch (error) {
      console.error('Error fetching commission data:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      setRefreshing(true);
      const currentUser = await account.get();
      const email = currentUser.email;

      const orders = await databases.listDocuments(
        DATABASE_ID,
        ORDERS_COLLECTION_ID,
        [
          Query.equal('status', 'pending'),
          Query.equal('serviceboyEmail', email)
        ]
      );

      setPendingCount(orders.total);

      const completedOrders = await databases.listDocuments(
        DATABASE_ID,
        ORDERS_COLLECTION_ID,
        [
          Query.notEqual('status', 'pending'),
          Query.equal('serviceboyEmail', email)
        ]
      );

      setCompletedCount(completedOrders.total);
    } catch (error) {
      console.error('Appwrite error:', error);
    } finally {
      setRefreshing(false);
      setIsLoading(false);
    }
  };

  const fetchUnreadNotifications = async () => {
    try {
      const res = await databases.listDocuments(
        DATABASE_ID,
        NOTIFICATIONS_COLLECTION_ID,
        [Query.equal('isRead', false)]
      );
      setUnreadCount(res.total);
    } catch (error) {
      console.error('Notification fetch error:', error);
    }
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchRevenueData(),
      fetchOrders(),
      fetchUnreadNotifications(),
      fetchCommissionData()
    ]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData().finally(() => setRefreshing(false));
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
        <Text style={styles.headerTitle}>Service Vale</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.notificationIcon}
            onPress={() => router.push('/userapp/usernotification')}
          >
            <MaterialIcons name="notifications" size={24} color="#FFF" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutIcon}
            onPress={handleLogout}
          >
            <Feather name="log-out" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { paddingBottom: 150 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#5E72E4']}
            tintColor={'#5E72E4'}
          />
        }
      >
        <View style={styles.revenueRow}>
          <View style={[styles.revenueCard, styles.dailyCard]}>
            <View style={styles.cardIconContainer}>
              <MaterialIcons name="today" size={24} color="#FFF" />
            </View>
            <Text style={styles.cardTitle}>Today's Revenue</Text>
            <Text style={styles.cardAmount}>
              ₹{dailyRevenue.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </Text>
          </View>

          <View style={[styles.revenueCard, styles.monthlyCard]}>
            <View style={styles.cardIconContainer}>
              <MaterialIcons name="date-range" size={24} color="#FFF" />
            </View>
            <Text style={styles.cardTitle}>Monthly Revenue</Text>
            <Text style={styles.cardAmount}>
              ₹{monthlyRevenue.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.commissionCard}
          onPress={() => router.push('/userapp/userengineer-detail')}
        >
          <View style={styles.commissionCardHeader}>
            <View style={styles.cardIconContainer}>
              <MaterialIcons name="engineering" size={24} color="#FFF" />
            </View>
            <Text style={styles.commissionCardTitle}>Commission Details</Text>
          </View>

          <View style={styles.commissionStatsContainer}>
            <View style={styles.commissionStat}>
              <Text style={styles.commissionStatLabel}>Total</Text>
              <Text style={styles.commissionStatValue}>
                ₹{totalCommission.toLocaleString('en-IN')}
              </Text>
            </View>

            <View style={styles.commissionStat}>
              <Text style={styles.commissionStatLabel}>Pending</Text>
              <Text style={[styles.commissionStatValue, styles.commissionStatPending]}>
                ₹{pendingCommission.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          <View style={styles.commissionCardFooter}>
            <Text style={styles.commissionCardFooterText}>View all commissions</Text>
            <Feather name="chevron-right" size={18} color="#FFF" />
          </View>
        </TouchableOpacity>

        <View style={styles.servicesRow}>
          <View style={[styles.serviceCard, styles.pendingCard]}>
            <View style={styles.serviceCardHeader}>
              <View style={[styles.serviceIconContainer, { backgroundColor: '#FEEBC8' }]}>
                <MaterialIcons name="pending-actions" size={24} color="#DD6B20" />
              </View>
              <Text style={styles.serviceCardTitle}>Pending Services</Text>
            </View>

            <Text style={styles.serviceCardCount}>{pendingCount}</Text>
            <TouchableOpacity
              style={styles.serviceCardButton}
              onPress={() => router.push('/userapp/userpending')}
            >
              <Text style={styles.serviceCardButtonText}>View All</Text>
              <AntDesign name="right" size={16} color="#5E72E4" />
            </TouchableOpacity>
          </View>

          <View style={[styles.serviceCard, styles.completedCard]}>
            <View style={styles.serviceCardHeader}>
              <View style={[styles.serviceIconContainer, { backgroundColor: '#C6F6D5' }]}>
                <MaterialIcons name="check-circle" size={24} color="#38A169" />
              </View>
              <Text style={styles.serviceCardTitle}>Completed Services</Text>
            </View>

            <Text style={styles.serviceCardCount}>{completedCount}</Text>
            <TouchableOpacity
              style={styles.serviceCardButton}
              onPress={() => router.push('/userapp/usercompleted')}
            >
              <Text style={styles.serviceCardButtonText}>View All</Text>
              <AntDesign name="right" size={16} color="#5E72E4" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom || 20, marginTop: 40 }]}>
        <TouchableOpacity
          style={styles.bottomButton}
          onPress={() => router.push('/userapp/userprofile')}
        >
          <View style={styles.bottomButtonIcon}>
            <Feather name="user" size={20} color="#5E72E4" />
          </View>
          <Text style={styles.bottomButtonText}>Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bottomButton, styles.bottomButtonActive]}
        >
          <View style={[styles.bottomButtonIcon, styles.bottomButtonIconActive]}>
            <Feather name="home" size={20} color="#FFF" />
          </View>
          <Text style={[styles.bottomButtonText, styles.bottomButtonTextActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomButton}
          onPress={() => router.push('/userapp/userbill')}
        >
          <View style={styles.bottomButtonIcon}>
            <Feather name="file-text" size={20} color="#5E72E4" />
          </View>
          <Text style={styles.bottomButtonText}>Bills</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreenuser;
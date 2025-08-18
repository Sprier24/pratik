import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { AntDesign, MaterialIcons, Feather } from '@expo/vector-icons';
import { account, databases } from '../lib/appwrite';
import { RefreshControl } from 'react-native';
import { Query } from 'react-native-appwrite';
import { styles } from '../constants/HomeScreen.styles';
import { footerStyles } from '../constants/footer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DATABASE_ID = 'servicevale-database';
const COLLECTION_ID = 'bill-id';
const ORDERS_COLLECTION_ID = 'orders-id';
const NOTIFICATIONS_COLLECTION_ID = 'adminnotification-id';
const PAYMENTS_COLLECTION_ID = 'commission-id';
const { width } = Dimensions.get('window');
const MONTHLY_REVENUE_COLLECTION_ID = 'monthly-id';
const USERS_COLLECTION_ID = 'engineer-id';

const AdminHomeScreen = () => {
  const [dailyRevenue, setDailyRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [totalCommission, setTotalCommission] = useState(0);
  const [engineerCommissions, setEngineerCommissions] = useState<{ name: string, amount: number }[]>([]);
  const [pendingCommission, setPendingCommission] = useState(0);
  const [pendingEngineersCount, setPendingEngineersCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await account.deleteSession('current');
              router.replace('/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const fetchRevenueData = async () => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const currentMonth = today.toLocaleString('default', { month: 'long' });
      const currentYear = today.getFullYear().toString();

      const dailyBills = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.greaterThanEqual('date', startOfDay),
          Query.orderDesc('date')
        ]
      );

      const monthlyBills = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.greaterThanEqual('date', startOfMonth),
          Query.orderDesc('date')
        ]
      );

      const dailyTotal = dailyBills.documents.reduce((sum, bill) => sum + parseFloat(bill.total || 0), 0);
      const monthlyTotal = monthlyBills.documents.reduce((sum, bill) => sum + parseFloat(bill.total || 0), 0);

      setDailyRevenue(dailyTotal);
      setMonthlyRevenue(monthlyTotal);
      const existing = await databases.listDocuments(
        DATABASE_ID,
        MONTHLY_REVENUE_COLLECTION_ID,
        [
          Query.equal('month', currentMonth),
          Query.equal('year', currentYear)
        ]
      );

      if (existing.total > 0) {
        await databases.updateDocument(
          DATABASE_ID,
          MONTHLY_REVENUE_COLLECTION_ID,
          existing.documents[0].$id,
          { total: monthlyTotal.toString() }
        );
      } else {
        await databases.createDocument(
          DATABASE_ID,
          MONTHLY_REVENUE_COLLECTION_ID,
          'unique()',
          {
            month: currentMonth,
            year: currentYear,
            total: monthlyTotal.toString()
          }
        );
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      setRefreshing(true);
      const pendingResponse = await databases.listDocuments(
        DATABASE_ID,
        ORDERS_COLLECTION_ID,
        [
          Query.equal('status', 'pending'),
          Query.select(['$id'])
        ]
      );
      const completedResponse = await databases.listDocuments(
        DATABASE_ID,
        ORDERS_COLLECTION_ID,
        [
          Query.notEqual('status', 'pending'),
          Query.select(['$id'])
        ]
      );
      setPendingCount(pendingResponse.total);
      setCompletedCount(completedResponse.total);
    } catch (error) {
      console.error('Appwrite error:', error);
      Alert.alert('Error', 'Failed to fetch orders');
    } finally {
      setRefreshing(false);
      setIsLoading(false);
    }
  };

  const fetchCommissionData = async () => {
    try {
      const today = new Date();
      const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

      const [usersResponse, paymentsResponse] = await Promise.all([
        databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID),
        databases.listDocuments(DATABASE_ID, PAYMENTS_COLLECTION_ID)
      ]);

      const engineersWithCommissions = await Promise.all(
        usersResponse.documents.map(async (user) => {
          const currentMonthCommissions = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID,
            [
              Query.equal('serviceBoyName', user.name),
              Query.greaterThanEqual('date', startOfCurrentMonth)
            ]
          );

          const monthCommission = currentMonthCommissions.documents.reduce(
            (sum, doc) => sum + (parseFloat(doc.serviceCharge || '0') * 0.25),
            0 
          );

          const allCommissions = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID,
            [Query.equal('serviceBoyName', user.name)]
          );
          const totalCommission = allCommissions.documents.reduce(
            (sum, doc) => sum + (parseFloat(doc.serviceCharge || '0') * 0.25),
            0 
          );

          const engineerPayments = paymentsResponse.documents
            .filter(payment => payment.engineerName === user.name)
            .reduce((sum, payment) => sum + parseFloat(payment.amount || '0'), 0);

          return {
            id: user.$id,
            name: user.name,
            commission: monthCommission,
            payments: engineerPayments,
            pending: totalCommission - engineerPayments,
          };
        })
      );

      const totalCommission = engineersWithCommissions.reduce(
        (sum, e) => sum + e.commission,
        0
      );
      const pendingCommission = engineersWithCommissions.reduce(
        (sum, e) => sum + e.pending,
        0
      );
      const pendingEngineersCount = engineersWithCommissions.filter(
        (e) => e.pending > 0
      ).length;

      setTotalCommission(totalCommission);
      setPendingCommission(pendingCommission);
      setPendingEngineersCount(pendingEngineersCount);
      setEngineerCommissions(
        engineersWithCommissions
          .sort((a, b) => b.pending - a.pending)
          .map((e) => ({ name: e.name, amount: e.commission }))
      );

    } catch (error) {
      console.error('Error fetching commission data:', error);
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
            onPress={() => router.push('/notification')}
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
              <MaterialIcons name="today" size={25} color="#FFF" />
            </View>
            <Text style={styles.cardTitle}>Today's Revenue</Text>
            <Text style={styles.cardAmount}>
              ₹{dailyRevenue.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.revenueCard, styles.monthlyCard]}
            onPress={() => router.push('/revenuehistory')}
          >
            <View style={styles.cardIconContainer}>
              <MaterialIcons name="date-range" size={25} color="#FFF" />
            </View>
            <Text style={styles.cardTitle}>Monthly Revenue</Text>
            <Text style={styles.cardAmount}>
              ₹{monthlyRevenue.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </Text>
            <View style={styles.viewHistoryLink}>
              <Text style={styles.viewHistoryText}>View History</Text>
              <AntDesign name="right" size={14} color="#FFF" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.revenueRow}>
          <TouchableOpacity
            style={styles.commissionCard}
            onPress={() => router.push('/EngineerCommissions')}
          >
            <View style={styles.commissionCardHeader}>
              <View style={styles.cardIconContainer}>
                <MaterialIcons name="engineering" size={25} color="#FFF" />
              </View>
              <Text style={styles.commissionCardTitle}>Engineer Commissions</Text>
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

              <View style={styles.commissionStat}>
                <Text style={styles.commissionStatLabel}>Engineers Due</Text>
                <Text style={styles.commissionStatValue}>
                  {pendingEngineersCount}
                </Text>
              </View>
            </View>

            <View style={styles.commissionCardFooter}>
              <Text style={styles.commissionCardFooterText}>View all commissions</Text>
              <Feather name="chevron-right" size={20} color="#FFF" />
            </View>
          </TouchableOpacity>
        </View>

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
              onPress={() => router.push('/pending')}
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
              onPress={() => router.push('/completed')}
            >
              <Text style={styles.serviceCardButtonText}>View All</Text>
              <AntDesign name="right" size={16} color="#5E72E4" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={[footerStyles.bottomBar, { paddingBottom: insets.bottom || 20, marginTop: 40 }]}>
        <TouchableOpacity
          style={footerStyles.bottomButton}
          onPress={() => router.push('/service')}
        >
          <View style={footerStyles.bottomButtonIcon}>
            <MaterialIcons name="construction" size={20} color="#5E72E4" />
          </View>
          <Text style={footerStyles.bottomButtonText}>Service</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={footerStyles.bottomButton}
          onPress={() => router.push('/user')}
        >
          <View style={footerStyles.bottomButtonIcon}>
            <MaterialIcons name="engineering" size={20} color="#5E72E4" />
          </View>
          <Text style={footerStyles.bottomButtonText}>Engineers</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[footerStyles.bottomButton, footerStyles.bottomButtonActive]}
        >
          <View style={[footerStyles.bottomButtonIcon, footerStyles.bottomButtonIconActive]}>
            <Feather name="home" size={25} color="#FFF" />
          </View>
          <Text style={[footerStyles.bottomButtonText, footerStyles.bottomButtonTextActive]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={footerStyles.bottomButton}
          onPress={() => router.push('/userphotos')}
        >
          <View style={footerStyles.bottomButtonIcon}>
            <MaterialIcons name="photo-library" size={20} color="#5E72E4" />
          </View>
          <Text style={footerStyles.bottomButtonText}>Photos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={footerStyles.bottomButton}
          onPress={() => router.push('/bill')}
        >
          <View style={footerStyles.bottomButtonIcon}>
            <Feather name="file-text" size={20} color="#5E72E4" />
          </View>
          <Text style={footerStyles.bottomButtonText}>Bills</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
export default AdminHomeScreen;
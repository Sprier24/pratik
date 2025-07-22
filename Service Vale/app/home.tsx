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
import { getUnreadNotificationInboxCount } from 'native-notify';
import { useFocusEffect } from '@react-navigation/native';
import { registerIndieID, unregisterIndieDevice, getUnreadIndieNotificationInboxCount } from 'native-notify';
import { APP_ID, APP_TOKEN } from '../constants/nativeNotify';

const DATABASE_ID = '681c428b00159abb5e8b';
const COLLECTION_ID = 'bill_ID';
const ORDERS_COLLECTION_ID = '681d92600018a87c1478';
const PAYMENTS_COLLECTION_ID = 'commission_ID';
const { width } = Dimensions.get('window');
const MONTHLY_REVENUE_COLLECTION_ID = 'monthly_revenue';

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
  const insets = useSafeAreaInsets();
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [unreadIndieNotificationCount, setUnreadIndieNotificationCount] = useState(0);

  const fetchUnreadIndieCount = async () => {
    try {
      const user = await account.get();
      const userEmail = user.email;

      const count = await getUnreadIndieNotificationInboxCount(
        userEmail,
        APP_ID,
        APP_TOKEN
      );

      console.log("Unread Indie notifications count:", count);
      setUnreadIndieNotificationCount(count);
    } catch (error) {
      console.error("Error fetching unread indie count:", error);
      try {
        const regularCount = await getUnreadNotificationInboxCount(APP_ID, APP_TOKEN);
        setUnreadIndieNotificationCount(regularCount);
      } catch (fallbackError) {
        console.error("Fallback count failed:", fallbackError);
      }
    }
  };

  useEffect(() => {
    fetchUnreadIndieCount();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchUnreadIndieCount();
    }, [])
  );

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
              const user = await account.get();
              const userEmail = user.email;
              const userId = user.$id;
              try {
                await unregisterIndieDevice(userEmail, APP_ID, APP_TOKEN);
                console.log('Unregistered from Indie push notifications');
              } catch (unregisterError) {
                console.warn('Failed to unregister from push notifications:', unregisterError);
              }

              try {
                const result = await databases.listDocuments(
                  '681c428b00159abb5e8b',
                  '68773d3800020869e8fc',
                  [Query.equal('userId', userId)]
                );

                if (result.documents.length > 0) {
                  const documentId = result.documents[0].$id;

                  await databases.deleteDocument(
                    '681c428b00159abb5e8b',
                    '68773d3800020869e8fc',
                    documentId
                  );
                  console.log('Admin login record deleted');
                }
              } catch (deleteError) {
                console.warn('Failed to delete admin login record:', deleteError);
              }
              await account.deleteSession('current');
              router.replace('/login');
            } catch (error) {
              console.error('Logout error:', error);
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

      // Query specifically for pending orders count without pagination
      const pendingResponse = await databases.listDocuments(
        DATABASE_ID,
        ORDERS_COLLECTION_ID,
        [
          Query.equal('status', 'pending'),
          Query.select(['$id']) // Only select IDs to reduce payload
        ]
      );

      // Query specifically for completed orders count without pagination
      const completedResponse = await databases.listDocuments(
        DATABASE_ID,
        ORDERS_COLLECTION_ID,
        [
          Query.notEqual('status', 'pending'),
          Query.select(['$id']) // Only select IDs to reduce payload
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
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const currentMonthBills = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.greaterThanEqual('date', startOfMonth),
          Query.orderDesc('date')
        ]
      );
      const allBills = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID
      );
      const payments = await databases.listDocuments(
        DATABASE_ID,
        PAYMENTS_COLLECTION_ID
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
      const engineerMap = new Map<string, number>();
      allBills.documents.forEach(bill => {
        const commission = parseFloat(bill.serviceCharge || '0') * 0.25;
        const current = engineerMap.get(bill.serviceBoyName) || 0;
        engineerMap.set(bill.serviceBoyName, current + commission);
      });

      const paymentMap = new Map<string, number>();
      payments.documents.forEach(payment => {
        const amount = parseFloat(payment.amount || '0');
        const current = paymentMap.get(payment.engineerName) || 0;
        paymentMap.set(payment.engineerName, current + amount);
      });

      let pendingEngineersCount = 0;
      const sortedEngineers = Array.from(engineerMap.entries())
        .map(([name, amount]) => {
          const paid = paymentMap.get(name) || 0;
          const pending = amount - paid;
          if (pending > 0) pendingEngineersCount++;
          return { name, amount, pending };
        })
        .sort((a, b) => b.pending - a.pending);

      setTotalCommission(total);
      setPendingCommission(pending);
      setPendingEngineersCount(pendingEngineersCount);
      setEngineerCommissions(sortedEngineers);

    } catch (error) {
      console.error('Error fetching commission data:', error);
    }
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchRevenueData(),
      fetchOrders(),
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
            onPress={() => router.push('/NotificationInbox')}
          >
            <MaterialIcons name="notifications" size={24} color="#FFF" />
            {(unreadIndieNotificationCount > 0 || unreadNotificationCount > 0) && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {Math.max(unreadIndieNotificationCount, unreadNotificationCount) > 9
                    ? '9+'
                    : Math.max(unreadIndieNotificationCount, unreadNotificationCount)}
                </Text>
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
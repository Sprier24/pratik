import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { account, databases } from '../../lib/appwrite';
import { RefreshControl } from 'react-native';
import { Query } from 'react-native-appwrite';
import { styles } from '../../constants/userapp/HomeScreenuser.styles';

const DATABASE_ID = '681c428b00159abb5e8b';
const COLLECTION_ID = 'bill_ID';
const ORDERS_COLLECTION_ID = '681d92600018a87c1478';
const { width } = Dimensions.get('window');

const HomeScreenuser = () => {
  const [dailyRevenue, setDailyRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const fetchRevenueData = async () => {
    try {
      const currentUser = await account.get();
      const userResponse = await databases.listDocuments(
        DATABASE_ID,
        '681c429800281e8a99bd',
        [Query.equal('email', currentUser.email)]
      );
      if (userResponse.documents.length === 0) return;
      const userName = userResponse.documents[0].name;
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const dailyBills = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.greaterThanEqual('date', startOfDay),
          Query.equal('serviceBoyName', userName),
          Query.orderDesc('date')
        ]
      );
      const monthlyBills = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.greaterThanEqual('date', startOfMonth),
          Query.equal('serviceBoyName', userName),
          Query.orderDesc('date')
        ]
      );
      const dailyTotal = dailyBills.documents.reduce((sum, bill) => {
        return sum + parseFloat(bill.total || 0);
      }, 0);
      const monthlyTotal = monthlyBills.documents.reduce((sum, bill) => {
        return sum + parseFloat(bill.total || 0);
      }, 0);
      setDailyRevenue(dailyTotal);
      setMonthlyRevenue(monthlyTotal);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
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

  const fetchAllData = async () => {
    setIsLoading(true);
    await Promise.all([fetchRevenueData(), fetchOrders()]);
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
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3498db']}
            tintColor={'#3498db'}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>User Dashboard</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.notificationIcon}
              onPress={() => console.log('Notifications pressed')}
            >
              <MaterialIcons name="notifications" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.logoutIcon}
              onPress={handleLogout}
            >
              <MaterialIcons name="logout" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.revenueContainer}>
          <View style={[styles.revenueCard, styles.dailyRevenue]}>
            <Text style={[styles.cardTitle, styles.revenueCardTitle]}>Daily Revenue</Text>
            <Text style={styles.cardAmount}>
              ₹{dailyRevenue.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </Text>
            <View style={styles.cardTrend}>
              <AntDesign name="arrowup" size={14} color="#fff" />
              <Text style={styles.trendText}>Today</Text>
            </View>
          </View>
          <View style={[styles.revenueCard, styles.monthlyRevenue]}>
            <Text style={[styles.cardTitle, styles.revenueCardTitle]}>Monthly Revenue</Text>
            <Text style={styles.cardAmount}>
              ₹{monthlyRevenue.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </Text>
            <View style={styles.cardTrend}>
              <AntDesign name="arrowup" size={14} color="#fff" />
              <Text style={styles.trendText}>This Month</Text>
            </View>
          </View>
        </View>
        <View style={styles.servicesContainer}>
          <View style={[styles.serviceCard, styles.pendingCard]}>
            <View style={styles.cardHeader}>
              <MaterialIcons
                name="pending-actions"
                size={24}
                color="#e67e22"
                style={styles.icon}
              />
              <Text style={[styles.cardTitle, styles.serviceCardTitle]}>
                Pending Services
              </Text>
            </View>
            <Text style={styles.cardCount}>{pendingCount}</Text>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => router.push('/userapp/userpending')}
            >
              <Text style={styles.viewButtonText}>View All</Text>
              <AntDesign name="right" size={16} color="#3498db" />
            </TouchableOpacity>
          </View>
          <View style={[styles.serviceCard, styles.completedCard]}>
            <View style={styles.cardHeader}>
              <MaterialIcons
                name="check-circle"
                size={24}
                color="#27ae60"
                style={styles.icon}
              />
              <Text style={[styles.cardTitle, styles.serviceCardTitle]}>
                Completed Services
              </Text>
            </View>
            <Text style={styles.cardCount}>{completedCount}</Text>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => router.push('/userapp/usercompleted')}
            >
              <Text style={styles.viewButtonText}>View All</Text>
              <AntDesign name="right" size={16} color="#3498db" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.bottomButton}
          onPress={() => router.push('/userapp/userprofile')}
        >
          <MaterialIcons name="people" size={24} color="#3498db" />
          <Text style={styles.bottomButtonText}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomButton}
          onPress={() => router.push('/userapp/userbill')}
        >
          <MaterialIcons name="receipt" size={24} color="#3498db" />
          <Text style={styles.bottomButtonText}>Bills</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreenuser;



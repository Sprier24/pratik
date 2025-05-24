import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { account, databases } from '../lib/appwrite';
import { RefreshControl } from 'react-native';
import { Query } from 'react-native-appwrite';
import { styles } from '../constants/HomeScreen.styles';

const DATABASE_ID = '681c428b00159abb5e8b';
const COLLECTION_ID = 'bill_ID';
const ORDERS_COLLECTION_ID = '681d92600018a87c1478';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
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
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
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
      const orders = await databases.listDocuments(DATABASE_ID, ORDERS_COLLECTION_ID);
      const pending = orders.documents.filter(o => o.status === 'pending').length;
      const completed = orders.documents.filter(o => o.status !== 'pending').length;
      setPendingCount(pending);
      setCompletedCount(completed);
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
          <Text style={styles.headerTitle}>Service Dashboard</Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={[styles.notificationIcon, { marginRight: 10 }]}
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
          <View style={[styles.card, styles.dailyRevenue]}>
            <Text style={styles.cardTitle}>Daily Revenue</Text>
            <Text style={styles.cardAmount}>₹{dailyRevenue.toLocaleString('en-IN')}</Text>
            <View style={styles.cardTrend}>
              <AntDesign name="arrowup" size={14} color="#fff" />
              <Text style={styles.trendText}>Today</Text>
            </View>
          </View>
          <View style={[styles.card, styles.monthlyRevenue]}>
            <Text style={styles.cardTitle}>Monthly Revenue</Text>
            <Text style={styles.cardAmount}>₹{monthlyRevenue.toLocaleString('en-IN')}</Text>
            <View style={styles.cardTrend}>
              <AntDesign name="arrowup" size={14} color="#fff" />
              <Text style={styles.trendText}>This Month</Text>
            </View>
          </View>
        </View>

        <View style={styles.servicesContainer}>
          <View style={[styles.card, styles.pendingCard]}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="pending-actions" size={24} color="#e67e22" />
              <Text style={styles.cardTitle}>Pending    Services</Text>
            </View>
            <Text style={styles.cardCount}>{pendingCount}</Text>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => router.push('/pending')}
            >
              <Text style={styles.viewButtonText}>View All</Text>
              <AntDesign name="right" size={16} color="#3498db" />
            </TouchableOpacity>
          </View>
          <View style={[styles.card, styles.completedCard]}>
            <View style={styles.cardHeader}>
              <MaterialIcons name="check-circle" size={24} color="#27ae60" />
              <Text style={styles.cardTitle}>Completed Services</Text>
            </View>
            <Text style={styles.cardCount}>{completedCount}</Text>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => router.push('/completed')}
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
          onPress={() => router.push('/service')}
        >
          <MaterialIcons name="car-repair" size={24} color="#3498db" />
          <Text style={styles.bottomButtonText}>Service</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomButton}
          onPress={() => router.push('/user')}
        >
          <MaterialIcons name="people" size={24} color="#3498db" />
          <Text style={styles.bottomButtonText}>User</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.bottomButton}
          onPress={() => router.push('/bill')}
        >
          <MaterialIcons name="receipt" size={24} color="#3498db" />
          <Text style={styles.bottomButtonText}>Bill</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;
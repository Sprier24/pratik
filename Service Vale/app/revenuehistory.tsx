import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { databases } from '../lib/appwrite';
import { Query } from 'react-native-appwrite';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from '../constants/revenuehistory.style';

const DATABASE_ID = 'servicevale-database';
const COLLECTION_ID = 'monthly-id';

type MonthlyRevenue = {
  month: string;
  year: string;
  total: number;
};

const RevenueHistoryScreen = () => {
  const [monthlyRevenues, setMonthlyRevenues] = useState<MonthlyRevenue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const insets = useSafeAreaInsets();

  const fetchMonthlyRevenueHistory = async () => {
  try {
    setIsLoading(true);
    const revenues = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID,
      [Query.orderDesc('$createdAt')] // Sort by creation date
    );

    // Transform the data to match your expected format
    const formattedRevenues = revenues.documents.map(doc => ({
      month: doc.month,
      year: doc.year.toString(),
      total: parseFloat(doc.total) || 0
    })).sort((a, b) => {
      // Sort by year and month
      if (a.year !== b.year) return parseInt(b.year) - parseInt(a.year);
      return getMonthNumber(b.month) - getMonthNumber(a.month);
    });

    setMonthlyRevenues(formattedRevenues);
  } catch (error) {
    console.error('Error fetching revenue history:', error);
  } finally {
    setIsLoading(false);
  }
};

  const getMonthNumber = (monthName: string) => {
    return new Date(`${monthName} 1, 2000`).getMonth();
  };

  useEffect(() => {
    fetchMonthlyRevenueHistory();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5E72E4" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 20 }]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={25} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Monthly Revenue History</Text>
          <View style={{ width: 24 }} />
        </View>
      </View>

      {monthlyRevenues.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No revenue history available</Text>
        </View>
      ) : (
        <View style={styles.revenueList}>
          {monthlyRevenues.map((revenue, index) => (
            <View key={`${revenue.month}-${revenue.year}`} style={styles.revenueCard}>
              <View style={styles.revenueInfo}>
                <Text style={styles.revenueMonth}>
                  {revenue.month} {revenue.year}
                </Text>
                <Text style={styles.revenueAmount}>
                  ₹{revenue.total.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

export default RevenueHistoryScreen;
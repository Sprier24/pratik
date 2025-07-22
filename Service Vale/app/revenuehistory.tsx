import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { databases } from '../lib/appwrite';
import { Query } from 'react-native-appwrite';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from '../constants/revenuehistory.style';

const DATABASE_ID = '681c428b00159abb5e8b';
const COLLECTION_ID = 'bill_ID';

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
      const bills = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.orderDesc('date')]
      );
      const revenueByMonth = bills.documents.reduce((acc, bill) => {
        const date = new Date(bill.date);
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        const key = `${year}-${month}`;

        if (!acc[key]) {
          acc[key] = {
            month,
            year,
            total: 0
          };
        }

        acc[key].total += parseFloat(bill.total || '0');
        return acc;
      }, {} as Record<string, { month: number; year: number; total: number }>);

      const formattedRevenues = Object.values(revenueByMonth)
        .map(item => ({
          month: new Date(item.year, item.month - 1, 1).toLocaleString('default', { month: 'long' }),
          year: item.year.toString(),
          total: item.total
        }))
        .sort((a, b) => {
          if (a.year !== b.year) return parseInt(b.year) - parseInt(a.year);
          return (
            new Date(parseInt(b.year), getMonthNumber(b.month)).getTime() -
            new Date(parseInt(a.year), getMonthNumber(a.month)).getTime()
          );
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
import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { databases } from '../lib/appwrite';
import { Query } from 'react-native-appwrite';
import { styles } from '../constants/EngineerCommissions.styles';

const DATABASE_ID = '681c428b00159abb5e8b';
const COLLECTION_ID = 'bill_ID';
const PAYMENTS_COLLECTION_ID = 'commission_ID';
const USERS_COLLECTION_ID = '681c429800281e8a99bd';

type Engineer = {
  id: string;
  name: string;
  commission: number;
  payments: number;
  pending: number;
};

const EngineerCommissionsScreen = () => {
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPending, setTotalPending] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const usersResponse = await databases.listDocuments(
        DATABASE_ID,
        USERS_COLLECTION_ID
      );

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

      const paymentsResponse = await databases.listDocuments(
        DATABASE_ID,
        PAYMENTS_COLLECTION_ID
      );

      const currentMonthCommissionMap = new Map<string, number>();
      currentMonthBills.documents.forEach(bill => {
        const commission = parseFloat(bill.serviceCharge || '0') * 0.25;
        const current = currentMonthCommissionMap.get(bill.serviceBoyName) || 0;
        currentMonthCommissionMap.set(bill.serviceBoyName, current + commission);
      });

      const allTimeCommissionMap = new Map<string, number>();
      allBills.documents.forEach(bill => {
        const commission = parseFloat(bill.serviceCharge || '0') * 0.25;
        const current = allTimeCommissionMap.get(bill.serviceBoyName) || 0;
        allTimeCommissionMap.set(bill.serviceBoyName, current + commission);
      });

      const paymentsMap = new Map<string, number>();
      paymentsResponse.documents.forEach(payment => {
        const amount = parseFloat(payment.amount || '0');
        const current = paymentsMap.get(payment.engineerName) || 0;
        paymentsMap.set(payment.engineerName, current + amount);
      });

      const allEngineers = usersResponse.documents.map(user => {
        const currentMonthCommission = currentMonthCommissionMap.get(user.name) || 0;
        const allTimeCommission = allTimeCommissionMap.get(user.name) || 0;
        const payments = paymentsMap.get(user.name) || 0;
        const pending = allTimeCommission - payments;
        return {
          id: user.$id,
          name: user.name,
          commission: currentMonthCommission,
          payments,
          pending
        };
      });

      const totalPendingCommission = allEngineers.reduce((sum, e) => sum + e.pending, 0);
      setTotalPending(totalPendingCommission);

      setEngineers(allEngineers.sort((a, b) => b.pending - a.pending));
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load engineer data');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToEngineerDetail = (engineer: Engineer) => {
    router.push({
      pathname: '/engineer-detail',
      params: {
        engineerId: engineer.id,
        engineerName: engineer.name
      }
    });
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
          <TouchableOpacity onPress={() => router.push('/home')}>
            <Feather name="arrow-left" size={25} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Engineer Commissions</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.totalCommissionCard]}>
            <View style={styles.cardIconContainer}>
              <MaterialIcons name="currency-rupee" size={25} color="#FFF" />
            </View>
            <Text style={styles.cardTitle}>Total Commission</Text>
            <Text style={styles.cardAmount}>
              ₹{engineers.reduce((sum, e) => sum + e.commission, 0).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </Text>
          </View>

          <View style={[styles.summaryCard, styles.pendingCommissionCard]}>
            <View style={styles.cardIconContainer}>
              <MaterialIcons name="pending-actions" size={25} color="#FFF" />
            </View>
            <Text style={styles.cardTitle}>Pending Commission</Text>
            <Text style={[styles.cardAmount, totalPending > 0 && styles.pendingAmount]}>
              ₹{totalPending.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </Text>
          </View>
        </View>

        {engineers.map((engineer) => (
          <TouchableOpacity
            key={engineer.id}
            style={styles.engineerCard}
            onPress={() => navigateToEngineerDetail(engineer)}
          >
            <View style={styles.engineerHeader}>
              <View style={styles.itemIconContainer}>
                <MaterialIcons name="engineering" size={25} color="#5E72E4" />
              </View>
              <View style={styles.engineerInfo}>
                <Text style={styles.engineerName}>{engineer.name}</Text>
                <Text style={[
                  styles.engineerStatus,
                  engineer.pending > 0 ? styles.pendingStatus : styles.paidStatus
                ]}>
                  {engineer.pending > 0 ? 'Pending' : 'Paid'}
                </Text>
              </View>
            </View>

            <View style={styles.amountContainer}>
              <Text style={styles.engineerAmount}>
                ₹{engineer.commission.toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </Text>
              {engineer.pending > 0 && (
                <Text style={styles.pendingStatus}>
                  Pending : ₹{engineer.pending.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default EngineerCommissionsScreen;
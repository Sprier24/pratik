import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { databases } from '../lib/appwrite';
import { Query } from 'react-native-appwrite';
import { styles } from '../constants/EngineerCommissions.styles';

const DATABASE_ID = 'servicevale-database';
const COLLECTION_ID = 'bill-id';
const PAYMENTS_COLLECTION_ID = 'commission-id';
const USERS_COLLECTION_ID = 'engineer-id';

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
      setIsLoading(true);
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
            (sum, doc) => sum + (parseFloat(doc.serviceCharge) * 0.25),
            0
          );

          const allCommissions = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID,
            [Query.equal('serviceBoyName', user.name)]
          );
          const totalCommission = allCommissions.documents.reduce(
            (sum, doc) => (sum + (parseFloat(doc.serviceCharge) * 0.25)),
            0
          );

          const engineerPayments = paymentsResponse.documents
            .filter(payment => payment.engineerName === user.name)
            .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

          return {
            id: user.$id,
            name: user.name,
            commission: monthCommission, 
            payments: engineerPayments,
            pending: totalCommission - engineerPayments,
          };
        })
      );

      const sortedEngineers = engineersWithCommissions.sort((a, b) => b.pending - a.pending);
      setEngineers(sortedEngineers);

      setTotalPending(sortedEngineers.reduce((sum, e) => sum + e.pending, 0));

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
                  Pending: ₹{engineer.pending.toLocaleString('en-IN', {
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
import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Modal, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { databases } from '../lib/appwrite';
import { ID, Query } from 'appwrite';
import { MaterialIcons, AntDesign, Feather } from '@expo/vector-icons';
import { styles } from '../constants/ServicePage.styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { footerStyles } from '../constants/footer';
import axios from 'axios';

const DATABASE_ID = '681c428b00159abb5e8b';
const COLLECTION_ID = '681c429800281e8a99bd';
const NOTIFICATIONS_COLLECTION_ID = 'note_id';
type ServiceKey = 'AC' | 'Washing Machine' | 'Fridge' | 'Microwave';

const ServicePage = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [allUsers, setAllUsers] = useState<{ id: string, name: string, email: string, phone: string }[]>([]);
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceKey>('AC');
  const [selectedServiceboyName, setSelectedServiceboyName] = useState<string>('');
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID,
          [Query.orderDesc('$createdAt')]
        );
        const users = response.documents.map(doc => ({
          id: doc.$id,
          name: doc.name,
          email: doc.email,
          phone: doc.contactNo
        }));
        setAllUsers(users);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchAllUsers();
  }, []);

  const createNotification = async (description: string, userEmail: string) => {
    try {
      await databases.createDocument(
        DATABASE_ID,
        NOTIFICATIONS_COLLECTION_ID,
        ID.unique(),
        {
          description,
          isRead: false,
          createdAt: new Date().toISOString(),
          userEmail,
        }
      );
      console.log('Notification sent to:', userEmail);
    } catch (error) {
      console.error('Notification creation failed:', error);
    }
  };

  const sendNativeNotifyPush = async (title: string, message: string) => {
    console.log('📲 Attempting push...');

    try {
      const response = await fetch('https://app.nativenotify.com/api/notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appId: 31214, // Use your NativeNotify App ID
          appToken: 'NaLjQl8mbwbQbKWRlsWgZZ', // Use your NativeNotify App Token
          title,
          body: message,
          to: 'all', // or 'admin' depending on who should receive
        }),
      });

      const resultText = await response.text();
      console.log('✅ Native Notify response text:', resultText);

      if (!response.ok) {
        console.error('❌ Push failed:', response.status, resultText);
        Alert.alert('Push Failed', resultText);
      } else {
        console.log('Push Sent Successfully');
      }
    } catch (err) {
      console.error('❌ Network error:', err);
      Alert.alert('Error', 'Network error. Check logs.');
    }
  };

  const sendIndiePushNotification = async (subID: string, title: string, message: string) => {
    console.log('📲 Attempting Indie push...');

    try {
      const response = await axios.post('https://app.nativenotify.com/api/indie/notification', {
        subID: subID,
        appId: 31214,
        appToken: 'NaLjQl8mbwbQbKWRlsWgZZ',
        title: title,
        message: message
      });

      console.log('✅ Indie push response:', response.data);
      return true;
    } catch (err) {
      console.error('❌ Indie push failed:', err);
      return false;
    }
  };

  const handleImagePress = (serviceKey: ServiceKey) => {
    setSelectedServiceType(serviceKey);
    setModalVisible(true);
  };

  const handleApplicantPress = async (
    applicantId: string,
    applicantName: string,
    applicantEmail: string,
    applicantPhone: string
  ) => {
    setModalVisible(false);
    setSelectedServiceboyName(applicantName);

    try {
      // Create database notification
      await createNotification(
        `You assigned a new ${selectedServiceType} service.`,
        applicantEmail
      );

      // Send Indie push notification to the specific engineer
      const pushSuccess = await sendIndiePushNotification(
        applicantEmail, // Using email as the subID (must match what was registered)
        'New Service Assignment',
        `You've been assigned a ${selectedServiceType} service. Please check your pending services.`
      );

      if (!pushSuccess) {
        console.log('Falling back to regular push notification');
        // Fallback to regular notification if Indie push fails
        await sendNativeNotifyPush(
          'New Service Assignment',
          `${applicantName} has been assigned a ${selectedServiceType} service`
        );
      }

      // Navigate to order page
      router.push({
        pathname: '/order',
        params: {
          applicantId,
          applicantName,
          serviceType: selectedServiceType,
          applicantEmail,
          applicantPhone
        },
      });

    } catch (error) {
      console.error('Error handling applicant press:', error);
      Alert.alert('Error', 'Failed to assign service engineer');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.push('/home')}>
            <Feather name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Service Selection</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={[styles.scrollContainer, { paddingBottom: 170 }]}>
        <View style={styles.servicesGrid}>
          <TouchableOpacity
            style={styles.serviceCard}
            onPress={() => handleImagePress('AC')}
          >
            <View style={styles.serviceImageContainer}>
              <Image
                source={require('../assets/images/ac.jpg')}
                style={styles.serviceImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.serviceInfo}>
              <View style={styles.serviceButton}>
                <Text style={styles.serviceTitle}>AC Service</Text>
                <View style={styles.serviceButton}>
                  <Text style={styles.serviceButtonText}>Select</Text>
                  <AntDesign name="right" size={16} color="#5E72E4" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.serviceCard}
            onPress={() => handleImagePress('Washing Machine')}
          >
            <View style={styles.serviceImageContainer}>
              <Image
                source={require('../assets/images/washingmachine.jpg')}
                style={styles.serviceImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.serviceInfo}>
              <View style={styles.serviceButton}>
                <Text style={styles.serviceTitle}>Washing Machine Service</Text>
                <View style={styles.serviceButton}>
                  <Text style={styles.serviceButtonText}>Select</Text>
                  <AntDesign name="right" size={16} color="#5E72E4" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.serviceCard}
            onPress={() => handleImagePress('Fridge')}
          >
            <View style={styles.serviceImageContainer}>
              <Image
                source={require('../assets/images/fridgerepair.jpg')}
                style={styles.serviceImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.serviceInfo}>
              <View style={styles.serviceButton}>
                <Text style={styles.serviceTitle}>Fridge Service</Text>
                <View style={styles.serviceButton}>
                  <Text style={styles.serviceButtonText}>Select</Text>
                  <AntDesign name="right" size={16} color="#5E72E4" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.serviceCard}
            onPress={() => handleImagePress('Microwave')}
          >
            <View style={styles.serviceImageContainer}>
              <Image
                source={require('../assets/images/microwave.jpg')}
                style={styles.serviceImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.serviceInfo}>
              <View style={styles.serviceButton}>
                <Text style={styles.serviceTitle}>Microwave Service</Text>
                <View style={styles.serviceButton}>
                  <Text style={styles.serviceButtonText}>Select</Text>
                  <AntDesign name="right" size={16} color="#5E72E4" />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Service Engineer</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="#718096" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {allUsers.length > 0 ? (
                allUsers.map((user, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleApplicantPress(user.id, user.name, user.email, user.phone)}
                    style={styles.applicantItem}
                  >
                    <View style={styles.applicantAvatar}>
                      <MaterialIcons name="person" size={24} color="#5E72E4" />
                    </View>
                    <View style={styles.applicantInfo}>
                      <Text style={styles.applicantName}>{user.name}</Text>
                      <Text style={styles.applicantEmail}>{user.email}</Text>
                    </View>
                    <AntDesign name="right" size={16} color="#A0AEC0" />
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.noApplicants}>
                  <MaterialIcons name="people-outline" size={40} color="#CBD5E0" />
                  <Text style={styles.noApplicantsText}>No engineers added yet</Text>
                  <Text style={styles.noApplicantsText}>Go to "Engineers" tab and add an engineer</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      <View style={[footerStyles.bottomBar, { paddingBottom: insets.bottom || 20, marginTop: 40 }]}>
        <TouchableOpacity
          style={[footerStyles.bottomButton, footerStyles.bottomButtonActive]}
          onPress={() => router.push('/service')}
        >
          <View style={[footerStyles.bottomButtonIcon, footerStyles.bottomButtonIconActive]}>
            <MaterialIcons name="car-repair" size={20} color="#FFF" />
          </View>
          <Text style={[footerStyles.bottomButtonText, footerStyles.bottomButtonTextActive]}>Service</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={footerStyles.bottomButton}
          onPress={() => router.push('/user')}
        >
          <View style={footerStyles.bottomButtonIcon}>
            <MaterialIcons name="person" size={20} color="#5E72E4" />
          </View>
          <Text style={footerStyles.bottomButtonText}>Engineers</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[footerStyles.bottomButton]}
          onPress={() => router.push('/home')}
        >
          <View style={[footerStyles.bottomButtonIcon]}>
            <Feather name="home" size={20} color="#5E72E4" />
          </View>
          <Text style={[footerStyles.bottomButtonText]}>Home</Text>
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

export default ServicePage;
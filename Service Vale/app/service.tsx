import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { databases } from '../lib/appwrite';
import { ID, Query } from 'appwrite';
import { styles } from '../constants/ServicePage.styles';

const DATABASE_ID = '681c428b00159abb5e8b';
const COLLECTION_ID = '681c429800281e8a99bd';
const NOTIFICATIONS_COLLECTION_ID = 'note_id';
type ServiceKey = 'AC' | 'Washing Machine' | 'Fridge' | 'Microwave';

const ServicePage = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [allUsers, setAllUsers] = useState<{ id: string, name: string, email: string, phone: string }[]>([]);
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceKey>('AC');
  const router = useRouter();
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

  const createNotification = async (description: string, userEmail: string,) => {
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

    // Send a notification
    await createNotification(
      ` assigned a new ${selectedServiceType} service.`,
      applicantEmail
    );

    // Navigate to the order page
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
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Applicants for this service</Text>
            </View>
            <ScrollView style={{ maxHeight: '80%' }} contentContainerStyle={styles.scrollContent}>
              {allUsers.length > 0 ? (
                allUsers.map((user, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handleApplicantPress(user.id, user.name, user.email, user.phone)}
                    style={styles.applicantItem}
                  >
                    <Text style={styles.applicantName}>{user.name}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noApplicantsText}>No applicants yet</Text>
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.serviceBox}>
        <View style={styles.imageContainer}>
          <TouchableOpacity onPress={() => handleImagePress('AC')}>
            <Image
              source={require('../assets/images/ac.jpg')}
              style={styles.image}
              resizeMode="cover"
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>AC Service</Text>
      </View>

      <View style={styles.serviceBox}>
        <View style={styles.imageContainer}>
          <TouchableOpacity onPress={() => handleImagePress('Washing Machine')}>
            <Image
              source={require('../assets/images/washingmachine.jpg')}
              style={styles.image}
              resizeMode="cover"
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>Washing Machine Service</Text>
      </View>

      <View style={styles.serviceBox}>
        <View style={styles.imageContainer}>
          <TouchableOpacity onPress={() => handleImagePress('Fridge')}>
            <Image
              source={require('../assets/images/fridgerepair.jpg')}
              style={styles.image}
              resizeMode="cover"
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>Fridge Service</Text>
      </View>

      <View style={styles.serviceBox}>
        <View style={styles.imageContainer}>
          <TouchableOpacity onPress={() => handleImagePress('Microwave')}>
            <Image
              source={require('../assets/images/microwave.jpg')}
              style={styles.image}
              resizeMode="cover"
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>Microwave Service</Text>
      </View>
    </ScrollView>
  );
};

export default ServicePage
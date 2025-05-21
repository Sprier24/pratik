import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { databases } from '../lib/appwrite';
import { ID } from 'appwrite';
import { styles } from '../constants/OrderScreen.styles';

const DATABASE_ID = 'ServiceVale';
const COLLECTION_ID = 'orders_id';

type FormData = {
  serviceboyName: string;
  clientName: string;
  phoneNumber: string;
  address: string;
  billAmount: string;
  serviceType: string;
  status: string;
};

const OrderScreen = () => {
  const { applicantName, serviceType } = useLocalSearchParams<{
    applicantName: string;
    serviceType: string
  }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    serviceboyName: applicantName || '',
    clientName: '',
    phoneNumber: '',
    address: '',
    billAmount: '',
    serviceType: serviceType || '',
    status: 'pending'
  });

  const handleChange = (name: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Invalid phone number (10 digits required)';
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
          serviceboyName: formData.serviceboyName,
          clientName: formData.clientName,
          phoneNumber: formData.phoneNumber,
          address: formData.address,
          billAmount: formData.billAmount,
          serviceType: formData.serviceType,
          status: 'pending'
        }
      );
      Alert.alert('Success', 'Order created successfully!');
      router.push({
        pathname: '/pending',
        params: {
          newService: JSON.stringify({
            serviceType: formData.serviceType,
            clientName: formData.clientName,
            address: formData.address,
            phoneNumber: formData.phoneNumber,
            billAmount: formData.billAmount,
            status: 'pending',
            serviceboyName: formData.serviceboyName,
            createdAt: response.$createdAt
          })
        }
      });
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert('Error', 'Failed to create order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>New Service Order</Text>
        <Text style={styles.headerSubtitle}>Fill in the details below</Text>
      </View>
      <View style={styles.formContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Information</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Service Boy</Text>
            <View style={styles.readOnlyContainer}>
              <Text style={styles.readOnlyText}>{formData.serviceboyName}</Text>
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Service Type</Text>
            <View style={styles.readOnlyContainer}>
              <Text style={styles.readOnlyText}>{serviceType}</Text>
            </View>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Client Details</Text>
          <View style={styles.field}>
            <Text style={styles.label}>
              Full Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={formData.clientName}
              onChangeText={(text) => handleChange('clientName', text)}
              placeholder="Client name"
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Phone Number <Text style={styles.required}>*</Text></Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="phone" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.inputWithIcon}
                placeholder="10-digit mobile number"
                value={formData.phoneNumber}
                onChangeText={(text) => handleChange('phoneNumber', text)}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Service Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.address}
              onChangeText={(text) => handleChange('address', text)}
              placeholder="Full address with landmarks"
              multiline
              numberOfLines={4}
            />
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billing Information</Text>
          <View style={styles.field}>
            <Text style={styles.label}>Amount</Text>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="currency-inr" size={16} color="#6B7280" />
              <TextInput
                style={styles.inputWithIcon}
                value={formData.billAmount?.toString() ?? ''}
                onChangeText={(text) => handleChange('billAmount', text)}
                placeholder="0.00"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
      </View>
      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Text style={styles.submitButtonText}>
          {isSubmitting ? 'Creating...' : 'Create Service Order'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default OrderScreen;
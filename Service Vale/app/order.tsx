import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import DateTimePicker from '@react-native-community/datetimepicker';
import { styles } from '../constants/OrderScreen.styles';

const BASE_URL = `${Constants.expoConfig?.extra?.apiUrl}/order`;

const OrderScreen = () => {
  const { applicantName, serviceType, applicantEmail, applicantPhone } =
    useLocalSearchParams<{
      applicantName: string;
      serviceType: string;
      applicantEmail: string;
      applicantPhone: string;
    }>();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [servicesList, setServicesList] = useState<{ name: string; charge: string }[]>([]);
  const router = useRouter();

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (serviceType) {
      const servicesArray = serviceType.split(',').map(s => s.trim());
      setServicesList(servicesArray.map(s => ({ name: s, charge: '' })));
    }
  }, [serviceType]);

  const [formData, setFormData] = useState({
    serviceboyName: applicantName || '',
    serviceboyEmail: applicantEmail || '',
    serviceboyContactNumber: applicantPhone || '',
    clientName: '',
    phoneNumber: '',
    address: '',
    billAmount: '0',
    status: 'pending',
    serviceDate: new Date().toLocaleDateString('en-GB').split('/').join('-'), // DD-MM-YYYY
    serviceTime: new Date().toISOString().split('T')[1].split('.')[0],
  });

  // Auto calculate total
  useEffect(() => {
    const total = servicesList.reduce((sum, s) => sum + (parseFloat(s.charge) || 0), 0);
    setFormData(prev => ({ ...prev, billAmount: total.toString() }));
  }, [servicesList]);

  const handleChargeChange = (index: number, value: string) => {
    const updated = [...servicesList];
    updated[index].charge = value;
    setServicesList(updated);
  };

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toLocaleDateString('en-GB').split('/').join('-'); // DD-MM-YYYY
      setFormData(prev => ({
        ...prev,
        serviceDate: formattedDate,
      }));
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const timeStr = selectedTime.toTimeString().split(' ')[0];
      setFormData(prev => ({
        ...prev,
        serviceTime: timeStr,
      }));
    }
  };

  const validateForm = () => {
    if (!formData.clientName || !formData.phoneNumber || !formData.address) return false;
    if (servicesList.some(s => !s.charge.trim())) {
      Alert.alert('Missing Charges', 'Please enter charges for all services.');
      return false;
    }
    return true;
  };

  const createOrder = async (orderData: any) => {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    if (!res.ok) throw new Error('Failed to create order');
    return res.json();
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill all required fields correctly');
      return;
    }

    setIsSubmitting(true);
    try {
      for (const s of servicesList) {
        const orderData = {
          ...formData,
          serviceType: s.name,
          billAmount: s.charge,
        };
        await createOrder(orderData);
      }

      Alert.alert('✅ Success', `${servicesList.length} order(s) created successfully`);
      router.push('/pending');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to create order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container1}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.push('/home')}>
            <Feather name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Service Order</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Engineer Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Engineer Information</Text>
            <Text style={styles.label}>Name: {formData.serviceboyName}</Text>
            <Text style={styles.label}>Email: {formData.serviceboyEmail}</Text>
            <Text style={styles.label}>Contact: {formData.serviceboyContactNumber}</Text>
          </View>

          {/* Services */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Services & Charges</Text>
            {servicesList.map((s, i) => (
              <View
                key={i}
                style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 6 }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>{s.name}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="currency-inr" size={16} color="#6B7280" />
                  <TextInput
                    style={[styles.input, { width: 100, marginLeft: 5 }]}
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={s.charge}
                    onChangeText={val => handleChargeChange(i, val)}
                  />
                </View>
              </View>
            ))}
            <Text style={{ fontWeight: 'bold', marginTop: 10 }}>
              Total: ₹{formData.billAmount || 0}
            </Text>
          </View>

          {/* Service Date & Time */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Schedule</Text>

            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={[styles.input, { marginBottom: 10 }]}
            >
              <Text style={{ color: '#000' }}>📅 {formData.serviceDate}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={new Date()}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}

            <TouchableOpacity
              onPress={() => setShowTimePicker(true)}
              style={[styles.input, { marginBottom: 10 }]}
            >
              <Text style={{ color: '#000' }}>⏰ {formData.serviceTime}</Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={new Date()}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={handleTimeChange}
              />
            )}
          </View>

          {/* Customer Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Details</Text>
            <TextInput
              style={[styles.input, { marginBottom: 10 }]}
              placeholder="Customer Name"
              value={formData.clientName}
              onChangeText={t => handleChange('clientName', t)}
            />
            <TextInput
              style={[styles.input, { marginBottom: 10 }]}
              placeholder="Phone Number"
              keyboardType="numeric"
              value={formData.phoneNumber}
              onChangeText={t => handleChange('phoneNumber', t)}
            />
            <TextInput
              style={[styles.input, styles.textArea, { marginBottom: 10 }]}
              placeholder="Address"
              multiline
              value={formData.address}
              onChangeText={t => handleChange('address', t)}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Creating Orders...' : 'Create Orders'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default OrderScreen;

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { Query } from 'appwrite';
import { databases, account } from '../../lib/appwrite';
import * as Print from 'expo-print';
import SignatureScreen from 'react-native-signature-canvas';
import { styles } from '../../constants/userapp/UserBill.styles';

const DATABASE_ID = '681c428b00159abb5e8b';
const COLLECTION_ID = 'bill_ID';

type Bill = {
  $id: string;
  notes: string;
  billNumber: string;
  serviceType: string;
  serviceBoyName: string;
  customerName: string;
  contactNumber: string;
  address: string;
  serviceCharge: string;
  paymentMethod: string;
  cashGiven: string;
  change: string;
  $createdAt: string;
  signature?: string;
  status: string;
  total: string;
  date: string;
};

const fieldLabels = {
  serviceType: 'Service Type',
  serviceBoyName: 'Service Provider Name',
  customerName: 'Customer Name',
  address: 'Address',
  contactNumber: 'Contact Number',
  serviceCharge: 'Service Charge (₹)'
};

const UserBill = () => {
  const params = useLocalSearchParams();
  const [form, setForm] = useState({
    serviceType: '',
    serviceBoyName: '',
    customerName: '',
    address: '',
    contactNumber: '',
    serviceCharge: '',
  });
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashGiven, setCashGiven] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [notes, setNotes] = useState('');
  const [isBillDetailVisible, setIsBillDetailVisible] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [isSignatureVisible, setIsSignatureVisible] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const fetchUserAndBills = async () => {
      try {
        setIsLoading(true);
        // Get current user's name
        const currentUser = await account.get();
        const userResponse = await databases.listDocuments(
          DATABASE_ID,
          '681c429800281e8a99bd', // Users collection ID
          [Query.equal('email', currentUser.email)]
        );
        
        if (userResponse.documents.length > 0) {
          const name = userResponse.documents[0].name;
          setUserName(name);
          setForm(prev => ({ ...prev, serviceBoyName: name }));

          // Fetch bills for this service boy
          const billsResponse = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID,
            [
              Query.equal('serviceBoyName', name),
              Query.orderDesc('$createdAt')
            ]
          );
          setBills(billsResponse.documents as unknown as Bill[]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        Alert.alert('Error', 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAndBills();
  }, []);

  const generateBillNumber = () => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getDate().toString().padStart(2, '0')}`;
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `BILL-${dateStr}-${randomStr}`;
  };

  const validateForm = () => {
    if (!form.serviceType.trim()) {
      Alert.alert('Error', 'Service type is required');
      return false;
    }
    if (!form.customerName.trim()) {
      Alert.alert('Error', 'Customer name is required');
      return false;
    }
    if (!form.address.trim()) {
      Alert.alert('Error', 'Address is required');
      return false;
    }
    if (!form.contactNumber.trim() || !/^\d{10}$/.test(form.contactNumber)) {
      Alert.alert('Error', 'Valid 10-digit contact number is required');
      return false;
    }
    if (!form.serviceCharge.trim() || isNaN(parseFloat(form.serviceCharge))) {
      Alert.alert('Error', 'Valid service charge is required');
      return false;
    }
    if (paymentMethod === 'cash' && (!cashGiven.trim() || isNaN(parseFloat(cashGiven)))) {
      Alert.alert('Error', 'Valid cash amount is required');
      return false;
    }
    return true;
  };

  const handleSubmitBill = async () => {
    if (!validateForm()) return;
    if (!signature) {
      Alert.alert('Error', 'Customer signature is required');
      return;
    }

    const billNumber = generateBillNumber();
    const billData = {
      ...form,
      paymentMethod,
      total: calculateTotal(),
      cashGiven: paymentMethod === 'cash' ? cashGiven : null,
      change: paymentMethod === 'cash' ? calculateChange() : null,
      date: new Date().toISOString(),
      billNumber,
      status: 'paid',
      notes: notes.trim() || null,
      signature: signature
    };

    try {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        billNumber,
        billData
      );
      Alert.alert('Success', 'Bill saved successfully!');
      // Refresh bills list
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID,
        [
          Query.equal('serviceBoyName', userName),
          Query.orderDesc('$createdAt')
        ]
      );
      setBills(response.documents as unknown as Bill[]);
      
      setIsFormVisible(false);
      resetForm();
      setSignature(null);
    } catch (error) {
      console.error('Error saving bill:', error);
      Alert.alert('Error', 'Failed to save bill');
    }
  };

  const handlePrint = async () => {
    if (!selectedBill) return;
    const htmlContent = `
      <html>
        <head>
          <style>
            /* Your print styles here */
          </style>
        </head>
        <body>
          <!-- Your print HTML template here -->
        </body>
      </html>
    `;
    try {
      await Print.printAsync({ html: htmlContent });
    } catch (error) {
      console.error('Error printing:', error);
      Alert.alert('Print Failed', 'Unable to generate PDF');
    }
  };

  const resetForm = () => {
    setForm({
      serviceType: '',
      serviceBoyName: userName,
      customerName: '',
      address: '',
      contactNumber: '',
      serviceCharge: '',
    });
    setPaymentMethod('cash');
    setCashGiven('');
    setNotes('');
  };

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const calculateTotal = () => {
    const charge = parseFloat(form.serviceCharge) || 0;
    return charge.toFixed(2);
  };

  const calculateChange = () => {
    const total = parseFloat(calculateTotal()) || 0;
    const given = parseFloat(cashGiven) || 0;
    return given > total ? (given - total).toFixed(2) : '0.00';
  };

  const toggleFormVisibility = () => {
    setIsFormVisible(!isFormVisible);
    if (!isFormVisible) {
      resetForm();
    }
  };

  const showBillDetails = (bill: Bill) => {
    setSelectedBill(bill);
    setIsBillDetailVisible(true);
  };

  const closeBillDetails = () => {
    setIsBillDetailVisible(false);
    setSelectedBill(null);
  };

  const handleSignature = (signatureData: string) => {
    const base64Data = signatureData.replace('data:image/png;base64,', '');
    setSignature(base64Data);
    setIsSignatureVisible(false);
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>My Bills</Text>
        
        {isFormVisible ? (
          <>
            <Text style={styles.sectionTitle}>Service Details</Text>
            {Object.entries(form).map(([key, value]) => (
              <View key={key}>
                <Text style={styles.fieldLabel}>{fieldLabels[key as keyof typeof fieldLabels]}</Text>
                <TextInput
                  placeholder={`Enter ${fieldLabels[key as keyof typeof fieldLabels].toLowerCase()}`}
                  style={styles.input}
                  keyboardType={key === 'contactNumber' || key === 'serviceCharge' ? 'numeric' : 'default'}
                  value={value}
                  onChangeText={(text) => handleChange(key, text)}
                  editable={key !== 'serviceBoyName'} // Disable editing for service boy name
                />
              </View>
            ))}
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <TextInput
              placeholder="Enter any additional notes (optional)"
              style={[styles.input, styles.multilineInput]}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            <View style={styles.chargesContainer}>
              <View style={styles.chargeRow}>
                <Text style={styles.chargeLabel}>Service Charge:</Text>
                <Text style={styles.chargeValue}>₹{form.serviceCharge || '0.00'}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount:</Text>
                <Text style={styles.totalValue}>₹{calculateTotal()}</Text>
              </View>
            </View>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            <View style={styles.radioContainer}>
              <TouchableOpacity style={styles.radioOption} onPress={() => setPaymentMethod('cash')}>
                <View style={[styles.radioCircle, paymentMethod === 'cash' && styles.selected]} />
                <Text style={styles.radioText}>Cash</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.radioOption} onPress={() => setPaymentMethod('upi')}>
                <View style={[styles.radioCircle, paymentMethod === 'upi' && styles.selected]} />
                <Text style={styles.radioText}>UPI</Text>
              </TouchableOpacity>
            </View>
            {paymentMethod === 'cash' && (
              <View style={styles.cashContainer}>
                <Text style={styles.sectionTitle}>Cash Payment</Text>
                <TextInput
                  placeholder="Amount Given by Customer"
                  style={styles.input}
                  keyboardType="numeric"
                  value={cashGiven}
                  onChangeText={setCashGiven}
                />
                <View style={styles.changeContainer}>
                  <Text style={styles.changeLabel}>Change to Return:</Text>
                  <Text style={styles.changeValue}>₹{calculateChange()}</Text>
                </View>
              </View>
            )}
            {paymentMethod === 'upi' && (
              <View style={styles.upiContainer}>
                <Text style={styles.sectionTitle}>Scan UPI QR Code</Text>
                <Image
                  source={require('../../assets/images/payment.jpg')}
                  style={styles.qrCode}
                />
                <Text style={styles.upiId}>UPI ID: yourupi@bank</Text>
              </View>
            )}
            {signature ? (
              <View style={styles.signatureContainer}>
                <Text style={styles.signatureLabel}>Customer Signature:</Text>
                <Image
                  source={{ uri: `data:image/png;base64,${signature}` }}
                  style={styles.signatureImage}
                />
                <TouchableOpacity
                  style={styles.changeSignatureButton}
                  onPress={() => setIsSignatureVisible(true)}
                >
                  <Text style={styles.changeSignatureText}>Change Signature</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addSignatureButton}
                onPress={() => setIsSignatureVisible(true)}
              >
                <Text style={styles.addSignatureText}>+ Add Customer Signature</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmitBill}>
              <Text style={styles.submitText}>Submit Bill</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.billsContainer}>
            <View style={styles.header}>
              <Text style={styles.sectionTitle}>Recent Bills</Text>
              <View style={styles.headerCountContainer}>
                <Text style={styles.headerCountText}>{bills.length}</Text>
              </View>
            </View>

            {isLoading ? (
              <Text>Loading bills...</Text>
            ) : bills.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No bills found</Text>
                <Text style={styles.emptySubtext}>You haven't created any bills yet</Text>
              </View>
            ) : (
              bills.map((bill) => (
                <View key={bill.$id} style={styles.billCard}>
                  <View style={styles.billHeader}>
                    <Text style={styles.billCustomer}>{bill.customerName}</Text>
                    <View style={styles.amountContainer}>
                      <Text style={styles.billAmount}>₹{bill.total}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => showBillDetails(bill)}>
                    <View style={styles.billSubHeader}>
                      <Text style={styles.billNumber}>{bill.billNumber}</Text>
                      <Text style={[
                        styles.billStatus,
                        bill.status === 'paid' && styles.statusPaid,
                        bill.status === 'pending' && styles.statusPending,
                        bill.status === 'cancelled' && styles.statusCancelled
                      ]}>
                        {bill.status}
                      </Text>
                    </View>
                    {bill.notes && <Text style={styles.billNotes}>{bill.notes}</Text>}
                    <View style={styles.billFooter}>
                      <Text style={styles.billService}>{bill.serviceType}</Text>
                      <Text style={styles.billDate}>
                        {new Date(bill.date).toLocaleDateString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Bill Details Modal */}
      <Modal
        visible={isBillDetailVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeBillDetails}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedBill && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Bill Details</Text>
                  <TouchableOpacity onPress={closeBillDetails}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalContent}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Bill Number :</Text>
                    <Text style={styles.detailValue}>{selectedBill.billNumber}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Service Type :</Text>
                    <Text style={styles.detailValue}>{selectedBill.serviceType}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Engineer Name :</Text>
                    <Text style={styles.detailValue}>{selectedBill.serviceBoyName}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Customer Name :</Text>
                    <Text style={styles.detailValue}>{selectedBill.customerName}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Contact Number :</Text>
                    <Text style={styles.detailValue}>{selectedBill.contactNumber}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Address :</Text>
                    <Text style={styles.detailValue}>{selectedBill.address}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Service Charge :</Text>
                    <Text style={styles.detailValue}>₹{selectedBill.serviceCharge}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Service Commission :</Text>
                    <Text style={styles.detailValue}>
                      ₹{(parseFloat(selectedBill.serviceCharge) * 0.25).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Payment Method :</Text>
                    <Text style={styles.detailValue}>{selectedBill.paymentMethod}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Cash given by customer :</Text>
                    <Text style={styles.detailValue}>{selectedBill.cashGiven}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Change given by engineer :</Text>
                    <Text style={styles.detailValue}>{selectedBill.change}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Created At :</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedBill.$createdAt || '').toLocaleString()}
                    </Text>
                  </View>
                  {selectedBill?.signature && (
                    <View style={styles.signatureContainer}>
                      <Text style={styles.signatureLabel}>Customer Signature:</Text>
                      <Image
                        source={{ uri: `data:image/png;base64,${selectedBill.signature}` }}
                        style={styles.signatureImage}
                      />
                    </View>
                  )}
                  <View style={styles.modalFooter}>
                    <TouchableOpacity 
                      style={[styles.printButton, styles.actionButton]}
                      onPress={handlePrint}
                    >
                      <Ionicons name="print" size={20} color="#fff" />
                      <Text style={styles.printButtonText}>Print</Text>
                    </TouchableOpacity>
                    {/* <TouchableOpacity
                      style={[styles.deleteButton, styles.actionButton]}
                      onPress={() => handleDeleteBill(selectedBill.$id)}
                    >
                      <Text style={styles.printButtonText}>Delete</Text>
                    </TouchableOpacity> */}
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Signature Modal */}
      {isSignatureVisible && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={isSignatureVisible}
          onRequestClose={() => setIsSignatureVisible(false)}
        >
          <View style={styles.signatureModalContainer}>
            <View style={styles.signatureModalContent}>
              <Text style={styles.signatureTitle}>Please sign below</Text>
              <View style={styles.signatureWrapper}>
                <SignatureScreen
                  onOK={handleSignature}
                  onEmpty={() => Alert.alert('Error', 'Please provide a signature')}
                  descriptionText=""
                  clearText="Clear"
                  confirmText="Save"
                  webStyle={`
                    .m-signature-pad {
                      box-shadow: none;
                      border: none;
                      margin: 0;
                      padding: 0;
                      height: 100%;
                    }
                    .m-signature-pad--body {
                      border: none;
                      height: calc(100% - 60px);
                    }
                    .m-signature-pad--footer {
                      height: 60px;
                      margin: 0;
                      padding: 10px;
                      background: white;
                    }
                    body, html {
                      background-color: #fff;
                      margin: 0;
                      padding: 0;
                      height: 100%;
                    }
                    canvas {
                      background-color: #fff;
                    }
                  `}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

      <TouchableOpacity style={styles.fab} onPress={toggleFormVisibility}>
        <Ionicons name={isFormVisible ? 'close' : 'add'} size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default UserBill;
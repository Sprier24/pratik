import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  Modal, 
  SafeAreaView, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform,
  RefreshControl // Added missing import
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from '../constants/UserDetailsForm.styles';
import { footerStyles } from '../constants/footer';
import Constants from 'expo-constants';

type User = {
  id?: string;
  engineerName: string;
  address: string;
  contactNumber: string;
  email: string;
  city: string;
  createdAt?: string;
  updatedAt?: string;
};

const fieldLabels = {
  engineerName: 'Engineer Name',
  contactNumber: 'Contact Number',
  email: 'Email Address',
  address: 'Address',
  city: 'Hometown',
};

const BASE_URL = `${Constants.expoConfig?.extra?.apiUrl}/engineer`;

async function fetchUsers(): Promise<User[]> {
  try {
    const res = await fetch(BASE_URL);
    const data = await res.json();

    // Handle both response formats for compatibility
    if (data.success && Array.isArray(data.result)) {
      return data.result;
    }
    
    if (data.result && Array.isArray(data.result)) {
      return data.result;
    }

    console.error('API did not return expected format:', data);
    return [];
  } catch (error) {
    console.error('Fetch error:', error);
    return [];
  }
}

async function createUser(user: Omit<User, 'id'>): Promise<string> {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  const data = await res.json();
  
  if (data.success) {
    return data.id;
  } else {
    throw new Error(data.message || 'Failed to create engineer');
  }
}

async function updateUser(id: string, user: Omit<User, 'id'>): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user),
  });
  
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to update engineer');
  }
}

async function deleteUser(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, { 
    method: 'DELETE' 
  });
  
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to delete engineer');
  }
}

function formatToAmPm(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid date';
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  return date.toLocaleString(undefined, options);
}

const UserDetailsForm = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [formData, setFormData] = useState({
    engineerName: '',
    address: '',
    contactNumber: '',
    email: '',
    city: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [submittedUsers, setSubmittedUsers] = useState<User[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserDetailVisible, setIsUserDetailVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchUsersData();
  }, []);

  const fetchUsersData = async () => {
    setIsLoading(true);
    try {
      const users = await fetchUsers();
      if (!Array.isArray(users)) {
        throw new Error('Invalid response format: expected array');
      }
      setSubmittedUsers(users);
    } catch (error: any) {
      console.error('Fetch error:', error);
      setSubmittedUsers([]);
      Alert.alert('Error', error.message || 'Failed to fetch engineers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const users = await fetchUsers();
      setSubmittedUsers(users);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to refresh engineers');
    } finally {
      setRefreshing(false);
    }
  };

  const cleanDocumentData = (doc: any) => {
    const {
      engineerName,
      address,
      contactNumber,
      email,
      city
    } = doc;
    return {
      engineerName: engineerName ?? '',
      address: address ?? '',
      contactNumber: contactNumber ?? '',
      email: email ?? '',
      city: city ?? ''
    };
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        setIsLoading(true);
        const engineerData = {
          engineerName: formData.engineerName,
          address: formData.address,
          contactNumber: formData.contactNumber,
          email: formData.email,
          city: formData.city
        };

        if (editingIndex !== null && submittedUsers[editingIndex]?.id) {
          await updateUser(submittedUsers[editingIndex].id, engineerData);
          const updatedUsers = [...submittedUsers];
          updatedUsers[editingIndex] = {
            ...updatedUsers[editingIndex],
            ...engineerData,
            updatedAt: new Date().toISOString()
          };
          setSubmittedUsers(updatedUsers);
          setEditingIndex(null);
          Alert.alert('Success', 'Engineer details updated successfully.');
        } else {
          const newUserId = await createUser(engineerData);
          const newUserObj: User = {
            ...engineerData,
            id: newUserId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          setSubmittedUsers(prev => [newUserObj, ...prev]);
          Alert.alert('Success', 'Engineer details saved successfully.');
        }
        resetForm();
        setIsFormVisible(false);
      } catch (error: any) {
        Alert.alert('Error', error?.message || 'Failed to save engineer details');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDeleteUser = async (index: number) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this engineer?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            setIsLoading(true);
            const userId = submittedUsers?.[index]?.id;
            if (!userId) throw new Error('Missing Engineer ID.');
            await deleteUser(userId);
            setSubmittedUsers(users => users.filter(user => user.id !== userId));
            if (editingIndex === index) {
              setEditingIndex(null);
              resetForm();
            }
            Alert.alert('Success', 'Engineer details deleted successfully.');
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete engineer details');
          } finally {
            setIsLoading(false);
          }
        }
      }
    ]);
  };

  const resetForm = () => {
    setFormData({
      engineerName: '',
      address: '',
      contactNumber: '',
      email: '',
      city: '',
    });
    setErrors({});
    setEditingIndex(null);
  };

  const validateForm = () => {
    let valid = true;
    const newErrors: { [key: string]: string } = {};

    if (!formData.engineerName.trim()) {
      newErrors.engineerName = 'Engineer Name is required';
      valid = false;
    }

    if (!formData.contactNumber.trim() || !/^[0-9]{10}$/.test(formData.contactNumber)) {
      newErrors.contactNumber = 'Invalid contact number (10 digits required)';
      valid = false;
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
      valid = false;
    }

    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
      valid = false;
    }

    if (!formData.city.trim()) {
      newErrors.city = 'Hometown is required';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const showUserDetails = (user: User) => {
    setSelectedUser(user);
    setIsUserDetailVisible(true);
  };

  const closeUserDetails = () => {
    setIsUserDetailVisible(false);
    setSelectedUser(null);
  };

  const toggleFormVisibility = () => {
    setIsFormVisible(!isFormVisible);
    if (!isFormVisible) {
      resetForm();
    }
  };

  const filteredUsers = submittedUsers.filter(user =>
    user.engineerName?.toLowerCase().includes(searchText.toLowerCase()) ||
    user.contactNumber?.includes(searchText) ||
    user.email?.toLowerCase().includes(searchText.toLowerCase())
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5E72E4" />
        <Text style={{ marginTop: 10, color: '#718096', fontSize: 16 }}>Loading engineers...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.push('/home')}>
            <MaterialIcons name="arrow-back" size={25} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Engineer Management</Text>
        </View>
        <View style={styles.headerCount}>
          <Text style={styles.headerCountText}>{submittedUsers.length}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContainer, { paddingBottom: insets.bottom + 120 }]} 
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#5E72E4']}
            />
          }
        >
          {isFormVisible ? (
            <View style={styles.formContainer}>
              <Text style={styles.sectionTitle}>
                {editingIndex !== null ? 'Update Engineer' : 'Create Engineer'}
              </Text>

              {Object.entries(formData).map(([key, value]) => {
                const currentValue = value || '';
                const label = fieldLabels[key as keyof typeof fieldLabels] || key;
                return (
                  <View key={key} style={styles.formGroup}>
                    <Text style={styles.inputLabel}>{label}</Text>
                    <TextInput
                      placeholder={`Enter ${label.toLowerCase()}`}
                      style={[
                        styles.input,
                        key === 'address' && styles.textArea,
                        errors[key] && styles.inputError
                      ]}
                      value={currentValue}
                      onChangeText={(text) => handleChange(key, text)}
                      keyboardType={
                        key === 'contactNumber' ? 'numeric' :
                        key === 'email' ? 'email-address' : 'default'
                      }
                      maxLength={key === 'contactNumber' ? 10 : undefined}
                      autoCapitalize={key === 'email' ? 'none' : 'words'}
                      multiline={key === 'address'}
                      numberOfLines={key === 'address' ? 3 : 1}
                    />
                    {errors[key] && <Text style={styles.errorText}>{errors[key]}</Text>}
                  </View>
                );
              })}

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.submitButton]}
                  onPress={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.actionButtonText}>
                      {editingIndex !== null ? 'Update Engineer' : 'Create Engineer'}
                    </Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#A0AEC0' }]}
                  onPress={() => {
                    resetForm();
                    setIsFormVisible(false);
                  }}
                  disabled={isLoading}
                >
                  <Text style={[styles.actionButtonText]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.usersContainer}>
              {submittedUsers.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialIcons name="engineering" size={50} color="#A0AEC0" />
                  <Text style={styles.emptyText}>No engineers added yet</Text>
                  <Text style={styles.emptySubtext}>Tap the + button to add a new engineer</Text>
                </View>
              ) : (
                filteredUsers.map((user, index) => (
                  <TouchableOpacity
                    key={user.id || `user-${index}`}
                    style={styles.userCard}
                    onPress={() => showUserDetails(user)}
                  >
                    <View style={styles.userHeader}>
                      <View style={styles.userAvatar}>
                        <MaterialIcons name="engineering" size={25} color="#5E72E4" />
                      </View>
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user.engineerName}</Text>
                        <Text style={styles.userContact}>{user.contactNumber}</Text>
                      </View>
                    </View>
                    <View style={styles.userFooter}>
                      <Text style={styles.userEmail}>{user.email}</Text>
                      <Text style={styles.userDate}>
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={isUserDetailVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeUserDetails}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {selectedUser && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Engineer Details</Text>
                  <TouchableOpacity onPress={closeUserDetails}>
                    <Feather name="x" size={25} color="#2D3748" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent}>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Basic Information</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Name:</Text>
                      <Text style={styles.detailValue}>{selectedUser.engineerName}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Contact Number:</Text>
                      <Text style={styles.detailValue}>{selectedUser.contactNumber}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Email Address:</Text>
                      <Text style={styles.detailValue}>{selectedUser.email}</Text>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Address Details</Text>
                    <View style={styles.detailRow1}>
                      <Text style={styles.detailLabel}>Address:</Text>
                      <Text style={styles.detailValue}>{selectedUser.address}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Hometown:</Text>
                      <Text style={styles.detailValue}>{selectedUser.city}</Text>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Additional Information</Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Engineer Joined Date:</Text>
                      <Text style={styles.detailValue}>
                        {selectedUser.createdAt ? formatToAmPm(selectedUser.createdAt) : 'N/A'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.editButton]}
                      onPress={() => {
                        setFormData(cleanDocumentData(selectedUser));
                        const index = submittedUsers.findIndex(u => u.id === selectedUser.id);
                        if (index !== -1) {
                          setEditingIndex(index);
                        }
                        setIsFormVisible(true);
                        closeUserDetails();
                      }}
                    >
                      <Feather name="edit" size={20} color="#FFF" />
                      <Text style={styles.actionButtonText}>Update</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => {
                        const index = submittedUsers.findIndex(u => u.id === selectedUser.id);
                        if (index !== -1) {
                          handleDeleteUser(index);
                        }
                        closeUserDetails();
                      }}
                    >
                      <Feather name="trash-2" size={20} color="#FFF" />
                      <Text style={styles.actionButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        style={styles.fab}
        onPress={toggleFormVisibility}
        disabled={isLoading}
      >
        <Feather name={isFormVisible ? 'x' : 'plus'} size={24} color="#FFF" />
      </TouchableOpacity>

      <View style={[footerStyles.bottomBar, { paddingBottom: insets.bottom || 20, marginTop: 40 }]}>
        <TouchableOpacity
          style={footerStyles.bottomButton}
          onPress={() => router.push('/service')}
        >
          <View style={footerStyles.bottomButtonIcon}>
            <MaterialIcons name="construction" size={20} color="#5E72E4" />
          </View>
          <Text style={footerStyles.bottomButtonText}>Service</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[footerStyles.bottomButton, footerStyles.bottomButtonActive]}
          onPress={() => router.push('/user')}
        >
          <View style={[footerStyles.bottomButtonIcon, footerStyles.bottomButtonIconActive]}>
            <MaterialIcons name="engineering" size={25} color="#FFF" />
          </View>
          <Text style={[footerStyles.bottomButtonText, footerStyles.bottomButtonTextActive]}>Engineers</Text>
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

        {/* <TouchableOpacity
          style={footerStyles.bottomButton}
          onPress={() => router.push('/userphotos')}
        >
          <View style={footerStyles.bottomButtonIcon}>
            <MaterialIcons name="photo-library" size={20} color="#5E72E4" />
          </View>
          <Text style={footerStyles.bottomButtonText}>Photos</Text>
        </TouchableOpacity> */}

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

export default UserDetailsForm;
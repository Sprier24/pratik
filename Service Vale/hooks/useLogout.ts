// hooks/useLogout.ts
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export const useLogout = () => {
  const logout = async (showAlert: boolean = true) => {
    try {
      // Clear all user data from storage
      await AsyncStorage.multiRemove(['userData']);
      
      // CRITICAL: Use replace to clear navigation stack and go to login
      router.replace('/login');
      
      if (showAlert) {
        Alert.alert('Success', 'Logged out successfully');
      }
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout');
    }
  };

  return { logout };
};
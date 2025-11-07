import React, { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';

export default function NotificationListener() {
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener((notification) => {
      const { title, body } = notification.request.content;
      Alert.alert(title || 'Notification', body || '');
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return null;
}

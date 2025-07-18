import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, SafeAreaView, ScrollView, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getIndieNotificationInbox, deleteIndieNotificationInbox } from 'native-notify';
import { account } from '../../lib/appwrite';
import { styles } from '../../constants/userapp/notification';
import { APP_ID, APP_TOKEN } from '../../constants/nativeNotify';

type NotificationInboxProps = {
    navigation: any;
    AppState: any;
};

type NotificationItem = {
    notification_id: string;
    title: string;
    message: string;
    date: string;
};

export default function UserNotificationInbox({ navigation, AppState }: NotificationInboxProps) {
    const [data, setData] = useState<NotificationItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [subId, setSubId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const getCurrentUserEmail = async () => {
        try {
            const user = await account.get();
            return user.email;
        } catch (error) {
            console.error("Error getting current user:", error);
            return null;
        }
    };

    const fetchNotifications = async () => {
        setRefreshing(true);
        setIsLoading(true);
        try {
            const userEmail = await getCurrentUserEmail();
            if (!userEmail) {
                Alert.alert("Error", "Could not fetch user information");
                return;
            }
            setSubId(userEmail);
            const notifications = await getIndieNotificationInbox(
                userEmail,
                APP_ID,
                APP_TOKEN,
                10,
                0
            );
            console.log("Indie notifications: ", notifications);
            setData(notifications);
        } catch (error) {
            console.error("Error fetching indie notifications:", error);
            Alert.alert("Error", "Failed to load notifications");
        } finally {
            setRefreshing(false);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const onRefresh = () => {
        fetchNotifications();
    };

    const handleDeleteNotification = async (notificationId: string) => {
        if (!subId) {
            Alert.alert("Error", "User not identified");
            return;
        }
        try {
            const updatedNotifications = await deleteIndieNotificationInbox(
                subId,
                notificationId,
                APP_ID,
                APP_TOKEN
            );

            setData(updatedNotifications);
            Alert.alert("Success", "Notification deleted");
        } catch (error) {
            console.error("Error deleting notification:", error);
            Alert.alert("Error", "Failed to delete notification");
        }
    };

    const clearAllNotifications = async () => {
        if (!subId) {
            Alert.alert("Error", "User not identified");
            return;
        }
        try {
            const deletePromises = data.map((notification) =>
                deleteIndieNotificationInbox(
                    subId,
                    notification.notification_id,
                    APP_ID,
                    APP_TOKEN
                )
            );
            await Promise.all(deletePromises);
            setData([]);
            Alert.alert("Success", "All notifications cleared");
        } catch (error) {
            console.error("Error clearing notifications:", error);
            Alert.alert("Error", "Failed to clear notifications");
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#5E72E4" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => router.push('/userapp/home')}>
                        <MaterialIcons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Notifications</Text>
                </View>
                {data.length > 0 ? (
                    <TouchableOpacity onPress={clearAllNotifications}>
                        <MaterialIcons name="delete" size={24} color="#fff" />
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 24 }} />
                )}
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#5E72E4"
                    />
                }
            >
                {data.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="notifications-off" size={48} color="#ccc" />
                        <Text style={styles.noNotificationText}>No notifications</Text>
                        <Text style={styles.emptySubtext}>Pull down to refresh</Text>
                    </View>
                ) : (
                    <FlatList
                        scrollEnabled={false}
                        data={data}
                        keyExtractor={item => item.notification_id}
                        renderItem={({ item }) => (
                            <View style={styles.notificationCard}>
                                <View style={styles.notificationHeader}>
                                    <Ionicons name="notifications" size={20} color="#5E72E4" />
                                    <Text style={styles.title}>{item.title}</Text>
                                </View>
                                <Text style={styles.description}>{item.message}</Text>
                                <View style={styles.footer}>
                                    <Text style={styles.time}>{item.date}</Text>
                                    <TouchableOpacity
                                        style={styles.dismissButton}
                                        onPress={() => handleDeleteNotification(item.notification_id)}
                                    >
                                        <Text style={styles.close}>Dismiss</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                        contentContainerStyle={styles.listContainer}
                    />
                )}
            </ScrollView>
        </SafeAreaView>
    );
}


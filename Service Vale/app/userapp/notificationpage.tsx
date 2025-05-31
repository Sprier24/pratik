import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Platform,
    StatusBar,
    RefreshControl,
    Alert
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { databases, account } from '../../lib/appwrite';
import { Query } from 'appwrite';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

const DATABASE_ID = '681c428b00159abb5e8b';
const NOTIFICATIONS_COLLECTION = 'note_id';

const AdminNotificationPage = () => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [previousCount, setPreviousCount] = useState(0);
    const [userEmail, setUserEmail] = useState('');
    const soundRef = useRef<Audio.Sound | null>(null);

    // Load notification sound
    useEffect(() => {
        const loadSound = async () => {
            const { sound } = await Audio.Sound.createAsync(
                require('../../assets/sounds/notification.mp3')
            );
            soundRef.current = sound;
        };

        loadSound();

        return () => {
            if (soundRef.current) {
                soundRef.current.unloadAsync();
            }
        };
    }, []);

    const fetchNotifications = async (email: string) => {
        try {
            const res = await databases.listDocuments(
                DATABASE_ID,
                NOTIFICATIONS_COLLECTION,
                [
                    Query.equal('userEmail', email),
                    Query.orderDesc('createdAt')
                ]
            );

            const newNotifications = res.documents.filter(doc => !doc.isRead);

            if (newNotifications.length > previousCount) {
                playNotificationSound();
            }

            setNotifications(newNotifications);
            setPreviousCount(newNotifications.length);
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch notifications');
        } finally {
            setRefreshing(false);
        }
    };

    const playNotificationSound = async () => {
        try {
            if (soundRef.current) {
                await soundRef.current.replayAsync();
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.log('Error playing sound', error);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await databases.updateDocument(DATABASE_ID, NOTIFICATIONS_COLLECTION, id, {
                isRead: true
            });
            fetchNotifications(userEmail);
        } catch (error) {
            Alert.alert('Error', 'Failed to mark as read');
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        if (userEmail) {
            fetchNotifications(userEmail);
        }
    };

    useEffect(() => {
        const getUserAndFetch = async () => {
            try {
                const user = await account.get();
                setUserEmail(user.email);
                fetchNotifications(user.email);
            } catch (err) {
                Alert.alert('Error', 'Failed to get user data');
            }
        };

        getUserAndFetch();
    }, []);

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.notificationCard}>
            <View style={styles.notificationHeader}>
                <Ionicons name="notifications" size={20} color="#5E72E4" />
                <Text style={styles.title}>{item.title || 'Service Update'}</Text>
            </View>
            <Text style={styles.description}>{item.description}</Text>
            <View style={styles.footer}>
                <Text style={styles.time}>{new Date(item.$createdAt).toLocaleString()}</Text>
                <TouchableOpacity onPress={() => markAsRead(item.$id)} style={styles.dismissButton}>
                    <Text style={styles.close}>Dismiss</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push('/userapp/home')}>
                    <MaterialIcons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <View style={{ width: 24 }} />
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
                {notifications.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="notifications-off" size={48} color="#ccc" />
                        <Text style={styles.noNotificationText}>No new notifications</Text>
                        <Text style={styles.emptySubtext}>Pull down to refresh</Text>
                    </View>
                ) : (
                    <FlatList
                        scrollEnabled={false}
                        data={notifications}
                        keyExtractor={(item) => item.$id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.listContainer}
                    />
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa'
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 40,
        paddingBottom: 20,
        backgroundColor: "#5E72E4",
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#FFF",
    },
    scrollContainer: {
        flexGrow: 1,
        paddingBottom: 20
    },
    listContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100
    },
    notificationCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderLeftWidth: 4,
        borderLeftColor: '#5E72E4'
    },
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8
    },
    title: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#2d3748'
    },
    description: {
        color: '#4a5568',
        marginBottom: 12,
        lineHeight: 20
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    time: {
        fontSize: 12,
        color: '#718096'
    },
    dismissButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#fff1f2'
    },
    close: {
        color: '#dc2626',
        fontWeight: '500'
    },
    noNotificationText: {
        textAlign: 'center',
        color: '#666',
        marginTop: 16,
        fontSize: 18,
        fontWeight: '500'
    },
    emptySubtext: {
        textAlign: 'center',
        color: '#a0aec0',
        marginTop: 8
    }
});

export default AdminNotificationPage;
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, SafeAreaView, ScrollView, RefreshControl, Platform, StatusBar } from 'react-native';
import { getNotificationInbox } from 'native-notify';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

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

export default function NotificationInbox({ navigation, AppState }: NotificationInboxProps) {
    const [data, setData] = useState<NotificationItem[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = async () => {
        setRefreshing(true);
        try {
            const notifications = await getNotificationInbox(31214, 'NaLjQl8mbwbQbKWRlsWgZZ', 10, 0);
            console.log("notifications: ", notifications);
            setData(notifications);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const onRefresh = () => {
        fetchNotifications();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.push('/home')}>
                    <MaterialIcons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                {data.length > 0 ? (
                    <TouchableOpacity>
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
                                    <TouchableOpacity style={styles.dismissButton}>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f8f9fa",
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
        paddingBottom: 20,
    },
    listContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingTop: 100,
    },
    notificationCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderLeftWidth: 4,
        borderLeftColor: "#5E72E4",
    },
    notificationHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    title: {
        fontWeight: "bold",
        fontSize: 16,
        color: "#2d3748",
        marginLeft: 8,
    },
    description: {
        color: "#4a5568",
        marginBottom: 12,
        lineHeight: 20,
    },
    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    time: {
        fontSize: 12,
        color: "#718096",
    },
    dismissButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: "#fff1f2",
    },
    close: {
        color: "#dc2626",
        fontWeight: "500",
    },
    noNotificationText: {
        textAlign: "center",
        color: "#666",
        marginTop: 16,
        fontSize: 18,
        fontWeight: "500",
    },
    emptySubtext: {
        textAlign: "center",
        color: "#a0aec0",
        marginTop: 8,
    },
});
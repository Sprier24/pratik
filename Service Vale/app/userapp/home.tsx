import React from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { styles } from '../../constants/userapp/HomeScreenuser.styles';

const { width } = Dimensions.get('window');

const HomeScreenuser = () => {
    const dailyRevenue = 5000;
    const monthlyRevenue = 150000;
    const pendingServices = [
        { id: '1', title: 'Oil Change - Car A', status: 'Pending' },
        { id: '2', title: 'Brake Inspection - Car B', status: 'Pending' },
        { id: '3', title: 'Engine Repair - Car G', status: 'Pending' },
    ];
    const completedServices = [
        { id: '6', title: 'Engine Repair - Car C', status: 'Completed' },
        { id: '7', title: 'Tire Replacement - Car D', status: 'Completed' },
        { id: '8', title: 'Tire Replacement - Car H', status: 'Completed' }
    ];
    const pendingServicesCount = pendingServices.length;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Service Dashboard</Text>
                    <TouchableOpacity style={styles.notificationIcon}>
                        <MaterialIcons name="notifications" size={24} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => router.replace('/login')}
                        style={[styles.notificationIcon, { marginLeft: 10, backgroundColor: '#e74c3c' }]}
                    >
                        <MaterialIcons name="logout" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>
                <View style={styles.revenueContainer}>
                    <View style={[styles.card, styles.dailyRevenue]}>
                        <Text style={styles.cardTitle}>Daily Revenue</Text>
                        <Text style={styles.cardAmount}>₹{dailyRevenue.toLocaleString()}</Text>
                        <View style={styles.cardTrend}>
                            <AntDesign name="arrowup" size={14} color="#fff" />
                            <Text style={styles.trendText}>12% from yesterday</Text>
                        </View>
                    </View>
                    <View style={[styles.card, styles.monthlyRevenue]}>
                        <Text style={styles.cardTitle}>Monthly Revenue</Text>
                        <Text style={styles.cardAmount}>₹{monthlyRevenue.toLocaleString()}</Text>
                        <View style={styles.cardTrend}>
                            <AntDesign name="arrowup" size={14} color="#fff" />
                            <Text style={styles.trendText}>8% from last month</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.servicesContainer}>
                    <View style={[styles.card, styles.pendingCard]}>
                        <View style={styles.cardHeader}>
                            <MaterialIcons name="pending-actions" size={24} color="#e67e22" />
                            <Text style={styles.cardTitle}>Pending          Services</Text>
                        </View>
                        <Text style={styles.cardCount}>{pendingServicesCount}</Text>
                        <TouchableOpacity
                            style={styles.viewButton}
                            onPress={() => router.push('/pending')}
                        >
                            <Text style={styles.viewButtonText}>View All</Text>
                            <AntDesign name="right" size={16} color="#3498db" />
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.card, styles.completedCard]}>
                        <View style={styles.cardHeader}>
                            <MaterialIcons name="check-circle" size={24} color="#27ae60" />
                            <Text style={styles.cardTitle}>Completed Services</Text>
                        </View>
                        <Text style={styles.cardCount}>{completedServices.length}</Text>
                        <TouchableOpacity
                            style={styles.viewButton}
                            onPress={() => router.push('/completed')}
                        >
                            <Text style={styles.viewButtonText}>View All</Text>
                            <AntDesign name="right" size={16} color="#3498db" />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                    <View style={styles.activityCard}>
                        <View style={styles.activityItem}>
                            <View style={[styles.activityIcon, { backgroundColor: '#e8f4f8' }]}>
                                <MaterialIcons name="car-repair" size={20} color="#3498db" />
                            </View>
                            <View style={styles.activityText}>
                                <Text style={styles.activityTitle}>Oil Change Completed</Text>
                                <Text style={styles.activityTime}>10 minutes ago</Text>
                            </View>
                        </View>
                        <View style={styles.activityItem}>
                            <View style={[styles.activityIcon, { backgroundColor: '#f0f8e8' }]}>
                                <MaterialIcons name="directions-car" size={20} color="#2ecc71" />
                            </View>
                            <View style={styles.activityText}>
                                <Text style={styles.activityTitle}>New Vehicle Added</Text>
                                <Text style={styles.activityTime}>1 hour ago</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
            <View style={styles.bottomBar}>
                <TouchableOpacity
                    style={styles.bottomButton}
                    onPress={() => router.push('/userapp/userprofile')}
                >
                    <MaterialIcons name="people" size={24} color="#3498db" />
                    <Text style={styles.bottomButtonText}>User</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.bottomButton}
                    onPress={() => router.push('/bill')}
                >
                    <MaterialIcons name="receipt" size={24} color="#3498db" />
                    <Text style={styles.bottomButtonText}>Bill</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default HomeScreenuser;
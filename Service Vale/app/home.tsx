import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const getCurrentMonthYear = () => {
    const now = new Date();
    return now.toLocaleString('default', { month: 'long', year: 'numeric' });
};

const HomeScreen = () => {
    const monthYear = getCurrentMonthYear();

    const pendingServices = [
        { id: '1', title: 'Oil Change - Car A' },
        { id: '2', title: 'Brake Inspection - Car B' },
    ];

    const completedServices = [
        { id: '1', title: 'Engine Repair - Car C' },
        { id: '2', title: 'Tire Replacement - Car D' },
    ];

    const handleLogout = () => {
        Alert.alert(
            'Confirm Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: () => router.replace('/login') },
            ],
            { cancelable: true }
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>

                <Text style={styles.monthYearText}>{monthYear}</Text>
                <View style={styles.revenueBox}>
                    <Text style={styles.headerText}>Daily Revenue: ₹5,000</Text>
                    <Text style={styles.headerText}>Monthly Revenue: ₹1,50,000</Text>
                </View>

                <Text style={styles.monthYearText}>{monthYear}</Text>
                <View style={styles.serviceSummaryBox}>
                    <Text style={styles.subHeaderText}>Pending Services: {pendingServices.length}</Text>
                    <Text style={styles.subHeaderText}>Completed Services: {completedServices.length}</Text>
                </View>

                <Text style={styles.monthYearText}>{monthYear}</Text>
                <Text style={styles.tableHeader}>Pending Services</Text>
                <FlatList
                    data={pendingServices}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.row}>
                            <Text>{item.title}</Text>
                        </View>
                    )}
                />

                <Text style={styles.monthYearText}>{monthYear}</Text>
                <Text style={styles.tableHeader}>Completed Services</Text>
                <FlatList
                    data={completedServices}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.row}>
                            <Text>{item.title}</Text>
                        </View>
                    )}
                />

                {/* Bottom Navigation Bar */}
                <View style={styles.bottomBar}>
                    <TouchableOpacity
                        style={styles.bottomButton}
                        onPress={() => router.push('/service')}
                    >
                        <Text style={styles.bottomButtonText}>Service</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.bottomButton}>
                        <Text style={styles.bottomButtonText}>User</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.bottomButton}>
                        <Text style={styles.bottomButtonText}>Bill</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
        padding: 16,
    },
    logoutButton: {
        alignSelf: 'flex-end',
        backgroundColor: '#ff4d4d',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 10,
    },
    logoutButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    monthYearText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 6,
        marginTop: 10,
    },
    revenueBox: {
        backgroundColor: '#d1e7dd',
        padding: 16,
        borderRadius: 10,
        marginBottom: 10,
    },
    serviceSummaryBox: {
        backgroundColor: '#f8d7da',
        padding: 16,
        borderRadius: 10,
        marginBottom: 10,
    },
    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    subHeaderText: {
        fontSize: 16,
    },
    tableHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    row: {
        backgroundColor: '#f1f1f1',
        padding: 10,
        borderRadius: 5,
        marginBottom: 5,
    },
    bottomBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 10,
        backgroundColor: '#f1f1f1',
        borderTopWidth: 1,
        borderTopColor: '#ddd',
    },
    bottomButton: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    bottomButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
});

export default HomeScreen;

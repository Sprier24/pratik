import React from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';

const Home: React.FC = () => {
    const handlePress = () => {
        Alert.alert('Button Pressed', 'You pressed the button!');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome to the Home Screen</Text>
            <Button title="Press Me" onPress={handlePress} />
        </View>
    );
};

export default Home;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    title: {
        fontSize: 24,
        fontWeight: '600',
        marginBottom: 20,
    },
});

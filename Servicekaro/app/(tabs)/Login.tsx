import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LoginScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [forgotModalVisible, setForgotModalVisible] = useState(false);
    const [resetModalVisible, setResetModalVisible] = useState(false);

    const [forgotEmail, setForgotEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleLogin = () => {
        if (email === '' || password === '') {
            Alert.alert('Error', 'Please fill in all fields');
        } else {
            Alert.alert('Success', `Logged in as ${email}`);
        }
    };

    const handleForgotPassword = () => {
        setForgotModalVisible(true);
    };

    const handleNewRegister = () => {
        Alert.alert('New Register', 'You can register a new account here.');
    };

    const handleSendOTP = () => {
        if (forgotEmail === '') {
            Alert.alert('Error', 'Please enter your email');
        } else {
            Alert.alert('OTP Sent', `An OTP has been sent to ${forgotEmail}`);
            setForgotModalVisible(false);
            setResetModalVisible(true); // Show reset password modal
        }
    };

    const handleResetPassword = () => {
        if (!newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
        } else if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
        } else {
            Alert.alert('Success', 'Your password has been reset');
            setResetModalVisible(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Forgot Password Modal */}
            <Modal
                transparent={true}
                animationType="slide"
                visible={forgotModalVisible}
                onRequestClose={() => setForgotModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.frameContainer}>
                        <Text style={styles.title}>Reset Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your email"
                            placeholderTextColor="#aaa"
                            value={forgotEmail}
                            onChangeText={setForgotEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <TouchableOpacity style={styles.button} onPress={handleSendOTP}>
                            <Text style={styles.buttonText}>Send OTP</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setForgotModalVisible(false)}>
                            <Text style={styles.linkText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Reset Password Modal */}
            <Modal
                transparent={true}
                animationType="slide"
                visible={resetModalVisible}
                onRequestClose={() => setResetModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.frameContainer}>
                        <Text style={styles.title}>Set New Password</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="New Password"
                            placeholderTextColor="#aaa"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry={true}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Confirm Password"
                            placeholderTextColor="#aaa"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={true}
                        />

                        <TouchableOpacity style={styles.button} onPress={handleResetPassword}>
                            <Text style={styles.buttonText}>Submit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setResetModalVisible(false)}>
                            <Text style={styles.linkText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Login Frame */}
            <View style={styles.frameContainer}>
                <Text style={styles.title}>Login</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#aaa"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <View style={styles.passwordContainer}>
                    <TextInput
                        style={styles.passwordInput}
                        placeholder="Password"
                        placeholderTextColor="#aaa"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Ionicons
                            name={showPassword ? 'eye-off' : 'eye'}
                            size={24}
                            color="#888"
                        />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                    <Text style={styles.buttonText}>Log In</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleForgotPassword}>
                    <Text style={styles.linkText}>Forgot Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.registerButton} onPress={handleNewRegister}>
                    <Text style={styles.registerButtonText}>New Register</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default LoginScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        alignSelf: 'center',
        marginBottom: 32,
    },
    frameContainer: {
        backgroundColor: '#f9f9f9',
        padding: 24,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        width: '100%',
    },
    input: {
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        marginBottom: 16,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        marginBottom: 16,
    },
    passwordInput: {
        flex: 1,
        height: 50,
        fontSize: 16,
    },
    button: {
        height: 50,
        backgroundColor: '#1e90ff',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginBottom: 16,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
    },
    linkText: {
        color: '#1e90ff',
        textAlign: 'center',
        marginTop: 16,
        fontSize: 16,
    },
    registerButton: {
        height: 50,
        backgroundColor: '#32CD32',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginTop: 16,
    },
    registerButtonText: {
        color: '#fff',
        fontSize: 18,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
});

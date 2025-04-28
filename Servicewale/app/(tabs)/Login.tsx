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

const MergedAuthScreen = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [forgotModalVisible, setForgotModalVisible] = useState(false);
    const [resetModalVisible, setResetModalVisible] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    const handleLogin = () => {
        if (email === '' || password === '') {
            Alert.alert('Error', 'Please fill in all fields');
        } else if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email (e.g., info@spriertechnology.com)');
        } else if (!passwordRegex.test(password)) {
            Alert.alert('Error', 'Password must have at least one uppercase letter, one number, and one special character');
        } else {
            Alert.alert('Success', `Logged in as ${email}`);
        }
    };

    const handleRegister = () => {
        if (!username || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
        } else if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email (e.g., info@spriertechnology.com)');
        } else if (!passwordRegex.test(password)) {
            Alert.alert('Error', 'Password must have at least one uppercase letter, one number, and one special character');
        } else {
            Alert.alert('Success', `Account created for ${username}`);
            setIsLogin(true);
        }
    };

    const handleForgotPassword = () => {
        setForgotModalVisible(true);
    };

    const handleSendOTP = () => {
        if (forgotEmail === '') {
            Alert.alert('Error', 'Please enter your email');
        } else if (!emailRegex.test(forgotEmail)) {
            Alert.alert('Error', 'Please enter a valid email (e.g., info@spriertechnology.com)');
        } else {
            Alert.alert('OTP Sent', `An OTP has been sent to ${forgotEmail}`);
            setForgotModalVisible(false);
            setResetModalVisible(true);
        }
    };

    const handleResetPassword = () => {
        if (!newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
        } else if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
        } else if (!passwordRegex.test(newPassword)) {
            Alert.alert('Error', 'New password must have at least one uppercase letter, one number, and one special character');
        } else {
            Alert.alert('Success', 'Your password has been reset');
            setResetModalVisible(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Forgot Password Modal */}
            <Modal transparent animationType="slide" visible={forgotModalVisible}>
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
            <Modal transparent animationType="slide" visible={resetModalVisible}>
                <View style={styles.modalOverlay}>
                    <View style={styles.frameContainer}>
                        <Text style={styles.title}>Set New Password</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                style={styles.passwordInput}
                                placeholder="New Password"
                                placeholderTextColor="#aaa"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry={!showNewPassword}
                            />
                            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                                <Ionicons
                                    name={showNewPassword ? 'eye' : 'eye-off'}
                                    size={24}
                                    color="#888"
                                />
                            </TouchableOpacity>
                        </View>
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

            {/* Login/Register Frame */}
            <View style={styles.frameContainer}>
                <Text style={styles.title}>{isLogin ? 'Login' : 'Register'}</Text>

                {!isLogin && (
                    <TextInput
                        style={styles.input}
                        placeholder="Username"
                        value={username}
                        onChangeText={setUsername}
                    />
                )}

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
                            name={showPassword ? 'eye' : 'eye-off'}
                            size={24}
                            color="#888"
                        />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={isLogin ? handleLogin : handleRegister}
                >
                    <Text style={styles.buttonText}>
                        {isLogin ? 'Log In' : 'Register'}
                    </Text>
                </TouchableOpacity>

                {isLogin && (
                    <TouchableOpacity onPress={handleForgotPassword}>
                        <Text style={styles.linkText}>Forgot Password?</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={styles.registerButton}
                    onPress={() => setIsLogin(!isLogin)}
                >
                    <Text style={styles.registerButtonText}>
                        {isLogin ? 'New Register' : 'Back to Login'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default MergedAuthScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
        backgroundColor: '#f7f7f7',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        alignSelf: 'center',
        marginBottom: 32,
    },
    frameContainer: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        width: '100%',
    },
    input: {
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 16,
        marginBottom: 16,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 16,
        backgroundColor: '#f9f9f9',
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
        borderRadius: 10,
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
        borderRadius: 10,
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

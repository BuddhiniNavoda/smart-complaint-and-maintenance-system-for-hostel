import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { ref, set } from 'firebase/database';
import { database } from '../firebase/config';

const hostelBlocks = [
    'Block A',
    'Block B',
    'Block C',
    'Block D',
    'Block E',
    'New Block',
    'Girls Hostel'
];

export default function SignUpScreen({ navigation }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [hostel, setHostel] = useState(hostelBlocks[0]);
    const [room, setRoom] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const colorScheme = useColorScheme();
    const darkMode = colorScheme === 'dark';

    const handleSignUp = async () => {
        // Basic validation
        if (!name || !email || !password || !confirmPassword || !room) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert("Error", "Passwords don't match");
            return;
        }

        if (password.length < 6) {
            Alert.alert("Error", "Password should be at least 6 characters long");
            return;
        }

        setLoading(true);

        try {
            // Generate a unique user ID (you might want to use a better method)
            const userId = Date.now().toString();

            // Prepare user data
            const userData = {
                id: userId,
                name,
                email,
                password, // Note: In a real app, you should hash the password
                hostel,
                room,
                userType: 'student',
                createdAt: new Date().toISOString()
            };

            // Save to Firebase Realtime Database
            await set(ref(database, 'users/' + userId), userData);

            console.log('User data saved to Firebase:', userData);
            Alert.alert("Success", "Account created successfully!");

            // Reset form
            setName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setRoom('');

            navigation.navigate('Login');
        } catch (error) {
            console.error('Error saving user data:', error);
            Alert.alert("Error", "Failed to create account. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: 'center',
            padding: 20,
            backgroundColor: darkMode ? '#121212' : 'white'
        },
        title: {
            fontSize: 24,
            marginBottom: 20,
            textAlign: 'center',
            color: darkMode ? 'white' : 'black'
        },
        inputContainer: {
            position: 'relative',
            marginBottom: 15
        },
        inputIcon: {
            position: 'absolute',
            left: 15,
            top: 15,
            zIndex: 1
        },
        passwordToggle: {
            position: 'absolute',
            right: 15,
            top: 15,
            zIndex: 1
        },
        input: {
            borderWidth: 1,
            borderColor: darkMode ? '#333' : '#ddd',
            backgroundColor: darkMode ? '#333' : 'white',
            color: darkMode ? 'white' : 'black',
            borderRadius: 10,
            padding: 15,
            paddingLeft: 45,
            fontSize: 16
        },
        pickerContainer: {
            borderWidth: 1,
            borderColor: darkMode ? '#333' : '#ddd',
            borderRadius: 10,
            marginBottom: 15,
            backgroundColor: darkMode ? '#333' : 'white',
            overflow: 'hidden',
            paddingLeft: 30
        },
        picker: {
            color: darkMode ? 'white' : 'black',
            paddingLeft: 40
        },
        pickerIcon: {
            position: 'absolute',
            left: 15,
            top: 18,
            zIndex: 1
        },
        buttonContainer: {
            marginTop: 20,
            borderRadius: 10,
            overflow: 'hidden'
        },
        loginText: {
            textAlign: 'center',
            marginTop: 20,
            color: darkMode ? 'white' : 'black'
        },
        loginLink: {
            color: '#007AFF',
            fontWeight: 'bold'
        },
        noteText: {
            color: darkMode ? '#aaa' : '#666',
            fontSize: 12,
            marginTop: 5,
            fontStyle: 'italic'
        },
        loader: {
            marginTop: 20
        }
    });

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Student Registration</Text>

            <View style={styles.inputContainer}>
                <Ionicons
                    name="person"
                    size={20}
                    color={darkMode ? '#aaa' : '#888'}
                    style={styles.inputIcon}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    value={name}
                    onChangeText={setName}
                    placeholderTextColor={darkMode ? '#aaa' : '#888'}
                />
            </View>

            <View style={styles.inputContainer}>
                <Ionicons
                    name="mail"
                    size={20}
                    color={darkMode ? '#aaa' : '#888'}
                    style={styles.inputIcon}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor={darkMode ? '#aaa' : '#888'}
                />
            </View>

            <View style={styles.inputContainer}>
                <Ionicons
                    name="lock-closed"
                    size={20}
                    color={darkMode ? '#aaa' : '#888'}
                    style={styles.inputIcon}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    placeholderTextColor={darkMode ? '#aaa' : '#888'}
                />
                <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                >
                    <Ionicons
                        name={showPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color={darkMode ? '#aaa' : '#888'}
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
                <Ionicons
                    name="lock-closed"
                    size={20}
                    color={darkMode ? '#aaa' : '#888'}
                    style={styles.inputIcon}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    placeholderTextColor={darkMode ? '#aaa' : '#888'}
                />
                <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                    <Ionicons
                        name={showConfirmPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color={darkMode ? '#aaa' : '#888'}
                    />
                </TouchableOpacity>
            </View>

            <View style={styles.pickerContainer}>
                <Ionicons
                    name="home"
                    size={20}
                    color={darkMode ? '#aaa' : '#888'}
                    style={styles.pickerIcon}
                />
                <Picker
                    selectedValue={hostel}
                    onValueChange={(itemValue) => setHostel(itemValue)}
                    style={styles.picker}
                    dropdownIconColor={darkMode ? '#aaa' : '#888'}
                    mode="dropdown"
                >
                    {hostelBlocks.map((block) => (
                        <Picker.Item key={block} label={block} value={block} />
                    ))}
                </Picker>
            </View>

            <View style={styles.inputContainer}>
                <Ionicons
                    name="grid"
                    size={20}
                    color={darkMode ? '#aaa' : '#888'}
                    style={styles.inputIcon}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Room Number"
                    value={room}
                    onChangeText={setRoom}
                    keyboardType="numeric"
                    placeholderTextColor={darkMode ? '#aaa' : '#888'}
                />
            </View>

            <View style={styles.buttonContainer}>
                {loading ? (
                    <ActivityIndicator size="small" color="#007AFF" style={styles.loader} />
                ) : (
                    <Button
                        title="Sign Up"
                        onPress={handleSignUp}
                        color="#007AFF"
                        disabled={loading}
                    />
                )}
            </View>

            <Text style={styles.loginText}>
                Already have an account?{' '}
                <Text style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
                    Login
                </Text>
            </Text>
        </View>
    );
}
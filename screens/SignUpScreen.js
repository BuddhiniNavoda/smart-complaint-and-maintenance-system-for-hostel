import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
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
    const [isLoading, setIsLoading] = useState(false);
    const colorScheme = useColorScheme();
    const darkMode = colorScheme === 'dark';

    // ✅ Enhanced Email validation function for all three formats
    const validateEmail = (email) => {
        // Format 1: Student - 20XX/XXX/(ENG|AGR|TEC)@gmail.com
        const studentRegex = /^20\d{2}\/(ENG|AGR|TEC)\/\d{3}@gmail\.com$/;
        
        // Format 2: Warden - WAR/[A,B,C]/XXX@gmail.com
        const wardenRegex = /^WAR\/[A,B,C]\/\d{3}@gmail\.com$/;
        
        // Format 3: Staff - Stf/XXX@gmail.com
        const staffRegex = /^Stf\/\d{3}@gmail\.com$/;
        
        return studentRegex.test(email) || wardenRegex.test(email) || staffRegex.test(email);
    };

    // ✅ Determine user type based on email format
    const getUserTypeFromEmail = (email) => {
        if (/^20\d{2}\/(ENG|AGR|TEC)\/\d{3}@gmail\.com$/.test(email)) {
            return 'student';
        } else if (/^WAR\/[A,B,C]\/\d{3}@gmail\.com$/.test(email)) {
            return 'warden';
        } else if (/^Stf\/\d{3}@gmail\.com$/.test(email)) {
            return 'staff';
        }
        return 'student'; // default
    };

    // ✅ Get appropriate placeholder text based on email input
    const getEmailPlaceholder = (email) => {
        if (email.includes('20')) {
            return "Email (20XX/XXX/ENG@gmail.com)";
        } else if (email.includes('WAR')) {
            return "Email (WAR/A/XXX@gmail.com)";
        } else if (email.includes('Stf')) {
            return "Email (Stf/XXX@gmail.com)";
        }
        return "Email (student/warden/staff format)";
    };

    const handleSignUp = async () => {
        // Clean email by removing spaces
        const cleanEmail = email.replace(/\s/g, '');
        
        if (!validateEmail(cleanEmail)) {
            Alert.alert(
                "Invalid Email",
                "Email must be in one of these formats:\n\n" +
                "• Student: 20XX/XXX/(ENG|AGR|TEC)@gmail.com\n" +
                "• Warden: WAR/[A,B,C]/XXX@gmail.com\n" +
                "• Staff: Stf/XXX@gmail.com"
            );
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert("Error", "Passwords don't match");
            return;
        }

        if (password.length < 6) {
            Alert.alert("Error", "Password must be at least 6 characters long");
            return;
        }

        setIsLoading(true);

        try {
            // Generate a timestamp-based ID
            const id = Date.now().toString();
            
            // Determine user type from email
            const userType = getUserTypeFromEmail(cleanEmail);
            
            // Create user data object with the exact structure you requested
            const userData = {
                id: id,
                name: name,
                email: cleanEmail,
                password: password,
                userType: userType,
                createdAt: new Date().toISOString()
            };

            // Add hostel and room only for students and wardens (not for staff)
            if (userType === 'student' || userType === 'warden') {
                userData.hostel = hostel;
                userData.room = room;
            } else if (userType === 'staff') {
                // Staff only has room, no hostel
                userData.room = room;
            }
            
            // Write to Firebase Realtime Database using the ID as the key
            await set(ref(database, 'users/' + id), userData);
            
            console.log('Sign Up Data:', userData);
            
            let successMessage = "Account created successfully!";
            if (userType === 'warden') {
                successMessage += "\nUser Type: Warden";
            } else if (userType === 'staff') {
                successMessage += "\nUser Type: Staff";
            } else {
                successMessage += "\nUser Type: Student";
            }
            
            Alert.alert("Success", successMessage);
            
            // Clear form
            setName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setRoom('');
            setHostel(hostelBlocks[0]);
            
            navigation.navigate('Login');
        } catch (error) {
            console.error("Error saving user data:", error);
            Alert.alert("Error", "Failed to create account. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: 'center',
            padding: 20,
            backgroundColor: darkMode ? '#121212' : 'white'
        },
        scrollContainer: {
            flexGrow: 1,
            justifyContent: 'center',
        },
        title: {
            fontSize: 24,
            marginBottom: 20,
            textAlign: 'center',
            color: darkMode ? 'white' : 'black',
            fontWeight: 'bold'
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
            borderColor: darkMode ? '#444' : '#ccc',
            backgroundColor: darkMode ? '#333' : 'white',
            color: darkMode ? 'white' : 'black',
            borderRadius: 10,
            padding: 15,
            paddingLeft: 45,
            fontSize: 16
        },
        pickerContainer: {
            borderWidth: 1,
            borderColor: darkMode ? '#444' : '#ccc',
            borderRadius: 10,
            marginBottom: 15,
            backgroundColor: darkMode ? '#333' : 'white',
            overflow: 'hidden',
            paddingLeft: 30
        },
        picker: {
            color: darkMode ? 'white' : 'black',
            paddingLeft: 40,
            height: 50,
            justifyContent: 'center'
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
            fontStyle: 'italic',
            textAlign: 'center'
        },
        loader: {
            marginTop: 20,
        },
        header: {
            alignItems: 'center',
            marginBottom: 30
        },
        logo: {
            fontSize: 40,
            marginBottom: 10,
            color: darkMode ? '#4CAF50' : '#2E7D32'
        },
        userTypeIndicator: {
            textAlign: 'center',
            fontSize: 14,
            marginBottom: 10,
            color: darkMode ? '#4CAF50' : '#2E7D32',
            fontWeight: 'bold'
        }
    });

    // Determine current user type for display
    const currentUserType = email ? getUserTypeFromEmail(email.replace(/\s/g, '')) : '';

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.logo}>📝</Text>
                    <Text style={styles.title}>User Registration</Text>
                </View>

                {currentUserType && (
                    <Text style={styles.userTypeIndicator}>
                        Detected: {currentUserType.toUpperCase()} Account
                    </Text>
                )}

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
                        placeholder={getEmailPlaceholder(email)}
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

                {/* Show hostel picker only for students and wardens */}
                {(currentUserType === 'student' || currentUserType === 'warden' || !currentUserType) && (
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
                )}

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
                    {isLoading ? (
                        <ActivityIndicator size="large" color="#000000" style={styles.loader} />
                    ) : (
                        <Button
                            title="Sign Up"
                            onPress={handleSignUp}
                            color="#000000"
                        />
                    )}
                </View>

                <Text style={styles.noteText}>
                    Supported formats: Student (20XX/XXX/ENG), Warden (WAR/A/XXX), Staff (Stf/XXX)
                </Text>

                <Text style={styles.loginText}>
                    Already have an account?{' '}
                    <Text style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
                        Login
                    </Text>
                </Text>
            </View>
        </ScrollView>
    );
}
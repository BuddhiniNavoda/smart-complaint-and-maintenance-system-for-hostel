import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Image
} from 'react-native';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { ref, set } from 'firebase/database';
import { database } from '../firebase/config';
import useAlert from '../hooks/useAlert';

const { width, height } = Dimensions.get('window');

const hostelBlocks = [
    'Block A',
    'Block B',
    'Block C',
    'Block D',
    'Block E'
];

const hostelGenders = [
    'male',
    'female',
];

export default function SignUpScreen({ navigation }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [hostel, setHostel] = useState(hostelBlocks[0]);
    const [hostelGender, setHostelGender] = useState(hostelGenders[0]);
    const [room, setRoom] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const colorScheme = useColorScheme();
    const darkMode = colorScheme === 'dark';
    const { showAlert, AlertComponent } = useAlert();

    const handleSignUp = async () => {
        // Basic validation
        if (!name || !email || !password || !confirmPassword || !room) {
            showAlert("Warning", "Please fill in all fields", [], 'warning');
            return;
        }

        if (password !== confirmPassword) {
            showAlert("Error", "Passwords don't match", [], 'error');
            return;
        }

        if (password.length < 6) {
            showAlert("Warning", "Password should be at least 6 characters long", [], 'warning');
            return;
        }

        // Validate hostel gender selection
        if (hostel === 'Girls Hostel' && hostelGender !== 'Female') {
            showAlert("Validation Error", "Girls Hostel must be selected as Female", [], 'error');
            return;
        }

        setLoading(true);

        try {
            // Generate a unique user ID
            const userId = Date.now().toString();

            // Prepare user data
            const userData = {
                id: userId,
                name,
                email: email.toLowerCase(),
                password, // Note: In a real app, you should hash the password
                hostel,
                hostelGender,
                room,
                userType: 'student',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Save to Firebase Realtime Database
            await set(ref(database, 'users/' + userId), userData);

            showAlert("Success", "Account created successfully!", [], 'success');

            // Reset form
            setName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setRoom('');

            navigation.navigate('Login');
        } catch (error) {
            showAlert("Error", "Failed to create account. Please try again", [], 'error');
        } finally {
            setLoading(false);
        }
    };

    // Auto-set gender when Girls Hostel is selected
    React.useEffect(() => {
        if (hostel === 'Girls Hostel' && hostelGender !== 'Female') {
            setHostelGender('Female');
        }
    }, [hostel]);

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: '#86befa8d',
        },
        backgroundContainer: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
        },
        gradientOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 122, 255, 0.1)',
        },
        contentWrapper: {
            flex: 1,
            justifyContent: 'center',
            paddingVertical: 20,
        },
        contentContainer: {
            backgroundColor: 'white',
            borderRadius: 25,
            marginHorizontal: 20,
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 10,
            },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 10,
            maxHeight: height * 0.9, // Increased height for new field
            minHeight: height * 0.9,
        },
        scrollContent: {
            padding: 30,
        },
        title: {
            fontSize: 32,
            marginBottom: 10,
            textAlign: 'center',
            color: '#007AFF',
            fontWeight: 'bold',
            letterSpacing: 1,
        },
        subtitle: {
            fontSize: 16,
            marginBottom: 30,
            textAlign: 'center',
            color: '#666',
        },
        inputContainer: {
            position: 'relative',
            marginBottom: 20,
        },
        inputIcon: {
            position: 'absolute',
            left: 15,
            top: 15,
            zIndex: 1,
        },
        passwordToggle: {
            position: 'absolute',
            right: 15,
            top: 15,
            zIndex: 1,
        },
        input: {
            borderWidth: 2,
            borderColor: '#E3F2FD',
            backgroundColor: '#F8FBFF',
            color: '#007AFF',
            borderRadius: 15,
            padding: 15,
            paddingLeft: 45,
            fontSize: 16,
            fontWeight: '500',
        },
        pickerContainer: {
            borderWidth: 2,
            borderColor: '#E3F2FD',
            borderRadius: 15,
            marginBottom: 20,
            backgroundColor: '#F8FBFF',
            overflow: 'hidden',
        },
        picker: {
            color: '#007AFF',
            marginLeft: 30,
        },
        pickerIcon: {
            position: 'absolute',
            left: 15,
            top: 45,
            zIndex: 1,
        },
        pickerRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
        },
        pickerColumn: {
            flex: 1,
        },
        pickerLabel: {
            fontSize: 14,
            color: '#007AFF',
            fontWeight: '600',
            marginTop: 10,
            marginLeft: 15,
        },
        genderIcon: {
            marginRight: 8,
        },
        buttonContainer: {
            marginTop: 10,
            borderRadius: 15,
            overflow: 'hidden',
            backgroundColor: '#007AFF',
            shadowColor: '#007AFF',
            shadowOffset: {
                width: 0,
                height: 4,
            },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
        },
        button: {
            backgroundColor: '#007AFF',
            paddingVertical: 15,
            borderRadius: 15,
        },
        buttonText: {
            color: 'white',
            textAlign: 'center',
            fontSize: 18,
            fontWeight: 'bold',
        },
        loginText: {
            textAlign: 'center',
            marginTop: 20,
            color: '#666',
            fontSize: 15,
            marginBottom: 60,
        },
        loginLink: {
            color: '#007AFF',
            fontWeight: 'bold',
            fontSize: 15,
        },
        noteText: {
            color: '#88B2FF',
            fontSize: 12,
            marginTop: 5,
            fontStyle: 'italic',
            textAlign: 'center',
        },
        loader: {
            marginTop: 20,
        },
        logoContainer: {
            borderRadius: 70,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 10,
        },
        logo: {
            width: 100,
            height: 100,
            resizeMode: 'contain',
            borderRadius: 10,
            borderColor: 'rgba(34, 13, 13, 0.36)',
        },
        validationText: {
            fontSize: 12,
            color: '#FF6B6B',
            marginTop: 5,
            marginLeft: 15,
            fontStyle: 'italic',
        },
        infoText: {
            fontSize: 12,
            color: '#4CAF50',
            marginTop: 5,
            marginLeft: 15,
            fontStyle: 'italic',
        },
    });

    const getGenderIcon = (gender) => {
        switch (gender) {
            case 'Male':
                return 'male';
            case 'Female':
                return 'female';
            case 'Mixed':
                return 'people';
            default:
                return 'person';
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.backgroundContainer}>
                <View style={styles.gradientOverlay} />
            </View>

            <View style={styles.contentWrapper}>
                <View style={styles.contentContainer}>
                    <ScrollView
                        style={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ flexGrow: 1 }}
                    >
                        <View style={styles.logoContainer}>
                            <Image
                                source={require('../assets/icon.png')}
                                style={styles.logo}
                            />
                        </View>

                        <Text style={styles.title}>Student Registration</Text>
                        <Text style={styles.subtitle}>Create your account to get started</Text>

                        <View style={styles.inputContainer}>
                            <Ionicons
                                name="person"
                                size={20}
                                color="#007AFF"
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Full Name"
                                placeholderTextColor="#88B2FF"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Ionicons
                                name="mail"
                                size={20}
                                color="#007AFF"
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                placeholderTextColor="#88B2FF"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Ionicons
                                name="lock-closed"
                                size={20}
                                color="#007AFF"
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Password"
                                placeholderTextColor="#88B2FF"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity
                                style={styles.passwordToggle}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <Ionicons
                                    name={showPassword ? 'eye-off' : 'eye'}
                                    size={20}
                                    color="#007AFF"
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                            <Ionicons
                                name="lock-closed"
                                size={20}
                                color="#007AFF"
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Confirm Password"
                                placeholderTextColor="#88B2FF"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                            />
                            <TouchableOpacity
                                style={styles.passwordToggle}
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                <Ionicons
                                    name={showConfirmPassword ? 'eye-off' : 'eye'}
                                    size={20}
                                    color="#007AFF"
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Hostel Block Selection */}
                        <View style={styles.pickerContainer}>
                            <Ionicons
                                name="home"
                                size={20}
                                color="#007AFF"
                                style={styles.pickerIcon}
                            />
                            <Text style={styles.pickerLabel}>Hostel Block</Text>
                            <Picker
                                selectedValue={hostel}
                                onValueChange={(itemValue) => setHostel(itemValue)}
                                style={styles.picker}
                                dropdownIconColor="#007AFF"
                                mode="dropdown"
                            >
                                {hostelBlocks.map((block) => (
                                    <Picker.Item key={block} label={block} value={block} />
                                ))}
                            </Picker>
                        </View>

                        {/* Hostel Gender Selection */}
                        <View style={styles.pickerContainer}>
                            <Ionicons
                                name={getGenderIcon(hostelGender)}
                                size={20}
                                color="#007AFF"
                                style={styles.pickerIcon}
                            />
                            <Text style={styles.pickerLabel}>Hostel Type</Text>
                            <Picker
                                selectedValue={hostelGender}
                                onValueChange={(itemValue) => setHostelGender(itemValue)}
                                style={styles.picker}
                                dropdownIconColor="#007AFF"
                                mode="dropdown"
                                enabled={hostel !== 'Girls Hostel'}
                            >
                                {hostelGenders.map((gender) => (
                                    <Picker.Item
                                        key={gender}
                                        label={gender}
                                        value={gender}
                                    />
                                ))}
                            </Picker>
                            {hostel === 'Girls Hostel' && (
                                <Text style={styles.infoText}>
                                    Automatically set to Female for Girls Hostel
                                </Text>
                            )}
                        </View>

                        <View style={styles.inputContainer}>
                            <Ionicons
                                name="grid"
                                size={20}
                                color="#007AFF"
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Room Number"
                                placeholderTextColor="#88B2FF"
                                value={room}
                                onChangeText={setRoom}
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.buttonContainer}>
                            {loading ? (
                                <ActivityIndicator size="small" color="white" style={styles.loader} />
                            ) : (
                                <TouchableOpacity
                                    style={styles.button}
                                    onPress={handleSignUp}
                                    disabled={loading}
                                >
                                    <Text style={styles.buttonText}>Sign Up</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <Text style={styles.loginText}>
                            Already have an account?{' '}
                            <Text style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
                                Login
                            </Text>
                        </Text>
                    </ScrollView>
                </View>
            </View>
            <AlertComponent />
        </KeyboardAvoidingView>
    );
}
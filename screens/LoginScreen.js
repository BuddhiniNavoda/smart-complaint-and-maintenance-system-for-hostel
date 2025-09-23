import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { ref, get } from 'firebase/database';
import { database } from '../firebase/config';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const darkMode = colorScheme === 'dark';

  const InputWithIcon = useCallback(({ icon, placeholder, value, onChangeText, secureTextEntry }) => (
    <View style={styles.inputContainer}>
      <Ionicons
        name={icon}
        size={20}
        color="#007AFF"
        style={styles.inputIcon}
      />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#88B2FF"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry && !showPassword}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {secureTextEntry && (
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
      )}
    </View>
  ), [showPassword]);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please enter both username and password");
      return;
    }

    setLoading(true);

    try {
      // Get all users and filter locally (no index required)
      const usersRef = ref(database, 'users');
      const snapshot = await get(usersRef);

      if (snapshot.exists()) {
        const usersData = snapshot.val();
        let userFound = null;
        let userId = null;

        // Find user by email in the client side
        Object.keys(usersData).forEach(key => {
          const user = usersData[key];
          if (user.email && user.email.toLowerCase() === username.toLowerCase()) {
            userFound = user;
            userId = key;
          }
        });

        if (userFound && userFound.password === password) {
          // Save user data to AsyncStorage
          const userToStore = {
            id: userId,
            username: userFound.email,
            name: userFound.name,
            userType: userFound.userType,
            hostel: userFound.hostel,
            room: userFound.room,
            email: userFound.email,
            hostelGender: userFound.hostelGender,
            assignedHostelGender: userFound.assignedHostelGender || "undefined"
          };

          await AsyncStorage.setItem('userData', JSON.stringify(userToStore));

          // Navigate to Home with user data
          navigation.navigate('Main', {
            userType: userFound.userType,
            userData: userToStore
          });

          Alert.alert("Success", "Login successful!");
        } else if (userFound) {
          Alert.alert("Login Failed", "Invalid password");
        } else {
          Alert.alert("Login Failed", "User not found");
        }
      } else {
        Alert.alert("Login Failed", "No users found in database");
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert("Error", "Failed to login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          navigation.navigate('Main', {
            userType: userData.userType,
            userData: userData
          });
        }
      } catch (error) {
        console.error('Error reading user data:', error);
      }
    };

    checkLoggedIn();
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: 20,
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
    contentContainer: {
      backgroundColor: 'white',
      borderRadius: 25,
      padding: 30,
      marginHorizontal: 10,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 10,
      },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 10,
    },
    title: {
      fontSize: 32,
      marginBottom: 30,
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
    buttonContainer: {
      marginVertical: 10,
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
    signupText: {
      textAlign: 'center',
      marginTop: 25,
      color: '#666',
      fontSize: 15,
    },
    signupLink: {
      color: '#007AFF',
      fontWeight: 'bold',
      fontSize: 15,
    },
    loader: {
      marginVertical: 20,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 10,
    },
    logo: {
      width: 80,
      height: 80,
      backgroundColor: '#007AFF',
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 5,
      },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 5,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.backgroundContainer}>
        <View style={styles.gradientOverlay} />
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Ionicons name="build" size={40} color="white" />
          </View>
        </View>

        <Text style={styles.title}>Fixora</Text>
        <Text style={styles.subtitle}>The smart gateway of hostal complaint management</Text>

        <InputWithIcon
          icon="person"
          placeholder="Email"
          value={username}
          onChangeText={setUsername}
        />

        <InputWithIcon
          icon="lock-closed"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={true}
        />

        <View style={styles.buttonContainer}>
          {loading ? (
            <ActivityIndicator size="small" color="white" style={styles.loader} />
          ) : (
            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.signupText}>
          Don't have an account?{' '}
          <Text style={styles.signupLink} onPress={() => navigation.navigate('SignUp')}>
            Sign Up
          </Text>
        </Text>
      </View>
    </View>
  );
}
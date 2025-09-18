import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { ref, get } from 'firebase/database';
import { database } from '../firebase/config';

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
        color={darkMode ? '#aaa' : '#888'}
        style={styles.inputIcon}
      />
      <TextInput
        style={[styles.input, { paddingLeft: 40 }]}
        placeholder={placeholder}
        placeholderTextColor={darkMode ? '#aaa' : '#888'}
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
            color={darkMode ? '#aaa' : '#888'}
          />
        </TouchableOpacity>
      )}
    </View>
  ), [darkMode, showPassword]);

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
            email: userFound.email
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

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userData');
      Alert.alert("Success", "Logged out successfully");
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert("Error", "Failed to logout");
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
      backgroundColor: colorScheme === 'dark' ? '#121212' : 'white'
    },
    title: {
      fontSize: 24,
      marginBottom: 20,
      textAlign: 'center',
      color: colorScheme === 'dark' ? 'white' : 'black'
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
    buttonContainer: {
      marginVertical: 10,
      borderRadius: 10,
      overflow: 'hidden'
    },
    signupText: {
      textAlign: 'center',
      marginTop: 20,
      color: colorScheme === 'dark' ? 'white' : 'black'
    },
    signupLink: {
      color: '#007AFF',
      fontWeight: 'bold'
    },
    loader: {
      marginVertical: 20
    }
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fixora Login</Text>

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
          <ActivityIndicator size="small" color="#007AFF" style={styles.loader} />
        ) : (
          <Button
            title="Login"
            onPress={handleLogin}
            color="#007AFF"
            disabled={loading}
          />
        )}
      </View>

      <Text style={styles.signupText}>
        Don't have an account?{' '}
        <Text style={styles.signupLink} onPress={() => navigation.navigate('SignUp')}>
          Sign Up
        </Text>
      </Text>
    </View>
  );
}
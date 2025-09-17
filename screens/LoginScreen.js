import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// Predefined user data
const users = [
  {
    username: 'student',
    password: 'student123',
    userType: 'student',
    name: 'John Student',
    hostel: 'Block A',
    room: '101'
  },
  {
    username: 'warden',
    password: 'warden123',
    userType: 'warden',
    name: 'Dr. Smith Warden',
    hostel: 'Main Building'
  },
  {
    username: 'staff',
    password: 'staff123',
    userType: 'staff',
    name: 'Mike Maintenance',
    department: 'Electrical'
  },
];

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    // Find user in predefined data
    const user = users.find(u =>
      u.username === username && u.password === password
    );

    if (user) {
      try {
        // Save user data to AsyncStorage
        await AsyncStorage.setItem('userData', JSON.stringify({
          userType: user.userType,
          userData: user
        }));

        // Navigate to Home with user data
        navigation.navigate('Main', {
          userType: user.userType,
          userData: user
        });
      } catch (error) {
        Alert.alert("Error", "Failed to save login data");
        console.error('Error saving user data:', error);
      }
    } else {
      Alert.alert("Login Failed", "Invalid username or password");
    }
  };

  useEffect(() => {
    const checkLoggedIn = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          navigation.navigate('Main', JSON.parse(userData));
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
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fixora Login</Text>

      <InputWithIcon
        icon="person"
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <InputWithIcon
        icon="lock-closed"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={true}
      />

      <View style={styles.buttonContainer}>
        <Button
          title="Login"
          onPress={handleLogin}
          color="#000000"
        />
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
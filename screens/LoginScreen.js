// screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';

export default function LoginScreen({ navigation }) {
  const [userType, setUserType] = useState('student');

  const handleLogin = () => {
    navigation.navigate('Home', { userType });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login as:</Text>
      <Button title="Student" onPress={() => { setUserType('student'); handleLogin(); }} />
      <Button title="Warden" onPress={() => { setUserType('warden'); handleLogin(); }} />
      <Button title="Maintenance Staff" onPress={() => { setUserType('staff'); handleLogin(); }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center' }
});

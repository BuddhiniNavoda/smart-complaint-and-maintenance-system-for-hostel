// screens/ComplaintDetailScreen.js
import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../context/ThemeContext';

export default function ComplaintDetailScreen({ navigation, route }) {
  const { complaint, userType } = route.params;
  const { isDarkMode } = useContext(ThemeContext);
  const [currentComplaint, setCurrentComplaint] = useState(complaint);

  const approveComplaint = async () => {
    try {
      // Update complaint status
      const updatedComplaint = { ...currentComplaint, status: 'Approved' };
      
      // Get all complaints from storage
      const complaintsData = await AsyncStorage.getItem('complaints');
      let complaints = complaintsData ? JSON.parse(complaintsData) : [];
      
      // Update the specific complaint
      complaints = complaints.map(c => 
        c.id === currentComplaint.id ? updatedComplaint : c
      );
      
      // Save back to storage
      await AsyncStorage.setItem('complaints', JSON.stringify(complaints));
      
      setCurrentComplaint(updatedComplaint);
      Alert.alert('Success', 'Complaint approved successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Approval error:', error);
      Alert.alert('Error', 'Failed to approve complaint');
    }
  };

  const markAsFixed = async () => {
    try {
      // Update complaint status and add fixed info
      const updatedComplaint = { 
        ...currentComplaint, 
        status: 'Fixed',
        fixedBy: userData.username, // assuming you have userData
        fixedAt: new Date().toISOString()
      };
      
      // Get all complaints from storage
      const complaintsData = await AsyncStorage.getItem('complaints');
      let complaints = complaintsData ? JSON.parse(complaintsData) : [];
      
      // Update the specific complaint
      complaints = complaints.map(c => 
        c.id === currentComplaint.id ? updatedComplaint : c
      );
      
      // Save back to storage
      await AsyncStorage.setItem('complaints', JSON.stringify(complaints));
      
      setCurrentComplaint(updatedComplaint);
      Alert.alert('Success', 'Complaint marked as fixed');
      navigation.goBack();
    } catch (error) {
      console.error('Mark as fixed error:', error);
      Alert.alert('Error', 'Failed to mark complaint as fixed');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: isDarkMode ? '#121212' : '#f5f5f5'
    },
    card: {
      backgroundColor: isDarkMode ? '#1e1e1e' : 'white',
      borderRadius: 10,
      padding: 20,
      marginBottom: 20
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 10,
      color: isDarkMode ? 'white' : 'black'
    },
    detail: {
      fontSize: 16,
      marginBottom: 8,
      color: isDarkMode ? '#aaa' : '#666'
    },
    statusBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 10,
      marginBottom: 15
    },
    statusText: {
      fontWeight: 'bold',
      color: 'white'
    },
    button: {
      backgroundColor: '#007AFF',
      padding: 15,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 10
    },
    buttonText: {
      color: 'white',
      fontWeight: 'bold'
    },
    fixedButton: {
      backgroundColor: '#4CAF50'
    }
  });

  const statusColors = {
    Submitted: isDarkMode ? '#333' : '#eee',
    Approved: isDarkMode ? '#2a3c96' : '#d4e2ff',
    Fixed: isDarkMode ? '#1a5c1a' : '#d4ffd4'
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: statusColors[currentComplaint.status] }
        ]}>
          <Text style={styles.statusText}>{currentComplaint.status}</Text>
        </View>
        
        <Text style={styles.title}>{currentComplaint.category}</Text>
        <Text style={[styles.detail, { color: isDarkMode ? 'white' : 'black' }]}>
          {currentComplaint.description}
        </Text>
        
        <Text style={styles.detail}>Submitted by: {currentComplaint.submittedBy}</Text>
        <Text style={styles.detail}>Date: {currentComplaint.date}</Text>
        
        {currentComplaint.status === 'Fixed' && (
          <>
            <Text style={styles.detail}>Fixed by: {currentComplaint.fixedBy}</Text>
            <Text style={styles.detail}>Fixed at: {new Date(currentComplaint.fixedAt).toLocaleString()}</Text>
          </>
        )}
      </View>

      {/* Action buttons based on user type and complaint status */}
      {userType === 'warden' && currentComplaint.status === 'Submitted' && (
        <TouchableOpacity 
          style={styles.button}
          onPress={approveComplaint}
        >
          <Text style={styles.buttonText}>Approve Complaint</Text>
        </TouchableOpacity>
      )}

      {userType === 'staff' && currentComplaint.status === 'Approved' && (
        <TouchableOpacity 
          style={[styles.button, styles.fixedButton]}
          onPress={markAsFixed}
        >
          <Text style={styles.buttonText}>Mark as Fixed</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
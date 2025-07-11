// screens/HomeScreen.js
import React from 'react';
import { View, Text, Button, StyleSheet, FlatList } from 'react-native';

const mockComplaints = [
  { id: '1', description: 'Light not working in Room 101', status: 'Submitted', visibility: 'public' },
  { id: '2', description: 'Water leakage in Block A', status: 'Approved', visibility: 'private' },
];

export default function HomeScreen({ navigation, route }) {
  const { userType } = route.params;

  const handleSelectComplaint = (item) => {
    navigation.navigate('ComplaintDetail', { complaint: item, userType });
  };

  return (
    <View style={styles.container}>
      {userType === 'student' && (
        <Button title="Add Complaint" onPress={() => navigation.navigate('AddComplaint')} />
      )}
      <FlatList
        data={mockComplaints}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Button title={`${item.description} - ${item.status}`} onPress={() => handleSelectComplaint(item)} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 }
});

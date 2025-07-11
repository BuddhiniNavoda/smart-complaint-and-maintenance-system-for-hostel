// screens/ComplaintDetailScreen.js
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

export default function ComplaintDetailScreen({ route }) {
  const { complaint, userType } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Description:</Text>
      <Text>{complaint.description}</Text>
      <Text>Status: {complaint.status}</Text>

      {userType !== 'student' && (
        <>
          <Button title="Approve" onPress={() => {}} />
          <Button title="Mark as Fixed" onPress={() => {}} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  label: { fontWeight: 'bold', marginTop: 20 }
});

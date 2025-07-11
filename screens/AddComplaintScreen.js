// screens/AddComplaintScreen.js
import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Picker } from 'react-native';

export default function AddComplaintScreen({ navigation }) {
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('public');

  const handleSubmit = () => {
    // Just go back for now
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text>Description:</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter issue details"
        value={description}
        onChangeText={setDescription}
      />
      <Text>Visibility:</Text>
      <Picker selectedValue={visibility} onValueChange={(value) => setVisibility(value)}>
        <Picker.Item label="Public" value="public" />
        <Picker.Item label="Private (Only Warden/Staff)" value="private" />
      </Picker>
      <Button title="Upload Photo (later)" onPress={() => {}} />
      <Button title="Submit Complaint" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  input: { borderWidth: 1, padding: 10, marginVertical: 10 }
});

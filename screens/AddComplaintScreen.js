import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Alert, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import * as NavigationBar from 'expo-navigation-bar';

export default function AddComplaintScreen({ navigation, route }) {
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [category, setCategory] = useState('Electrical');
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { isDarkMode } = useContext(ThemeContext);

  const { userData } = route.params;

  const categories = [
    'Electrical',
    'Plumbing',
    'Carpentry',
    'Cleaning',
    'Infrastructure',
    'Furniture',
    'Other'
  ];

  const showAlertWithNavBarReset = (title, message) => {
    Alert.alert(title, message, [
      {
        text: 'OK',
        onPress: () => {
          setTimeout(async () => {
            await NavigationBar.setVisibilityAsync('hidden');
            await NavigationBar.setBehaviorAsync('immersive');
            console.log('Nav bar hidden');
            callback();
          }, 300);
        }
      },
    ]);
  };

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need camera roll permissions to upload images');
      }
    })();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async () => {
    if (!image) return null;

    setUploading(true);
    try {
      // In a real app, you would upload to a server here
      // For demo, we'll just return the local URI
      return image;
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload failed', 'Could not upload image');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      showAlertWithNavBarReset('Error', 'Please enter a description');
      return;
    }

    setUploading(true);

    try {
      const imageUrl = image ? await uploadImage() : null;

      const complaintData = {
        id: Date.now().toString(),
        description,
        visibility,
        category,
        status: 'Submitted',
        votes: 0,
        date: new Date().toISOString().split('T')[0],
        submittedBy: userData.username,
        imageUrl,
        createdAt: new Date().toISOString(),
      };

      const existingComplaints = await AsyncStorage.getItem('complaints');
      const complaints = existingComplaints ? JSON.parse(existingComplaints) : [];
      complaints.push(complaintData);
      await AsyncStorage.setItem('complaints', JSON.stringify(complaints));

      showAlertWithNavBarReset('Success', 'Complaint submitted successfully', () => {
        setDescription('');
        setVisibility('public');
        setImage(null);
        setCategory('Electrical');
        navigation.goBack();
      });


    } catch (error) {
      console.error('Submission error:', error);
      showAlertWithNavBarReset('Error', 'Failed to submit complaint');
    } finally {
      setUploading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: isDarkMode ? '#121212' : 'white'
    },
    label: {
      marginTop: 15,
      marginBottom: 5,
      fontSize: 16,
      color: isDarkMode ? 'white' : 'black'
    },
    input: {
      borderWidth: 1,
      padding: 15,
      borderRadius: 10,
      borderColor: isDarkMode ? '#333' : '#ddd',
      backgroundColor: isDarkMode ? '#333' : 'white',
      color: isDarkMode ? 'white' : 'black',
      minHeight: 100,
      textAlignVertical: 'top'
    },
    radioContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 5
    },
    radioButton: {
      height: 20,
      width: 20,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#007AFF',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10
    },
    radioButtonSelected: {
      backgroundColor: '#007AFF'
    },
    radioInner: {
      height: 10,
      width: 10,
      borderRadius: 5,
      backgroundColor: 'white'
    },
    radioText: {
      color: isDarkMode ? 'white' : 'black'
    },
    categoryContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginVertical: 10
    },
    categoryButton: {
      padding: 10,
      margin: 5,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#007AFF'
    },
    categoryButtonSelected: {
      backgroundColor: '#007AFF'
    },
    categoryText: {
      color: isDarkMode ? 'white' : 'black'
    },
    categoryTextSelected: {
      color: 'white'
    },
    imageContainer: {
      alignItems: 'center',
      marginVertical: 15
    },
    image: {
      width: 200,
      height: 200,
      borderRadius: 10,
      marginBottom: 10
    },
    imageButton: {
      backgroundColor: isDarkMode ? '#333' : '#eee',
      padding: 10,
      borderRadius: 10,
      flexDirection: 'row',
      marginRight: 10
    },
    buttonGroup: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginVertical: 15
    },
    submitButton: {
      marginTop: 20,
      marginBottom: 50,
      borderRadius: 10,
      overflow: 'hidden'
    },
    selectedImageText: {
      color: isDarkMode ? 'white' : 'black',
      fontStyle: 'italic'
    }
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Category:</Text>
      <View style={styles.categoryContainer}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryButton, category === cat && styles.categoryButtonSelected]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.categoryText, category === cat && styles.categoryTextSelected]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Description:</Text>
      <TextInput
        style={styles.input}
        placeholder="Describe your issue in detail..."
        value={description}
        onChangeText={setDescription}
        multiline
        placeholderTextColor={isDarkMode ? '#aaa' : '#888'}
      />

      <Text style={styles.label}>Visibility:</Text>
      <View style={styles.radioContainer}>
        <TouchableOpacity
          style={[styles.radioButton, visibility === 'public' && styles.radioButtonSelected]}
          onPress={() => setVisibility('public')}
        >
          {visibility === 'public' && <View style={styles.radioInner} />}
        </TouchableOpacity>
        <Text style={styles.radioText}>Public (Visible to all students)</Text>
      </View>

      <View style={styles.radioContainer}>
        <TouchableOpacity
          style={[styles.radioButton, visibility === 'private' && styles.radioButtonSelected]}
          onPress={() => setVisibility('private')}
        >
          {visibility === 'private' && <View style={styles.radioInner} />}
        </TouchableOpacity>
        <Text style={styles.radioText}>Private (Only visible to warden/staff)</Text>
      </View>

      <Text style={styles.label}>Add Photo (Optional):</Text>
      <View style={styles.imageContainer}>
        {image && (
          <Image
            source={{ uri: image }}
            style={styles.image}
          />
        )}

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.imageButton}
            onPress={pickImage}
            disabled={uploading}
          >
            <Ionicons
              name="image"
              size={20}
              color={isDarkMode ? 'white' : 'black'}
            />
            <Text style={styles.buttonText}> Choose Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.imageButton}
            onPress={takePhoto}
            disabled={uploading}
          >
            <Ionicons
              name="camera"
              size={20}
              color={isDarkMode ? 'white' : 'black'}
            />
            <Text style={styles.buttonText}> Take Photo</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.submitButton}>
        <Button
          title={uploading ? "Submitting..." : "Submit Complaint"}
          onPress={handleSubmit}
          color="#007AFF"
          disabled={uploading}
        />
      </View>
    </ScrollView>
  );
}
import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Alert, ScrollView, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import * as NavigationBar from 'expo-navigation-bar';
import { ref, push, set, serverTimestamp } from 'firebase/database'; // Changed from Firestore to Realtime Database
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { database, storage } from '../firebase/config'; // Make sure this exports Realtime Database, not Firestore
import { getAuth } from 'firebase/auth';

export default function AddComplaintScreen({ navigation, route }) {
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [category, setCategory] = useState('Electrical');
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const { isDarkMode } = useContext(ThemeContext);

  const auth = getAuth();

  const categories = [
    'Electrical',
    'Plumbing',
    'Carpentry',
    'Cleaning',
    'Infrastructure',
    'Furniture',
    'Other'
  ];

  // Load userData from AsyncStorage
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('userData');
        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData);
          setUserData(parsedData);
        } else {
          Alert.alert('Error', 'User data not found. Please login again.');
          navigation.navigate('Login');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        Alert.alert('Error', 'Failed to load user data');
      } finally {
        setLoadingUserData(false);
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need camera roll permissions to upload images');
      }
    })();
  }, []);

  const showAlertWithNavBarReset = (title, message, callback) => {
    Alert.alert(title, message, [
      {
        text: 'OK',
        onPress: () => {
          setTimeout(async () => {
            await NavigationBar.setVisibilityAsync('hidden');
            await NavigationBar.setBehaviorAsync('immersive');
            if (callback) callback();
          }, 300);
        }
      },
    ]);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8, // Reduced quality for faster uploads
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async () => {
    if (!image) return null;

    try {
      // Convert image URI to blob
      const response = await fetch(image);
      const blob = await response.blob();

      // Create a unique filename
      const filename = image.substring(image.lastIndexOf('/') + 1);
      const imageRef = storageRef(storage, `complaint-images/${Date.now()}_${filename}`);

      // Upload the image
      const snapshot = await uploadBytes(imageRef, blob);

      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload failed', 'Could not upload image');
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!userData) {
      Alert.alert('Error', 'User data not available. Please login again.');
      navigation.navigate('Login');
      return;
    }

    if (!description.trim()) {
      showAlertWithNavBarReset('Error', 'Please enter a description');
      return;
    }

    setUploading(true);
    setConnectionError(false);

    try {
      const imageUrl = image ? await uploadImage() : null;

      // Get user ID
      const getUserID = () => {
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.uid) {
          return currentUser.uid;
        }
        return userData.id || userData.uid || userData.userId || 'unknown-user';
      };

      const userId = getUserID();

      // Create complaint data for Firebase Realtime Database
      const complaintData = {
        description: description.trim(),
        visibility,
        category,
        status: 'Submitted',
        votes: 0,
        date: new Date().toISOString().split('T')[0],
        submittedBy: userData.username || 'Anonymous',
        userId: userId,
        userEmail: userData.email || userData.username || '',
        userName: userData.name || 'Anonymous',
        userHostel: userData.hostel || '',
        userRoom: userData.room || '',
        userType: userData.userType || 'student',
        imageUrl: imageUrl || '',
        createdAt: serverTimestamp(), // This works for both Firestore and Realtime Database
        updatedAt: serverTimestamp(),
      };

      // Add to Firebase Realtime Database
      const complaintsRef = ref(database, 'complaints');
      const newComplaintRef = push(complaintsRef);

      await set(newComplaintRef, complaintData);

      console.log('Complaint written with ID: ', newComplaintRef.key);

      // Also store locally for offline access
      try {
        const existingComplaints = await AsyncStorage.getItem('complaints');
        const complaints = existingComplaints ? JSON.parse(existingComplaints) : [];

        const complaintWithId = {
          ...complaintData,
          id: newComplaintRef.key,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        complaints.push(complaintWithId);
        await AsyncStorage.setItem('complaints', JSON.stringify(complaints));
      } catch (localError) {
        console.warn('Failed to save complaint locally:', localError);
      }

      showAlertWithNavBarReset('Success', 'Complaint submitted successfully', () => {
        setDescription('');
        setVisibility('public');
        setImage(null);
        setCategory('Electrical');
        navigation.goBack();
      });

    } catch (error) {
      console.error('Submission error:', error);
      setConnectionError(true);

      if (error.message === 'Connection timeout' || error.code === 'unavailable') {
        // Save to local storage for offline access
        try {
          const existingComplaints = await AsyncStorage.getItem('complaints');
          const complaints = existingComplaints ? JSON.parse(existingComplaints) : [];

          const offlineComplaint = {
            id: `offline_${Date.now()}`,
            description: description.trim(),
            visibility,
            category,
            status: 'Submitted (Offline)',
            votes: 0,
            date: new Date().toISOString().split('T')[0],
            submittedBy: userData.username || 'Anonymous',
            userId: userData.id || userData.uid || userData.userId || 'unknown-user',
            userEmail: userData.email || userData.username || '',
            userName: userData.name || 'Anonymous',
            userHostel: userData.hostel || '',
            userRoom: userData.room || '',
            userType: userData.userType || 'student',
            imageUrl: image || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            offline: true
          };

          complaints.push(offlineComplaint);
          await AsyncStorage.setItem('complaints', JSON.stringify(complaints));

          showAlertWithNavBarReset(
            'Saved Offline',
            'Complaint saved locally. It will sync when you have internet connection.',
            () => {
              setDescription('');
              setVisibility('public');
              setImage(null);
              setCategory('Electrical');
              navigation.goBack();
            }
          );
        } catch (localError) {
          console.warn('Failed to save complaint locally:', localError);
          showAlertWithNavBarReset('Error', 'Failed to save complaint even locally');
        }
      } else {
        showAlertWithNavBarReset('Error', `Failed to submit complaint: ${error.message}`);
      }
    } finally {
      setUploading(false);
    }
  };

  // ... (styles remain the same as your previous code)

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: isDarkMode ? '#121212' : 'white'
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDarkMode ? '#121212' : 'white'
    },
    loadingText: {
      color: isDarkMode ? 'white' : 'black',
      marginTop: 10
    },
    label: {
      marginTop: 15,
      marginBottom: 5,
      fontSize: 16,
      fontWeight: '600',
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
      color: isDarkMode ? 'white' : 'black',
      fontSize: 14
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
      color: isDarkMode ? 'white' : 'black',
      fontSize: 12
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
      alignItems: 'center',
      marginRight: 10,
      marginBottom: 10
    },
    buttonText: {
      color: isDarkMode ? 'white' : 'black',
      marginLeft: 5,
      fontSize: 12
    },
    buttonGroup: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
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
      fontStyle: 'italic',
      textAlign: 'center',
      marginBottom: 10
    },
    connectionError: {
      backgroundColor: isDarkMode ? '#330000' : '#ffdddd',
      padding: 10,
      borderRadius: 5,
      marginBottom: 10,
      borderLeftWidth: 4,
      borderLeftColor: '#ff0000'
    },
    connectionErrorText: {
      color: '#ff0000',
      textAlign: 'center',
      fontSize: 12
    },
    uploadLoadingContainer: {
      alignItems: 'center',
      marginVertical: 10
    },
  });

  if (loadingUserData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading user data...</Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="alert-circle" size={50} color="#ff6b6b" />
        <Text style={styles.loadingText}>User data not found</Text>
        <TouchableOpacity
          style={[styles.imageButton, { marginTop: 20 }]}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {connectionError && (
        <View style={styles.connectionError}>
          <Text style={styles.connectionErrorText}>
            ⚠️ Connection issue detected. Your complaint will be saved locally.
          </Text>
        </View>
      )}

      <Text style={styles.label}>Category:</Text>
      <View style={styles.categoryContainer}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.categoryButton, category === cat && styles.categoryButtonSelected]}
            onPress={() => setCategory(cat)}
            disabled={uploading}
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
        placeholderTextColor={isDarkMode ? '#aaa' : '#888'}
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        editable={!uploading}
      />

      <Text style={styles.label}>Visibility:</Text>
      <View style={styles.radioContainer}>
        <TouchableOpacity
          style={[styles.radioButton, visibility === 'public' && styles.radioButtonSelected]}
          onPress={() => setVisibility('public')}
          disabled={uploading}
        >
          {visibility === 'public' && <View style={styles.radioInner} />}
        </TouchableOpacity>
        <Text style={styles.radioText}>Public (Visible to all students)</Text>
      </View>

      <View style={styles.radioContainer}>
        <TouchableOpacity
          style={[styles.radioButton, visibility === 'private' && styles.radioButtonSelected]}
          onPress={() => setVisibility('private')}
          disabled={uploading}
        >
          {visibility === 'private' && <View style={styles.radioInner} />}
        </TouchableOpacity>
        <Text style={styles.radioText}>Private (Only visible to warden/staff)</Text>
      </View>

      <Text style={styles.label}>Add Photo (Optional):</Text>
      <View style={styles.imageContainer}>
        {image && (
          <>
            <Image
              source={{ uri: image }}
              style={styles.image}
              resizeMode="cover"
            />
            <Text style={styles.selectedImageText}>Image selected</Text>
          </>
        )}

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.imageButton}
            onPress={pickImage}
            disabled={uploading}
          >
            <Ionicons
              name="image"
              size={16}
              color={isDarkMode ? 'white' : 'black'}
            />
            <Text style={styles.buttonText}>Choose Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.imageButton}
            onPress={takePhoto}
            disabled={uploading}
          >
            <Ionicons
              name="camera"
              size={16}
              color={isDarkMode ? 'white' : 'black'}
            />
            <Text style={styles.buttonText}>Take Photo</Text>
          </TouchableOpacity>

          {image && (
            <TouchableOpacity
              style={[styles.imageButton, { backgroundColor: isDarkMode ? '#ff4444' : '#ff6b6b' }]}
              onPress={() => setImage(null)}
              disabled={uploading}
            >
              <Ionicons
                name="close"
                size={16}
                color="white"
              />
              <Text style={[styles.buttonText, { color: 'white' }]}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {uploading && (
        <View style={styles.uploadLoadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>Uploading your complaint...</Text>
        </View>
      )}

      <View style={styles.submitButton}>
        <Button
          title={uploading ? "Submitting..." : "Submit Complaint"}
          onPress={handleSubmit}
          color="#007AFF"
          disabled={uploading || !description.trim()}
        />
      </View>
    </ScrollView>
  );
}
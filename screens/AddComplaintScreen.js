import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../context/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import { ref, push, set, serverTimestamp } from 'firebase/database';
import { database } from '../firebase/config';
import CloudinaryService from '../services/cloudinaryService';

export default function AddComplaintScreen({ navigation, route }) {
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [category, setCategory] = useState('Electrical');
  const [image, setImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [userData, setUserData] = useState(null);
  const { isDarkMode } = useContext(ThemeContext);

  const categories = [
    'Electrical', 'Plumbing', 'Carpentry', 'Cleaning',
    'Infrastructure', 'Furniture', 'Other'
  ];

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUserData = await AsyncStorage.getItem('userData');
        if (storedUserData) {
          setUserData(JSON.parse(storedUserData));
          console.log(storedUserData);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
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

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const removeImage = () => {
    setImage(null);
  };

  const uploadToCloudinary = async () => {
    if (!image) return null;

    setImageUploading(true);
    try {
      const imageUrl = await CloudinaryService.uploadImage(image);
      return imageUrl;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      Alert.alert('Upload Failed', 'Could not upload image. Please try again or submit without image.');
      return null;
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    if (!database) {
      Alert.alert('Error', 'Database connection not available. Please try again later.');
      return;
    }

    setUploading(true);

    try {
      let imageUrl = null;

      if (image) {
        imageUrl = await uploadToCloudinary();
        if (!imageUrl) {
          Alert.alert('Warning', 'Image upload failed. Submitting without image.');
        }
      }

      const complaintData = {
        description: description.trim(),
        visibility,
        category,
        status: 'Submitted',
        votes: 0,
        date: new Date().toISOString().split('T')[0],
        submittedBy: userData?.username || 'Anonymous',
        userId: userData?.id || 'unknown-user',
        userEmail: userData?.email || userData?.username || '',
        userName: userData?.name || 'Anonymous',
        userHostel: userData?.hostel || '',
        userRoom: userData?.room || '',
        userType: userData?.userType || 'student',
        hostelType: userData?.hostelGender || 'undefine',
        imageUrl: imageUrl || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      console.log('Submitting complaint to Realtime Database...');

      const complaintsRef = ref(database, 'complaints');
      const newComplaintRef = push(complaintsRef);

      await set(newComplaintRef, complaintData);

      console.log('Complaint submitted with ID:', newComplaintRef.key);

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

      Alert.alert('Success', 'Complaint submitted successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setDescription('');
            setVisibility('public');
            setImage(null);
            setCategory('Electrical');
            navigation.goBack();
          }
        }
      ]);

    } catch (error) {
      console.error('Submission error:', error);

      if (error.message.includes('_checkNotDeleted') || error.message.includes('Firebase')) {
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
            submittedBy: userData?.username || 'Anonymous',
            userId: userData?.id || 'unknown-user',
            userEmail: userData?.email || userData?.username || '',
            userName: userData?.name || 'Anonymous',
            userHostel: userData?.hostel || '',
            userRoom: userData?.room || '',
            userType: userData?.userType || 'student',
            imageUrl: image || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            offline: true
          };

          complaints.push(offlineComplaint);
          await AsyncStorage.setItem('complaints', JSON.stringify(complaints));

          Alert.alert(
            'Saved Offline',
            'Complaint saved locally. It will sync when you have connection.',
            [
              {
                text: 'OK',
                onPress: () => {
                  setDescription('');
                  setVisibility('public');
                  setImage(null);
                  setCategory('Electrical');
                  navigation.goBack();
                }
              }
            ]
          );
        } catch (localError) {
          console.error('Local save error:', localError);
          Alert.alert('Error', 'Failed to save complaint. Please try again.');
        }
      } else {
        Alert.alert('Error', 'Failed to submit complaint. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
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
      flex: 1,
      padding: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 30,
      marginTop: 10,
    },
    backButton: {
      marginRight: 15,
      backgroundColor: 'white',
      borderRadius: 20,
      padding: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: 'white',
      textAlign: 'center',
      flex: 1,
      marginRight: 40,
    },
    card: {
      backgroundColor: 'white',
      borderRadius: 20,
      padding: 25,
      marginBottom: 25,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 10,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#007AFF',
      marginBottom: 15,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333',
      marginBottom: 10,
    },
    categoryContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 20,
    },
    categoryButton: {
      backgroundColor: '#F8FBFF',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
      margin: 5,
      borderWidth: 2,
      borderColor: '#E3F2FD',
    },
    categoryButtonSelected: {
      backgroundColor: '#007AFF',
      borderColor: '#007AFF',
    },
    categoryText: {
      fontSize: 14,
      fontWeight: '500',
      color: '#007AFF',
    },
    categoryTextSelected: {
      color: 'white',
    },
    input: {
      borderWidth: 2,
      borderColor: '#E3F2FD',
      backgroundColor: '#F8FBFF',
      borderRadius: 15,
      padding: 15,
      fontSize: 16,
      color: '#007AFF',
      minHeight: 120,
      textAlignVertical: 'top',
      marginBottom: 20,
    },
    radioContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
      padding: 12,
      backgroundColor: '#F8FBFF',
      borderRadius: 12,
      borderWidth: 2,
      borderColor: '#E3F2FD',
    },
    radioButton: {
      height: 22,
      width: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: '#007AFF',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    radioButtonSelected: {
      backgroundColor: '#007AFF',
    },
    radioInner: {
      height: 10,
      width: 10,
      borderRadius: 5,
      backgroundColor: 'white',
    },
    radioText: {
      fontSize: 14,
      color: '#333',
      fontWeight: '500',
      flex: 1,
    },
    imageContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    image: {
      width: '100%',
      height: 200,
      borderRadius: 15,
      marginBottom: 15,
      borderWidth: 3,
      borderColor: '#E3F2FD',
    },
    imageButtonsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
    },
    imageButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#007AFF',
      paddingHorizontal: 15,
      paddingVertical: 10,
      borderRadius: 25,
      margin: 5,
      shadowColor: '#007AFF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
    },
    removeButton: {
      backgroundColor: '#FF3B30',
    },
    buttonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 8,
    },
    submitButton: {
      backgroundColor: '#007AFF',
      padding: 10,
      borderRadius: 15,
      alignItems: 'center',
      marginTop: 10,
      shadowColor: '#007AFF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 5,
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 50
    },
    submitButtonDisabled: {
      backgroundColor: '#88B2FF',
    },
    submitButtonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: 'bold',
      marginLeft: 8,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#007AFF',
    },
    loadingText: {
      color: 'white',
      fontSize: 18,
      marginTop: 20,
      fontWeight: '600',
    },
    uploadStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 10,
      backgroundColor: '#E3F2FD',
      borderRadius: 10,
      marginVertical: 10,
    },
    uploadStatusText: {
      color: '#007AFF',
      fontSize: 14,
      fontWeight: '500',
      marginLeft: 10,
    },
    selectedImageText: {
      color: '#007AFF',
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 10,
    },
    characterCount: {
      textAlign: 'right',
      color: '#88B2FF',
      fontSize: 12,
      marginTop: -15,
      marginBottom: 10,
    },
  });

  if (!userData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="white" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.backgroundContainer}>
        <View style={styles.gradientOverlay} />
      </View>

      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Complaint Details</Text>

          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryButton,
                  category === cat && styles.categoryButtonSelected
                ]}
                onPress={() => setCategory(cat)}
                disabled={uploading || imageUploading}
              >
                <Text style={[
                  styles.categoryText,
                  category === cat && styles.categoryTextSelected
                ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.input}
            placeholder="Describe your issue in details"
            placeholderTextColor="#88B2FF"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            editable={!uploading && !imageUploading}
            maxLength={500}
          />
          <Text style={styles.characterCount}>
            {description.length}/500 characters
          </Text>

          <Text style={styles.label}>Visibility</Text>
          <View style={styles.radioContainer}>
            <TouchableOpacity
              style={[
                styles.radioButton,
                visibility === 'public' && styles.radioButtonSelected
              ]}
              onPress={() => setVisibility('public')}
              disabled={uploading || imageUploading}
            >
              {visibility === 'public' && <View style={styles.radioInner} />}
            </TouchableOpacity>
            <Text style={styles.radioText}>
              Public (Visible to all students)
            </Text>
          </View>

          <View style={styles.radioContainer}>
            <TouchableOpacity
              style={[
                styles.radioButton,
                visibility === 'private' && styles.radioButtonSelected
              ]}
              onPress={() => setVisibility('private')}
              disabled={uploading || imageUploading}
            >
              {visibility === 'private' && <View style={styles.radioInner} />}
            </TouchableOpacity>
            <Text style={styles.radioText}>
              Private (Only visible to warden/staff)
            </Text>
          </View>

          <Text style={styles.label}>Add Photo (Optional)</Text>
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

            {imageUploading && (
              <View style={styles.uploadStatus}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.uploadStatusText}>Uploading image...</Text>
              </View>
            )}

            <View style={styles.imageButtonsContainer}>
              <TouchableOpacity
                style={styles.imageButton}
                onPress={pickImage}
                disabled={uploading || imageUploading}
              >
                <Ionicons name="image" size={18} color="white" />
                <Text style={styles.buttonText}>Choose Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.imageButton}
                onPress={takePhoto}
                disabled={uploading || imageUploading}
              >
                <Ionicons name="camera" size={18} color="white" />
                <Text style={styles.buttonText}>Take Photo</Text>
              </TouchableOpacity>

              {image && (
                <TouchableOpacity
                  style={[styles.imageButton, styles.removeButton]}
                  onPress={removeImage}
                  disabled={uploading || imageUploading}
                >
                  <Ionicons name="close" size={18} color="white" />
                  <Text style={styles.buttonText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            (uploading || imageUploading || !description.trim()) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={uploading || imageUploading || !description.trim()}
        >
          {uploading &&
            <ActivityIndicator color="white" />
          }
          <Text style={styles.submitButtonText}>
            {uploading ? "Submitting..." : "Submit Complaint"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
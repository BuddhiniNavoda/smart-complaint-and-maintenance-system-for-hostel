import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Switch, ScrollView } from 'react-native';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from "expo-image-picker";
import { ThemeContext } from '../context/ThemeContext';

const defaultProfilePicture = require("../assets/default_profile_picture.png");

export default function SettingsScreen({ navigation, route }) {
    const [userData, setUserData] = useState(null);
    const [image, setImage] = useState(defaultProfilePicture);
    const [isLoading, setIsLoading] = useState(true);
    const { isDarkMode: darkMode, toggleTheme } = useContext(ThemeContext);

    // Load user data from AsyncStorage and profile picture
    useEffect(() => {
        const loadUserData = async () => {
            try {
                // Load user data from AsyncStorage
                const storedUserData = await AsyncStorage.getItem('userData');
                if (storedUserData) {
                    const parsedData = JSON.parse(storedUserData);
                    setUserData(parsedData);

                    // Load profile picture
                    const savedImage = await AsyncStorage.getItem(`Fixora_profilePicture_${parsedData.username}`);
                    if (savedImage) {
                        setImage({ uri: savedImage });
                    }
                } else if (route.params?.userData) {
                    // Fallback to route params if AsyncStorage doesn't have data
                    setUserData(route.params.userData);

                    // Load profile picture for route params user
                    const savedImage = await AsyncStorage.getItem(`Fixora_profilePicture_${route.params.userData.username}`);
                    if (savedImage) {
                        setImage({ uri: savedImage });
                    }
                }
            } catch (error) {
                console.error('Error loading user data:', error);
                Alert.alert("Error", "Failed to load user data");
            } finally {
                setIsLoading(false);
            }
        };

        loadUserData();
    }, [route.params]);

    const handleLogout = async () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Logout",
                    onPress: async () => {
                        try {
                            await AsyncStorage.removeItem('userData');
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            });
                        } catch (error) {
                            Alert.alert("Error", "Failed to logout");
                            console.error('Error during logout:', error);
                        }
                    },
                    style: "destructive"
                }
            ]
        );
    };

    const pickImage = async () => {
        if (!userData) return;

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            const imageUri = result.assets[0].uri;
            setImage({ uri: imageUri });

            try {
                await AsyncStorage.setItem(`Fixora_profilePicture_${userData.username}`, imageUri);
                Alert.alert("Success", "Profile picture updated successfully");
            } catch (error) {
                console.error("Error saving profile picture:", error);
                Alert.alert("Error", "Failed to save profile picture");
            }
        }
    };

    const clearProfilePicture = async () => {
        if (!userData) return;

        try {
            await AsyncStorage.removeItem(`Fixora_profilePicture_${userData.username}`);
            setImage(defaultProfilePicture);
            Alert.alert("Success", "Profile picture removed");
        } catch (error) {
            console.error("Error removing profile picture:", error);
            Alert.alert("Error", "Failed to remove profile picture");
        }
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            padding: 20,
            backgroundColor: darkMode ? '#121212' : '#f5f5f5'
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 30
        },
        backButton: {
            marginRight: 15
        },
        title: {
            fontSize: 24,
            fontWeight: 'bold',
            color: darkMode ? 'white' : 'black'
        },
        section: {
            marginBottom: 30
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: 15,
            color: darkMode ? 'white' : 'black'
        },
        settingItem: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 15,
            borderBottomWidth: 1,
            borderBottomColor: darkMode ? '#333' : '#ddd'
        },
        settingText: {
            fontSize: 16,
            color: darkMode ? 'white' : 'black'
        },
        userInfoContainer: {
            backgroundColor: darkMode ? '#1e1e1e' : 'white',
            borderRadius: 10,
            padding: 15,
            marginBottom: 20,
            shadowColor: darkMode ? '#333' : '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
        },
        profileImageContainer: {
            alignItems: 'center',
            marginBottom: 15
        },
        profileImage: {
            width: 90,
            height: 90,
            borderRadius: 45,
            marginBottom: 10
        },
        profileImageButtons: {
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 10
        },
        profileImageButton: {
            padding: 5,
            backgroundColor: darkMode ? '#333' : '#ddd',
            borderRadius: 5
        },
        profileImageButtonText: {
            color: darkMode ? 'white' : 'black',
            fontSize: 12
        },
        userInfoRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 10
        },
        userInfoLabel: {
            color: darkMode ? '#aaa' : '#666',
            fontSize: 14
        },
        userInfoValue: {
            color: darkMode ? 'white' : 'black',
            fontSize: 16,
            fontWeight: '500'
        },
        logoutButton: {
            backgroundColor: '#ff3b30',
            padding: 15,
            borderRadius: 10,
            alignItems: 'center',
            marginTop: 20,
            marginBottom: 50
        },
        logoutText: {
            color: 'white',
            fontSize: 16,
            fontWeight: 'bold'
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: darkMode ? '#121212' : '#f5f5f5'
        },
        loadingText: {
            color: darkMode ? 'white' : 'black',
            fontSize: 16,
            marginTop: 10
        }
    });

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    if (!userData) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>No User Data Found</Text>
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={() => navigation.navigate('Login')}
                >
                    <Text style={styles.logoutText}>Go to Login</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.userInfoContainer}>
                <View style={styles.profileImageContainer}>
                    <TouchableOpacity onPress={pickImage}>
                        <Image
                            source={image}
                            style={styles.profileImage}
                        />
                    </TouchableOpacity>
                    <View style={styles.profileImageButtons}>
                        <TouchableOpacity onPress={pickImage} style={styles.profileImageButton}>
                            <Text style={styles.profileImageButtonText}>Change</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={clearProfilePicture} style={styles.profileImageButton}>
                            <Text style={styles.profileImageButtonText}>Remove</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.userInfoRow}>
                    <Text style={styles.userInfoLabel}>Name:</Text>
                    <Text style={styles.userInfoValue}>{userData.name || 'N/A'}</Text>
                </View>
                <View style={styles.userInfoRow}>
                    <Text style={styles.userInfoLabel}>Email:</Text>
                    <Text style={styles.userInfoValue}>{userData.email || userData.username || 'N/A'}</Text>
                </View>
                <View style={styles.userInfoRow}>
                    <Text style={styles.userInfoLabel}>User Type:</Text>
                    <Text style={styles.userInfoValue}>{userData.userType || 'N/A'}</Text>
                </View>

                {userData.userType === 'student' && (
                    <>
                        <View style={styles.userInfoRow}>
                            <Text style={styles.userInfoLabel}>Hostel:</Text>
                            <Text style={styles.userInfoValue}>{userData.hostel || 'N/A'}</Text>
                        </View>
                        <View style={styles.userInfoRow}>
                            <Text style={styles.userInfoLabel}>Room:</Text>
                            <Text style={styles.userInfoValue}>{userData.room || 'N/A'}</Text>
                        </View>
                    </>
                )}

                {userData.userType === 'warden' && (
                    <View style={styles.userInfoRow}>
                        <Text style={styles.userInfoLabel}>Responsibility:</Text>
                        <Text style={styles.userInfoValue}>{userData.hostel || userData.responsibility || 'N/A'}</Text>
                    </View>
                )}

                {userData.userType === 'staff' && (
                    <View style={styles.userInfoRow}>
                        <Text style={styles.userInfoLabel}>Department:</Text>
                        <Text style={styles.userInfoValue}>{userData.department || 'N/A'}</Text>
                    </View>
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Appearance</Text>
                <View style={styles.settingItem}>
                    <Text style={styles.settingText}>Dark Mode</Text>
                    <Switch
                        value={darkMode}
                        onValueChange={toggleTheme}
                        trackColor={{ false: '#767577', true: '#007AFF' }}
                        thumbColor={darkMode ? '#f5f5f5' : '#f4f3f4'}
                    />
                </View>
            </View>

            <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Account</Text>
                <TouchableOpacity
                    onPress={() => Alert.alert("Info", "Account management features coming soon!")}
                >
                    <Text style={[styles.settingText, { marginBottom: 0 }]}>Change Password</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
            >
                <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}
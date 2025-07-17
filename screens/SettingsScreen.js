import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Switch, ScrollView } from 'react-native';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from "expo-image-picker";
import { ThemeContext } from '../context/ThemeContext';

const defaultProfilePicture = require("../assets/default_profile_picture.png");

export default function SettingsScreen({ navigation, route }) {
    const { userData } = route.params;
    const [image, setImage] = useState(defaultProfilePicture);
    const [isLoading, setIsLoading] = useState(true);
    const { isDarkMode: darkMode, toggleTheme } = useContext(ThemeContext);

    // Load saved theme preference and profile picture
    useEffect(() => {
        const loadSettings = async () => {
            try {
                // Load profile picture
                const savedImage = await AsyncStorage.getItem(`Fixora_profilePicture_${userData.username}`);
                if (savedImage) {
                    setImage({ uri: savedImage });
                }
            } catch (error) {
                console.error('Error loading settings:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadSettings();
    }, [userData.username]);

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('userData');
            navigation.navigate('Login');
        } catch (error) {
            Alert.alert("Error", "Failed to logout");
            console.error('Error during logout:', error);
        }
    };

    const pickImage = async () => {
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
            } catch (error) {
                console.error("Error saving profile picture:", error);
            }
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
        profileImage: {
            width: 90,
            height: 90,
            borderRadius: 45,
            marginBottom: 15,
            alignSelf: 'center'
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
            fontSize: 16
        },
        logoutButton: {
            backgroundColor: '#ff3b30',
            padding: 15,
            borderRadius: 10,
            alignItems: 'center',
            marginTop: 20
        },
        logoutText: {
            color: 'white',
            fontSize: 16,
            fontWeight: 'bold'
        }
    });

    if (isLoading) {
        return null; // Or a loading spinner
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.userInfoContainer}>
                <TouchableOpacity onPress={pickImage}>
                    <Image
                        source={image}
                        style={styles.profileImage}
                    />
                </TouchableOpacity>

                <View style={styles.userInfoRow}>
                    <Text style={styles.userInfoLabel}>Name:</Text>
                    <Text style={styles.userInfoValue}>{userData.name}</Text>
                </View>
                <View style={styles.userInfoRow}>
                    <Text style={styles.userInfoLabel}>Username:</Text>
                    <Text style={styles.userInfoValue}>{userData.username}</Text>
                </View>
                <View style={styles.userInfoRow}>
                    <Text style={styles.userInfoLabel}>User Type:</Text>
                    <Text style={styles.userInfoValue}>{userData.userType}</Text>
                </View>

                {userData.userType === 'student' && (
                    <>
                        <View style={styles.userInfoRow}>
                            <Text style={styles.userInfoLabel}>Hostel:</Text>
                            <Text style={styles.userInfoValue}>{userData.hostel}</Text>
                        </View>
                        <View style={styles.userInfoRow}>
                            <Text style={styles.userInfoLabel}>Room:</Text>
                            <Text style={styles.userInfoValue}>{userData.room}</Text>
                        </View>
                    </>
                )}

                {userData.userType === 'warden' && (
                    <View style={styles.userInfoRow}>
                        <Text style={styles.userInfoLabel}>Responsibility:</Text>
                        <Text style={styles.userInfoValue}>{userData.hostel}</Text>
                    </View>
                )}

                {userData.userType === 'staff' && (
                    <View style={styles.userInfoRow}>
                        <Text style={styles.userInfoLabel}>Department:</Text>
                        <Text style={styles.userInfoValue}>{userData.department}</Text>
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

            <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
            >
                <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}
import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    Switch,
    ScrollView,
    ActivityIndicator,
    Modal,
    TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import { get, ref, update } from 'firebase/database';
import { database } from '../firebase/config';

const defaultProfilePicture = require("../assets/default_profile_picture.png");

export default function SettingsScreen({ navigation, route }) {
    const [userData, setUserData] = useState(null);
    const [image, setImage] = useState(defaultProfilePicture);
    const [isLoading, setIsLoading] = useState(true);
    const { isDarkMode, toggleTheme } = useContext(ThemeContext);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert("Error", "Please fill in all password fields");
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert("Error", "New password must be at least 6 characters long");
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert("Error", "New passwords don't match");
            return;
        }

        if (currentPassword === newPassword) {
            Alert.alert("Error", "New password must be different from current password");
            return;
        }

        setChangingPassword(true);

        try {
            // Get current password from Firebase
            const userRef = ref(database, `users/${userData.id}`);
            const snapshot = await get(userRef);

            if (!snapshot.exists()) {
                Alert.alert("Error", "User not found in database");
                setChangingPassword(false);
                return;
            }

            const userDataFromFirebase = snapshot.val();
            const currentPasswordFromFirebase = userDataFromFirebase.password;

            // Verify current password
            if (currentPassword !== currentPasswordFromFirebase) {
                Alert.alert("Error", "Current password is incorrect");
                setChangingPassword(false);
                return;
            }

            // Update password in Firebase
            await update(userRef, {
                password: newPassword,
                updatedAt: new Date().toISOString()
            });

            // Update local storage (without storing password)
            const updatedUserData = {
                ...userData,
                updatedAt: new Date().toISOString()
            };
            await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
            setUserData(updatedUserData);

            Alert.alert("Success", "Password changed successfully");
            setShowChangePasswordModal(false);
            resetPasswordForm();

        } catch (error) {
            console.error('Error changing password:', error);
            Alert.alert("Error", "Failed to change password. Please try again.");
        } finally {
            setChangingPassword(false);
        }
    };

    const resetPasswordForm = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
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
            fontSize: 22,
            fontWeight: 'bold',
            marginBottom: 20,
            color: '#007AFF',
            textAlign: 'center',
        },
        profileImageContainer: {
            alignItems: 'center',
            marginBottom: 20,
        },
        profileImage: {
            width: 120,
            height: 120,
            borderRadius: 60,
            marginBottom: 15,
            borderWidth: 4,
            borderColor: '#007AFF',
        },
        profileImageButtons: {
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 15,
        },
        profileImageButton: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#007AFF',
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 25,
            shadowColor: '#007AFF',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
        },
        profileImageButtonText: {
            color: 'white',
            fontSize: 14,
            fontWeight: '600',
            marginLeft: 5,
        },
        userInfoRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#E3F2FD',
        },
        userInfoLabel: {
            color: '#666',
            fontSize: 16,
            fontWeight: '500',
        },
        userInfoValue: {
            color: '#007AFF',
            fontSize: 16,
            fontWeight: '600',
            maxWidth: 200,
            textAlign: 'right'
        },
        settingItem: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 15,
            borderBottomWidth: 1,
            borderBottomColor: '#E3F2FD',
        },
        settingText: {
            fontSize: 16,
            color: '#333',
            fontWeight: '500',
        },
        logoutButton: {
            backgroundColor: '#FF3B30',
            padding: 10,
            borderRadius: 15,
            alignItems: 'center',
            marginTop: 10,
            marginBottom: 10,
            shadowColor: '#FF3B30',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
            flexDirection: 'row',
            justifyContent: 'center',
        },
        logoutText: {
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
        changePasswordButton: {
            backgroundColor: '#E3F2FD',
            padding: 10,
            borderRadius: 10,
            alignSelf: 'flex-end',
            marginBottom: 15,
        },
        changePasswordText: {
            color: '#007AFF',
            fontSize: 14,
            fontWeight: '600',
        },
        iconContainer: {
            backgroundColor: '#E3F2FD',
            borderRadius: 10,
            padding: 8,
            marginRight: 10,
        },
        userTypeBadge: {
            backgroundColor: '#E3F2FD',
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 15,
            marginLeft: 10,
        },
        userTypeText: {
            color: '#007AFF',
            fontSize: 12,
            fontWeight: 'bold',
        },
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            padding: 20,
        },
        modalContent: {
            backgroundColor: 'white',
            borderRadius: 20,
            maxHeight: '80%',
        },
        modalHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: '#F0F0F0',
        },
        modalTitle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: '#007AFF',
        },
        modalBody: {
            maxHeight: 350,
            padding: 20,
        },
        modalLabel: {
            fontSize: 16,
            fontWeight: '600',
            color: '#333',
            marginBottom: 8,
            marginTop: 15,
        },
        passwordInputContainer: {
            position: 'relative',
            marginBottom: 5,
        },
        modalInput: {
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 10,
            padding: 15,
            fontSize: 16,
            backgroundColor: '#f9f9f9',
            paddingRight: 50, // Space for eye icon
        },
        eyeIcon: {
            position: 'absolute',
            right: 15,
            top: 15,
            padding: 5,
        },
        passwordRequirements: {
            marginTop: 20,
            padding: 15,
            backgroundColor: '#F8FBFF',
            borderRadius: 10,
            borderLeftWidth: 4,
            borderLeftColor: '#007AFF',
            marginBottom: 50
        },
        requirementsTitle: {
            fontSize: 14,
            fontWeight: 'bold',
            color: '#007AFF',
            marginBottom: 10,
        },
        requirementItem: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 5,
        },
        requirementText: {
            fontSize: 12,
            color: '#666',
            marginLeft: 8,
        },
        modalFooter: {
            flexDirection: 'row',
            padding: 20,
            borderTopWidth: 1,
            borderTopColor: '#F0F0F0',
        },
        modalButton: {
            flex: 1,
            padding: 15,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            marginHorizontal: 5,
        },
        cancelButton: {
            backgroundColor: '#F0F0F0',
            borderWidth: 1,
            borderColor: '#ddd',
        },
        saveButton: {
            backgroundColor: '#007AFF',
        },
        saveButtonDisabled: {
            backgroundColor: '#ccc',
        },
        cancelButtonText: {
            color: '#666',
            fontSize: 16,
            fontWeight: '600',
        },
        saveButtonText: {
            color: 'white',
            fontSize: 16,
            fontWeight: '600',
        },
        disabledSwitchContainer: {
            opacity: 0.6,
        },
        disabledSwitch: {
            width: 51,
            height: 31,
            borderRadius: 15,
            backgroundColor: '#f0f0f0',
            borderWidth: 1,
            borderColor: '#ddd',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row',
        },
        comingSoonBadge: {
            backgroundColor: '#FFA500',
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 10,
            marginLeft: 10,
        },
        comingSoonText: {
            color: 'white',
            fontSize: 10,
            fontWeight: 'bold',
        },
    });

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="white" />
                <Text style={styles.loadingText}>Loading Settings...</Text>
            </View>
        );
    }

    if (!userData) {
        return (
            <View style={styles.container}>
                <View style={styles.backgroundContainer}>
                    <View style={styles.gradientOverlay} />
                </View>
                <View style={styles.contentContainer}>
                    <View style={styles.card}>
                        <Text style={styles.sectionTitle}>No User Data Found</Text>
                        <TouchableOpacity
                            style={styles.logoutButton}
                            onPress={() => navigation.navigate('Login')}
                        >
                            <Ionicons name="log-in" size={20} color="white" />
                            <Text style={styles.logoutText}>Go to Login</Text>
                        </TouchableOpacity>
                    </View>
                </View>
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
                    <Text style={styles.sectionTitle}>Profile</Text>

                    <View style={styles.profileImageContainer}>
                        <TouchableOpacity onPress={pickImage}>
                            <Image
                                source={image}
                                style={styles.profileImage}
                            />
                        </TouchableOpacity>
                        <View style={styles.profileImageButtons}>
                            <TouchableOpacity onPress={pickImage} style={styles.profileImageButton}>
                                <Ionicons name="camera" size={16} color="white" />
                                <Text style={styles.profileImageButtonText}>Change</Text>
                            </TouchableOpacity>
                            {image !== defaultProfilePicture &&
                                <TouchableOpacity onPress={clearProfilePicture} style={[styles.profileImageButton, { backgroundColor: '#FF3B30' }]}>
                                    <Ionicons name="trash" size={16} color="white" />
                                    <Text style={styles.profileImageButtonText}>Remove</Text>
                                </TouchableOpacity>
                            }
                        </View>
                    </View>

                    <View style={styles.userInfoRow}>
                        <Text style={styles.userInfoLabel}>Name</Text>
                        <Text style={styles.userInfoValue}>{userData.name || 'N/A'}</Text>
                    </View>
                    <View style={styles.userInfoRow}>
                        <Text style={styles.userInfoLabel}>Email</Text>
                        <Text style={styles.userInfoValue}>{userData.email || userData.username || 'N/A'}</Text>
                    </View>
                    <View style={styles.userInfoRow}>
                        <Text style={styles.userInfoLabel}>User Type</Text>
                        <View style={styles.userTypeBadge}>
                            <Text style={styles.userTypeText}>
                                {userData.userType ? userData.userType.toUpperCase() : 'N/A'}
                            </Text>
                        </View>
                    </View>

                    {userData.userType === 'student' && (
                        <>
                            <View style={styles.userInfoRow}>
                                <Text style={styles.userInfoLabel}>Hostel</Text>
                                <Text style={styles.userInfoValue}>{userData.hostel || 'N/A'}</Text>
                            </View>
                            <View style={styles.userInfoRow}>
                                <Text style={styles.userInfoLabel}>Room</Text>
                                <Text style={styles.userInfoValue}>{userData.room || 'N/A'}</Text>
                            </View>
                        </>
                    )}

                    {userData.userType === 'warden' && (
                        <View style={styles.userInfoRow}>
                            <Text style={styles.userInfoLabel}>Responsibility</Text>
                            <Text style={styles.userInfoValue}>{userData.hostel || userData.responsibility || 'N/A'}</Text>
                        </View>
                    )}

                    {userData.userType === 'staff' && (
                        <View style={styles.userInfoRow}>
                            <Text style={styles.userInfoLabel}>Department</Text>
                            <Text style={styles.userInfoValue}>{userData.department || 'N/A'}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Appearance</Text>
                    <View style={styles.settingItem}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="moon" size={18} color="#007AFF" />
                            </View>
                            <Text style={styles.settingText}>Dark Mode</Text>
                            <View style={styles.comingSoonBadge}>
                                <Text style={styles.comingSoonText}>SOON</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={() => {
                                Alert.alert(
                                    "Dark Mode - Coming Soon",
                                    "We're working on bringing dark mode to Fixora. Stay tuned for the next update!",
                                    [
                                        {
                                            text: "Got it!",
                                            style: "default"
                                        }
                                    ]
                                );
                            }}
                            style={styles.disabledSwitchContainer}
                        >
                            <View style={styles.disabledSwitch}>
                                <Ionicons name="moon" size={16} color="#999" />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={[styles.card, { marginBottom: 50 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                        <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Account</Text>
                        <TouchableOpacity
                            style={styles.changePasswordButton}
                            onPress={() => setShowChangePasswordModal(true)}
                        >
                            <Text style={styles.changePasswordText}>Change Password</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                    >
                        <Ionicons name="log-out" size={20} color="white" />
                        <Text style={styles.logoutText}>Log Out</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Change Password Modal */}
            <Modal
                visible={showChangePasswordModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                    setShowChangePasswordModal(false);
                    resetPasswordForm();
                }}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Change Password</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setShowChangePasswordModal(false);
                                    resetPasswordForm();
                                }}
                            >
                                <Ionicons name="close" size={24} color="#007AFF" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <Text style={styles.modalLabel}>Current Password</Text>
                            <View style={styles.passwordInputContainer}>
                                <TextInput
                                    style={styles.modalInput}
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    placeholder="Enter current password"
                                    secureTextEntry={!showCurrentPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                                >
                                    <Ionicons
                                        name={showCurrentPassword ? "eye-off" : "eye"}
                                        size={20}
                                        color="#007AFF"
                                    />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.modalLabel}>New Password</Text>
                            <View style={styles.passwordInputContainer}>
                                <TextInput
                                    style={styles.modalInput}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    placeholder="Enter new password (min. 6 characters)"
                                    secureTextEntry={!showNewPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setShowNewPassword(!showNewPassword)}
                                >
                                    <Ionicons
                                        name={showNewPassword ? "eye-off" : "eye"}
                                        size={20}
                                        color="#007AFF"
                                    />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.modalLabel}>Confirm New Password</Text>
                            <View style={styles.passwordInputContainer}>
                                <TextInput
                                    style={styles.modalInput}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    placeholder="Confirm new password"
                                    secureTextEntry={!showConfirmPassword}
                                    autoCapitalize="none"
                                />
                                <TouchableOpacity
                                    style={styles.eyeIcon}
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    <Ionicons
                                        name={showConfirmPassword ? "eye-off" : "eye"}
                                        size={20}
                                        color="#007AFF"
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* Password Requirements */}
                            <View style={styles.passwordRequirements}>
                                <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                                <View style={styles.requirementItem}>
                                    <Ionicons
                                        name={newPassword.length >= 6 ? "checkmark-circle" : "ellipse-outline"}
                                        size={16}
                                        color={newPassword.length >= 6 ? "#4CAF50" : "#666"}
                                    />
                                    <Text style={styles.requirementText}>At least 6 characters</Text>
                                </View>
                                <View style={styles.requirementItem}>
                                    <Ionicons
                                        name={newPassword === confirmPassword && newPassword.length > 0 ? "checkmark-circle" : "ellipse-outline"}
                                        size={16}
                                        color={newPassword === confirmPassword && newPassword.length > 0 ? "#4CAF50" : "#666"}
                                    />
                                    <Text style={styles.requirementText}>Passwords match</Text>
                                </View>
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setShowChangePasswordModal(false);
                                    resetPasswordForm();
                                    // Reset visibility states
                                    setShowCurrentPassword(false);
                                    setShowNewPassword(false);
                                    setShowConfirmPassword(false);
                                }}
                                disabled={changingPassword}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton,
                                (!currentPassword || !newPassword || !confirmPassword || newPassword.length < 6 || newPassword !== confirmPassword) && styles.saveButtonDisabled
                                ]}
                                onPress={handleChangePassword}
                                disabled={!currentPassword || !newPassword || !confirmPassword || newPassword.length < 6 || newPassword !== confirmPassword || changingPassword}
                            >
                                {changingPassword ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <Text style={styles.saveButtonText}>Change Password</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
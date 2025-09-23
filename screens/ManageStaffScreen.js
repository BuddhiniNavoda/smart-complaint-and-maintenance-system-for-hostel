import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ScrollView,
    TextInput,
    Modal,
    FlatList,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../context/ThemeContext';
import { ref, onValue, off, push, set, remove, update, get } from 'firebase/database';
import { database } from '../firebase/config';

export default function ManageStaffScreen({ navigation, route }) {
    const [staffMembers, setStaffMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [userData, setUserData] = useState(null);
    const { isDarkMode } = useContext(ThemeContext);

    // Form states
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [department, setDepartment] = useState('Maintenance');
    const [phone, setPhone] = useState('');
    const [specialization, setSpecialization] = useState('');

    const departments = [
        'Maintenance',
        'Electrical',
        'Plumbing',
        'Carpentry',
        'Cleaning',
        'Security',
        'Administration'
    ];

    const specializations = [
        'General Maintenance',
        'Electrical Systems',
        'Plumbing',
        'Carpentry',
        'HVAC',
        'Painting',
        'Cleaning',
        'Security'
    ];

    useEffect(() => {
        const loadUserData = async () => {
            try {
                const storedUserData = await AsyncStorage.getItem('userData');
                if (storedUserData) {
                    const parsedData = JSON.parse(storedUserData);
                    setUserData(parsedData);
                }
            } catch (error) {
                console.error('Error loading user data:', error);
            }
        };

        loadUserData();
        loadStaffMembers();

        return () => {
            const staffRef = ref(database, 'staff');
            off(staffRef);
        };
    }, []);

    const loadStaffMembers = () => {
        setLoading(true);
        try {
            const staffRef = ref(database, 'staff');

            onValue(staffRef, (snapshot) => {
                const staffData = snapshot.val();
                const staffArray = [];

                if (staffData) {
                    Object.keys(staffData).forEach(key => {
                        staffArray.push({
                            id: key,
                            ...staffData[key]
                        });
                    });
                }

                console.log(staffArray)
                // Simple gender-based filtering
                const filteredStaff = staffArray.filter(staff => {
                    if (userData?.userType === 'wardenB') {
                        return staff.assignedHostelGender === 'male';
                    } else if (userData?.userType === 'wardenF') {
                        return staff.assignedHostelGender === 'female';
                    }
                    return true;
                });

                setStaffMembers(filteredStaff);
                setLoading(false);
            }, (error) => {
                console.error('Firebase listener error:', error);
                setLoading(false);
            }); 

        } catch (error) {
            console.error('Error loading staff:', error);
            setLoading(false);
        }
    };

    const resetForm = () => {
        setName('');
        setEmail('');
        setPassword('');
        setDepartment('Maintenance');
        setPhone('');
        setSpecialization('General Maintenance');
        setSelectedStaff(null);
    };

    const validateForm = () => {
        if (!name.trim()) {
            Alert.alert('Error', 'Please enter staff name');
            return false;
        }
        if (!email.trim() || !email.includes('@')) {
            Alert.alert('Error', 'Please enter a valid email address');
            return false;
        }
        if (showAddModal && (!password || password.length < 6)) {
            Alert.alert('Error', 'Password must be at least 6 characters long');
            return false;
        }
        if (!phone.trim()) {
            Alert.alert('Error', 'Please enter phone number');
            return false;
        }
        return true;
    };

    const handleAddStaff = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const staffData = {
                name: name.trim(),
                email: email.trim().toLowerCase(),
                password: password,
                department,
                phone: phone.trim(),
                specialization,
                userType: 'staff',
                assignedHostelGender: userData?.userType === 'wardenB' ? 'male' : 'female',
                assignedBy: userData?.name || userData?.username,
                assignedAt: new Date().toISOString(),
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // Add to staff collection
            const staffRef = ref(database, 'staff');
            const newStaffRef = push(staffRef);
            await set(newStaffRef, staffData);

            // Also add to users collection for login
            const usersRef = ref(database, 'users');
            const newUserRef = push(usersRef);
            await set(newUserRef, {
                ...staffData,
                id: newStaffRef.key
            });

            Alert.alert('Success', 'Staff member added successfully');
            setShowAddModal(false);
            resetForm();

        } catch (error) {
            console.error('Error adding staff:', error);
            Alert.alert('Error', 'Failed to add staff member');
        } finally {
            setLoading(false);
        }
    };

    const handleEditStaff = async () => {
        if (!validateForm() || !selectedStaff) return;

        setLoading(true);
        try {
            const staffRef = ref(database, `staff/${selectedStaff.id}`);
            await update(staffRef, {
                name: name.trim(),
                email: email.trim().toLowerCase(),
                department,
                phone: phone.trim(),
                specialization,
                updatedAt: new Date().toISOString()
            });

            // Simple update without complex query
            const usersRef = ref(database, 'users');
            const snapshot = await get(usersRef);

            if (snapshot.exists()) {
                const usersData = snapshot.val();
                Object.keys(usersData).forEach(key => {
                    if (usersData[key].email === selectedStaff.email) {
                        const userRef = ref(database, `users/${key}`);
                        update(userRef, {
                            name: name.trim(),
                            email: email.trim().toLowerCase(),
                            department,
                            phone: phone.trim(),
                            specialization,
                            updatedAt: new Date().toISOString()
                        });
                    }
                });
            }

            Alert.alert('Success', 'Staff member updated successfully');
            setShowEditModal(false);
            resetForm();

        } catch (error) {
            console.error('Error updating staff:', error);
            Alert.alert('Error', 'Failed to update staff member');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteStaff = (staff) => {
        Alert.alert(
            'Delete Staff Member',
            `Are you sure you want to delete ${staff.name}? This action cannot be undone.`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteStaffMember(staff)
                }
            ]
        );
    };

    const deleteStaffMember = async (staff) => {
        setLoading(true);
        try {
            // Delete from staff collection
            const staffRef = ref(database, `staff/${staff.id}`);
            await remove(staffRef);

            // Simple delete without complex query
            const usersRef = ref(database, 'users');
            const snapshot = await get(usersRef);

            if (snapshot.exists()) {
                const usersData = snapshot.val();
                Object.keys(usersData).forEach(key => {
                    if (usersData[key].email === staff.email) {
                        const userRef = ref(database, `users/${key}`);
                        remove(userRef);
                    }
                });
            }

            Alert.alert('Success', 'Staff member deleted successfully');

        } catch (error) {
            console.error('Error deleting staff:', error);
            Alert.alert('Error', 'Failed to delete staff member');
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (staff) => {
        setSelectedStaff(staff);
        setName(staff.name);
        setEmail(staff.email);
        setDepartment(staff.department);
        setPhone(staff.phone);
        setSpecialization(staff.specialization);
        setPassword(''); // Don't show password when editing
        setShowEditModal(true);
    };

    const toggleStaffStatus = async (staff) => {
        setLoading(true);
        try {
            const newStatus = !staff.isActive;
            const staffRef = ref(database, `staff/${staff.id}`);
            await update(staffRef, {
                isActive: newStatus,
                updatedAt: new Date().toISOString()
            });

            // Simple update without complex query
            const usersRef = ref(database, 'users');
            const snapshot = await get(usersRef);

            if (snapshot.exists()) {
                const usersData = snapshot.val();
                Object.keys(usersData).forEach(key => {
                    if (usersData[key].email === staff.email) {
                        const userRef = ref(database, `users/${key}`);
                        update(userRef, {
                            isActive: newStatus,
                            updatedAt: new Date().toISOString()
                        });
                    }
                });
            }

            Alert.alert('Success', `Staff member ${newStatus ? 'activated' : 'deactivated'} successfully`);

        } catch (error) {
            console.error('Error updating staff status:', error);
            Alert.alert('Error', 'Failed to update staff status');
        } finally {
            setLoading(false);
        }
    };

    const renderStaffItem = ({ item }) => (
        <View style={styles.staffCard}>
            <View style={styles.staffHeader}>
                <View style={styles.staffInfo}>
                    <Text style={styles.staffName}>{item.name}</Text>
                    <Text style={styles.staffEmail}>{item.email}</Text>
                    <View style={styles.staffDetails}>
                        <Text style={styles.staffDepartment}>{item.department}</Text>
                        <Text style={styles.staffSpecialization}>{item.specialization}</Text>
                    </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: item.isActive ? '#4CAF50' : '#FF3B30' }]}>
                    <Text style={styles.statusText}>{item.isActive ? 'Active' : 'Inactive'}</Text>
                </View>
            </View>

            <View style={styles.staffFooter}>
                <Text style={styles.staffPhone}>📱 {item.phone}</Text>
                <Text style={styles.staffDate}>Added: {new Date(item.assignedAt).toLocaleDateString()}</Text>
            </View>

            <View style={styles.staffGender}>
                <Text style={styles.genderText}>
                    Hostel: {item.assignedHostelGender === 'male' ? 'Male' : 'Female'}
                </Text>
            </View>

            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => openEditModal(item)}
                >
                    <Ionicons name="create" size={16} color="white" />
                    <Text style={styles.actionButtonText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.toggleButton]}
                    onPress={() => toggleStaffStatus(item)}
                >
                    <Ionicons name={item.isActive ? 'pause' : 'play'} size={16} color="white" />
                    <Text style={styles.actionButtonText}>
                        {item.isActive ? 'Deactivate' : 'Activate'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteStaff(item)}
                >
                    <Ionicons name="trash" size={16} color="white" />
                    <Text style={styles.actionButtonText}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderModal = () => (
        <Modal
            visible={showAddModal || showEditModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => {
                setShowAddModal(false);
                setShowEditModal(false);
                resetForm();
            }}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {showAddModal ? 'Add New Staff Member' : 'Edit Staff Member'}
                        </Text>
                        <TouchableOpacity
                            onPress={() => {
                                setShowAddModal(false);
                                setShowEditModal(false);
                                resetForm();
                            }}
                        >
                            <Ionicons name="close" size={24} color="#007AFF" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody}>
                        <Text style={styles.inputLabel}>Full Name *</Text>
                        <TextInput
                            style={styles.textInput}
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter full name"
                        />

                        <Text style={styles.inputLabel}>Email Address *</Text>
                        <TextInput
                            style={styles.textInput}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Enter email address"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <Text style={styles.inputLabel}>Password *</Text>
                        <TextInput
                            style={styles.textInput}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Enter password"
                            secureTextEntry
                        />

                        <Text style={styles.inputLabel}>Department *</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.optionsContainer}>
                                {departments.map((dept) => (
                                    <TouchableOpacity
                                        key={dept}
                                        style={[
                                            styles.optionButton,
                                            department === dept && styles.optionButtonSelected
                                        ]}
                                        onPress={() => setDepartment(dept)}
                                    >
                                        <Text style={[
                                            styles.optionText,
                                            department === dept && styles.optionTextSelected
                                        ]}>
                                            {dept}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        <Text style={styles.inputLabel}>Specialization</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.optionsContainer}>
                                {specializations.map((spec) => (
                                    <TouchableOpacity
                                        key={spec}
                                        style={[
                                            styles.optionButton,
                                            specialization === spec && styles.optionButtonSelected
                                        ]}
                                        onPress={() => setSpecialization(spec)}
                                    >
                                        <Text style={[
                                            styles.optionText,
                                            specialization === spec && styles.optionTextSelected
                                        ]}>
                                            {spec}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        <Text style={styles.inputLabel}>Phone Number *</Text>
                        <TextInput
                            style={styles.textInput}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="Enter phone number"
                            keyboardType="phone-pad"
                        />

                        <Text style={styles.inputLabel}>Assigned Hostel</Text>
                        <Text style={styles.hostelInfo}>
                            {userData?.userType === 'wardenB' ? 'Male Hostel' : 'Female Hostel'}
                        </Text>
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.cancelButton]}
                            onPress={() => {
                                setShowAddModal(false);
                                setShowEditModal(false);
                                resetForm();
                            }}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalButton, styles.saveButton]}
                            onPress={showAddModal ? handleAddStaff : handleEditStaff}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={styles.saveButtonText}>
                                    {showAddModal ? 'Add Staff' : 'Update Staff'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

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
            marginBottom: 20,
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
            flex: 1,
            textAlign: 'center',
            marginRight: 40,
        },
        headerSubtitle: {
            fontSize: 16,
            color: '#E3F2FD',
            textAlign: 'center',
            marginBottom: 20,
        },
        addButton: {
            backgroundColor: '#007AFF',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 15,
            borderRadius: 15,
            marginBottom: 20,
            shadowColor: '#007AFF',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
        },
        addButtonText: {
            color: 'white',
            fontSize: 18,
            fontWeight: 'bold',
            marginLeft: 10,
        },
        staffCard: {
            backgroundColor: 'white',
            borderRadius: 15,
            padding: 20,
            marginBottom: 15,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
        },
        staffHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 10,
        },
        staffInfo: {
            flex: 1,
        },
        staffName: {
            fontSize: 18,
            fontWeight: 'bold',
            color: '#007AFF',
            marginBottom: 5,
        },
        staffEmail: {
            fontSize: 14,
            color: '#666',
            marginBottom: 8,
        },
        staffDetails: {
            flexDirection: 'row',
            flexWrap: 'wrap',
        },
        staffDepartment: {
            backgroundColor: '#E3F2FD',
            color: '#007AFF',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
            fontSize: 12,
            fontWeight: '600',
            marginRight: 8,
            marginBottom: 4,
        },
        staffSpecialization: {
            backgroundColor: '#F0F0F0',
            color: '#666',
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
            fontSize: 12,
            fontWeight: '500',
            marginBottom: 4,
        },
        statusBadge: {
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
        },
        statusText: {
            color: 'white',
            fontSize: 12,
            fontWeight: 'bold',
        },
        staffFooter: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 15,
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: '#F0F0F0',
        },
        staffPhone: {
            fontSize: 14,
            color: '#666',
        },
        staffDate: {
            fontSize: 12,
            color: '#999',
        },
        actionButtons: {
            flexDirection: 'row',
            justifyContent: 'space-between',
        },
        staffGender: {
            marginBottom: 10,
        },
        genderText: {
            fontSize: 12,
            color: '#007AFF',
            fontWeight: '600',
            backgroundColor: '#E3F2FD',
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 8,
            alignSelf: 'flex-start',
        },
        actionButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 8,
            flex: 1,
            marginHorizontal: 4,
        },
        editButton: {
            backgroundColor: '#007AFF',
        },
        toggleButton: {
            backgroundColor: '#FFA500',
        },
        deleteButton: {
            backgroundColor: '#FF3B30',
        },
        actionButtonText: {
            color: 'white',
            fontSize: 12,
            fontWeight: '600',
            marginLeft: 4,
        },
        emptyState: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 40,
        },
        emptyStateText: {
            fontSize: 18,
            color: '#666',
            textAlign: 'center',
            marginTop: 20,
            marginBottom: 10,
        },
        emptyStateSubtext: {
            fontSize: 14,
            color: '#999',
            textAlign: 'center',
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        // Modal Styles
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            padding: 20,
        },
        modalContent: {
            backgroundColor: 'white',
            borderRadius: 20,
            maxHeight: '90%',
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
            maxHeight: 400,
            padding: 20,
        },
        inputLabel: {
            fontSize: 16,
            fontWeight: '600',
            color: '#333',
            marginBottom: 8,
            marginTop: 15,
        },
        textInput: {
            borderWidth: 1,
            borderColor: '#ddd',
            borderRadius: 10,
            padding: 15,
            fontSize: 16,
            backgroundColor: '#f9f9f9',
        },
        optionsContainer: {
            flexDirection: 'row',
            paddingVertical: 10,
        },
        optionButton: {
            paddingHorizontal: 15,
            paddingVertical: 8,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: '#007AFF',
            marginRight: 10,
            backgroundColor: 'white',
        },
        optionButtonSelected: {
            backgroundColor: '#007AFF',
        },
        optionText: {
            color: '#007AFF',
            fontSize: 14,
            fontWeight: '500',
        },
        optionTextSelected: {
            color: 'white',
        },
        hostelInfo: {
            fontSize: 16,
            color: '#007AFF',
            fontWeight: '600',
            padding: 15,
            backgroundColor: '#E3F2FD',
            borderRadius: 10,
            textAlign: 'center',
            marginBottom: 50
        },
        modalFooter: {
            flexDirection: 'row',
            padding: 20,
            borderTopWidth: 1,
            borderTopColor: '#F0F0F0',
        },
        modalButton: {
            flex: 1,
            padding: 10,
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
    });

    return (
        <View style={styles.container}>
            <View style={styles.backgroundContainer}>
                <View style={styles.gradientOverlay} />
            </View>

            <View style={styles.contentContainer}>
                <Text style={styles.headerSubtitle}>
                    {userData?.userType === 'wardenB' ? 'Male Hostel Staff' :
                        userData?.userType === 'wardenF' ? 'Female Hostel Staff' :
                            'Hostel Staff Management'}
                </Text>

                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setShowAddModal(true)}
                >
                    <Ionicons name="person-add" size={24} color="white" />
                    <Text style={styles.addButtonText}>Add New Staff</Text>
                </TouchableOpacity>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#007AFF" />
                        <Text style={styles.emptyStateText}>Loading staff members...</Text>
                    </View>
                ) : staffMembers.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="people" size={80} color="#E3F2FD" />
                        <Text style={styles.emptyStateText}>No staff members found</Text>
                        <Text style={styles.emptyStateSubtext}>
                            {userData?.userType === 'wardenB' ? 'No male hostel staff members' :
                                userData?.userType === 'wardenF' ? 'No female hostel staff members' :
                                    'Add your first staff member to get started'}
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={staffMembers}
                        keyExtractor={(item) => item.id}
                        renderItem={renderStaffItem}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                    />
                )}

                {renderModal()}
            </View>
        </View>
    );
}
// screens/ManageStaffScreen.js
import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

export default function ManageStaffScreen({ navigation }) {
    const { isDarkMode } = useContext(ThemeContext);
    const [staffList, setStaffList] = useState([]);
    const [newStaff, setNewStaff] = useState({
        name: '',
        email: '',
        department: 'Maintenance'
    });
    const [loading, setLoading] = useState(false);

    const departments = ['Maintenance', 'Electrical', 'Plumbing', 'Cleaning', 'Security'];

    useEffect(() => {
        loadStaff();
    }, []);

    const loadStaff = async () => {
        try {
            const staffData = await AsyncStorage.getItem('staffList');
            if (staffData) {
                setStaffList(JSON.parse(staffData));
            }
        } catch (error) {
            console.error('Error loading staff:', error);
        }
    };

    const addStaff = async () => {
        if (!newStaff.name || !newStaff.email) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        setLoading(true);
        try {
            const newStaffMember = {
                ...newStaff,
                id: Date.now().toString(),
                userType: 'staff',
                username: newStaff.email.split('@')[0],
                password: 'default123' // In real app, generate a temp password or send email
            };

            const updatedStaff = [...staffList, newStaffMember];
            await AsyncStorage.setItem('staffList', JSON.stringify(updatedStaff));
            setStaffList(updatedStaff);
            setNewStaff({ name: '', email: '', department: 'Maintenance' });
            Alert.alert('Success', 'Staff member added successfully');
        } catch (error) {
            console.error('Error adding staff:', error);
            Alert.alert('Error', 'Failed to add staff member');
        } finally {
            setLoading(false);
        }
    };

    const removeStaff = async (id) => {
        try {
            Alert.alert(
                "Confirm Delete",
                "Are you sure you want to delete this item?",
                [
                    {
                        text: "Cancel",
                        style: "cancel"
                    },
                    {
                        text: "Delete",
                        onPress: async () => {
                            const updatedStaff = staffList.filter(staff => staff.id !== id);
                            await AsyncStorage.setItem('staffList', JSON.stringify(updatedStaff));
                            setStaffList(updatedStaff);
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Error removing staff:', error);
        }
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            padding: 20,
            backgroundColor: isDarkMode ? '#121212' : '#f5f5f5'
        },
        title: {
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: 20,
            color: isDarkMode ? 'white' : 'black'
        },
        input: {
            borderWidth: 1,
            padding: 15,
            marginBottom: 15,
            borderRadius: 10,
            borderColor: isDarkMode ? '#333' : '#ddd',
            backgroundColor: isDarkMode ? '#333' : 'white',
            color: isDarkMode ? 'white' : 'black'
        },
        pickerContainer: {
            borderWidth: 1,
            borderColor: isDarkMode ? '#333' : '#ddd',
            borderRadius: 10,
            marginBottom: 15,
            backgroundColor: isDarkMode ? '#333' : 'white',
        },
        picker: {
            color: isDarkMode ? 'white' : 'black',
            padding: 15
        },
        addButton: {
            backgroundColor: '#007AFF',
            padding: 15,
            borderRadius: 10,
            alignItems: 'center',
            marginBottom: 20
        },
        buttonText: {
            color: 'white',
            fontWeight: 'bold'
        },
        staffCard: {
            backgroundColor: isDarkMode ? '#1e1e1e' : 'white',
            padding: 15,
            borderRadius: 10,
            marginBottom: 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        staffInfo: {
            flex: 1
        },
        staffName: {
            fontSize: 16,
            fontWeight: 'bold',
            color: isDarkMode ? 'white' : 'black'
        },
        staffDetail: {
            color: isDarkMode ? '#aaa' : '#666'
        },
        deleteButton: {
            padding: 8,
            borderRadius: 20,
            backgroundColor: '#ff3b30'
        }
    });

    return (
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                placeholder="Staff Name"
                value={newStaff.name}
                onChangeText={text => setNewStaff({ ...newStaff, name: text })}
                placeholderTextColor={isDarkMode ? '#aaa' : '#888'}
            />

            <TextInput
                style={styles.input}
                placeholder="Email"
                value={newStaff.email}
                onChangeText={text => setNewStaff({ ...newStaff, email: text })}
                keyboardType="email-address"
                placeholderTextColor={isDarkMode ? '#aaa' : '#888'}
            />

            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={newStaff.department}
                    onValueChange={itemValue => setNewStaff({ ...newStaff, department: itemValue })}
                    style={styles.picker}
                    dropdownIconColor={isDarkMode ? '#aaa' : '#888'}
                >
                    {departments.map(dept => (
                        <Picker.Item key={dept} label={dept} value={dept} />
                    ))}
                </Picker>
            </View>

            <TouchableOpacity
                style={styles.addButton}
                onPress={addStaff}
                disabled={loading}
            >
                <Text style={styles.buttonText}>
                    {loading ? 'Adding...' : 'Add Staff Member'}
                </Text>
            </TouchableOpacity>

            <FlatList
                data={staffList}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View style={styles.staffCard}>
                        <View style={styles.staffInfo}>
                            <Text style={styles.staffName}>{item.name}</Text>
                            <Text style={styles.staffDetail}>{item.email}</Text>
                            <Text style={styles.staffDetail}>{item.department}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => removeStaff(item.id)}
                        >
                            <Ionicons name="trash" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                )}
            />
        </View>
    );
}
import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../context/ThemeContext';

export default function InfoScreen({ navigation }) {
    const { isDarkMode } = useContext(ThemeContext);

    const openLink = (url) => {
        Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            padding: 20,
            backgroundColor: isDarkMode ? '#121212' : '#f5f5f5'
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
            color: isDarkMode ? 'white' : 'black'
        },
        section: {
            marginBottom: 30
        },
        sectionTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: 15,
            color: isDarkMode ? 'white' : 'black'
        },
        text: {
            fontSize: 16,
            marginBottom: 10,
            color: isDarkMode ? 'white' : 'black'
        },
        link: {
            color: '#007AFF',
            textDecorationLine: 'underline'
        },
        developerCard: {
            backgroundColor: isDarkMode ? '#1e1e1e' : 'white',
            borderRadius: 10,
            padding: 15,
            marginBottom: 15,
            shadowColor: isDarkMode ? '#333' : '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
        },
        developerName: {
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: 5,
            color: isDarkMode ? 'white' : 'black'
        },
        contactItem: {
            flexDirection: 'row',
            alignItems: 'center',
            marginVertical: 5
        },
        contactText: {
            marginLeft: 10,
            color: isDarkMode ? 'white' : 'black'
        },
        appVersion: {
            textAlign: 'center',
            marginTop: 20,
            color: isDarkMode ? '#aaa' : '#666'
        }
    });

    return (
        <ScrollView style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>About This App</Text>
                <Text style={styles.text}>
                    Hostel Complaint System is designed to help students and hostel administration
                    manage maintenance requests efficiently.
                </Text>
                <Text style={styles.text}>
                    Students can submit complaints, track their status, and upvote important issues.
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Developers</Text>

                <View style={styles.developerCard}>
                    <Text style={styles.developerName}>K.H.M.R.B.N.Wimalasiri</Text>
                    <TouchableOpacity
                        style={styles.contactItem}
                        onPress={() => openLink('mailto:buddhinikaluwila1999@gmail.com')}
                    >
                        <Ionicons name="mail" size={20} color="#007AFF" />
                        <Text style={styles.contactText}>buddhinikaluwila1999@gmail.com</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.contactItem}
                        onPress={() => openLink('https://github.com/BuddhiniNavoda')}
                    >
                        <Ionicons name="logo-github" size={20} color="#007AFF" />
                        <Text style={styles.contactText}>github.com/BuddhiniNavoda</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.developerCard}>
                    <Text style={styles.developerName}>K.M.P.S.Kulathunga</Text>
                    <TouchableOpacity
                        style={styles.contactItem}
                        onPress={() => openLink('mailto:pramudakulathunga@gmail.com')}
                    >
                        <Ionicons name="mail" size={20} color="#007AFF" />
                        <Text style={styles.contactText}>pramudakulathunga@gmail.com</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.contactItem}
                        onPress={() => openLink('https://github.com/PramudaKulathunga')}
                    >
                        <Ionicons name="logo-github" size={20} color="#007AFF" />
                        <Text style={styles.contactText}>github.com/PramudaKulathunga</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Support</Text>
                <Text style={styles.text}>
                    For any issues or suggestions, please contact us at:
                </Text>
                <TouchableOpacity onPress={() => openLink('mailto:support@hostelapp.com')}>
                    <Text style={[styles.text, styles.link]}>support@hostelapp.com</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.appVersion}>Version 1.0.0</Text>
        </ScrollView>
    );
}
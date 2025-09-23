import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../context/ThemeContext';

export default function InfoScreen({ navigation }) {
    const { isDarkMode } = useContext(ThemeContext);

    const openLink = (url) => {
        Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    };

    // Placeholder images - you can replace these with actual developer images
    const developer1Image = require('../assets/developer1.png');
    const developer2Image = require('../assets/developer2.jpeg');

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
            marginRight: 40, // To balance the back button space
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
        text: {
            fontSize: 16,
            marginBottom: 15,
            color: '#333',
            lineHeight: 22,
            textAlign: 'center',
        },
        link: {
            color: '#007AFF',
            fontWeight: '600',
            textAlign: 'center',
        },
        developerCard: {
            backgroundColor: '#F8FBFF',
            borderRadius: 15,
            padding: 20,
            marginBottom: 20,
            borderWidth: 2,
            borderColor: '#E3F2FD',
            shadowColor: '#007AFF',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 5,
        },
        developerHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 15,
        },
        developerImage: {
            width: 60,
            height: 60,
            borderRadius: 30,
            marginRight: 15,
            borderWidth: 3,
            borderColor: '#007AFF',
        },
        developerInfo: {
            flex: 1,
        },
        developerName: {
            fontSize: 18,
            fontWeight: 'bold',
            color: '#007AFF',
            marginBottom: 2,
        },
        developerRole: {
            fontSize: 14,
            color: '#666',
            fontStyle: 'italic',
        },
        contactItem: {
            flexDirection: 'row',
            alignItems: 'center',
            marginVertical: 8,
            paddingVertical: 5,
        },
        contactText: {
            marginLeft: 12,
            color: '#333',
            fontSize: 14,
            fontWeight: '500',
            maxWidth: 200,
        },
        supportSection: {
            backgroundColor: '#F8FBFF',
            borderRadius: 15,
            padding: 20,
            borderWidth: 2,
            borderColor: '#E3F2FD',
            alignItems: 'center',
        },
        supportText: {
            fontSize: 16,
            color: '#333',
            marginBottom: 15,
            textAlign: 'center',
            lineHeight: 22,
        },
        appVersion: {
            textAlign: 'center',
            marginTop: 30,
            marginBottom: 20,
            color: 'white',
            fontSize: 14,
            fontWeight: '500',
            marginBottom: 50,
        },
        iconContainer: {
            backgroundColor: '#E3F2FD',
            borderRadius: 10,
            padding: 8,
            marginRight: 5,
        },
        contactButton: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#007AFF',
            borderRadius: 12,
            paddingVertical: 10,
            paddingHorizontal: 20,
            marginTop: 10,
            alignSelf: 'center',
            shadowColor: '#007AFF',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5,
        },
        contactButtonText: {
            color: 'white',
            fontWeight: 'bold',
            marginLeft: 8,
            fontSize: 16,
        },
        featureList: {
            marginTop: 10,
        },
        featureItem: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 10,
        },
        featureIcon: {
            marginRight: 10,
            color: '#007AFF',
        },
        featureText: {
            color: '#333',
            fontSize: 14,
        }
    });

    return (
        <View style={styles.container}>
            <View style={styles.backgroundContainer}>
                <View style={styles.gradientOverlay} />
            </View>

            <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <Text style={styles.text}>
                        Fixora is a modern Hostel Complaint System designed to help students and hostel administration
                        manage maintenance requests efficiently and effectively.
                    </Text>

                    <View style={styles.featureList}>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={18} color="#007AFF" style={styles.featureIcon} />
                            <Text style={styles.featureText}>Submit maintenance requests easily</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={18} color="#007AFF" style={styles.featureIcon} />
                            <Text style={styles.featureText}>Track complaint status in real-time</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={18} color="#007AFF" style={styles.featureIcon} />
                            <Text style={styles.featureText}>Upvote important issues</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={18} color="#007AFF" style={styles.featureIcon} />
                            <Text style={styles.featureText}>Streamlined communication</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Development Team</Text>

                    <View style={styles.developerCard}>
                        <View style={styles.developerHeader}>
                            <Image
                                source={developer2Image}
                                style={styles.developerImage}
                            />
                            <View style={styles.developerInfo}>
                                <Text style={styles.developerName}>K.M.P.S. Kulathunga</Text>
                                <Text style={styles.developerRole}>Lead Developer</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.contactItem}
                            onPress={() => openLink('mailto:pramudakulathunga@gmail.com')}
                        >
                            <View style={styles.iconContainer}>
                                <Ionicons name="mail" size={18} color="#007AFF" />
                            </View>
                            <Text style={styles.contactText}>pramudakulathunga@gmail.com</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.contactItem}
                            onPress={() => openLink('https://github.com/PramudaKulathunga')}
                        >
                            <View style={styles.iconContainer}>
                                <Ionicons name="logo-github" size={18} color="#007AFF" />
                            </View>
                            <Text style={styles.contactText}>github.com/PramudaKulathunga</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.developerCard}>
                        <View style={styles.developerHeader}>
                            <Image
                                source={developer1Image}
                                style={styles.developerImage}
                            />
                            <View style={styles.developerInfo}>
                                <Text style={styles.developerName}>K.H.M.R.B.N. Wimalasiri</Text>
                                <Text style={styles.developerRole}>Full Stack Developer</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.contactItem}
                            onPress={() => openLink('mailto:buddhinikaluwila1999@gmail.com')}
                        >
                            <View style={styles.iconContainer}>
                                <Ionicons name="mail" size={18} color="#007AFF" />
                            </View>
                            <Text style={styles.contactText}>buddhinikaluwila1999@gmail.com</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.contactItem}
                            onPress={() => openLink('https://github.com/BuddhiniNavoda')}
                        >
                            <View style={styles.iconContainer}>
                                <Ionicons name="logo-github" size={18} color="#007AFF" />
                            </View>
                            <Text style={styles.contactText}>github.com/BuddhiniNavoda</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.supportSection}>
                        <Text style={styles.sectionTitle}>Support</Text>
                        <Text style={styles.supportText}>
                            For any issues, suggestions, or feedback, please don't hesitate to contact our support team.
                        </Text>

                        <TouchableOpacity
                            style={styles.contactButton}
                            onPress={() => openLink('mailto:pramudakulathunga@gmail.com')}
                        >
                            <Ionicons name="chatbubble-ellipses" size={20} color="white" />
                            <Text style={styles.contactButtonText}>Contact Support</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.appVersion}>Fixora v1.0.0</Text>
            </ScrollView>
        </View>
    );
}
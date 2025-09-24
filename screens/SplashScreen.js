import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Image } from 'react-native';

export default function SplashScreen() {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.7)).current;
    const bgAnim = useRef(new Animated.Value(0)).current;

    // Hide Navigation Bar
    useEffect(() => {
        const hideBars = async () => {
            try {
                // Hide navigation bar
                await NavigationBar.setBehaviorAsync('immersive-sticky');
                await NavigationBar.setVisibilityAsync('hidden');
                await NavigationBar.setBorderColorAsync(color);
                // Hide status bar
                StatusBar.setHidden(true, 'none');
            } catch (err) {
                console.warn('NavigationBar error:', err);
            }
        };
    }, []);
    
    useEffect(() => {
        // Background fade in
        Animated.timing(bgAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();

        // Logo animations
        Animated.sequence([
            // Zoom in
            Animated.timing(scaleAnim, {
                toValue: 1.1,
                duration: 1200,
                easing: Easing.elastic(1),
                useNativeDriver: true,
            }),
            // Slight bounce back
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            })
        ]).start();

        // Text fade in
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            delay: 1000,
            useNativeDriver: true,
        }).start();
    }, [fadeAnim, scaleAnim, bgAnim]);

    return (
        <Animated.View style={[styles.container, { opacity: bgAnim }]}>
            <View style={styles.background}>
                <View style={styles.circle}></View>
                <View style={[styles.circle, styles.circle2]}></View>
                <View style={[styles.circle, styles.circle3]}></View>
            </View>

            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../assets/icon.png')}
                        style={styles.logo}
                    />
                </View>
            </Animated.View>

            <Animated.View style={{ opacity: fadeAnim }}>
                <Text style={styles.text}>Fixora</Text>
                <Text style={styles.subtext}>The smart gateway of hostel complaint management</Text>
            </Animated.View>

            <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
                <Text style={styles.footerText}>Loading...</Text>
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#007AFF',
    },
    background: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    circle: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    circle2: {
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    circle3: {
        width: 500,
        height: 500,
        borderRadius: 250,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
    },
    logoContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
        borderWidth: 4,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    logo: {
        width: 140,
        height: 140,
        resizeMode: 'contain',
        borderRadius:10,
    },
    text: {
        fontSize: 42,
        fontWeight: 'bold',
        color: 'white',
        marginTop: 10,
        textAlign: 'center',
        letterSpacing: 2,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 5,
    },
    subtext: {
        fontSize: 18,
        color: 'rgba(255, 255, 255, 0.9)',
        marginTop: 15,
        textAlign: 'center',
        fontWeight: '500',
        lineHeight: 24,
        paddingHorizontal: 40,
    },
    footer: {
        position: 'absolute',
        bottom: 60,
    },
    footerText: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 16,
        fontWeight: '500',
    },
});
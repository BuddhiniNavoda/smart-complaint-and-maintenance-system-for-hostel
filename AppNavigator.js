import React, { useState, useEffect, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Keyboard, InteractionManager, LogBox } from 'react-native';

// Import all your screens
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import HomeScreen from './screens/HomeScreen';
import AddComplaintScreen from './screens/AddComplaintScreen';
import ComplaintDetailScreen from './screens/ComplaintDetailScreen';
import ManageStaffScreen from './screens/ManageStaffScreen';
import SettingsScreen from './screens/SettingsScreen';
import InfoScreen from './screens/InfoScreen';
import * as NavigationBar from 'expo-navigation-bar';
import { ThemeContext } from './context/ThemeContext';

LogBox.ignoreLogs([
    '`ImagePicker.MediaTypeOptions` have been deprecated. Use `ImagePicker.MediaType` or an array of `ImagePicker.MediaType` instead.',
    'setBehaviorAsync is not supported with edge-to-edge enabled'
]);
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export default function App() {
    const [isLoading, setIsLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const { isDarkMode } = useContext(ThemeContext);

    useEffect(() => {
        const loadUserData = async () => {
            try {
                const storedUserData = await AsyncStorage.getItem('userData');
                if (storedUserData) {
                    setUserData(JSON.parse(storedUserData));
                }
            } catch (error) {
                console.error('Error loading user data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadUserData();
    }, []);

    useEffect(() => {
        const hideNavBar = async () => {
            await NavigationBar.setVisibilityAsync('hidden');
            await NavigationBar.setBehaviorAsync('immersive');
        };

        // Ensure UI is mounted before hiding
        InteractionManager.runAfterInteractions(hideNavBar);
    }, []);

    useEffect(() => {
        const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
            // Show system nav bar when keyboard is open
            NavigationBar.setVisibilityAsync('visible');
        });

        const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
            // Hide again when keyboard closes
            NavigationBar.setVisibilityAsync('hidden');
            NavigationBar.setBehaviorAsync('immersive');
        });

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    function MainTabs({ route }) {
        const { userType, userData } = route.params;

        return (
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    tabBarIcon: ({ focused, color, size }) => {
                        let iconName;

                        if (route.name === 'Home') {
                            iconName = focused ? 'home' : 'home-outline';
                        } else if (route.name === 'AddComplaint') {
                            iconName = focused ? 'add-circle' : 'add-circle-outline';
                        } else if (route.name === 'Settings') {
                            iconName = focused ? 'settings' : 'settings-outline';
                        } else if (route.name === 'Info') {
                            iconName = focused ? 'information-circle' : 'information-circle-outline';
                        }

                        return <Ionicons name={iconName} size={size} color={color} />;
                    },
                    tabBarActiveTintColor: isDarkMode ? 'white' : '#007AFF',
                    tabBarInactiveTintColor: 'gray',
                    tabBarStyle: {
                        backgroundColor: isDarkMode ? '#1e1e1e' : 'white',
                        height: 70,
                    },
                    headerStyle: {
                        backgroundColor: isDarkMode ? '#1e1e1e' : 'white',
                    },
                    headerTitleStyle: {
                        color: isDarkMode ? 'white' : 'black',
                    },
                    headerTintColor: isDarkMode ? 'white' : '#007AFF',
                })}
            >
                <Tab.Screen
                    name="Home"
                    component={HomeScreen}
                    initialParams={{ userType, userData }}
                    options={{ title: 'Dashboard' }}
                />
                {userType === 'student' && (
                    <Tab.Screen
                        name="AddComplaint"
                        component={AddComplaintScreen}
                        initialParams={{ userData }}
                        options={{ title: 'New Complaint' }}
                    />
                )}
                {userType === 'warden' && (
                    <Tab.Screen
                        name="ManageStaff"
                        component={ManageStaffScreen}
                        options={{
                            title: 'Manage Staff',
                            tabBarIcon: ({ color, size }) => (
                                <Ionicons name="people" size={size} color={color} />
                            )
                        }}
                    />
                )}
                <Tab.Screen
                    name="Settings"
                    component={SettingsScreen}
                    initialParams={{ userData }}
                />
                <Tab.Screen name="Info" component={InfoScreen} />
            </Tab.Navigator>
        );
    }

    if (isLoading) {
        return null; // Or a loading screen
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName={userData ? "Main" : "Login"}
                screenOptions={{
                    headerStyle: {
                        backgroundColor: isDarkMode ? '#121212' : 'white',
                    },
                    headerTitleStyle: {
                        color: isDarkMode ? 'white' : 'black',
                    },
                    headerTintColor: isDarkMode ? 'white' : '#007AFF',
                }}
            >
                <Stack.Screen
                    name="Login"
                    component={LoginScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="SignUp"
                    component={SignUpScreen}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="Main"
                    component={MainTabs}
                    initialParams={{ ...userData, isDarkMode }}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="ComplaintDetail"
                    component={ComplaintDetailScreen}
                    options={{
                        title: 'Complaint Details',
                        headerStyle: {
                            backgroundColor: isDarkMode ? '#121212' : 'white',
                        },
                        headerTitleStyle: {
                            color: isDarkMode ? 'white' : 'black',
                        },
                        headerTintColor: isDarkMode ? 'white' : '#007AFF',
                    }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
import React, { useState, useEffect, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Keyboard, InteractionManager, LogBox, View, ActivityIndicator, Text } from 'react-native';

// Import all your screens
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import HomeScreen from './screens/HomeScreen';
import AddComplaintScreen from './screens/AddComplaintScreen';
import ComplaintDetailScreen from './screens/ComplaintDetailScreen';
import ManageStaffScreen from './screens/ManageStaffScreen';
import SettingsScreen from './screens/SettingsScreen';
import InfoScreen from './screens/InfoScreen';
import SplashScreen from './screens/SplashScreen';
import * as NavigationBar from 'expo-navigation-bar';
import { ThemeProvider, ThemeContext } from './context/ThemeContext';

LogBox.ignoreLogs([
    '`ImagePicker.MediaTypeOptions` have been deprecated. Use `ImagePicker.MediaType` or an array of `ImagePicker.MediaType` instead.',
    'setBehaviorAsync is not supported with edge-to-edge enabled'
]);

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export default function NavigationWrapper() {
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
                setTimeout(() => {
                    setIsLoading(false);
                }, 2500);
            }
        };

        loadUserData();
    }, []);

    useEffect(() => {
        const hideNavBar = async () => {
            try {
                await NavigationBar.setVisibilityAsync('hidden');
                await NavigationBar.setBehaviorAsync('inset-touch');
            } catch (error) {
                console.error('Navigation bar error:', error);
            }
        };

        InteractionManager.runAfterInteractions(hideNavBar);
    }, []);

    useEffect(() => {
        const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
            NavigationBar.setVisibilityAsync('visible');
        });

        const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
            NavigationBar.setVisibilityAsync('hidden');
            NavigationBar.setBehaviorAsync('inset-touch');
        });

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    function MainTabs({ route }) {
        const { userType, userData } = route.params || {};

        const tabBarStyles = {
            tabBarActiveTintColor: '#007AFF',
            tabBarInactiveTintColor: '#88B2FF',
            tabBarStyle: {
                backgroundColor: 'white',
                height: 80,
                borderTopWidth: 2,
                borderTopColor: '#E3F2FD',
                paddingBottom: 10,
                paddingTop: 10,
                shadowColor: '#007AFF',
                shadowOffset: {
                    width: 0,
                    height: -4,
                },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 10,
            },
            tabBarLabelStyle: {
                fontSize: 12,
                fontWeight: '600',
                marginBottom: 5,
            },
            headerStyle: {
                backgroundColor: '#007AFF',
                shadowColor: '#007AFF',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
            },
            headerTitleStyle: {
                color: 'white',
                fontSize: 20,
                fontWeight: 'bold',
            },
            headerTintColor: 'white',
            headerTitleAlign: 'center',
        };

        const tabIconStyles = {
            activeTabIcon: {
                backgroundColor: '#E3F2FD',
                padding: 8,
                borderRadius: 15,
                marginBottom: 10,
                width: 40,
                height: 40,
                justifyContent: "center",
                alignItems: "center"
            },
            tabIcon: {
                padding: 8,
                borderRadius: 15,
                marginBottom: 10,
                width: 40,
                height: 40,
                justifyContent: "center",
                alignItems: "center"
            }
        };

        return (
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    tabBarIcon: ({ focused, color, size }) => {
                        let iconName;
                        let iconSize = 22;

                        if (route.name === 'Home') {
                            iconName = focused ? 'home' : 'home-outline';
                        } else if (route.name === 'AddComplaint') {
                            iconName = focused ? 'add-circle' : 'add-circle-outline';
                        } else if (route.name === 'Settings') {
                            iconName = focused ? 'settings' : 'settings-outline';
                        } else if (route.name === 'Info') {
                            iconName = focused ? 'information-circle' : 'information-circle-outline';
                        } else if (route.name === 'ManageStaff') {
                            iconName = focused ? 'people' : 'people-outline';
                        }

                        return (
                            <View style={focused ? tabIconStyles.activeTabIcon : tabIconStyles.tabIcon}>
                                <Ionicons
                                    name={iconName}
                                    size={iconSize}
                                    color={focused ? '#007AFF' : '#88B2FF'}
                                />
                            </View>
                        );
                    },
                    ...tabBarStyles,
                })}
            >
                <Tab.Screen
                    name="Home"
                    component={HomeScreen}
                    initialParams={{ userType, userData }}
                    options={{
                        title: 'Dashboard',
                        tabBarLabel: 'Home',
                    }}
                />
                {userType === 'student' && (
                    <Tab.Screen
                        name="AddComplaint"
                        component={AddComplaintScreen}
                        initialParams={{ userData }}
                        options={{
                            title: 'New Complaint',
                            tabBarLabel: 'Complaint',
                        }}
                    />
                )}
                {userType === 'wardenB' && (
                    <Tab.Screen
                        name="ManageStaff"
                        component={ManageStaffScreen}
                        initialParams={{ userData }}
                        options={{
                            title: 'Manage Staff',
                            tabBarLabel: 'Staff',
                        }}
                    />
                )}
                {userType === 'wardenF' && (
                    <Tab.Screen
                        name="ManageStaff"
                        component={ManageStaffScreen}
                        initialParams={{ userData }}
                        options={{
                            title: 'Manage Staff',
                            tabBarLabel: 'Staff',
                        }}
                    />
                )}
                <Tab.Screen
                    name="Settings"
                    component={SettingsScreen}
                    initialParams={{ userData }}
                    options={{
                        title: 'Settings',
                        tabBarLabel: 'Settings',
                    }}
                />
                <Tab.Screen
                    name="Info"
                    component={InfoScreen}
                    options={{
                        title: 'About Fixora',
                        tabBarLabel: 'About',
                    }}
                />
            </Tab.Navigator>
        );
    }

    const loadingStyles = {
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
        }
    };

    if (isLoading) {
        return <SplashScreen />
    }

    const stackScreenOptions = {
        headerStyle: {
            backgroundColor: '#007AFF',
            shadowColor: '#007AFF',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
        },
        headerTitleStyle: {
            color: 'white',
            fontSize: 20,
            fontWeight: 'bold',
        },
        headerTintColor: 'white',
        headerTitleAlign: 'center',
        headerBackTitleVisible: false,
    };

    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName={userData ? "Main" : "Login"}
                screenOptions={stackScreenOptions}
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
                    initialParams={userData || {}}
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="ComplaintDetail"
                    component={ComplaintDetailScreen}
                    options={{
                        title: 'Complaint Details',
                        ...stackScreenOptions,
                    }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
import React, { useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    Dimensions,
    Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const CustomAlert = ({
    visible = false,
    title = "Alert",
    message = "",
    type = "info", // 'info', 'error', 'success', 'warning'
    buttons = [{ text: "OK", onPress: () => { } }],
    onClose = () => { }
}) => {
    const scaleAnim = new Animated.Value(0.8);
    const opacityAnim = new Animated.Value(0);

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                })
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(scaleAnim, {
                    toValue: 0.8,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [visible]);

    const getIcon = () => {
        switch (type) {
            case 'error':
                return { name: 'close-circle', color: '#FF3B30' };
            case 'success':
                return { name: 'checkmark-circle', color: '#4CAF50' };
            case 'warning':
                return { name: 'warning', color: '#FFA500' };
            default:
                return { name: 'information-circle', color: '#007AFF' };
        }
    };

    const getBackgroundColor = () => {
        switch (type) {
            case 'error':
                return '#FFEBEE';
            case 'success':
                return '#E8F5E8';
            case 'warning':
                return '#FFF3E0';
            default:
                return '#E3F2FD';
        }
    };

    const iconConfig = getIcon();

    if (!visible) return null;

    return (
        <Modal
            transparent={true}
            visible={visible}
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Animated.View
                    style={[
                        styles.container,
                        {
                            opacity: opacityAnim,
                            transform: [{ scale: scaleAnim }]
                        }
                    ]}
                >
                    <View style={[styles.header, { backgroundColor: getBackgroundColor() }]}>
                        <Ionicons name={iconConfig.name} size={40} color={iconConfig.color} />
                        <Text style={styles.title}>{title}</Text>
                    </View>

                    <View style={styles.content}>
                        <Text style={styles.message}>{message}</Text>
                    </View>

                    <View style={styles.footer}>
                        {buttons.map((button, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.button,
                                    button.style === 'destructive' && styles.destructiveButton,
                                    button.style === 'cancel' && styles.cancelButton,
                                    buttons.length > 2 && styles.multiLineButton
                                ]}
                                onPress={() => {
                                    button.onPress && button.onPress();
                                    onClose();
                                }}
                            >
                                <Text style={[
                                    styles.buttonText,
                                    button.style === 'destructive' && styles.destructiveButtonText,
                                    button.style === 'cancel' && styles.cancelButtonText
                                ]}>
                                    {button.text}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: 'white',
        borderRadius: 20,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
        overflow: 'hidden',
    },
    header: {
        alignItems: 'center',
        padding: 25,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#007AFF',
        marginTop: 10,
        textAlign: 'center',
    },
    content: {
        padding: 25,
    },
    message: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        lineHeight: 22,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: '#E3F2FD',
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        backgroundColor: '#007AFF',
        marginHorizontal: 5,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    cancelButton: {
        backgroundColor: '#F0F0F0',
        shadowColor: '#000',
        shadowOpacity: 0.1,
    },
    destructiveButton: {
        backgroundColor: '#FF3B30',
        shadowColor: '#FF3B30',
    },
    multiLineButton: {
        flex: 0,
        minWidth: 100,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelButtonText: {
        color: '#666',
    },
    destructiveButtonText: {
        color: 'white',
    },
});

export default CustomAlert;
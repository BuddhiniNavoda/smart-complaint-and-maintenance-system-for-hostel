import { useState, useCallback } from 'react';
import CustomAlert from '../components/CustomAlert';

export const useAlert = () => {
    const [alertState, setAlertState] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'info',
        buttons: [],
    });

    const showAlert = useCallback((title, message, buttons = [], type = 'info') => {
        setAlertState({
            visible: true,
            title,
            message,
            type,
            buttons: buttons.length > 0 ? buttons : [{ text: "OK", onPress: () => { } }],
        });
    }, []);

    const hideAlert = useCallback(() => {
        setAlertState(prev => ({ ...prev, visible: false }));
    }, []);

    const AlertComponent = useCallback(() => (
        <CustomAlert
            visible={alertState.visible}
            title={alertState.title}
            message={alertState.message}
            type={alertState.type}
            buttons={alertState.buttons}
            onClose={hideAlert}
        />
    ), [alertState, hideAlert]);

    return {
        showAlert,
        hideAlert,
        AlertComponent,
    };
};

export default useAlert;
// App.js
import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import AppNavigator from './AppNavigator';

export default function App() {
  return (
    <ThemeProvider>
      <AppNavigator />
    </ThemeProvider>
  );
}

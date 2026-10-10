import React from 'react';
import { AuthProvider } from './src/services/auth';
import AppNavigator from './src/navigation/AppNavigator';
import { StatusBar } from 'react-native';

export default function App() {
  return (
    <AuthProvider>
      <StatusBar barStyle="light-content" backgroundColor="#05070d" />
      <AppNavigator />
    </AuthProvider>
  );
}

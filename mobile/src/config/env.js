import { Platform } from 'react-native';

// Centralized configuration for the API
// You can override via EXPO_PUBLIC_API_URL in .env (e.g. EXPO_PUBLIC_API_URL=http://192.168.1.100:8000)
const getDefaultApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'android') {
    // Android emulator alias for localhost, or LAN IP on device
    return 'http://10.0.2.2:8000';
  }
  if (Platform.OS === 'web') {
    return 'http://127.0.0.1:8000';
  }
  return 'http://127.0.0.1:8000';
};

export const API_BASE_URL = getDefaultApiUrl();


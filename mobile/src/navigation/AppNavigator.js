import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../services/auth';

import SplashScreen from '../screens/SplashScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import SignInScreen from '../screens/SignInScreen';
import HomeScreen from '../screens/HomeScreen';
import ResultScreen from '../screens/ResultScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import UrlCheckScreen from '../screens/UrlCheckScreen';
import MessageCheckScreen from '../screens/MessageCheckScreen';
import ImageCheckScreen from '../screens/ImageCheckScreen';
import AudioCheckScreen from '../screens/AudioCheckScreen';
import AttackStoryScreen from '../screens/AttackStoryScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#05070d' },
          animation: 'fade'
      }}>
        {user == null ? (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="SignIn" component={SignInScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Result" component={ResultScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="UrlCheck" component={UrlCheckScreen} />
            <Stack.Screen name="MessageCheck" component={MessageCheckScreen} />
            <Stack.Screen name="ImageCheck" component={ImageCheckScreen} />
            <Stack.Screen name="AudioCheck" component={AudioCheckScreen} />
            <Stack.Screen name="AttackStory" component={AttackStoryScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

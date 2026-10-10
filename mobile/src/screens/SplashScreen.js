import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>ORION</Text>
      <Text style={styles.subtitle}>AI-Powered Cyber Threat Intelligence</Text>
      <ActivityIndicator size="large" color="#6d28d9" style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05070d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#a1a1aa',
    marginTop: 12,
  },
  loader: {
    marginTop: 40,
  }
});

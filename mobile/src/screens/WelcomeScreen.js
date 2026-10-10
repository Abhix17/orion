import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

export default function WelcomeScreen({ navigation }) {
  const handleCreateAccount = () => {
    Alert.alert(
      "Demo Account",
      "Account creation is not available in this demo yet. Use the provided demo sign-in flow to continue."
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>ORION</Text>
        <Text style={styles.tagline}>Your intelligent digital security layer.</Text>
        <Text style={styles.description}>
          Detect phishing, impersonation, deepfakes and suspicious digital activity before they become threats.
        </Text>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleCreateAccount}>
          <Text style={styles.primaryBtnText}>Create Account</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('SignIn')}>
          <Text style={styles.secondaryBtnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05070d', padding: 24, justifyContent: 'space-between' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logo: { fontSize: 40, fontWeight: 'bold', color: '#fff', letterSpacing: 2 },
  tagline: { fontSize: 18, color: '#f4f4f5', marginTop: 16, textAlign: 'center', fontWeight: '500' },
  description: { fontSize: 14, color: '#a1a1aa', marginTop: 16, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
  footer: { paddingBottom: 40 },
  primaryBtn: { backgroundColor: '#6d28d9', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryBtn: { backgroundColor: 'transparent', paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#27272a' },
  secondaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});


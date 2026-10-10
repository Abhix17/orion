import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../services/auth';
import { API_BASE_URL } from '../config/env';
import { api } from '../services/api';

export default function ProfileScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const [status, setStatus] = useState('Checking...');

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      await api.health();
      setStatus('Connected');
    } catch (e) {
      setStatus('Offline');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Home</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PROFILE & SETTINGS</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Account</Text>
        <Text style={styles.value}>{user?.name} ({user?.email})</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>ORION Backend</Text>
        <Text style={styles.value}>{status}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>API Configuration</Text>
        <Text style={styles.value}>{API_BASE_URL}</Text>
        <Text style={styles.subtext}>Ensure this matches your LAN IP if running locally.</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.label}>Privacy</Text>
        <Text style={styles.subtext}>Your content is analyzed only when you choose to check it.</Text>
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05070d', padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 40, marginBottom: 32 },
  backBtn: { color: '#a78bfa', fontSize: 16, fontWeight: '600', marginRight: 16 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  
  section: { backgroundColor: '#18181b', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#27272a' },
  label: { color: '#a1a1aa', fontSize: 12, textTransform: 'uppercase', marginBottom: 4, fontWeight: 'bold' },
  value: { color: '#fff', fontSize: 16, fontWeight: '500' },
  subtext: { color: '#a1a1aa', fontSize: 12, marginTop: 4 },
  
  signOutBtn: { backgroundColor: '#ef444420', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24, borderWidth: 1, borderColor: '#ef4444' },
  signOutText: { color: '#ef4444', fontWeight: 'bold' }
});


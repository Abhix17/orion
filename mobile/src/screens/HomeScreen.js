import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Shield, Link, MessageSquare, Image, Mic, Video } from 'lucide-react-native';
import { api } from '../services/api';
import { useAuth } from '../services/auth';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [status, setStatus] = useState('Checking...');
  const [statusColor, setStatusColor] = useState('#fbbf24');
  const [statusBg, setStatusBg] = useState('#451a03');

  useEffect(() => {
    checkHealth();
  }, []);

  const checkHealth = async () => {
    try {
      await api.health();
      setStatus('Connected');
      setStatusColor('#34d399');
      setStatusBg('#064e3b');
    } catch (e) {
      setStatus('Offline');
      setStatusColor('#f87171');
      setStatusBg('#7f1d1d');
    }
  };

  const handlePlaceholder = () => {
    Alert.alert(
      "Coming in Phase 2B",
      "This analysis capability is being integrated into ORION Mobile."
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>ORION</Text>
          <Text style={{color: '#a1a1aa', marginTop: 4, fontSize: 14}}>AI-powered threat intelligence</Text>
        </View>
        <TouchableOpacity style={[styles.statusBadge, { backgroundColor: statusBg }]} onPress={checkHealth}>
          <Shield color={statusColor} size={16} />
          <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Quick Checks</Text>
      
      <View style={styles.grid}>
        <QuickAction icon={<Link color="#fff" />} label="URL" onPress={() => navigation.navigate('UrlCheck')} />
        <QuickAction icon={<MessageSquare color="#fff" />} label="Message" onPress={() => navigation.navigate('MessageCheck')} />
        <QuickAction icon={<Image color="#fff" />} label="Image" onPress={() => navigation.navigate('ImageCheck')} />
        <QuickAction icon={<Mic color="#fff" />} label="Audio" onPress={() => navigation.navigate('AudioCheck')} />
      </View>
      
      <TouchableOpacity style={styles.storyCta} onPress={() => navigation.navigate('AttackStory')}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Shield color="#3b82f6" size={24} />
          <Text style={styles.storyTitle}>View Attack Story</Text>
        </View>
        <Text style={styles.storySubtitle}>See correlated cross-modal incident report.</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Recent / Latest Analysis</Text>
      <View style={{ alignItems: 'center', padding: 20, backgroundColor: '#18181b', borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#27272a' }}>
        <Text style={{ color: '#a1a1aa' }}>No recent analysis found.</Text>
      </View>

      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('History')}>
          <Text style={styles.navText}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function QuickAction({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={styles.iconBox}>{icon}</View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05070d', padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 32 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontWeight: '600', marginLeft: 6, fontSize: 12 },
  
  mainCta: { backgroundColor: '#1e1b4b', padding: 32, borderRadius: 24, alignItems: 'center', marginBottom: 32, borderWidth: 1, borderColor: '#4c1d95' },
  ctaTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 16 },
  ctaSubtitle: { fontSize: 14, color: '#a78bfa', marginTop: 8, textAlign: 'center' },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  
  quickAction: { width: '47%', backgroundColor: '#18181b', padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#27272a' },
  iconBox: { backgroundColor: '#27272a', padding: 12, borderRadius: 12, marginBottom: 8 },
  actionLabel: { color: '#fff', fontWeight: '500' },

  storyCta: { backgroundColor: '#1e3a8a', padding: 20, borderRadius: 16, marginTop: 24, borderWidth: 1, borderColor: '#3b82f6' },
  storyTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginLeft: 12 },
  storySubtitle: { fontSize: 14, color: '#93c5fd', marginTop: 8 },

  navBar: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 40, paddingVertical: 20, borderTopWidth: 1, borderTopColor: '#27272a' },
  navItem: { padding: 10 },
  navText: { color: '#a1a1aa', fontWeight: '600' }
});

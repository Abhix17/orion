import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function HistoryScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Home</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>HISTORY</Text>
      </View>

      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No analyses yet.</Text>
        <Text style={styles.emptyDesc}>Your completed ORION checks will appear here.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05070d', padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 40, marginBottom: 32 },
  backBtn: { color: '#a78bfa', fontSize: 16, fontWeight: '600', marginRight: 16 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  emptyDesc: { color: '#a1a1aa', fontSize: 14 }
});

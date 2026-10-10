import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Shield, Network, Activity, ArrowLeft, Users, Link as LinkIcon, FileText } from 'lucide-react-native';
import { api } from '../services/api';

export default function AttackStoryScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [story, setStory] = useState(null);

  useEffect(() => {
    fetchStory();
  }, []);

  const fetchStory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAttackStory();
      setStory(data);
    } catch (err) {
      if (err.message && err.message.includes('Network')) {
        setError("Service Unavailable: The ORION backend is currently unreachable. Please ensure the backend is running.");
      } else {
        setError("Failed to generate attack story. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6d28d9" />
        <Text style={styles.loadingText}>Correlating cross-modal evidence...</Text>
        <Text style={styles.loadingSub}>This correlates URL, Message, and Media analysis.</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft color="#a1a1aa" size={24} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchStory}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const getRiskColor = (level) => {
    switch (level) {
      case 'SAFE': return '#43e6a3';
      case 'LOW': return '#ffc857';
      case 'MEDIUM': return '#fb923c';
      case 'HIGH': return '#ff5c7a';
      case 'CRITICAL': return '#ff3b5f';
      default: return '#a1a1aa';
    }
  };

  const getRiskBg = (level) => {
    switch (level) {
      case 'SAFE': return '#064e3b';
      case 'LOW': return '#451a03';
      case 'MEDIUM': return '#7c2d12';
      case 'HIGH': return '#7f1d1d';
      case 'CRITICAL': return '#450a0a';
      default: return '#3f3f46';
    }
  };

  const riskColor = getRiskColor(story.risk_level);
  const riskBg = getRiskBg(story.risk_level);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft color="#a1a1aa" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ATTACK STORY</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={[styles.mainCard, { borderColor: riskColor }]}>
        <View style={[styles.riskBadge, { backgroundColor: riskBg }]}>
          <Shield color={riskColor} size={16} />
          <Text style={[styles.riskText, { color: riskColor }]}>
            {story.risk_level} GLOBAL RISK
          </Text>
        </View>

        <Text style={styles.threatType}>
          Primary Threat: {story.threat_type}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{story.metadata?.correlated_incident_count || 0}</Text>
            <Text style={styles.statLabel}>Incidents</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{story.entities?.length || 0}</Text>
            <Text style={styles.statLabel}>Entities</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{story.correlation_groups?.length || 0}</Text>
            <Text style={styles.statLabel}>Clusters</Text>
          </View>
        </View>
      </View>

      {story.xai_summary ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Activity color="#60a5fa" size={20} />
            <Text style={styles.sectionTitle}>Attack Progression</Text>
          </View>
          <View style={styles.xaiCard}>
            <Text style={styles.xaiText}>{story.xai_summary}</Text>
          </View>
        </View>
      ) : null}

      {story.correlation_groups && story.correlation_groups.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Network color="#a78bfa" size={20} />
            <Text style={styles.sectionTitle}>Correlation Groups</Text>
          </View>
          {story.correlation_groups.map((group, idx) => (
            <View key={idx} style={styles.groupCard}>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupSub}>
                Confidence: {Math.round(group.correlation_confidence * 100)}% | Evidence: {group.evidence_ids?.length || 0}
              </Text>
              
              {group.relationships && group.relationships.length > 0 && (
                <View style={styles.relationsContainer}>
                  {group.relationships.map((rel, ridx) => (
                    <Text key={ridx} style={styles.relationText}>
                      • {rel.source} → {rel.relation} → {rel.target}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {story.entities && story.entities.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users color="#34d399" size={20} />
            <Text style={styles.sectionTitle}>Identified Entities</Text>
          </View>
          <View style={styles.entitiesGrid}>
            {story.entities.map((ent, idx) => (
              <View key={idx} style={styles.entityTag}>
                <Text style={styles.entityTypeText}>{ent.type.toUpperCase()}</Text>
                <Text style={styles.entityNameText}>{ent.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05070d', padding: 24 },
  loadingContainer: { flex: 1, backgroundColor: '#05070d', justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 24, textAlign: 'center' },
  loadingSub: { color: '#a1a1aa', fontSize: 14, marginTop: 8, textAlign: 'center' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 40, marginBottom: 32 },
  backBtn: { padding: 4 },
  headerTitle: { color: '#a1a1aa', fontSize: 14, fontWeight: 'bold', letterSpacing: 2 },
  
  errorCard: { backgroundColor: '#450a0a', padding: 24, borderRadius: 16, borderWidth: 1, borderColor: '#7f1d1d', alignItems: 'center' },
  errorText: { color: '#f87171', fontSize: 16, marginBottom: 20, textAlign: 'center' },
  retryBtn: { backgroundColor: '#7f1d1d', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryBtnText: { color: '#fff', fontWeight: 'bold' },

  mainCard: { backgroundColor: '#18181b', padding: 24, borderRadius: 16, borderWidth: 1, marginBottom: 32 },
  riskBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginBottom: 16 },
  riskText: { fontWeight: 'bold', fontSize: 14, marginLeft: 8 },
  threatType: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 24, textTransform: 'capitalize' },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#27272a', paddingTop: 20 },
  statBox: { alignItems: 'center', width: '30%' },
  statValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: '#a1a1aa', fontSize: 12, marginTop: 4 },

  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginLeft: 12 },
  
  xaiCard: { backgroundColor: '#18181b', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#27272a' },
  xaiText: { color: '#e4e4e7', fontSize: 14, lineHeight: 24 },

  groupCard: { backgroundColor: '#18181b', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#3b0764', marginBottom: 12 },
  groupName: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  groupSub: { color: '#a1a1aa', fontSize: 12, marginBottom: 12 },
  relationsContainer: { backgroundColor: '#05070d', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#27272a' },
  relationText: { color: '#d8b4fe', fontSize: 13, marginBottom: 4, fontFamily: 'monospace' },

  entitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  entityTag: { backgroundColor: '#18181b', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#064e3b' },
  entityTypeText: { color: '#34d399', fontSize: 10, fontWeight: 'bold', marginBottom: 2 },
  entityNameText: { color: '#fff', fontSize: 14 }
});

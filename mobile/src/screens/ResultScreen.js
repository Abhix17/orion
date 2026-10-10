import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function ResultScreen({ route, navigation }) {
  const result = route.params?.result;

  if (!result) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ORION ANALYSIS</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>No analysis available</Text>
          <Text style={styles.summary}>Analysis results will appear here.</Text>
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

  const isHighRisk = result.riskLevel === 'HIGH' || result.riskLevel === 'CRITICAL';
  const riskColor = getRiskColor(result.riskLevel);
  const riskBg = getRiskBg(result.riskLevel);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {result.sourceType === 'audio' ? 'ORION AUDIO ANALYSIS' : result.sourceType === 'image' ? 'ORION IMAGE ANALYSIS' : result.sourceType === 'message' ? 'ORION MESSAGE ANALYSIS' : 'ORION LINK ANALYSIS'}
        </Text>
      </View>

      <View style={[styles.card, { borderColor: riskColor }]}>
        <View style={[styles.riskBadge, { backgroundColor: riskBg }]}>
          <Text style={[styles.riskText, { color: riskColor }]}>{result.riskLevel}</Text>
        </View>

        {isHighRisk ? (
          <Text style={[styles.title, { color: riskColor }]}>Potential Threat Detected</Text>
        ) : result.riskLevel === 'SAFE' ? (
          <Text style={[styles.title, { color: riskColor }]}>No significant threat detected</Text>
        ) : (
          <Text style={styles.title}>{result.classification}</Text>
        )}

        <Text style={styles.summaryHeading}>
          {isHighRisk ? 'Why ORION flagged this:' : 'Why ORION considers this low risk:'}
        </Text>
        <Text style={styles.summary}>{result.summary}</Text>
      </View>

      {result.audioAuthenticity && result.audioAuthenticity.spoof_probability >= 0.65 && (
        <View style={[styles.section, { backgroundColor: '#2e1020', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#7f1d1d' }]}>
          <Text style={[styles.sectionTitle, { color: '#f87171' }]}>Synthetic Voice Signal Detected</Text>
          <Text style={styles.listItem}>Confidence: {Math.round(result.audioAuthenticity.spoof_probability * 100)}%</Text>
        </View>
      )}

      {result.speakerAnalysis && result.speakerAnalysis.matched_identity && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identity Findings</Text>
          <Text style={styles.listItem}>• Matched: {result.speakerAnalysis.matched_identity}</Text>
          <Text style={styles.listItem}>• Similarity: {Math.round(result.speakerAnalysis.similarity * 100)}%</Text>
        </View>
      )}

      {result.semanticIntent && (result.semanticIntent.payment_request || result.semanticIntent.credential_request || result.semanticIntent.urgency) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detected Intent</Text>
          {result.semanticIntent.urgency && <Text style={styles.listItem}>• High Urgency</Text>}
          {result.semanticIntent.payment_request && <Text style={styles.listItem}>• Financial / Payment Request</Text>}
          {result.semanticIntent.credential_request && <Text style={styles.listItem}>• Credential / Auth Request</Text>}
          {result.semanticIntent.impersonation_attempt && <Text style={styles.listItem}>• Impersonation Attempt</Text>}
        </View>
      )}

      {result.transcript && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transcript</Text>
          <View style={{ backgroundColor: '#18181b', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#27272a' }}>
            <Text style={{ color: '#a1a1aa', fontSize: 14, fontStyle: 'italic' }}>"{result.transcript}"</Text>
          </View>
        </View>
      )}

      {result.riskDrivers && result.riskDrivers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Risk Drivers</Text>
          {result.riskDrivers.map((driver, idx) => (
            <Text key={idx} style={styles.listItem}>• {driver}</Text>
          ))}
        </View>
      )}

      {result.evidence && result.evidence.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Evidence</Text>
          {result.evidence.map((ev, idx) => (
            <View key={idx} style={styles.evidenceItem}>
              <Text style={styles.evidenceSignal}>{ev.signal}</Text>
              <Text style={styles.evidenceSource}>{ev.source} {ev.confidence ? `(${Math.round(ev.confidence * 100)}%)` : ''}</Text>
            </View>
          ))}
        </View>
      )}

      {result.recommendedActions && result.recommendedActions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended Action</Text>
          {result.recommendedActions.map((action, idx) => (
            <Text key={idx} style={styles.listItem}>• {action}</Text>
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.primaryBtn} 
          onPress={() => navigation.replace(result.sourceType === 'audio' ? 'AudioCheck' : result.sourceType === 'image' ? 'ImageCheck' : result.sourceType === 'message' ? 'MessageCheck' : 'UrlCheck')}
        >
          <Text style={styles.primaryBtnText}>
            {result.sourceType === 'audio' ? 'Check Another Audio' : result.sourceType === 'image' ? 'Check Another Image' : result.sourceType === 'message' ? 'Check Another Message' : 'Check Another Link'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.secondaryBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05070d', padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 40, marginBottom: 32 },
  headerTitle: { color: '#a1a1aa', fontSize: 14, fontWeight: 'bold', letterSpacing: 2 },
  
  card: { backgroundColor: '#18181b', padding: 24, borderRadius: 16, borderWidth: 1, marginBottom: 24 },
  riskBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 16 },
  riskText: { fontWeight: 'bold', fontSize: 14 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  summaryHeading: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 8 },
  summary: { fontSize: 14, color: '#a1a1aa', lineHeight: 22 },
  
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  listItem: { color: '#a1a1aa', fontSize: 14, marginBottom: 6, lineHeight: 20 },
  
  evidenceItem: { backgroundColor: '#18181b', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#27272a' },
  evidenceSignal: { color: '#e4e4e7', fontSize: 14, fontWeight: '500', marginBottom: 4 },
  evidenceSource: { color: '#71717a', fontSize: 12 },
  
  footer: { marginTop: 16 },
  primaryBtn: { backgroundColor: '#6d28d9', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryBtn: { backgroundColor: 'transparent', paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#27272a' },
  secondaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

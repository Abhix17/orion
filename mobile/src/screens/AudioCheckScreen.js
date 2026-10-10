import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { api } from '../services/api';
import { normalizeAnalysisResult } from '../utils/normalizeAnalysisResult';

export default function AudioCheckScreen({ navigation }) {
  const [audioUri, setAudioUri] = useState(null);
  const [audioDetails, setAudioDetails] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const handlePickAudio = async () => {
    setError('');
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/x-m4a', 'audio/ogg', 'application/ogg'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Ensure extension is supported (WAV, MP3, M4A, OGG)
        const nameLower = asset.name.toLowerCase();
        if (!(nameLower.endsWith('.mp3') || nameLower.endsWith('.wav') || nameLower.endsWith('.m4a') || nameLower.endsWith('.ogg'))) {
          setError('Unsupported audio format. Please choose an MP3, WAV, M4A, or OGG file.');
          return;
        }

        // Enforce 25 MB limit (25 * 1024 * 1024 = 26214400 bytes)
        if (asset.size && asset.size > 26214400) {
          setError('This audio file is too large to analyze. Please choose a smaller file (Max 25MB).');
          return;
        }
        
        setAudioUri(asset.uri);
        setAudioDetails({
          mimeType: asset.mimeType || 'audio/mp3',
          fileName: asset.name || asset.uri.split('/').pop(),
          fileSize: asset.size
        });
      }
    } catch (err) {
      setError('Failed to pick audio file. Please try again.');
    }
  };

  const handleAnalyze = async () => {
    if (!audioUri || !audioDetails) return;
    
    setError('');
    setAnalyzing(true);
    
    try {
      const response = await api.analyzeAudio(audioUri, audioDetails.mimeType, audioDetails.fileName);
      const normalizedResult = normalizeAnalysisResult(response, 'audio');
      navigation.replace('Result', { result: normalizedResult });
    } catch (err) {
      if (err.message && (err.message.includes('unreachable') || err.message.includes('Network Error') || err.message.includes('timeout'))) {
        setError('ORION Intelligence Service Unavailable. Please verify your connection or try again later.');
      } else {
        setError(err.message || 'One or more security checks could not be completed.');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} disabled={analyzing}>
            <Text style={[styles.backBtn, analyzing && styles.disabledText]}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>CHECK AUDIO</Text>
        </View>

        <Text style={styles.subtitle}>Analyze suspicious voice messages or audio clips before you trust them.</Text>

        {!audioUri ? (
          <View style={styles.uploadContainer}>
            <TouchableOpacity style={styles.pickerBtn} onPress={handlePickAudio}>
              <Text style={styles.pickerBtnText}>Choose Audio File</Text>
            </TouchableOpacity>
            <Text style={styles.helperText}>Select an MP3, WAV, M4A, or OGG file.</Text>
          </View>
        ) : (
          <View style={styles.previewContainer}>
            <View style={styles.audioCard}>
              <Text style={styles.fileIcon}>🎵</Text>
              <Text style={styles.fileName}>{audioDetails.fileName}</Text>
              <Text style={styles.fileSize}>
                {audioDetails.fileSize ? `${Math.round(audioDetails.fileSize / 1024 / 1024 * 100) / 100} MB` : 'Unknown size'}
              </Text>
            </View>
            
            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={styles.secondaryBtn} 
                onPress={handlePickAudio}
                disabled={analyzing}
              >
                <Text style={[styles.secondaryBtnText, analyzing && styles.disabledText]}>Choose Another</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.primaryBtn, analyzing && styles.primaryBtnDisabled]} 
                onPress={handleAnalyze}
                disabled={analyzing}
              >
                {analyzing ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.primaryBtnText}>Analyzing Audio...</Text>
                  </View>
                ) : (
                  <Text style={styles.primaryBtnText}>Analyze Audio</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {!analyzing && !error && (
          <Text style={styles.privacyNote}>
            ORION analyzes the audio only when you explicitly choose to check it.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05070d' },
  innerContainer: { flex: 1, padding: 24, justifyContent: 'flex-start' },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 40, marginBottom: 24 },
  backBtn: { color: '#a78bfa', fontSize: 16, fontWeight: '600', marginRight: 16 },
  headerTitle: { color: '#a1a1aa', fontSize: 14, fontWeight: 'bold', letterSpacing: 2 },
  disabledText: { opacity: 0.5 },
  
  subtitle: { color: '#f4f4f5', fontSize: 18, marginBottom: 32 },
  
  uploadContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pickerBtn: { backgroundColor: '#3f3f46', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, marginBottom: 16 },
  pickerBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  helperText: { color: '#a1a1aa', fontSize: 14, textAlign: 'center' },
  
  previewContainer: { flex: 1, alignItems: 'center', paddingTop: 32 },
  audioCard: { backgroundColor: '#18181b', padding: 32, borderRadius: 16, width: '100%', alignItems: 'center', marginBottom: 32, borderWidth: 1, borderColor: '#27272a' },
  fileIcon: { fontSize: 48, marginBottom: 16 },
  fileName: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  fileSize: { color: '#a1a1aa', fontSize: 14 },
  
  actionRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
  secondaryBtn: { flex: 1, backgroundColor: 'transparent', paddingVertical: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#3f3f46', marginRight: 8 },
  secondaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  
  primaryBtn: { flex: 1.5, backgroundColor: '#6d28d9', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginLeft: 8 },
  primaryBtnDisabled: { backgroundColor: '#4c1d95', opacity: 0.7 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  
  loadingContainer: { flexDirection: 'row', alignItems: 'center' },
  
  errorText: { color: '#f87171', marginBottom: 16, marginTop: 16, textAlign: 'center' },
  privacyNote: { color: '#a1a1aa', fontSize: 14, textAlign: 'center', marginTop: 'auto', marginBottom: 16 },
});

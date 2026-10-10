import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { api } from '../services/api';
import { normalizeAnalysisResult } from '../utils/normalizeAnalysisResult';

export default function UrlCheckScreen({ navigation }) {
  const [url, setUrl] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const validateUrl = (input) => {
    let trimmed = input.trim();
    if (!trimmed) return null;
    
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = 'https://' + trimmed;
    }
    
    try {
      new URL(trimmed);
      return trimmed;
    } catch (_) {
      return null;
    }
  };

  const handleAnalyze = async () => {
    setError('');
    const validUrl = validateUrl(url);
    
    if (!validUrl) {
      setError('Please enter a valid URL.');
      return;
    }

    setAnalyzing(true);
    
    try {
      const response = await api.analyzeUrl(validUrl);
      const normalizedResult = normalizeAnalysisResult(response);
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CHECK A LINK</Text>
      </View>

      <Text style={styles.subtitle}>Analyze a suspicious URL before you open it.</Text>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="https://example.com"
          placeholderTextColor="#52525b"
          value={url}
          onChangeText={(text) => {
            setUrl(text);
            setError('');
          }}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          editable={!analyzing}
        />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity 
        style={[styles.primaryBtn, analyzing && styles.primaryBtnDisabled]} 
        onPress={handleAnalyze}
        disabled={analyzing}
      >
        {analyzing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.primaryBtnText}>Analyzing Link...</Text>
          </View>
        ) : (
          <Text style={styles.primaryBtnText}>Analyze Link</Text>
        )}
      </TouchableOpacity>

      {!analyzing && !error && (
        <Text style={styles.helperText}>
          ORION will inspect the link for phishing and other malicious indicators.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05070d', padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 40, marginBottom: 24 },
  backBtn: { color: '#a78bfa', fontSize: 16, fontWeight: '600', marginRight: 16 },
  headerTitle: { color: '#a1a1aa', fontSize: 14, fontWeight: 'bold', letterSpacing: 2 },
  
  subtitle: { color: '#f4f4f5', fontSize: 18, marginBottom: 32 },
  
  inputContainer: { marginBottom: 16 },
  input: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#3f3f46',
    borderRadius: 12,
    color: '#fff',
    padding: 16,
    fontSize: 16
  },
  
  errorText: { color: '#f87171', marginBottom: 16 },
  helperText: { color: '#a1a1aa', fontSize: 14, textAlign: 'center', marginTop: 16 },
  
  primaryBtn: { backgroundColor: '#6d28d9', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  primaryBtnDisabled: { backgroundColor: '#4c1d95', opacity: 0.7 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  
  loadingContainer: { flexDirection: 'row', alignItems: 'center' }
});

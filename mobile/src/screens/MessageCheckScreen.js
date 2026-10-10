import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { api } from '../services/api';
import { normalizeAnalysisResult } from '../utils/normalizeAnalysisResult';

export default function MessageCheckScreen({ navigation }) {
  const [text, setText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    Keyboard.dismiss();
    setError('');
    
    const trimmed = text.trim();
    if (!trimmed) {
      setError('Please enter a message to analyze.');
      return;
    }
    
    if (trimmed.length < 5) {
      setError('Please enter more message content to analyze.');
      return;
    }

    setAnalyzing(true);
    
    try {
      const response = await api.analyzeMessage(trimmed);
      const normalizedResult = normalizeAnalysisResult(response, 'message');
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
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.innerContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backBtn}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>CHECK A MESSAGE</Text>
          </View>

          <Text style={styles.subtitle}>Analyze suspicious messages before you respond or interact.</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Paste a suspicious message here..."
              placeholderTextColor="#52525b"
              value={text}
              onChangeText={(val) => {
                setText(val);
                setError('');
              }}
              multiline
              textAlignVertical="top"
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
                <Text style={styles.primaryBtnText}>Analyzing Message...</Text>
              </View>
            ) : (
              <Text style={styles.primaryBtnText}>Analyze Message</Text>
            )}
          </TouchableOpacity>

          {!analyzing && !error && (
            <Text style={styles.helperText}>
              ORION analyzes the message only when you choose to check it.
            </Text>
          )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05070d' },
  innerContainer: { flex: 1, padding: 24, justifyContent: 'flex-start' },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 40, marginBottom: 24 },
  backBtn: { color: '#a78bfa', fontSize: 16, fontWeight: '600', marginRight: 16 },
  headerTitle: { color: '#a1a1aa', fontSize: 14, fontWeight: 'bold', letterSpacing: 2 },
  
  subtitle: { color: '#f4f4f5', fontSize: 18, marginBottom: 32 },
  
  inputContainer: { flex: 1, marginBottom: 16 },
  input: {
    flex: 1,
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#3f3f46',
    borderRadius: 12,
    color: '#fff',
    padding: 16,
    fontSize: 16,
    minHeight: 150,
  },
  
  errorText: { color: '#f87171', marginBottom: 16 },
  helperText: { color: '#a1a1aa', fontSize: 14, textAlign: 'center', marginTop: 16 },
  
  primaryBtn: { backgroundColor: '#6d28d9', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  primaryBtnDisabled: { backgroundColor: '#4c1d95', opacity: 0.7 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  
  loadingContainer: { flexDirection: 'row', alignItems: 'center' }
});

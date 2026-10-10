import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../services/api';
import { normalizeAnalysisResult } from '../utils/normalizeAnalysisResult';

export default function ImageCheckScreen({ navigation }) {
  const [imageUri, setImageUri] = useState(null);
  const [imageDetails, setImageDetails] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const handlePickImage = async () => {
    setError('');
    
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setError('ORION needs access to your selected photos to analyze an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      
      // Enforce 15 MB limit (15 * 1024 * 1024 = 15728640 bytes)
      if (asset.fileSize && asset.fileSize > 15728640) {
        setError('This image is too large to analyze. Please choose a smaller image (Max 15MB).');
        return;
      }
      
      setImageUri(asset.uri);
      setImageDetails({
        mimeType: asset.mimeType || 'image/jpeg',
        fileName: asset.fileName || asset.uri.split('/').pop(),
        fileSize: asset.fileSize
      });
    }
  };

  const handleAnalyze = async () => {
    if (!imageUri || !imageDetails) return;
    
    setError('');
    setAnalyzing(true);
    
    try {
      const response = await api.analyzeImage(imageUri, imageDetails.mimeType, imageDetails.fileName);
      const normalizedResult = normalizeAnalysisResult(response, 'image');
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
          <Text style={styles.headerTitle}>CHECK AN IMAGE</Text>
        </View>

        <Text style={styles.subtitle}>Analyze suspicious images before you respond or interact.</Text>

        {!imageUri ? (
          <View style={styles.uploadContainer}>
            <TouchableOpacity style={styles.pickerBtn} onPress={handlePickImage}>
              <Text style={styles.pickerBtnText}>Choose Image</Text>
            </TouchableOpacity>
            <Text style={styles.helperText}>Select an image from your device gallery.</Text>
          </View>
        ) : (
          <View style={styles.previewContainer}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
            <Text style={styles.fileDetails}>
              {imageDetails.fileName} {imageDetails.fileSize ? `(${Math.round(imageDetails.fileSize / 1024 / 1024 * 100) / 100} MB)` : ''}
            </Text>
            
            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={styles.secondaryBtn} 
                onPress={handlePickImage}
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
                    <Text style={styles.primaryBtnText}>Analyzing Image...</Text>
                  </View>
                ) : (
                  <Text style={styles.primaryBtnText}>Analyze Image</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {!analyzing && !error && (
          <Text style={styles.privacyNote}>
            ORION analyzes the image only when you explicitly choose to check it.
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
  
  previewContainer: { flex: 1, alignItems: 'center' },
  previewImage: { width: '100%', height: 300, borderRadius: 12, backgroundColor: '#18181b', marginBottom: 16 },
  fileDetails: { color: '#a1a1aa', fontSize: 12, marginBottom: 24, textAlign: 'center' },
  
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

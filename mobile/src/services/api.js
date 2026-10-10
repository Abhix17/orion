import { API_BASE_URL } from '../config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = await AsyncStorage.getItem('orion_session_token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, { ...options, headers, signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Something went wrong. Please try again.`);
      }
      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${url}`, error);
      if (error.name === 'AbortError' || error.message.includes('Network request failed')) {
        throw new Error('ORION intelligence service is unreachable.');
      }
      throw new Error(error.message || 'Something went wrong. Please try again.');
    }
  }

  async health() {
    return this.request('/api/v1/system/health');
  }

  async analyzeUrl(url) {
    return this.request('/api/v1/analyze/url', {
      method: 'POST',
      body: JSON.stringify({ url })
    });
  }

  async analyzeMessage(text) {
    return this.request('/api/v1/analyze/message', {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  }

  async analyzeImage(imageUri, mimeType, filename) {
    const token = await AsyncStorage.getItem('auth_token');
    
    const formData = new FormData();
    formData.append('file', {
      uri: imageUri,
      type: mimeType || 'image/jpeg',
      name: filename || 'upload.jpg',
    });

    const options = {
      method: 'POST',
      body: formData,
    };
    
    if (token) {
      options.headers = { 'Authorization': `Bearer ${token}` };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/analyze/media/image`, options);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Request failed with status ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (error.message === 'Network request failed' || error.message.includes('unreachable')) {
        throw new Error('unreachable');
      }
      throw error;
    }
  }

  async analyzeAudio(audioUri, mimeType, filename) {
    const token = await AsyncStorage.getItem('auth_token');
    
    const formData = new FormData();
    formData.append('file', {
      uri: audioUri,
      type: mimeType || 'audio/mp3',
      name: filename || 'upload.mp3',
    });

    const options = {
      method: 'POST',
      body: formData,
    };
    
    if (token) {
      options.headers = { 'Authorization': `Bearer ${token}` };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/analyze/media/audio`, options);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || `Request failed with status ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (error.message === 'Network request failed' || error.message.includes('unreachable')) {
        throw new Error('unreachable');
      }
      throw error;
    }
  }

  async getAttackStory() {
    return this.request('/api/v1/incidents/attack-story');
  }
}

export const api = new ApiService();

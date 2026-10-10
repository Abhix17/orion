/**
 * ORION v2 — Centralized API Client Service
 */

const API_HOST = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL)
  ? import.meta.env.VITE_API_BASE_URL
  : 'http://localhost:8000';

const API_BASE = `${API_HOST.replace(/\/$/, '')}/api/v1`;

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `HTTP Error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`API Error on [${options.method || 'GET'}] ${endpoint}:`, err);
    throw err;
  }
}

async function uploadRequest(endpoint, formData) {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || `HTTP Error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`API Upload Error on ${endpoint}:`, err);
    throw err;
  }
}


export const api = {
  // System Health & Diagnostics
  async getHealth() {
    return request('/system/health');
  },

  // Incidents
  async getIncidents(limit = 50, params = {}) {
    let query = `/incidents?limit=${limit}`;
    if (params.status) query += `&status=${params.status}`;
    if (params.risk_level) query += `&risk_level=${params.risk_level}`;
    if (params.threat_type) query += `&threat_type=${params.threat_type}`;
    return request(query);
  },

  async getIncidentById(id) {
    return request(`/incidents/${id}`);
  },

  async updateIncidentStatus(id, status) {
    return request(`/incidents/${id}/status?status=${status}`, {
      method: 'PATCH',
    });
  },

  async getDashboardSummary() {
    return request('/incidents/summary/dashboard');
  },

  // Multi-modal Analyzers
  async analyzeUrl(url, context = null) {
    return request('/analyze/url', {
      method: 'POST',
      body: JSON.stringify({ url, context }),
    });
  },

  async analyzeMessage(text) {
    return request('/analyze/message', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  async analyzeBrowser(payload) {
    return request('/analyze/browser', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async analyzeAudio(payload) {
    return request('/analyze/audio', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async analyzeImage(payload) {
    return request('/analyze/image', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async analyzeVideo(payload) {
    return request('/analyze/video', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Real Multipart Media Uploads (Phase 1)
  async uploadMediaImage(formData) {
    return uploadRequest('/analyze/media/image', formData);
  },

  async uploadMediaAudio(formData) {
    return uploadRequest('/analyze/media/audio', formData);
  },

  async uploadMediaVideo(formData) {
    return uploadRequest('/analyze/media/video', formData);
  },

  async analyzeAuthEvent(payload) {

    return request('/analyze/auth-event', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Threat Intelligence Feed Lookup
  async lookupThreatIntel(indicator, indicator_type = 'domain') {
    return request(`/system/threat-intel/lookup?indicator=${encodeURIComponent(indicator)}&indicator_type=${indicator_type}`);
  },

  // Protected Identity Profiles
  async getProtectedIdentities() {
    return request('/system/identities');
  },

  async enrollProtectedIdentity(payload) {
    return request('/system/identities', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // In-App Evaluation & Benchmarks (Phase 5)
  async getLatestEvaluation() {
    return request('/evaluation/latest');
  },

  async runEvaluation(params = {}) {
    return request('/evaluation/run', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async getGroundTruthMetadata() {
    return request('/evaluation/ground-truth');
  },

  // Phase 7 — Extended Evaluation Endpoints
  async getEvaluationSummary() {
    return request('/evaluation/summary');
  },

  async getEvaluationScenarios() {
    return request('/evaluation/scenarios');
  },

  async getEvaluationMetrics() {
    return request('/evaluation/metrics');
  },

  async getEvaluationLatency() {
    return request('/evaluation/latency');
  },

  async getEvaluationProviders() {
    return request('/evaluation/providers');
  },

  async getEvaluationRisk() {
    return request('/evaluation/risk');
  },

  async getEvaluationResponse() {
    return request('/evaluation/response');
  },

  // Phase 6 — Response Playbook Execution
  async listResponseActions(incidentId) {
    return request(`/incidents/${incidentId}/actions`);
  },

  async initializeResponseActions(incidentId) {
    return request(`/incidents/${incidentId}/actions/initialize`, { method: 'POST' });
  },

  async executeResponseAction(incidentId, recordId, mode = 'SIMULATED', actor = 'Security Analyst', note = null) {
    return request(`/incidents/${incidentId}/actions/${recordId}/execute`, {
      method: 'POST',
      body: JSON.stringify({ mode, actor, note }),
    });
  },

  async transitionResponseAction(incidentId, recordId, targetStatus, actor = 'Security Analyst', note = null) {
    return request(`/incidents/${incidentId}/actions/${recordId}/transition`, {
      method: 'PATCH',
      body: JSON.stringify({ target_status: targetStatus, actor, note }),
    });
  },

  async getActionAuditTrail(incidentId, recordId) {
    return request(`/incidents/${incidentId}/actions/${recordId}/audit`);
  },

  async getResponseSummary(incidentId) {
    return request(`/incidents/${incidentId}/response-summary`);
  },
};

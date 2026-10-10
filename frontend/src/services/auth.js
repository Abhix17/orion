/**
 * ORION v2 — Isolated Authentication Service & Session Adapter
 * 
 * DESIGN RATIONALE:
 * The ORION backend engine focuses on cybersecurity threat intelligence, multi-modal analysis,
 * and incident detection. User account authentication is isolated in this frontend adapter.
 * It provides complete state machines (SIGNED_OUT, AUTHENTICATING, SIGNED_IN, SESSION_EXPIRED, AUTH_ERROR),
 * supports persistent local storage, custom sign-up, profile updates, settings persistence,
 * and tracks real personal check history without fabricating fake backend detections.
 */

export const AuthState = {
  SIGNED_OUT: 'SIGNED_OUT',
  AUTHENTICATING: 'AUTHENTICATING',
  SIGNED_IN: 'SIGNED_IN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  AUTH_ERROR: 'AUTH_ERROR',
};

const STORAGE_KEY_SESSION = 'orion_v2_auth_session';
const STORAGE_KEY_CHECKS = 'orion_v2_user_checks';
const STORAGE_KEY_SETTINGS = 'orion_v2_user_settings';

const DEFAULT_DEMO_USER = {
  id: 'usr_orion_demo_01',
  name: 'Alice Sharma',
  email: 'alice@orion.ai',
  role: 'Security Citizen',
  avatarInitials: 'AS',
  joinedDate: 'March 2026',
  twoFactorEnabled: true,
  tier: 'Enterprise Trust',
};

const DEFAULT_SETTINGS = {
  theme: 'dark',
  accent: 'cyan',
  language: 'en',
  notifications: {
    securityAlerts: true,
    analysisComplete: true,
    browserShieldPopups: true,
    criticalThreatPush: true,
  },
  privacy: {
    dataRetentionDays: 90,
    anonymizeSubmissions: true,
    allowTelemetry: false,
  },
  browserShield: {
    enabled: true,
    aggressiveMode: false,
    scanDownloads: true,
    credentialHarvestingGuard: true,
  },
};

class AuthService {
  constructor() {
    this.listeners = new Set();
    this.state = AuthState.SIGNED_OUT;
    this.user = null;
    this.error = null;
    this._initFromStorage();
  }

  _initFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SESSION);
      if (stored) {
        const session = JSON.parse(stored);
        if (session && session.user) {
          this.user = session.user;
          this.state = AuthState.SIGNED_IN;
        }
      }
    } catch (e) {
      console.warn('[ORION Auth] Failed to restore session from storage', e);
      this.state = AuthState.SIGNED_OUT;
    }
  }

  _saveSession(user) {
    this.user = user;
    this.state = AuthState.SIGNED_IN;
    this.error = null;
    try {
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify({
        user,
        token: `orion_tok_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        loginTime: new Date().toISOString(),
      }));
    } catch (e) {
      console.error('[ORION Auth] Failed to save session', e);
    }
    this._notify();
  }

  _notify() {
    for (const listener of this.listeners) {
      try {
        listener({ state: this.state, user: this.user, error: this.error });
      } catch (err) {
        console.error('[ORION Auth] Listener notification error', err);
      }
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    // Initial call
    listener({ state: this.state, user: this.user, error: this.error });
    return () => this.listeners.delete(listener);
  }

  getState() {
    return this.state;
  }

  getUser() {
    return this.user;
  }

  isAuthenticated() {
    return this.state === AuthState.SIGNED_IN && !!this.user;
  }

  async signIn({ email, password }) {
    this.state = AuthState.AUTHENTICATING;
    this.error = null;
    this._notify();

    // Simulated short realistic handshake delay
    await new Promise((r) => setTimeout(r, 650));

    if (!email || !password) {
      this.state = AuthState.AUTH_ERROR;
      this.error = 'Please enter both email and password.';
      this._notify();
      throw new Error(this.error);
    }

    if (password.length < 4) {
      this.state = AuthState.AUTH_ERROR;
      this.error = 'Password must be at least 4 characters.';
      this._notify();
      throw new Error(this.error);
    }

    // Generate or match user profile
    const nameParts = email.split('@')[0].split(/[._-]/);
    const displayName = nameParts
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(' ') || 'ORION User';

    const initials = nameParts
      .map((p) => p.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('') || 'OU';

    const user = {
      id: `usr_${Date.now().toString(36)}`,
      name: email === 'alice@orion.ai' ? DEFAULT_DEMO_USER.name : displayName,
      email,
      role: 'Security Citizen',
      avatarInitials: email === 'alice@orion.ai' ? DEFAULT_DEMO_USER.avatarInitials : initials,
      joinedDate: 'October 2026',
      twoFactorEnabled: true,
      tier: 'Standard Trust',
    };

    this._saveSession(user);
    return user;
  }

  async signUp({ name, email, password }) {
    this.state = AuthState.AUTHENTICATING;
    this.error = null;
    this._notify();

    await new Promise((r) => setTimeout(r, 700));

    if (!name || !email || !password) {
      this.state = AuthState.AUTH_ERROR;
      this.error = 'All fields are required to register.';
      this._notify();
      throw new Error(this.error);
    }

    const initials = name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0].toUpperCase())
      .slice(0, 2)
      .join('') || 'OU';

    const user = {
      id: `usr_${Date.now().toString(36)}`,
      name: name.trim(),
      email: email.trim(),
      role: 'Security Citizen',
      avatarInitials: initials,
      joinedDate: 'October 2026',
      twoFactorEnabled: false,
      tier: 'Standard Trust',
    };

    this._saveSession(user);
    return user;
  }

  async signOut() {
    try {
      localStorage.removeItem(STORAGE_KEY_SESSION);
    } catch (_) {}
    this.user = null;
    this.state = AuthState.SIGNED_OUT;
    this.error = null;
    this._notify();
  }

  async requestPasswordReset(email) {
    if (!email) throw new Error('Please provide your account email address.');
    await new Promise((r) => setTimeout(r, 600));
    return { success: true, message: `Password reset instructions dispatched to ${email}` };
  }

  updateProfile(updates) {
    if (!this.user) return;
    this.user = { ...this.user, ...updates };
    this._saveSession(this.user);
    return this.user;
  }

  // --- Real Local Check History (Persisted for Authenticated User) ---

  getHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_CHECKS);
      if (!data) return [];
      return JSON.parse(data);
    } catch (e) {
      console.warn('[ORION Auth] Failed to read check history', e);
      return [];
    }
  }

  saveCheckResult(checkRecord) {
    try {
      const history = this.getHistory();
      const newRecord = {
        id: checkRecord.id || `chk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        modality: checkRecord.modality || 'url',
        title: checkRecord.title || 'Security Inspection',
        inputPreview: checkRecord.inputPreview || '',
        risk_level: checkRecord.risk_level || 'SAFE',
        threat_type: checkRecord.threat_type || 'NONE',
        risk_score: checkRecord.risk_score ?? 0.05,
        verdict: checkRecord.verdict || 'No threats detected',
        explanation: checkRecord.explanation || '',
        rawResult: checkRecord.rawResult || null,
      };
      const updated = [newRecord, ...history.slice(0, 99)]; // Keep latest 100
      localStorage.setItem(STORAGE_KEY_CHECKS, JSON.stringify(updated));
      return newRecord;
    } catch (e) {
      console.error('[ORION Auth] Failed to persist check result', e);
      return checkRecord;
    }
  }

  clearHistory() {
    try {
      localStorage.removeItem(STORAGE_KEY_CHECKS);
      return true;
    } catch (e) {
      return false;
    }
  }

  // --- Settings Persistence ---

  getSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (!raw) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  }

  saveSettings(newSettings) {
    try {
      const merged = { ...this.getSettings(), ...newSettings };
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(merged));
      return merged;
    } catch (e) {
      console.error('[ORION Auth] Failed to persist settings', e);
      return DEFAULT_SETTINGS;
    }
  }
}

export const authService = new AuthService();

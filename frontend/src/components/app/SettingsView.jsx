import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Shield,
  Bell,
  Lock,
  Globe,
  CheckCircle2,
  Cpu,
  Monitor,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { authService } from '../../services/auth';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export default function SettingsView() {
  const [settings, setSettings] = useState(authService.getSettings());
  const [savedNote, setSavedNote] = useState(null);

  const toggleSetting = (section, key) => {
    const updated = {
      ...settings,
      [section]: {
        ...settings[section],
        [key]: !settings[section][key],
      },
    };
    authService.saveSettings(updated);
    setSettings(updated);
    showNotice();
  };

  const showNotice = () => {
    setSavedNote('Preference saved');
    setTimeout(() => setSavedNote(null), 2000);
  };

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 32,
            fontWeight: 800,
            color: '#fff',
            margin: '0 0 6px',
            letterSpacing: '-0.02em',
          }}>
            Settings
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
            Configure verification sensitivity, browser shield hooks, and privacy parameters.
          </p>
        </div>

        {savedNote && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(67, 230, 163, 0.1)',
            border: '1px solid rgba(67, 230, 163, 0.3)',
            borderRadius: 'var(--radius-full)',
            padding: '4px 14px',
            fontSize: 12,
            color: 'var(--success)',
            fontFamily: 'var(--font-mono)',
          }}>
            <CheckCircle2 size={14} />
            <span>{savedNote}</span>
          </div>
        )}
      </div>

      {/* 1. General Preferences */}
      <Card style={{ padding: '24px' }}>
        <h2 style={{ fontSize: 16, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', margin: '0 0 16px', letterSpacing: '0.05em' }}>
          // GENERAL PREFERENCES
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Environment Theme</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Deep obsidian with cyan & violet orbital accents</div>
            </div>
            <Badge variant="cyan">OBSIDIAN DEEP (DEFAULT)</Badge>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Language</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Interface localization</div>
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>English (US)</span>
          </div>
        </div>
      </Card>

      {/* 2. Browser Shield Settings */}
      <Card style={{ padding: '24px' }}>
        <h2 style={{ fontSize: 16, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', margin: '0 0 16px', letterSpacing: '0.05em' }}>
          // BROWSER SHIELD PREFERENCES
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Active Protection</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Real-time domain inspection while navigating web pages</div>
            </div>
            <button
              onClick={() => toggleSetting('browserShield', 'enabled')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: settings.browserShield?.enabled ? 'var(--accent-cyan)' : 'var(--text-muted)' }}
            >
              {settings.browserShield?.enabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Credential Harvesting Guard</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Warn immediately if entering credentials on zero-day domains</div>
            </div>
            <button
              onClick={() => toggleSetting('browserShield', 'credentialHarvestingGuard')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: settings.browserShield?.credentialHarvestingGuard ? 'var(--accent-cyan)' : 'var(--text-muted)' }}
            >
              {settings.browserShield?.credentialHarvestingGuard ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Aggressive Scan Mode</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Flag new domains under 14 days old with strict scrutiny</div>
            </div>
            <button
              onClick={() => toggleSetting('browserShield', 'aggressiveMode')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: settings.browserShield?.aggressiveMode ? 'var(--accent-cyan)' : 'var(--text-muted)' }}
            >
              {settings.browserShield?.aggressiveMode ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
          </div>
        </div>
      </Card>

      {/* 3. Notifications */}
      <Card style={{ padding: '24px' }}>
        <h2 style={{ fontSize: 16, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', margin: '0 0 16px', letterSpacing: '0.05em' }}>
          // NOTIFICATIONS & ALERTS
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>High-Risk Threat Alerts</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Urgent push alerts when malicious artifacts or account attacks are detected</div>
            </div>
            <button
              onClick={() => toggleSetting('notifications', 'criticalThreatPush')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: settings.notifications?.criticalThreatPush ? 'var(--accent-cyan)' : 'var(--text-muted)' }}
            >
              {settings.notifications?.criticalThreatPush ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Inspection Completion Signals</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Notify when long video or multi-frame audio finishes correlation</div>
            </div>
            <button
              onClick={() => toggleSetting('notifications', 'analysisComplete')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: settings.notifications?.analysisComplete ? 'var(--accent-cyan)' : 'var(--text-muted)' }}
            >
              {settings.notifications?.analysisComplete ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
          </div>
        </div>
      </Card>

      {/* 4. Privacy & Telemetry */}
      <Card style={{ padding: '24px' }}>
        <h2 style={{ fontSize: 16, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', margin: '0 0 16px', letterSpacing: '0.05em' }}>
          // PRIVACY & TELEMETRY
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Anonymize Submissions</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Strip origin IP and metadata before multi-model inference</div>
            </div>
            <button
              onClick={() => toggleSetting('privacy', 'anonymizeSubmissions')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: settings.privacy?.anonymizeSubmissions ? 'var(--accent-cyan)' : 'var(--text-muted)' }}
            >
              {settings.privacy?.anonymizeSubmissions ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Allow Anonymous Model Telemetry</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Help improve offline detection weights with sanitized embeddings</div>
            </div>
            <button
              onClick={() => toggleSetting('privacy', 'allowTelemetry')}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: settings.privacy?.allowTelemetry ? 'var(--accent-cyan)' : 'var(--text-muted)' }}
            >
              {settings.privacy?.allowTelemetry ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

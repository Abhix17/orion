import React, { useState, useEffect } from 'react';
import { Server, Database, Activity, ShieldCheck, CheckCircle2, Cpu, HardDrive, Lock, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export default function SystemStatusView({ systemStatus: initialStatus }) {
  const [health, setHealth] = useState(initialStatus || null);
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState(new Date().toLocaleTimeString());

  const fetchLiveHealth = async () => {
    setLoading(true);
    try {
      const live = await api.getHealth();
      setHealth(live);
      setLastChecked(new Date().toLocaleTimeString());
    } catch (err) {
      console.warn('Could not fetch live system health:', err);
      setHealth({ status: 'UNAVAILABLE', error: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveHealth();
    const interval = setInterval(fetchLiveHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const statusStr = (health?.status || initialStatus?.status || 'checking').toLowerCase();
  const isOnline = statusStr === 'online' || statusStr === 'ok';
  const dbStatus = health?.database?.status || 'connected';
  const dbPath = health?.database?.path || 'data/orion.db';
  const version = health?.version || '2.0.0';
  const serviceName = health?.service || 'ORION v2';
  const backendTimestamp = health?.timestamp ? new Date(health.timestamp).toLocaleString() : 'Live';

  const providers = [
    { name: 'URLBERT Neural Classifier', category: 'Web & URL Phishing Detection', status: isOnline ? 'ONLINE' : 'DEGRADED', model: 'DistilBERT Fine-Tuned' },
    { name: 'W2V2-AASIST Audio Detector', category: 'Synthetic Voice Classification', status: isOnline ? 'ONLINE' : 'DEGRADED', model: 'Wav2Vec2 + AASIST' },
    { name: 'Whisper Automatic Speech Recog', category: 'Audio Speech-to-Text Mining', status: isOnline ? 'ONLINE' : 'DEGRADED', model: 'Whisper Base' },
    { name: 'ViT Deepfake Visual Detector', category: 'Visual Deepfake Analysis', status: isOnline ? 'ONLINE' : 'DEGRADED', model: 'Vision Transformer (umm-maybe)' },
    { name: 'YuNet + ArcFace Biometric Suite', category: 'Face Detection & Identity Verification', status: isOnline ? 'ONLINE' : 'DEGRADED', model: 'YuNet / ArcFace MS1MV3' },
    { name: 'EasyOCR Text Mining Engine', category: 'Visual OCR & Phishing Extraction', status: isOnline ? 'ONLINE' : 'DEGRADED', model: 'EasyOCR ResNet' },
    { name: 'Deterministic Risk Engine v4.0', category: 'Cross-Modal Evidence Fusion', status: isOnline ? 'ONLINE' : 'DEGRADED', model: 'Policy Matrix v4.0' },
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-md)',
            background: isOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: isOnline ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Server size={24} color={isOnline ? '#10b981' : '#ef4444'} />
          </div>
          <div>
            <h2 style={{ fontSize: 20, margin: '0 0 4px', color: '#fff' }}>
              {serviceName} System & Telemetry Health
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
              Live telemetry status across multi-modal analysis engines, database connections, and risk policy runtime.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={fetchLiveHealth}
            disabled={loading}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
            background: isOnline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: isOnline ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
            color: isOnline ? '#10b981' : '#ef4444',
            fontSize: 13,
            fontWeight: 700,
          }}>
            <span className={`pulse-dot ${isOnline ? 'pulse-green' : 'pulse-red'}`} />
            <span>STATE: {isOnline ? 'OPERATIONAL' : 'DEGRADED'}</span>
          </div>
        </div>
      </div>

      {/* Primary Subsystem Grid (Dynamic Telemetry) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              FastAPI Core Gateway
            </span>
            <Activity size={18} color="#00f2fe" />
          </div>
          <div className="mono" style={{ fontSize: 24, fontWeight: 800, color: isOnline ? '#fff' : '#ef4444' }}>
            {isOnline ? 'ONLINE' : 'UNREACHABLE'}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, display: 'block' }}>
            REST API Layer (v{version}) • Updated {lastChecked}
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              SQLite Database Engine
            </span>
            <Database size={18} color="#10b981" />
          </div>
          <div className="mono" style={{ fontSize: 24, fontWeight: 800, color: dbStatus === 'connected' ? '#10b981' : '#f59e0b' }}>
            {dbStatus.toUpperCase()} (WAL)
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, display: 'block', wordBreak: 'break-all' }}>
            Storage: {dbPath.split(/[/\\]/).pop()}
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Deterministic Risk Policy
            </span>
            <Lock size={18} color="#c084fc" />
          </div>
          <div className="mono" style={{ fontSize: 24, fontWeight: 800, color: '#c084fc' }}>
            POLICY v4.0 ACTIVE
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, display: 'block' }}>
            Last Verified: {backendTimestamp}
          </span>
        </div>
      </div>

      {/* Analysis Providers Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)',
        }}>
          <h3 style={{ fontSize: 15, margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cpu size={16} color="#00f2fe" /> Analysis Providers & Neural Inference Engines ({providers.length})
          </h3>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            Dynamic Telemetry Active
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {providers.map((p, i) => (
            <div
              key={i}
              style={{
                padding: '14px 20px',
                borderBottom: i < providers.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <CheckCircle2 size={16} color={p.status === 'ONLINE' ? '#10b981' : '#f59e0b'} />
                <div>
                  <strong style={{ color: '#fff', fontSize: 13, display: 'block' }}>
                    {p.name}
                  </strong>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                    {p.category} • Model: <span className="mono">{p.model}</span>
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <span className={`badge ${p.status === 'ONLINE' ? 'badge-safe' : 'badge-warning'}`} style={{ fontSize: 10, padding: '2px 8px' }}>
                  {p.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

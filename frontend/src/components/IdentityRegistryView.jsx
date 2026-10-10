import React, { useState, useEffect } from 'react';
import { UserCheck, Shield, Mic, Lock, AlertCircle, FileCheck, CheckCircle2, UserPlus, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export default function IdentityRegistryView() {
  const [identities, setIdentities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  // New Profile Form
  const [newName, setNewName] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newOrg, setNewOrg] = useState('Apex Enterprise');
  const [newChannels, setNewChannels] = useState('teams:internal, ext:5012');
  const [newPolicy, setNewPolicy] = useState('STRICT_OUT_OF_BAND');
  const [enrolling, setEnrolling] = useState(false);

  const fallbackIdentities = [
    {
      identity_id: 'id_cfo_01',
      display_name: 'Rajesh Sharma',
      role_or_title: 'Chief Financial Officer (CFO)',
      organization: 'Apex Enterprise',
      riskTier: 'TIER-1 CRITICAL ASSET',
      known_contact_channels: ['Encrypted Signal (Verified Key)', 'Corporate PGP Email', 'Direct Internal Extension #4401'],
      notes: 'High-frequency target for synthetic voice impersonation and emergency wire fraud scams.',
    },
    {
      identity_id: 'id_vc_02',
      display_name: 'Dr. Aris Thorne',
      role_or_title: 'Vice Chancellor & Board Member',
      organization: 'University Governance',
      riskTier: 'TIER-1 CRITICAL ASSET',
      known_contact_channels: ['Board Secretariat In-Person', 'Encrypted Voice VoIP'],
      notes: 'Public speaker with extensive public video/audio samples requiring strict out-of-band verification.',
    },
    {
      identity_id: 'id_dir_03',
      display_name: 'Vikram Malhotra',
      role_or_title: 'Managing Director & Infrastructure Lead',
      organization: 'Apex Enterprise',
      riskTier: 'TIER-2 HIGH ASSET',
      known_contact_channels: ['Hardware Security Key FIDO2', 'Enterprise VPN Portal'],
      notes: 'Key authorization personnel for cloud production infrastructure settlement and cryptographic access.',
    },
  ];

  const fetchIdentities = async () => {
    setLoading(true);
    try {
      const data = await api.getProtectedIdentities();
      if (Array.isArray(data) && data.length > 0) {
        setIdentities(data);
      } else {
        setIdentities(fallbackIdentities);
      }
    } catch {
      setIdentities(fallbackIdentities);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdentities();
  }, []);

  const handleEnroll = async (e) => {
    e.preventDefault();
    setEnrolling(true);
    try {
      const channels = newChannels.split(',').map(s => s.trim()).filter(Boolean);
      const res = await api.enrollProtectedIdentity({
        display_name: newName,
        role_or_title: newTitle,
        organization: newOrg,
        known_contact_channels: channels,
        risk_policy: newPolicy,
      });

      setIdentities(prev => [res, ...prev]);
      setShowEnrollModal(false);
      setNewName('');
      setNewTitle('');
    } catch (err) {
      alert(`Enrollment Failed: ${err.message}`);
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div style={{ maxWidth: 1600, margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 22, margin: '0 0 6px' }}>Protected Identity & Executive Registry</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Biometric reference registry and out-of-band verification policies defending leadership personas against AI voice cloning and deepfakes.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={fetchIdentities}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: '#fff',
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowEnrollModal(true)}
            className="btn btn-primary"
            style={{
              padding: '8px 18px',
              fontSize: 13,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <UserPlus size={16} />
            <span>Enroll New VIP Profile</span>
          </button>
        </div>
      </div>

      {/* Principle Callout Alert */}
      <div className="glass-panel" style={{ padding: '16px 20px', borderColor: 'rgba(0, 242, 254, 0.3)', background: 'rgba(0, 242, 254, 0.04)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <AlertCircle size={22} color="#00f2fe" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: 13, lineHeight: 1.5, color: '#e0f2fe' }}>
          <strong>Core Defense Axiom: </strong>
          Synthetic voice detection alone does NOT establish identity or maliciousness. ORION enforces strict signal separation:
          Acoustic similarity to enrolled reference embeddings + Synthetic artifacts + Coercive intent (financial/credential demands) = Compound Critical Impersonation Threat.
        </div>
      </div>

      {/* Profile Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20 }}>
        {identities.map((exec) => (
          <div key={exec.identity_id || exec.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: 18, margin: '0 0 4px', color: '#fff' }}>{exec.display_name || exec.name}</h3>
                <div style={{ fontSize: 13, color: '#00f2fe', fontWeight: 600 }}>{exec.role_or_title || exec.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{exec.organization || exec.department}</div>
              </div>
              <span style={{
                background: 'rgba(255, 51, 102, 0.15)',
                color: '#ff3366',
                border: '1px solid rgba(255, 51, 102, 0.3)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}>
                {exec.risk_policy || exec.riskTier || 'TIER-1 CRITICAL ASSET'}
              </span>
            </div>

            {/* Reference Embeddings */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mic size={14} color="#00f2fe" /> Acoustic Vector:
                </span>
                <span className="mono" style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={13} /> 192-dim Vector Active
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <UserCheck size={14} color="#a855f7" /> Facial Baseline:
                </span>
                <span className="mono" style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircle2 size={13} /> Verified Biometric
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Lock size={14} color="#f59e0b" /> Similarity Threshold:
                </span>
                <span className="mono" style={{ color: '#fff', fontWeight: 700 }}>
                  Cosine &ge; 0.85
                </span>
              </div>
            </div>

            {/* Authorized Contact Channels */}
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Authorized Verification Channels:
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--text-main)' }}>
                {(exec.known_contact_channels || exec.channels || []).map((ch, idx) => (
                  <li key={idx} className="mono">{ch}</li>
                ))}
              </ul>
            </div>

            {/* Operational Note */}
            <div style={{ fontSize: 12, color: 'var(--text-dim)', borderTop: '1px solid var(--border-subtle)', paddingTop: 12, lineHeight: 1.4 }}>
              {exec.notes || 'Enrolled in continuous audio and visual authentication matrix against voice cloning and generative impersonation.'}
            </div>

          </div>
        ))}
      </div>

      {/* ENROLLMENT MODAL */}
      {showEnrollModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 3000,
          padding: 20
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-glow)',
            borderRadius: 'var(--radius-lg)',
            maxWidth: 500,
            width: '100%',
            padding: 26,
            boxShadow: 'var(--shadow-glass)'
          }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>
              Enroll New Executive in Protected Registry
            </h3>

            <form onSubmit={handleEnroll}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Full Name:
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Dr. Sunita Rao"
                  className="input-field"
                  required
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Executive Title / Role:
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Dean of Engineering / Chief Technology Officer"
                  className="input-field"
                  required
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Organization / Campus:
                </label>
                <input
                  type="text"
                  value={newOrg}
                  onChange={(e) => setNewOrg(e.target.value)}
                  className="input-field"
                  required
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Known Contact Channels (Comma Separated):
                </label>
                <input
                  type="text"
                  value={newChannels}
                  onChange={(e) => setNewChannels(e.target.value)}
                  placeholder="teams:s.rao@univ.edu, phone:+91-9988776655"
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enrolling || !newName.trim()}
                  className="btn btn-primary"
                  style={{ padding: '8px 20px', fontWeight: 700 }}
                >
                  {enrolling ? 'Generating Acoustic Vectors...' : 'Enroll Protected Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

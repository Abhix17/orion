import React, { useState } from 'react';
import { 
  Shield, 
  Terminal, 
  Zap, 
  EyeOff,
  Download,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';

import { api } from '../services/api';
import AnalysisResult from './AnalysisResult';

export default function BrowserShieldView({ onInspectTechnical, onIncidentCreated, recentIncidents = [] }) {
  const [url, setUrl] = useState('http://secure-sbi-kyc-update.xyz/login.html');
  const [title, setTitle] = useState('State Bank of India — Secure Verification');
  const [hasPasswordField, setHasPasswordField] = useState(true);
  const [claimedBrand, setClaimedBrand] = useState('State Bank of India');
  const [formAction, setFormAction] = useState('http://exfil-server-193.xyz/collect.php');

  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleTestShield = async () => {
    if (!url.trim()) {
      setErrorMsg('Please specify a webpage URL.');
      return;
    }

    setErrorMsg(null);
    setScanning(true);
    try {
      const payload = {
        url: url.trim(),
        title: title.trim() || null,
        has_password_field: hasPasswordField,
        form_actions: formAction.trim() ? [formAction.trim()] : [],
        claimed_brand: claimedBrand.trim() || null,
      };

      const res = await api.analyzeBrowser(payload);
      setResult(res);
      if (onIncidentCreated) onIncidentCreated(res);
    } catch (err) {
      setErrorMsg(err.message || 'Browser Shield analysis failed.');
    } finally {
      setScanning(false);
    }
  };

  if (result) {
    return (
      <AnalysisResult
        incident={result}
        onReset={() => setResult(null)}
        onInspectTechnical={onInspectTechnical}
      />
    );
  }

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '10px 0 50px' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.08), rgba(2, 132, 199, 0.04))',
        border: '1px solid var(--border-glow)',
        borderRadius: 'var(--radius-lg)',
        padding: 32,
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 'var(--radius-md)',
            background: 'rgba(0, 242, 254, 0.15)',
            border: '1px solid var(--border-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)',
          }}>
            <Shield size={34} color="var(--cyan-glow)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: 0 }}>
                ORION Browser Shield
              </h2>
              <span style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                fontSize: 11,
                fontWeight: 700,
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}></span>
                ACTIVE PROTECTION ENGINE
              </span>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0, maxWidth: 620 }}>
              Continuous real-time browser protection intercepting credential-harvesting phishing kits, lookalike domains, and rogue form exfiltration.
            </p>
          </div>
        </div>

        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 20px',
          textAlign: 'right',
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Extension Standard</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--cyan-glow)' }}>Manifest V3 • Chrome & Edge</div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16,
        marginBottom: 28,
      }}>
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <EyeOff size={18} color="var(--cyan-glow)" />
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>Bounded Privacy Guarantee</h4>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            No keystroke logging, no cookies, no passwords transmitted. Only structural DOM metadata is checked against ORION engines.
          </p>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Zap size={18} color="#f59e0b" />
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>Real-Time Interception</h4>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            Detects brand impersonation and exfiltration form actions before user enters sensitive banking or corporate credentials.
          </p>
        </div>

        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Terminal size={18} color="#a855f7" />
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>Central SOC Sync</h4>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            Suspicious pages automatically trigger high-severity incidents in the Incident Feed with playbooks and IOC attribution.
          </p>
        </div>
      </div>

      {/* Extension Setup & Onboarding Guide */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: 24,
        marginBottom: 28,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <Download size={20} color="var(--cyan-glow)" />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>
            Extension Installation & Setup Guide
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cyan-glow)', marginBottom: 4 }}>STEP 1</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 4 }}>Open Extension Manager</div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
              Navigate to <code style={{ color: 'var(--cyan-glow)' }}>chrome://extensions</code> in Chrome or <code style={{ color: 'var(--cyan-glow)' }}>edge://extensions</code> in Edge.
            </p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cyan-glow)', marginBottom: 4 }}>STEP 2</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 4 }}>Enable Developer Mode</div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
              Toggle the <strong>Developer mode</strong> switch in the top-right corner of the extensions page.
            </p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--cyan-glow)', marginBottom: 4 }}>STEP 3</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 4 }}>Load Unpacked Folder</div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
              Click <strong>Load unpacked</strong> and select the <code style={{ color: 'var(--cyan-glow)' }}>browser-shield/</code> folder from this repository.
            </p>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#10b981', marginBottom: 4 }}>STEP 4</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 4 }}>Active Protection</div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
              The ORION Shield badge appears in your browser toolbar, scanning active pages automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Browser Warnings Section (if any exist) */}
      {recentIncidents.length > 0 && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
          marginBottom: 28,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={18} color="#f59e0b" />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>
                Recent Browser Warnings & Interceptions
              </h3>
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {recentIncidents.length} recorded events
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentIncidents.slice(0, 4).map((inc) => {
              const isCrit = inc.risk_level === 'CRITICAL' || inc.risk_score >= 0.85;
              const isHigh = inc.risk_level === 'HIGH' || (inc.risk_score >= 0.70 && inc.risk_score < 0.85);
              return (
                <div key={inc.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 'var(--radius-md)',
                  gap: 16,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 800,
                      background: isCrit ? 'rgba(239, 68, 68, 0.2)' : isHigh ? 'rgba(245, 158, 11, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                      color: isCrit ? '#f87171' : isHigh ? '#fbbf24' : '#38bdf8',
                      border: `1px solid ${isCrit ? '#ef4444' : isHigh ? '#f59e0b' : '#38bdf8'}`,
                    }}>
                      {inc.risk_level || 'EVAL'}
                    </span>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{inc.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {inc.input_summary || inc.explanation || 'Web intelligence analysis'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onInspectTechnical && onInspectTechnical(inc)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      color: '#38bdf8',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      flexShrink: 0,
                    }}
                  >
                    <span>Inspect</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive Shield Simulator */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: 28,
        boxShadow: 'var(--shadow-glass)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>
              Live DOM Shield Simulator
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
              Simulate bounded DOM telemetry dispatched by the Browser Shield extension to <code style={{ color: 'var(--cyan-glow)' }}>POST /api/v1/analyze/browser</code>.
            </p>
          </div>

          <span style={{
            fontSize: 11,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            color: 'var(--text-dim)',
          }}>
            Direct API Test
          </span>
        </div>

        {errorMsg && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(255, 51, 102, 0.1)',
            border: '1px solid rgba(255, 51, 102, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: '#ff3366',
            fontSize: 13,
            marginBottom: 16,
          }}>
            {errorMsg}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 6 }}>
              Webpage URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 6 }}>
              Page Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 6 }}>
              Claimed Brand in Page Content
            </label>
            <input
              type="text"
              value={claimedBrand}
              onChange={(e) => setClaimedBrand(e.target.value)}
              placeholder="e.g. State Bank of India or HDFC Bank"
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 6 }}>
              Form Destination / Action URL
            </label>
            <input
              type="text"
              value={formAction}
              onChange={(e) => setFormAction(e.target.value)}
              placeholder="http://exfil-server.xyz/post"
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={hasPasswordField}
              onChange={(e) => setHasPasswordField(e.target.checked)}
              style={{ accentColor: 'var(--cyan-glow)', width: 16, height: 16 }}
            />
            <span style={{ fontSize: 13, color: '#fff' }}>
              Page contains password or credential input fields (<code style={{ color: 'var(--cyan-glow)' }}>&lt;input type="password"&gt;</code>)
            </span>
          </label>
        </div>

        <button
          onClick={handleTestShield}
          disabled={scanning}
          style={{
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #00f2fe, #0284c7)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            color: '#000',
            fontWeight: 700,
            fontSize: 14,
            cursor: scanning ? 'not-allowed' : 'pointer',
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          {scanning ? 'Inspecting DOM Signals...' : 'Test Browser Shield Analysis'}
        </button>
      </div>

      {/* Recent Browser Shield Warnings & Incidents Section */}
      <div className="glass-panel" style={{ padding: 24, marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertTriangle size={18} color="#f59e0b" />
              <span>Recent Browser Warnings & Active Incidents</span>
            </h3>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
              Live telemetry stream of DOM security events and browser phishing detections.
            </p>
          </div>
          <span className="mono" style={{ fontSize: 12, color: 'var(--cyan-glow)', background: 'rgba(0, 242, 254, 0.1)', padding: '4px 10px', borderRadius: 'var(--radius-sm)' }}>
            {recentIncidents.length} EVENTS RECORDED
          </span>
        </div>

        {recentIncidents.length === 0 ? (
          <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, background: 'rgba(0, 0, 0, 0.2)', borderRadius: 'var(--radius-md)' }}>
            No recent browser warnings recorded. Use the simulator above or active web extension to trigger browser threats.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentIncidents.slice(0, 5).map((inc) => {
              const isCrit = inc.risk_level === 'CRITICAL' || inc.risk_score >= 0.85;
              const isHigh = inc.risk_level === 'HIGH' || inc.risk_score >= 0.70;
              const badgeBg = isCrit ? 'rgba(239, 68, 68, 0.2)' : isHigh ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)';
              const badgeColor = isCrit ? '#ef4444' : isHigh ? '#f59e0b' : '#10b981';

              return (
                <div key={inc.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  gap: 16,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: 4,
                      background: badgeBg,
                      color: badgeColor,
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      flexShrink: 0,
                    }}>
                      {inc.risk_level || 'HIGH'}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {inc.title || inc.input_summary}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }} className="mono">
                        {inc.id} • {inc.input_summary}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onInspectTechnical && onInspectTechnical(inc)}
                    style={{
                      background: 'rgba(0, 242, 254, 0.1)',
                      border: '1px solid rgba(0, 242, 254, 0.3)',
                      color: '#00f2fe',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      flexShrink: 0,
                    }}
                  >
                    <span>Inspect</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

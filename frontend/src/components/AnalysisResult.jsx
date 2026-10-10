import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  AlertOctagon, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  Copy, 
  Check, 
  Share2, 
  PhoneCall, 
  ArrowLeft, 
  Terminal, 
  FileText, 
  Eye 
} from 'lucide-react';


export default function AnalysisResult({ incident, onReset, onInspectTechnical }) {
  const [showEvidence, setShowEvidence] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [copiedAdvisory, setCopiedAdvisory] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  if (!incident) return null;

  // Determine risk presentation
  const riskScore = incident.risk_score !== undefined ? Math.round(incident.risk_score * 100) : 0;
  const riskLevel = (incident.risk_level || 'LOW').toUpperCase();

  const getRiskTheme = (level) => {
    switch (level) {
      case 'CRITICAL':
        return {
          color: '#ff3366',
          bg: 'rgba(255, 51, 102, 0.12)',
          border: 'rgba(255, 51, 102, 0.35)',
          icon: AlertOctagon,
          label: 'CRITICAL RISK',
          sub: 'Dangerous threat detected. Immediate protective action required.',
        };
      case 'HIGH':
        return {
          color: '#f97316',
          bg: 'rgba(249, 115, 22, 0.12)',
          border: 'rgba(249, 115, 22, 0.35)',
          icon: ShieldAlert,
          label: 'HIGH RISK',
          sub: 'Multiple indicators consistent with active deception or impersonation.',
        };
      case 'MEDIUM':
        return {
          color: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.12)',
          border: 'rgba(245, 158, 11, 0.35)',
          icon: AlertTriangle,
          label: 'MEDIUM RISK',
          sub: 'Suspicious elements identified. Exercise elevated caution.',
        };
      case 'SAFE':
      case 'LOW':
      default:
        return {
          color: '#10b981',
          bg: 'rgba(16, 185, 129, 0.12)',
          border: 'rgba(16, 185, 129, 0.35)',
          icon: ShieldCheck,
          label: 'SAFE / LOW RISK',
          sub: 'No active threat or malicious indicators detected in analyzed signals.',
        };
    }
  };

  const theme = getRiskTheme(riskLevel);
  const RiskIcon = theme.icon;

  // Primary recommendation text
  const primaryActionText = (incident.recommended_actions && incident.recommended_actions.length > 0)
    ? (typeof incident.recommended_actions[0] === 'string' ? incident.recommended_actions[0] : (incident.recommended_actions[0].description || incident.recommended_actions[0].title))
    : 'Verify the sender or domain through an independent, trusted communication channel before taking action.';

  // Main evidence bullet points
  const evidenceBullets = (incident.risk_drivers && incident.risk_drivers.length > 0)
    ? incident.risk_drivers
    : (incident.evidence && incident.evidence.length > 0)
      ? incident.evidence.slice(0, 3).map(e => e.explanation || e.type.replace(/_/g, ' '))
      : ['No malicious indicators detected'];

  const handleCopyAdvisory = () => {
    const text = `🚨 ORION SECURITY ADVISORY\nThreat: ${incident.title}\nRisk: ${riskLevel} (${riskScore}/100)\n\nRecommended Actions:\n${(incident.recommended_actions || []).map((a, i) => `${i + 1}. ${typeof a === 'string' ? a : a.title}`).join('\n')}\n\nAnalyzed by ORION v2 Security Platform`;
    navigator.clipboard.writeText(text);
    setCopiedAdvisory(true);
    setTimeout(() => setCopiedAdvisory(false), 2500);
  };

  const handleCopyWhatsAppAlert = () => {
    const text = `⚠️ *CYBER FRAUD ALERT* ⚠️\n\nI checked this suspicious item using *ORION Cyber Threat Intelligence*:\n*Threat:* ${incident.title}\n*Risk Level:* ${riskLevel} (${riskScore}/100)\n\n*Why it is flagged:*\n${incident.explanation || 'Suspicious indicators detected.'}\n\n*Safety Advisory:*\n${primaryActionText}\n\n_Dial 1930 if money was lost (National Cyber Crime Helpline)._`;
    navigator.clipboard.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', animation: 'fadeIn 0.25s ease' }}>
      {/* Top Bar with Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <button
          onClick={onReset}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'transparent',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            cursor: 'pointer',
            transition: 'var(--transition)',
          }}
        >
          <ArrowLeft size={16} />
          <span>Check another item</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={handleCopyAdvisory}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              cursor: 'pointer',
              transition: 'var(--transition)',
            }}
          >
            {copiedAdvisory ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
            <span>{copiedAdvisory ? 'Advisory Copied!' : 'Copy Advisory'}</span>
          </button>

          <button
            onClick={handleCopyWhatsAppAlert}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              cursor: 'pointer',
              transition: 'var(--transition)',
            }}
          >
            {copiedShare ? <Check size={15} color="#10b981" /> : <Share2 size={15} />}
            <span>{copiedShare ? 'Alert Copied!' : 'Share Warning'}</span>
          </button>
        </div>
      </div>


      {/* Main Analysis Card */}
      <div style={{
        background: 'var(--bg-card)',
        border: `1px solid ${theme.border}`,
        borderRadius: 'var(--radius-lg)',
        padding: 36,
        boxShadow: `0 12px 40px rgba(0,0,0,0.5)`,
        marginBottom: 24,
      }}>
        {/* Header Tag */}
        <div style={{
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--text-dim)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 14,
        }}>
          ORION ANALYSIS
        </div>

        {/* Risk Banner */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          paddingBottom: 24,
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 'var(--radius-md)',
              background: theme.bg,
              border: `1px solid ${theme.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <RiskIcon size={30} color={theme.color} />
            </div>
            <div>
              <div style={{
                fontSize: 22,
                fontWeight: 900,
                color: theme.color,
                letterSpacing: '0.04em',
                lineHeight: 1.1,
              }}>
                {theme.label}
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginTop: 4, marginBottom: 0 }}>
                {incident.threat_type ? incident.threat_type.replace(/_/g, ' ').toUpperCase() : incident.title}
              </h2>
            </div>
          </div>

          {/* Risk Score Pill */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '10px 18px',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${theme.border}`,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
              Threat Score
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: theme.color, lineHeight: 1 }}>
              {riskScore}<span style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 500 }}>/100</span>
            </div>
          </div>
        </div>

        {/* Explanation Summary */}
        <div style={{ padding: '24px 0 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <p style={{
            fontSize: 16,
            color: '#f8fafc',
            lineHeight: 1.6,
            margin: 0,
            fontWeight: 500,
          }}>
            "{incident.explanation || 'No high-confidence anomaly indicators detected in submitted content.'}"
          </p>
        </div>

        {/* Why ORION Flagged This */}
        <div style={{ padding: '20px 0', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text-dim)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 12,
          }}>
            Why ORION flagged this
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {evidenceBullets.map((bullet, idx) => (
              <li key={idx} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                fontSize: 14,
                color: '#e2e8f0',
                lineHeight: 1.5,
              }}>
                <span style={{
                  color: theme.color,
                  fontSize: 18,
                  lineHeight: '14px',
                  marginTop: 2,
                }}>
                  •
                </span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recommended Action */}
        <div style={{ padding: '20px 0', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text-dim)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 10,
          }}>
            Recommended action
          </h3>
          <p style={{
            fontSize: 14,
            color: '#fff',
            lineHeight: 1.5,
            margin: 0,
            fontWeight: 600,
          }}>
            {primaryActionText}
          </p>
        </div>

        {/* PRIMARY Action Buttons: [ View Evidence ] [ View Incident ] */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          paddingTop: 24,
        }}>
          <button
            onClick={() => setShowEvidence(!showEvidence)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '11px 22px',
              borderRadius: 'var(--radius-md)',
              background: showEvidence ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.08)',
              border: showEvidence ? '1px solid var(--border-glow)' : '1px solid var(--border-subtle)',
              color: showEvidence ? 'var(--cyan-glow)' : '#fff',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'var(--transition)',
            }}
          >
            <Eye size={16} />
            <span>{showEvidence ? 'Hide Evidence' : 'View Evidence'}</span>
            <span style={{
              fontSize: 11,
              padding: '1px 7px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'var(--text-muted)',
            }}>
              {incident.evidence?.length || 0}
            </span>
          </button>

          {onInspectTechnical && (
            <button
              onClick={() => onInspectTechnical(incident)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '11px 22px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #00f2fe, #0284c7)',
                border: 'none',
                color: '#000',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-glow)',
                transition: 'var(--transition)',
              }}
            >
              <FileText size={16} />
              <span>View Incident</span>
            </button>
          )}
        </div>

        {/* Progressive Evidence Disclosure Block */}
        {showEvidence && (
          <div style={{
            marginTop: 24,
            padding: 20,
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            animation: 'fadeIn 0.2s ease',
          }}>
            <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>
              Detailed Security Indicators
            </h4>
            {(!incident.evidence || incident.evidence.length === 0) ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                No anomaly indicators registered for this input.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {incident.evidence.map((item, idx) => (
                  <div key={idx} style={{
                    padding: 14,
                    background: 'rgba(0, 0, 0, 0.25)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 16,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, color: '#fff', fontSize: 13 }}>
                          {(item.type || 'Indicator').replace(/_/g, ' ')}
                        </span>
                        <span style={{
                          fontSize: 10,
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: 'rgba(255, 255, 255, 0.06)',
                          color: 'var(--text-dim)',
                          textTransform: 'uppercase',
                        }}>
                          {item.source}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                        {item.explanation || JSON.stringify(item.indicators || {})}
                      </p>
                    </div>

                    <div style={{ textAlign: 'right', minWidth: 90 }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        background: item.severity_contribution === 'CRITICAL' ? 'rgba(255,51,102,0.15)' :
                                   item.severity_contribution === 'HIGH' ? 'rgba(249,115,22,0.15)' :
                                   item.severity_contribution === 'MEDIUM' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                        color: item.severity_contribution === 'CRITICAL' ? '#ff3366' :
                               item.severity_contribution === 'HIGH' ? '#f97316' :
                               item.severity_contribution === 'MEDIUM' ? '#f59e0b' : '#10b981',
                      }}>
                        {item.severity_contribution || 'INFO'}
                      </span>
                      {item.confidence !== undefined && (
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                          Conf: {Math.round(item.confidence * 100)}%
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Emergency Assistance (1930 / cybercrime.gov.in) */}
        {riskLevel !== 'SAFE' && riskLevel !== 'LOW' && (
          <div style={{
            marginTop: 24,
            padding: 16,
            background: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <PhoneCall size={18} color="#ef4444" />
              <div>
                <span style={{ fontWeight: 700, color: '#fff', fontSize: 13 }}>
                  Need Immediate Cyber Assistance?
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
                  If financial fraud occurred, dial <strong>1930</strong> (National Cybercrime Helpline).
                </span>
              </div>
            </div>

            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: '#ef4444',
                fontSize: 12,
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <span>cybercrime.gov.in</span>
              <ExternalLink size={13} />
            </a>
          </div>
        )}

        {/* SECONDARY / TECHNICAL DETAILS SECTION */}
        <div style={{
          marginTop: 28,
          paddingTop: 16,
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          {/* Subtle SOC Link */}
          {onInspectTechnical && (
            <button
              onClick={() => onInspectTechnical(incident)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <Terminal size={13} />
              <span>Inspect in SOC Drawer</span>
            </button>
          )}

          {/* Toggle Raw Diagnostics */}
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-dim)',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <span>{showTechnicalDetails ? 'Hide technical diagnostics' : 'Show technical diagnostics'}</span>
            {showTechnicalDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Raw Technical Details (When toggled) */}
        {showTechnicalDetails && (
          <div style={{ marginTop: 14, animation: 'fadeIn 0.2s ease' }}>
            {Array.isArray(incident.mitre_techniques) && incident.mitre_techniques.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6, fontWeight: 700 }}>
                  MITRE ATT&CK TECHNIQUES:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {incident.mitre_techniques.map((tech, i) => (
                    <span key={i} style={{
                      padding: '2px 8px',
                      background: 'rgba(0, 242, 254, 0.08)',
                      border: '1px solid var(--border-glow)',
                      color: 'var(--cyan-glow)',
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                    }}>
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <pre style={{
              background: '#04060a',
              padding: 12,
              borderRadius: 'var(--radius-sm)',
              fontSize: 11,
              color: '#94a3b8',
              overflowX: 'auto',
              maxHeight: 220,
              border: '1px solid var(--border-subtle)',
            }}>
              {JSON.stringify(incident.metadata || incident, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

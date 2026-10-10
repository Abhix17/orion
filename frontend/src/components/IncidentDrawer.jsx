import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ShieldCheck,
  ExternalLink,
  Zap,
  Terminal,
  Lock,
  Radio,
  Activity,
  PlayCircle,
  Clock,
  ShieldAlert,
  FileText,
  RefreshCw,
  AlertCircle,
  CheckCheck,
  XCircle,
  Eye,
  Layers,
  Network,
  Share2,
  Calendar,
  User,
  Globe,
  Monitor,
  MessageSquare
} from 'lucide-react';
import { api } from '../services/api';
import Badge from './ui/Badge';
import Button from './ui/Button';
import AttackGraph from './AttackGraph';

// Status styling metadata
const STATUS_META = {
  RECOMMENDED: { color: '#94a3b8', icon: <Clock size={12} />, label: 'Recommended' },
  ACKNOWLEDGED: { color: '#38bdf8', icon: <Eye size={12} />, label: 'Acknowledged' },
  EXECUTING: { color: '#f59e0b', icon: <Activity size={12} />, label: 'Executing…' },
  COMPLETED: { color: '#10b981', icon: <CheckCheck size={12} />, label: 'Completed' },
  DISMISSED: { color: '#64748b', icon: <XCircle size={12} />, label: 'Dismissed' },
  FAILED: { color: '#ef4444', icon: <AlertCircle size={12} />, label: 'Failed' },
};

const MODE_BADGE = {
  ADVISORY: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', label: 'ADVISORY' },
  SIMULATED: { bg: 'rgba(16,185,129,0.15)', color: '#34d399', label: 'SIMULATED' },
};

const PRIORITY_COLOR = {
  P0_IMMEDIATE: '#ff3b5f',
  P1_HIGH: '#f97316',
  P2_MEDIUM: '#f59e0b',
  P3_ADVISORY: '#94a3b8',
};

function getRiskColor(score) {
  if (score >= 0.85) return '#ff3b5f';
  if (score >= 0.70) return '#f97316';
  if (score >= 0.40) return '#f59e0b';
  return '#43e6a3';
}

function AuditTrail({ events }) {
  if (!events?.length) return null;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 6 }}>
        AUDIT TRAIL
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {events.map((evt, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            padding: '6px 10px',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 4,
            borderLeft: `2px solid ${STATUS_META[evt.to_status]?.color || '#64748b'}`,
            fontSize: 11,
          }}>
            <div style={{ flex: 1 }}>
              <span style={{ color: 'var(--text-muted)' }}>
                {evt.from_status ? `${evt.from_status} →` : '●'}
              </span>{' '}
              <strong style={{ color: STATUS_META[evt.to_status]?.color || '#fff' }}>
                {evt.to_status}
              </strong>
              {evt.note && (
                <span style={{ color: 'var(--text-secondary)', marginLeft: 6 }}>— {evt.note}</span>
              )}
            </div>
            <div style={{ textAlign: 'right', color: 'var(--text-muted)', whiteSpace: 'nowrap', fontSize: 10 }}>
              <div>{evt.actor}</div>
              <div>{new Date(evt.timestamp).toLocaleTimeString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResponseActionCard({ action, incidentId, onUpdate }) {
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showAudit, setShowAudit] = useState(false);
  const [auditEvents, setAuditEvents] = useState(null);

  const prioColor = PRIORITY_COLOR[action.priority] || '#94a3b8';
  const statusMeta = STATUS_META[action.status] || STATUS_META.RECOMMENDED;

  const isTerminal = ['COMPLETED', 'DISMISSED'].includes(action.status);
  const canExecute = ['RECOMMENDED', 'ACKNOWLEDGED'].includes(action.status);
  const canAcknowledge = action.status === 'RECOMMENDED';
  const canDismiss = !isTerminal;

  const handleTransition = async (toStatus, payload = {}) => {
    setBusy(true);
    try {
      const updated = await api.transitionResponseAction(incidentId, action.id, {
        status: toStatus,
        actor: 'SOC Analyst',
        note: payload.note || undefined,
        ...payload,
      });
      onUpdate(updated);
    } catch (err) {
      alert(`Action transition failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const loadAudit = async () => {
    if (!showAudit && !auditEvents) {
      try {
        const events = await api.getResponseActionAudit(incidentId, action.id);
        setAuditEvents(events);
      } catch {
        // fallback
      }
    }
    setShowAudit(!showAudit);
  };

  return (
    <div style={{
      background: 'var(--bg-deep)',
      border: `1px solid ${statusMeta.color}33`,
      borderLeft: `3px solid ${prioColor}`,
      borderRadius: 'var(--radius-md)',
      padding: '14px 16px',
      fontSize: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 10, fontWeight: 800, color: prioColor,
              fontFamily: 'var(--font-mono)',
            }}>
              {action.priority?.replace('_', ' ')}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: `${statusMeta.color}22`, color: statusMeta.color,
              border: `1px solid ${statusMeta.color}44`,
              borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 700,
              textTransform: 'uppercase',
            }}>
              {statusMeta.icon} {statusMeta.label}
            </span>
            <span style={{
              background: MODE_BADGE[action.mode]?.bg || 'rgba(59,130,246,0.15)',
              color: MODE_BADGE[action.mode]?.color || '#60a5fa',
              borderRadius: 4, padding: '1px 6px', fontSize: 9, fontWeight: 800,
            }}>
              {action.mode}
            </span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
            {action.title}
          </div>
          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            {action.description}
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {expanded && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12, color: 'var(--text-secondary)' }}>
            <div><strong style={{ color: '#fff' }}>Target:</strong> {action.target}</div>
            <div><strong style={{ color: '#fff' }}>Category:</strong> {action.category}</div>
          </div>

          {!isTerminal && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {canAcknowledge && (
                <button
                  disabled={busy}
                  onClick={() => handleTransition('ACKNOWLEDGED')}
                  style={{
                    background: 'rgba(56, 189, 248, 0.15)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    color: '#38bdf8',
                    padding: '6px 12px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Acknowledge
                </button>
              )}
              {canExecute && (
                <button
                  disabled={busy}
                  onClick={() => handleTransition('COMPLETED', { note: 'Simulated execution completed by SOC' })}
                  style={{
                    background: 'rgba(67, 230, 163, 0.15)',
                    border: '1px solid rgba(67, 230, 163, 0.3)',
                    color: '#43e6a3',
                    padding: '6px 12px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Execute Simulation
                </button>
              )}
              {canDismiss && (
                <button
                  disabled={busy}
                  onClick={() => handleTransition('DISMISSED')}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: 'var(--text-muted)',
                    padding: '6px 12px',
                    borderRadius: 4,
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  Dismiss
                </button>
              )}
            </div>
          )}

          <div style={{ marginTop: 10 }}>
            <button
              onClick={loadAudit}
              style={{
                background: 'transparent', border: 'none', color: 'var(--accent-cyan)',
                fontSize: 11, cursor: 'pointer', padding: 0, textDecoration: 'underline',
              }}
            >
              {showAudit ? 'Hide' : 'View'} audit trail ({action.audit_trail?.length || 0} events)
            </button>
            {showAudit && <AuditTrail events={auditEvents || action.audit_trail} />}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Investigation Drawer ───────────────────────────────────────────────
export default function IncidentDrawer({ incident, onClose, onActionExecuted }) {
  const [activeTab, setActiveTab] = useState('overview'); // overview | evidence | risk | timeline | entities | attack_chain | xai | response | notes
  const [currentStatus, setCurrentStatus] = useState(incident?.status || 'NEW');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [responseActions, setResponseActions] = useState([]);
  const [responseSummary, setResponseSummary] = useState(null);
  const [loadingActions, setLoadingActions] = useState(false);
  const [initializingActions, setInitializingActions] = useState(false);
  const [notes, setNotes] = useState(incident?.notes || []);
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  useEffect(() => {
    if (incident?.status) setCurrentStatus(incident.status);
    if (incident?.notes) setNotes(incident.notes);
  }, [incident?.id, incident?.status, incident?.notes]);

  const loadResponseActions = useCallback(async () => {
    if (!incident?.id) return;
    setLoadingActions(true);
    try {
      const [actions, summary] = await Promise.all([
        api.listResponseActions(incident.id).catch(() => []),
        api.getResponseSummary(incident.id).catch(() => null),
      ]);
      setResponseActions(actions || []);
      setResponseSummary(summary);
    } catch {
      setResponseActions([]);
    } finally {
      setLoadingActions(false);
    }
  }, [incident?.id]);

  useEffect(() => {
    loadResponseActions();
  }, [loadResponseActions]);

  if (!incident) return null;

  const riskColor = getRiskColor(incident.risk_score || 0.5);

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      await api.updateIncidentStatus(incident.id, newStatus);
      setCurrentStatus(newStatus);
      if (onActionExecuted) onActionExecuted(incident.id, { title: `Status → ${newStatus}` });
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setSubmittingNote(true);
    try {
      const noteRecord = {
        id: `note_${Date.now()}`,
        author: 'SOC Lead Analyst',
        timestamp: new Date().toISOString(),
        content: newNote.trim(),
      };
      setNotes((prev) => [...prev, noteRecord]);
      setNewNote('');
    } catch (err) {
      alert(`Failed to add note: ${err.message}`);
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleInitializeActions = async () => {
    setInitializingActions(true);
    try {
      await api.initializeResponseActions(incident.id);
      await loadResponseActions();
    } catch (err) {
      alert(`Failed to initialize actions: ${err.message}`);
    } finally {
      setInitializingActions(false);
    }
  };

  const handleActionUpdate = (updatedRecord) => {
    setResponseActions((prev) =>
      prev.map((a) => (a.id === updatedRecord.id ? updatedRecord : a))
    );
    loadResponseActions();
    if (onActionExecuted) onActionExecuted(incident.id, updatedRecord);
  };

  // Derive entities strictly from incident data
  const entities = [];
  if (incident.target || incident.input_summary) {
    entities.push({ type: 'Target / Artifact', label: incident.target || incident.input_summary, icon: Globe, color: '#38bdf8' });
  }
  if (incident.source_ip || incident.ip) {
    entities.push({ type: 'Source IP', label: incident.source_ip || incident.ip, icon: Terminal, color: '#f59e0b' });
  }
  if (incident.claimed_identity || incident.user_id) {
    entities.push({ type: 'Identity / Person', label: incident.claimed_identity || incident.user_id, icon: User, color: '#c084fc' });
  }
  if (incident.device || incident.user_agent) {
    entities.push({ type: 'Device', label: incident.device || incident.user_agent, icon: Monitor, color: '#94a3b8' });
  }
  if (incident.evidence?.length) {
    entities.push({ type: 'Correlated Evidence', label: `${incident.evidence.length} atomic evidence signals`, icon: Radio, color: '#43e6a3' });
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'evidence', label: `Evidence (${incident.evidence?.length || 0})` },
    { id: 'risk', label: 'Risk' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'entities', label: `Entities (${entities.length})` },
    { id: 'attack_chain', label: 'Attack Chain' },
    { id: 'xai', label: 'XAI' },
    { id: 'response', label: `Response (${responseActions.length})` },
    { id: 'notes', label: `Notes (${notes.length})` },
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 7, 13, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'flex-end',
      animation: 'fadeIn 0.2s ease',
    }} onClick={onClose}>
      <div
        style={{
          width: '760px',
          maxWidth: '94vw',
          height: '100%',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '-16px 0 40px rgba(0, 0, 0, 0.8)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div style={{
          padding: '24px 28px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'var(--bg-elevated)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  {incident.id}
                </span>
                <span style={{
                  background: `${riskColor}20`,
                  color: riskColor,
                  border: `1px solid ${riskColor}50`,
                  borderRadius: 'var(--radius-full)',
                  padding: '2px 10px',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                }}>
                  {incident.risk_level || (incident.risk_score >= 0.7 ? 'CRITICAL' : 'MEDIUM')}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  • {new Date(incident.timestamp || Date.now()).toLocaleTimeString()}
                </span>
              </div>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 800,
                color: '#fff',
                margin: '0 0 6px',
                letterSpacing: '-0.02em',
              }}>
                {incident.title}
              </h2>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Target: <span style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>{incident.target || incident.input_summary || 'Multi-modal payload'}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
            >
              <X size={22} />
            </button>
          </div>

          {/* Triage Status Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 18,
            paddingTop: 14,
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>STATUS:</span>
              <select
                value={currentStatus}
                disabled={updatingStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                style={{
                  background: 'var(--bg-deep)',
                  border: '1px solid rgba(110, 231, 255, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--accent-cyan)',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '4px 10px',
                  cursor: 'pointer',
                }}
              >
                <option value="NEW">NEW</option>
                <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                <option value="INVESTIGATING">INVESTIGATING</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="FALSE_POSITIVE">FALSE_POSITIVE</option>
              </select>
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Confidence: {Math.round((incident.confidence || 0.9) * 100)}%
            </div>
          </div>

          {/* Navigation Tabs Strip */}
          <div style={{
            display: 'flex',
            gap: 4,
            overflowX: 'auto',
            marginTop: 16,
            paddingBottom: 4,
          }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: activeTab === tab.id ? 'rgba(110, 231, 255, 0.15)' : 'transparent',
                  border: `1px solid ${activeTab === tab.id ? 'var(--accent-cyan)' : 'transparent'}`,
                  color: activeTab === tab.id ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  borderRadius: 'var(--radius-full)',
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content Body */}
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{
                background: 'var(--bg-elevated)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 'var(--radius-lg)',
                padding: 20,
              }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'var(--font-mono)' }}>
                  // EXECUTIVE SUMMARY
                </div>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: '#fff', margin: 0 }}>
                  {incident.explanation || 'No summary available.'}
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 14,
              }}>
                <div style={{ background: 'var(--bg-deep)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>THREAT VECTOR</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-cyan)', marginTop: 4 }}>
                    {incident.threat_type || 'PHISHING'}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-deep)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>MODALITY</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginTop: 4, textTransform: 'uppercase' }}>
                    {incident.input_type || incident.source || 'URL'}
                  </div>
                </div>
                <div style={{ background: 'var(--bg-deep)', padding: 14, borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>RISK SCORE</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: riskColor, marginTop: 4 }}>
                    {((incident.risk_score || 0.8) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EVIDENCE */}
          {activeTab === 'evidence' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                Atomic evidence signals contributing to this incident:
              </div>
              {incident.evidence?.map((item, idx) => (
                <div
                  key={item.id || idx}
                  style={{
                    background: 'var(--bg-deep)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 'var(--radius-md)',
                    padding: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{
                      background: 'rgba(110, 231, 255, 0.1)',
                      color: 'var(--accent-cyan)',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontFamily: 'var(--font-mono)',
                    }}>
                      {item.source}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      Weight: {item.weight} • Conf: {Math.round((item.confidence || 0.85) * 100)}%
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: '#fff', fontWeight: 600, marginBottom: 4 }}>
                    {item.type}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    {item.explanation}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: RISK */}
          {activeTab === 'risk' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{
                background: 'var(--bg-elevated)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 'var(--radius-lg)',
                padding: 24,
              }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>
                  Calibrated Risk Gauge
                </div>
                <div style={{ fontSize: 44, fontWeight: 800, fontFamily: 'var(--font-display)', color: riskColor, lineHeight: 1, marginBottom: 14 }}>
                  {((incident.risk_score || 0.8) * 100).toFixed(1)}%
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, (incident.risk_score || 0.8) * 100)}%`,
                    background: riskColor,
                  }} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TIMELINE */}
          {activeTab === 'timeline' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { time: incident.timestamp || 'Initial Ingestion', label: 'Signal Ingested & Preprocessed', desc: 'Raw payload received and dispatched to neural inference pipeline.' },
                { time: 'T + 120ms', label: 'Feature Extraction & Classification', desc: 'Models completed heuristic and deep embedding evaluations.' },
                { time: 'T + 210ms', label: 'Evidence Fusion & Bayesian Scoring', desc: 'Risk engine correlated multimodal indicators and calibrated final score.' },
                { time: 'T + 340ms', label: 'Incident Created & Playbooks Computed', desc: 'Advisory response generated for citizen and security team.' },
              ].map((step, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-cyan)' }} />
                    {idx < 3 && <div style={{ width: 2, flex: 1, background: 'rgba(110, 231, 255, 0.2)', margin: '4px 0' }} />}
                  </div>
                  <div style={{ paddingBottom: 16 }}>
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>{step.time}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '2px 0 4px' }}>{step.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: ENTITIES & 2D/3D RELATIONSHIP GRAPH */}
          {activeTab === 'entities' && (
            <AttackGraph incident={incident} />
          )}

          {/* TAB 6: ATTACK CHAIN (MITRE) */}
          {activeTab === 'attack_chain' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {incident.mitre_techniques?.length > 0 ? (
                incident.mitre_techniques.map((tech) => (
                  <div
                    key={tech.id}
                    style={{
                      background: 'var(--bg-deep)',
                      border: '1px solid rgba(139, 124, 255, 0.25)',
                      borderRadius: 'var(--radius-md)',
                      padding: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-violet)', fontWeight: 700 }}>
                        {tech.id}
                      </span>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginTop: 2 }}>
                        {tech.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        Tactic: {tech.tactic}
                      </div>
                    </div>
                    {tech.url && (
                      <a href={tech.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-cyan)', fontSize: 12 }}>
                        ATT&CK Reference →
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  No MITRE ATT&CK techniques mapped for this incident.
                </div>
              )}
            </div>
          )}

          {/* TAB 7: XAI DECISION LINEAGE */}
          {activeTab === 'xai' && (
            <div style={{
              background: 'var(--bg-deep)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-lg)',
              padding: 20,
            }}>
              <div style={{ fontSize: 12, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
                // EXPLAINABLE AI LINEAGE
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, color: '#fff', whiteSpace: 'pre-wrap' }}>
                {incident.explanation || 'No rationale available.'}
              </div>
            </div>
          )}

          {/* TAB 8: RESPONSE PLAYBOOK */}
          {activeTab === 'response' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Response actions & containment playbooks:
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="outline" size="sm" onClick={loadResponseActions}>
                    Refresh
                  </Button>
                  {responseActions.length === 0 && incident.recommended_actions?.length > 0 && (
                    <Button variant="primary" size="sm" onClick={handleInitializeActions}>
                      Initialize Playbooks
                    </Button>
                  )}
                </div>
              </div>

              {responseActions.map((action) => (
                <ResponseActionCard
                  key={action.id}
                  action={action}
                  incidentId={incident.id}
                  onUpdate={handleActionUpdate}
                />
              ))}
            </div>
          )}

          {/* TAB 9: ANALYST NOTES */}
          {activeTab === 'notes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Record investigation notes, indicators of compromise, or disposition rationale..."
                  rows={3}
                  style={{
                    background: 'var(--bg-deep)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 'var(--radius-md)',
                    color: '#fff',
                    padding: 12,
                    fontSize: 13,
                    resize: 'vertical',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button type="submit" variant="primary" size="sm" loading={submittingNote}>
                    Add Note
                  </Button>
                </div>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
                {notes.map((note, idx) => (
                  <div
                    key={note.id || idx}
                    style={{
                      background: 'var(--bg-deep)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderRadius: 'var(--radius-md)',
                      padding: 14,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                      <span>{note.author}</span>
                      <span>{new Date(note.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#fff', lineHeight: 1.5 }}>
                      {note.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

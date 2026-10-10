import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  AlertCircle, 
  Share2, 
  Check, 
  PhoneCall, 
  Search, 
  Filter, 
  ArrowRight,
  Bell,
  Globe,
  Lock,
  ExternalLink
} from 'lucide-react';
import { authService } from '../../services/auth';
import RiskBadge from '../ui/RiskBadge';
import SegmentedControl from '../ui/SegmentedControl';
import Card from '../ui/Card';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';

export default function PublicAlerts({ incidents = [], onSelectIncident }) {
  const [activeTab, setActiveTab] = useState('notices'); // 'personal' | 'notices'
  const [filterLevel, setFilterLevel] = useState('ALL');
  const [copiedShareId, setCopiedShareId] = useState(null);
  const [personalHistory, setPersonalHistory] = useState([]);

  useEffect(() => {
    setPersonalHistory(authService.getHistory());
  }, []);

  // Filter personal high/medium checks
  const personalAlerts = personalHistory.filter((item) => {
    const level = (item.risk_level || '').toUpperCase();
    if (filterLevel === 'HIGH') return level === 'HIGH' || level === 'CRITICAL';
    if (filterLevel === 'MEDIUM') return level === 'MEDIUM';
    if (filterLevel === 'SAFE') return level === 'SAFE' || level === 'LOW';
    return level === 'HIGH' || level === 'CRITICAL' || level === 'MEDIUM';
  });

  // Filter backend global notices
  const globalNotices = incidents.filter((inc) => {
    const level = (inc.risk_level || inc.risk_score?.level || 'LOW').toUpperCase();
    if (filterLevel === 'HIGH') return level === 'HIGH' || level === 'CRITICAL';
    if (filterLevel === 'MEDIUM') return level === 'MEDIUM';
    if (filterLevel === 'SAFE') return level === 'SAFE' || level === 'LOW';
    return true;
  });

  const handleShare = (alertItem) => {
    const text = `⚠️ ORION Cyber Safety Notice:
Threat: ${alertItem.title}
Level: ${alertItem.risk_level || 'HIGH'}
Guidance: ${alertItem.verdict || alertItem.explanation || 'Exercise caution before opening or sharing credentials.'}`;
    navigator.clipboard.writeText(text);
    setCopiedShareId(alertItem.id);
    setTimeout(() => setCopiedShareId(null), 2500);
  };

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '10px 0 60px' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{
            fontSize: 34,
            fontWeight: 800,
            color: '#fff',
            margin: 0,
            fontFamily: 'var(--font-heading)',
            letterSpacing: '-0.02em',
          }}>
            Safety & Threat Notices
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            Verified threat advisories and personal warnings to keep you protected.
          </p>
        </div>

        {/* Tab Switcher: Personal Alerts vs Global Notices */}
        <SegmentedControl
          value={activeTab}
          onChange={setActiveTab}
          options={[
            { id: 'notices', label: 'Platform Security Notices', count: globalNotices.length },
            { id: 'personal', label: 'My Personal Alerts', count: personalAlerts.length },
          ]}
        />
      </div>

      {/* Filter Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
        background: 'var(--bg-surface)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px 18px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={14} color="var(--text-muted)" />
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Filter Severity:</span>
          {['ALL', 'HIGH', 'MEDIUM', 'SAFE'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              style={{
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                border: filterLevel === lvl ? '1px solid var(--accent-cyan)' : '1px solid transparent',
                background: filterLevel === lvl ? 'rgba(110, 231, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                color: filterLevel === lvl ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: filterLevel === lvl ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {lvl === 'HIGH' ? 'High Risk' : lvl === 'MEDIUM' ? 'Suspicious' : lvl === 'SAFE' ? 'Safe' : 'All'}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {activeTab === 'personal' ? `${personalAlerts.length} personal items` : `${globalNotices.length} active advisories`}
        </div>
      </div>

      {/* National Cyber Helpline Notice */}
      <div style={{
        background: 'rgba(255, 200, 87, 0.06)',
        border: '1px solid rgba(255, 200, 87, 0.25)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 18px',
        marginBottom: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <PhoneCall size={18} color="var(--warning)" />
          <div>
            <span style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>Citizen Safety Support Helpline: </span>
            <span style={{ color: 'var(--warning)', fontWeight: 800, fontSize: 14 }}>1930</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: 13, marginLeft: 8 }}>
              For urgent financial cyber fraud assistance (National Portal).
            </span>
          </div>
        </div>
      </div>

      {/* ACTIVE VIEW: PERSONAL ALERTS */}
      {activeTab === 'personal' && (
        <div>
          {personalAlerts.length === 0 ? (
            <Card style={{ padding: 48, textAlign: 'center' }}>
              <EmptyState
                title="No Personal Warnings"
                description="None of your recent inspections have triggered high-risk or suspicious flags."
                actionLabel="Run an Inspection"
                onAction={() => window.location.hash = '#check'}
              />
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {personalAlerts.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <RiskBadge riskLevel={item.risk_level} size="md" />
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
                        {item.title}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    {item.verdict || item.explanation}
                  </p>

                  {item.inputPreview && (
                    <div style={{
                      background: 'var(--bg-deep)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 12px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      color: 'var(--accent-cyan)',
                      overflowX: 'auto',
                    }}>
                      Target: {item.inputPreview}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={copiedShareId === item.id ? Check : Share2}
                      onClick={() => handleShare(item)}
                    >
                      {copiedShareId === item.id ? 'Copied' : 'Share Safety Notice'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ACTIVE VIEW: GLOBAL PLATFORM NOTICES */}
      {activeTab === 'notices' && (
        <div>
          {globalNotices.length === 0 ? (
            <Card style={{ padding: 48, textAlign: 'center' }}>
              <EmptyState
                title="No Active Threat Advisories"
                description="Zero platform-wide threats currently requiring citizen attention."
              />
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {globalNotices.map((inc) => (
                <div
                  key={inc.id}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '20px 24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <RiskBadge riskLevel={inc.risk_level || 'LOW'} size="md" />
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
                        {inc.title}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(inc.timestamp || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    {inc.explanation || 'Advisory generated from multi-modal evidence correlation.'}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Modality: <strong style={{ color: '#fff', textTransform: 'uppercase' }}>{inc.input_type || inc.source || 'General'}</strong>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={copiedShareId === inc.id ? Check : Share2}
                        onClick={() => handleShare(inc)}
                      >
                        {copiedShareId === inc.id ? 'Copied' : 'Share Notice'}
                      </Button>

                      {onSelectIncident && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={ArrowRight}
                          onClick={() => onSelectIncident(inc)}
                        >
                          View Advisory
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

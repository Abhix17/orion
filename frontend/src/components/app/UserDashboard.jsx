import React, { useState, useEffect } from 'react';
import {
  Shield,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Globe,
  MessageSquare,
  Image as ImageIcon,
  Mic,
  Video,
  Activity,
  Plus,
  ShieldAlert,
  Monitor,
  Check,
  Info
} from 'lucide-react';
import { authService } from '../../services/auth';
import Button from '../ui/Button';
import RiskBadge from '../ui/RiskBadge';
import Card from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import { Metric } from '../ui/Metric';

export default function UserDashboard({
  onNavigateToCheck,
  onNavigateToChecks,
  onNavigateToAlerts,
  onNavigateToBrowserShield,
  incidents = [],
}) {
  const user = authService.getUser() || { name: 'Alice Sharma' };
  const settings = authService.getSettings();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(authService.getHistory());
  }, []);

  const totalChecks = history.length;
  const highRiskCount = history.filter((c) => c.risk_level === 'HIGH' || c.risk_level === 'CRITICAL').length;
  const safeCount = history.filter((c) => c.risk_level === 'SAFE').length;

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Determine honest security posture (No fake fabricated score)
  const getSecurityPosture = () => {
    if (totalChecks === 0) {
      return {
        status: 'NEUTRAL',
        title: 'Neutral Assessment',
        description: 'No items verified in your workspace yet. Start inspecting links and messages to establish your safety radar.',
        color: '#9AA6B6',
        badge: 'UNINITIALIZED',
      };
    }
    if (highRiskCount > 0) {
      return {
        status: 'ATTENTION',
        title: 'Attention Required',
        description: `${highRiskCount} high-risk artifact${highRiskCount > 1 ? 's were' : ' was'} flagged in your recent checks. Review recommendations before proceeding.`,
        color: 'var(--danger)',
        badge: 'ACTION RECOMMENDED',
      };
    }
    return {
      status: 'PROTECTED',
      title: 'Protected',
      description: 'Zero malicious indicators observed in your recent verification audit trail. Shield active.',
      color: 'var(--success)',
      badge: 'PROTECTED',
    };
  };

  const posture = getSecurityPosture();

  const getModalityIcon = (modality) => {
    switch (modality) {
      case 'url': return Globe;
      case 'message': return MessageSquare;
      case 'image': return ImageIcon;
      case 'audio': return Mic;
      case 'video': return Video;
      case 'account': return Activity;
      default: return Shield;
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header Banner */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        background: 'var(--bg-surface)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 'var(--radius-xl)',
        padding: '36px 32px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            color: 'var(--accent-cyan)',
            fontWeight: 700,
          }}>
            <Shield size={14} /> PERSONAL WORKSPACE
          </div>
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(28px, 3.5vw, 42px)',
            fontWeight: 800,
            color: '#FFFFFF',
            margin: 0,
            letterSpacing: '-0.03em',
          }}>
            {getGreeting()}, {user.name.split(' ')[0]}.
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', margin: 0 }}>
            Stay ahead of suspicious activity. Inspect links, verify messages, and safeguard your digital footprint.
          </p>
        </div>

        <Button
          variant="glow"
          size="lg"
          onClick={onNavigateToCheck}
          icon={Search}
        >
          Check Something
        </Button>
      </div>

      {/* Security Posture Card */}
      <div style={{
        background: 'var(--bg-surface)',
        border: `1px solid ${posture.status === 'ATTENTION' ? 'rgba(255, 92, 122, 0.4)' : posture.status === 'PROTECTED' ? 'rgba(67, 230, 163, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
        borderRadius: 'var(--radius-xl)',
        padding: '24px 28px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: `${posture.color}15`,
            border: `1px solid ${posture.color}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            {posture.status === 'ATTENTION' ? (
              <AlertTriangle size={24} color={posture.color} />
            ) : posture.status === 'PROTECTED' ? (
              <CheckCircle2 size={24} color={posture.color} />
            ) : (
              <Info size={24} color={posture.color} />
            )}
          </div>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              YOUR DIGITAL SECURITY
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: '2px 0 4px', fontFamily: 'var(--font-heading)' }}>
              {posture.title}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 640 }}>
              {posture.description}
            </div>
          </div>
        </div>

        <span style={{
          padding: '4px 12px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: `${posture.color}18`,
          color: posture.color,
          border: `1px solid ${posture.color}40`,
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          fontWeight: 800,
          letterSpacing: '0.05em',
        }}>
          {posture.badge}
        </span>
      </div>

      {/* Security Overview Metrics (Strictly Honest / Unfabricated Data) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
        gap: 20,
      }}>
        <Metric
          label="Total Verified"
          value={totalChecks}
          subtext={totalChecks === 0 ? 'No verification runs yet' : 'In your audit history'}
          icon={Clock}
          accentColor="var(--accent-cyan)"
        />

        <Metric
          label="High-Risk Blocked"
          value={highRiskCount}
          subtext={highRiskCount === 0 ? 'Zero critical threats' : 'Deceptive artifacts isolated'}
          icon={AlertTriangle}
          accentColor="var(--danger)"
        />

        <Metric
          label="Cleared Safe"
          value={safeCount}
          subtext={safeCount === 0 ? 'Awaiting verification' : 'Items cleared as trustworthy'}
          icon={CheckCircle2}
          accentColor="var(--success)"
        />

        <Card style={{ padding: '22px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Browser Shield</span>
              <Monitor size={16} color="var(--accent-cyan)" />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginTop: 4 }}>
              {settings.browserShield?.enabled ? 'Active Guard' : 'Standby'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Zero-day phishing protection
            </div>
          </div>

          <button
            onClick={onNavigateToBrowserShield}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-cyan)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              padding: 0,
              textAlign: 'left',
              marginTop: 12,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span>Configure Shield</span>
            <ArrowRight size={12} />
          </button>
        </Card>
      </div>

      {/* Recent Checks Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 20, fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>
              Recent Checks
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
              Audit trail of your verified links, audio notes, and messages.
            </p>
          </div>
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onNavigateToChecks}
              icon={ArrowRight}
            >
              View all ({history.length})
            </Button>
          )}
        </div>

        {history.length === 0 ? (
          <Card style={{ padding: 48, textAlign: 'center' }}>
            <EmptyState
              title="Nothing checked yet"
              description="Run your first inspection to verify a suspicious URL, email message, deepfake audio, or login anomaly."
              actionLabel="Check something now"
              onAction={onNavigateToCheck}
            />
          </Card>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {history.slice(0, 5).map((item) => {
              const Icon = getModalityIcon(item.modality);
              return (
                <div
                  key={item.id}
                  onClick={onNavigateToChecks}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '18px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 16,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(110, 231, 255, 0.3)';
                    e.currentTarget.style.background = 'var(--bg-elevated)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.background = 'var(--bg-surface)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 42,
                      height: 42,
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}>
                      <Icon size={20} color="var(--accent-cyan)" />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
                        {item.title}
                      </div>
                      <div style={{
                        fontSize: 12,
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-muted)',
                        maxWidth: 400,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {item.inputPreview || item.verdict}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <RiskBadge riskLevel={item.risk_level} size="sm" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

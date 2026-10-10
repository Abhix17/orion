import React, { useState, useEffect } from 'react';
import {
  Clock,
  Search,
  Filter,
  Globe,
  MessageSquare,
  Image as ImageIcon,
  Mic,
  Video,
  Activity,
  Shield,
  Trash2,
  ChevronRight,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  X
} from 'lucide-react';
import { authService } from '../../services/auth';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import Modal from '../ui/Modal';
import EmptyState from '../ui/EmptyState';

export default function MyChecksView({ onNavigateToCheck }) {
  const [history, setHistory] = useState([]);
  const [modalityFilter, setModalityFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCheck, setSelectedCheck] = useState(null);

  useEffect(() => {
    setHistory(authService.getHistory());
  }, []);

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear your local check history?')) {
      authService.clearHistory();
      setHistory([]);
    }
  };

  const filteredHistory = history.filter((item) => {
    if (modalityFilter !== 'all' && item.modality !== modalityFilter) return false;
    if (riskFilter !== 'all' && (item.risk_level || '').toUpperCase() !== riskFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (item.title || '').toLowerCase().includes(q);
      const matchPreview = (item.inputPreview || '').toLowerCase().includes(q);
      const matchVerdict = (item.verdict || '').toLowerCase().includes(q);
      if (!matchTitle && !matchPreview && !matchVerdict) return false;
    }
    return true;
  });

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

  const getRiskVariant = (riskLevel) => {
    switch ((riskLevel || '').toUpperCase()) {
      case 'SAFE': return 'safe';
      case 'LOW': return 'low';
      case 'MEDIUM': return 'medium';
      case 'HIGH': return 'high';
      case 'CRITICAL': return 'critical';
      default: return 'default';
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Title & Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 32,
            fontWeight: 800,
            color: '#fff',
            margin: '0 0 6px',
            letterSpacing: '-0.02em',
          }}>
            My Checks
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
            Audit history of links, audio messages, images, and credentials verified in your workspace.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {history.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              icon={Trash2}
              onClick={handleClearHistory}
            >
              Clear History
            </Button>
          )}
          <Button
            variant="glow"
            size="sm"
            icon={Search}
            onClick={onNavigateToCheck}
          >
            New Check
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}>
        {/* Modality Filter Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {[
            { id: 'all', label: 'All Modalities' },
            { id: 'url', label: 'Links' },
            { id: 'message', label: 'Messages' },
            { id: 'image', label: 'Images' },
            { id: 'audio', label: 'Audio' },
            { id: 'video', label: 'Video' },
            { id: 'account', label: 'Account' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setModalityFilter(m.id)}
              style={{
                background: modalityFilter === m.id ? 'rgba(110, 231, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${modalityFilter === m.id ? 'var(--accent-cyan)' : 'rgba(255, 255, 255, 0.08)'}`,
                color: modalityFilter === m.id ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                borderRadius: 'var(--radius-full)',
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Risk Filter & Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            style={{
              background: 'var(--bg-deep)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              padding: '8px 12px',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <option value="all">All Risk Levels</option>
            <option value="SAFE">Safe Only</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="CRITICAL">Critical</option>
          </select>

          <input
            type="text"
            placeholder="Search checks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'var(--bg-deep)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              padding: '8px 14px',
              fontSize: 13,
              width: 180,
            }}
          />
        </div>
      </div>

      {/* History List */}
      {filteredHistory.length === 0 ? (
        <Card style={{ padding: 48, textAlign: 'center' }}>
          <EmptyState
            title={history.length === 0 ? "No checks yet" : "No matching results"}
            description={history.length === 0 ? "You haven't run any security inspections yet. Use the checker to analyze your first item." : "No verification items matched your filter criteria."}
            actionLabel="Start a Check"
            onAction={onNavigateToCheck}
          />
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredHistory.map((item) => {
            const Icon = getModalityIcon(item.modality);
            return (
              <div
                key={item.id}
                onClick={() => setSelectedCheck(item)}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '18px 22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 16,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
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
                    width: 40,
                    height: 40,
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}>
                    <Icon size={18} color="var(--accent-cyan)" />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
                      {item.title}
                    </div>
                    <div style={{
                      fontSize: 12,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-muted)',
                      maxWidth: 440,
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
                      {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <Badge variant={getRiskVariant(item.risk_level)} withDot>
                    {item.risk_level}
                  </Badge>
                  <ChevronRight size={18} color="var(--text-muted)" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Item Modal Detail */}
      {selectedCheck && (
        <Modal
          isOpen={!!selectedCheck}
          onClose={() => setSelectedCheck(null)}
          title={`Verification Inspection: ${selectedCheck.title}`}
          maxWidth={680}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Risk Header */}
            <div style={{
              background: 'var(--bg-deep)',
              borderRadius: 'var(--radius-lg)',
              padding: 20,
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 4 }}>
                  CALCULATED THREAT LEVEL
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)', color: '#fff' }}>
                  {selectedCheck.risk_level} ({(selectedCheck.risk_score * 100).toFixed(0)}%)
                </div>
              </div>
              <Badge variant={getRiskVariant(selectedCheck.risk_level)} size="lg" withDot>
                {selectedCheck.threat_type || 'INSPECTION'}
              </Badge>
            </div>

            {/* Verdict Explanation */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>
                // VERDICT SUMMARY
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: '#fff', margin: 0 }}>
                {selectedCheck.verdict}
              </p>
              {selectedCheck.explanation && (
                <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--text-secondary)', marginTop: 8 }}>
                  {selectedCheck.explanation}
                </p>
              )}
            </div>

            {/* Input inspected */}
            {selectedCheck.inputPreview && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>
                  INSPECTED TARGET
                </div>
                <div style={{
                  background: 'var(--bg-deep)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  color: 'var(--accent-cyan)',
                  wordBreak: 'break-all',
                }}>
                  {selectedCheck.inputPreview}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <Button variant="outline" size="sm" onClick={() => setSelectedCheck(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

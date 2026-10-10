import React, { useState } from 'react';
import { Search, ShieldAlert, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';


export default function ThreatIntelView() {
  const [indicator, setIndicator] = useState('secure-sbi-kyc-update.xyz');
  const [indicatorType, setIndicatorType] = useState('domain');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const sampleIOCs = [
    { label: 'Known Phish Domain', val: 'secure-sbi-kyc-update.xyz', type: 'domain' },
    { label: 'Disconnection Scam URL', val: 'http://secure-electricity-bill-disconnection.xyz/pay-urgent', type: 'url' },
    { label: 'Clean Encyclopedia', val: 'wikipedia.org', type: 'domain' },
  ];

  const handleLookup = async () => {
    if (!indicator.trim()) return;
    setErrorMsg(null);
    setLoading(true);
    try {
      const res = await api.lookupThreatIntel(indicator.trim(), indicatorType);
      setResult(res);
    } catch (err) {
      setErrorMsg(err.message || 'Threat intelligence lookup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '10px 0 40px' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
          Threat Intelligence IOC Explorer
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
          Direct query into ORION's integrated URLhaus, OpenPhish, and local threat reputation database.
        </p>
      </div>

      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: 28,
        boxShadow: 'var(--shadow-glass)',
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              value={indicator}
              onChange={(e) => setIndicator(e.target.value)}
              placeholder="Enter domain, IP, or URL to query..."
              style={{
                width: '100%',
                padding: '12px 16px 12px 40px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                fontSize: 14,
                outline: 'none',
              }}
            />
            <Search size={18} color="var(--text-dim)" style={{ position: 'absolute', left: 14, top: 14 }} />
          </div>

          <select
            value={indicatorType}
            onChange={(e) => setIndicatorType(e.target.value)}
            style={{
              padding: '12px 16px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: '#fff',
              fontSize: 13,
              outline: 'none',
            }}
          >
            <option value="domain">Domain</option>
            <option value="url">Full URL</option>
            <option value="ip">IP Address</option>
          </select>

          <button
            onClick={handleLookup}
            disabled={loading}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #00f2fe, #0284c7)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: '#000',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Querying...' : 'Lookup IOC'}
          </button>
        </div>

        {/* Quick presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Sample IOCs:</span>
          {sampleIOCs.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                setIndicator(s.val);
                setIndicatorType(s.type);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div style={{ padding: 14, background: 'rgba(255, 51, 102, 0.1)', border: '1px solid rgba(255, 51, 102, 0.3)', borderRadius: 'var(--radius-md)', color: '#ff3366', fontSize: 13, marginBottom: 20 }}>
          {errorMsg}
        </div>
      )}

      {result && (
        <div style={{
          background: 'var(--bg-card)',
          border: `1px solid ${result.is_malicious ? 'rgba(255, 51, 102, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {result.is_malicious ? (
                <ShieldAlert size={28} color="#ff3366" />
              ) : (
                <ShieldCheck size={28} color="#10b981" />
              )}
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>
                  {result.indicator}
                </h3>
                <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  Type: {result.indicator_type?.toUpperCase()}
                </span>
              </div>
            </div>

            <span style={{
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              background: result.is_malicious ? 'rgba(255, 51, 102, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: result.is_malicious ? '#ff3366' : '#10b981',
              fontWeight: 700,
              fontSize: 12,
            }}>
              {result.is_malicious ? 'CONFIRMED MALICIOUS IOC' : 'CLEAN / UNLISTED'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginTop: 16 }}>
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: 14, borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Reputation Score</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: result.is_malicious ? '#ff3366' : '#10b981' }}>
                {Math.round((result.reputation_score || 0) * 100)} / 100
              </div>
            </div>

            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: 14, borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Matched Feed</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginTop: 4 }}>
                {result.matched_feed || 'None'}
              </div>
            </div>

            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: 14, borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Confidence Level</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginTop: 4 }}>
                {result.confidence ? `${Math.round(result.confidence * 100)}%` : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

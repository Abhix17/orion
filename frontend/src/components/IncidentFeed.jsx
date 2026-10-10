import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, AlertTriangle, ShieldCheck, Search, Filter, 
  Globe, Mail, Mic, UserCheck, RefreshCw, Eye,
  Clock, Activity, AlertCircle, ChevronLeft, ChevronRight, Layers, Tag
} from 'lucide-react';
import { api } from '../services/api';

export default function IncidentFeed({ 
  viewMode = 'overview', // 'overview' or 'incidents'
  incidents = [], 
  onSelectIncident, 
  onRefresh, 
  loading = false,
  systemStatus = {}
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [threatFilter, setThreatFilter] = useState('ALL');
  const [timeRange, setTimeRange] = useState('24h');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());

  // Fetch real aggregated metrics directly from backend SQLite DB
  const loadSummary = async () => {
    try {
      const summary = await api.getDashboardSummary();
      if (summary) {
        setDashboardSummary(summary);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.warn('Dashboard summary fetch fallback:', err);
    }
  };

  useEffect(() => {
    loadSummary();
    const interval = setInterval(loadSummary, 15000);
    return () => clearInterval(interval);
  }, []);

  // Compute live KPIs from dashboardSummary or fallback to incidents prop
  const totalEvents = dashboardSummary?.total_events || incidents.length;
  const activeCount = dashboardSummary?.active_incidents ?? incidents.filter(i => !['RESOLVED', 'FALSE_POSITIVE'].includes(i.status)).length;
  const criticalCount = dashboardSummary?.critical_incidents ?? incidents.filter(i => i.risk_level === 'CRITICAL' || i.risk_score >= 0.85).length;
  const highRiskCount = dashboardSummary?.high_risk_incidents ?? incidents.filter(i => i.risk_level === 'HIGH' || (i.risk_score >= 0.70 && i.risk_score < 0.85)).length;
  const threatsDetected = dashboardSummary?.threats_detected ?? incidents.filter(i => ['SUSPICIOUS', 'MALICIOUS'].includes(i.assessment)).length;

  const riskDistribution = dashboardSummary?.risk_distribution || {
    SAFE: incidents.filter(i => i.risk_level === 'SAFE' || i.risk_score < 0.40).length,
    LOW: incidents.filter(i => i.risk_level === 'LOW').length,
    MEDIUM: incidents.filter(i => i.risk_level === 'MEDIUM' || (i.risk_score >= 0.40 && i.risk_score < 0.70)).length,
    HIGH: incidents.filter(i => i.risk_level === 'HIGH' || (i.risk_score >= 0.70 && i.risk_score < 0.85)).length,
    CRITICAL: incidents.filter(i => i.risk_level === 'CRITICAL' || i.risk_score >= 0.85).length,
  };

  const threatDistribution = dashboardSummary?.threat_distribution || {
    Phishing: incidents.filter(i => (i.threat_type || '').toLowerCase().includes('phish')).length,
    'Malicious URL': incidents.filter(i => (i.threat_type || '').toLowerCase().includes('url')).length,
    'Digital Impersonation': incidents.filter(i => (i.threat_type || '').toLowerCase().includes('impersonat')).length,
    Deepfake: incidents.filter(i => (i.threat_type || '').toLowerCase().includes('deepfake') || (i.threat_type || '').toLowerCase().includes('synthetic')).length,
    'Account Takeover': incidents.filter(i => (i.threat_type || '').toLowerCase().includes('account') || (i.threat_type || '').toLowerCase().includes('auth')).length,
    'Behavioural Anomaly': incidents.filter(i => (i.threat_type || '').toLowerCase().includes('anomaly')).length,
    Other: incidents.filter(i => !['phish', 'url', 'impersonat', 'deepfake', 'synthetic', 'account', 'auth', 'anomaly'].some(k => (i.threat_type || '').toLowerCase().includes(k))).length,
  };

  const activitySummary = dashboardSummary?.activity_summary || (
    activeCount > 0 
      ? `${activeCount} active security incident${activeCount > 1 ? 's' : ''} require analyst review.`
      : 'All evaluated security signals are currently within safe baseline parameters.'
  );

  const getModalityIcon = (source, inputType) => {
    const s = (inputType || source || '').toLowerCase();
    if (s.includes('web') || s.includes('url')) return <Globe size={15} color="#38bdf8" />;
    if (s.includes('msg') || s.includes('message') || s.includes('text')) return <Mail size={15} color="#c084fc" />;
    if (s.includes('audio') || s.includes('voice')) return <Mic size={15} color="#f43f5e" />;
    if (s.includes('auth') || s.includes('user')) return <UserCheck size={15} color="#f59e0b" />;
    return <ShieldAlert size={15} color="#00f2fe" />;
  };

  // Check if an incident is seed / demo data
  const isDemoIncident = (inc) => {
    return (
      (inc.id || '').startsWith('demo_') ||
      (inc.id || '').startsWith('sim_') ||
      inc.metadata?.is_demo === true ||
      (inc.title || '').toUpperCase().includes('DEMO')
    );
  };

  // Multi-Filter Filtering Logic
  const filteredIncidents = incidents.filter(i => {
    const matchesSearch = 
      !searchTerm ||
      (i.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.input_summary || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.threat_type || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSeverity = 
      severityFilter === 'ALL' ? true :
      severityFilter === 'CRITICAL' ? (i.risk_level === 'CRITICAL' || i.risk_score >= 0.85) :
      severityFilter === 'HIGH' ? (i.risk_level === 'HIGH' || (i.risk_score >= 0.70 && i.risk_score < 0.85)) :
      severityFilter === 'MEDIUM' ? (i.risk_level === 'MEDIUM' || (i.risk_score >= 0.40 && i.risk_score < 0.70)) :
      severityFilter === 'LOW' ? (i.risk_level === 'LOW' || (i.risk_score >= 0.15 && i.risk_score < 0.40)) :
      (i.risk_level === 'SAFE' || i.risk_score < 0.15);

    const matchesStatus = 
      statusFilter === 'ALL' ? true :
      statusFilter === 'ACTIVE' ? !['RESOLVED', 'FALSE_POSITIVE'].includes(i.status) :
      i.status === statusFilter;

    const matchesThreat = 
      threatFilter === 'ALL' ? true :
      (i.threat_type || '').toLowerCase().includes(threatFilter.toLowerCase());

    return matchesSearch && matchesSeverity && matchesStatus && matchesThreat;
  });

  // Operational priority sorting: Severity rank (CRITICAL=4, HIGH=3, MEDIUM=2, LOW=1, SAFE=0), then risk_score DESC, timestamp DESC
  const sevRank = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, SAFE: 0 };
  const sortedIncidents = [...filteredIncidents].sort((a, b) => {
    const rA = sevRank[a.risk_level] || (a.risk_score >= 0.85 ? 4 : a.risk_score >= 0.70 ? 3 : a.risk_score >= 0.40 ? 2 : 1);
    const rB = sevRank[b.risk_level] || (b.risk_score >= 0.85 ? 4 : b.risk_score >= 0.70 ? 3 : b.risk_score >= 0.40 ? 2 : 1);
    if (rA !== rB) return rB - rA;
    if (a.risk_score !== b.risk_score) return b.risk_score - a.risk_score;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  // Bounded Pagination
  const totalPages = Math.max(1, Math.ceil(sortedIncidents.length / pageSize));
  const currentPageIncidents = sortedIncidents.slice((page - 1) * pageSize, page * pageSize);

  // Needs Attention Section items
  const needsAttentionList = sortedIncidents.filter(i => 
    !['RESOLVED', 'FALSE_POSITIVE'].includes(i.status) && 
    (i.risk_score >= 0.70 || ['CRITICAL', 'HIGH'].includes(i.risk_level))
  ).slice(0, 5);

  const handleRefreshClick = async () => {
    await loadSummary();
    if (onRefresh) onRefresh();
  };

  return (
    <div style={{ maxWidth: 1600, margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* SECTION 1: TOP KPI CARDS (Step 3) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {/* Total Events */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              TOTAL EVENTS
            </span>
            <Layers size={18} color="#00f2fe" />
          </div>
          <div className="mono" style={{ fontSize: 32, fontWeight: 800, marginTop: 8, color: '#fff' }}>
            {totalEvents}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Analysis events logged in SQLite</span>
        </div>

        {/* Active Incidents */}
        <div className="glass-panel" style={{ padding: '20px', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ACTIVE INCIDENTS
            </span>
            <Activity size={18} color="#38bdf8" />
          </div>
          <div className="mono" style={{ fontSize: 32, fontWeight: 800, marginTop: 8, color: '#38bdf8' }}>
            {activeCount}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Status != RESOLVED or FALSE_POSITIVE</span>
        </div>

        {/* Critical Incidents */}
        <div className="glass-panel" style={{ padding: '20px', borderColor: 'rgba(255, 51, 102, 0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 11, color: '#ff3366', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              CRITICAL INCIDENTS
            </span>
            <AlertTriangle size={18} color="#ff3366" />
          </div>
          <div className="mono" style={{ fontSize: 32, fontWeight: 800, marginTop: 8, color: '#ff3366' }}>
            {criticalCount}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Risk score &ge; 0.85 or CRITICAL policy</span>
        </div>

        {/* High Risk Incidents */}
        <div className="glass-panel" style={{ padding: '20px', borderColor: 'rgba(249, 115, 22, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 11, color: '#f97316', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              HIGH-RISK INCIDENTS
            </span>
            <ShieldAlert size={18} color="#f97316" />
          </div>
          <div className="mono" style={{ fontSize: 32, fontWeight: 800, marginTop: 8, color: '#f97316' }}>
            {highRiskCount}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Risk score 0.70 &ndash; 0.84 or HIGH policy</span>
        </div>

        {/* Threats Detected */}
        <div className="glass-panel" style={{ padding: '20px', borderColor: 'rgba(168, 85, 247, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 11, color: '#c084fc', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              THREATS DETECTED
            </span>
            <AlertCircle size={18} color="#c084fc" />
          </div>
          <div className="mono" style={{ fontSize: 32, fontWeight: 800, marginTop: 8, color: '#c084fc' }}>
            {threatsDetected}
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Signals tagged SUSPICIOUS or MALICIOUS</span>
        </div>
      </div>

      {/* THREAT ACTIVITY NARRATIVE SUMMARY (Step 16) */}
      <div className="glass-panel" style={{ padding: '14px 20px', background: 'rgba(0, 242, 254, 0.04)', border: '1px solid rgba(0, 242, 254, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ShieldCheck size={20} color="#00f2fe" />
          <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>
            SOC Telemetry Summary: <span style={{ color: 'var(--cyan-glow)', fontWeight: 400 }}>{activitySummary}</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--text-dim)' }}>
          <Clock size={13} />
          <span>Last updated: {lastUpdated}</span>
          <button className="btn btn-outline" onClick={handleRefreshClick} disabled={loading} style={{ padding: '4px 10px', fontSize: 11 }}>
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* OVERVIEW VIEWPANEL GRID (Steps 4 & 5 & 6) */}
      {viewMode === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          
          {/* STEP 4: RISK DISTRIBUTION BAR & SEVERITY SELECTOR */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: 15, margin: '0 0 16px', color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldAlert size={16} color="#00f2fe" /> Persisted Risk Distribution
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
              {[
                { level: 'SAFE', count: riskDistribution.SAFE, color: '#10b981' },
                { level: 'LOW', count: riskDistribution.LOW, color: '#38bdf8' },
                { level: 'MEDIUM', count: riskDistribution.MEDIUM, color: '#f59e0b' },
                { level: 'HIGH', count: riskDistribution.HIGH, color: '#f97316' },
                { level: 'CRITICAL', count: riskDistribution.CRITICAL, color: '#ff3366' },
              ].map(r => (
                <div
                  key={r.level}
                  onClick={() => setSeverityFilter(severityFilter === r.level ? 'ALL' : r.level)}
                  style={{
                    padding: '14px 10px',
                    background: severityFilter === r.level ? `${r.color}22` : 'var(--bg-inset)',
                    border: `1px solid ${severityFilter === r.level ? r.color : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span style={{ fontSize: 10, color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                    {r.level}
                  </span>
                  <div className="mono" style={{ fontSize: 22, fontWeight: 800, color: r.color, marginTop: 4 }}>
                    {r.count}
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 12, margin: '12px 0 0' }}>
              Click any severity box to filter active incidents by risk level classification.
            </p>
          </div>

          {/* STEP 5: CANONICAL THREAT TAXONOMY DISTRIBUTION */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: 15, margin: '0 0 16px', color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Tag size={16} color="#c084fc" /> Threat Category Taxonomy
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
              {Object.entries(threatDistribution).map(([cat, count]) => (
                <div
                  key={cat}
                  onClick={() => setThreatFilter(threatFilter === cat ? 'ALL' : cat)}
                  style={{
                    padding: '10px 12px',
                    background: threatFilter === cat ? 'rgba(168, 85, 247, 0.15)' : 'var(--bg-inset)',
                    border: threatFilter === cat ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>{cat}</span>
                  <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: count > 0 ? '#fff' : 'var(--text-dim)' }}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* STEP 8: NEEDS ATTENTION SECTION */}
      {viewMode === 'overview' && needsAttentionList.length > 0 && (
        <div className="glass-panel" style={{ padding: '20px', borderColor: 'rgba(255, 51, 102, 0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, margin: 0, color: '#ff3366', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} /> High-Priority Incidents Requiring Analyst Attention ({needsAttentionList.length})
            </h3>
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
              Operational sort order: Severity &rarr; Risk Score &rarr; Recency
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {needsAttentionList.map(inc => {
              const riskColor = inc.risk_score >= 0.85 ? '#ff3366' : '#f97316';
              return (
                <div
                  key={inc.id}
                  onClick={() => onSelectIncident(inc)}
                  style={{
                    padding: '12px 16px',
                    background: 'var(--bg-inset)',
                    border: '1px solid rgba(255, 51, 102, 0.2)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {getModalityIcon(inc.source, inc.input_type)}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>{inc.id}</span>
                        {isDemoIncident(inc) && (
                          <span style={{ fontSize: 9, background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', padding: '1px 5px', borderRadius: 3, fontWeight: 700, border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                            DEMO DATA
                          </span>
                        )}
                        <strong style={{ color: '#fff', fontSize: 13 }}>{inc.title}</strong>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                        {inc.input_summary || 'Target evaluation payload'}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span className="badge badge-critical" style={{ fontSize: 10 }}>
                      {inc.risk_level || 'HIGH'} ({(inc.risk_score * 100).toFixed(0)}%)
                    </span>
                    <button className="btn btn-outline" style={{ fontSize: 11, padding: '4px 10px' }}>
                      <Eye size={12} /> Triage
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FILTER & CONTROL BAR (Step 9 & 10) */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 260 }}>
          <Search size={16} color="var(--text-dim)" />
          <input
            type="text"
            className="input-field"
            placeholder="Search incident ID, threat type, URL, domain, person, account..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            style={{ maxWidth: 450 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => { setSeverityFilter(e.target.value); setPage(1); }}
            className="input-field"
            style={{ width: 'auto', padding: '6px 10px', fontSize: 12 }}
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">CRITICAL Risk (&ge; 85%)</option>
            <option value="HIGH">HIGH Risk (70% - 84%)</option>
            <option value="MEDIUM">MEDIUM Risk (40% - 69%)</option>
            <option value="LOW">LOW Risk (15% - 39%)</option>
            <option value="SAFE">SAFE (&lt; 15%)</option>
          </select>

          {/* Operational Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="input-field"
            style={{ width: 'auto', padding: '6px 10px', fontSize: 12 }}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active (Unresolved)</option>
            <option value="NEW">NEW</option>
            <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
            <option value="INVESTIGATING">INVESTIGATING</option>
            <option value="CONTAINED">CONTAINED</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="FALSE_POSITIVE">FALSE_POSITIVE</option>
          </select>

          {/* Threat Taxonomy Filter */}
          <select
            value={threatFilter}
            onChange={(e) => { setThreatFilter(e.target.value); setPage(1); }}
            className="input-field"
            style={{ width: 'auto', padding: '6px 10px', fontSize: 12 }}
          >
            <option value="ALL">All Threat Types</option>
            <option value="phish">Phishing & URLs</option>
            <option value="deepfake">Deepfake & Voice</option>
            <option value="account">Account Takeover (ATO)</option>
            <option value="impersonat">Digital Impersonation</option>
            <option value="anomaly">Behavioural Anomaly</option>
          </select>

          {/* Time Range Selector */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input-field"
            style={{ width: 'auto', padding: '6px 10px', fontSize: 12 }}
          >
            <option value="1h">Last 1 Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
        </div>
      </div>

      {/* MAIN INCIDENTS TABLE FEED & PAGINATION (Steps 7, 11, 19, 20) */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)',
        }}>
          <h3 style={{ fontSize: 15, margin: 0, color: '#fff' }}>
            SOC Active Incident Stream ({sortedIncidents.length} match{sortedIncidents.length !== 1 ? 'es' : ''})
          </h3>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            Showing page {page} of {totalPages} (pageSize: {pageSize})
          </span>
        </div>

        {/* EMPTY STATE HANDLING (Step 19) */}
        {currentPageIncidents.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-dim)' }}>
            <ShieldCheck size={44} color="#10b981" style={{ margin: '0 auto 12px', display: 'block' }} />
            <h4 style={{ fontSize: 15, color: '#fff', margin: '0 0 6px' }}>No active incidents match the selected filters.</h4>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
              Adjust your search term or severity/status filters, or input a new signal in the Analyzer Studio.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {currentPageIncidents.map((inc) => {
              const riskColor = inc.risk_score >= 0.85 ? '#ff3366' : inc.risk_score >= 0.70 ? '#f97316' : inc.risk_score >= 0.40 ? '#f59e0b' : '#10b981';
              const isDemo = isDemoIncident(inc);

              return (
                <div
                  key={inc.id}
                  onClick={() => onSelectIncident(inc)}
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Left: Icon + ID + Demo Badge + Title */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--border-subtle)',
                      flexShrink: 0,
                    }}>
                      {getModalityIcon(inc.source, inc.input_type)}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                          {inc.id}
                        </span>
                        
                        {/* STEP 20: DEMO DATA LABELING */}
                        {isDemo && (
                          <span className="mono" style={{
                            fontSize: 9,
                            padding: '1px 6px',
                            borderRadius: 3,
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: '#f59e0b',
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                            fontWeight: 700,
                          }}>
                            SIMULATED INCIDENT
                          </span>
                        )}

                        <strong style={{ color: '#fff', fontSize: 13, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {inc.title}
                        </strong>
                      </div>

                      <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: 650 }}>
                        {inc.input_summary || inc.explanation?.split('\n')[0] || 'Target evaluation snippet'}
                      </p>
                    </div>
                  </div>

                  {/* Center: Threat Tag + Operational Status Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px', flexShrink: 0 }}>
                    <span className="badge badge-ai" style={{ fontSize: 10 }}>
                      {inc.threat_type?.replace(/_/g, ' ')}
                    </span>

                    <span className="mono" style={{
                      fontSize: 10,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: ['RESOLVED', 'FALSE_POSITIVE'].includes(inc.status) ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                      color: ['RESOLVED', 'FALSE_POSITIVE'].includes(inc.status) ? '#10b981' : '#38bdf8',
                      border: '1px solid var(--border-subtle)',
                      fontWeight: 700,
                    }}>
                      {inc.status}
                    </span>
                  </div>

                  {/* Right: Risk Score & Lineage Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <span className="mono" style={{ fontSize: 16, fontWeight: 800, color: riskColor, display: 'block' }}>
                        {(inc.risk_score * 100).toFixed(0)}%
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                        {inc.risk_level || inc.assessment}
                      </span>
                    </div>

                    <button
                      className="btn btn-outline"
                      style={{ padding: '6px 12px', fontSize: 11 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectIncident(inc);
                      }}
                    >
                      <Eye size={13} />
                      <span>Lineage</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* STEP 11: PAGINATION CONTROL FOOTER */}
        {totalPages > 1 && (
          <div style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.2)',
          }}>
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>
              Page {page} of {totalPages} ({sortedIncidents.length} total incidents)
            </span>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-outline"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                style={{ padding: '4px 10px', fontSize: 11 }}
              >
                <ChevronLeft size={14} /> Previous
              </button>

              <button
                className="btn btn-outline"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                style={{ padding: '4px 10px', fontSize: 11 }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

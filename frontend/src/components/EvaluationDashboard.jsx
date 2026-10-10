import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Play, RefreshCw, CheckCircle2, AlertTriangle, 
  XCircle, Clock, Database, Layers, ShieldCheck, Info,
  TrendingUp, AlertCircle, Shield, Activity
} from 'lucide-react';
import { api } from '../services/api';

// ---------------------------------------------------------------------------
// Honest Metric Component — always shows sample count + NOT_MEASURED state
// ---------------------------------------------------------------------------
function HonestMetricCard({ label, metric, format = 'percent', className = '' }) {
  const isNotMeasured = !metric || metric.status !== 'MEASURED' || metric.value === null;
  const statusColor = {
    MEASURED: '#10b981',
    NOT_MEASURED: '#6b7280',
    UNAVAILABLE: '#f59e0b',
    INSUFFICIENT_GROUND_TRUTH: '#f59e0b',
  };
  const color = statusColor[metric?.status] || '#6b7280';

  const formatValue = (v) => {
    if (v === null || v === undefined) return null;
    if (format === 'percent') return `${(v * 100).toFixed(1)}%`;
    if (format === 'decimal') return v.toFixed(3);
    return v;
  };

  return (
    <div className={`glass-panel ${className}`} style={{ padding: 20 }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', display: 'block' }}>
        {label}
      </span>
      {isNotMeasured ? (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#6b7280' }}>NOT MEASURED</div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>
            {metric?.status?.replace(/_/g, ' ') || 'No data'}: {metric?.warning || 'insufficient ground truth'}
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 6 }}>
          <div className="mono" style={{ fontSize: 28, fontWeight: 800, color }}>
            {formatValue(metric.value)}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>
            n = {metric.sample_count}
            {metric.warning && (
              <span style={{ color: '#f59e0b', marginLeft: 6 }}>⚠ {metric.warning}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
function StatusBadge({ status }) {
  const colors = {
    MEASURED: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
    NOT_MEASURED: { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af' },
    UNAVAILABLE: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
    INSUFFICIENT_GROUND_TRUTH: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
    AVAILABLE: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
    NOT_TESTED: { bg: 'rgba(107,114,128,0.15)', color: '#9ca3af' },
  };
  const style = colors[status] || colors.NOT_MEASURED;
  return (
    <span style={{
      padding: '2px 8px',
      borderRadius: 4,
      fontSize: 10,
      fontWeight: 700,
      background: style.bg,
      color: style.color,
    }}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function EvaluationDashboard() {
  const [evalData, setEvalData] = useState(null);
  const [gtMetadata, setGtMetadata] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [scenarioMatrix, setScenarioMatrix] = useState(null);
  const [detectionMetrics, setDetectionMetrics] = useState(null);
  const [latencyData, setLatencyData] = useState(null);
  const [providerData, setProviderData] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [latest, meta] = await Promise.all([
        api.getLatestEvaluation(),
        api.getGroundTruthMetadata(),
      ]);
      setEvalData(latest);
      setGtMetadata(meta);
      // Fetch Phase 7 extended endpoints
      await fetchPhase7Data();
    } catch (err) {
      console.error('Failed to load evaluation data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPhase7Data = async () => {
    try {
      const [summary, scenarios, metrics, latency, providers, risk] = await Promise.all([
        fetch('/api/v1/evaluation/summary').then(r => r.ok ? r.json() : null),
        fetch('/api/v1/evaluation/scenarios').then(r => r.ok ? r.json() : null),
        fetch('/api/v1/evaluation/metrics').then(r => r.ok ? r.json() : null),
        fetch('/api/v1/evaluation/latency').then(r => r.ok ? r.json() : null),
        fetch('/api/v1/evaluation/providers').then(r => r.ok ? r.json() : null),
        fetch('/api/v1/evaluation/risk').then(r => r.ok ? r.json() : null),
      ]);
      setSummaryData(summary);
      setScenarioMatrix(scenarios);
      setDetectionMetrics(metrics);
      setLatencyData(latency);
      setProviderData(providers);
      setRiskData(risk);
    } catch (err) {
      console.error('Failed to load Phase 7 data:', err);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleRunBenchmark = async (modality = null) => {
    setRunning(true);
    try {
      const res = await api.runEvaluation({ modality });
      setEvalData(res);
      await fetchPhase7Data();
    } catch (err) {
      alert(`Benchmark run failed: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  const overall = evalData?.overall_metrics;
  const cm = overall?.confusion_matrix;
  const overallDm = detectionMetrics?.overall;

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'detection', label: 'Detection Metrics' },
    { id: 'scenarios', label: 'Scenario Matrix' },
    { id: 'risk', label: 'Risk Evaluation' },
    { id: 'latency', label: 'Latency' },
    { id: 'providers', label: 'Providers' },
    { id: 'samples', label: 'Sample Audit' },
    { id: 'provenance', label: 'Provenance' },
  ];

  return (
    <div style={{ maxWidth: 1600, margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 22, margin: '0 0 6px' }}>ORION v2 — Phase 7 Evaluation Framework</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            Rigorous, reproducible, honest evaluation — all metrics labeled MEASURED / NOT MEASURED / UNAVAILABLE
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" onClick={fetchAll} disabled={loading || running}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary" onClick={() => handleRunBenchmark(null)} disabled={running} style={{ padding: '10px 20px' }}>
            <Play size={15} />
            <span>{running ? 'Running...' : 'Run Full Benchmark'}</span>
          </button>
        </div>
      </div>

      {/* Synthetic Data Disclaimer */}
      <div style={{
        padding: '12px 16px',
        background: 'rgba(245,158,11,0.08)',
        border: '1px solid rgba(245,158,11,0.3)',
        borderRadius: 8,
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
        fontSize: 12,
      }}>
        <AlertCircle size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <strong style={{ color: '#f59e0b' }}>Evaluation Integrity Notice:</strong>{' '}
          <span style={{ color: 'var(--text-muted)' }}>
            All metrics are measured against <strong>SYNTHETIC ground truth only</strong> —
            hand-crafted fixtures representing canonical attack patterns.
            This is not a real-world benchmark. Results may not generalize to production data.
            Scenarios without ground truth are explicitly labeled <strong>NOT MEASURED</strong>.
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 0 }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              background: activeTab === tab.id ? 'rgba(56,189,248,0.1)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #38bdf8' : '2px solid transparent',
              color: activeTab === tab.id ? '#38bdf8' : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW TAB ===== */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Run metadata */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            {[
              { label: 'Total Samples', value: evalData?.total_samples ?? '--', color: '#38bdf8' },
              { label: 'Duration', value: evalData ? `${evalData.duration_seconds}s` : '--', color: '#f59e0b' },
              { label: 'Run ID', value: evalData?.run_id?.slice(0, 14) ?? '--', color: '#c084fc' },
              { label: 'Dataset Version', value: evalData?.dataset_version ?? '--', color: '#10b981' },
              { label: 'Risk Policy', value: evalData?.risk_policy_version ?? '--', color: '#10b981' },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass-panel" style={{ padding: 16 }}>
                <span style={{ fontSize: 10, color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase' }}>{label}</span>
                <span className="mono" style={{ fontSize: 15, fontWeight: 700, color }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Honest detection metrics */}
          <h3 style={{ fontSize: 14, margin: 0, color: 'var(--text-muted)' }}>Detection Metrics — Overall (n = {overallDm?.sample_count ?? '?'})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
            <HonestMetricCard label="Precision" metric={overallDm?.precision} />
            <HonestMetricCard label="Recall (Sensitivity)" metric={overallDm?.recall} />
            <HonestMetricCard label="F1 Score" metric={overallDm?.f1_score} format="decimal" />
            <HonestMetricCard label="False Positive Rate" metric={overallDm?.false_positive_rate} />
            <HonestMetricCard label="False Negative Rate" metric={overallDm?.false_negative_rate} />
            <HonestMetricCard label="Accuracy" metric={overallDm?.accuracy} />
          </div>

          {/* Confusion Matrix */}
          <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20 }}>
            <div className="glass-panel" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={15} color="#00f2fe" /> Confusion Matrix
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'True Positives (TP)', val: cm?.true_positives ?? 0, color: '#10b981', desc: 'Threat correctly caught' },
                  { label: 'False Positives (FP)', val: cm?.false_positives ?? 0, color: '#ff3366', desc: 'Benign flagged as threat' },
                  { label: 'False Negatives (FN)', val: cm?.false_negatives ?? 0, color: '#f59e0b', desc: 'Threat missed' },
                  { label: 'True Negatives (TN)', val: cm?.true_negatives ?? 0, color: '#38bdf8', desc: 'Safe correctly verified' },
                ].map(({ label, val, color, desc }) => (
                  <div key={label} style={{
                    background: `${color}18`, border: `1px solid ${color}44`,
                    padding: 12, borderRadius: 8, textAlign: 'center',
                  }}>
                    <span style={{ fontSize: 10, color, fontWeight: 700, display: 'block' }}>{label}</span>
                    <span className="mono" style={{ fontSize: 26, fontWeight: 800 }}>{val}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-dim)', display: 'block' }}>{desc}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12, fontSize: 10, color: 'var(--text-dim)', textAlign: 'center' }}>
                n = {overall?.total_samples ?? 0} · Run: <span className="mono">{evalData?.run_id?.slice(5) || '--'}</span>
              </div>
            </div>

            {/* Per-modality table */}
            <div className="glass-panel" style={{ padding: 20, overflowX: 'auto' }}>
              <h3 style={{ fontSize: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart3 size={15} color="#38bdf8" /> Per-Modality Breakdown
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
                    {['Modality', 'n', 'Precision', 'Recall', 'F1', 'FPR', 'Avg Latency'].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {evalData?.per_modality_metrics && Object.entries(evalData.per_modality_metrics).map(([mod, m]) => (
                    <tr key={mod} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '10px', fontWeight: 700, color: '#fff', textTransform: 'uppercase', fontSize: 11 }}>{mod}</td>
                      <td className="mono" style={{ padding: '10px', color: 'var(--text-muted)' }}>{m.total_samples}</td>
                      <td className="mono" style={{ padding: '10px' }}>{(m.precision * 100).toFixed(1)}%</td>
                      <td className="mono" style={{ padding: '10px' }}>{(m.recall * 100).toFixed(1)}%</td>
                      <td className="mono" style={{ padding: '10px', color: '#c084fc' }}>{m.f1_score.toFixed(3)}</td>
                      <td className="mono" style={{ padding: '10px', color: m.false_positive_rate > 0.1 ? '#ff3366' : '#10b981' }}>
                        {(m.false_positive_rate * 100).toFixed(1)}%
                      </td>
                      <td className="mono" style={{ padding: '10px', color: '#f59e0b' }}>{m.avg_latency_ms} ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===== DETECTION METRICS TAB ===== */}
      {activeTab === 'detection' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: 0 }}>
            Phase 7 honest metrics. Definitions: Precision = TP/(TP+FP) · Recall = TP/(TP+FN) · 
            F1 = 2PR/(P+R) · FPR = FP/(FP+TN). Zero denominators → NOT MEASURED, not fabricated.
          </p>
          {detectionMetrics && Object.entries(detectionMetrics).map(([mod, dm]) => (
            <div key={mod} className="glass-panel" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, margin: 0, textTransform: 'uppercase' }}>{mod}</h3>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>n = {dm.sample_count}</span>
                  {dm.small_sample_warning && (
                    <span style={{ fontSize: 10, color: '#f59e0b', padding: '2px 8px', background: 'rgba(245,158,11,0.1)', borderRadius: 4 }}>
                      ⚠ {dm.small_sample_warning}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
                <HonestMetricCard label="Precision" metric={dm.precision} />
                <HonestMetricCard label="Recall" metric={dm.recall} />
                <HonestMetricCard label="F1 Score" metric={dm.f1_score} format="decimal" />
                <HonestMetricCard label="FPR" metric={dm.false_positive_rate} />
                <HonestMetricCard label="FNR" metric={dm.false_negative_rate} />
                <HonestMetricCard label="Accuracy" metric={dm.accuracy} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== SCENARIO MATRIX TAB ===== */}
      {activeTab === 'scenarios' && (
        <div className="glass-panel" style={{ padding: 20, overflowX: 'auto' }}>
          <h3 style={{ fontSize: 14, marginBottom: 4 }}>Scenario Evaluation Matrix</h3>
          <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 14 }}>
            Scenarios with insufficient ground truth are explicitly marked NOT MEASURED.
            No values are fabricated.
          </p>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
                {['Scenario', 'Modality', 'Total n', 'Valid', 'Detection', 'Classification', 'Risk', 'Notes'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(scenarioMatrix || []).map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '10px', fontWeight: 600, color: '#fff' }}>{row.scenario}</td>
                  <td style={{ padding: '10px', color: 'var(--text-muted)', fontSize: 11 }}>{row.modality}</td>
                  <td className="mono" style={{ padding: '10px' }}>{row.total_samples}</td>
                  <td className="mono" style={{ padding: '10px' }}>{row.valid_samples}</td>
                  <td style={{ padding: '10px' }}><StatusBadge status={row.detection_status} /></td>
                  <td style={{ padding: '10px' }}><StatusBadge status={row.classification_status} /></td>
                  <td style={{ padding: '10px' }}><StatusBadge status={row.risk_status} /></td>
                  <td style={{ padding: '10px', color: 'var(--text-dim)', fontSize: 11 }}>{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== RISK EVALUATION TAB ===== */}
      {activeTab === 'risk' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="glass-panel" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, marginBottom: 14 }}>Risk Band Evaluation — Expected vs Observed</h3>
            {riskData && riskData.measured_sample_count > 0 ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
                  <HonestMetricCard label="Exact Match Rate" metric={riskData.exact_match_rate} />
                  <div className="glass-panel" style={{ padding: 16 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>Exact Matches</span>
                    <span className="mono" style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>{riskData.exact_match_count}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>n = {riskData.measured_sample_count}</span>
                  </div>
                  <div className="glass-panel" style={{ padding: 16 }}>
                    <span style={{ fontSize: 11, color: '#f59e0b', textTransform: 'uppercase', display: 'block' }}>Over-Classified</span>
                    <span className="mono" style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b' }}>{riskData.over_classified_count}</span>
                  </div>
                  <div className="glass-panel" style={{ padding: 16 }}>
                    <span style={{ fontSize: 11, color: '#ff3366', textTransform: 'uppercase', display: 'block' }}>Under-Classified</span>
                    <span className="mono" style={{ fontSize: 24, fontWeight: 800, color: '#ff3366' }}>{riskData.under_classified_count}</span>
                  </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
                      {['Sample ID', 'Expected Risk', 'Observed Risk', 'Match', 'Direction'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(riskData.results || []).map((r, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td className="mono" style={{ padding: '8px 10px', fontSize: 11 }}>{r.sample_id}</td>
                        <td style={{ padding: '8px 10px' }}><StatusBadge status={r.expected_risk_level} /></td>
                        <td style={{ padding: '8px 10px' }}><StatusBadge status={r.observed_risk_level} /></td>
                        <td style={{ padding: '8px 10px', color: r.match ? '#10b981' : '#ff3366', fontWeight: 700 }}>
                          {r.match ? '✓ MATCH' : '✗ MISMATCH'}
                        </td>
                        <td style={{ padding: '8px 10px', fontSize: 11, color: 'var(--text-muted)' }}>{r.direction}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <div style={{ color: 'var(--text-dim)', fontSize: 13, textAlign: 'center', padding: 30 }}>
                <Info size={20} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.5 }} />
                Run the benchmark suite to see risk band evaluation results.
                <div style={{ fontSize: 11, marginTop: 8, color: '#6b7280' }}>
                  Status: {riskData?.exact_match_rate?.status || 'NOT_MEASURED'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== LATENCY TAB ===== */}
      {activeTab === 'latency' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 12, color: 'var(--text-dim)', margin: 0 }}>
            Actual execution latencies measured during evaluation runs.
            P95 requires ≥ 2 samples. Single-execution results are labeled accordingly.
            Cold vs warm inference is NOT distinguished in this evaluation.
          </p>
          {(latencyData || []).map((stat, i) => (
            <div key={i} className="glass-panel" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ fontSize: 14, margin: 0, textTransform: 'uppercase' }}>{stat.modality}</h3>
                <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>n = {stat.sample_count}</span>
              </div>
              {stat.sample_count > 0 ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
                    {[
                      { label: 'Mean', value: stat.mean_ms },
                      { label: 'Median', value: stat.median_ms },
                      { label: 'P95', value: stat.p95_ms },
                      { label: 'Min', value: stat.min_ms },
                      { label: 'Max', value: stat.max_ms },
                    ].map(({ label, value }) => (
                      <div key={label} className="glass-panel" style={{ padding: 12, textAlign: 'center' }}>
                        <span style={{ fontSize: 10, color: 'var(--text-dim)', display: 'block', textTransform: 'uppercase' }}>{label}</span>
                        <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: '#f59e0b' }}>
                          {value !== null && value !== undefined ? `${value} ms` : 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>
                  {stat.note && (
                    <div style={{ marginTop: 10, fontSize: 11, color: '#f59e0b' }}>⚠ {stat.note}</div>
                  )}
                  <div style={{ marginTop: 8, fontSize: 11, color: '#6b7280' }}>
                    Cold/warm distinction: {stat.warm_vs_cold}
                  </div>
                </>
              ) : (
                <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>No samples measured</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ===== PROVIDERS TAB ===== */}
      {activeTab === 'providers' && (
        <div className="glass-panel" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, margin: 0 }}>Provider Availability Evaluation</h3>
            {providerData?.unavailable_not_safe_verified && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#10b981' }}>
                <ShieldCheck size={14} />
                UNAVAILABLE ≠ SAFE verified
              </div>
            )}
          </div>
          {providerData?.disclaimer && (
            <div style={{ padding: '10px 14px', background: 'rgba(56,189,248,0.05)', borderRadius: 6, fontSize: 11, color: 'var(--text-dim)', marginBottom: 14 }}>
              {providerData.disclaimer}
            </div>
          )}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
                {['Provider', 'Modality', 'Availability', 'Safe when unavailable?', 'Notes'].map(h => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(providerData?.providers || []).map((p, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '10px', fontWeight: 600, color: '#fff' }}>{p.provider_name}</td>
                  <td style={{ padding: '10px', color: 'var(--text-muted)', fontSize: 11 }}>{p.modality}</td>
                  <td style={{ padding: '10px' }}><StatusBadge status={p.availability} /></td>
                  <td style={{ padding: '10px', color: p.unavailable_causes_safe ? '#ff3366' : '#10b981', fontWeight: 700, fontSize: 11 }}>
                    {p.unavailable_causes_safe ? '⚠ YES — RISK' : '✓ NO — SAFE'}
                  </td>
                  <td style={{ padding: '10px', color: 'var(--text-dim)', fontSize: 11 }}>{p.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== SAMPLE AUDIT TAB ===== */}
      {activeTab === 'samples' && (
        <div className="glass-panel" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, marginBottom: 14 }}>
            Sample-by-Sample Evaluation Audit ({evalData?.sample_results?.length || 0} items)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 500, overflowY: 'auto' }}>
            {evalData?.sample_results?.map((s) => (
              <div key={s.sample_id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', background: 'var(--bg-inset)',
                borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', fontSize: 12,
                borderLeft: `3px solid ${s.is_correct ? '#10b981' : '#ff3366'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                  {s.is_correct
                    ? <CheckCircle2 size={14} color="#10b981" />
                    : <AlertTriangle size={14} color="#ff3366" />
                  }
                  <span className="mono" style={{ color: 'var(--text-dim)', fontSize: 10 }}>{s.sample_id}</span>
                  <span className="badge badge-ai" style={{ fontSize: 9 }}>{s.modality}</span>
                  {s.scenario && <span style={{ fontSize: 9, color: '#c084fc', padding: '1px 6px', background: 'rgba(192,132,252,0.1)', borderRadius: 3 }}>{s.scenario}</span>}
                  <span style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>
                    {s.description}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-dim)', display: 'block' }}>Expected</span>
                    <strong style={{ color: s.ground_truth_assessment === 'MALICIOUS' ? '#ff3366' : '#10b981', fontSize: 11 }}>
                      {s.ground_truth_assessment}
                    </strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 10, color: 'var(--text-dim)', display: 'block' }}>Observed</span>
                    <strong style={{ color: s.predicted_assessment === 'MALICIOUS' ? '#ff3366' : '#10b981', fontSize: 11 }}>
                      {s.predicted_assessment} ({(s.predicted_risk_score * 100).toFixed(0)}%)
                    </strong>
                  </div>
                  {s.risk_band_match !== undefined && s.risk_band_match !== null && (
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 10, color: 'var(--text-dim)', display: 'block' }}>Risk Band</span>
                      <span style={{ fontSize: 11, color: s.risk_band_match ? '#10b981' : '#ff3366' }}>
                        {s.expected_risk_level} → {s.predicted_risk_level}
                      </span>
                    </div>
                  )}
                  <span className="mono" style={{ fontSize: 11, color: '#f59e0b', width: 60, textAlign: 'right' }}>
                    {s.latency_ms} ms
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== PROVENANCE TAB ===== */}
      {activeTab === 'provenance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="glass-panel" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Database size={15} color="#38bdf8" /> Dataset Provenance
            </h3>
            {evalData?.provenance ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {[
                  ['Dataset Name', evalData.provenance.name],
                  ['Source', evalData.provenance.source],
                  ['Type', evalData.provenance.dataset_type],
                  ['Version', evalData.provenance.version],
                  ['Generation Date', evalData.provenance.generation_date],
                  ['Sample Count', evalData.provenance.sample_count],
                  ['License', evalData.provenance.license],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block' }}>{label}</span>
                    <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{value || '—'}</span>
                  </div>
                ))}
              </div>
            ) : <div style={{ color: 'var(--text-dim)' }}>No provenance data. Run a benchmark first.</div>}
            {evalData?.provenance?.note && (
              <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(245,158,11,0.08)', borderRadius: 6, fontSize: 12, color: '#f59e0b' }}>
                <strong>Important:</strong> {evalData.provenance.note}
              </div>
            )}
          </div>
          <div className="glass-panel" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, marginBottom: 14 }}>Ground Truth Summary</h3>
            {gtMetadata ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
                  <div><span style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block' }}>Total Samples</span><span className="mono" style={{ fontSize: 20, fontWeight: 700, color: '#38bdf8' }}>{gtMetadata.total_samples}</span></div>
                  <div><span style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block' }}>With Risk Level</span><span className="mono" style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>{gtMetadata.samples_with_expected_risk_level}</span></div>
                  <div><span style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block' }}>With Response Class</span><span className="mono" style={{ fontSize: 20, fontWeight: 700, color: '#10b981' }}>{gtMetadata.samples_with_expected_response_class}</span></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 8 }}>By Modality</span>
                    {Object.entries(gtMetadata.modality_breakdown || {}).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0' }}>
                        <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase' }}>{k}</span>
                        <span className="mono" style={{ color: '#fff' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 8 }}>By Label</span>
                    {Object.entries(gtMetadata.label_breakdown || {}).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0' }}>
                        <span style={{ color: k === 'MALICIOUS' ? '#ff3366' : '#10b981' }}>{k}</span>
                        <span className="mono" style={{ color: '#fff' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {gtMetadata.provenance_note && (
                  <div style={{ marginTop: 16, fontSize: 11, color: '#6b7280', borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
                    {gtMetadata.provenance_note}
                  </div>
                )}
              </>
            ) : <div style={{ color: 'var(--text-dim)' }}>Loading...</div>}
          </div>
        </div>
      )}
    </div>
  );
}

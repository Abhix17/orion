import React, { useState, useEffect } from 'react';
import { Shield, Radio, Layers, Sparkles, Lock, Cpu, Activity } from 'lucide-react';

export default function AnalysisProgress({ contentType = 'content' }) {
  const [activeStageIdx, setActiveStageIdx] = useState(0);

  const stages = [
    { text: 'Extracting digital indicators and structural parameters', detail: 'Parsing format, headers, entropy & telemetry' },
    { text: 'Evaluating neural feature representations', detail: 'Querying deep-learning and behavioral classifiers' },
    { text: 'Correlating cross-modal intelligence signals', detail: 'Comparing against known abuse heuristics & indicators' },
    { text: 'Synthesizing explainable risk assessment', detail: 'Formulating human-readable threat verdict and advice' },
  ];

  const nodePhases = [
    { label: 'INPUT', icon: Radio, color: '#38bdf8' },
    { label: 'SIGNALS', icon: Layers, color: '#c084fc' },
    { label: 'EVIDENCE', icon: Sparkles, color: '#f59e0b' },
    { label: 'RISK', icon: Lock, color: '#ec4899' },
    { label: 'RESULT', icon: Cpu, color: '#10b981' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStageIdx((prev) => (prev + 1) % stages.length);
    }, 1200);
    return () => clearInterval(timer);
  }, [stages.length]);

  return (
    <div style={{
      maxWidth: 620,
      margin: '40px auto 60px',
      textAlign: 'center',
      padding: 'clamp(28px, 5vw, 48px) clamp(20px, 4vw, 40px)',
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius-lg)',
      border: '1px solid var(--border-glow)',
      boxShadow: 'var(--shadow-glow)',
      animation: 'fadeIn 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background Radial Glow */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 300,
        height: 300,
        background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, transparent 70%)',
        filter: 'blur(35px)',
        pointerEvents: 'none',
      }} />

      {/* Central Intelligence Animated Radar Ring */}
      <div style={{
        position: 'relative',
        width: 90,
        height: 90,
        margin: '0 auto 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '3px solid rgba(56, 189, 248, 0.15)',
          borderTopColor: 'var(--cyan-glow)',
          borderRightColor: 'rgba(168, 85, 247, 0.7)',
          animation: 'spin 1.2s linear infinite',
        }} />
        <div style={{
          position: 'absolute',
          inset: 6,
          borderRadius: '50%',
          border: '2px dashed rgba(168, 85, 247, 0.35)',
          borderBottomColor: 'var(--cyan-glow)',
          animation: 'spin 2.5s linear infinite reverse',
        }} />
        <div style={{
          width: 66,
          height: 66,
          borderRadius: '50%',
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid var(--border-glow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-glow)',
        }}>
          <Shield size={32} color="#38bdf8" />
        </div>
      </div>

      <h2 style={{ fontSize: 'clamp(22px, 4vw, 26px)', fontWeight: 800, color: '#fff', marginBottom: 6, letterSpacing: '-0.02em' }}>
        ORION is analyzing...
      </h2>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 32 }}>
        Correlating {contentType} telemetry through ORION's multi-engine neural and forensic security models.
      </p>

      {/* Abstract Connected Pipeline (Continuous Laser Sweep) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        marginBottom: 36,
        padding: '0 10px',
      }}>
        {/* Track Line */}
        <div style={{
          position: 'absolute',
          top: 18,
          left: 40,
          right: 40,
          height: 2,
          background: 'rgba(255, 255, 255, 0.08)',
          zIndex: 1,
        }} />

        {/* Continuous Active Pulse Line */}
        <div style={{
          position: 'absolute',
          top: 18,
          left: 40,
          right: 40,
          height: 2,
          background: 'linear-gradient(90deg, #38bdf8, #a855f7, #10b981)',
          opacity: 0.85,
          boxShadow: '0 0 10px rgba(56, 189, 248, 0.6)',
          zIndex: 1,
        }} />

        {nodePhases.map((phase, idx) => {
          const Icon = phase.icon;
          const isPulseTarget = activeStageIdx === idx;

          return (
            <div key={idx} style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: '#0f172a',
                border: `2px solid ${isPulseTarget ? phase.color : 'rgba(255, 255, 255, 0.15)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isPulseTarget ? `0 0 18px ${phase.color}` : 'none',
                transform: isPulseTarget ? 'scale(1.12)' : 'scale(1)',
                transition: 'all 0.35s ease',
              }}>
                <Icon size={16} color={isPulseTarget ? phase.color : '#94a3b8'} />
              </div>
              <span style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.06em',
                color: isPulseTarget ? phase.color : 'var(--text-dim)',
                transition: 'color 0.35s ease',
              }}>
                {phase.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Abstract Live Telemetry Indicator Feed */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        textAlign: 'left',
        background: 'rgba(9, 13, 22, 0.85)',
        padding: '20px 22px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
      }}>
        {stages.map((stage, idx) => {
          const isActive = activeStageIdx === idx;
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontSize: 13,
                color: isActive ? '#fff' : 'var(--text-dim)',
                padding: '6px 8px',
                borderRadius: 'var(--radius-sm)',
                background: isActive ? 'rgba(56, 189, 248, 0.08)' : 'transparent',
                border: isActive ? '1px solid rgba(56, 189, 248, 0.2)' : '1px solid transparent',
                transition: 'all 0.3s ease',
              }}
            >
              <div style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: isActive ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${isActive ? 'var(--cyan-glow)' : 'var(--border-subtle)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 700,
                color: isActive ? 'var(--cyan-glow)' : 'var(--text-dim)',
                flexShrink: 0,
              }}>
                {isActive ? <Activity size={12} className="animate-spin" /> : <Cpu size={11} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: isActive ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {stage.text}
                </div>
                {isActive && (
                  <div style={{ fontSize: 11, color: 'var(--cyan-glow)', marginTop: 2 }}>
                    {stage.detail}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

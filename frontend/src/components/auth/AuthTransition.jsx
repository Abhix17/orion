import React, { useEffect, useState } from 'react';
import { Shield, CheckCircle2, Sparkles, Lock } from 'lucide-react';
import OrbitalCore3D from '../3d/OrbitalCore3D';

export default function AuthTransition({ user, onComplete }) {
  const [step, setStep] = useState(1); // 1: ORION CORE, 2: AUTH VERIFIED, 3: WORKSPACE OPENS

  useEffect(() => {
    const t1 = setTimeout(() => setStep(2), 650);
    const t2 = setTimeout(() => setStep(3), 1300);
    const t3 = setTimeout(() => {
      if (onComplete) onComplete();
    }, 1900);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--bg-deep)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      {/* 3D Core with pulsing scale */}
      <div style={{
        width: 320,
        height: 320,
        position: 'relative',
        transition: 'transform 0.5s ease',
        transform: step === 3 ? 'scale(1.15)' : 'scale(1)',
      }}>
        <OrbitalCore3D />
      </div>

      <div style={{
        textAlign: 'center',
        marginTop: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
      }}>
        {step === 1 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-cyan)',
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(110, 231, 255, 0.1)',
              border: '1px solid rgba(110, 231, 255, 0.3)',
            }}>
              <Lock size={14} /> CONNECTING TO ORION CORE
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28,
              fontWeight: 800,
              color: '#fff',
              marginTop: 12,
              letterSpacing: '-0.02em',
            }}>
              Establishing Secure Tunnel...
            </h2>
          </div>
        )}

        {step === 2 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              fontFamily: 'var(--font-mono)',
              color: 'var(--success)',
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(67, 230, 163, 0.1)',
              border: '1px solid rgba(67, 230, 163, 0.3)',
            }}>
              <CheckCircle2 size={14} /> AUTHENTICATION VERIFIED
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28,
              fontWeight: 800,
              color: '#fff',
              marginTop: 12,
              letterSpacing: '-0.02em',
            }}>
              Identity Confirmed: {user?.name || 'Citizen'}
            </h2>
          </div>
        )}

        {step === 3 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-violet)',
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(139, 124, 255, 0.1)',
              border: '1px solid rgba(139, 124, 255, 0.3)',
            }}>
              <Sparkles size={14} /> PERSONAL WORKSPACE READY
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28,
              fontWeight: 800,
              color: '#fff',
              marginTop: 12,
              letterSpacing: '-0.02em',
            }}>
              Opening Your Dashboard...
            </h2>
          </div>
        )}

        {/* Progress Dots */}
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <span style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: step >= 1 ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.2)',
            boxShadow: step >= 1 ? '0 0 10px var(--accent-cyan)' : 'none',
            transition: 'all 0.3s',
          }} />
          <span style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: step >= 2 ? 'var(--success)' : 'rgba(255,255,255,0.2)',
            boxShadow: step >= 2 ? '0 0 10px var(--success)' : 'none',
            transition: 'all 0.3s',
          }} />
          <span style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: step >= 3 ? 'var(--accent-violet)' : 'rgba(255,255,255,0.2)',
            boxShadow: step >= 3 ? '0 0 10px var(--accent-violet)' : 'none',
            transition: 'all 0.3s',
          }} />
        </div>
      </div>
    </div>
  );
}

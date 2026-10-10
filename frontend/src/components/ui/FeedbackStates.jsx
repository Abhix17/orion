import React from 'react';
import { AlertCircle, RefreshCw, Cpu } from 'lucide-react';
import Button from './Button';

export function LoadingState({
  title = 'Analyzing submission...',
  description = 'Inspecting structural and neural security signals.',
  stage = null, // e.g. 'SIGNALS' | 'EVIDENCE' | 'RISK'
  style = {},
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        ...style,
      }}
    >
      <div
        style={{
          width: 54,
          height: 54,
          borderRadius: '50%',
          border: '2px solid rgba(110, 231, 255, 0.2)',
          borderTopColor: 'var(--accent-cyan)',
          animation: 'spin 1s linear infinite',
          marginBottom: 20,
        }}
      />
      <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 440, lineHeight: 1.5 }}>
        {description}
      </div>
      {stage && (
        <div
          style={{
            marginTop: 16,
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: 'var(--accent-cyan)',
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(110, 231, 255, 0.1)',
            border: '1px solid rgba(110, 231, 255, 0.25)',
          }}
        >
          CURRENT STAGE: {stage}
        </div>
      )}
    </div>
  );
}

export function ErrorState({
  title = 'Inspection Unavailable',
  description = 'Could not reach ORION analysis service or request timed out.',
  onRetry = null,
  style = {},
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        textAlign: 'center',
        ...style,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 92, 122, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(255, 92, 122, 0.3)',
          marginBottom: 16,
        }}
      >
        <AlertCircle size={24} color="var(--danger)" />
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 460, lineHeight: 1.5, marginBottom: 20 }}>
        {description}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" icon={RefreshCw} onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 'var(--radius-sm)', style = {} }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        animation: 'pulseGlow 2s infinite',
        ...style,
      }}
    />
  );
}

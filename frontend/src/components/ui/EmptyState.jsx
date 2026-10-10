import React from 'react';
import { ShieldCheck } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  icon: Icon = ShieldCheck,
  title = 'No records found',
  description = 'There are no active security findings or items to display at this time.',
  actionLabel,
  onAction,
  className = '',
  style = {}
}) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '50px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(11, 16, 26, 0.4)',
        border: '1px dashed var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        ...style,
      }}
      className={`empty-state ${className}`}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'rgba(110, 231, 255, 0.08)',
          border: '1px solid rgba(110, 231, 255, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
          color: 'var(--accent-cyan)',
        }}
      >
        <Icon size={26} />
      </div>

      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: 8 }}>
        {title}
      </h3>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: 440, lineHeight: 1.6, marginBottom: actionLabel ? 24 : 0 }}>
        {description}
      </p>

      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, AlertCircle, HelpCircle, MinusCircle } from 'lucide-react';

export function StatusDot({ status = 'online', size = 8, pulse = true, style = {} }) {
  const colorMap = {
    online: '#43E6A3',
    safe: '#43E6A3',
    warning: '#FFC857',
    medium: '#FFC857',
    danger: '#FF5C7A',
    high: '#FF5C7A',
    critical: '#FF3B5F',
    offline: '#9AA6B6',
    unavailable: '#9AA6B6',
    inconclusive: '#9AA6B6',
    checking: '#6EE7FF',
  };

  const color = colorMap[status.toLowerCase()] || '#9AA6B6';

  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        boxShadow: pulse ? `0 0 8px ${color}` : 'none',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

export default function RiskBadge({ riskLevel = 'SAFE', size = 'md', showIcon = true, style = {} }) {
  const level = (riskLevel || 'UNKNOWN').toUpperCase();

  const config = {
    SAFE: {
      label: 'SAFE',
      icon: ShieldCheck,
      color: '#43E6A3',
      bg: 'rgba(67, 230, 163, 0.12)',
      border: 'rgba(67, 230, 163, 0.35)',
    },
    LOW: {
      label: 'LOW RISK',
      icon: ShieldCheck,
      color: '#43E6A3',
      bg: 'rgba(67, 230, 163, 0.12)',
      border: 'rgba(67, 230, 163, 0.35)',
    },
    MEDIUM: {
      label: 'SUSPICIOUS',
      icon: AlertTriangle,
      color: '#FFC857',
      bg: 'rgba(255, 200, 87, 0.12)',
      border: 'rgba(255, 200, 87, 0.35)',
    },
    HIGH: {
      label: 'HIGH RISK',
      icon: AlertCircle,
      color: '#FF5C7A',
      bg: 'rgba(255, 92, 122, 0.14)',
      border: 'rgba(255, 92, 122, 0.4)',
    },
    CRITICAL: {
      label: 'CRITICAL',
      icon: ShieldAlert,
      color: '#FF3B5F',
      bg: 'rgba(255, 59, 95, 0.18)',
      border: 'rgba(255, 59, 95, 0.5)',
    },
    INCONCLUSIVE: {
      label: 'INCONCLUSIVE',
      icon: HelpCircle,
      color: '#9AA6B6',
      bg: 'rgba(154, 166, 182, 0.12)',
      border: 'rgba(154, 166, 182, 0.3)',
    },
    UNAVAILABLE: {
      label: 'UNAVAILABLE',
      icon: MinusCircle,
      color: '#9AA6B6',
      bg: 'rgba(154, 166, 182, 0.12)',
      border: 'rgba(154, 166, 182, 0.3)',
    },
  };

  const current = config[level] || {
    label: level,
    icon: HelpCircle,
    color: '#9AA6B6',
    bg: 'rgba(154, 166, 182, 0.12)',
    border: 'rgba(154, 166, 182, 0.3)',
  };

  const Icon = current.icon;
  const isSm = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSm ? '4px' : '6px',
        padding: isSm ? '2px 8px' : '4px 12px',
        borderRadius: 'var(--radius-full)',
        backgroundColor: current.bg,
        border: `1px solid ${current.border}`,
        color: current.color,
        fontSize: isSm ? '11px' : '12px',
        fontWeight: 700,
        fontFamily: 'var(--font-mono)',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {showIcon && <Icon size={isSm ? 12 : 14} color={current.color} />}
      <span>{current.label}</span>
    </span>
  );
}

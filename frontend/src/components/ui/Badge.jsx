import React from 'react';

export default function Badge({
  children,
  variant = 'default', // 'safe' | 'low' | 'medium' | 'high' | 'critical' | 'cyan' | 'violet' | 'default'
  size = 'md', // 'sm' | 'md'
  dot = false,
  className = '',
  style = {},
  ...props
}) {
  const variantMap = {
    safe: {
      bg: 'rgba(67, 230, 163, 0.12)',
      border: 'rgba(67, 230, 163, 0.35)',
      color: '#43E6A3',
      dotColor: '#43E6A3',
    },
    low: {
      bg: 'rgba(67, 230, 163, 0.12)',
      border: 'rgba(67, 230, 163, 0.35)',
      color: '#43E6A3',
      dotColor: '#43E6A3',
    },
    medium: {
      bg: 'rgba(255, 200, 87, 0.12)',
      border: 'rgba(255, 200, 87, 0.35)',
      color: '#FFC857',
      dotColor: '#FFC857',
    },
    high: {
      bg: 'rgba(255, 92, 122, 0.12)',
      border: 'rgba(255, 92, 122, 0.35)',
      color: '#FF5C7A',
      dotColor: '#FF5C7A',
    },
    critical: {
      bg: 'rgba(255, 59, 95, 0.16)',
      border: 'rgba(255, 59, 95, 0.45)',
      color: '#FF3B5F',
      dotColor: '#FF3B5F',
    },
    cyan: {
      bg: 'rgba(110, 231, 255, 0.12)',
      border: 'rgba(110, 231, 255, 0.3)',
      color: '#6EE7FF',
      dotColor: '#6EE7FF',
    },
    violet: {
      bg: 'rgba(139, 124, 255, 0.12)',
      border: 'rgba(139, 124, 255, 0.3)',
      color: '#8B7CFF',
      dotColor: '#8B7CFF',
    },
    default: {
      bg: 'rgba(255, 255, 255, 0.05)',
      border: 'rgba(255, 255, 255, 0.1)',
      color: '#9AA6B6',
      dotColor: '#9AA6B6',
    },
  };

  const current = variantMap[variant.toLowerCase()] || variantMap.default;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: size === 'sm' ? '2px 8px' : '4px 12px',
        fontSize: size === 'sm' ? '11px' : '12px',
        fontWeight: 700,
        letterSpacing: '0.04em',
        borderRadius: 'var(--radius-full)',
        background: current.bg,
        border: `1px solid ${current.border}`,
        color: current.color,
        fontFamily: 'var(--font-heading)',
        whiteSpace: 'nowrap',
        ...style,
      }}
      className={className}
      {...props}
    >
      {dot && (
        <span
          style={{
            width: size === 'sm' ? 6 : 7,
            height: size === 'sm' ? 6 : 7,
            borderRadius: '50%',
            background: current.dotColor,
            boxShadow: `0 0 8px ${current.dotColor}`,
          }}
        />
      )}
      {children}
    </span>
  );
}

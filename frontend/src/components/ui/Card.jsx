import React from 'react';

export default function Card({
  children,
  elevated = false,
  interactive = false,
  glow = false,
  glowColor = 'rgba(110, 231, 255, 0.2)',
  className = '',
  style = {},
  onClick,
  ...props
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: elevated ? 'var(--bg-elevated)' : 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        boxShadow: glow ? `0 0 35px ${glowColor}` : elevated ? 'var(--shadow-glass)' : 'none',
        cursor: interactive ? 'pointer' : 'default',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        ...style,
      }}
      className={`orion-card ${interactive ? 'card-hoverable' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

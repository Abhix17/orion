import React from 'react';

export default function Input({
  label,
  error,
  icon: Icon,
  helperText,
  id,
  className = '',
  style = {},
  containerStyle = {},
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', ...containerStyle }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: error ? '#FF5C7A' : 'var(--text-main)',
            fontFamily: 'var(--font-heading)',
          }}
        >
          {label}
        </label>
      )}

      <div style={{ position: 'relative', width: '100%' }}>
        {Icon && (
          <div
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-dim)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            <Icon size={16} />
          </div>
        )}

        <input
          id={inputId}
          style={{
            width: '100%',
            padding: Icon ? '12px 16px 12px 42px' : '12px 16px',
            background: 'var(--bg-surface)',
            border: `1px solid ${error ? 'rgba(255, 92, 122, 0.5)' : 'var(--border-subtle)'}`,
            borderRadius: 'var(--radius-md)',
            color: '#F5F7FA',
            fontSize: '14px',
            fontFamily: 'var(--font-body)',
            outline: 'none',
            transition: 'all 0.2s ease',
            ...style,
          }}
          className={`input-field ${className}`}
          {...props}
        />
      </div>

      {error ? (
        <span style={{ fontSize: '12px', color: '#FF5C7A', fontWeight: 500 }}>{error}</span>
      ) : helperText ? (
        <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{helperText}</span>
      ) : null}
    </div>
  );
}

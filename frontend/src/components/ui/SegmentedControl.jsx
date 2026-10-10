import React from 'react';

export default function SegmentedControl({
  options = [],
  value,
  onChange,
  size = 'md',
  fullWidth = false,
  className = '',
  style = {},
}) {
  const isSm = size === 'sm';

  return (
    <div
      role="tablist"
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: isSm ? '3px' : '4px',
        borderRadius: 'var(--radius-full)',
        backgroundColor: 'var(--bg-deep)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        width: fullWidth ? '100%' : 'auto',
        overflowX: 'auto',
        ...style,
      }}
    >
      {options.map((option) => {
        const isSelected = value === option.id;
        const Icon = option.icon;

        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(option.id)}
            style={{
              flex: fullWidth ? 1 : 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: isSm ? '5px 12px' : '8px 18px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: isSelected ? 'rgba(110, 231, 255, 0.14)' : 'transparent',
              border: `1px solid ${isSelected ? 'rgba(110, 231, 255, 0.35)' : 'transparent'}`,
              color: isSelected ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              fontSize: isSm ? '12px' : '13px',
              fontWeight: isSelected ? 700 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              outline: 'none',
            }}
          >
            {Icon && <Icon size={isSm ? 14 : 16} />}
            <span>{option.label}</span>
            {option.count !== undefined && (
              <span
                style={{
                  fontSize: '10px',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: isSelected ? 'rgba(110, 231, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                  color: isSelected ? '#fff' : 'var(--text-muted)',
                  fontWeight: 700,
                }}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

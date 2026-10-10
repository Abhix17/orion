import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'glow'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  className = '',
  style = {},
  onClick,
  type = 'button',
  ...props
}) {
  const sizeStyles = {
    sm: { padding: '6px 14px', fontSize: '13px', borderRadius: 'var(--radius-sm)' },
    md: { padding: '10px 20px', fontSize: '14px', borderRadius: 'var(--radius-md)' },
    lg: { padding: '14px 28px', fontSize: '16px', borderRadius: 'var(--radius-md)' },
  };

  const variantStyles = {
    primary: {
      background: 'linear-gradient(135deg, #10B981, #3B82F6)', // Emerald to Azure Gradient
      color: '#020b08',
      fontWeight: 700,
      border: 'none',
      boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
    },
    glow: {
      background: 'linear-gradient(135deg, #10B981, #3B82F6)', // Emerald to Azure Gradient
      color: '#020b08',
      fontWeight: 700,
      border: 'none',
      boxShadow: '0 0 25px rgba(59, 130, 246, 0.4)', // Blue Glow
    },
    secondary: {
      background: 'rgba(255, 255, 255, 0.06)',
      color: '#FDFBFF',
      fontWeight: 600,
      border: '1px solid var(--border-subtle)',
    },
    outline: {
      background: 'transparent',
      color: '#FDFBFF',
      fontWeight: 600,
      border: '1px solid var(--border-subtle)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-muted)',
      fontWeight: 500,
      border: 'none',
    },
    danger: {
      background: 'rgba(220, 13, 54, 0.12)',
      color: 'var(--critical)',
      fontWeight: 600,
      border: '1px solid rgba(220, 13, 54, 0.3)',
    }
  };

  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    fontFamily: 'var(--font-heading)',
    textDecoration: 'none',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...style,
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      style={baseStyle}
      className={`btn-${variant} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {!loading && Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 14 : size === 'lg' ? 18 : 16} />}
    </button>
  );
}

import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, Shield, AlertCircle, Eye, EyeOff, Check, Info } from 'lucide-react';
import { authService } from '../../services/auth';
import Button from '../ui/Button';
import Input from '../ui/Input';

export default function LoginView({ onLoginSuccess, onNavigateToSignup, onNavigateToForgot, onBackToPublic }) {
  const [email, setEmail] = useState('alice@orion.ai');
  const [password, setPassword] = useState('orion2026');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await authService.signIn({ email, password });
      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('alice@orion.ai');
    setPassword('orion2026');
    setError(null);
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 80px)',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))',
      alignItems: 'center',
      gap: 40,
      maxWidth: 1200,
      margin: '0 auto',
      padding: '40px 20px',
    }}>
      {/* Left Column: Visual Intelligence Experience */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        height: '100%',
        minHeight: 400,
      }}>
        {/* Glow Backdrop */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          height: '80%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, rgba(59, 130, 246, 0.1) 40%, transparent 70%)',
          filter: 'blur(40px)',
          zIndex: 0,
        }} />
        <div style={{ 
          width: '100%', 
          maxWidth: 300, 
          height: 300, 
          position: 'relative', 
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img 
            src="/orion.png" 
            alt="Orion Logo" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'contain',
              filter: 'drop-shadow(0 0 40px rgba(16, 185, 129, 0.3))'
            }} 
          />
        </div>
        <div style={{ textAlign: 'center', maxWidth: 400, marginTop: 30, position: 'relative', zIndex: 1 }}>
          <h3 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 26,
            fontWeight: 800,
            background: 'linear-gradient(135deg, #10B981, #3B82F6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 10px',
          }}>
            Orbital Intelligence Shield
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Unified protection connecting edge browser verification, deep learning artifact detection, and multi-modal risk correlation.
          </p>
        </div>
      </div>

      {/* Right Column: Sign In Form */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(10, 14, 23, 0.8) 0%, rgba(5, 7, 10, 0.95) 100%)',
        backdropFilter: 'blur(30px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderTop: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '24px',
        padding: '44px 40px',
        boxShadow: '0 30px 60px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: 26,
      }}>
        {/* Header */}
        <div>
          <button
            onClick={onBackToPublic}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: 13,
              cursor: 'pointer',
              padding: 0,
              marginBottom: 20,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'var(--transition)',
            }}
            onMouseOver={(e) => e.target.style.color = '#fff'}
            onMouseOut={(e) => e.target.style.color = 'var(--text-muted)'}
          >
            ← Back to ORION Public
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 40, height: 40,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <img src="/orion.png" alt="Orion Logo" style={{ height: 24, width: 24, objectFit: 'contain' }} />
            </div>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-main)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}>
              <Shield size={12} color="var(--accent-violet)" /> PERSONAL WORKSPACE
            </span>
          </div>
          
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 34,
            fontWeight: 800,
            color: '#FFFFFF',
            margin: '0 0 10px',
            letterSpacing: '-0.02em',
          }}>
            Welcome back.
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Sign in to access your personal check history, custom alerts, and saved threat findings.
          </p>
        </div>

        {/* Demo Mode Notice Callout */}
        <div style={{
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 13,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Info size={14} color="var(--accent-cyan)" />
              <span style={{ color: '#fff', fontWeight: 600 }}>Demo Mode (Frontend Adapter):</span>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 12, marginTop: 2 }}>
              alice@orion.ai / orion2026
            </div>
          </div>
          <button
            onClick={handleFillDemo}
            type="button"
            style={{
              background: 'var(--accent-cyan)',
              border: 'none',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-glow)'
            }}
          >
            Auto Fill
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255, 92, 122, 0.1)',
            border: '1px solid rgba(255, 92, 122, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: 'var(--danger)',
            fontSize: 13,
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Email address"
            type="email"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com"
            required
          />

          <div>
            <div style={{ position: 'relative' }}>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: 38,
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: 'var(--accent-cyan)' }}
                />
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={onNavigateToForgot}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: 12,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Forgot password?
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="glow"
            size="lg"
            loading={loading}
            icon={ArrowRight}
            style={{ width: '100%', marginTop: 8 }}
          >
            Sign in
          </Button>
        </form>

        {/* Footer Navigation */}
        <div style={{
          textAlign: 'center',
          fontSize: 14,
          color: 'var(--text-secondary)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: 18,
        }}>
          Don't have an account?{' '}
          <button
            onClick={onNavigateToSignup}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-cyan)',
              fontWeight: 700,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Create one
          </button>
        </div>
      </div>
    </div>
  );
}

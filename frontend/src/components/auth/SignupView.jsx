import React, { useState } from 'react';
import { User, Mail, Lock, Shield, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff, Info } from 'lucide-react';
import { authService } from '../../services/auth';
import Button from '../ui/Button';
import Input from '../ui/Input';

export default function SignupView({ onSignupSuccess, onNavigateToLogin, onBackToPublic }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getStrength = (pass) => {
    if (!pass) return { score: 0, label: 'None', color: 'var(--text-muted)' };
    if (pass.length < 6) return { score: 1, label: 'Weak', color: 'var(--danger)' };
    if (pass.length < 10) return { score: 2, label: 'Moderate', color: 'var(--warning)' };
    return { score: 3, label: 'Strong', color: 'var(--success)' };
  };

  const strength = getStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!acceptTerms) {
      setError('Please acknowledge the terms of protection to create an account.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const user = await authService.signUp({ name, email, password });
      if (onSignupSuccess) {
        onSignupSuccess(user);
      }
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
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
      {/* Visual left */}
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
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(16, 185, 129, 0.1) 40%, transparent 70%)',
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
              filter: 'drop-shadow(0 0 40px rgba(59, 130, 246, 0.3))'
            }} 
          />
        </div>
        <div style={{ textAlign: 'center', maxWidth: 400, marginTop: 30, position: 'relative', zIndex: 1 }}>
          <h3 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 26,
            fontWeight: 800,
            background: 'linear-gradient(135deg, #3B82F6, #10B981)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 10px',
          }}>
            Privacy-First Architecture
          </h3>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Your security inspections and personal artifacts are encrypted locally. You maintain sovereign control over your verification logs.
          </p>
        </div>
      </div>

      {/* Form right */}
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
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}>
              <Shield size={12} color="var(--accent-cyan)" /> CITIZEN REGISTRATION
            </span>
          </div>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 30,
            fontWeight: 800,
            color: '#FFFFFF',
            margin: '0 0 6px',
            letterSpacing: '-0.02em',
          }}>
            Create your account.
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
            Join ORION to access persistent safety history, custom phishing alerts, and proactive identity defense.
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255, 92, 122, 0.1)',
            border: '1px solid rgba(255, 92, 122, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Input
            label="Full name"
            type="text"
            icon={User}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alice Sharma"
            required
          />

          <Input
            label="Email address"
            type="email"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alice@domain.com"
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
                placeholder="At least 6 characters"
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

            {password && (
              <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 3, background: 'rgba(255, 255, 255, 0.1)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${(strength.score / 3) * 100}%`,
                    background: strength.color,
                    transition: 'width 0.2s ease',
                  }} />
                </div>
                <span style={{ fontSize: 10, color: strength.color, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          <Input
            label="Confirm password"
            type={showPassword ? 'text' : 'password'}
            icon={Lock}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat password"
            required
          />

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer', marginTop: 4 }}>
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              style={{ accentColor: 'var(--accent-cyan)', marginTop: 2 }}
            />
            <span>
              I understand that ORION inspects security signals only and never captures passwords, keystrokes, or private conversations.
            </span>
          </label>

          <Button
            type="submit"
            variant="glow"
            size="lg"
            loading={loading}
            icon={ArrowRight}
            style={{ width: '100%', marginTop: 6 }}
          >
            Create account
          </Button>
        </form>

        <div style={{
          textAlign: 'center',
          fontSize: 13,
          color: 'var(--text-secondary)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: 16,
        }}>
          Already have an account?{' '}
          <button
            onClick={onNavigateToLogin}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-cyan)',
              fontWeight: 700,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}

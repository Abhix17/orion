import React, { useState } from 'react';
import { Mail, ArrowRight, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { authService } from '../../services/auth';
import Button from '../ui/Button';
import Input from '../ui/Input';
import OrbitalCore3D from '../3d/OrbitalCore3D';

export default function ForgotPasswordView({ onNavigateToLogin, onBackToPublic }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authService.requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Failed to dispatch reset link.');
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
      {/* Left Column: 3D Visual */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        height: '100%',
        minHeight: 400,
      }}>
        <div style={{ width: '100%', maxWidth: 440, height: 440, position: 'relative' }}>
          <OrbitalCore3D />
        </div>
      </div>

      {/* Right Column: Reset Form */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 'var(--radius-xl)',
        padding: '40px 36px',
        boxShadow: '0 24px 60px rgba(0, 0, 0, 0.6)',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}>
        <div>
          <button
            onClick={onNavigateToLogin}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: 13,
              cursor: 'pointer',
              padding: 0,
              marginBottom: 16,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            ← Back to Sign In
          </button>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 32,
            fontWeight: 800,
            color: '#FFFFFF',
            margin: '0 0 8px',
          }}>
            Reset Password
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
            Enter your registered email address to receive secure reset credentials.
          </p>
        </div>

        {sent ? (
          <div style={{
            background: 'rgba(67, 230, 163, 0.08)',
            border: '1px solid rgba(67, 230, 163, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: 24,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
          }}>
            <CheckCircle2 size={36} color="var(--success)" />
            <h3 style={{ color: '#fff', fontSize: 18, margin: 0 }}>Reset Link Dispatched</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              We have sent password recovery instructions to <strong>{email}</strong>. Please check your inbox and follow the steps.
            </p>
            <Button
              variant="outline"
              size="md"
              onClick={onNavigateToLogin}
              style={{ marginTop: 10 }}
            >
              Return to Sign In
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {error && (
              <div style={{
                background: 'rgba(255, 92, 122, 0.1)',
                border: '1px solid rgba(255, 92, 122, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                color: 'var(--danger)',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <Input
              label="Account Email"
              type="email"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              required
            />

            <Button
              type="submit"
              variant="glow"
              size="lg"
              loading={loading}
              icon={ArrowRight}
              style={{ width: '100%' }}
            >
              Send Reset Instructions
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Lock, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff, Shield } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import OrbitalCore3D from '../3d/OrbitalCore3D';

export default function ResetPasswordView({ onNavigateToLogin, onBackToPublic }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const getStrength = (pass) => {
    if (!pass) return { score: 0, label: 'None', color: 'var(--text-muted)' };
    if (pass.length < 6) return { score: 1, label: 'Weak', color: 'var(--danger)' };
    if (pass.length < 10) return { score: 2, label: 'Moderate', color: 'var(--warning)' };
    return { score: 3, label: 'Strong', color: 'var(--success)' };
  };

  const strength = getStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    setSuccess(true);
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
        <div style={{ width: '100%', maxWidth: 440, height: 440, position: 'relative' }}>
          <OrbitalCore3D />
        </div>
      </div>

      {/* Form right */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-cyan)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(110, 231, 255, 0.1)',
              border: '1px solid rgba(110, 231, 255, 0.25)',
            }}>
              <Shield size={12} /> CREDENTIAL RECOVERY
            </span>
          </div>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 32,
            fontWeight: 800,
            color: '#FFFFFF',
            margin: '0 0 8px',
          }}>
            Create New Password
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>
            Choose a strong, unique passphrase to secure your ORION personal workspace.
          </p>
        </div>

        {success ? (
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
            <h3 style={{ color: '#fff', fontSize: 18, margin: 0 }}>Password Reset Complete</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
              Your credentials have been securely updated. You can now log in to your personal dashboard.
            </p>
            <Button
              variant="glow"
              size="md"
              onClick={onNavigateToLogin}
              style={{ marginTop: 10 }}
            >
              Sign In Now
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

            <div>
              <div style={{ position: 'relative' }}>
                <Input
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  icon={Lock}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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

              {/* Password strength bar */}
              {newPassword && (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 4, background: 'rgba(255, 255, 255, 0.1)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${(strength.score / 3) * 100}%`,
                      background: strength.color,
                      transition: 'width 0.2s ease',
                    }} />
                  </div>
                  <span style={{ fontSize: 11, color: strength.color, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            <Input
              label="Confirm New Password"
              type={showPassword ? 'text' : 'password'}
              icon={Lock}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              required
            />

            <Button
              type="submit"
              variant="glow"
              size="lg"
              loading={loading}
              icon={ArrowRight}
              style={{ width: '100%', marginTop: 8 }}
            >
              Update Password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

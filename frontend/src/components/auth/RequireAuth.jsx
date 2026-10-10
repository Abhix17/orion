import React from 'react';
import { Shield, ArrowRight, LogIn, UserPlus } from 'lucide-react';
import { authService } from '../../services/auth';
import Button from '../ui/Button';
import Card from '../ui/Card';

export default function RequireAuth({ 
  children, 
  currentUser = null, 
  onNavigateToLogin, 
  onNavigateToSignup,
  intendedTab = 'app-check',
  title = "You're almost there",
  description = "Sign in to use ORION and keep your personal checks and safety results in one place."
}) {
  const isAuth = authService.isAuthenticated() || !!currentUser;

  if (isAuth) {
    return <>{children}</>;
  }

  return (
    <div style={{
      maxWidth: 540,
      margin: '80px auto',
      padding: '0 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
    }}>
      <Card style={{
        padding: '40px 32px',
        width: '100%',
        background: 'rgba(11, 16, 26, 0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(110, 231, 255, 0.3)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(110, 231, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
      }}>
        {/* Animated Brand Badge */}
        <div style={{
          width: 60,
          height: 60,
          borderRadius: '16px',
          background: 'linear-gradient(135deg, rgba(110, 231, 255, 0.15), rgba(139, 124, 255, 0.15))',
          border: '1px solid rgba(110, 231, 255, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 25px rgba(110, 231, 255, 0.2)',
        }}>
          <Shield size={32} color="var(--accent-cyan)" />
        </div>

        <div>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 26,
            fontWeight: 800,
            color: '#ffffff',
            margin: '0 0 10px',
            letterSpacing: '-0.02em',
          }}>
            {title}
          </h2>
          <p style={{
            fontSize: 15,
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            margin: 0,
          }}>
            {description}
          </p>
        </div>

        <div style={{
          width: '100%',
          height: 1,
          background: 'rgba(255, 255, 255, 0.08)',
          margin: '4px 0',
        }} />

        {/* Auth CTA Buttons */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          width: '100%',
        }}>
          <Button
            variant="glow"
            size="lg"
            style={{ width: '100%', justifyContent: 'center' }}
            icon={LogIn}
            onClick={() => onNavigateToLogin && onNavigateToLogin(intendedTab)}
          >
            Sign in to continue
          </Button>

          <Button
            variant="outline"
            size="lg"
            style={{ width: '100%', justifyContent: 'center' }}
            icon={UserPlus}
            onClick={() => onNavigateToSignup && onNavigateToSignup(intendedTab)}
          >
            Create free account
          </Button>
        </div>

        <div style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span>🔒 Privacy guaranteed: Zero password collection & non-invasive analysis.</span>
        </div>
      </Card>
    </div>
  );
}

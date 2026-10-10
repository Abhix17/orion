import React, { useState } from 'react';
import { User, Mail, Shield, Key, Smartphone, Clock, Database, Trash2, CheckCircle2, Lock } from 'lucide-react';
import { authService } from '../../services/auth';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

export default function ProfileView() {
  const [user, setUser] = useState(authService.getUser() || {
    name: 'Alice Sharma',
    email: 'alice@orion.ai',
    role: 'Security Citizen',
    joinedDate: 'March 2026',
    avatarInitials: 'AS',
    twoFactorEnabled: true,
  });

  const [name, setName] = useState(user.name);
  const [savedMessage, setSavedMessage] = useState(null);

  const handleUpdate = (e) => {
    e.preventDefault();
    const updated = authService.updateProfile({ name });
    setUser(updated);
    setSavedMessage('Profile updated successfully.');
    setTimeout(() => setSavedMessage(null), 3000);
  };

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header Profile Identity */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 'var(--radius-xl)',
        padding: '32px 28px',
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        flexWrap: 'wrap',
      }}>
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))',
          color: '#05070D',
          fontSize: 26,
          fontWeight: 900,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 30px rgba(110, 231, 255, 0.3)',
        }}>
          {user.avatarInitials || 'AS'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 26,
              fontWeight: 800,
              color: '#fff',
              margin: 0,
            }}>
              {user.name}
            </h1>
            <Badge variant="cyan">{user.role || 'Citizen'}</Badge>
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            {user.email}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
            Member since {user.joinedDate || '2026'} • Personal Trust Key: Active
          </div>
        </div>
      </div>

      {savedMessage && (
        <div style={{
          background: 'rgba(67, 230, 163, 0.1)',
          border: '1px solid rgba(67, 230, 163, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px',
          color: 'var(--success)',
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <CheckCircle2 size={16} />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Personal Information */}
      <Card style={{ padding: '28px 24px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 18px' }}>
          Personal Information
        </h2>
        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Full Name"
            type="text"
            icon={User}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Email Address"
            type="email"
            icon={Mail}
            value={user.email}
            disabled
            helperText="Managed by your identity credential."
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <Button type="submit" variant="primary" size="sm">
              Save Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Security & Authentication */}
      <Card style={{ padding: '28px 24px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 18px' }}>
          Security & Credentials
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Key size={18} color="var(--accent-cyan)" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Password</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Last updated 3 weeks ago</div>
              </div>
            </div>
            <Button variant="outline" size="sm">Change Password</Button>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Smartphone size={18} color="var(--success)" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Two-Factor Authentication</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Authenticator app configured</div>
              </div>
            </div>
            <Badge variant="safe">ENABLED</Badge>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Clock size={18} color="var(--accent-violet)" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Active Sessions</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Current Browser (Chrome / Windows 11)</div>
              </div>
            </div>
            <Badge variant="cyan">CURRENT</Badge>
          </div>
        </div>
      </Card>

      {/* Privacy & Sovereign Data Controls */}
      <Card style={{ padding: '28px 24px' }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 18px' }}>
          Data Privacy & Retention
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Analysis History Retention</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Store inspection logs locally on this device</div>
            </div>
            <Badge variant="cyan">90 DAYS</Badge>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--danger)' }}>Erase Analysis Logs</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Permanently wipe all inspection records and verdicts</div>
            </div>
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={() => {
                if (window.confirm('Delete all check history?')) {
                  authService.clearHistory();
                  alert('Analysis records deleted.');
                }
              }}
            >
              Wipe Logs
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

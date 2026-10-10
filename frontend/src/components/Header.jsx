import React, { useState, useRef, useEffect } from 'react';
import { 
  Shield, 
  Search,
  Bell,
  ChevronDown, 
  Database,
  LayoutDashboard,
  Server,
  Activity,
  UserCheck,
  Compass,
  ArrowRight,
  LogIn,
  SlidersHorizontal,
  User,
  ExternalLink
} from 'lucide-react';
import { authService } from '../services/auth';
import Button from './ui/Button';

export default function Header({ 
  activeTab = 'home', 
  setActiveTab, 
  systemStatus, 
  incidentCount = 0,
  isAnalystMode = false,
  setIsAnalystMode,
  currentUser = null,
  onNavigateToLogin,
  onNavigateToApp,
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (moreRef.current && !moreRef.current.contains(event.target)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const analystTabs = [
    { id: 'overview', label: 'Command Center', icon: LayoutDashboard },
    { id: 'incidents', label: 'Incidents', icon: Activity, count: incidentCount },
    { id: 'shield', label: 'Browser Shield', icon: Shield },
    { id: 'identities', label: 'Identity Registry', icon: UserCheck },
    { id: 'system', label: 'System Status', icon: Server },
  ];

  const statusKey = (systemStatus?.status || 'CHECKING').toUpperCase();
  const isOnline = statusKey === 'ONLINE' || statusKey === 'OK' || statusKey === 'HEALTHY';
  const isChecking = statusKey === 'CHECKING';
  const dotColor = isOnline ? 'var(--success)' : isChecking ? 'var(--warning)' : 'var(--danger)';
  const statusLabel = isOnline ? 'Systems operational' : isChecking ? 'Checking engine...' : 'Engine unavailable';

  // If in Analyst Mode, render SOC header
  if (isAnalystMode) {
    return (
      <header style={{
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(5, 7, 13, 0.95)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: '0 24px',
      }}>
        <div style={{
          maxWidth: 1600,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 64,
        }}>
          {/* Logo & Mode */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              onClick={() => setActiveTab('overview')}
              style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
            >
              <img src="/orion.png" alt="Orion Logo" style={{
                width: 32,
                height: 32,
                borderRadius: '6px',
                objectFit: 'cover'
              }} />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: '0.04em' }}>
                ORION
              </span>
              <span style={{
                fontSize: 10,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(139, 124, 255, 0.15)',
                color: 'var(--accent-violet)',
                border: '1px solid rgba(139, 124, 255, 0.3)',
                fontWeight: 800,
                letterSpacing: '0.05em',
              }}>
                SOC ANALYST
              </span>
            </div>

            <div style={{ height: 16, width: 1, background: 'rgba(255, 255, 255, 0.1)' }} />

            {/* Status indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, boxShadow: `0 0 8px ${dotColor}` }} />
              <span>{statusLabel}</span>
            </div>
          </div>

          {/* Analyst Navigation */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {analystTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full)',
                    background: isActive ? 'rgba(139, 124, 255, 0.15)' : 'transparent',
                    border: `1px solid ${isActive ? 'var(--accent-violet)' : 'transparent'}`,
                    color: isActive ? 'var(--accent-violet)' : 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span style={{
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-full)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 800,
                    }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Exit SOC Mode */}
          <button
            onClick={() => {
              setIsAnalystMode(false);
              setActiveTab(currentUser ? 'app-dashboard' : 'home');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <SlidersHorizontal size={14} />
            <span>Exit SOC Mode</span>
          </button>
        </div>
      </header>
    );
  }

  // Public / Citizen Header
  return (
    <header style={{
      borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
      background: 'rgba(5, 7, 13, 0.85)',
      backdropFilter: 'blur(20px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      padding: '0 24px',
    }}>
      <div style={{
        maxWidth: 1400,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 70,
      }}>
        {/* Brand Logo & Systems Operational Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            onClick={() => setActiveTab('home')}
            style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          >
            <img src="/orion.png" alt="Orion Logo" style={{
              width: 34,
              height: 34,
              borderRadius: '8px',
              objectFit: 'cover'
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: '0.04em',
                color: '#fff',
              }}>
                ORION
              </span>
              <span style={{
                fontSize: 10,
                padding: '2px 8px',
                borderRadius: 4,
                background: 'rgba(110, 231, 255, 0.1)',
                color: 'var(--accent-cyan)',
                border: '1px solid rgba(110, 231, 255, 0.25)',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.06em',
              }}>
                DIGITAL SAFETY
              </span>
            </div>
          </div>

          <div style={{ height: 16, width: 1, background: 'rgba(255, 255, 255, 0.1)' }} />

          {/* Operational Status Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, boxShadow: `0 0 8px ${dotColor}` }} />
            <span>{statusLabel}</span>
          </div>
        </div>

        {/* Public Navigation */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => {
              if (activeTab !== 'home') setActiveTab('home');
              setTimeout(() => {
                const el = document.getElementById('how-it-works');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }, 50);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: activeTab === 'home' ? '#fff' : 'var(--text-secondary)',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              transition: 'color 0.2s',
            }}
          >
            How it works
          </button>

          <button
            onClick={() => setActiveTab('shield-info')}
            style={{
              background: activeTab === 'shield-info' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              border: 'none',
              color: activeTab === 'shield-info' ? '#fff' : 'var(--text-secondary)',
              fontSize: 14,
              fontWeight: activeTab === 'shield-info' ? 700 : 500,
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              transition: 'color 0.2s',
            }}
          >
            Browser Shield
          </button>

          <button
            onClick={() => setActiveTab('mobile-app')}
            style={{
              background: activeTab === 'mobile-app' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              border: 'none',
              color: activeTab === 'mobile-app' ? '#fff' : 'var(--text-secondary)',
              fontSize: 14,
              fontWeight: activeTab === 'mobile-app' ? 700 : 500,
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              transition: 'color 0.2s',
            }}
          >
            Mobile App
          </button>

          <button
            onClick={() => setActiveTab('pricing')}
            style={{
              background: activeTab === 'pricing' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              border: 'none',
              color: activeTab === 'pricing' ? '#fff' : 'var(--text-secondary)',
              fontSize: 14,
              fontWeight: activeTab === 'pricing' ? 700 : 500,
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              transition: 'color 0.2s',
            }}
          >
            Pricing
          </button>
        </nav>

        {/* Right CTA Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {currentUser ? (
            <div
              onClick={() => onNavigateToApp('app-dashboard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'var(--bg-surface)',
                border: '1px solid rgba(110, 231, 255, 0.3)',
                borderRadius: 'var(--radius-full)',
                padding: '4px 14px 4px 6px',
                cursor: 'pointer',
              }}
            >
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))',
                color: '#05070D',
                fontWeight: 800,
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {currentUser.avatarInitials || 'AS'}
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                My Workspace
              </span>
            </div>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                icon={LogIn}
                onClick={onNavigateToLogin}
              >
                Sign In
              </Button>
              <Button
                variant="glow"
                size="sm"
                onClick={() => setActiveTab('signup')}
              >
                Get Started
              </Button>
            </>
          )}

          {/* Discreet Analyst mode jump */}
          <button
            onClick={() => {
              setIsAnalystMode(true);
              setActiveTab('overview');
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 6,
              display: 'flex',
              alignItems: 'center',
            }}
            title="Open SOC Command Center"
          >
            <SlidersHorizontal size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}

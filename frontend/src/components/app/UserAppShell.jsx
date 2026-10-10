import React, { useState } from 'react';
import {
  LayoutDashboard,
  Search,
  Bell,
  Clock,
  Shield,
  Compass,
  User,
  Settings,
  Terminal,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { authService } from '../../services/auth';

export default function UserAppShell({
  currentTab,
  onNavigate,
  onSwitchToAnalyst,
  children,
  onSignOut,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = authService.getUser() || { name: 'Alice Sharma', role: 'Security Citizen', avatarInitials: 'AS' };

  const navGroups = [
    {
      title: 'CORE',
      items: [
        { id: 'app-dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'app-check', label: 'Check Something', icon: Search, highlight: true },
        { id: 'app-checks', label: 'My Checks', icon: Clock },
        { id: 'app-alerts', label: 'My Alerts', icon: Bell },
      ],
    },
    {
      title: 'PROTECTION',
      items: [
        { id: 'app-browser-shield', label: 'Browser Shield', icon: Shield },
      ],
    },
    {
      title: 'ACCOUNT',
      items: [
        { id: 'app-profile', label: 'Profile', icon: User },
        { id: 'app-settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  const handleNavClick = (tabId) => {
    onNavigate(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-deep)', color: 'var(--text-primary)' }}>
      {/* Mobile Top Navigation Bar */}
      <div style={{
        display: 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 60,
        background: 'var(--bg-surface)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        zIndex: 50,
        padding: '0 16px',
        alignItems: 'center',
        justifyContent: 'space-between',
      }} className="mobile-nav-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '6px',
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#05070D',
            fontWeight: 900,
            fontSize: 15,
          }}>
            O
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#fff' }}>
            ORION
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Desktop / Collapsible Sidebar */}
      <aside style={{
        width: collapsed ? 76 : 260,
        transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        background: 'var(--bg-surface)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 40,
        flexShrink: 0,
      }} className={mobileMenuOpen ? 'mobile-drawer-open' : 'desktop-sidebar'}>
        {/* Sidebar Brand Header */}
        <div style={{
          height: 72,
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}>
          {!collapsed ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#05070D',
                fontWeight: 900,
                fontSize: 18,
              }}>
                O
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#fff', letterSpacing: '0.04em', lineHeight: 1.1 }}>
                  ORION
                </div>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                  CITIZEN WORKSPACE
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#05070D',
              fontWeight: 900,
              fontSize: 18,
            }}>
              O
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 4,
              borderRadius: 'var(--radius-sm)',
            }}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Sections */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {!collapsed && (
                <div style={{
                  fontSize: 10,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.08em',
                  padding: '4px 12px',
                  fontWeight: 700,
                }}>
                  {group.title}
                </div>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      width: '100%',
                      padding: collapsed ? '12px 0' : '10px 14px',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      borderRadius: 'var(--radius-md)',
                      background: isActive
                        ? 'rgba(110, 231, 255, 0.12)'
                        : item.highlight && !collapsed
                        ? 'rgba(110, 231, 255, 0.05)'
                        : 'transparent',
                      border: isActive
                        ? '1px solid rgba(110, 231, 255, 0.3)'
                        : '1px solid transparent',
                      color: isActive
                        ? 'var(--accent-cyan)'
                        : item.highlight
                        ? 'var(--text-primary)'
                        : 'var(--text-secondary)',
                      fontSize: 14,
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon size={18} color={isActive ? 'var(--accent-cyan)' : 'currentColor'} />
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Analyst Mode Switcher */}
          <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
            <button
              onClick={onSwitchToAnalyst}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: collapsed ? '12px 0' : '10px 14px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(139, 124, 255, 0.08)',
                border: '1px solid rgba(139, 124, 255, 0.25)',
                color: 'var(--accent-violet)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title={collapsed ? 'Switch to Analyst SOC' : undefined}
            >
              <Terminal size={16} />
              {!collapsed && <span>Analyst SOC Mode</span>}
            </button>
          </div>
        </div>

        {/* User Profile Card & Sign Out */}
        <div style={{
          padding: '16px 14px',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 10,
        }}>
          <div
            onClick={() => onNavigate('app-profile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              flex: 1,
              overflow: 'hidden',
            }}
          >
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))',
              color: '#05070D',
              fontWeight: 800,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {user.avatarInitials || 'AS'}
            </div>
            {!collapsed && (
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {user.role}
                </div>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={onSignOut}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 6,
                borderRadius: 'var(--radius-sm)',
              }}
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        minWidth: 0,
        overflowY: 'auto',
        padding: '30px 32px 80px',
      }}>
        {children}
      </main>

      {/* Responsive Styles Injection */}
      <style>{`
        @media (max-width: 768px) {
          .mobile-nav-bar { display: flex !important; }
          .desktop-sidebar {
            display: none !important;
          }
          .mobile-drawer-open {
            display: flex !important;
            position: fixed !important;
            top: 60px !important;
            bottom: 0 !important;
            left: 0 !important;
            width: 260px !important;
            z-index: 100 !important;
          }
          main {
            padding: 80px 16px 80px !important;
          }
        }
      `}</style>
    </div>
  );
}

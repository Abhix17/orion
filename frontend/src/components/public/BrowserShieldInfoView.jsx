import React from 'react';
import { 
  Shield, 
  Lock, 
  Eye, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  AlertTriangle, 
  Globe, 
  KeyRound,
  FileCheck,
  Download
} from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Card from '../ui/Card';

export default function BrowserShieldInfoView({ 
  onNavigateToLogin, 
  onNavigateToApp, 
  isAuthenticated = false 
}) {
  const handleUseShield = () => {
    if (isAuthenticated) {
      if (onNavigateToApp) onNavigateToApp('app-browser-shield');
    } else {
      if (onNavigateToLogin) onNavigateToLogin('app-browser-shield');
    }
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 100px', color: 'var(--text-main)' }}>
      
      {/* HERO SECTION */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 480px), 1fr))',
        alignItems: 'center',
        gap: 'clamp(32px, 5vw, 64px)',
        padding: '20px 0 60px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Badge variant="cyan">REAL-TIME BROWSER DEFENSE</Badge>
          
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(38px, 4.8vw, 64px)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            margin: 0,
            color: '#FFFFFF',
          }}>
            ORION Browser<br />
            <span style={{
              background: 'linear-gradient(135deg, #6EE7FF 0%, #A5B4FC 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Shield.
            </span>
          </h1>

          <p style={{
            fontSize: 'clamp(16px, 1.25vw, 20px)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            margin: 0,
            maxWidth: 540,
          }}>
            Automatic protection as you browse. Browser Shield quietly detects deceptive lookalikes, unencrypted form destinations, and brand impersonations before you enter your credentials.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, paddingTop: 6 }}>
            <Button
              variant="glow"
              size="lg"
              onClick={handleUseShield}
              icon={ArrowRight}
            >
              {isAuthenticated ? 'Open Browser Shield' : 'Use Browser Shield'}
            </Button>
          </div>

          <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={15} color="var(--success)" />
            <span>Requires an ORION account to connect and store security alerts.</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Realistic Browser Window Mockup */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 30px rgba(110, 231, 255, 0.15)',
        }}>
          {/* Chrome Top Address Bar */}
          <div style={{
            background: 'var(--bg-elevated)',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f' }} />
            </div>
            <div style={{
              flex: 1,
              background: 'var(--bg-deep)',
              borderRadius: 'var(--radius-full)',
              padding: '6px 14px',
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span>secure-netbanking-verify.xyz/login</span>
              <Lock size={12} color="var(--text-muted)" />
            </div>
          </div>

          {/* Browser Shield Alert Banner Inside Webpage */}
          <div style={{ padding: 28, minHeight: 260, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{
              background: 'rgba(255, 92, 122, 0.1)',
              border: '1px solid rgba(255, 92, 122, 0.45)',
              borderRadius: 'var(--radius-lg)',
              padding: 22,
              boxShadow: '0 0 35px rgba(255, 92, 122, 0.2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Shield size={18} color="var(--danger)" />
                  <strong style={{ fontSize: 14, color: '#fff', letterSpacing: '0.04em', fontFamily: 'var(--font-mono)' }}>
                    ORION SHIELD DETECTED THREAT
                  </strong>
                </div>
                <Badge variant="high">HIGH RISK</Badge>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
                Warning: Deceptive Brand Impersonation Portal
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14 }}>
                Domain age 48hrs • Mismatched SSL Certificate • Form posts unencrypted passwords to external server
              </div>
              <Button variant="danger" size="sm" onClick={handleUseShield}>
                Inspect Verdict in ORION →
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* PRIVACY & HOW IT PROTECTS */}
      <section style={{ padding: '60px 0', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 48px' }}>
          <Badge variant="cyan" style={{ marginBottom: 12 }}>NON-INVASIVE ARCHITECTURE</Badge>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', margin: '0 0 12px' }}>
            Protects your browsing without spying on you.
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 20,
        }}>
          {[
            {
              title: 'Zero Password Logging',
              desc: 'Password input elements are stripped and sanitized locally before any analysis occurs.',
              icon: KeyRound,
            },
            {
              title: 'No Session Token Scraping',
              desc: 'Cookies, auth tokens, and session headers remain strictly isolated inside your browser.',
              icon: Lock,
            },
            {
              title: 'Zero Keystroke Monitoring',
              desc: 'No keyloggers, typing monitors, or continuous background scrapers.',
              icon: Eye,
            },
            {
              title: 'Clear Explanation Cards',
              desc: 'Every alert clearly outlines why the page was flagged and what action you should take.',
              icon: FileCheck,
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card key={idx} style={{ padding: 24 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(110, 231, 255, 0.08)',
                  border: '1px solid rgba(110, 231, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}>
                  <Icon size={20} color="var(--accent-cyan)" />
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>{item.title}</h4>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{item.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>

    </div>
  );
}

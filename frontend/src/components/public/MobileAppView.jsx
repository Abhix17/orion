import React, { useState } from 'react';
import { 
  Smartphone, 
  Bell, 
  Share2, 
  Camera, 
  Mic, 
  Shield, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  Lock,
  MessageSquare,
  Globe,
  AlertTriangle
} from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Card from '../ui/Card';

export default function MobileAppView({ onNavigateToCheck, onNavigateToLogin, isAuthenticated = false }) {
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState(null);

  const handleWaitlistSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    setError(null);
    setJoined(true);
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Badge variant="cyan">MOBILE COMPANION</Badge>
            <span style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(16, 185, 129, 0.15)', /* Emerald */
              color: 'var(--accent-cyan)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}>
              AVAILABLE NOW
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(40px, 5vw, 68px)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.035em',
            margin: 0,
            color: '#FFFFFF',
          }}>
            ORION in your<br />
            <span style={{
              background: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              pocket.
            </span>
          </h1>

          <p style={{
            fontSize: 'clamp(16px, 1.3vw, 20px)',
            color: 'var(--text-secondary)',
            lineHeight: 1.6,
            margin: 0,
            maxWidth: 540,
          }}>
            Your digital safety companion, wherever you go. Check suspicious links, SMS alerts, screenshots, and voice notes right from your phone’s share sheet.
          </p>

          {/* Download/Expo Box */}
          <div style={{
            background: 'var(--bg-card)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--border-glow)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            maxWidth: 500,
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)',
          }}>
            <h4 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>
              Development Build Active
            </h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 16px', lineHeight: 1.5 }}>
              Scan the QR code in your terminal with <strong>Expo Go</strong> (Android) or the Camera app (iOS) to load the ORION mobile app instantly.
            </p>

            <div style={{ display: 'flex', gap: 12 }}>
              <Button variant="glow" size="md" onClick={() => alert('Check your local terminal running Expo to scan the QR Code!')}>
                How to connect
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Realistic Mobile UI Showcase */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          position: 'relative',
        }}>
          {/* Smartphone Chassis */}
          <div style={{
            width: 'min(100%, 320px)',
            height: 580,
            background: '#090D15',
            borderRadius: 42,
            border: '4px solid #1E293B',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(16, 185, 129, 0.12)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Top Island Notch */}
            <div style={{ height: 26, background: '#000', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div style={{ width: 80, height: 14, background: '#111827', borderRadius: 10 }} />
            </div>

            {/* Mobile App Screen Content */}
            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14, flex: 1, overflowY: 'auto' }}>
              
              {/* App Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#05070D',
                    fontWeight: 900,
                    fontSize: 13,
                  }}>
                    O
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>ORION Mobile</span>
                </div>
                <Badge variant="cyan" style={{ fontSize: 10 }}>ACTIVE SHIELD</Badge>
              </div>

              {/* Quick Check Input */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                fontSize: 12,
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span>Paste link or share content...</span>
                <Share2 size={14} color="var(--accent-cyan)" />
              </div>

              {/* Share to ORION Concept Card */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.06)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: 14,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 4 }}>
                  <Share2 size={13} />
                  <span>Share Sheet Integration</span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  Forward any message from WhatsApp, Telegram or SMS straight to ORION for an instant 2-second check.
                </p>
              </div>

              {/* Recent Check Alert Item */}
              <div style={{
                background: 'rgba(255, 92, 122, 0.08)',
                border: '1px solid rgba(255, 92, 122, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: 12,
                fontSize: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, color: '#fff' }}>SMS Check</span>
                  <span style={{ color: 'var(--danger)', fontWeight: 800, fontSize: 10 }}>HIGH RISK</span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>"Your electricity bill is overdue. Pay now..."</div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* MOBILE APP FEATURES GRID */}
      <section style={{ padding: '60px 0', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 40px' }}>
          <Badge variant="cyan" style={{ marginBottom: 10 }}>MOBILE CAPABILITIES</Badge>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', margin: '0 0 10px' }}>
            Built for everyday digital safety.
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 20,
        }}>
          {[
            {
              title: 'One-Tap Share Sheet',
              desc: 'Select "Share to ORION" from WhatsApp, Messages, or Chrome to check suspicious content in seconds.',
              icon: Share2,
            },
            {
              title: 'Real-Time Threat Push Alerts',
              desc: 'Receive immediate alerts when widespread scam messages or impersonations target your region.',
              icon: Bell,
            },
            {
              title: 'Screenshot & Receipt Scanner',
              desc: 'Snap or select any payment receipt, QR code, or chat screenshot to detect forgery or manipulation.',
              icon: Camera,
            },
            {
              title: 'Voice Note & Call Analyzer',
              desc: 'Check suspicious emergency audio clips or unknown voice notes for synthetic AI cloning signals.',
              icon: Mic,
            },
          ].map((feat, i) => {
            const Icon = feat.icon;
            return (
              <Card key={i} style={{ padding: 24 }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}>
                  <Icon size={20} color="var(--accent-cyan)" />
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>{feat.title}</h4>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{feat.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>

    </div>
  );
}

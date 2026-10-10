import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  MessageSquare,
  Image as ImageIcon,
  Mic,
  Video,
  Shield,
  ArrowRight,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Eye,
  KeyRound,
  FileCheck,
  Database,
  Smartphone,
  Laptop,
  Layers,
  Sparkles,
  PhoneCall,
  Search,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Sliders,
  Check,
  X
} from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Card from '../ui/Card';

export default function PublicHome({
  onSelectCategory,
  onNavigateToCheck,
  onNavigateToLogin,
  onNavigateToBrowserShield,
  onNavigateToMobileApp,
  onNavigateToPricing,
  isAuthenticated = false
}) {
  // Parallax mouse position for hero smartphone & overlay card
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);

  // Universal input bar text state
  const [quickInput, setQuickInput] = useState('');

  // Interactive "Check Before You Trust" comparison perspective ('user' | 'orion')
  const [comparisonMode, setComparisonMode] = useState('orion');

  // Interactive slider position (0 to 100%) for drag comparison
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const comparisonContainerRef = useRef(null);

  // Check reduced-motion preference on mount
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Parallax mouse move listener on window
  useEffect(() => {
    if (reducedMotion) return;
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const x = ((clientX / innerWidth) - 0.5) * 16; // -8px to +8px
      const y = ((clientY / innerHeight) - 0.5) * 16;
      setMouseOffset({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [reducedMotion]);

  // Handle slider drag interaction
  const handleSliderMove = (clientX) => {
    if (!comparisonContainerRef.current) return;
    const rect = comparisonContainerRef.current.getBoundingClientRect();
    const pos = ((clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(10, Math.min(90, pos)));
  };

  const handleTouchMove = (e) => {
    if (!isDraggingSlider || !e.touches[0]) return;
    handleSliderMove(e.touches[0].clientX);
  };

  const handleMouseMoveSlider = (e) => {
    if (!isDraggingSlider) return;
    handleSliderMove(e.clientX);
  };

  // Submit quick universal check
  const handleQuickSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = quickInput.trim();
    if (!trimmed) {
      onNavigateToCheck();
      return;
    }
    if (/^https?:\/\//i.test(trimmed) || trimmed.includes('.com') || trimmed.includes('.xyz') || trimmed.includes('.in')) {
      if (onSelectCategory) onSelectCategory('url');
    } else {
      if (onSelectCategory) onSelectCategory('message');
    }
  };

  // Multimodal quick pills
  const modalities = [
    { id: 'message', name: 'Message', icon: MessageSquare, desc: 'Check suspicious texts, WhatsApp forwards & emails.' },
    { id: 'url', name: 'Link', icon: Globe, desc: 'Check websites, payment portals & shortened URLs.' },
    { id: 'image', name: 'Image', icon: ImageIcon, desc: 'Check screenshots, payment receipts & identity cards.' },
    { id: 'audio', name: 'Audio', icon: Mic, desc: 'Check voice notes, calls & cloned recordings.' },
    { id: 'video', name: 'Video', icon: Video, desc: 'Check video calls, endorsements & face-swaps.' },
  ];

  // 4 Everyday scenarios in "Why ORION?"
  const everydayScenarios = [
    {
      type: 'MESSAGE',
      icon: MessageSquare,
      headline: 'Bank account freeze alert',
      quote: '"Your bank account will be blocked today."',
      story: 'A text message claiming your debit card has been suspended. It creates artificial panic and gives you two hours to update KYC through an unverified link.',
      risk: 'Phishing Alert',
      accent: '#FF5C7A',
      modality: 'message'
    },
    {
      type: 'LINK',
      icon: Globe,
      headline: 'Fake netbanking verification',
      quote: '"Verify your KYC immediately."',
      story: 'A link forwarded via SMS that opens what looks exactly like your bank’s login screen, but quietly sends your password and OTP to a remote attacker.',
      risk: 'Credential Harvesting',
      accent: '#FFC857',
      modality: 'url'
    },
    {
      type: 'CALL / VOICE',
      icon: PhoneCall,
      headline: 'Cloned emergency voice note',
      quote: '"Bhai, emergency hai. Paise bhej de."',
      story: 'A WhatsApp audio message that sounds unmistakably like a close friend pleading for an urgent transfer to an unknown UPI ID due to an accident.',
      risk: 'Voice Cloning Scam',
      accent: '#38BDF8',
      modality: 'audio'
    },
    {
      type: 'MEDIA / VIDEO',
      icon: Video,
      headline: 'Manipulated endorsement clip',
      quote: '"Is this video really from them?"',
      story: 'A social media video where a well-known figure appears to promise guaranteed returns on an investment scheme, generated using facial replacement.',
      risk: 'Synthetic Deepfake',
      accent: '#8B7CFF',
      modality: 'video'
    }
  ];

  // 6 Broad platform threat categories
  const threatCategories = [
    {
      id: 'phishing',
      title: 'Phishing',
      icon: Globe,
      desc: 'Suspicious messages and lookalike links designed to steal passwords and financial logins.',
      accent: 'var(--accent-cyan)',
      modality: 'url'
    },
    {
      id: 'impersonation',
      title: 'Impersonation',
      icon: ShieldAlert,
      desc: 'Someone pretending to be a bank official, utility provider, employer or family member.',
      accent: '#38BDF8',
      modality: 'message'
    },
    {
      id: 'deepfakes',
      title: 'Deepfakes',
      icon: Video,
      desc: 'Synthetic voices and face-swapped video clips created with generative AI to deceive.',
      accent: 'var(--accent-violet)',
      modality: 'video'
    },
    {
      id: 'account_takeover',
      title: 'Account Takeover',
      icon: Lock,
      desc: 'Unusual login attempts, credential stuffing, and unauthorized access from unfamiliar cities.',
      accent: '#FFC857',
      modality: 'account'
    },
    {
      id: 'malicious_websites',
      title: 'Malicious Websites',
      icon: Shield,
      desc: 'Deceptive or compromised websites that push hidden downloads or fake payment gateways.',
      accent: 'var(--danger)',
      modality: 'url'
    },
    {
      id: 'suspicious_activity',
      title: 'Suspicious Activity',
      icon: Eye,
      desc: 'Unusual digital behavior across channels that warrants a second opinion before you act.',
      accent: 'var(--success)',
      modality: 'account'
    }
  ];

  return (
    <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 24px 100px', color: 'var(--text-main)' }}>

      {/* ========================================================
          HERO SECTION — "BEFORE YOU TRUST IT, CHECK IT."
         ======================================================== */}
      <section style={{
        minHeight: 'calc(90vh - 70px)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 520px), 1fr))',
        alignItems: 'center',
        gap: 'clamp(32px, 5vw, 64px)',
        padding: '30px 0 60px',
        position: 'relative',
      }}>

        {/* Subtle Ambient Background Glows */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          width: 480,
          height: 480,
          background: 'radial-gradient(circle, rgba(110, 231, 255, 0.08) 0%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
          zIndex: 0,
        }} />
        <div style={{
          position: 'absolute',
          bottom: '10%',
          right: '5%',
          width: 500,
          height: 500,
          background: 'radial-gradient(circle, rgba(139, 124, 255, 0.07) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        {/* LEFT COLUMN: Hero Copy & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, zIndex: 2 }}>

          {/* Eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(110, 231, 255, 0.07)',
              border: '1px solid rgba(110, 231, 255, 0.22)',
              color: 'var(--accent-cyan)',
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.02em',
            }}>
              <span style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: 'var(--accent-cyan)',
                boxShadow: '0 0 8px var(--accent-cyan)',
              }} />
              A second opinion for your digital life
            </span>
          </div>

          {/* Main Headline */}
          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(36px, 4.5vw, 64px)',
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: '-0.035em',
            margin: 0,
            color: '#FFFFFF',
          }}>
            AI-powered cyber threat<br />
            <span style={{
              background: 'linear-gradient(135deg, #6EE7FF 0%, #A5B4FC 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 40px rgba(110, 231, 255, 0.25)',
            }}>
              detection, investigation<br />and response.
            </span>
          </h1>

          {/* Supporting Human Copy */}
          <p style={{
            fontSize: 'clamp(16px, 1.25vw, 19px)',
            lineHeight: 1.6,
            color: 'var(--text-secondary)',
            maxWidth: 540,
            margin: 0,
          }}>
            Detect phishing, impersonation, deepfakes and abnormal activity — then connect the evidence into one attack story.
          </p>

          {/* Primary Action Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, paddingTop: 4 }}>
            <Button
              variant="glow"
              size="lg"
              onClick={onNavigateToCheck}
              icon={ArrowRight}
            >
              Analyze a Threat
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                const navEvent = new CustomEvent('orion-navigate', { detail: 'overview' });
                window.dispatchEvent(navEvent);
              }}
            >
              Explore SOC
            </Button>
          </div>

          {/* Compact Universal Check Bar (Section 4) */}
          <div style={{
            marginTop: 14,
            padding: 16,
            background: 'rgba(11, 16, 26, 0.75)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.4)',
            maxWidth: 540,
          }}>
            <form onSubmit={handleQuickSubmit} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Search size={18} color="var(--text-muted)" style={{ flexShrink: 0, marginLeft: 6 }} />
              <input
                type="text"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder="Paste a link, message or drop a file..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#fff',
                  fontSize: 14,
                  fontFamily: 'inherit',
                }}
              />
              <button
                type="submit"
                style={{
                  background: 'var(--accent-cyan)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  color: '#05070D',
                  padding: '8px 14px',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'opacity 0.2s',
                }}
              >
                <span>Check</span>
                <ArrowRight size={14} />
              </button>
            </form>

            {/* Quick Modality Switcher Pills */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            }}>
              {modalities.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      if (onSelectCategory) onSelectCategory(m.id);
                      else onNavigateToCheck();
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 'var(--radius-full)',
                      padding: '5px 12px',
                      color: 'var(--text-secondary)',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.borderColor = 'rgba(110, 231, 255, 0.4)';
                      e.currentTarget.style.background = 'rgba(110, 231, 255, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    }}
                  >
                    <Icon size={13} color="var(--accent-cyan)" />
                    <span>{m.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Human Trust Points */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 20,
            fontSize: 13,
            color: 'var(--text-muted)',
            paddingTop: 4,
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={15} color="var(--success)" /> Completely Private
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={15} color="var(--success)" /> Plain-Language Advice
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={15} color="var(--success)" /> Zero Password Logging
            </span>
          </div>

        </div>

        {/* RIGHT COLUMN: Realistic Smartphone + ORION Analysis Card */}
        <div
          className="hero-phone-col"
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            perspective: 1200,
            padding: '20px 0',
            zIndex: 2,
          }}
        >

          {/* Smartphone Chassis Container with Parallax */}
          <div
            style={{
              position: 'relative',
              width: 'min(100%, 330px)',
              height: 600,
              background: '#090D15',
              borderRadius: 44,
              border: '4px solid #1E293B',
              boxShadow: `
                0 0 0 2px rgba(255, 255, 255, 0.08),
                0 25px 60px rgba(0, 0, 0, 0.8),
                0 0 50px rgba(110, 231, 255, 0.1)
              `,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              transform: reducedMotion ? 'none' : `
                perspective(1000px)
                rotateY(${mouseOffset.x * 0.4}deg)
                rotateX(${-mouseOffset.y * 0.4}deg)
                translate3d(${mouseOffset.x * 0.5}px, ${mouseOffset.y * 0.5}px, 0)
              `,
              transition: reducedMotion ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            {/* Phone Top Notch / Dynamic Island */}
            <div style={{
              height: 28,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: 8,
              position: 'relative',
              zIndex: 3,
            }}>
              <div style={{
                width: 90,
                height: 18,
                borderRadius: 20,
                background: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 8px',
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#111827' }} />
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(56, 189, 248, 0.4)' }} />
              </div>
            </div>

            {/* Phone Screen Chat Header */}
            <div style={{
              padding: '12px 18px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'rgba(255, 92, 122, 0.15)',
                border: '1px solid rgba(255, 92, 122, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--danger)',
                fontWeight: 700,
                fontSize: 13,
              }}>
                !
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Unknown Sender</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>SMS • +91 98201 XXXXX</div>
              </div>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>2:14 PM</span>
            </div>

            {/* Phone Chat Body: Realistic Suspicious Message */}
            <div style={{ padding: '20px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{
                alignSelf: 'flex-start',
                maxWidth: '92%',
                background: '#151D2C',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px 16px 16px 4px',
                padding: '14px 14px',
                fontSize: 13,
                lineHeight: 1.5,
                color: '#E2E8F0',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
              }}>
                <div style={{
                  fontWeight: 800,
                  color: '#FF5C7A',
                  fontSize: 11,
                  letterSpacing: '0.04em',
                  marginBottom: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <AlertTriangle size={13} />
                  <span>BANK ALERT</span>
                </div>
                Your account will be blocked today. Verify your details immediately to avoid interruption:
                <div style={{
                  marginTop: 8,
                  padding: '6px 10px',
                  borderRadius: 6,
                  background: 'rgba(255, 92, 122, 0.1)',
                  border: '1px solid rgba(255, 92, 122, 0.25)',
                  color: '#FF7B95',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  wordBreak: 'break-all',
                }}>
                  http://secure-verify-kyc-portal.xyz/auth
                </div>
              </div>
            </div>

            {/* Subtle Screen Reflection Glare */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 220,
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, transparent 60%)',
              pointerEvents: 'none',
            }} />
          </div>

          {/* OVERLAY ORION ANALYSIS CARD (Floating with Layered Parallax) */}
          <div
            className="hero-analysis-overlay"
            style={{
              background: 'rgba(11, 16, 26, 0.94)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255, 92, 122, 0.45)',
              borderRadius: 'var(--radius-lg)',
              padding: '22px 20px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.75), 0 0 30px rgba(255, 92, 122, 0.18)',
              zIndex: 5,
              transform: reducedMotion ? 'none' : `
                translate3d(${-mouseOffset.x * 0.9}px, ${-mouseOffset.y * 0.9}px, 25px)
              `,
              transition: reducedMotion ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            {/* Analysis Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-violet))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#05070D',
                  fontWeight: 900,
                  fontSize: 12,
                }}>
                  O
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', color: '#fff', fontFamily: 'var(--font-mono)' }}>
                  ORION ANALYSIS
                </span>
              </div>
              <span style={{
                background: 'rgba(255, 92, 122, 0.18)',
                color: 'var(--danger)',
                border: '1px solid rgba(255, 92, 122, 0.4)',
                fontSize: 11,
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--danger)' }} />
                HIGH RISK
              </span>
            </div>

            {/* Warning Signs List */}
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 14 }}>
              <div style={{ fontWeight: 700, color: '#fff', marginBottom: 6 }}>Warning signs:</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: 'var(--danger)' }}>•</span>
                  <span><strong>Suspicious domain:</strong> .xyz, unrelated server</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: 'var(--danger)' }}>•</span>
                  <span><strong>Urgency language:</strong> "blocked today", "immediately"</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: 'var(--danger)' }}>•</span>
                  <span><strong>Brand impersonation:</strong> unverified bank claim</span>
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: 'var(--danger)' }}>•</span>
                  <span><strong>Credential request:</strong> seeks secret login</span>
                </li>
              </ul>
            </div>

            {/* Recommended Action */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 12px',
              fontSize: 12,
              lineHeight: 1.45,
              color: '#CBD5E1',
            }}>
              <strong style={{ color: '#fff', display: 'block', marginBottom: 2 }}>Recommended action:</strong>
              Don't open the link or enter your banking details until you've verified the sender through an official channel.
            </div>
          </div>

        </div>

      </section>

      {/* ========================================================
          SECTION 2 — "WHY ORION?" (EVERYDAY SCENARIOS)
         ======================================================== */}
      <section id="why-orion" style={{ padding: '80px 0 60px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 50px' }}>
          <Badge variant="cyan" style={{ marginBottom: 12 }}>REAL-WORLD CONTEXT</Badge>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(30px, 3.6vw, 48px)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            margin: '0 0 16px',
            color: '#FFFFFF',
          }}>
            Scams are getting harder to recognize.
          </h2>
          <p style={{ fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Fake messages, impersonation, suspicious websites, AI-generated media and account attacks can look convincing. ORION helps you pause, understand and decide.
          </p>
        </div>

        {/* 4 Realistic Scenario Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: 20,
        }}>
          {everydayScenarios.map((sc, idx) => {
            const Icon = sc.icon;
            return (
              <div
                key={idx}
                onClick={() => {
                  if (onSelectCategory) onSelectCategory(sc.modality);
                  else onNavigateToCheck();
                }}
                style={{
                  background: 'var(--bg-card)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '26px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  cursor: 'pointer',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = sc.accent;
                  e.currentTarget.style.boxShadow = `0 12px 30px rgba(0,0,0,0.5), 0 0 20px ${sc.accent}20`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{
                    width: 38,
                    height: 38,
                    borderRadius: 'var(--radius-md)',
                    background: `${sc.accent}15`,
                    border: `1px solid ${sc.accent}35`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Icon size={18} color={sc.accent} />
                  </div>
                  <span style={{
                    fontSize: 11,
                    fontFamily: 'var(--font-mono)',
                    color: sc.accent,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                  }}>
                    {sc.type}
                  </span>
                </div>

                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
                    {sc.quote}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    {sc.story}
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  color: sc.accent,
                  marginTop: 'auto',
                  paddingTop: 8,
                }}>
                  <span>Check this scenario</span>
                  <ArrowRight size={13} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================
          SECTION 3 — "CHECK BEFORE YOU TRUST" (SIGNATURE SLIDER)
         ======================================================== */}
      <section id="check-before-you-trust" style={{ padding: '80px 0 60px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 40px' }}>
          <Badge variant="cyan" style={{ marginBottom: 12 }}>SIGNATURE DEMONSTRATION</Badge>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(30px, 3.6vw, 48px)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            margin: '0 0 16px',
            color: '#FFFFFF',
          }}>
            Check before you trust.
          </h2>
          <p style={{ fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Compare what an everyday message looks like on the surface versus the hidden threat indicators ORION uncovers.
          </p>
        </div>

        {/* Toggle Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 'var(--radius-full)',
            padding: 4,
            display: 'flex',
            gap: 4,
          }}>
            <button
              onClick={() => setComparisonMode('user')}
              style={{
                background: comparisonMode === 'user' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                border: 'none',
                color: comparisonMode === 'user' ? '#fff' : 'var(--text-muted)',
                borderRadius: 'var(--radius-full)',
                padding: '8px 20px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              👁️ What You See
            </button>
            <button
              onClick={() => setComparisonMode('orion')}
              style={{
                background: comparisonMode === 'orion' ? 'var(--accent-cyan)' : 'transparent',
                border: 'none',
                color: comparisonMode === 'orion' ? '#05070D' : 'var(--text-muted)',
                borderRadius: 'var(--radius-full)',
                padding: '8px 20px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              🛡️ What ORION Sees
            </button>
          </div>
        </div>

        {/* Comparison Showcase Container */}
        <div style={{
          maxWidth: 920,
          margin: '0 auto',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 'var(--radius-xl)',
          padding: 'clamp(24px, 4vw, 40px)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
          gap: 32,
          alignItems: 'center',
        }}>

          {/* Surface View Card */}
          <div style={{
            background: comparisonMode === 'user' ? 'rgba(15, 23, 42, 0.85)' : 'rgba(11, 16, 26, 0.5)',
            border: `1px solid ${comparisonMode === 'user' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.06)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            transition: 'all 0.3s ease',
            opacity: comparisonMode === 'user' ? 1 : 0.65,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 700 }}>
                SURFACE APPEARANCE
              </span>
            </div>

            <div style={{
              background: '#0F172A',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-md)',
              padding: 16,
              fontSize: 14,
              lineHeight: 1.5,
              color: '#F1F5F9',
            }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                Sender: <strong>VM-BANKALERT</strong>
              </div>
              <p style={{ margin: '0 0 10px' }}>
                Dear Customer, your NetBanking access is scheduled for deactivation due to incomplete KYC records.
              </p>
              <div style={{
                color: '#38BDF8',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                textDecoration: 'underline',
              }}>
                http://secure-online-kyc-update.xyz/login
              </div>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 14, lineHeight: 1.5 }}>
              At first glance, it looks like an urgent, legitimate security alert from a financial institution.
            </p>
          </div>

          {/* ORION Deconstructed Evidence View */}
          <div style={{
            background: comparisonMode === 'orion' ? 'rgba(255, 92, 122, 0.06)' : 'rgba(11, 16, 26, 0.5)',
            border: `1px solid ${comparisonMode === 'orion' ? 'rgba(255, 92, 122, 0.35)' : 'rgba(255, 255, 255, 0.06)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            transition: 'all 0.3s ease',
            opacity: comparisonMode === 'orion' ? 1 : 0.65,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--danger)', fontWeight: 700 }}>
                ORION DEEP INSPECTION
              </span>
              <span style={{
                background: 'rgba(255, 92, 122, 0.2)',
                color: 'var(--danger)',
                border: '1px solid rgba(255, 92, 122, 0.4)',
                fontSize: 11,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
              }}>
                HIGH RISK
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ color: 'var(--danger)' }}>✕</span>
                <div><strong>Domain age:</strong> Registered 48 hours ago (Anomalous)</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ color: 'var(--danger)' }}>✕</span>
                <div><strong>Form action:</strong> Posts credentials to unverified server</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ color: 'var(--danger)' }}>✕</span>
                <div><strong>Language pattern:</strong> Artificial panic & urgency</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ color: 'var(--danger)' }}>✕</span>
                <div><strong>Sender mismatch:</strong> No verified institutional cryptographic key</div>
              </div>
            </div>

            <div style={{
              marginTop: 16,
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(67, 230, 163, 0.1)',
              border: '1px solid rgba(67, 230, 163, 0.25)',
              fontSize: 12,
              color: '#A7F3D0',
            }}>
              <strong>Recommended action:</strong> Don’t click. Verify through your bank’s official mobile app or phone helpline.
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================
          SECTION 4 — MULTIMODAL CHECKING (5 INTERACTIVE CARDS)
         ======================================================== */}
      <section id="multimodal-checking" style={{ padding: '80px 0 60px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 50px' }}>
          <Badge variant="cyan" style={{ marginBottom: 12 }}>MULTIMODAL SAFETY</Badge>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(30px, 3.6vw, 48px)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            margin: '0 0 16px',
            color: '#FFFFFF',
          }}>
            Whatever looks suspicious,<br />bring it to ORION.
          </h2>
          <p style={{ fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Scammers don't stick to one channel. Select any category to run a specialized check.
          </p>
        </div>

        {/* 5 Large Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))',
          gap: 18,
        }}>
          {modalities.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => {
                  if (onSelectCategory) onSelectCategory(item.id);
                  else onNavigateToCheck();
                }}
                style={{
                  background: 'var(--bg-card)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '28px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = 'var(--accent-cyan)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.5), 0 0 20px rgba(110, 231, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(110, 231, 255, 0.08)',
                  border: '1px solid rgba(110, 231, 255, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Icon size={22} color="var(--accent-cyan)" />
                </div>

                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>
                    {item.name}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    {item.desc}
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--accent-cyan)',
                  marginTop: 'auto',
                }}>
                  <span>Check {item.name.toLowerCase()}</span>
                  <ArrowRight size={13} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================
          SECTION 5 — "A SIMPLE ANSWER"
         ======================================================== */}
      <section id="simple-answer" style={{ padding: '80px 0 60px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 40px' }}>
          <Badge variant="cyan" style={{ marginBottom: 12 }}>CLEAR RESULTS</Badge>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(30px, 3.6vw, 48px)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            margin: '0 0 16px',
            color: '#FFFFFF',
          }}>
            A simple answer. Every time.
          </h2>
          <p style={{ fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            ORION doesn't just say "danger". It explains WHY and gives you clear guidance on what to do.
          </p>
        </div>

        {/* 3-Step Simple Answer Flow Card */}
        <div style={{
          maxWidth: 820,
          margin: '0 auto',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 'var(--radius-xl)',
          padding: 'clamp(24px, 4vw, 40px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}>
          {/* Step 1: Is it safe? */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 18 }}>
            <div>
              <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 700 }}>
                QUESTION 1
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginTop: 4 }}>
                Is it safe?
              </div>
            </div>
            <span style={{
              background: 'rgba(255, 92, 122, 0.18)',
              color: 'var(--danger)',
              border: '1px solid rgba(255, 92, 122, 0.4)',
              fontSize: 13,
              fontWeight: 800,
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
            }}>
              HIGH RISK
            </span>
          </div>

          {/* Step 2: Why? */}
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 18 }}>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)', fontWeight: 700 }}>
              QUESTION 2
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '4px 0 10px' }}>
              Why did ORION flag it?
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: 8, fontSize: 13, color: '#CBD5E1' }}>
                • Suspicious lookalike domain (.xyz)
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: 8, fontSize: 13, color: '#CBD5E1' }}>
                • Coercive language demanding immediate action
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: 8, fontSize: 13, color: '#CBD5E1' }}>
                • Unauthorized financial credentials request
              </div>
            </div>
          </div>

          {/* Step 3: What to do */}
          <div>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--success)', fontWeight: 700 }}>
              QUESTION 3
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '4px 0 10px' }}>
              What should you do?
            </div>
            <div style={{
              background: 'rgba(67, 230, 163, 0.08)',
              border: '1px solid rgba(67, 230, 163, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              fontSize: 14,
              lineHeight: 1.5,
              color: '#E2E8F0',
            }}>
              <strong style={{ color: 'var(--success)' }}>Do not enter your password or banking details.</strong><br />
              If you are concerned about your account, reach out to your bank directly using the phone number printed on the back of your card.
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 6 — BROWSER SHIELD
         ======================================================== */}
      <section id="browser-shield" style={{ padding: '80px 0 60px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))',
          gap: 48,
          alignItems: 'center',
        }}>
          {/* Left Context */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Badge variant="cyan">REAL-TIME PROTECTION</Badge>
            <h2 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(30px, 3.6vw, 48px)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              margin: 0,
              color: '#FFFFFF',
            }}>
              ORION Browser Shield
            </h2>
            <p style={{ fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Automatic protection as you browse. If you land on a deceptive site or lookalike portal, Browser Shield warns you before you enter your credentials.
            </p>

            <div style={{
              background: 'rgba(110, 231, 255, 0.05)',
              borderLeft: '3px solid var(--accent-cyan)',
              padding: '14px 18px',
              borderRadius: '0 var(--radius-md) var(--radius-md) 0',
            }}>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: 14, marginBottom: 2 }}>
                "ORION watches for security signals, not people."
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                No history tracking, no ad spying, and no passwords collected.
              </div>
            </div>

            <div>
              <Button
                variant="glow"
                size="md"
                onClick={onNavigateToBrowserShield}
                icon={ArrowRight}
              >
                Protect your browsing
              </Button>
            </div>
          </div>

          {/* Right Realistic Browser Mockup */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          }}>
            {/* Top Browser Bar */}
            <div style={{
              background: 'var(--bg-elevated)',
              padding: '12px 16px',
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

            {/* Browser Body with In-Page Warning Banner */}
            <div style={{ padding: 24, minHeight: 220, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{
                background: 'rgba(255, 92, 122, 0.1)',
                border: '1px solid rgba(255, 92, 122, 0.4)',
                borderRadius: 'var(--radius-lg)',
                padding: 20,
                boxShadow: '0 0 30px rgba(255, 92, 122, 0.2)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Shield size={16} color="var(--danger)" />
                    <strong style={{ fontSize: 13, color: '#fff', letterSpacing: '0.04em' }}>
                      ORION SHIELD
                    </strong>
                  </div>
                  <Badge variant="high">HIGH RISK</Badge>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                  Multiple warning signs detected on this page.
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 12 }}>
                  Suspicious domain lineage (.xyz) • Brand mismatch (claims official netbanking) • Unencrypted password target
                </div>
                <button
                  onClick={onNavigateToBrowserShield}
                  style={{
                    background: 'var(--danger)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: 6,
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  View why in ORION
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 7 — PRIVACY
         ======================================================== */}
      <section id="privacy" style={{ padding: '80px 0 60px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 48px' }}>
          <Badge variant="cyan" style={{ marginBottom: 12 }}>PRIVACY FIRST</Badge>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(30px, 3.6vw, 48px)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            margin: '0 0 16px',
            color: '#FFFFFF',
          }}>
            Security shouldn't require surveillance.
          </h2>
          <p style={{ fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            ORION is designed to help you understand digital threats without watching everything you do.
          </p>
        </div>

        {/* 5 Simple Trust Points */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
          gap: 16,
        }}>
          {[
            {
              title: 'No password collection',
              desc: 'Password fields are sanitized client-side before any check runs.',
              icon: KeyRound,
            },
            {
              title: 'No keystroke monitoring',
              desc: 'We never log keystrokes, clipboard history, or background typing.',
              icon: Lock,
            },
            {
              title: 'No cookies or session tokens',
              desc: 'Authentication headers and cookies are strictly excluded from checks.',
              icon: Shield,
            },
            {
              title: 'User-controlled analysis',
              desc: 'Analysis only runs when you ask ORION to inspect an item or page.',
              icon: Eye,
            },
            {
              title: 'Clear explanations',
              desc: 'You always see what was checked and why it triggered concern.',
              icon: FileCheck,
            },
          ].map((pt, idx) => {
            const Icon = pt.icon;
            return (
              <Card key={idx} style={{ padding: 22 }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(110, 231, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                  border: '1px solid rgba(110, 231, 255, 0.2)',
                }}>
                  <Icon size={18} color="var(--accent-cyan)" />
                </div>
                <h4 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>
                  {pt.title}
                </h4>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                  {pt.desc}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ========================================================
          SECTION 8 — HOW ORION WORKS (4 SIMPLE STEPS)
         ======================================================== */}
      <section id="how-it-works" style={{ padding: '80px 0 60px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 48px' }}>
          <Badge variant="violet" style={{ marginBottom: 12 }}>FOUR SIMPLE STEPS</Badge>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(30px, 3.6vw, 48px)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            margin: '0 0 16px',
            color: '#FFFFFF',
          }}>
            How ORION works.
          </h2>
          <p style={{ fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            No technical knowledge required. Four intuitive steps from uncertainty to confidence.
          </p>
        </div>

        {/* 4 Step Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
          gap: 16,
        }}>
          {[
            {
              step: '1',
              title: 'CHECK',
              headline: 'Give ORION something suspicious.',
              desc: 'Paste a link, forward a message, or drop a screenshot or recording.',
              accent: 'var(--accent-cyan)',
            },
            {
              step: '2',
              title: 'ANALYZE',
              headline: 'ORION looks for relevant signals.',
              desc: 'Checks domain history, structural targets, and deceptive indicators.',
              accent: '#38BDF8',
            },
            {
              step: '3',
              title: 'EXPLAIN',
              headline: 'See what triggered concern.',
              desc: 'Understand the exact reasons behind the verdict in plain language.',
              accent: 'var(--accent-violet)',
            },
            {
              step: '4',
              title: 'DECIDE',
              headline: 'Know what to do next.',
              desc: 'Clear, reassuring advice on how to proceed without exposing yourself.',
              accent: 'var(--success)',
            },
          ].map((s, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--bg-card)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 'var(--radius-lg)',
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 800,
                color: s.accent,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <span style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: `${s.accent}20`,
                  border: `1px solid ${s.accent}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                }}>
                  {s.step}
                </span>
                <span>{s.title}</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
                {s.headline}
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================
          SECTION 9 — ORION IS MORE THAN PHISHING
         ======================================================== */}
      <section id="threat-ecosystem" style={{ padding: '80px 0 60px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 48px' }}>
          <Badge variant="cyan" style={{ marginBottom: 12 }}>FULL-SPECTRUM DEFENSE</Badge>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(30px, 3.6vw, 48px)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            margin: '0 0 16px',
            color: '#FFFFFF',
          }}>
            ORION is more than phishing.
          </h2>
          <p style={{ fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Modern threats cross multiple channels. ORION covers the six most critical digital safety vectors.
          </p>
        </div>

        {/* 6 Category Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
          gap: 18,
        }}>
          {threatCategories.map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.id}
                onClick={() => {
                  if (onSelectCategory) onSelectCategory(t.modality);
                  else onNavigateToCheck();
                }}
                style={{
                  background: 'var(--bg-card)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 24,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = t.accent;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-md)',
                  background: `${t.accent}15`,
                  border: `1px solid ${t.accent}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={20} color={t.accent} />
                </div>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>
                    {t.title}
                  </h4>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    {t.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================
          SECTION 10 — BROWSER + PHONE (ECOSYSTEM)
         ======================================================== */}
      <section id="ecosystem" style={{ padding: '80px 0 60px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 48px' }}>
          <Badge variant="cyan" style={{ marginBottom: 12 }}>SEAMLESS CONTINUITY</Badge>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(30px, 3.6vw, 48px)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            margin: '0 0 16px',
            color: '#FFFFFF',
          }}>
            ORION goes where your digital life goes.
          </h2>
          <p style={{ fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Protection stays consistent whether you're reviewing an alert on your phone or surfing the web on your laptop.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: 20,
        }}>
          <div style={{
            background: 'var(--bg-card)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-lg)',
            padding: 28,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            <Smartphone size={28} color="var(--accent-cyan)" />
            <h4 style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: 0 }}>On your phone</h4>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Instantly check suspicious SMS alerts, WhatsApp forwards, urgent voice messages, and payment links.
            </p>
            <div style={{ marginTop: 'auto', paddingTop: 8 }}>
              <button
                onClick={onNavigateToMobileApp}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent-cyan)',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: 0,
                }}
              >
                <span>EXPLORE THE MOBILE APP</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-card)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-lg)',
            padding: 28,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            <Laptop size={28} color="#38BDF8" />
            <h4 style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: 0 }}>In your browser</h4>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Browser Shield automatically flags deceptive lookalikes and unencrypted credential-harvesting portals.
            </p>
          </div>

          <div style={{
            background: 'var(--bg-card)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-lg)',
            padding: 28,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            <Layers size={28} color="var(--accent-violet)" />
            <h4 style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: 0 }}>Personal workspace</h4>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Review your previous checks, stay updated on verified community alerts, and manage your privacy preferences.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================
          PRICING TEASER SECTION
         ======================================================== */}
      <section id="pricing-teaser" style={{ padding: '60px 0', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(11, 16, 26, 0.9), rgba(15, 23, 42, 0.9))',
          border: '1px solid var(--border-glow)',
          borderRadius: 'var(--radius-xl)',
          padding: '40px clamp(24px, 4vw, 56px)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 28,
        }}>
          <div>
            <Badge variant="cyan" style={{ marginBottom: 8 }}>TRANSPARENT PLANS</Badge>
            <h3 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>
              Choose the protection that fits you.
            </h3>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: 0, maxWidth: 500, lineHeight: 1.5 }}>
              Free for personal safety checks, with scalable protection for power users, families, and security teams.
            </p>
          </div>

          <Button
            variant="outline"
            size="lg"
            onClick={onNavigateToPricing}
            icon={ArrowRight}
          >
            SEE PLANS
          </Button>
        </div>
      </section>

      {/* ========================================================
          SECTION 11 — FINAL CALL TO ACTION
         ======================================================== */}
      <section style={{
        padding: '100px 0 80px',
        textAlign: 'center',
        position: 'relative',
        borderTop: '1px solid rgba(255, 255, 255, 0.06)',
      }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <Badge variant="cyan">A SECOND OPINION</Badge>

          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(36px, 4.8vw, 64px)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.035em',
            margin: 0,
            color: '#FFFFFF',
          }}>
            Not sure?<br />
            <span style={{
              background: 'linear-gradient(135deg, #6EE7FF 0%, #A5B4FC 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Check it.
            </span>
          </h2>

          <p style={{ fontSize: 19, color: 'var(--text-secondary)', maxWidth: 480, lineHeight: 1.6, margin: 0 }}>
            Before you click. Before you pay. Before you reply.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 8 }}>
            <Button
              variant="glow"
              size="lg"
              onClick={onNavigateToCheck}
              icon={ArrowRight}
            >
              Check something
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={onNavigateToBrowserShield}
            >
              Get ORION Shield
            </Button>
          </div>

          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12 }}>
            ORION — Digital safety, made understandable. Free for personal safety checks.
          </div>
        </div>
      </section>

      {/* ========================================================
          SECTION 12 — MINIMAL CITIZEN FOOTER
         ======================================================== */}
      <footer style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '48px 0 30px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
        fontSize: 14,
        color: 'var(--text-muted)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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
            fontSize: 14,
          }}>
            O
          </div>
          <span style={{ fontWeight: 800, color: '#fff', fontSize: 16 }}>
            ORION
          </span>
          <span style={{ color: 'var(--text-dim)' }}>•</span>
          <span>Digital safety, made understandable.</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
          <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onClick={onNavigateToCheck}>
            Check Something
          </span>
          <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onClick={onNavigateToBrowserShield}>
            Browser Shield
          </span>
          <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onClick={() => {
            const el = document.getElementById('how-it-works');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}>
            How It Works
          </span>
          <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onClick={() => {
            const el = document.getElementById('privacy');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}>
            Privacy
          </span>
          <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onClick={onNavigateToLogin}>
            Sign In
          </span>
        </div>
      </footer>

    </div>
  );
}

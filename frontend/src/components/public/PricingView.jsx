import React, { useState } from 'react';
import { 
  Check, 
  Shield, 
  ArrowRight, 
  Sparkles, 
  Building2, 
  User, 
  Lock, 
  Globe, 
  MessageSquare, 
  Video, 
  SlidersHorizontal 
} from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Card from '../ui/Card';

export default function PricingView({ 
  onNavigateToSignup, 
  onNavigateToLogin, 
  onSwitchToAnalyst,
  isAuthenticated = false 
}) {
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);

  const plans = [
    {
      id: 'free',
      name: 'FREE',
      price: '₹0',
      period: 'forever free',
      badge: 'FOR CITIZENS',
      badgeVariant: 'cyan',
      subtitle: 'Basic citizen-level protection for everyday digital life.',
      features: [
        'Link & website safety checking',
        'SMS & text message inspection',
        'Basic media & screenshot analysis',
        'ORION Browser Shield extension',
        'Personal check history (up to 100 items)',
        'Plain-language risk explanations',
      ],
      ctaText: isAuthenticated ? 'Go to Personal Workspace' : 'Get Started Free',
      ctaAction: () => {
        if (isAuthenticated) {
          window.dispatchEvent(new CustomEvent('orion-navigate', { detail: 'app-dashboard' }));
        } else {
          onNavigateToSignup('app-check');
        }
      },
      highlight: false,
    },
    {
      id: 'plus',
      name: 'ORION PLUS',
      price: 'Coming Soon',
      period: 'waitlist open',
      badge: 'POPULAR CHOICE',
      badgeVariant: 'violet',
      subtitle: 'More protection for families and power digital users.',
      features: [
        'Everything in Free tier',
        'Deepfake voice & video inspection',
        'Multi-device Browser Shield sync',
        'Family alert notifications',
        'Priority AI inference queue',
        'Automated file & attachment scan',
      ],
      ctaText: waitlistSuccess ? 'Joined Waitlist ✓' : 'Join Waitlist',
      ctaAction: () => setWaitlistSuccess(true),
      highlight: true,
    },
    {
      id: 'organizations',
      name: 'ORGANIZATIONS',
      price: "Let's Talk",
      period: 'custom team deployment',
      badge: 'TEAMS & SOC',
      badgeVariant: 'high',
      subtitle: 'Complete cyber threat intelligence & incident investigation.',
      features: [
        'Full SOC Command Center dashboard',
        'Incident investigation & evidence graph',
        'Multi-modal threat intelligence feeds',
        'XAI evidence generator & decision tree',
        'Automated response playbooks & webhooks',
        'Enterprise identity registry & audit log',
      ],
      ctaText: 'Explore for Teams',
      ctaAction: () => {
        if (onSwitchToAnalyst) {
          onSwitchToAnalyst();
        } else if (onNavigateToLogin) {
          onNavigateToLogin('overview');
        }
      },
      highlight: false,
    }
  ];

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px 100px', color: 'var(--text-main)' }}>
      
      {/* HEADER SECTION */}
      <section style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 60px' }}>
        <Badge variant="cyan" style={{ marginBottom: 14 }}>TRANSPARENT PROTECTION</Badge>
        
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(36px, 4.5vw, 60px)',
          fontWeight: 800,
          lineHeight: 1.12,
          letterSpacing: '-0.03em',
          margin: '0 0 18px',
          color: '#FFFFFF',
        }}>
          Simple, transparent digital safety<br />
          <span style={{
            background: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            for everyone.
          </span>
        </h1>

        <p style={{
          fontSize: 'clamp(16px, 1.2vw, 19px)',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
          margin: 0,
        }}>
          Always free for everyday citizens checking suspicious links and messages. Upgrade options available as your safety needs grow.
        </p>
      </section>

      {/* PRICING CARDS GRID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 330px), 1fr))',
        gap: 24,
        alignItems: 'stretch',
      }}>
        {plans.map((plan) => (
          <div
            key={plan.id}
            style={{
              background: plan.highlight 
                ? 'linear-gradient(180deg, rgba(59, 130, 246, 0.12) 0%, rgba(10, 14, 23, 0.95) 100%)' 
                : 'var(--bg-card)',
              backdropFilter: 'blur(20px)',
              border: plan.highlight 
                ? '1px solid rgba(59, 130, 246, 0.45)' 
                : '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 'var(--radius-xl)',
              padding: '32px 26px',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              boxShadow: plan.highlight ? '0 20px 50px rgba(59, 130, 246, 0.15)' : 'none',
              position: 'relative',
            }}
          >
            {/* Top Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Badge variant={plan.badgeVariant}>{plan.badge}</Badge>
              {plan.highlight && (
                <span style={{ fontSize: 11, color: 'var(--accent-violet)', fontWeight: 800 }}>★ RECOMMENDED</span>
              )}
            </div>

            {/* Title & Price */}
            <div>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>
                {plan.name}
              </h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 38,
                  fontWeight: 900,
                  color: '#fff',
                  letterSpacing: '-0.02em',
                }}>
                  {plan.price}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/ {plan.period}</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '10px 0 0', lineHeight: 1.5 }}>
                {plan.subtitle}
              </p>
            </div>

            <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.08)' }} />

            {/* Feature List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                INCLUDED CAPABILITIES:
              </div>
              {plan.features.map((feat, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#CBD5E1' }}>
                  <Check size={16} color={plan.highlight ? 'var(--accent-violet)' : 'var(--accent-cyan)'} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <Button
              variant={plan.highlight ? 'glow' : 'outline'}
              size="lg"
              onClick={plan.ctaAction}
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            >
              {plan.ctaText}
            </Button>
          </div>
        ))}
      </div>

      {/* TRUST FOOTER NOTE */}
      <div style={{
        marginTop: 60,
        textAlign: 'center',
        padding: '24px',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: 'var(--radius-lg)',
        fontSize: 14,
        color: 'var(--text-secondary)',
      }}>
        💡 <strong>Privacy Promise:</strong> Free safety checks do not sell your personal data or target you with advertisements. All checks remain strictly private.
      </div>

    </div>
  );
}

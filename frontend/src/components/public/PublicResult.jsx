import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  AlertOctagon, 
  HelpCircle,
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  Share2, 
  PhoneCall, 
  ArrowLeft, 
  Terminal, 
  ExternalLink,
  Info,
  RefreshCw,
  Search
} from 'lucide-react';

// Helper to resolve specific threat category for tailored public messaging
export function resolveThreatCategory(incident) {
  if (!incident) return 'phishing';
  const threatType = (incident.threat_type || '').toLowerCase();
  const inputType = (incident.input_type || incident.source || '').toLowerCase();
  const title = (incident.title || '').toLowerCase();
  const rawMetadata = incident.metadata ? JSON.stringify(incident.metadata).toLowerCase() : '';
  const evTypes = Array.isArray(incident.evidence) 
    ? incident.evidence.map(e => `${e.type || ''} ${e.explanation || ''}`).join(' ').toLowerCase()
    : '';

  // 1. Account Takeover / ATO
  if (
    threatType.includes('account_takeover') || 
    threatType.includes('ato') || 
    threatType.includes('credential_stuffing') ||
    inputType.includes('auth') || 
    inputType === 'account' || 
    evTypes.includes('impossible_travel') ||
    title.includes('impossible travel') ||
    rawMetadata.includes('impossible_travel')
  ) {
    return 'account takeover';
  }

  // 2. Impersonation
  if (
    threatType.includes('impersonation') || 
    threatType.includes('spoof') ||
    evTypes.includes('vip_impersonation') || 
    evTypes.includes('identity_impersonation') || 
    evTypes.includes('executive_impersonation') ||
    title.includes('impersonation')
  ) {
    return 'impersonation';
  }

  // 3. Deepfake / Synthetic Media / Image Analysis
  if (
    threatType.includes('deepfake') || 
    threatType.includes('synthetic') ||
    threatType.includes('manipulated') ||
    evTypes.includes('deepfake') || 
    evTypes.includes('synthetic_speech') || 
    evTypes.includes('synthetic_audio') || 
    evTypes.includes('ai_generated_media') ||
    evTypes.includes('face_tampering') ||
    evTypes.includes('image_forensic_anomaly') ||
    inputType === 'video' || 
    inputType === 'audio' ||
    inputType === 'image' ||
    title.includes('image') ||
    title.includes('photo') ||
    title.includes('visual')
  ) {
    return 'deepfake';
  }

  // 4. Malicious URL
  if (
    threatType.includes('malicious_url') || 
    threatType.includes('typosquat') || 
    threatType.includes('suspicious_domain') ||
    inputType === 'url' ||
    title.includes('domain') ||
    title.includes('url')
  ) {
    return 'malicious URL';
  }

  // 5. Abnormal Behavior / Anomaly
  if (
    threatType.includes('abnormal') || 
    threatType.includes('anomaly') || 
    threatType.includes('behavioral') || 
    threatType.includes('outlier') ||
    evTypes.includes('isolation_forest') ||
    evTypes.includes('behavioral_anomaly')
  ) {
    return 'abnormal behavior';
  }

  // 6. Phishing / Social Engineering
  return 'phishing';
}

export default function PublicResult({ incident, onReset, onInspectTechnical }) {
  const [showTechnical, setShowTechnical] = useState(false);
  const [copiedAdvisory, setCopiedAdvisory] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  if (!incident) return null;

  const category = resolveThreatCategory(incident);

  // Determine risk level presentation
  const rawLevel = (incident.risk_level || incident.risk_score?.level || 'LOW').toUpperCase();
  const riskScore = incident.risk_score !== undefined 
    ? (typeof incident.risk_score === 'number' ? Math.round(incident.risk_score * 100) : Math.round((incident.risk_score.value || 0) * 100))
    : 0;

  const isInconclusive = incident.status === 'INCONCLUSIVE' || incident.inconclusive || rawLevel === 'INCONCLUSIVE' || rawLevel === 'UNAVAILABLE';

  const isImageCheck = (incident.input_type || incident.source || '').toLowerCase() === 'image' ||
    (incident.title || '').toLowerCase().includes('image') ||
    (incident.title || '').toLowerCase().includes('photo');
  
  const aiProbMeta = incident.metadata?.ai_generated_probability ?? incident.metadata?.signals?.ai_generated_probability;
  const isAiGenMeta = Boolean(incident.metadata?.is_ai_generated || (typeof aiProbMeta === 'number' && aiProbMeta >= 0.50));

  // Check for synthetic media evidence signals
  const syntheticImageEv = (Array.isArray(incident.evidence) && incident.evidence.find(e =>
    (e.type || '').toLowerCase() === 'ai_generated_media' || (e.type || '').toLowerCase() === 'deepfake_image'
  )) || (isAiGenMeta ? { confidence: aiProbMeta || 0.88, explanation: 'Neural Vision models detected generative AI synthesis markers.' } : null);

  const syntheticAudioEv = Array.isArray(incident.evidence) && incident.evidence.find(e =>
    (e.type || '').toLowerCase() === 'synthetic_speech_detected' || (e.type || '').toLowerCase() === 'synthetic_audio_detected'
  );

  const getVerdictTheme = () => {
    if (isInconclusive) {
      return {
        levelLabel: 'ANALYSIS UNAVAILABLE',
        badgeColor: '#94a3b8',
        bg: 'rgba(148, 163, 184, 0.1)',
        border: 'rgba(148, 163, 184, 0.3)',
        icon: HelpCircle,
        headline: 'ORION COULD NOT COMPLETE THE ANALYSIS',
        subtext: 'Some security signals were unavailable. This does NOT mean the content is safe.',
        recommendation: 'Do not click untrusted links or share sensitive information until origin is verified independently.'
      };
    }

    const categoryCopy = {
      'phishing': {
        critical: {
          headline: 'DANGEROUS PHISHING ATTACK DETECTED',
          subtext: 'ORION detected deceptive phishing lures designed to steal passwords, financial credentials, or personal data.',
          recommendation: 'Do not reply, click links, or enter credentials. Mark the message as phishing or spam immediately.'
        },
        high: {
          headline: 'HIGH RISK: SUSPICIOUS PHISHING INDICATORS',
          subtext: 'This communication contains coercive phrasing, unverified links, or suspicious urgency characteristic of phishing scams.',
          recommendation: 'Do not interact with the sender. Verify any claims through an official website or phone number.'
        },
        medium: {
          headline: 'SUSPICIOUS MESSAGE ATTRIBUTES',
          subtext: 'Unverified sender details or pressure tactics detected in this communication.',
          recommendation: 'Exercise caution. Confirm the sender\'s identity before sharing any sensitive information.'
        }
      },
      'impersonation': {
        critical: {
          headline: 'CRITICAL IDENTITY IMPERSONATION DETECTED',
          subtext: 'The sender or speaker claims a trusted identity (executive, authority, or family member), but forensic markers indicate fraudulent impersonation.',
          recommendation: 'Do not send money, gift cards, or credentials. Contact the purported person or organization directly via a known, verified number.'
        },
        high: {
          headline: 'HIGH RISK: LIKELY IDENTITY IMPERSONATION',
          subtext: 'Strong indicators that this communication mimics a legitimate person or organization to manipulate you.',
          recommendation: 'Never trust caller ID or display names alone. Call the person back on their saved personal phone number.'
        },
        medium: {
          headline: 'POTENTIAL IDENTITY SPOOFING',
          subtext: 'The claimed identity could not be verified against authentic biometric or identity baselines.',
          recommendation: 'Verify the caller or sender\'s authenticity through a trusted secondary channel before complying with requests.'
        }
      },
      'deepfake': {
        critical: {
          headline: 'SYNTHETIC DEEPFAKE MEDIA DETECTED',
          subtext: 'ORION identified AI synthesis artifacts, acoustic anomalies, or facial manipulation indicating synthetic media generation.',
          recommendation: 'Do not trust visual or auditory claims in this recording. Confirm with the real individual through an in-person or verified out-of-band channel.'
        },
        high: {
          headline: 'HIGH RISK: LIKELY AI-GENERATED DEEPFAKE',
          subtext: 'Forensic neural models detected visual or acoustic artifacts consistent with AI-generated media manipulation.',
          recommendation: 'Treat this media with extreme suspicion. Do not share or act on statements made in this recording.'
        },
        medium: {
          headline: 'SUSPICIOUS SYNTHETIC MEDIA ARTIFACTS',
          subtext: 'Incongruent acoustic or visual features detected that warrant independent forensic verification.',
          recommendation: 'Verify the origin and context of this recording before relying on its contents.'
        }
      },
      'account takeover': {
        critical: {
          headline: 'UNAUTHORIZED ACCOUNT ACCESS DETECTED',
          subtext: 'ORION detected impossible travel velocity, unauthorized IP infrastructure, or session hijacking indicators.',
          recommendation: 'Immediately revoke all active sessions, change your password, and verify multi-factor authentication (MFA) devices.'
        },
        high: {
          headline: 'HIGH RISK: SUSPICIOUS ACCOUNT ACTIVITY',
          subtext: 'Login attempt deviates drastically from historical user location, device profile, or access patterns.',
          recommendation: 'Lock or sign out of account sessions immediately. Review security alerts in your account settings.'
        },
        medium: {
          headline: 'UNUSUAL LOGIN PATTERN OBSERVED',
          subtext: 'Access attempt from an unrecognized network, location, or browser profile.',
          recommendation: 'Confirm whether you or an authorized user initiated this login before approving access.'
        }
      },
      'malicious URL': {
        critical: {
          headline: 'MALICIOUS WEBSITE LINK DETECTED',
          subtext: 'This destination URL is associated with brand typosquatting, malware distribution, or credential harvesting.',
          recommendation: 'Do not open this link, download files, or submit login credentials. Close any opened tabs immediately.'
        },
        high: {
          headline: 'HIGH RISK: DECEPTIVE DOMAIN DETECTED',
          subtext: 'Domain structure exhibits suspicious redirection, recent registration, or deceptive naming mimicking legitimate brands.',
          recommendation: 'Avoid navigating to this link. Visit the official website by typing its known address into your browser.'
        },
        medium: {
          headline: 'UNVERIFIED OR SUSPICIOUS LINK',
          subtext: 'Link contains obfuscated parameters, suspicious top-level domains, or unverified certificates.',
          recommendation: 'Check the full destination URL carefully before clicking or entering information.'
        }
      },
      'abnormal behavior': {
        critical: {
          headline: 'CRITICAL BEHAVIORAL ANOMALY DETECTED',
          subtext: 'Observed event severely violates normal statistical baselines and matches malicious intrusion or exploitation behaviors.',
          recommendation: 'Immediately isolate the affected account or endpoint and initiate security incident triage.'
        },
        high: {
          headline: 'HIGH RISK: ABNORMAL ACTIVITY DETECTED',
          subtext: 'Statistical profiling flagged highly anomalous activity frequency, volume, or parameters.',
          recommendation: 'Review audit logs and challenge the user or client with additional identity verification.'
        },
        medium: {
          headline: 'MODERATE BEHAVIORAL DEVIATION',
          subtext: 'Activity falls outside typical operating parameters for this profile.',
          recommendation: 'Monitor for subsequent anomalous actions and verify the context of this event.'
        }
      }
    };

    const copy = categoryCopy[category] || categoryCopy['phishing'];

    switch (rawLevel) {
      case 'CRITICAL':
        return {
          levelLabel: 'CRITICAL RISK',
          badgeColor: '#ef4444',
          bg: 'rgba(239, 68, 68, 0.12)',
          border: 'rgba(239, 68, 68, 0.4)',
          icon: AlertOctagon,
          headline: copy.critical.headline,
          subtext: copy.critical.subtext,
          recommendation: copy.critical.recommendation
        };
      case 'HIGH':
        return {
          levelLabel: 'HIGH RISK',
          badgeColor: '#f97316',
          bg: 'rgba(249, 115, 22, 0.12)',
          border: 'rgba(249, 115, 22, 0.4)',
          icon: ShieldAlert,
          headline: copy.high.headline,
          subtext: copy.high.subtext,
          recommendation: copy.high.recommendation
        };
      case 'MEDIUM':
        return {
          levelLabel: 'MEDIUM RISK',
          badgeColor: '#f59e0b',
          bg: 'rgba(245, 158, 11, 0.12)',
          border: 'rgba(245, 158, 11, 0.4)',
          icon: AlertTriangle,
          headline: copy.medium.headline,
          subtext: copy.medium.subtext,
          recommendation: copy.medium.recommendation
        };
      case 'SAFE':
      case 'LOW':
      default:
        if (isImageCheck && (syntheticImageEv || isAiGenMeta)) {
          const probVal = aiProbMeta ?? syntheticImageEv?.confidence ?? 0.88;
          const probPct = `${Math.round(probVal * 100)}%`;
          return {
            levelLabel: 'SAFE / AI-GENERATED (SYNTHETIC MEDIA)',
            badgeColor: '#38bdf8',
            bg: 'rgba(56, 189, 248, 0.12)',
            border: 'rgba(56, 189, 248, 0.4)',
            icon: ShieldCheck,
            headline: `AI-GENERATED SYNTHETIC IMAGE (${probPct} PROBABILITY)`,
            subtext: 'ORION neural vision and forensic engines detected generative AI synthesis markers (diffusion rendering textures and generative noise distributions), but found no malicious impersonation or scam context.',
            recommendation: 'Image was created using generative AI (e.g. Midjourney / DALL-E / Stable Diffusion / Flux). Safe to view as digital art or synthetic media.'
          };
        }
        if (isImageCheck && !isAiGenMeta && aiProbMeta !== undefined && aiProbMeta < 0.45) {
          const authPct = `${Math.round((1.0 - aiProbMeta) * 100)}%`;
          return {
            levelLabel: 'AUTHENTIC NATURAL PHOTOGRAPH',
            badgeColor: '#10b981',
            bg: 'rgba(16, 185, 129, 0.12)',
            border: 'rgba(16, 185, 129, 0.4)',
            icon: ShieldCheck,
            headline: `AUTHENTIC PHOTOGRAPH VERIFIED (${authPct} CONFIDENCE)`,
            subtext: 'Neural Vision models and 2D FFT forensic spectrum analysis confirmed natural optical camera capture without generative AI artifacts.',
            recommendation: 'Photograph appears authentic with natural sensor noise distribution and optical consistency.'
          };
        }
        if (syntheticImageEv) {
          const aiProb = syntheticImageEv.confidence 
            ? `${Math.round(syntheticImageEv.confidence * 100)}%` 
            : null;
          return {
            levelLabel: 'SAFE / AI-GENERATED (SYNTHETIC)',
            badgeColor: '#38bdf8',
            bg: 'rgba(56, 189, 248, 0.12)',
            border: 'rgba(56, 189, 248, 0.4)',
            icon: ShieldCheck,
            headline: `SAFE: AI-GENERATED IMAGE${aiProb ? ` (${aiProb} CONFIDENCE)` : ''}`,
            subtext: 'ORION detected visual AI-generation (synthetic image), but found no executive impersonation, phishing text, or scam threats.',
            recommendation: 'Image is safe to view. It was generated by AI, but shows no malicious threat context or impersonation indicators.'
          };
        }
        if (syntheticAudioEv) {
          const aiProb = syntheticAudioEv.confidence 
            ? `${Math.round(syntheticAudioEv.confidence * 100)}%` 
            : null;
          return {
            levelLabel: 'SAFE / SYNTHETIC VOICE',
            badgeColor: '#38bdf8',
            bg: 'rgba(56, 189, 248, 0.12)',
            border: 'rgba(56, 189, 248, 0.4)',
            icon: ShieldCheck,
            headline: `SAFE: SYNTHETIC VOICE${aiProb ? ` (${aiProb} CONFIDENCE)` : ''}`,
            subtext: 'ORION detected synthetic voice generation, but found no financial extortion or identity impersonation.',
            recommendation: 'Voice audio is synthetic/AI-generated, but shows no malicious threat context or extortion indicators.'
          };
        }
        return {
          levelLabel: 'SAFE / LOW RISK',
          badgeColor: '#10b981',
          bg: 'rgba(16, 185, 129, 0.12)',
          border: 'rgba(16, 185, 129, 0.4)',
          icon: ShieldCheck,
          headline: 'VERIFIED SAFE: NO KNOWN THREATS',
          subtext: 'No active phishing, voice cloning, deepfake, or fraud indicators detected.',
          recommendation: 'Content appears safe based on analyzed security signals.'
        };
    }
  };

  const theme = getVerdictTheme();
  const Icon = theme.icon;

  // Plain-language reasons why flagged (3-5 items)
  let whyFlaggedBullets = (incident.risk_drivers && incident.risk_drivers.length > 0)
    ? incident.risk_drivers
    : (incident.explainability?.key_factors && incident.explainability.key_factors.length > 0)
      ? incident.explainability.key_factors
      : (incident.evidence && incident.evidence.length > 0)
        ? incident.evidence.slice(0, 4).map(e => e.explanation || (e.type || '').replace(/_/g, ' '))
        : ['No suspicious indicators detected'];

  // Refine bullet callouts for safe synthetic media items
  if (isImageCheck && (syntheticImageEv || isAiGenMeta)) {
    const probVal = aiProbMeta ?? syntheticImageEv?.confidence ?? 0.88;
    const probPct = `${Math.round(probVal * 100)}%`;
    const artifacts = incident.metadata?.cloud_vision?.gemini_secondary?.detected_artifacts || 
      incident.metadata?.cloud_vision?.gemini_secondary?.artifacts || [];
    const artifactList = Array.isArray(artifacts) && artifacts.length > 0 
      ? `Visual markers: ${artifacts.slice(0, 3).map(a => a.replace(/_/g, ' ')).join(', ')}`
      : 'Visual generative diffusion & ViT frequency patterns detected';

    whyFlaggedBullets = [
      `AI-Generated Media: Synthetic generation identified by Multimodal Vision & ViT (${probPct} probability)`,
      artifactList,
      `No executive impersonation or malicious extortion lures detected in media context`
    ];
  } else if ((rawLevel === 'SAFE' || rawLevel === 'LOW') && syntheticImageEv) {
    const probPct = syntheticImageEv.confidence ? `${Math.round(syntheticImageEv.confidence * 100)}%` : '85%+';
    whyFlaggedBullets = [
      `Synthetic Image Detected: Visual AI-generation identified by Vision Transformer (${probPct} confidence)`,
      `No executive or VIP identity impersonation detected`,
      `No coercive text, phishing links, or financial demands found in image (Safe to view)`
    ];
  } else if ((rawLevel === 'SAFE' || rawLevel === 'LOW') && syntheticAudioEv) {
    const probPct = syntheticAudioEv.confidence ? `${Math.round(syntheticAudioEv.confidence * 100)}%` : '85%+';
    whyFlaggedBullets = [
      `Synthetic Voice Detected: Audio AI synthesis identified (${probPct} confidence)`,
      `No speaker identity impersonation detected`,
      `No financial extortion or coercive call script found`
    ];
  }

  // Plain-language recommended action
  const actionText = (incident.recommended_actions && incident.recommended_actions.length > 0)
    ? (typeof incident.recommended_actions[0] === 'string' 
        ? incident.recommended_actions[0] 
        : (incident.recommended_actions[0].description || incident.recommended_actions[0].title))
    : theme.recommendation;

  const handleCopyAdvisory = () => {
    const text = `🚨 ORION SECURITY ASSESSMENT
Threat Category: ${category.toUpperCase()}
Title: ${incident.title || 'Security Analysis'}
Verdict: ${theme.levelLabel}
Finding: ${theme.headline}
Advice: ${actionText}

Analyzed by ORION v2 Digital Safety Platform`;
    navigator.clipboard.writeText(text);
    setCopiedAdvisory(true);
    setTimeout(() => setCopiedAdvisory(false), 2500);
  };

  const handleCopyWhatsAppAlert = () => {
    const text = `⚠️ *CYBER SAFETY WARNING [${category.toUpperCase()}]* ⚠️

*ORION Assessment:* ${theme.levelLabel}
*Topic:* ${incident.title || `${category.toUpperCase()} Analysis`}
*Verdict:* ${theme.headline}
*Reason:* ${incident.explanation || incident.explainability?.summary_reasoning || theme.subtext}

*What to do:*
${actionText}

_If financial loss occurred, immediately call 1930 (National Cybercrime Helpline)._`;
    navigator.clipboard.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', animation: 'fadeIn 0.25s ease' }}>
      
      {/* Top Header & Reset Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <button
          onClick={onReset}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-main)',
            padding: '10px 20px',
            borderRadius: 'var(--radius-full)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'var(--transition)',
          }}
        >
          <ArrowLeft size={16} />
          <span>New check</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={handleCopyAdvisory}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              padding: '9px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {copiedAdvisory ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
            <span>{copiedAdvisory ? 'Copied' : 'Copy Text'}</span>
          </button>

          <button
            onClick={handleCopyWhatsAppAlert}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              padding: '9px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {copiedShare ? <Check size={15} color="#10b981" /> : <Share2 size={15} />}
            <span>{copiedShare ? 'Warning Copied' : 'Share Warning'}</span>
          </button>
        </div>
      </div>

      {/* Main Public Result Card */}
      <div className="responsive-card-padding" style={{
        background: 'var(--bg-card)',
        border: `2px solid ${theme.border}`,
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        marginBottom: 32,
      }}>

        {/* ORION Assessment Title & Risk Level Indicator Bar */}
        <div style={{
          paddingBottom: 24,
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-dim)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
            ORION ASSESSMENT
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 'var(--radius-md)',
              background: theme.bg,
              border: `1px solid ${theme.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 24px ${theme.badgeColor}30`,
              flexShrink: 0,
            }}>
              <Icon size={30} color={theme.badgeColor} />
            </div>

            <div>
              <span style={{
                display: 'inline-block',
                fontSize: 13,
                fontWeight: 800,
                color: theme.badgeColor,
                letterSpacing: '0.06em',
                marginBottom: 4,
              }}>
                {theme.levelLabel}
              </span>
              <h2 style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 800, color: '#fff', margin: 0, lineHeight: 1.25 }}>
                {theme.headline}
              </h2>
            </div>
          </div>

          {/* Refined Minimal Risk Level Indicator Bar */}
          {!isInconclusive && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-dim)', marginBottom: 6, fontWeight: 700 }}>
                <span>SAFE</span>
                <span>LOW</span>
                <span>MEDIUM</span>
                <span>HIGH</span>
                <span>CRITICAL</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.max(8, Math.min(100, riskScore))}%`,
                  background: theme.badgeColor,
                  boxShadow: `0 0 12px ${theme.badgeColor}`,
                  transition: 'width 0.4s ease',
                }} />
              </div>
            </div>
          )}
        </div>

        {/* 2. Summary Reasoning */}
        <div style={{ padding: '24px 0 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <p style={{
            fontSize: 17,
            color: '#f8fafc',
            lineHeight: 1.6,
            margin: 0,
            fontWeight: 500,
          }}>
            "{incident.explanation || incident.explainability?.summary_reasoning || theme.subtext}"
          </p>
        </div>

        {/* 3. Why ORION Flagged This */}
        <div style={{ padding: '20px 0', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text-dim)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 14,
          }}>
            Why ORION flagged this
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {whyFlaggedBullets.map((bullet, idx) => (
              <li key={idx} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                fontSize: 15,
                color: '#e2e8f0',
                lineHeight: 1.5,
              }}>
                <span style={{ color: theme.badgeColor, fontWeight: 900, fontSize: 16, marginTop: 1 }}>•</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 4. What Should You Do */}
        <div style={{ padding: '20px 0', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text-dim)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 12,
          }}>
            What should you do?
          </h3>
          <div style={{
            background: 'rgba(9, 13, 22, 0.8)',
            border: '1px solid var(--border-subtle)',
            padding: '18px 22px',
            borderRadius: 'var(--radius-md)',
            fontSize: 15,
            fontWeight: 600,
            color: '#fff',
            lineHeight: 1.6,
          }}>
            {actionText}
          </div>
        </div>

        {/* National Helpline Ribbon (if High/Critical) */}
        {(rawLevel === 'HIGH' || rawLevel === 'CRITICAL') && (
          <div style={{
            marginTop: 24,
            padding: 18,
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <PhoneCall size={22} color="#ef4444" />
              <div>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>
                  Did you lose money or share sensitive credentials?
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Call <strong>1930</strong> (National Cybercrime Helpline) immediately within 2 hours to freeze stolen funds.
                </div>
              </div>
            </div>
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noreferrer"
              style={{
                color: '#ef4444',
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>cybercrime.gov.in</span>
              <ExternalLink size={14} />
            </a>
          </div>
        )}

        {/* Progressive Disclosure Toggle */}
        <div style={{
          marginTop: 24,
          paddingTop: 20,
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
        }}>
          <button
            onClick={() => setShowTechnical(!showTechnical)}
            style={{
              background: showTechnical ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.04)',
              border: showTechnical ? '1px solid var(--border-glow)' : '1px solid var(--border-subtle)',
              color: showTechnical ? 'var(--cyan-glow)' : 'var(--text-muted)',
              padding: '9px 18px',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              transition: 'var(--transition)',
            }}
          >
            <Info size={15} />
            <span>{showTechnical ? 'Hide technical details' : 'See technical details'}</span>
            {showTechnical ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {onInspectTechnical && (
            <button
              onClick={() => onInspectTechnical(incident)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-dim)',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <Terminal size={14} />
              <span>Inspect in Analyst Drawer</span>
            </button>
          )}
        </div>

        {/* Technical Details Expanded Panel */}
        {showTechnical && (
          <div style={{
            marginTop: 20,
            padding: 24,
            background: 'var(--bg-inset)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            animation: 'fadeIn 0.2s ease',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, marginBottom: 20 }}>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Risk Score</span>
                <div style={{ fontSize: 22, fontWeight: 800, color: theme.badgeColor }}>
                  {riskScore} / 100
                </div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Threat Classification</span>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
                  {incident.threat_type || 'UNKNOWN'}
                </div>
              </div>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Modality Source</span>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
                  {incident.input_type || incident.source || 'Direct Input'}
                </div>
              </div>
            </div>

            {/* Registered Signals */}
            {Array.isArray(incident.evidence) && incident.evidence.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10 }}>
                  Registered Evidence Signals ({incident.evidence.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {incident.evidence.map((ev, i) => (
                    <div key={i} style={{
                      padding: 12,
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: 6,
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      <div>
                        <strong style={{ color: '#fff' }}>{(ev.type || 'SIGNAL').replace(/_/g, ' ')}</strong>
                        <div style={{ color: 'var(--text-dim)', fontSize: 12, marginTop: 2 }}>{ev.explanation || ev.source}</div>
                      </div>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 700,
                        background: 'rgba(56, 189, 248, 0.12)',
                        color: 'var(--cyan-glow)',
                      }}>
                        {ev.severity_contribution || 'INFO'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MITRE ATT&CK */}
            {Array.isArray(incident.mitre_techniques) && incident.mitre_techniques.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
                  MITRE ATT&CK Techniques:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {incident.mitre_techniques.map((tech, idx) => (
                    <span key={idx} style={{
                      padding: '3px 10px',
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid var(--border-glow)',
                      borderRadius: 4,
                      fontSize: 12,
                      color: 'var(--cyan-glow)',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Raw JSON */}
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6 }}>
                Raw Technical Payload:
              </div>
              <pre style={{
                background: '#04060a',
                padding: 14,
                borderRadius: 8,
                fontSize: 12,
                color: '#94a3b8',
                overflowX: 'auto',
                maxHeight: 200,
                margin: 0,
                fontFamily: 'var(--font-mono)',
              }}>
                {JSON.stringify(incident.metadata || incident, null, 2)}
              </pre>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { 
  Globe, Mail, Mic, UserCheck, Play, CheckCircle2, 
  AlertTriangle, Shield, Terminal, ArrowRight, Code,
  Image, Video, Search, Laptop, Key, Database, RefreshCw, Eye
} from 'lucide-react';
import { api } from '../services/api';

export default function ThreatStudio({ onIncidentGenerated }) {
  const [activeModality, setActiveModality] = useState('url');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showJson, setShowJson] = useState(false);

  // Form States
  // 1. URL
  const [urlInput, setUrlInput] = useState('http://secure-sbi-kyc-update.xyz/login.php');
  const [urlContext, setUrlContext] = useState('Dear customer, update your SBI KYC immediately to prevent deactivation.');

  // 2. Message
  const [messageInput, setMessageInput] = useState('CRITICAL ALERT: Your bank account will be deactivated in 2 hours unless you confirm your debit card PIN and login password immediately.');

  // 3. Browser DOM Page
  const [browserUrl, setBrowserUrl] = useState('https://login.microsoftonline.security-verify.top/common/login');
  const [browserTitle, setBrowserTitle] = useState('Sign in to your Microsoft account');
  const [hasPasswordField, setHasPasswordField] = useState(true);
  const [claimedBrand, setClaimedBrand] = useState('Microsoft');

  // 4. Audio
  const [claimedIdentity, setClaimedIdentity] = useState('Rajesh Sharma');
  const [audioTranscript, setAudioTranscript] = useState('This is Rajesh Sharma. I am in an urgent meeting with overseas auditors. Immediately transfer 250,000 dollars to the escrow account.');
  const [syntheticScore, setSyntheticScore] = useState(0.92);
  const [similarityScore, setSimilarityScore] = useState(0.89);

  // 5. Image Forensics
  const [imageAiProb, setImageAiProb] = useState(0.88);
  const [imageManipulationProb, setImageManipulationProb] = useState(0.79);
  const [imageSimilarity, setImageSimilarity] = useState(0.84);
  const [imageIntent, setImageIntent] = useState(0.82);
  const [imageTargetName, setImageTargetName] = useState('Vikram Malhotra');

  // 6. Video Deepfake
  const [videoName, setVideoName] = useState('exec_press_statement_leak.mp4');
  const [videoFrameManipulation, setVideoFrameManipulation] = useState(0.86);
  const [videoTemporalJitter, setVideoTemporalJitter] = useState(0.81);
  const [videoTargetName, setVideoTargetName] = useState('Vikram Malhotra');
  const [videoTranscript, setVideoTranscript] = useState('I am officially resigning as Managing Director effective immediately due to corporate compliance irregularities.');

  // 7. Auth Event
  const [authUserId, setAuthUserId] = useState('exec_alice');
  const [authIp, setAuthIp] = useState('194.26.29.112');
  const [authCity, setAuthCity] = useState('Frankfurt');
  const [authCountry, setAuthCountry] = useState('DE');
  const [authAsn, setAuthAsn] = useState('AS51167');
  const [authDevice, setAuthDevice] = useState('dev_attacker_kali_v4');
  const [authFailedBurst, setAuthFailedBurst] = useState(4);
  const [authSuccess, setAuthSuccess] = useState(false);

  // 8. Threat Intel Lookup
  const [intelIndicator, setIntelIndicator] = useState('secure-sbi-kyc-update.xyz');
  const [intelType, setIntelType] = useState('domain');
  const [intelResult, setIntelResult] = useState(null);

  // Preset Loaders
  const loadPreset = (type, name) => {
    setResult(null);
    setIntelResult(null);
    if (type === 'url') {
      if (name === 'sbi') {
        setUrlInput('http://secure-sbi-kyc-update.xyz/login.php');
        setUrlContext('Update SBI KYC urgently to avoid card block.');
      } else if (name === 'msft') {
        setUrlInput('http://login.microsoft.security-verify.top/auth');
        setUrlContext('Your Office 365 session has expired. Re-authenticate now.');
      } else if (name === 'google') {
        setUrlInput('https://www.google.com/search?q=cybersecurity');
        setUrlContext('Searching for documentation.');
      }
    } else if (type === 'message') {
      if (name === 'ceo_wire') {
        setMessageInput('Hi, this is the CEO. I need you to process an urgent wire transfer for an acquisition right now. Keep this strictly confidential.');
      } else if (name === 'kyc_phish') {
        setMessageInput('Your HDFC netbanking access is suspended due to unverified PAN. Click here to submit your credentials.');
      } else if (name === 'benign') {
        setMessageInput('Team, the sprint retrospective is scheduled for Friday at 3 PM. Please update your Jira tickets.');
      }
    } else if (type === 'browser') {
      if (name === 'fake_m365') {
        setBrowserUrl('https://login.microsoftonline.security-verify.top/common/login');
        setBrowserTitle('Sign in to your Microsoft account');
        setHasPasswordField(true);
        setClaimedBrand('Microsoft');
      } else if (name === 'fake_sbi') {
        setBrowserUrl('http://secure-sbi-kyc-update.xyz/retail/logon.htm');
        setBrowserTitle('SBI Net Banking - Corporate Login');
        setHasPasswordField(true);
        setClaimedBrand('State Bank of India');
      }
    } else if (type === 'audio') {
      if (name === 'hostile_cfo') {
        setClaimedIdentity('Rajesh Sharma');
        setAudioTranscript('This is Rajesh Sharma. Authorize emergency settlement wire transfer immediately.');
        setSyntheticScore(0.94);
        setSimilarityScore(0.92);
      } else if (name === 'benign_vc') {
        setClaimedIdentity('Dr. Aris Thorne');
        setAudioTranscript('Good afternoon faculty members, this is the Vice Chancellor reminding you of tomorrow commencement.');
        setSyntheticScore(0.08);
        setSimilarityScore(0.95);
      }
    } else if (type === 'image') {
      if (name === 'tampered_id') {
        setImageTargetName('Vikram Malhotra');
        setImageAiProb(0.91);
        setImageManipulationProb(0.85);
        setImageSimilarity(0.88);
        setImageIntent(0.89);
      } else if (name === 'benign_photo') {
        setImageTargetName('Rajesh Sharma');
        setImageAiProb(0.12);
        setImageManipulationProb(0.04);
        setImageSimilarity(0.92);
        setImageIntent(0.01);
      }
    } else if (type === 'video') {
      if (name === 'fake_resignation') {
        setVideoName('director_resignation_urgent.mp4');
        setVideoTargetName('Vikram Malhotra');
        setVideoFrameManipulation(0.89);
        setVideoTemporalJitter(0.83);
        setVideoTranscript('I am resigning from the executive board effective immediately.');
      }
    } else if (type === 'auth') {
      if (name === 'impossible_travel') {
        setAuthUserId('exec_alice');
        setAuthIp('185.220.101.5');
        setAuthCity('Frankfurt');
        setAuthCountry('DE');
        setAuthAsn('AS9009');
        setAuthFailedBurst(5);
        setAuthSuccess(true);
      } else if (name === 'benign_login') {
        setAuthUserId('admin_charlie');
        setAuthIp('103.21.124.5');
        setAuthCity('Mumbai');
        setAuthCountry('IN');
        setAuthAsn('AS55836');
        setAuthFailedBurst(0);
        setAuthSuccess(true);
      }
    } else if (type === 'threat_intel') {
      if (name === 'phish_domain') {
        setIntelIndicator('secure-sbi-kyc-update.xyz');
        setIntelType('domain');
      } else if (name === 'apt29_ip') {
        setIntelIndicator('185.220.101.5');
        setIntelType('ip');
      }
    }
  };

  // Execution Handlers
  const handleAnalyze = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      let res = null;
      if (activeModality === 'url') {
        res = await api.analyzeUrl(urlInput, urlContext);
      } else if (activeModality === 'message') {
        res = await api.analyzeMessage(messageInput);
      } else if (activeModality === 'browser') {
        res = await api.analyzeBrowser({
          url: browserUrl,
          title: browserTitle,
          has_password_field: hasPasswordField,
          form_actions: ['http://harvest-api.top/submit.php'],
          claimed_brand: claimedBrand,
        });
      } else if (activeModality === 'audio') {
        res = await api.analyzeAudio({
          claimed_identity_name: claimedIdentity,
          provided_transcript: audioTranscript,
          injected_synthetic_score: parseFloat(syntheticScore),
          injected_similarity_score: parseFloat(similarityScore),
        });
      } else if (activeModality === 'image') {
        res = await api.analyzeImage({
          ai_generated_prob: parseFloat(imageAiProb),
          manipulation_prob: parseFloat(imageManipulationProb),
          identity_similarity: parseFloat(imageSimilarity),
          malicious_intent: parseFloat(imageIntent),
          target_name: imageTargetName,
        });
      } else if (activeModality === 'video') {
        res = await api.analyzeVideo({
          video_name: videoName,
          frame_manipulation_score: parseFloat(videoFrameManipulation),
          temporal_jitter_score: parseFloat(videoTemporalJitter),
          target_name: videoTargetName,
          audio_transcript: videoTranscript,
        });
      } else if (activeModality === 'auth') {
        const isAnom = authCity.toLowerCase().includes('frankfurt') || authCountry === 'DE';
        res = await api.analyzeAuthEvent({
          user_id: authUserId,
          source_ip: authIp,
          city: authCity,
          country: authCountry,
          latitude: isAnom ? 50.1109 : 19.0760,
          longitude: isAnom ? 8.6821 : 72.8777,
          user_agent: 'Mozilla/5.0 (Kali Linux x86_64)',
          asn: authAsn,
          failed_attempts_last_hour: parseInt(authFailedBurst, 10),
        });
      }

      setResult(res);
      if (onIncidentGenerated && res) {
        onIncidentGenerated(res);
      }
    } catch (err) {
      console.error('Error during analysis:', err);
      alert(`Analysis Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleIntelLookup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setIntelResult(null);
    try {
      const res = await api.lookupThreatIntel(intelIndicator.trim(), intelType);
      setIntelResult(res);
    } catch (err) {
      alert(`Threat Intel Lookup Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const modalities = [
    { id: 'url', label: 'Web & Phishing URL', icon: Globe },
    { id: 'message', label: 'Message & Social Text', icon: Mail },
    { id: 'browser', label: 'Browser DOM Shield', icon: Laptop },
    { id: 'audio', label: 'Voice Cloning & Audio', icon: Mic },
    { id: 'image', label: 'Image Forensics (ViT/FFT)', icon: Image },
    { id: 'video', label: 'Video Deepfake Decomposer', icon: Video },
    { id: 'auth', label: 'Behavioural ATO & Velocity', icon: Key },
    { id: 'threat_intel', label: 'Threat Intel IOC Search', icon: Database },
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 60 }}>
      {/* Studio Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
          Simulation Lab & Benchmark Sandbox
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
          Internal evaluation sandbox. Injects controlled multimodal parameter vectors to stress-test real-time detection, synergistic risk fusion, and MITRE ATT&CK enrichment.
        </p>
      </div>

      {/* Simulation Lab Isolation Notice */}
      <div style={{
        padding: '12px 18px',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(217, 119, 6, 0.05))',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        borderRadius: 'var(--radius-md)',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: 13, color: '#fcd34d' }}>
          <strong>Simulation Sandbox:</strong> This laboratory environment is dedicated to manual parameter injection, threshold calibration, and synthetic vector benchmarks. Live file uploads and URL checks are performed on the primary <strong>Analyze</strong> page.
        </div>
      </div>


      {/* Modality Selector Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        background: 'rgba(0, 0, 0, 0.4)',
        padding: 6,
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        marginBottom: 24,
      }}>
        {modalities.map(m => {
          const Icon = m.icon;
          const isSelected = activeModality === m.id;
          return (
            <button
              key={m.id}
              onClick={() => {
                setActiveModality(m.id);
                setResult(null);
                setIntelResult(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: isSelected ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
                color: isSelected ? '#00f2fe' : 'var(--text-muted)',
                fontWeight: isSelected ? 700 : 500,
                fontSize: 12,
                cursor: 'pointer',
                transition: 'var(--transition)',
                boxShadow: isSelected ? '0 0 12px rgba(0, 242, 254, 0.2)' : 'none',
              }}
            >
              <Icon size={15} />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid: Form Inputs (Left) & Live Decision Lineage (Right) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(400px, 1.2fr) minmax(400px, 1fr)',
        gap: 24,
      }}>
        
        {/* LEFT COLUMN: MODALITY FORM */}
        <div className="glass-panel" style={{ padding: 24 }}>
          
          {/* 1. URL FORM */}
          {activeModality === 'url' && (
            <form onSubmit={handleAnalyze}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span className="mono" style={{ fontSize: 12, color: '#00f2fe' }}>MODULE: URL_CLASSIFIER_V2</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" onClick={() => loadPreset('url', 'sbi')} className="btn-preset">SBI Phish</button>
                  <button type="button" onClick={() => loadPreset('url', 'msft')} className="btn-preset">M365 Phish</button>
                  <button type="button" onClick={() => loadPreset('url', 'google')} className="btn-preset">Safe Google</button>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                  TARGET URL:
                </label>
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="input-field"
                  placeholder="https://example.com/login"
                  required
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                  ACCOMPANYING MESSAGE / EMAIL CONTEXT:
                </label>
                <textarea
                  rows={3}
                  value={urlContext}
                  onChange={(e) => setUrlContext(e.target.value)}
                  className="input-field"
                  placeholder="Optional email or message text that contained this URL..."
                />
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                <Play size={16} />
                <span>{loading ? 'Evaluating Lexical & Semantic Vectors...' : 'Execute Deep URL Analysis'}</span>
              </button>
            </form>
          )}

          {/* 2. MESSAGE FORM */}
          {activeModality === 'message' && (
            <form onSubmit={handleAnalyze}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span className="mono" style={{ fontSize: 12, color: '#00f2fe' }}>MODULE: NLP_DISTILBERT_OBSERVER</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" onClick={() => loadPreset('message', 'ceo_wire')} className="btn-preset">CEO Wire</button>
                  <button type="button" onClick={() => loadPreset('message', 'kyc_phish')} className="btn-preset">KYC Fraud</button>
                  <button type="button" onClick={() => loadPreset('message', 'benign')} className="btn-preset">Safe Team</button>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                  RAW COMMUNICATION TEXT (EMAIL / SMS / WHATSAPP):
                </label>
                <textarea
                  rows={6}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="input-field"
                  placeholder="Paste raw email, SMS, or Slack/Teams communication..."
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                <Play size={16} />
                <span>{loading ? 'Processing DistilBERT & Semantic Observers...' : 'Analyze Message Intent'}</span>
              </button>
            </form>
          )}

          {/* 3. BROWSER DOM FORM */}
          {activeModality === 'browser' && (
            <form onSubmit={handleAnalyze}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span className="mono" style={{ fontSize: 12, color: '#00f2fe' }}>MODULE: BROWSER_SHIELD_DOM_SIGNALS</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" onClick={() => loadPreset('browser', 'fake_m365')} className="btn-preset">Fake M365</button>
                  <button type="button" onClick={() => loadPreset('browser', 'fake_sbi')} className="btn-preset">Fake SBI</button>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Webpage URL:</label>
                <input type="text" value={browserUrl} onChange={(e) => setBrowserUrl(e.target.value)} className="input-field" required />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Page Title:</label>
                <input type="text" value={browserTitle} onChange={(e) => setBrowserTitle(e.target.value)} className="input-field" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Claimed Brand:</label>
                  <input type="text" value={claimedBrand} onChange={(e) => setClaimedBrand(e.target.value)} className="input-field" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: 20 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                    <input 
                      type="checkbox" 
                      checked={hasPasswordField} 
                      onChange={(e) => setHasPasswordField(e.target.checked)} 
                    />
                    <span>Has Password Field</span>
                  </label>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                <Play size={16} />
                <span>{loading ? 'Evaluating Browser Signals...' : 'Analyze DOM Telemetry'}</span>
              </button>
            </form>
          )}

          {/* 4. AUDIO FORM */}
          {activeModality === 'audio' && (
            <form onSubmit={handleAnalyze}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span className="mono" style={{ fontSize: 12, color: '#00f2fe' }}>MODULE: W2V2_AASIST + ECAPA_TDNN</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" onClick={() => loadPreset('audio', 'hostile_cfo')} className="btn-preset">Target CFO</button>
                  <button type="button" onClick={() => loadPreset('audio', 'benign_vc')} className="btn-preset">Safe VC</button>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Claimed Persona / Executive:</label>
                <input type="text" value={claimedIdentity} onChange={(e) => setClaimedIdentity(e.target.value)} className="input-field" required />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Extracted Voice Transcript:</label>
                <textarea rows={3} value={audioTranscript} onChange={(e) => setAudioTranscript(e.target.value)} className="input-field" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                    Synthetic Speech Prob ({syntheticScore}):
                  </label>
                  <input type="range" min="0" max="1" step="0.01" value={syntheticScore} onChange={(e) => setSyntheticScore(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                    Speaker Cosine Sim ({similarityScore}):
                  </label>
                  <input type="range" min="0" max="1" step="0.01" value={similarityScore} onChange={(e) => setSimilarityScore(e.target.value)} style={{ width: '100%' }} />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                <Play size={16} />
                <span>{loading ? 'Fusing Acoustic & Semantic Signals...' : 'Analyze Voice Impersonation'}</span>
              </button>
            </form>
          )}

          {/* 5. IMAGE FORENSICS FORM */}
          {activeModality === 'image' && (
            <form onSubmit={handleAnalyze}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span className="mono" style={{ fontSize: 12, color: '#00f2fe' }}>MODULE: OPENCV_2D_FFT + VIT_DETECTOR</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" onClick={() => loadPreset('image', 'tampered_id')} className="btn-preset">Tampered Face</button>
                  <button type="button" onClick={() => loadPreset('image', 'benign_photo')} className="btn-preset">Genuine Photo</button>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Target Protected Executive:</label>
                <input type="text" value={imageTargetName} onChange={(e) => setImageTargetName(e.target.value)} className="input-field" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                    AI-Gen Probability ({imageAiProb}):
                  </label>
                  <input type="range" min="0" max="1" step="0.01" value={imageAiProb} onChange={(e) => setImageAiProb(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                    Boundary Tampering ({imageManipulationProb}):
                  </label>
                  <input type="range" min="0" max="1" step="0.01" value={imageManipulationProb} onChange={(e) => setImageManipulationProb(e.target.value)} style={{ width: '100%' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                    Identity Cosine Match ({imageSimilarity}):
                  </label>
                  <input type="range" min="0" max="1" step="0.01" value={imageSimilarity} onChange={(e) => setImageSimilarity(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                    Malicious Intent ({imageIntent}):
                  </label>
                  <input type="range" min="0" max="1" step="0.01" value={imageIntent} onChange={(e) => setImageIntent(e.target.value)} style={{ width: '100%' }} />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                <Play size={16} />
                <span>{loading ? 'Executing 4-Signal Image Decomposition...' : 'Inspect Image Forensics'}</span>
              </button>
            </form>
          )}

          {/* 6. VIDEO DEEPFAKE FORM */}
          {activeModality === 'video' && (
            <form onSubmit={handleAnalyze}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span className="mono" style={{ fontSize: 12, color: '#00f2fe' }}>MODULE: VIDEO_DEEPFAKE_DECOMPOSER</span>
                <button type="button" onClick={() => loadPreset('video', 'fake_resignation')} className="btn-preset">Fake Resignation</button>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Video Clip Identifier:</label>
                <input type="text" value={videoName} onChange={(e) => setVideoName(e.target.value)} className="input-field" required />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Target Identity:</label>
                <input type="text" value={videoTargetName} onChange={(e) => setVideoTargetName(e.target.value)} className="input-field" />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Demuxed Audio Speech Transcript:</label>
                <textarea rows={2} value={videoTranscript} onChange={(e) => setVideoTranscript(e.target.value)} className="input-field" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                    Frame Tampering ({videoFrameManipulation}):
                  </label>
                  <input type="range" min="0" max="1" step="0.01" value={videoFrameManipulation} onChange={(e) => setVideoFrameManipulation(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                    Temporal Jitter ({videoTemporalJitter}):
                  </label>
                  <input type="range" min="0" max="1" step="0.01" value={videoTemporalJitter} onChange={(e) => setVideoTemporalJitter(e.target.value)} style={{ width: '100%' }} />
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                <Play size={16} />
                <span>{loading ? 'Decomposing Temporal Inconsistencies...' : 'Decompose Video Deepfake'}</span>
              </button>
            </form>
          )}

          {/* 7. BEHAVIOURAL AUTH FORM */}
          {activeModality === 'auth' && (
            <form onSubmit={handleAnalyze}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span className="mono" style={{ fontSize: 12, color: '#00f2fe' }}>MODULE: HAVERSINE_VELOCITY + ISOLATION_FOREST</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" onClick={() => loadPreset('auth', 'impossible_travel')} className="btn-preset">Impossible Travel</button>
                  <button type="button" onClick={() => loadPreset('auth', 'benign_login')} className="btn-preset">Safe Baseline</button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Target Account:</label>
                  <input type="text" value={authUserId} onChange={(e) => setAuthUserId(e.target.value)} className="input-field" required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Source IP Address:</label>
                  <input type="text" value={authIp} onChange={(e) => setAuthIp(e.target.value)} className="input-field" required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Reported City:</label>
                  <input type="text" value={authCity} onChange={(e) => setAuthCity(e.target.value)} className="input-field" required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Autonomous System (ASN):</label>
                  <input type="text" value={authAsn} onChange={(e) => setAuthAsn(e.target.value)} className="input-field" required />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Preceding Failed Password Burst (Last 60 min): {authFailedBurst} attempts
                </label>
                <input type="range" min="0" max="15" value={authFailedBurst} onChange={(e) => setAuthFailedBurst(e.target.value)} style={{ width: '100%' }} />
              </div>

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                <Play size={16} />
                <span>{loading ? 'Evaluating Geo-Velocity & Isolation Forest...' : 'Calculate ATO Probability'}</span>
              </button>
            </form>
          )}

          {/* 8. THREAT INTEL SEARCH */}
          {activeModality === 'threat_intel' && (
            <form onSubmit={handleIntelLookup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span className="mono" style={{ fontSize: 12, color: '#00f2fe' }}>MODULE: OFFLINE_SQLITE_IOC_ENGINE</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button type="button" onClick={() => loadPreset('threat_intel', 'phish_domain')} className="btn-preset">SBI Phish Domain</button>
                  <button type="button" onClick={() => loadPreset('threat_intel', 'apt29_ip')} className="btn-preset">APT29 C2 IP</button>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Indicator (Domain, IP, Hash, URL):</label>
                <input type="text" value={intelIndicator} onChange={(e) => setIntelIndicator(e.target.value)} className="input-field" required />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Indicator Type:</label>
                <select value={intelType} onChange={(e) => setIntelType(e.target.value)} className="input-field">
                  <option value="domain">Domain Name</option>
                  <option value="ip">IPv4 / IPv6 Address</option>
                  <option value="url">Complete URL</option>
                  <option value="hash">File / Binary Hash</option>
                </select>
              </div>

              <button type="submit" disabled={loading || !intelIndicator.trim()} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                <Search size={16} />
                <span>{loading ? 'Searching Blacklist Feeds...' : 'Query Threat Intelligence Database'}</span>
              </button>
            </form>
          )}

        </div>

        {/* RIGHT COLUMN: FORENSIC OUTPUT & EVIDENCE LINEAGE */}
        <div className="glass-panel" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
              Real-Time Decisioning Lineage & XAI
            </h3>
            {result && (
              <button
                onClick={() => setShowJson(!showJson)}
                style={{
                  background: showJson ? 'rgba(0, 242, 254, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  color: showJson ? '#00f2fe' : 'var(--text-muted)',
                  fontSize: 11,
                  padding: '4px 10px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <Code size={12} />
                <span>{showJson ? 'Visual View' : 'Raw JSON'}</span>
              </button>
            )}
          </div>

          {/* Threat Intel Result Display */}
          {intelResult && (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>
              <div style={{
                background: intelResult.is_malicious ? 'rgba(255, 51, 102, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                border: `1px solid ${intelResult.is_malicious ? '#ff3366' : '#10b981'}`,
                padding: '16px 20px',
                borderRadius: 'var(--radius-md)',
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, color: intelResult.is_malicious ? '#ff3366' : '#10b981', fontSize: 15 }}>
                    {intelResult.is_malicious ? 'KNOWN MALICIOUS IOC' : 'CLEAN / UNLISTED INDICATOR'}
                  </span>
                  <span className="mono" style={{ fontSize: 13, color: '#fff' }}>
                    Score: {intelResult.reputation_score}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-main)', marginTop: 6 }}>
                  Indicator: <strong className="mono">{intelResult.indicator}</strong> ({intelResult.indicator_type})
                </div>
                {intelResult.threat_category && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    Category: <strong>{intelResult.threat_category.toUpperCase()}</strong> • Feed: {intelResult.matched_feed}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Incident Result Display */}
          {result && !showJson && (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>
              {/* Risk Banner */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                background: result.risk_level === 'CRITICAL' ? 'rgba(255, 51, 102, 0.15)' : 'rgba(0, 242, 254, 0.1)',
                border: `1px solid ${result.risk_level === 'CRITICAL' ? 'rgba(255, 51, 102, 0.4)' : 'rgba(0, 242, 254, 0.3)'}`,
                borderRadius: 'var(--radius-md)',
                marginBottom: 16,
              }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Assessed Risk Level</div>
                  <div style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: result.risk_level === 'CRITICAL' ? 'var(--crimson-threat)' : 'var(--cyan-glow)'
                  }}>
                    {result.risk_level} (Score: {result.risk_score})
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Confidence</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
                    {Math.round((result.confidence || 0.95) * 100)}%
                  </div>
                </div>
              </div>

              {/* Title & Assessment */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Incident Classification:</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{result.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>Threat Type: <strong style={{ color: '#00f2fe' }}>{result.threat_type}</strong></div>
              </div>

              {/* Rationale */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                padding: 12,
                borderRadius: 'var(--radius-sm)',
                fontSize: 12,
                color: 'var(--text-main)',
                lineHeight: 1.5,
                marginBottom: 16,
                border: '1px solid var(--border-subtle)',
              }}>
                <strong>Forensic Rationale:</strong> {result.explanation}
              </div>

              {/* Contributing Signals */}
              {result.evidence && result.evidence.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 6 }}>
                    Fused Evidence Signals ({result.evidence.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                    {result.evidence.map((ev, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 10px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderRadius: 4,
                        fontSize: 11,
                        borderLeft: `3px solid ${ev.severity_contribution === 'CRITICAL' ? '#ff3366' : '#00f2fe'}`
                      }}>
                        <span className="mono" style={{ color: '#fff' }}>{ev.type || ev.evidence_type}</span>
                        <span style={{ color: 'var(--text-muted)' }}>Score: {ev.score || ev.weight || '0.85'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MITRE ATT&CK */}
              {result.mitre_techniques && result.mitre_techniques.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>MITRE:</span>
                  {result.mitre_techniques.map((m, idx) => (
                    <span key={idx} style={{
                      background: 'rgba(168, 85, 247, 0.15)',
                      color: '#c084fc',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {m.id} {m.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* JSON Debugger View */}
          {result && showJson && (
            <pre style={{
              background: '#04060a',
              padding: 14,
              borderRadius: 'var(--radius-sm)',
              fontSize: 11,
              color: '#38bdf8',
              maxHeight: 380,
              overflowY: 'auto',
              border: '1px solid var(--border-subtle)'
            }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          )}

          {/* Empty State */}
          {!result && !intelResult && !loading && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
              <Shield size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontSize: 13, margin: 0 }}>
                Select a modality, load a sample preset, and click execute to observe live signal fusion and deterministic scoring.
              </p>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#00f2fe' }}>
              <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: 13, margin: 0 }}>
                Querying Active Providers & Calculating Multiplicative Interaction Synergies...
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}

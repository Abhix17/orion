import React, { useState, useRef } from 'react';
import { 
  Globe, 
  MessageSquare, 
  Image as ImageIcon, 
  Mic, 
  Video, 
  Activity, 
  ArrowLeft, 
  UploadCloud, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  FileAudio, 
  FileVideo, 
  Sparkles 
} from 'lucide-react';

import { api } from '../services/api';
import AnalysisResult from './AnalysisResult';

export default function AnalyzeView({ onInspectTechnical, onIncidentCreated }) {
  const [selectedMode, setSelectedMode] = useState(null); // null | 'url' | 'message' | 'image' | 'audio' | 'video' | 'account'
  
  // URL Mode inputs
  const [urlInput, setUrlInput] = useState('');
  const [urlContext, setUrlContext] = useState('');

  // Message Mode inputs
  const [messageText, setMessageText] = useState('');
  const [messageSender, setMessageSender] = useState('');
  const [messageSubject, setMessageSubject] = useState('');

  // File Upload States
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [claimedIdentity, setClaimedIdentity] = useState('');
  const [mediaContext, setMediaContext] = useState('');

  // Account Activity inputs
  const [userId, setUserId] = useState('exec_alice');
  const [ipAddress, setIpAddress] = useState('198.51.100.45');
  const [city, setCity] = useState('London');
  const [country, setCountry] = useState('GB');
  const [deviceId, setDeviceId] = useState('device_new_laptop');
  const [authMethod, setAuthMethod] = useState('password');
  const [failedBurst, setFailedBurst] = useState(0);

  // Execution states
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  const fileInputRef = useRef(null);

  // Cards definitions
  const analysisModes = [
    {
      id: 'url',
      title: 'Website',
      description: 'Check a URL or website for phishing and malicious activity.',
      icon: Globe,
      color: '#00f2fe',
      action: 'Analyze URL',
    },
    {
      id: 'message',
      title: 'Message',
      description: 'Analyze an email, SMS, social message or suspicious text.',
      icon: MessageSquare,
      color: '#a855f7',
      action: 'Analyze Message',
    },
    {
      id: 'image',
      title: 'Image',
      description: 'Check images for manipulation, AI generation and impersonation.',
      icon: ImageIcon,
      color: '#ec4899',
      action: 'Upload Image',
    },
    {
      id: 'audio',
      title: 'Audio',
      description: 'Analyze voice recordings for synthetic speech and impersonation.',
      icon: Mic,
      color: '#3b82f6',
      action: 'Upload Audio',
    },
    {
      id: 'video',
      title: 'Video',
      description: 'Check video for manipulation, deepfake indicators and identity abuse.',
      icon: Video,
      color: '#f97316',
      action: 'Upload Video',
    },
    {
      id: 'account',
      title: 'Account Activity',
      description: 'Analyze suspicious authentication and account behaviour.',
      icon: Activity,
      color: '#10b981',
      action: 'Analyze Activity',
    },
  ];

  // Presets
  const urlPresets = [
    { label: '⚡ Fake Electricity Portal', url: 'http://secure-electricity-bill-disconnection.xyz/pay-urgent', desc: 'Disconnection threat phish' },
    { label: '🏦 Fake State Bank KYC', url: 'http://secure-sbi-kyc-update.xyz/login/verify.php', desc: 'Credential harvesting form' },
    { label: '📦 Fake India Post Fee', url: 'http://indiapost-parcels-redelivery-fees.top/address', desc: 'Customs parcel lure' },
    { label: '✅ Legitimate Wikipedia', url: 'https://en.wikipedia.org/wiki/Computer_security', desc: 'Safe educational resource' },
  ];

  const messagePresets = [
    {
      label: '⚡ Electricity Cutoff SMS',
      sender: 'VM-POWEROFC',
      subject: 'Urgent Disconnection Notice',
      text: 'Dear Customer, Your electricity connection will be disconnected tonight at 9:30 PM from the power office because your previous month bill was not updated. Please immediately contact our electricity officer at 9876543210. Thank you.',
    },
    {
      label: '💰 YouTube Like Scam',
      sender: '+919988776655',
      subject: 'Work from Home Offer',
      text: 'Congratulations! You have been selected for Part-time remote job. Earn Rs.3000 to Rs.8000 daily by simply liking YouTube videos. No experience required. WhatsApp HR immediately at wa.me/919988776655 to claim Rs.500 joining bonus.',
    },
    {
      label: '⚖️ Digital Arrest Extortion',
      sender: 'CBI-Customs-Dept',
      subject: 'Contraband Interception Notice',
      text: 'FINAL NOTICE from Crime Investigation Department: An illegal consignment parcel containing contraband items in your name has been intercepted by customs. Your Aadhaar card has been locked. Join Skype video call immediately for clearance or police will arrest you within 1 hour.',
    },
    {
      label: '✅ Genuine Delivery SMS',
      sender: 'BLUEDART',
      subject: 'Shipment Out for Delivery',
      text: 'Your order #402-89218 has been dispatched via BlueDart and is out for delivery today. Use OTP 4920 to receive the package from delivery agent. Track your shipment on our official mobile app.',
    },
  ];

  const accountPresets = [
    {
      label: '🚨 Impossible Travel ATO',
      userId: 'exec_alice',
      ip: '198.51.100.45',
      city: 'London',
      country: 'GB',
      burst: 0,
      desc: 'Login from London 15 mins after Tokyo login',
    },
    {
      label: '⚠️ Brute Force Password Spray',
      userId: 'analyst_bob',
      ip: '203.0.113.88',
      city: 'Mumbai',
      country: 'IN',
      burst: 12,
      desc: '12 failed password attempts in 60 seconds',
    },
    {
      label: '✅ Normal Corporate Login',
      userId: 'dev_carol',
      ip: '10.0.4.15',
      city: 'Bengaluru',
      country: 'IN',
      burst: 0,
      desc: 'Trusted internal device and network',
    },
  ];

  const handleSelectMode = (modeId) => {
    setSelectedMode(modeId);
    setErrorMsg(null);
    setAnalysisResult(null);
    setSelectedFile(null);
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }
  };

  const handleBack = () => {
    setSelectedMode(null);
    setErrorMsg(null);
    setAnalysisResult(null);
    setSelectedFile(null);
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processSelectedFile(file);
  };

  const processSelectedFile = (file) => {
    setErrorMsg(null);
    // Basic frontend check
    if (selectedMode === 'image') {
      const valid = ['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
                    /\.(png|jpe?g|webp)$/i.test(file.name);
      if (!valid) {
        setErrorMsg('Unsupported file type. Please upload PNG, JPG or WEBP.');
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        setErrorMsg('File is too large. Maximum supported size is 15 MB.');
        return;
      }
    } else if (selectedMode === 'audio') {
      const valid = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/wave', 'audio/m4a', 'audio/mp4', 'audio/ogg'].includes(file.type) ||
                    /\.(mp3|wav|m4a|ogg)$/i.test(file.name);
      if (!valid) {
        setErrorMsg('Unsupported file type. Please upload MP3, WAV, M4A or OGG.');
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        setErrorMsg('File is too large. Maximum supported size is 25 MB.');
        return;
      }
    } else if (selectedMode === 'video') {
      const valid = ['video/mp4', 'video/quicktime', 'video/webm'].includes(file.type) ||
                    /\.(mp4|mov|webm)$/i.test(file.name);
      if (!valid) {
        setErrorMsg('Unsupported file type. Please upload MP4, MOV or WEBM.');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setErrorMsg('File is too large. Maximum supported size is 50 MB.');
        return;
      }
    }

    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }

    setSelectedFile(file);
    setFilePreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Scanning animation steps
  const runScanningSteps = async () => {
    setAnalysisStep(1);
    await new Promise(r => setTimeout(r, 400));
    setAnalysisStep(2);
    await new Promise(r => setTimeout(r, 500));
    setAnalysisStep(3);
    await new Promise(r => setTimeout(r, 400));
    setAnalysisStep(4);
  };

  // Submission Handlers
  const handleAnalyzeUrl = async () => {
    if (!urlInput.trim()) {
      setErrorMsg('Please enter a website URL.');
      return;
    }
    let formatted = urlInput.trim();
    if (!/^https?:\/\//i.test(formatted)) {
      formatted = `http://${formatted}`;
    }

    setErrorMsg(null);
    setAnalyzing(true);
    try {
      const promise = api.analyzeUrl(formatted, urlContext || null);
      const [res] = await Promise.all([promise, runScanningSteps()]);
      setAnalysisResult(res);
      if (onIncidentCreated) onIncidentCreated(res);
    } catch (err) {
      setErrorMsg(err.message || 'Analysis service temporarily unavailable.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyzeMessage = async () => {
    if (!messageText.trim()) {
      setErrorMsg('Please enter or paste the message content.');
      return;
    }

    setErrorMsg(null);
    setAnalyzing(true);
    try {
      let combined = messageText.trim();
      if (messageSender.trim() || messageSubject.trim()) {
        combined = `Sender: ${messageSender.trim()}\nSubject: ${messageSubject.trim()}\n\n${combined}`;
      }
      const promise = api.analyzeMessage(combined);
      const [res] = await Promise.all([promise, runScanningSteps()]);
      setAnalysisResult(res);
      if (onIncidentCreated) onIncidentCreated(res);
    } catch (err) {
      setErrorMsg(err.message || 'Analysis service temporarily unavailable.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!selectedFile) {
      setErrorMsg('Please select an image file to upload.');
      return;
    }

    setErrorMsg(null);
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (claimedIdentity.trim()) formData.append('claimed_identity', claimedIdentity.trim());
      if (mediaContext.trim()) formData.append('context', mediaContext.trim());

      const promise = api.uploadMediaImage(formData);
      const [res] = await Promise.all([promise, runScanningSteps()]);
      setAnalysisResult(res);
      if (onIncidentCreated) onIncidentCreated(res);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to analyze uploaded image.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyzeAudio = async () => {
    if (!selectedFile) {
      setErrorMsg('Please select an audio file to upload.');
      return;
    }

    setErrorMsg(null);
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (claimedIdentity.trim()) formData.append('claimed_identity', claimedIdentity.trim());
      if (mediaContext.trim()) formData.append('context', mediaContext.trim());

      const promise = api.uploadMediaAudio(formData);
      const [res] = await Promise.all([promise, runScanningSteps()]);
      setAnalysisResult(res);
      if (onIncidentCreated) onIncidentCreated(res);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to analyze uploaded audio.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyzeVideo = async () => {
    if (!selectedFile) {
      setErrorMsg('Please select a video file to upload.');
      return;
    }

    setErrorMsg(null);
    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (claimedIdentity.trim()) formData.append('claimed_identity', claimedIdentity.trim());
      if (mediaContext.trim()) formData.append('context', mediaContext.trim());

      const promise = api.uploadMediaVideo(formData);
      const [res] = await Promise.all([promise, runScanningSteps()]);
      setAnalysisResult(res);
      if (onIncidentCreated) onIncidentCreated(res);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to analyze uploaded video.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAnalyzeAccount = async () => {
    if (!userId.trim()) {
      setErrorMsg('User ID is required.');
      return;
    }

    setErrorMsg(null);
    setAnalyzing(true);
    try {
      const payload = {
        user_id: userId.trim(),
        ip_address: ipAddress.trim() || '127.0.0.1',
        city: city.trim() || null,
        country: country.trim() || null,
        device_id: deviceId.trim() || null,
        auth_method: authMethod,
        injected_failed_burst: parseInt(failedBurst) || 0,
      };

      const promise = api.analyzeAuthEvent(payload);
      const [res] = await Promise.all([promise, runScanningSteps()]);
      setAnalysisResult(res);
      if (onIncidentCreated) onIncidentCreated(res);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to analyze authentication event.');
    } finally {
      setAnalyzing(false);
    }
  };

  // If result is ready, show unified result component
  if (analysisResult) {
    return (
      <AnalysisResult
        incident={analysisResult}
        onReset={handleBack}
        onInspectTechnical={onInspectTechnical}
      />
    );
  }

  // Scanning state
  if (analyzing) {
    const steps = [
      'Preparing content',
      'Analyzing security indicators',
      'Assessing potential threats',
      'Preparing your security report',
    ];

    return (
      <div style={{
        maxWidth: 600,
        margin: '60px auto',
        textAlign: 'center',
        padding: 40,
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-glow)',
        boxShadow: 'var(--shadow-glow)',
        animation: 'fadeIn 0.3s ease',
      }}>
        {/* Animated Scanner Ring */}
        <div style={{
          width: 80,
          height: 80,
          margin: '0 auto 24px',
          borderRadius: '50%',
          border: '3px solid rgba(0, 242, 254, 0.15)',
          borderTopColor: 'var(--cyan-glow)',
          animation: 'spin 1s linear infinite',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Sparkles size={28} color="var(--cyan-glow)" />
        </div>

        <h3 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
          ORION is analyzing...
        </h3>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 28 }}>
          Checking the content for potential security risks.
        </p>


        {/* Step Progression */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left', maxWidth: 400, margin: '0 auto' }}>
          {steps.map((text, idx) => {
            const isDone = analysisStep > idx + 1;
            const isCurrent = analysisStep === idx + 1;
            return (
              <div key={idx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontSize: 13,
                color: isDone ? '#10b981' : isCurrent ? 'var(--cyan-glow)' : 'var(--text-dim)',
                fontWeight: isCurrent ? 600 : 400,
              }}>
                <div style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: isDone ? 'rgba(16, 185, 129, 0.15)' : isCurrent ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${isDone ? '#10b981' : isCurrent ? 'var(--cyan-glow)' : 'var(--border-subtle)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  flexShrink: 0,
                }}>
                  {isDone ? <CheckCircle2 size={13} color="#10b981" /> : idx + 1}
                </div>
                <span>{text}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: LANDING PAGE — "What would you like to check?"
  // =========================================================================
  if (!selectedMode) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '10px 0 40px' }}>
        {/* Hero Header */}
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 14px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(0, 242, 254, 0.08)',
            border: '1px solid var(--border-glow)',
            color: 'var(--cyan-glow)',
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 16,
          }}>
            <Sparkles size={14} />
            <span>ORION Multi-Modal Security Intelligence</span>
          </div>

          <h1 style={{
            fontSize: 36,
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '-0.02em',
            marginBottom: 10,
          }}>
            What would you like to check?
          </h1>
          <p style={{
            fontSize: 16,
            color: 'var(--text-muted)',
            maxWidth: 600,
            margin: '0 auto',
            lineHeight: 1.5,
          }}>
            AI-powered digital threat intelligence and protection against phishing, voice clones, deepfakes, and account takeovers.
          </p>
        </div>

        {/* 6 Analysis Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20,
        }}>
          {analysisModes.map((mode) => {
            const Icon = mode.icon;
            return (
              <div
                key={mode.id}
                onClick={() => handleSelectMode(mode.id)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 28,
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: 210,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-glow)';
                  e.currentTarget.style.background = 'var(--bg-card-hover)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.background = 'var(--bg-card)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 'var(--radius-md)',
                    background: `${mode.color}15`,
                    border: `1px solid ${mode.color}35`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 18,
                  }}>
                    <Icon size={24} color={mode.color} />
                  </div>

                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                    {mode.title}
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                    {mode.description}
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: mode.color,
                  fontSize: 13,
                  fontWeight: 600,
                  marginTop: 20,
                }}>
                  <span>{mode.action}</span>
                  <span>→</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: DEDICATED INPUT INTERFACES
  // =========================================================================
  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '10px 0 40px', animation: 'fadeIn 0.2s ease' }}>
      {/* Breadcrumb Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <button
          onClick={handleBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: 13,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to all options</span>
        </button>

        <span style={{ fontSize: 12, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Analyze / {analysisModes.find(m => m.id === selectedMode)?.title}
        </span>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 18px',
          background: 'rgba(255, 51, 102, 0.1)',
          border: '1px solid rgba(255, 51, 102, 0.35)',
          borderRadius: 'var(--radius-md)',
          color: '#ff3366',
          fontSize: 13,
          marginBottom: 20,
        }}>
          <AlertTriangle size={18} />
          <span style={{ flex: 1 }}>{errorMsg}</span>
          <button
            onClick={() => setErrorMsg(null)}
            style={{ background: 'none', border: 'none', color: '#ff3366', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Container Box */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: 32,
        boxShadow: 'var(--shadow-glass)',
      }}>
        {/* ==================== MODE 1: WEBSITE ==================== */}
        {selectedMode === 'url' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(0, 242, 254, 0.1)',
                border: '1px solid rgba(0, 242, 254, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Globe size={22} color="var(--cyan-glow)" />
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>Check a website</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                  Inspect domains for deceptive branding, typosquatting, credential harvesting, and threat feeds.
                </p>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 8 }}>
                Website or Link URL
              </label>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/login"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
                Accompanying message or context (optional)
              </label>
              <input
                type="text"
                value={urlContext}
                onChange={(e) => setUrlContext(e.target.value)}
                placeholder="e.g. Received via SMS claiming electricity bill overdue"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: '#fff',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            {/* Presets */}
            <div style={{ marginBottom: 28 }}>
              <span style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Test with real examples:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                {urlPresets.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setUrlInput(p.url);
                      setUrlContext(p.desc);
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '6px 12px',
                      color: 'var(--text-muted)',
                      fontSize: 12,
                      cursor: 'pointer',
                      transition: 'var(--transition)',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAnalyzeUrl}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #00f2fe, #0284c7)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: '#000',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-glow)',
              }}
            >
              Analyze Website
            </button>
          </div>
        )}

        {/* ==================== MODE 2: MESSAGE ==================== */}
        {selectedMode === 'message' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <MessageSquare size={22} color="#a855f7" />
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>Analyze a message</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                  Extract coercive intent, fake urgent calls to action, banking impersonation, and phishing lures.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Sender / Caller ID (optional)
                </label>
                <input
                  type="text"
                  value={messageSender}
                  onChange={(e) => setMessageSender(e.target.value)}
                  placeholder="e.g. VM-POWEROFC or +919876543210"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Subject line (optional)
                </label>
                <input
                  type="text"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  placeholder="e.g. Immediate account suspension notice"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 8 }}>
                Message Content
              </label>
              <textarea
                rows={5}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Paste the suspicious email, SMS or message here..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Presets */}
            <div style={{ marginBottom: 28 }}>
              <span style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Test with real fraud templates:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                {messagePresets.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setMessageSender(p.sender);
                      setMessageSubject(p.subject);
                      setMessageText(p.text);
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '6px 12px',
                      color: 'var(--text-muted)',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAnalyzeMessage}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Analyze Message
            </button>
          </div>
        )}

        {/* ==================== MODE 3: IMAGE ==================== */}
        {selectedMode === 'image' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(236, 72, 153, 0.1)',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <ImageIcon size={22} color="#ec4899" />
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>Check an image</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                  Upload image for computer vision forensics, Laplacian variance, FFT artifacts, and AI manipulation detection.
                </p>
              </div>
            </div>

            {/* Upload Dropzone */}
            {!selectedFile ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '48px 24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'rgba(0, 0, 0, 0.2)',
                  transition: 'var(--transition)',
                  marginBottom: 20,
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ec4899'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
              >
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'rgba(236, 72, 153, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <UploadCloud size={28} color="#ec4899" />
                </div>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: 15, marginBottom: 6 }}>
                  Upload an image
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>
                  Drag & drop here or <span style={{ color: '#ec4899', textDecoration: 'underline' }}>Browse files</span>
                </p>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.05em' }}>
                  PNG • JPG • JPEG • WEBP (Max 15 MB)
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>
            ) : (
              /* Selected Image Preview */
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: 16,
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}>
                <img
                  src={filePreviewUrl}
                  alt="Preview"
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 'var(--radius-sm)',
                    objectFit: 'cover',
                    border: '1px solid var(--border-subtle)',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#fff', fontSize: 14, marginBottom: 2 }}>
                    {selectedFile.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Image'}
                  </div>
                </div>
                <button
                  onClick={handleRemoveFile}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  <X size={14} />
                  <span>Remove</span>
                </button>
              </div>
            )}

            {/* Optional Context Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Claimed identity or target executive (optional)
                </label>
                <input
                  type="text"
                  value={claimedIdentity}
                  onChange={(e) => setClaimedIdentity(e.target.value)}
                  placeholder="e.g. CEO Alice"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Incident context or narrative (optional)
                </label>
                <input
                  type="text"
                  value={mediaContext}
                  onChange={(e) => setMediaContext(e.target.value)}
                  placeholder="e.g. Sent via WhatsApp requesting urgent wire transfer"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <button
              onClick={handleAnalyzeImage}
              disabled={!selectedFile}
              style={{
                width: '100%',
                padding: '14px',
                background: selectedFile ? 'linear-gradient(135deg, #ec4899, #be185d)' : 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: selectedFile ? '#fff' : 'var(--text-dim)',
                fontWeight: 700,
                fontSize: 14,
                cursor: selectedFile ? 'pointer' : 'not-allowed',
              }}
            >
              Analyze Image
            </button>
          </div>
        )}

        {/* ==================== MODE 4: AUDIO ==================== */}
        {selectedMode === 'audio' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Mic size={22} color="#3b82f6" />
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>Analyze voice recording</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                  Upload audio to inspect vocoder artifacts, acoustic synthetic speech, and speaker identity verification.
                </p>
              </div>
            </div>

            {/* Dropzone */}
            {!selectedFile ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '48px 24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'rgba(0, 0, 0, 0.2)',
                  transition: 'var(--transition)',
                  marginBottom: 20,
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
              >
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'rgba(59, 130, 246, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <FileAudio size={28} color="#3b82f6" />
                </div>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: 15, marginBottom: 6 }}>
                  Upload an audio recording
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>
                  Drag & drop here or <span style={{ color: '#3b82f6', textDecoration: 'underline' }}>Browse files</span>
                </p>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.05em' }}>
                  MP3 • WAV • M4A • OGG (Max 25 MB)
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/mpeg, audio/mp3, audio/wav, audio/m4a, audio/ogg"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>
            ) : (
              /* Selected Audio Preview */
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: 20,
                marginBottom: 20,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <FileAudio size={24} color="#3b82f6" />
                    <div>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>
                        {selectedFile.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Audio'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-muted)',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    <X size={14} />
                    <span>Change File</span>
                  </button>
                </div>

                {/* HTML5 Audio Player */}
                <audio
                  controls
                  src={filePreviewUrl}
                  style={{ width: '100%', height: 40, borderRadius: 'var(--radius-sm)', outline: 'none' }}
                />
              </div>
            )}

            {/* Optional Context */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Claimed caller or voice persona (optional)
                </label>
                <input
                  type="text"
                  value={claimedIdentity}
                  onChange={(e) => setClaimedIdentity(e.target.value)}
                  placeholder="e.g. CFO Rajesh Sharma"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Transcript or call summary (optional)
                </label>
                <input
                  type="text"
                  value={mediaContext}
                  onChange={(e) => setMediaContext(e.target.value)}
                  placeholder="e.g. Caller demanded urgent wire transfer without email confirmation"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <button
              onClick={handleAnalyzeAudio}
              disabled={!selectedFile}
              style={{
                width: '100%',
                padding: '14px',
                background: selectedFile ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: selectedFile ? '#fff' : 'var(--text-dim)',
                fontWeight: 700,
                fontSize: 14,
                cursor: selectedFile ? 'pointer' : 'not-allowed',
              }}
            >
              Analyze Audio
            </button>
          </div>
        )}

        {/* ==================== MODE 5: VIDEO ==================== */}
        {selectedMode === 'video' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(249, 115, 22, 0.1)',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Video size={22} color="#f97316" />
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>Check video</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                  Upload video clip for frame-level facial tampering inspection, temporal jitter, and deepfake analysis.
                </p>
              </div>
            </div>

            {/* Dropzone */}
            {!selectedFile ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '48px 24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'rgba(0, 0, 0, 0.2)',
                  transition: 'var(--transition)',
                  marginBottom: 20,
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#f97316'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
              >
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'rgba(249, 115, 22, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <FileVideo size={28} color="#f97316" />
                </div>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: 15, marginBottom: 6 }}>
                  Upload a video file
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>
                  Drag & drop here or <span style={{ color: '#f97316', textDecoration: 'underline' }}>Browse files</span>
                </p>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.05em' }}>
                  MP4 • MOV • WEBM (Max 50 MB)
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4, video/quicktime, video/webm"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>
            ) : (
              /* Selected Video Preview */
              <div style={{
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: 20,
                marginBottom: 20,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <FileVideo size={24} color="#f97316" />
                    <div>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>
                        {selectedFile.name}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Video'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-muted)',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    <X size={14} />
                    <span>Change File</span>
                  </button>
                </div>

                {/* HTML5 Video Player */}
                <video
                  controls
                  src={filePreviewUrl}
                  style={{
                    width: '100%',
                    maxHeight: 280,
                    borderRadius: 'var(--radius-sm)',
                    background: '#000',
                  }}
                />
              </div>
            )}

            {/* Optional Context */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Claimed identity in video (optional)
                </label>
                <input
                  type="text"
                  value={claimedIdentity}
                  onChange={(e) => setClaimedIdentity(e.target.value)}
                  placeholder="e.g. Director Sharma"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Video narrative or transcript (optional)
                </label>
                <input
                  type="text"
                  value={mediaContext}
                  onChange={(e) => setMediaContext(e.target.value)}
                  placeholder="e.g. Urgent press statement or video call clip"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <button
              onClick={handleAnalyzeVideo}
              disabled={!selectedFile}
              style={{
                width: '100%',
                padding: '14px',
                background: selectedFile ? 'linear-gradient(135deg, #f97316, #ea580c)' : 'rgba(255, 255, 255, 0.05)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: selectedFile ? '#fff' : 'var(--text-dim)',
                fontWeight: 700,
                fontSize: 14,
                cursor: selectedFile ? 'pointer' : 'not-allowed',
              }}
            >
              Analyze Video
            </button>
          </div>
        )}

        {/* ==================== MODE 6: ACCOUNT ACTIVITY ==================== */}
        {selectedMode === 'account' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Activity size={22} color="#10b981" />
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>Analyze account activity</h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                  Evaluate authentication events for impossible travel geo-velocity, credential stuffing, and account takeover (ATO).
                </p>
              </div>
            </div>

            {/* Presets */}
            <div style={{ marginBottom: 20 }}>
              <span style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Load scenario preset:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {accountPresets.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setUserId(p.userId);
                      setIpAddress(p.ip);
                      setCity(p.city);
                      setCountry(p.country);
                      setFailedBurst(p.burst);
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '6px 12px',
                      color: 'var(--text-muted)',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 6 }}>
                  User / Account ID
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="e.g. exec_alice"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 6 }}>
                  Source IP Address
                </label>
                <input
                  type="text"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  placeholder="198.51.100.45"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="London"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Country (2-letter ISO)
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="GB"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Failed Attempt Burst
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={failedBurst}
                  onChange={(e) => setFailedBurst(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Device Identifier
                </label>
                <input
                  type="text"
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  placeholder="device_new_laptop"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Authentication Protocol
                </label>
                <select
                  value={authMethod}
                  onChange={(e) => setAuthMethod(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(0, 0, 0, 0.5)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                  }}
                >
                  <option value="password">Password</option>
                  <option value="oauth_google">OAuth (Google SSO)</option>
                  <option value="fido2_webauthn">FIDO2 / WebAuthn</option>
                  <option value="api_key">API Key</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleAnalyzeAccount}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Analyze Activity
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

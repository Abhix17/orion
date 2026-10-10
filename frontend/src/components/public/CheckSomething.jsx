import React, { useState, useRef, useEffect } from 'react';
import { 
  Globe, 
  MessageSquare, 
  Image as ImageIcon, 
  Mic, 
  Video, 
  Activity, 
  UploadCloud, 
  X, 
  AlertTriangle, 
  Shield, 
  RefreshCw,
  FileAudio,
  FileVideo,
  Sparkles,
  Key,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  Info
} from 'lucide-react';
import { api } from '../../services/api';
import { authService } from '../../services/auth';
import PublicResult from './PublicResult';
import AnalysisProgress from './AnalysisProgress';

export default function CheckSomething({ 
  initialCategory = 'url', 
  onInspectTechnical, 
  onIncidentCreated 
}) {
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  // Input states
  const [urlInput, setUrlInput] = useState('');
  const [urlContext, setUrlContext] = useState('');

  const [messageText, setMessageText] = useState('');
  const [messageSender, setMessageSender] = useState('');

  const [claimedIdentity, setClaimedIdentity] = useState('');
  const [mediaContext, setMediaContext] = useState('');
  const [showExtraDetails, setShowExtraDetails] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);

  // Account activity state (Starts empty for public checks)
  const [accountUserId, setAccountUserId] = useState('');
  const [accountCity, setAccountCity] = useState('');
  const [accountIp, setAccountIp] = useState('');
  const [accountDevice, setAccountDevice] = useState('');

  // Execution states
  const [scanning, setScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [scanResult, setScanResult] = useState(null);

  const fileInputRef = useRef(null);

  // Sync initialCategory & parse extension deep-link query parameters
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const queryText = params.get('text');
      const queryUrl = params.get('url');
      const queryImg = params.get('imageUrl');

      if (queryText) {
        setActiveCategory('message');
        setMessageText(queryText);
      } else if (queryUrl) {
        setActiveCategory('url');
        setUrlInput(queryUrl);
      } else if (queryImg) {
        setActiveCategory('image');
        setMediaContext(`Target Image URL: ${queryImg}`);
      } else if (initialCategory) {
        setActiveCategory(initialCategory);
      }
    } catch (e) {
      if (initialCategory) setActiveCategory(initialCategory);
    }
  }, [initialCategory]);

  const categories = [
    { id: 'url', label: 'Link', icon: Globe },
    { id: 'message', label: 'Message', icon: MessageSquare },
    { id: 'image', label: 'Image', icon: ImageIcon },
    { id: 'audio', label: 'Audio', icon: Mic },
    { id: 'video', label: 'Video', icon: Video },
    { id: 'account', label: 'Account', icon: Activity },
  ];

  // Presets
  const presets = {
    url: [
      { label: '⚡ Electricity Cutoff Lure', url: 'http://secure-electricity-bill-disconnection.xyz/pay-urgent' },
      { label: '🏦 SBI KYC Verification', url: 'http://secure-sbi-kyc-update.xyz/login/verify.php' },
      { label: '📦 Customs Delivery Fee', url: 'http://indiapost-parcels-redelivery-fees.top/address' },
      { label: '✅ Wikipedia Article (Safe)', url: 'https://en.wikipedia.org/wiki/Computer_security' },
    ],
    message: [
      {
        label: '⚡ Electricity Cutoff SMS',
        sender: 'VM-POWER',
        text: 'Dear Customer, Your electricity connection will be disconnected tonight at 9:30 PM from the power office because your previous month bill was not updated. Please immediately contact our electricity officer at 9876543210. Thank you.'
      },
      {
        label: '💰 YouTube Like Task Scam',
        sender: '+919988776655',
        text: 'Congratulations! You have been selected for Part-time remote job. Earn Rs.3000 to Rs.8000 daily by simply liking YouTube videos. WhatsApp HR immediately at wa.me/919988776655 to claim Rs.500 joining bonus.'
      },
      {
        label: '⚖️ Digital Arrest Extortion',
        sender: 'CBI-Customs',
        text: 'FINAL NOTICE from Crime Investigation Department: An illegal consignment parcel containing contraband items in your name has been intercepted by customs. Join Skype video call immediately for clearance or police will arrest you within 1 hour.'
      },
      {
        label: '✅ Genuine Order Dispatch (Safe)',
        sender: 'BLUEDART',
        text: 'Your order #402-89218 has been dispatched via BlueDart and is out for delivery today. Use OTP 4920 to receive package. Track your shipment on our official mobile app.'
      }
    ],
    account: [
      {
        label: '🚨 Impossible Travel ATO (Frankfurt)',
        userId: 'exec_alice',
        city: 'Frankfurt, Germany',
        ip: '194.26.29.112',
        device: 'Linux Bot User-Agent'
      },
      {
        label: '✅ Normal Home Login (Mumbai)',
        userId: 'citizen_user_91',
        city: 'Mumbai, India',
        ip: '103.21.124.5',
        device: 'Chrome macOS'
      }
    ]
  };

  const handleCategorySwitch = (catId) => {
    setActiveCategory(catId);
    setErrorMsg(null);
    setScanResult(null);
    setSelectedFile(null);
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }
  };

  const handleFileSelection = (file) => {
    setErrorMsg(null);
    if (!file) return;

    if (activeCategory === 'image') {
      const valid = ['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || /\.(png|jpe?g|webp)$/i.test(file.name);
      if (!valid) {
        setErrorMsg('Please upload a PNG, JPG, or WEBP image.');
        return;
      }
      if (file.size > 15 * 1024 * 1024) {
        setErrorMsg('File size exceeds 15 MB limit.');
        return;
      }
    } else if (activeCategory === 'audio') {
      const valid = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/m4a', 'audio/ogg'].includes(file.type) || /\.(mp3|wav|m4a|ogg)$/i.test(file.name);
      if (!valid) {
        setErrorMsg('Please upload an MP3, WAV, M4A, or OGG audio file.');
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        setErrorMsg('File size exceeds 25 MB limit.');
        return;
      }
    } else if (activeCategory === 'video') {
      const valid = ['video/mp4', 'video/quicktime', 'video/webm'].includes(file.type) || /\.(mp4|mov|webm)$/i.test(file.name);
      if (!valid) {
        setErrorMsg('Please upload an MP4, MOV, or WEBM video file.');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setErrorMsg('File size exceeds 50 MB limit.');
        return;
      }
    }

    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setSelectedFile(file);
    setFilePreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePerformCheck = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setScanning(true);

    try {
      let promise = null;

      if (activeCategory === 'url') {
        let target = urlInput.trim();
        if (!target) {
          setErrorMsg('Please enter a website link to analyze.');
          setScanning(false);
          return;
        }
        if (!/^https?:\/\//i.test(target)) target = `http://${target}`;
        promise = api.analyzeUrl(target, urlContext || null);

      } else if (activeCategory === 'message') {
        let text = messageText.trim();
        if (!text) {
          setErrorMsg('Please paste the email, SMS, DM or message here.');
          setScanning(false);
          return;
        }
        if (messageSender.trim()) text = `Sender: ${messageSender.trim()}\n\n${text}`;
        promise = api.analyzeMessage(text);

      } else if (activeCategory === 'image') {
        if (!selectedFile) {
          setErrorMsg('Please select an image file to upload.');
          setScanning(false);
          return;
        }
        const formData = new FormData();
        formData.append('file', selectedFile);
        if (claimedIdentity.trim()) formData.append('claimed_identity', claimedIdentity.trim());
        if (mediaContext.trim()) formData.append('context', mediaContext.trim());
        promise = api.uploadMediaImage(formData);

      } else if (activeCategory === 'audio') {
        if (!selectedFile) {
          if (!claimedIdentity.trim() && !mediaContext.trim()) {
            setErrorMsg('Please select an audio file to upload, or provide caller identity / call note.');
            setScanning(false);
            return;
          }
          promise = api.analyzeAudio({
            claimed_identity_name: claimedIdentity.trim() || 'Unknown Caller',
            provided_transcript: mediaContext.trim() || 'Voice recording clip',
          });
        } else {
          const formData = new FormData();
          formData.append('file', selectedFile);
          if (claimedIdentity.trim()) formData.append('claimed_identity', claimedIdentity.trim());
          if (mediaContext.trim()) formData.append('context', mediaContext.trim());
          promise = api.uploadMediaAudio(formData);
        }

      } else if (activeCategory === 'video') {
        if (!selectedFile) {
          setErrorMsg('Please select a video file to upload.');
          setScanning(false);
          return;
        }
        const formData = new FormData();
        formData.append('file', selectedFile);
        if (claimedIdentity.trim()) formData.append('claimed_identity', claimedIdentity.trim());
        if (mediaContext.trim()) formData.append('context', mediaContext.trim());
        promise = api.uploadMediaVideo(formData);

      } else if (activeCategory === 'account') {
        if (!accountUserId.trim() && !accountIp.trim() && !accountCity.trim()) {
          setErrorMsg('Please enter login activity details (Account ID, IP, or Location) to analyze.');
          setScanning(false);
          return;
        }
        promise = api.analyzeAuthEvent({
          user_id: accountUserId.trim() || 'unspecified_user',
          source_ip: accountIp.trim() || '127.0.0.1',
          city: accountCity.trim() || 'Unknown',
          user_agent: accountDevice.trim() || 'Standard Browser',
        });
      }

      const res = await promise;
      setScanResult(res);
      if (onIncidentCreated) onIncidentCreated(res);

      try {
        let targetPreview = '';
        if (activeCategory === 'url') targetPreview = urlInput;
        else if (activeCategory === 'message') targetPreview = messageText.slice(0, 100);
        else if (selectedFile) targetPreview = selectedFile.name;
        else if (activeCategory === 'account') targetPreview = `${accountUserId} (${accountCity || 'Login'})`;

        const riskLevel = res.risk_level || (res.risk_score && res.risk_score.level) || (res.risk_score >= 0.7 ? 'HIGH' : res.risk_score >= 0.4 ? 'MEDIUM' : 'SAFE');
        const riskValue = typeof res.risk_score === 'number' ? res.risk_score : (res.risk_score?.value ?? 0.1);

        authService.saveCheckResult({
          id: res.id || `chk_${Date.now()}`,
          modality: activeCategory,
          title: res.title || `${activeCategory.toUpperCase()} Inspection`,
          inputPreview: targetPreview,
          risk_level: riskLevel,
          threat_type: res.threat_type || 'INSPECTION',
          risk_score: riskValue,
          verdict: res.explanation || 'Verified by ORION',
          explanation: res.explanation || '',
          rawResult: res,
        });
      } catch (saveErr) {
        console.warn('Could not save check to personal history:', saveErr);
      }

    } catch (err) {
      console.error('Check error:', err);
      const isNetworkError = err.isAxiosError || err.message?.includes('Network Error') || err.message?.includes('timeout') || err.response?.status >= 500;
      const displayMsg = isNetworkError 
        ? 'ORION Intelligence Service is currently unreachable or timed out. Please try again later.'
        : err.response?.data?.detail || err.message || 'One or more security checks could not be completed.';
        
      setScanResult({
        title: 'Analysis Inconclusive',
        status: 'INCONCLUSIVE',
        inconclusive: true,
        risk_level: 'INCONCLUSIVE',
        risk_score: { level: 'INCONCLUSIVE', value: 0.5 },
        explanation: displayMsg,
        risk_drivers: ['Provider service check returned inconclusive or timed out'],
        recommended_actions: ['Do not click links or enter passwords until verified independently.']
      });
    } finally {
      setScanning(false);
    }
  };

  // If result is ready, display PublicResult
  if (scanResult) {
    return (
      <PublicResult
        incident={scanResult}
        onReset={() => setScanResult(null)}
        onInspectTechnical={onInspectTechnical}
      />
    );
  }

  // If scanning in progress, show AnalysisProgress
  if (scanning) {
    return <AnalysisProgress contentType={categories.find(c => c.id === activeCategory)?.label || 'content'} />;
  }

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '10px 0 60px', animation: 'fadeIn 0.25s ease' }}>
      
      {/* Workspace Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: '-0.02em' }}>
          CHECK SOMETHING
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-muted)', margin: 0 }}>
          Give ORION something suspicious. We'll explain what we find.
        </p>
      </div>

      {/* Segmented Selector Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        background: 'rgba(15, 23, 42, 0.8)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-full)',
        padding: 6,
        marginBottom: 36,
        boxShadow: 'var(--shadow-glass)',
        overflowX: 'auto',
      }}>
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handleCategorySwitch(cat.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 22px',
                borderRadius: 'var(--radius-full)',
                background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                border: isSelected ? '1px solid var(--border-glow)' : '1px solid transparent',
                color: isSelected ? '#fff' : 'var(--text-muted)',
                fontSize: 14,
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                transition: 'var(--transition)',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={16} color={isSelected ? 'var(--cyan-glow)' : 'var(--text-dim)'} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 20px',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: 'var(--radius-md)',
          color: '#f87171',
          fontSize: 14,
          marginBottom: 24,
        }}>
          <AlertTriangle size={18} />
          <span style={{ flex: 1 }}>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Dedicated Workspace Card */}
      <div className="responsive-card-padding" style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-glass)',
      }}>
        <form onSubmit={handlePerformCheck}>

          {/* WORKFLOW 1: LINK */}
          {activeCategory === 'url' && (
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: 16, marginBottom: 12, color: '#fff' }}>
                Paste a suspicious link
              </label>
              
              <div className="mobile-stack" style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/..."
                  style={{
                    flex: 1,
                    padding: '16px 20px',
                    fontSize: 15,
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-inset)',
                    border: '1px solid var(--border-glow)',
                    color: '#fff',
                    outline: 'none',
                    fontFamily: 'var(--font-mono)',
                  }}
                />
                <button
                  type="submit"
                  disabled={!urlInput.trim()}
                  style={{
                    padding: '0 32px',
                    fontSize: 15,
                    fontWeight: 700,
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
                    border: 'none',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: !urlInput.trim() ? 'not-allowed' : 'pointer',
                    opacity: !urlInput.trim() ? 0.5 : 1,
                    boxShadow: '0 4px 18px rgba(56, 189, 248, 0.3)',
                  }}
                >
                  <Shield size={18} />
                  <span>Analyze link</span>
                </button>
              </div>

              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
                ORION checks domain signals, URL structure, threat intelligence and semantic indicators.
              </p>

              {/* Real Preset Examples */}
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600 }}>Try Real Examples:</span>
                {presets.url.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setUrlInput(p.url)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-full)',
                      padding: '5px 14px',
                      color: 'var(--text-muted)',
                      fontSize: 12,
                      cursor: 'pointer',
                      transition: 'var(--transition)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-glow)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* WORKFLOW 2: MESSAGE */}
          {activeCategory === 'message' && (
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: 16, marginBottom: 12, color: '#fff' }}>
                Paste the email, SMS, DM or message here...
              </label>

              <textarea
                rows={6}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Paste the email, SMS, DM or message here..."
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  fontSize: 15,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-inset)',
                  border: '1px solid var(--border-glow)',
                  color: '#fff',
                  outline: 'none',
                  resize: 'vertical',
                  marginBottom: 16,
                  lineHeight: 1.5,
                }}
              />

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Sender Identifier (Optional)
                </label>
                <input
                  type="text"
                  value={messageSender}
                  onChange={(e) => setMessageSender(e.target.value)}
                  placeholder="e.g. VM-POWER, +919876543210, hr@parttimejob.xyz"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: 14,
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600 }}>Try Scenarios:</span>
                  {presets.message.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setMessageText(p.text);
                        setMessageSender(p.sender);
                      }}
                      style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-full)',
                        padding: '5px 14px',
                        color: 'var(--text-muted)',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={!messageText.trim()}
                  style={{
                    padding: '14px 32px',
                    fontSize: 15,
                    fontWeight: 700,
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
                    border: 'none',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: !messageText.trim() ? 'not-allowed' : 'pointer',
                    opacity: !messageText.trim() ? 0.5 : 1,
                    boxShadow: '0 4px 18px rgba(56, 189, 248, 0.3)',
                  }}
                >
                  <Shield size={18} />
                  <span>Analyze message</span>
                </button>
              </div>
            </div>
          )}

          {/* WORKFLOW 3: IMAGE */}
          {activeCategory === 'image' && (
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: 16, marginBottom: 12, color: '#fff' }}>
                Upload or Drop an image here
              </label>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileSelection(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--border-glow)',
                  borderRadius: 'var(--radius-md)',
                  padding: '40px 24px',
                  textAlign: 'center',
                  background: selectedFile ? 'rgba(56, 189, 248, 0.06)' : 'rgba(0, 0, 0, 0.3)',
                  cursor: 'pointer',
                  marginBottom: 20,
                  transition: 'var(--transition)',
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => handleFileSelection(e.target.files?.[0])}
                />

                {selectedFile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                    {filePreviewUrl && (
                      <img
                        src={filePreviewUrl}
                        alt="Uploaded Preview"
                        style={{ maxHeight: 180, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glow)' }}
                      />
                    )}
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                      {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile();
                      }}
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#f87171',
                        padding: '4px 14px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Remove Image
                    </button>
                  </div>
                ) : (
                  <div>
                    <UploadCloud size={40} color="var(--cyan-glow)" style={{ marginBottom: 12 }} />
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>
                      Upload or Drop an image here
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>
                      Supported formats: JPG / PNG / WEBP (Max 15MB)
                    </div>
                  </div>
                )}
              </div>

              {/* Citizen automatic scanning tip */}
              <div style={{
                fontSize: 13,
                color: 'var(--cyan-glow)',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid var(--border-glow)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 16px',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <Info size={16} />
                <span>ORION automatically scans for AI deepfakes, embedded text/OCR, and faces. You can simply upload your image without filling extra fields.</span>
              </div>

              {/* Expandable Optional Context Inputs */}
              <div style={{ marginBottom: 20 }}>
                <button
                  type="button"
                  onClick={() => setShowExtraDetails(!showExtraDetails)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: 0,
                    marginBottom: showExtraDetails ? 14 : 0,
                  }}
                >
                  <span>{showExtraDetails ? '− Hide optional context fields' : '+ Add extra context or claimed identity (Optional)'}</span>
                </button>

                {showExtraDetails && (
                  <div className="responsive-grid-2" style={{ marginTop: 10 }}>
                    <div>
                      <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                        Claimed Identity / Person (Optional)
                      </label>
                      <input
                        type="text"
                        value={claimedIdentity}
                        onChange={(e) => setClaimedIdentity(e.target.value)}
                        placeholder="e.g. Executive Rajesh, Uncle Sharma"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          color: '#fff',
                          fontSize: 13,
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                        Context / Note (Optional)
                      </label>
                      <input
                        type="text"
                        value={mediaContext}
                        onChange={(e) => setMediaContext(e.target.value)}
                        placeholder="e.g. Photo sent via WhatsApp asking for money transfer"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          color: '#fff',
                          fontSize: 13,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!selectedFile}
                style={{
                  width: '100%',
                  padding: '16px 32px',
                  fontSize: 15,
                  fontWeight: 700,
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
                  border: 'none',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  cursor: !selectedFile ? 'not-allowed' : 'pointer',
                  opacity: !selectedFile ? 0.5 : 1,
                  boxShadow: '0 4px 18px rgba(56, 189, 248, 0.3)',
                }}
              >
                <Shield size={18} />
                <span>Analyze image</span>
              </button>
            </div>
          )}

          {/* WORKFLOW 4: AUDIO */}
          {activeCategory === 'audio' && (
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: 16, marginBottom: 12, color: '#fff' }}>
                Upload voice recording or call note
              </label>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileSelection(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--border-glow)',
                  borderRadius: 'var(--radius-md)',
                  padding: '40px 24px',
                  textAlign: 'center',
                  background: selectedFile ? 'rgba(56, 189, 248, 0.06)' : 'rgba(0, 0, 0, 0.3)',
                  cursor: 'pointer',
                  marginBottom: 20,
                  transition: 'var(--transition)',
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="audio/mpeg,audio/wav,audio/m4a,audio/ogg"
                  onChange={(e) => handleFileSelection(e.target.files?.[0])}
                />

                {selectedFile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <FileAudio size={44} color="var(--cyan-glow)" />
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
                      {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </div>
                    {filePreviewUrl && (
                      <audio controls src={filePreviewUrl} style={{ width: '100%', maxWidth: 400, marginTop: 8 }} />
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile();
                      }}
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#f87171',
                        padding: '4px 14px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Remove Audio
                    </button>
                  </div>
                ) : (
                  <div>
                    <Mic size={40} color="var(--cyan-glow)" style={{ marginBottom: 12 }} />
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>
                      Click or Drag & Drop audio recording
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>
                      Supported formats: MP3 / WAV / M4A / OGG (Max 25MB)
                    </div>
                  </div>
                )}
              </div>

              {/* Citizen automatic scanning tip */}
              <div style={{
                fontSize: 13,
                color: 'var(--cyan-glow)',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid var(--border-glow)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 16px',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <Info size={16} />
                <span>ORION automatically scans voice features, spectrograms, and speech patterns. Extra fields are optional.</span>
              </div>

              {/* Expandable Optional Context Inputs */}
              <div style={{ marginBottom: 20 }}>
                <button
                  type="button"
                  onClick={() => setShowExtraDetails(!showExtraDetails)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: 0,
                    marginBottom: showExtraDetails ? 14 : 0,
                  }}
                >
                  <span>{showExtraDetails ? '− Hide optional context fields' : '+ Add extra context or claimed identity (Optional)'}</span>
                </button>

                {showExtraDetails && (
                  <div className="responsive-grid-2" style={{ marginTop: 10 }}>
                    <div>
                      <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                        Claimed Caller Identity (Optional)
                      </label>
                      <input
                        type="text"
                        value={claimedIdentity}
                        onChange={(e) => setClaimedIdentity(e.target.value)}
                        placeholder="e.g. Uncle Sharma, Hospital Bail Officer"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          color: '#fff',
                          fontSize: 13,
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                        Call Note / Context (Optional)
                      </label>
                      <input
                        type="text"
                        value={mediaContext}
                        onChange={(e) => setMediaContext(e.target.value)}
                        placeholder="e.g. Urgent request for 50,000 rupees emergency bail"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          color: '#fff',
                          fontSize: 13,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '16px 32px',
                  fontSize: 15,
                  fontWeight: 700,
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
                  border: 'none',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  boxShadow: '0 4px 18px rgba(56, 189, 248, 0.3)',
                }}
              >
                <Shield size={18} />
                <span>Analyze voice</span>
              </button>
            </div>
          )}

          {/* WORKFLOW 5: VIDEO */}
          {activeCategory === 'video' && (
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: 16, marginBottom: 12, color: '#fff' }}>
                Upload video recording for deepfake analysis
              </label>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileSelection(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--border-glow)',
                  borderRadius: 'var(--radius-md)',
                  padding: '40px 24px',
                  textAlign: 'center',
                  background: selectedFile ? 'rgba(56, 189, 248, 0.06)' : 'rgba(0, 0, 0, 0.3)',
                  cursor: 'pointer',
                  marginBottom: 20,
                  transition: 'var(--transition)',
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="video/mp4,video/quicktime,video/webm"
                  onChange={(e) => handleFileSelection(e.target.files?.[0])}
                />

                {selectedFile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                    <FileVideo size={44} color="var(--cyan-glow)" />
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
                      {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </div>
                    {filePreviewUrl && (
                      <video controls src={filePreviewUrl} style={{ maxHeight: 200, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glow)' }} />
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile();
                      }}
                      style={{
                        background: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#f87171',
                        padding: '4px 14px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      Remove Video
                    </button>
                  </div>
                ) : (
                  <div>
                    <Video size={40} color="var(--cyan-glow)" style={{ marginBottom: 12 }} />
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>
                      Click or Drag & Drop video clip
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>
                      Supported formats: MP4 / MOV / WEBM (Max 50MB)
                    </div>
                  </div>
                )}
              </div>

              {/* Citizen automatic scanning tip */}
              <div style={{
                fontSize: 13,
                color: 'var(--cyan-glow)',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid var(--border-glow)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 16px',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <Info size={16} />
                <span>ORION automatically scans face embeddings, temporal flicker, and lip-sync alignment. Extra fields are optional.</span>
              </div>

              {/* Expandable Optional Context Inputs */}
              <div style={{ marginBottom: 20 }}>
                <button
                  type="button"
                  onClick={() => setShowExtraDetails(!showExtraDetails)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: 0,
                    marginBottom: showExtraDetails ? 14 : 0,
                  }}
                >
                  <span>{showExtraDetails ? '− Hide optional context fields' : '+ Add extra context or claimed identity (Optional)'}</span>
                </button>

                {showExtraDetails && (
                  <div className="responsive-grid-2" style={{ marginTop: 10 }}>
                    <div>
                      <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                        Claimed Person in Video (Optional)
                      </label>
                      <input
                        type="text"
                        value={claimedIdentity}
                        onChange={(e) => setClaimedIdentity(e.target.value)}
                        placeholder="e.g. CEO Rajesh Kumar, Minister"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          color: '#fff',
                          fontSize: 13,
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                        Video Context (Optional)
                      </label>
                      <input
                        type="text"
                        value={mediaContext}
                        onChange={(e) => setMediaContext(e.target.value)}
                        placeholder="e.g. Video call statement asking for wire transfer"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                          color: '#fff',
                          fontSize: 13,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!selectedFile}
                style={{
                  width: '100%',
                  padding: '16px 32px',
                  fontSize: 15,
                  fontWeight: 700,
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
                  border: 'none',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  cursor: !selectedFile ? 'not-allowed' : 'pointer',
                  opacity: !selectedFile ? 0.5 : 1,
                  boxShadow: '0 4px 18px rgba(56, 189, 248, 0.3)',
                }}
              >
                <Shield size={18} />
                <span>Analyze video</span>
              </button>
            </div>
          )}

          {/* WORKFLOW 6: ACCOUNT */}
          {activeCategory === 'account' && (
            <div>
              <div style={{ marginBottom: 18 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>
                  Something unusual happened with this account?
                </h3>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
                  Enter login activity details to evaluate impossible travel velocity and credential spray anomalies.
                </p>
              </div>

              <div className="responsive-grid-2" style={{ marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Account / User ID</label>
                  <input
                    type="text"
                    value={accountUserId}
                    onChange={(e) => setAccountUserId(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Location in Login Alert</label>
                  <input
                    type="text"
                    value={accountCity}
                    onChange={(e) => setAccountCity(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: 14 }}
                  />
                </div>
              </div>

              <div className="responsive-grid-2" style={{ marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>IP Address</label>
                  <input
                    type="text"
                    value={accountIp}
                    onChange={(e) => setAccountIp(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Device / User Agent</label>
                  <input
                    type="text"
                    value={accountDevice}
                    onChange={(e) => setAccountDevice(e.target.value)}
                    style={{ width: '100%', padding: '12px 16px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: '#fff', fontSize: 14 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 600 }}>Try Examples:</span>
                  {presets.account.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setAccountUserId(p.userId);
                        setAccountCity(p.city);
                        setAccountIp(p.ip);
                        setAccountDevice(p.device);
                      }}
                      style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-full)', padding: '5px 14px', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  style={{
                    padding: '14px 32px',
                    fontSize: 15,
                    fontWeight: 700,
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
                    border: 'none',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    boxShadow: '0 4px 18px rgba(56, 189, 248, 0.3)',
                  }}
                >
                  <Key size={18} />
                  <span>Check activity</span>
                </button>
              </div>
            </div>
          )}

        </form>
      </div>

    </div>
  );
}

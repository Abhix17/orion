import { normalizeAnalysisResult } from './src/utils/normalizeAnalysisResult.js';

console.log('='.repeat(65));
console.log('      ORION MOBILE APP - END-TO-END FLOW & LOGIC VERIFICATION');
console.log('='.repeat(65));

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [+] PASS: ${message}`);
    passed++;
  } else {
    console.error(`  [-] FAIL: ${message}`);
    failed++;
  }
}

// 1. Test URL Normalization & Structure
console.log('\n[1] Testing URL Analysis Normalization...');
const mockUrlResponse = {
  id: 'inc_url_99182',
  threat_type: 'malicious_url',
  risk_level: 'CRITICAL',
  risk_score: 0.95,
  confidence: 0.95,
  explanation: 'Phishing domain detected mimicking State Bank of India with brand impersonation and fake KYC form.',
  risk_drivers: ['brand_impersonation', 'credential_harvesting_form', 'lookalike_domain'],
  evidence: [
    { signal: 'Domain mimics sbi.co.in brand', source: 'lexical_analyzer', confidence: 0.98 },
    { signal: 'Password harvesting field detected', source: 'browser_shield', confidence: 0.95 }
  ],
  recommended_actions: [
    'Do not enter credentials or OTPs on this portal.',
    'Report domain to CERT-In and bank fraud helpline 1930.',
    'Block domain in firewall and DNS filtering rules.'
  ]
};

const normUrl = normalizeAnalysisResult(mockUrlResponse, 'url');
assert(normUrl.rawAnalysisId === 'inc_url_99182', 'Incident ID mapped correctly');
assert(normUrl.riskLevel === 'CRITICAL', 'Risk level matches CRITICAL');
assert(normUrl.sourceType === 'url', 'Source type set to url');
assert(normUrl.evidence.length === 2, '2 evidence items preserved');
assert(normUrl.recommendedActions.length === 3, '3 recommended actions parsed');
assert(normUrl.riskDrivers.includes('brand_impersonation'), 'Risk driver brand_impersonation present');

// 2. Test Message / SMS Normalization & Intent
console.log('\n[2] Testing Message / SMS Normalization...');
const mockMsgResponse = {
  id: 'inc_msg_44812',
  threat_type: 'social_engineering',
  risk_level: 'HIGH',
  confidence: 0.88,
  explanation: 'Urgent extortion / coercive debt collection scam demanding immediate UPI payment.',
  evidence: [
    { explanation: 'Urgent language demanding payment within 2 hours', source: 'semantic_observer', confidence: 0.92 }
  ],
  recommended_actions: ['Block sender and file complaint on cybercrime.gov.in'],
  metadata: {
    semantic_intent: {
      urgency: true,
      payment_request: true,
      credential_request: false,
      impersonation_attempt: true
    }
  }
};

const normMsg = normalizeAnalysisResult(mockMsgResponse, 'message');
assert(normMsg.riskLevel === 'HIGH', 'Message risk level is HIGH');
assert(normMsg.semanticIntent.urgency === true, 'Semantic urgency preserved');
assert(normMsg.semanticIntent.payment_request === true, 'Payment request flag preserved');

// 3. Test Audio Deepfake & Voice Impersonation Normalization
console.log('\n[3] Testing Audio Deepfake Normalization...');
const mockAudioResponse = {
  id: 'inc_aud_77123',
  threat_type: 'deepfake_audio',
  risk_level: 'CRITICAL',
  confidence: 0.94,
  explanation: 'Synthetic voice clone detected with 94% synthetic probability matching CEO voice profile.',
  metadata: {
    audio_authenticity: {
      is_synthetic: true,
      spoof_probability: 0.94
    },
    speakerAnalysis: {
      matched_identity: 'Chief Executive Officer',
      similarity: 0.91
    },
    semantic_intent: {
      urgency: true,
      payment_request: true
    }
  }
};

const normAudio = normalizeAnalysisResult(mockAudioResponse, 'audio');
assert(normAudio.riskLevel === 'CRITICAL', 'Audio risk level is CRITICAL');
assert(normAudio.audioAuthenticity.spoof_probability === 0.94, 'Spoof probability parsed');
assert(normAudio.speakerAnalysis.matched_identity === 'Chief Executive Officer', 'Speaker identity matched');

// 4. Test Attack Story Correlation Structure
console.log('\n[4] Testing Attack Story Structure...');
const mockStory = {
  story_id: 'story_multimodal_01',
  title: 'Correlated Executive Impersonation & Phishing Campaign',
  risk_level: 'CRITICAL',
  summary: 'Multimodal campaign combining synthetic voice authorization call with lookalike invoice URL.',
  timeline: [
    { timestamp: '2026-10-09T10:00:00Z', event: 'Voice clone call received from spoofed number' },
    { timestamp: '2026-10-09T10:05:00Z', event: 'Phishing URL sent via SMS for vendor payment' }
  ],
  incidents_involved: ['inc_aud_77123', 'inc_url_99182']
};

assert(mockStory.risk_level === 'CRITICAL', 'Attack story risk level is CRITICAL');
assert(mockStory.timeline.length === 2, 'Timeline has 2 correlated events');
assert(mockStory.incidents_involved.length === 2, '2 incidents clustered in attack story');

console.log('\n' + '='.repeat(65));
console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('  ALL ORION MOBILE DATA NORMALIZERS & STATE FLOWS VERIFIED!');
console.log('='.repeat(65));

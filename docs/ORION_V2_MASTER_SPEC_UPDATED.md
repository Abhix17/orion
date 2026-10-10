# ORION v2 --- Final Master Project Specification

## AI-Powered Cyber Threat Intelligence & Digital Trust Platform

### BPUT Hackathon PS09 --- CYBERGUARD

**Document status:** Final implementation master document\
**Product:** ORION v2\
**Problem-statement context:** BPUT Hackathon PS09 --- CYBERGUARD\
**Implementation status:** Phase 0--8 complete\
**Final status:** **READY FOR FINAL DEMO**\
**Last updated:** 30 September 2026

> This document supersedes the older ORION v2 master specifications
> whose phase plan stopped at Phase 6 and whose model, dashboard,
> response, evaluation, and hardening sections described planned rather
> than implemented functionality.

------------------------------------------------------------------------

# 1. Product Definition

ORION v2 is an evidence-grounded AI cyber-defence and digital-trust
platform for detecting, explaining, correlating, prioritizing, and
responding to cyber threats across heterogeneous digital signals.

ORION is the product identity. **CYBERGUARD** remains the PS09
problem-statement concept.

The platform protects two connected layers:

### Human / Digital Trust Layer

-   phishing and social engineering
-   malicious and deceptive URLs
-   digital impersonation
-   AI-generated and manipulated media
-   deepfake images and video
-   synthetic speech and voice impersonation
-   identity/context anomalies

### Technology / Security Layer

-   credential theft indicators
-   account takeover
-   abnormal authentication behaviour
-   suspicious sessions
-   unusual devices and locations
-   behavioural anomalies
-   selected threat-intelligence and technical indicators

The final product chain is:

``` text
INPUT
  ↓
DETECTION
  ↓
EVIDENCE NORMALIZATION
  ↓
ENTITY RESOLUTION
  ↓
CROSS-MODAL CORRELATION / FUSION
  ↓
THREAT CLASSIFICATION
  ↓
DETERMINISTIC RISK ASSESSMENT
  ↓
XAI / EVIDENCE-GROUNDED EXPLANATION
  ↓
CANONICAL INCIDENT
  ↓
RESPONSE RECOMMENDATION
  ↓
ADVISORY / SIMULATED RESPONSE
  ↓
AUDIT TRAIL
  ↓
EVALUATION
  ↓
SOC COMMAND CENTER
```

------------------------------------------------------------------------

# 2. Final Implementation Status

  -----------------------------------------------------------------------
  Phase                   Status                  Final role
  ----------------------- ----------------------- -----------------------
  Phase 0                 COMPLETE                Baseline, safety
                                                  freeze, architecture
                                                  verification

  Phase 1                 COMPLETE                Real analysis
                                                  experience + multimodal
                                                  upload UX

  Phase 2                 COMPLETE                Browser Shield UX +
                                                  dashboard integration

  Phase 3A                COMPLETE                Real URL intelligence

  Phase 3B                COMPLETE                Real audio / voice
                                                  intelligence

  Phase 3C                COMPLETE                Real image / identity
                                                  intelligence

  Phase 3D                COMPLETE                Real video deepfake
                                                  pipeline

  Phase 3E                COMPLETE                Multimodal evidence
                                                  fusion

  Phase 4                 COMPLETE                Risk, XAI, incident
                                                  experience

  Phase 5                 COMPLETE                SOC Command Center

  Phase 6                 COMPLETE                Response / Playbooks

  Phase 7                 COMPLETE                Evaluation framework

  Phase 8                 COMPLETE                Final hardening and
                                                  system audit
  -----------------------------------------------------------------------

**No Phase 9 is planned.**

------------------------------------------------------------------------

# 3. PS09 Alignment

ORION addresses the PS09 requirements through:

  -----------------------------------------------------------------------
  PS09 requirement                    ORION implementation
  ----------------------------------- -----------------------------------
  Multi-source analysis               URL, message/email, image, audio,
                                      video, browser, authentication
                                      events

  Threat classification               Canonical threat taxonomy +
                                      assessment

  Risk/severity scoring               Deterministic Risk Engine v4.0

  Evidence/indicators                 Canonical EvidenceItem with
                                      provenance

  Explainability                      Evidence-grounded XAI and risk
                                      contribution breakdown

  Response                            Advisory and simulated
                                      response/playbook workflow

  Dashboard                           SOC Command Center

  Phishing/social engineering         URL + message intelligence +
                                      Browser Shield

  Digital impersonation               Identity profiles +
                                      semantic/context analysis

  Deepfake/media                      Image, video, audio and voice
                                      analysis

  Technical anomaly                   Authentication / ATO / behavioural
                                      analysis

  Evaluation                          Ground-truth evaluation framework
                                      and dashboard

  Deployment/security                 Final Phase 8 hardening and
                                      documentation
  -----------------------------------------------------------------------

The prototype demonstrates more than the minimum three scenario
requirement while explicitly marking capabilities that lack sufficient
ground truth as `NOT_MEASURED`.

------------------------------------------------------------------------

# 4. Final Architecture

``` text
┌─────────────────────────────────────────────────────────────────────┐
│                           ORION CLIENTS                              │
│                                                                     │
│ Command Center │ Analyze │ Browser Shield │ Future Android/Clients │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                         FastAPI API Gateway
                                │
                    Intelligence Orchestrator
                                │
             ┌──────────────────┼──────────────────┐
             │                  │                  │
             ▼                  ▼                  ▼
       Web / Phishing      Identity / Media    Behaviour / ATO
       Intelligence       Intelligence        Intelligence
             │                  │                  │
             └──────────────────┼──────────────────┘
                                ▼
                       Provider Gateway
                                │
                       Evidence Normalizer
                                │
                        Entity Resolution
                                │
                     Evidence Correlation/Fusion
                                │
                       Threat Classification
                                │
                    Deterministic Risk Engine
                                │
                       Explainability / XAI
                                │
                    Canonical Incident Service
                                │
                    Response / Playbook Service
                                │
                         Immutable Audit Trail
                                │
                   ┌────────────┴────────────┐
                   ▼                         ▼
                SQLite                SOC Command Center
                                             │
                                             ▼
                                      Evaluation Dashboard
```

### Architectural principles

1.  Detection providers produce observations/evidence; they do not own
    final risk.
2.  Evidence is the common language across modalities.
3.  Correlation confidence and model confidence are separate concepts.
4.  Risk is deterministic and policy-versioned.
5.  XAI must reference actual evidence IDs.
6.  Provider failure is never silently converted to `SAFE`.
7.  LLMs are semantic observers/helpers, not final risk deciders.
8.  Response is advisory or simulated; no autonomous destructive action
    is permitted.
9.  Synthetic/demo data is clearly labelled.
10. Evaluation reports only what the available ground truth supports.

------------------------------------------------------------------------

# 5. Product Surfaces

``` text
ORION v2
├── COMMAND CENTER
│   ├── Overview
│   ├── Incident Feed
│   ├── Threat Intelligence
│   ├── Browser Shield
│   └── System Status
│
├── ANALYZE
│   ├── URL / Website
│   ├── Message / Email
│   ├── Image
│   ├── Video
│   ├── Audio
│   └── Authentication Event
│
├── BROWSER SHIELD
│   ├── Extension Status
│   ├── Current Site Analysis
│   ├── Warning Events
│   └── Investigate in ORION
│
├── INCIDENTS
│   ├── Search
│   ├── Filters
│   ├── Pagination
│   └── Incident Drawer
│
├── INTELLIGENCE
│   ├── Entities
│   ├── Relationships
│   ├── Attack Chains
│   └── Threat Intelligence
│
├── EVALUATION
│   ├── Overview
│   ├── Detection Metrics
│   ├── Scenario Matrix
│   ├── Risk Evaluation
│   ├── Response Evaluation
│   ├── Provider Availability
│   ├── Latency
│   ├── Sample Audit
│   └── Dataset Provenance
│
└── SYSTEM
    ├── Provider Status
    ├── Database Status
    └── Risk Policy Status
```

------------------------------------------------------------------------

# 6. Browser Shield

Browser Shield is a Chrome/Edge Manifest V3 extension and a first-class
ORION client.

## Flow

``` text
Current webpage
      ↓
Bounded DOM/security signal extraction
      ↓
ORION Browser Analysis API
      ↓
Web Intelligence
      ↓
Evidence → Risk → Incident
      ↓
Warning / Investigate
```

## Allowed signals

-   current URL
-   hostname
-   page title
-   visible links
-   form destinations
-   password-field presence as a boolean
-   bounded visible security-relevant text/metadata
-   claimed organization/brand cues

## Prohibited collection

-   passwords
-   keystrokes
-   cookies
-   authentication tokens
-   session tokens
-   authentication headers
-   arbitrary browsing history
-   covert surveillance

The extension has no independent risk engine or incident database. ORION
remains the analysis source of truth.

------------------------------------------------------------------------

# 7. Intelligence Stack

## 7.1 URL / Web Intelligence

### Real model

**URLBERT** - Model: `CrabInHoney/URLBERT` family - Checkpoint:
`CrabInHoney/urlbert-tiny-v4-malicious-url-classifier` - Base:
`CrabInHoney/urlbert-tiny-base-v4` - Architecture:
`BertForSequenceClassification` - 4 layers - 128 hidden dimensions - 2
attention heads - 512-token maximum - approximately 3.69M parameters -
approximately 14.8 MB - labels include benign, defacement, malware, and
phishing

The malicious probability is derived from the malicious classes rather
than treating one provider output as the final ORION risk.

### Supporting intelligence

-   deterministic URL feature extraction
-   threat-intelligence adapter
-   domain/brand relationship signals
-   semantic message analysis
-   browser-extracted security signals

URLBERT output is evidence. The deterministic Risk Engine remains
authoritative.

------------------------------------------------------------------------

# 8. Message / Phishing Intelligence

Signals include:

-   urgency
-   credential requests
-   payment requests
-   authority impersonation
-   suspicious calls to action
-   sender/reply-to mismatch where available
-   brand/domain mismatch
-   suspicious URL references
-   social-engineering language
-   semantic intent

LLM/semantic providers may assist structured observations, but they
cannot directly assign the final risk level.

------------------------------------------------------------------------

# 9. Audio / Voice Intelligence

## Real models

### W2V2 / synthetic-audio detector

**`MelodyMachine/Deepfake-audio-detection-V2`** -
Wav2Vec2ForSequenceClassification - approximately 94.4M parameters -
approximately 360 MB - 16 kHz mono - label 0: spoof - label 1: bonafide

### Whisper

**`openai/whisper-tiny`** - speech transcription - approximately 37.76M
parameters - approximately 151 MB - 16 kHz processing

### Speaker embeddings

**`speechbrain/spkrec-ecapa-voxceleb`** - approximately 20.8M
parameters - approximately 80 MB - 192-dimensional speaker embeddings -
cosine similarity - configured identity-comparison threshold: 0.65

## Supported audio

-   WAV
-   MP3
-   FLAC
-   OGG
-   M4A where supported

Processing includes:

-   format validation
-   mono conversion
-   16 kHz normalization
-   quality checks
-   transcription
-   synthetic/bonafide analysis
-   speaker similarity where an authorized identity profile exists
-   semantic intent analysis

### Important distinctions

``` text
Synthetic voice indicator ≠ identity proof
Speaker similarity ≠ voice authenticity
AI-generated audio ≠ malicious intent
```

The system combines these as separate evidence dimensions.

------------------------------------------------------------------------

# 10. Image / Identity Intelligence

## Real image stack

### AI-generated image detection

**`umm-maybe/AI-image-detector`** - ViT-based image detector - 224×224
input - class 0: artificial - class 1: human

### Face detection

**YuNet** - multi-face detection - landmarks - confidence - used for
face localization and alignment

### Face identity embeddings

**`gaunernst/vit_tiny_patch8_112.arcface_ms1mv3`** - 512-dimensional
identity embeddings - aligned 112×112 face crops - cosine similarity -
authorized identity profiles only

### OCR

EasyOCR is used for text extraction and
social-engineering/identity-context signals.

### Forensics

OpenCV-based:

-   Laplacian analysis
-   FFT/frequency analysis
-   noise/compression observations
-   metadata treated as contextual rather than proof

### Input safety

-   magic-byte validation
-   bounded pixel count
-   maximum dimensions
-   upload-size controls
-   temporary-file cleanup

Identity similarity is explicitly described as resemblance/evidence, not
definitive identity verification.

------------------------------------------------------------------------

# 11. Video Deepfake Intelligence

## Real video detector

**`dima806/deepfake_vs_real_image_detection`**

The current implementation is intentionally described accurately:

> It is a frame-level ViT detector applied to bounded video sampling,
> with deterministic temporal aggregation.

It is **not** claimed to be an end-to-end temporal deepfake model.

## Pipeline

``` text
Video
 ↓
Bounded frame sampling
 ↓
Face detection/tracking
 ↓
Frame-level ViT inference
 ↓
Temporal consistency aggregation
 ↓
Audio demux
 ↓
W2V2 / Whisper / ECAPA
 ↓
OCR / identity / semantic signals
 ↓
Cross-modal evidence fusion
 ↓
Risk / XAI / incident
```

Sampling is bounded to protect resource usage.

Temporal aggregation dampens isolated frame spikes rather than
interpreting a single frame as definitive proof.

------------------------------------------------------------------------

# 12. Multimodal Evidence Fusion

Phase 3E unified the separate modality engines.

Canonical chain:

``` text
Detect
 ↓
Normalize
 ↓
Resolve entities
 ↓
Correlate temporally
 ↓
Correlate across modalities
 ↓
Fuse evidence
 ↓
Score risk
 ↓
Explain
 ↓
Create incident
```

Implemented capabilities include:

-   canonical `EvidenceItem`
-   provenance
-   provider status
-   deduplication
-   entity model/resolution
-   temporal correlation
-   cross-modal correlation
-   evidence graph
-   contradiction handling
-   correlation confidence
-   multimodal synergy
-   evidence-linked XAI
-   attack-chain construction
-   MITRE ATT&CK grounding
-   incident/media deduplication

Model confidence must not be confused with correlation confidence.

------------------------------------------------------------------------

# 13. Behavioural / Account Takeover Intelligence

Authentication events can contain:

-   timestamp
-   authentication result
-   IP
-   device
-   location where authorized
-   session information
-   event context

Signals include:

-   failed-login bursts
-   password-spraying patterns
-   new device
-   unusual location
-   unusual time
-   impossible/suspicious travel
-   session anomalies
-   behavioural deviations

Isolation Forest is used where appropriate for anomaly detection.

A deterministic interaction/risk layer integrates behavioural evidence
with other incident evidence.

------------------------------------------------------------------------

# 14. Canonical Evidence Model

Evidence is the universal language of ORION.

A canonical evidence item can contain:

``` text
evidence_id
type
source
provider
status
value
confidence
timestamp
entity_refs
explanation
provenance
```

Examples:

``` text
malicious_url_signal
brand_lookalike
credential_request
urgent_language
synthetic_audio
speaker_similarity
ai_generated_image
face_similarity
video_frame_anomaly
temporal_inconsistency
new_device
failed_login_burst
geo_velocity
threat_intel_match
```

Provider output is evidence, not truth.

------------------------------------------------------------------------

# 15. Threat Taxonomy

Canonical categories used across the Command Center include:

-   Phishing
-   Malicious URL
-   Digital Impersonation
-   Deepfake
-   Account Takeover
-   Behavioural Anomaly
-   Other

Provider-specific aliases are normalized.

Detailed threat types can include:

-   `phishing`
-   `phishing_url`
-   `malicious_url`
-   `lookalike_domain`
-   `impersonation`
-   `identity_fraud`
-   `deepfake_image`
-   `deepfake_video`
-   `synthetic_audio`
-   `voice_clone`
-   `account_takeover`
-   `authentication_anomaly`
-   `ato`
-   `behavioural_anomaly`
-   `abnormal_user_activity`

Assessment values include:

``` text
SAFE
SUSPICIOUS
MALICIOUS
INCONCLUSIVE
```

------------------------------------------------------------------------

# 16. Deterministic Risk Engine

Risk policy is centralized in:

``` text
backend/app/risk/risk_config.yaml
```

Current policy version:

**4.0**

Risk bands:

  Band             Final score
  ---------- -----------------
  SAFE                 \< 0.20
  LOW          0.20 -- \< 0.40
  MEDIUM       0.40 -- \< 0.70
  HIGH         0.70 -- \< 0.85
  CRITICAL              ≥ 0.85

The risk engine:

-   consumes normalized evidence
-   applies deterministic weights
-   supports interaction/synergy rules
-   supports dampening
-   supports circuit breakers
-   bounds the final score to \[0, 1\]
-   records the policy version
-   exposes contribution breakdown

Provider failure does not produce SAFE.

Unavailable evidence contributes no positive benign signal; inconclusive
evidence is explicitly bounded and visible.

A documented geo-velocity circuit breaker can raise risk when physically
impossible travel is detected, including the configured \>850 km/h
condition.

Risk is not decided by an LLM.

------------------------------------------------------------------------

# 17. Explainability / XAI

XAI is evidence-grounded.

Every important observation references an `evidence_id`.

The Incident Drawer exposes:

-   assessment
-   why flagged
-   evidence IDs
-   risk contribution breakdown
-   interaction contributions
-   contradictory/inconclusive evidence
-   what would change the assessment
-   determinism/policy information

The system deliberately avoids unsupported language such as:

-   "identity verified"
-   "deepfake proven"
-   "threat eliminated"

Preferred terminology includes:

-   synthetic voice indicators
-   acoustic speaker resemblance match
-   suspected AI-manipulated media
-   evidence indicates
-   advisory containment recommended
-   simulated response completed

------------------------------------------------------------------------

# 18. Canonical Incident

Every meaningful analysis can become a canonical incident containing:

``` text
incident_id
timestamp
source
input_type
threat_type
assessment
risk_level
risk_score
evidence
entities
XAI/explanation
attack_chain
MITRE mappings
recommended response
response state
incident status
policy version
```

Incident lifecycle:

``` text
NEW
 ↓
ACKNOWLEDGED
 ↓
INVESTIGATING
 ↓
CONTAINED
 ↓
RESOLVED
```

Alternative terminal state:

``` text
FALSE_POSITIVE
```

Transitions are validated server-side.

Analyst notes are append-only, timestamped, attributable, and bounded.

------------------------------------------------------------------------

# 19. SOC Command Center

Phase 5 transformed the dashboard into an operational SOC Command
Center.

## Overview

Provides:

-   Total Events
-   Active Incidents
-   Critical Incidents
-   High-Risk Incidents
-   Threats Detected
-   Risk Distribution
-   Canonical Threat Distribution
-   Threat Activity Timeline
-   Active Incident Stream
-   Needs Attention queue

## Incident Feed

Supports:

-   severity filters
-   status filters
-   threat-category filters
-   time-range filters
-   modality/source filters
-   backend search
-   bounded pagination

Search can cover:

-   incident ID
-   title
-   summary/input
-   threat type
-   extracted entities

Pagination is backend-driven and exposes total-count information.

## Incident Drawer

The final Incident Drawer provides:

-   severity
-   threat
-   risk score
-   policy version
-   XAI
-   evidence
-   timeline
-   entities
-   attack chain
-   MITRE ATT&CK
-   response recommendations
-   analyst controls
-   analyst notes
-   response lifecycle
-   response audit trail

## System Status

Exposes operational visibility for:

-   FastAPI gateway
-   SQLite/WAL
-   Risk Engine policy
-   model/provider status
-   provider latency information where available

Dashboard metrics are derived from persisted database data rather than
fabricated frontend counters.

------------------------------------------------------------------------

# 20. Response / Playbooks

Phase 6 provides a complete response workflow.

## Modes

### ADVISORY

Logs analyst intent.

No external system is modified.

### SIMULATED

Runs an internal/database-only simulation.

Every simulated action must report:

``` text
real_systems_modified = false
```

## Response lifecycle

``` text
RECOMMENDED
 ↓
ACKNOWLEDGED
 ↓
EXECUTING
 ↓
COMPLETED
```

Failure:

``` text
EXECUTING → FAILED
```

Cancellation is explicitly controlled.

Invalid jumps are rejected.

## Response categories

Examples include:

### Phishing

-   WARN_USER
-   QUARANTINE_MESSAGE (SIMULATED)
-   BLOCK_SUSPICIOUS_URL (SIMULATED)
-   REPORT_PHISHING
-   ESCALATE_ANALYST

### Malicious URL

-   BLOCK_URL (SIMULATED)
-   WARN_USER
-   INVESTIGATE_URL
-   REPORT_INDICATOR
-   ESCALATE_ANALYST

### Impersonation

-   FLAG_IMPERSONATION
-   VERIFY_IDENTITY
-   WARN_TARGET
-   REPORT_IMPERSONATION
-   ESCALATE_ANALYST

### Deepfake/media

-   FLAG_MEDIA
-   REQUEST_IDENTITY_VERIFICATION
-   WARN_RECIPIENT
-   REPORT_MEDIA
-   ESCALATE_ANALYST

### ATO

-   REQUIRE_MFA
-   REVOKE_SESSION (SIMULATED)
-   LOCK_ACCOUNT (SIMULATED)
-   RESET_CREDENTIALS (SIMULATED)
-   ESCALATE_ANALYST

### Behavioural anomaly

-   INVESTIGATE_ACTIVITY
-   REQUIRE_MFA
-   REVIEW_SESSION
-   CONTAIN_ACCOUNT (SIMULATED)
-   ESCALATE_ANALYST

All recommendations are evidence-linked.

ORION does not autonomously modify real credentials, sessions, accounts,
firewalls, IP blocks, or external mail systems.

------------------------------------------------------------------------

# 21. Response Audit Trail

Every response action is persisted with:

-   response ID
-   incident ID
-   action
-   status
-   mode
-   priority
-   reason
-   evidence IDs
-   actor
-   timestamps
-   result/error

The audit trail is append-only/immutable.

Example:

``` text
Incident detected
→ Risk assessed CRITICAL
→ Response recommended
→ Analyst acknowledged
→ Simulation started
→ Simulation completed
→ No external system modified
```

------------------------------------------------------------------------

# 22. Evaluation Framework

Phase 7 introduced a reproducible evaluation framework.

## Ground truth

Current evaluation dataset:

**22 samples**

All current cases are explicitly labelled:

**`SYNTHETIC_DATA`**

The evaluation framework does not present these fixtures as real-world
benchmark evidence.

## Current coverage

Measured scenarios include available phishing, malicious URL, benign,
deepfake-audio, and account-takeover cases.

Image/video deepfake, impersonation, and some multimodal-fusion
evaluations are explicitly marked:

``` text
NOT MEASURED — INSUFFICIENT GROUND TRUTH
```

## Metrics

Where supported:

-   TP
-   TN
-   FP
-   FN
-   Precision
-   Recall
-   F1
-   FPR
-   Accuracy where appropriate
-   risk-band agreement
-   over-classification
-   under-classification
-   response appropriateness
-   latency

Zero-denominator states are not converted into fabricated 100% values.

Metrics can return:

``` json
{
  "value": null,
  "status": "NOT_MEASURED"
}
```

when ground truth is insufficient.

## Provider failure evaluation

The invariant:

``` text
UNAVAILABLE ≠ SAFE
```

is explicitly tested.

## Evaluation Dashboard

Nine-tab structure:

1.  Overview
2.  Detection Metrics
3.  Scenario Matrix
4.  Risk Evaluation
5.  Response Evaluation
6.  Provider Availability
7.  Latency
8.  Sample Audit
9.  Dataset Provenance

The dashboard displays sample size and `NOT_MEASURED` states rather than
inventing a single "AI accuracy" score.

------------------------------------------------------------------------

# 23. Evaluation API

Verified evaluation endpoints include:

``` text
GET /api/v1/evaluation/summary
GET /api/v1/evaluation/scenarios
GET /api/v1/evaluation/metrics
GET /api/v1/evaluation/latency
GET /api/v1/evaluation/providers
GET /api/v1/evaluation/risk
GET /api/v1/evaluation/response
GET /api/v1/evaluation/ground-truth
```

Existing evaluation functionality is preserved alongside the Phase 7
additions.

------------------------------------------------------------------------

# 24. Model Registry

The final implemented model/provider stack includes:

  --------------------------------------------------------------------------------------------
  Area                                Implementation
  ----------------------------------- --------------------------------------------------------
  URL                                 URLBERT
                                      `CrabInHoney/urlbert-tiny-v4-malicious-url-classifier`

  Semantic observation                Gemini / Qwen providers where configured

  Local semantic option               Local Qwen

  Audio deepfake                      `MelodyMachine/Deepfake-audio-detection-V2`

  Speech transcription                `openai/whisper-tiny`

  Speaker identity                    `speechbrain/spkrec-ecapa-voxceleb`

  AI image detection                  `umm-maybe/AI-image-detector`

  Face detection                      YuNet

  Face identity                       `gaunernst/vit_tiny_patch8_112.arcface_ms1mv3`

  OCR                                 EasyOCR

  Video frame detection               `dima806/deepfake_vs_real_image_detection`

  Behavioural anomaly                 Isolation Forest + deterministic behaviour rules

  Threat intelligence                 Provider abstraction + local fixture/cache where
                                      configured

  Risk                                Deterministic Risk Engine v4.0

  XAI                                 Evidence-grounded deterministic explanation layer
  --------------------------------------------------------------------------------------------

Not every provider is required for every analysis.

Provider availability is explicit.

------------------------------------------------------------------------

# 25. Provider Failure Contract

Every provider must distinguish:

``` text
AVAILABLE
UNAVAILABLE
FAILED
INCONCLUSIVE
```

Failure propagation:

``` text
Provider failure
 ↓
Evidence status = unavailable/inconclusive
 ↓
Risk remains uncertainty-aware
 ↓
XAI explains missing evidence
 ↓
Incident preserves provider state
 ↓
Evaluation records availability
```

A failed provider cannot silently produce a benign verdict.

------------------------------------------------------------------------

# 26. Security and Privacy Boundary

ORION is an authorized defensive cybersecurity prototype.

The system does not:

-   collect passwords
-   collect keystrokes
-   collect cookies
-   collect session tokens
-   perform covert surveillance
-   perform arbitrary browsing-history collection
-   perform unauthorized exploitation
-   perform arbitrary network scanning
-   deploy malware
-   perform destructive autonomous remediation

Response actions are advisory or simulated.

User-initiated media processing does not imply continuous
microphone/webcam surveillance.

Temporary uploaded media is processed under bounded resource controls
and cleaned up after processing.

------------------------------------------------------------------------

# 27. Phase 8 Final Hardening

Phase 8 audited:

-   secrets/configuration
-   API validation
-   file uploads
-   Browser Shield
-   provider failure handling
-   model lifecycle
-   resource limits
-   database reliability
-   Risk Engine
-   XAI
-   response safety
-   evaluation integrity
-   frontend information leakage
-   UI honesty
-   error handling
-   logging/observability
-   dependencies
-   build/lint
-   end-to-end demo
-   deployment/setup documentation
-   repository cleanup
-   architecture consistency

### Upload limits

Final hardening enforces bounded upload sizes including:

-   images: 15 MB
-   audio: 25 MB
-   video: 50 MB

Validation includes extension and magic-byte checks, decoding
validation, and temporary-file cleanup.

### Secrets

Provider credentials remain server-side.

`backend/.env.example` contains placeholders rather than real
credentials.

Browser Shield contains no provider API secrets.

------------------------------------------------------------------------

# 28. Final Verification

Final Phase 8 verification:

``` text
Backend:
226 / 226 tests passed
0 failures
0 regressions

Frontend:
npm run build → PASS
Vite production build → PASS

Lint:
0 errors
33 warnings
```

The final system preserves all Phase 0--7 functionality.

Warnings are not treated as failures merely to improve the reported
number.

------------------------------------------------------------------------

# 29. Final Demonstration Scenarios

## Scenario A --- Phishing / Malicious URL

``` text
URL/message
 ↓
URL + semantic analysis
 ↓
Evidence
 ↓
Threat classification
 ↓
Risk
 ↓
XAI
 ↓
Incident
 ↓
Response recommendation
 ↓
Simulated/advisory response
 ↓
Audit trail
```

## Scenario B --- Voice Impersonation

``` text
Audio
 ↓
W2V2 synthetic-audio analysis
 ↓
Whisper transcription
 ↓
ECAPA speaker similarity
 ↓
Semantic intent
 ↓
Evidence fusion
 ↓
Impersonation risk
 ↓
XAI
 ↓
Response
```

## Scenario C --- Image/Video Deepfake

``` text
Media
 ↓
AI-generation / manipulation signals
 ↓
Face detection
 ↓
Identity resemblance where authorized
 ↓
OCR/context
 ↓
Temporal/audio signals for video
 ↓
Evidence fusion
 ↓
Risk
 ↓
Incident
```

## Scenario D --- Account Takeover

``` text
Authentication event
 ↓
Behavioural features
 ↓
Isolation Forest / deterministic rules
 ↓
New device/location/session evidence
 ↓
Risk
 ↓
XAI
 ↓
ATO incident
 ↓
MFA / simulated containment recommendations
```

## Scenario E --- SOC Investigation

``` text
Command Center
 ↓
Critical incident
 ↓
Incident Drawer
 ↓
Risk contribution
 ↓
Evidence
 ↓
Attack chain
 ↓
MITRE ATT&CK
 ↓
Response
 ↓
Audit trail
 ↓
Evaluation
```

------------------------------------------------------------------------

# 30. Known Limitations

ORION is deliberately honest about limitations.

1.  Current evaluation ground truth is synthetic and limited to 22
    samples.
2.  Image/video deepfake and some multimodal-fusion metrics remain
    `NOT_MEASURED` where ground truth is insufficient.
3.  The video detector is frame-level ViT inference with deterministic
    temporal aggregation, not an end-to-end temporal deepfake model.
4.  Identity matching is a similarity signal against authorized
    profiles, not absolute identity proof.
5.  Synthetic voice detection is probabilistic and does not itself
    establish malicious intent.
6.  Response execution is advisory/simulated rather than connected to
    production infrastructure.
7.  SQLite is the current prototype database.
8.  Provider availability depends on the local environment and
    configured model/provider resources.
9.  Model performance should not be generalized beyond the datasets and
    scenarios actually evaluated.

These limitations are product transparency, not hidden defects.

------------------------------------------------------------------------

# 31. Repository / Documentation Structure

The final repository is conceptually organized around:

``` text
orion-v2/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── analyzers/
│   │   ├── providers/
│   │   ├── services/
│   │   │   ├── orchestrator/
│   │   │   ├── evidence/
│   │   │   ├── classification/
│   │   │   ├── risk/
│   │   │   ├── explainability/
│   │   │   ├── response/
│   │   │   └── correlation/
│   │   └── repositories/
│   └── tests/
│
├── frontend/
├── browser-shield/
├── data/
│   ├── fixtures/
│   ├── evaluation/
│   └── demo/
├── docs/
├── scripts/
├── backend/.env.example
└── README.md
```

The exact implementation layout may contain additional modules, but the
architectural responsibilities above remain authoritative.

------------------------------------------------------------------------

# 32. Final Phase History

The development history is now:

### Phase 0 --- Baseline & Safety Freeze

Established the real backend/frontend baseline, SQLite, model/provider
configuration, Browser Shield boundaries, and honest capability
classification.

### Phase 1 --- Real Analysis Experience + Multimodal Upload UX

Implemented the analyst-facing analysis result hierarchy, fixed frontend
hooks, added multipart media endpoints, and verified regression
stability.

### Phase 2 --- Browser Shield UX + Dashboard Integration

Implemented the MV3 extension lifecycle, bounded DOM inspection, warning
states, investigation deep-links, and Browser Shield integration.

### Phase 3A --- URL Intelligence

Replaced placeholder URL intelligence with real URLBERT inference and
deterministic evidence/risk integration.

### Phase 3B --- Audio / Voice

Implemented real W2V2, Whisper, ECAPA and semantic/context signals with
identity-aware voice impersonation analysis.

### Phase 3C --- Image / Identity

Implemented real AI-image detection, YuNet, ArcFace, OCR and image
forensics with authorized identity comparison.

### Phase 3D --- Video Deepfake

Implemented bounded frame sampling, real frame-level deepfake inference,
temporal aggregation, audio demux and multimodal consistency.

### Phase 3E --- Evidence Fusion

Unified providers through canonical evidence, entity resolution,
correlation, contradiction handling, multimodal fusion, attack chains
and incident deduplication.

### Phase 4 --- Risk + XAI + Incident Experience

Hardened Risk Engine v4.0, risk contribution visualization,
evidence-grounded XAI, incident lifecycle, analyst notes, playbooks and
SOC telemetry.

### Phase 5 --- SOC Command Center

Implemented the operational dashboard, deterministic KPI aggregation,
canonical threat taxonomy, incident search/filtering, pagination,
needs-attention workflow and system status.

### Phase 6 --- Response / Playbooks

Implemented response lifecycle state machines, advisory/simulated
execution, response persistence, immutable audit trails and analyst
controls.

### Phase 7 --- Evaluation

Implemented ground truth provenance, honest metrics, scenario matrix,
risk/response evaluation, provider availability checks, latency
evaluation and the nine-tab Evaluation Dashboard.

### Phase 8 --- Final Hardening

Performed security, reliability, privacy, configuration, upload,
provider, resource, database, UI, evaluation and demo-readiness audits.

------------------------------------------------------------------------

# 33. Definition of Done --- Final

ORION v2 is considered complete because:

-   [x] All planned phases 0--8 completed
-   [x] Real URL model integrated
-   [x] Real audio/voice models integrated
-   [x] Real image/identity models integrated
-   [x] Real video inference integrated
-   [x] Evidence fusion implemented
-   [x] Deterministic Risk Engine v4.0 implemented
-   [x] Evidence-grounded XAI implemented
-   [x] Canonical incident lifecycle implemented
-   [x] SOC Command Center implemented
-   [x] Response/playbook lifecycle implemented
-   [x] Advisory/simulated response safety boundary enforced
-   [x] Evaluation framework implemented
-   [x] Synthetic ground truth explicitly labelled
-   [x] `UNAVAILABLE ≠ SAFE` verified
-   [x] Upload validation hardened
-   [x] Browser Shield privacy boundary verified
-   [x] Secrets kept server-side
-   [x] Full backend regression suite passes
-   [x] Frontend build passes
-   [x] Frontend lint has zero errors
-   [x] Final demo documentation created
-   [x] Unsupported claims removed
-   [x] No destructive autonomous response
-   [x] Final limitations documented

------------------------------------------------------------------------

# 34. Final Product Statement

ORION v2 is not simply a collection of AI detectors.

It is an evidence-grounded cybersecurity workflow:

``` text
SCATTERED DIGITAL SIGNALS
          ↓
      AI / ML ANALYSIS
          ↓
       EVIDENCE
          ↓
   ENTITY + CORRELATION
          ↓
      THREAT TYPE
          ↓
    DETERMINISTIC RISK
          ↓
        XAI
          ↓
      INCIDENT
          ↓
 RESPONSE RECOMMENDATION
          ↓
 ADVISORY / SIMULATED ACTION
          ↓
     AUDIT TRAIL
          ↓
      EVALUATION
          ↓
     SOC COMMAND CENTER
```

The system is designed to answer:

1.  **What happened?**
2.  **What evidence supports it?**
3.  **How risky is it?**
4.  **Why did ORION reach that assessment?**
5.  **What should the analyst do?**
6.  **What did the analyst actually do?**
7.  **What was simulated versus actually changed?**
8.  **Can the result be evaluated and reproduced?**

------------------------------------------------------------------------

# 35. Final Status

``` text
╔══════════════════════════════════════════════════════════════╗
║                       ORION v2                              ║
║                                                              ║
║ Phase 0  Baseline & Safety Freeze                  COMPLETE  ║
║ Phase 1  Analysis + Multimodal UX                  COMPLETE  ║
║ Phase 2  Browser Shield                             COMPLETE  ║
║ Phase 3A URL Intelligence                           COMPLETE  ║
║ Phase 3B Audio / Voice                              COMPLETE  ║
║ Phase 3C Image / Identity                           COMPLETE  ║
║ Phase 3D Video Deepfake                             COMPLETE  ║
║ Phase 3E Evidence Fusion                            COMPLETE  ║
║ Phase 4  Risk + XAI + Incident                     COMPLETE  ║
║ Phase 5  SOC Command Center                         COMPLETE  ║
║ Phase 6  Response / Playbooks                       COMPLETE  ║
║ Phase 7  Evaluation                                 COMPLETE  ║
║ Phase 8  Final Hardening                            COMPLETE  ║
║                                                              ║
║ Backend Tests:       226 / 226 PASSED                         ║
║ Frontend Build:      PASS                                     ║
║ Frontend Lint:       0 errors                                 ║
║ Security Boundary:   VERIFIED                                 ║
║ Evaluation Integrity VERIFIED                                 ║
║ Response Safety:     VERIFIED                                 ║
║                                                              ║
║                    READY FOR FINAL DEMO                       ║
╚══════════════════════════════════════════════════════════════╝
```

**This is the final implementation master document.**

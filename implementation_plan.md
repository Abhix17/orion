# ORION v2 — Phased Implementation Plan & Task Tracker
## AI-Powered Cyber Threat Intelligence & Digital Trust Platform
### Problem Statement: BPUT Hackathon PS09 — CYBERGUARD

---

## 1. Overview & Strategy

This document serves as the master roadmap and live task tracker for the end-to-end implementation of **ORION v2**. In accordance with the engineering contract frozen in `ORION_V2_MASTER_SPEC_FINAL.md` and `docs/model_stack.md`, implementation proceeds in **strictly gated phases**.

### Core Architecture Review
```text
  [ Raw Input: Web / Media / Auth ]
                 │
                 ▼
  [ Provider Gateway: Adapters + Observers ]
                 │
                 ▼
  [ Universal Evidence Layer: Normalized Signals ]
                 │
                 ▼
  [ Evidence Fusion & Threat Classification ]
                 │
                 ▼
  [ Interaction & Deterministic Risk Engine ]
                 │
                 ▼
  [ MITRE ATT&CK Enrichment & XAI Lineage ]
                 │
                 ▼
  [ Canonical Incidents & Response Recommendations ]
                 │
       ┌─────────┴─────────┐
       ▼                   ▼
  [ SQLite DB ]     [ Command Center & Browser Shield ]
```

---

## 2. Phased Roadmap Summary

| Phase | Focus Area | Key Deliverables | Status |
|---|---|---|---|
| **Phase 0** | **Baseline & Safety Freeze** | Establish reproducible baseline, freeze APIs, preserve 43 passing tests, verify system start | ✅ **Completed (100%)** |
| **Phase 1** | **Real Analysis Experience + Multimodal Upload UX** | Unified Analyze landing page, 6 analysis modes, real multipart upload endpoints, file validation, 3-sec risk verdict, isolated simulation lab | ✅ **Completed (100%)** |
| **Phase 2** | **Browser Shield UX + Dashboard Integration** | Browser Shield popup/alert UX, seamless dashboard synchronization, Investigate deep-link | ⏳ **Next Phase** |
| **Phase 3** | **Real ML/AI Inference** | W2V2-AASIST, ECAPA-TDNN, Whisper, ArcFace/OpenCV, URLBERT model inference replacement | ⏳ **Upcoming** |
| **Phase 4** | **Risk + XAI + Incident Experience** | Multiplicative interaction synergies, XAI natural-language rationale, incident dispatch | ⏳ **Upcoming** |
| **Phase 5** | **Command Center** | SOC Command Center, real-time telemetry stream, attack timeline & filtering | ⏳ **Upcoming** |
| **Phase 6** | **Response / Playbooks** | Incident response playbooks, 1930 / I4C reporting workflows, mitigation actions | ⏳ **Upcoming** |
| **Phase 7** | **Evaluation** | In-app benchmark runner, confusion matrices, latency percentiles, ground truth evaluation | ⏳ **Upcoming** |
| **Phase 8** | **Final Polish** | Production hardening, demo scripts, judge walkthrough packaging, performance tuning | ⏳ **Upcoming** |

---


## 3. Detailed Phase-by-Phase Task Tracker

### Phase 0: Foundation & Core Contracts ✅ (Completed)
- [x] **Directory Scaffolding:** Created `backend/`, `frontend/`, `browser-shield/`, `data/fixtures/`, `data/evaluation/`, `scripts/`.
- [x] **Python Environment & Dependencies:** Set up `requirements.txt`.
- [x] **Universal Evidence Contract:** Defined `EvidenceItem`, `EvidenceType`, `SeverityContribution`, and metadata fields in `backend/app/schemas/evidence.py`.
- [x] **Threat Classification & Risk Schemas:** Defined `ThreatType`, `ThreatAssessment`, `RiskLevel`, and `RiskScore` in `backend/app/schemas/threat.py`.
- [x] **Canonical Incident Schema:** Defined `Incident`, `IncidentStatus`, `IncidentEntity`, and `ActionRecommendation` in `backend/app/schemas/incident.py`.
- [x] **Base Provider Contract:** Defined abstract base classes (`BaseProvider`, `ProviderResult`, `ProviderStatus`) in `backend/app/providers/base.py`.
- [x] **Persistence Layer:** Implemented SQLite database engine and repository patterns for incidents, entities, and analysis audit logs in `backend/app/repositories/incident_repo.py` and `backend/app/core/database.py`.
- [x] **API Gateway Scaffold:** Implemented FastAPI entry point (`backend/app/main.py`) with `/api/v1/system/health` and `/api/v1/incidents`.
- [x] **Phase 0 Validation:** All 4 unit test suites passing cleanly (`backend/tests/test_phase0.py`).

### Phase 1: Core Decisioning Engines & Providers ✅ (Completed)
- [x] **Provider Gateway:** Implemented `SemanticProviderGateway` supporting Gemini Flash, Qwen API, Ollama Qwen Instruct, and Heuristic fallback.
- [x] **Threat Intelligence Provider:** Implemented `ThreatIntelProvider` with offline SQLite IOC fixture (`data/fixtures/threat_intel_ioc.db`).
- [x] **Interaction & Deterministic Risk Engine:** Implemented base weights, multiplicative voice impersonation synergy, lookalike+credential synergy, dampening rules, and circuit breakers in `backend/app/risk/engine.py`.
- [x] **MITRE ATT&CK Enrichment Engine:** Implemented mapping to `T1566.002`, `T1566.004`, `T1656`, `T1110.003`, `T1078`, `T1583.001`, `T1539` in `backend/app/risk/mitre.py`.
- [x] **Explainable AI (XAI) & Playbooks:** Implemented `ExplainabilityGenerator` and `ResponsePlaybookGenerator`.
- [x] **Phase 1 Validation:** 11/11 tests passing cleanly across Phase 0 and Phase 1 (`backend/tests/test_phase1.py`).

### Phase 2: Web & Phishing Intelligence + Browser Shield ✅ (Completed)
- [x] **24-Feature Handcrafted Lexical/URL Security Extractor:** Implemented `URLLexicalExtractor` in `backend/app/engines/phishing/url_features.py` (entropy, punycode, brand distance, credential paths, redirects).
- [x] **URLBERT Classifier Adapter:** Implemented `URLClassifierEngine` in `backend/app/engines/phishing/url_classifier.py` with calibrated logistic scoring over benchmark features.
- [x] **DistilBERT Phishing Text Classifier:** Implemented `DistilBertPhishingClassifier` in `backend/app/engines/phishing/text_classifier.py`.
- [x] **Web Intelligence Orchestration:** Implemented `WebIntelligenceOrchestrator` in `backend/app/engines/phishing/orchestrator.py` integrating URL, text, and browser page pipelines with SQLite persistence.
- [x] **Analysis API Endpoints:** Implemented `POST /api/v1/analyze/url`, `POST /api/v1/analyze/message`, and `POST /api/v1/analyze/browser` in `backend/app/api/v1/analyze.py`.
- [x] **Browser Shield Extension (Manifest V3):** Built `manifest.json`, `content.js` (bounded DOM security signals), `background.js` (gateway integration), and modern dark-mode `popup/` UI in `browser-shield/`.
- [x] **Phase 2 Validation:** 17/17 tests passing cleanly across all three phases (`backend/tests/test_phase2.py`).

### Phase 3: Identity, Voice Cloning & Media Intelligence ✅ (Completed)
- [x] **Audio Anti-Spoofing & Synthetic Speech Detector:** Implemented `W2V2AasistSyntheticDetector` in `backend/app/engines/media/audio_synthetic.py` extracting spectral flatness, zero-crossing, roll-off, and spectral centroid anomalies.
- [x] **Speaker Embedding Cosine Verification:** Implemented `EcapaTdnnSpeakerVerifier` in `backend/app/engines/media/speaker_embedding.py` decoupling acoustic similarity from identity proof.
- [x] **Speech-to-Text Transcription Adapter:** Implemented `WhisperTranscriptionEngine` in `backend/app/engines/media/transcription.py` piping extracted speech into semantic coercion analysis.
- [x] **Protected Identity Profile Registry:** Implemented `IdentityRegistry` in `backend/app/engines/identity/registry.py` with leadership profiles (CFO, Vice Chancellor, Director) and 192-dim reference embeddings.
- [x] **OpenCV Image Forensics:** Implemented `ImageForensicsEngine` in `backend/app/engines/media/image_forensics.py` (Laplacian variance, 2D FFT frequency spectrum, and noise variance analysis).
- [x] **AI-Generated Image Classifier & 4-Signal Separation:** Implemented `ImageSyntheticClassifier` in `backend/app/engines/media/image_synthetic.py` enforcing separation between AI-generation, manipulation, identity match, and intent.
- [x] **Media Intelligence Orchestrator & Endpoints:** Implemented `MediaIntelligenceOrchestrator` in `backend/app/engines/media/orchestrator.py` and mounted `POST /api/v1/analyze/audio`, `POST /api/v1/analyze/image`, `POST /api/v1/analyze/video` in `backend/app/api/v1/analyze.py`.
- [x] **Phase 3 Validation:** 26/26 tests passing cleanly across all phases (`backend/tests/test_phase3.py`).

### Phase 4: Behavioural Security & Account Takeover (ATO) ✅ (Completed)
- [x] **User Baseline Profile Store:** Rolling statistics per user (login hour distribution, typical ASNs, user agents, typical coordinates) in `backend/app/engines/behavioural/profile_store.py`.
- [x] **Isolation Forest Anomaly Detector:** Unsupervised multivariate anomaly scorer (`scikit-learn` IsolationForest) over authentication events in `backend/app/engines/behavioural/isolation_forest.py`.
- [x] **Geo-Velocity / Impossible Travel Calculator:** Haversine great-circle distance and velocity calculator in `backend/app/engines/behavioural/geo_velocity.py`.
- [x] **Behavioural Intelligence Orchestrator & Endpoints:** Integration in `backend/app/engines/behavioural/orchestrator.py` and `POST /api/v1/analyze/auth-event`.
- [x] **Phase 4 Validation:** 35/35 tests passing cleanly across all phases (`backend/tests/test_phase4.py`).

### Phase 5: In-App Evaluation Subsystem & Benchmarks ✅ (Completed)
- [x] **Dataset Schema & Ground Truth Repositories:** Standardized labeled benchmark sets (`backend/data/evaluation/ground_truth.json` — 20 ground truth samples across all 4 modalities).
- [x] **Metrics Calculator:** Accuracy, Precision, Recall, F1, False Positive Rate (FPR), False Negative Rate (FNR), Latency percentiles in `backend/app/evaluation/metrics.py`.
- [x] **Benchmark Runner:** Multimodal runner across URL, message, audio, and auth datasets in `backend/app/evaluation/runner.py`.
- [x] **Evaluation API Endpoints:** `POST /api/v1/evaluation/run`, `GET /api/v1/evaluation/latest`, `GET /api/v1/evaluation/ground-truth` in `backend/app/api/v1/evaluation.py`.
- [x] **Phase 5 Validation:** 43/43 tests passing cleanly across all phases (`backend/tests/test_phase5.py`).

### Phase 6: Command Center SOC Dashboard & Citizen Portal ✅ (Completed)
- [x] **React + Vite Project Setup:** Initialized modern SPA in `frontend/` with `lucide-react`, glassmorphic CSS styling, and zero external Tailwind dependencies.
- [x] **Design System & Visual Excellence:** Implemented dark-mode SOC theme (`frontend/src/index.css`) with Google Fonts (`Outfit`, `Inter`, `JetBrains Mono`), glass panels, pulsing status dots, and cybersecurity glow tokens.
- [x] **Header & Navigation Bar:** Built `frontend/src/components/Header.jsx` with real-time backend telemetry, live provider pills (Gemini 3.8 Flash, Qwen 2.5, HF Router), and quick navigation tabs.
- [x] **Citizen Cyber Safety Hub:** Built `frontend/src/components/CitizenSafetyHub.jsx` with zero-jargon 1-click verification, traffic-light safety verdict, 1930 cybercrime helpline integration, and trending scam alerts bulletin.
- [x] **Threat Stream & Live KPIs:** Built `frontend/src/components/IncidentFeed.jsx` with 4 top KPI cards (Total Threats, Critical Blocked, Voice Clones Neutralized, ATOs Thwarted), live search, multi-factor filtering, and real-time threat stream.
- [x] **Interactive Incident Details Drawer:** Built `frontend/src/components/IncidentDrawer.jsx` featuring risk dial meter, traceable XAI decision lineage, contributing evidence cards, MITRE ATT&CK tags, and advisory mitigation playbooks with dispatch simulation.
- [x] **Multi-Modal Testing Studio:** Built `frontend/src/components/ThreatStudio.jsx` supporting live URL, message, audio file, and auth event submissions with instant one-click scenario presets.
- [x] **Live In-App Evaluation Dashboard:** Built `frontend/src/components/EvaluationDashboard.jsx` allowing one-click benchmark execution, 2x2 confusion matrix (TP, TN, FP, FN), per-modality breakdown, and audit inspection list.
- [x] **Executive Identity Registry View:** Built `frontend/src/components/IdentityRegistryView.jsx` presenting enrolled VIP profiles with 192-dim acoustic vectors and visual reference baselines.
- [x] **Production Build Validation:** Executed `npm run build` in `frontend/` with 0 errors (clean Vite production bundle).

### Phase 7: Demo Seeding & System Hardening ✅ (Completed)
- [x] **Multi-Scenario Seed Data Script:** Built and executed `backend/scripts/seed_demo_incidents.py` populating 14 realistic threat and baseline incidents into SQLite database (`backend/data/orion.db`).
- [x] **Unified Startup Scripts:** Created one-click startup launchers: `scripts/start_backend.bat`, `scripts/start_frontend.bat`, `scripts/start_all.bat`, and `scripts/seed_demo.bat`.
- [x] **End-to-End System Hardening & Validation:** All 43 test suites passing (100%), verified live incident retrieval, and zero build errors.


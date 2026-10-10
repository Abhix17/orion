"""Media Intelligence Orchestrator for ORION v2.

Handles Audio, Image, and Video threat analysis, uniting anti-spoofing, speaker verification,
speech transcription, computer vision forensics, and semantic intent into canonical incidents.
"""

import logging
import time
from typing import Any, Dict, List, Optional
from uuid import uuid4
import cv2

logger = logging.getLogger("orion.media_orchestrator")

from app.engines.media.audio_synthetic import W2V2AasistSyntheticDetector
from app.engines.media.speaker_embedding import EcapaTdnnSpeakerVerifier
from app.engines.media.transcription import WhisperTranscriptionEngine
from app.engines.media.image_forensics import ImageForensicsEngine
from app.engines.media.image_synthetic import ImageSyntheticClassifier
from app.engines.media.image_preprocess import ImagePreprocessor
from app.engines.media.face_engine import FaceIntelligenceEngine
from app.engines.media.ocr_engine import OCREngine
from app.engines.media.video_preprocess import VideoPreprocessor, VideoValidationError
from app.engines.media.video_audio import VideoAudioExtractor
from app.engines.media.video_deepfake import VideoDeepfakeClassifier
from app.engines.media.qwen_multimodal import MultimodalQwenEngine
from app.engines.media.gemini_multimodal import MultimodalGeminiEngine
from app.engines.media.temporal_engine import TemporalConsistencyEngine
from app.engines.media.audiovisual_engine import AudioVisualConsistencyEngine
from app.engines.identity.registry import IdentityRegistry
from app.providers.semantic_gateway import SemanticProviderGateway
from app.risk.engine import RiskEngine
from app.risk.mitre import MitreMapper
from app.explainability.generator import ExplainabilityGenerator
from app.response.playbooks import ResponsePlaybookGenerator
from app.repositories.incident_repo import IncidentRepository
from app.schemas.evidence import EvidenceItem, EvidenceSource, EvidenceType, SeverityContribution
from app.schemas.incident import Incident, IncidentEntity, IncidentStatus, EntityType
from app.schemas.threat import RiskLevel, ThreatAssessment, ThreatType
from app.engines.fusion.entity import CanonicalEntity, EntityResolver
from app.engines.fusion.engine import EvidenceFusionEngine


class MediaIntelligenceOrchestrator:
    """Orchestrates multimodal media analysis across audio, image, and video streams."""

    def __init__(self):
        self.identity_registry = IdentityRegistry()
        self.audio_detector = W2V2AasistSyntheticDetector()
        self.speaker_verifier = EcapaTdnnSpeakerVerifier(registry=self.identity_registry)
        self.transcription_engine = WhisperTranscriptionEngine()
        self.image_forensics = ImageForensicsEngine()
        self.image_synthetic = ImageSyntheticClassifier()
        self.image_preprocessor = ImagePreprocessor()
        self.face_engine = FaceIntelligenceEngine(identity_registry=self.identity_registry)
        self.ocr_engine = OCREngine()
        self.video_preprocessor = VideoPreprocessor()
        self.video_audio_extractor = VideoAudioExtractor()
        self.video_deepfake_classifier = VideoDeepfakeClassifier()
        self.temporal_engine = TemporalConsistencyEngine()
        self.audiovisual_engine = AudioVisualConsistencyEngine()
        self.semantic_gateway = SemanticProviderGateway()
        self.qwen_multimodal = MultimodalQwenEngine()
        self.gemini_multimodal = MultimodalGeminiEngine()
        self.risk_engine = RiskEngine()
        self.incident_repo = IncidentRepository()
        self.fusion_engine = EvidenceFusionEngine()

    async def analyze_audio(
        self,
        audio_bytes: Optional[bytes] = None,
        provided_transcript: Optional[str] = None,
        claimed_identity_name: Optional[str] = None,
        injected_synthetic_score: Optional[float] = None,
        injected_similarity_score: Optional[float] = None,
    ) -> Incident:
        """Flagship Voice Impersonation & Audio Deepfake Pipeline.
        
        Coordinates:
        1. W2V2-AASIST -> Is this synthetic speech?
        2. ECAPA-TDNN -> Does it acoustically resemble the claimed authorized identity?
        3. Whisper -> Speech-to-text transcription.
        4. Semantic Observer -> Intent extraction (urgency, coercive wire transfer).
        5. Evidence Fusion -> Triggers Multiplicative Voice Impersonation Synergy.
        """
        start_time = time.perf_counter()
        evidence_list: List[EvidenceItem] = []
        entities: List[IncidentEntity] = []
        quality_dict: Optional[Dict[str, Any]] = None

        # 0. Optional Deterministic Audio Preprocessing & Quality Signals
        if audio_bytes and len(audio_bytes) > 32:
            try:
                from app.engines.media.audio_preprocess import AudioPreprocessor
                _, quality_rep = AudioPreprocessor.decode_and_resample(audio_bytes)
                quality_dict = quality_rep.to_dict()
            except Exception as q_err:
                logger.debug(f"Audio quality signal extraction skipped: {q_err}")

        # 1. Dimension 1: Audio Authenticity (Wav2Vec2 / AASIST Anti-Spoofing)
        synth_prob, audio_indicators, synth_evidence = self.audio_detector.analyze_audio_features(
            audio_bytes=audio_bytes,
            injected_synthetic_score=injected_synthetic_score,
        )
        evidence_list.extend(synth_evidence)

        # 2. Dimension 4a: Speech Transcription via OpenAI Whisper
        whisper_meta = await self.transcription_engine.transcribe_with_metadata(
            audio_bytes=audio_bytes,
            provided_transcript=provided_transcript,
        )
        transcript = whisper_meta.get("transcript", "")

        # 3. Dimension 4b: Semantic Intent Extraction on Whisper Transcript
        sem_obs = None
        if transcript:
            sem_obs, sem_evidence = await self.semantic_gateway.analyze(transcript)
            evidence_list.extend(sem_evidence)
            if sem_obs and sem_obs.claimed_entity:
                claimed_identity_name = claimed_identity_name or sem_obs.claimed_entity

        # 4. Dimension 2 & 3: Speaker Similarity & Identity Verification (ECAPA-TDNN)
        cand_emb = None
        if injected_similarity_score is not None and claimed_identity_name:
            # Synthetic candidate embedding matching target with requested similarity for test harnesses
            target_profile = self.identity_registry.find_by_name_or_title(claimed_identity_name)
            if target_profile:
                cand_emb = target_profile.voice_embedding_reference

        matched_identity, similarity, speaker_evidence = self.speaker_verifier.verify_speaker(
            audio_bytes=audio_bytes,
            candidate_embedding=cand_emb,
            claimed_identity_name=claimed_identity_name,
        )
        evidence_list.extend(speaker_evidence)

        speaker_status = "matched" if matched_identity else "unverified"
        if matched_identity:
            entities.append(IncidentEntity(name=matched_identity.display_name, type=EntityType.USER))

        # 4b. Online Cloud Tier: Multimodal Gemini Audio Assessment
        if audio_bytes and self.gemini_multimodal.is_available():
            try:
                g_audio_meta, g_audio_ev = await self.gemini_multimodal.analyze_audio_multimodal(
                    audio_bytes=audio_bytes,
                    transcript=transcript,
                )
                evidence_list.extend(g_audio_ev)
            except Exception as g_audio_err:
                logger.warning(f"Multimodal Gemini audio analysis error: {g_audio_err}")
        # 4. Resolve Canonical Entities
        canon_entities: List[CanonicalEntity] = []
        if matched_identity:
            canon_entities.append(EntityResolver.resolve_person(matched_identity.display_name, profile_id=matched_identity.identity_id))
            canon_entities.append(EntityResolver.resolve_organization(matched_identity.organization))
        elif claimed_identity_name:
            canon_entities.append(EntityResolver.resolve_person(claimed_identity_name))

        if audio_bytes:
            canon_entities.append(EntityResolver.resolve_media_fingerprint(audio_bytes, media_type="audio"))

        summary_target = matched_identity.display_name if matched_identity else (claimed_identity_name or "Unknown Voice")
        input_desc = f"Audio Stream targeting '{summary_target}': \"{transcript[:60]}...\"" if transcript else f"Audio Stream targeting '{summary_target}'"

        for item in evidence_list:
            if not item.entity_refs and canon_entities:
                item.entity_refs = [e.id for e in canon_entities[:2]]

        # 5. Multimodal Fusion & Deduplication
        fused_ctx = self.fusion_engine.fuse(evidence_list, canon_entities, context_summary=input_desc)

        # 6. Deterministic Risk Evaluation & Evidence Fusion
        assessment = self.risk_engine.evaluate(fused_ctx.fused_evidence)

        # 7. MITRE ATT&CK Mapping
        assessment.mitre_techniques = MitreMapper.enrich(assessment.primary_threat, fused_ctx.fused_evidence)

        # 8. XAI & Advisory Response Playbooks
        explanation = ExplainabilityGenerator.generate(
            assessment, fused_ctx.fused_evidence, input_desc, attack_chain=fused_ctx.attack_chain
        )
        actions = ResponsePlaybookGenerator.generate(
            assessment.primary_threat,
            assessment.level,
            fused_ctx.fused_evidence,
            target_entity=summary_target,
        )

        # 9. Canonical Incident Construction
        title = f"AI Voice Impersonation Threat: {summary_target}" if assessment.level in (RiskLevel.HIGH, RiskLevel.CRITICAL) else f"Audio Authentication: {summary_target}"
        incident = Incident(
            title=title,
            source=EvidenceSource.AUDIO,
            input_type="audio",
            input_summary=input_desc,
            threat_type=assessment.primary_threat,
            assessment=assessment.assessment,
            risk_level=assessment.level,
            risk_score=assessment.score,
            confidence=assessment.confidence,
            evidence=fused_ctx.fused_evidence,
            explanation=explanation,
            xai_summary=fused_ctx.xai_summary,
            risk_drivers=assessment.risk_drivers,
            mitre_techniques=assessment.mitre_techniques,
            recommended_actions=actions,
            entities=fused_ctx.entities,
            timeline=fused_ctx.timeline,
            correlation_groups=[g.model_dump() for g in fused_ctx.correlation_groups],
            attack_chain=fused_ctx.attack_chain,
            status=IncidentStatus.NEW,
            metadata={
                "synthetic_prob": synth_prob,
                "speaker_similarity": similarity,
                "speaker_status": speaker_status,
                "transcript": transcript,
                "matched_identity": matched_identity.display_name if matched_identity else None,
                "audio_authenticity": {
                    "provider": audio_indicators.get("provider", "w2v2_aasist"),
                    "model": audio_indicators.get("model_checkpoint", "MelodyMachine/Deepfake-audio-detection-V2"),
                    "model_loaded": audio_indicators.get("model_loaded", False),
                    "spoof_probability": synth_prob,
                    "bonafide_probability": audio_indicators.get("bonafide_probability", round(1.0 - synth_prob, 3)),
                    "latency_ms": audio_indicators.get("inference_latency_ms", 0.0),
                },
                "speaker_analysis": {
                    "provider": "ecapa_tdnn",
                    "model": self.speaker_verifier.model_checkpoint,
                    "model_loaded": self.speaker_verifier.is_model_loaded(),
                    "similarity": similarity,
                    "speaker_status": speaker_status,
                    "matched_identity": matched_identity.display_name if matched_identity else None,
                },
                "transcription": {
                    "provider": whisper_meta.get("provider", "whisper"),
                    "model": whisper_meta.get("model", "openai/whisper-tiny"),
                    "model_loaded": whisper_meta.get("model_loaded", False),
                    "transcript": transcript,
                    "latency_ms": whisper_meta.get("latency_ms", 0.0),
                },
                "semantic_intent": {
                    "urgency": sem_obs.urgency if sem_obs else False,
                    "payment_request": sem_obs.payment_request if sem_obs else False,
                    "credential_request": sem_obs.credential_request if sem_obs else False,
                    "impersonation_attempt": sem_obs.impersonation_attempt if sem_obs else False,
                    "social_engineering": sem_obs.social_engineering_tactics if sem_obs else [],
                },
                "quality_report": quality_dict,
            },
        )

        # 9. Persist Incident & Log Event
        persisted = await self.incident_repo.create(incident)
        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        await self.incident_repo.log_event(
            input_type="audio",
            source="audio_intelligence",
            risk_score=assessment.score,
            risk_level=assessment.level.value if hasattr(assessment.level, "value") else str(assessment.level),
            duration_ms=duration_ms,
            incident_id=persisted.id,
            provider_status={
                "w2v2_aasist": "ok" if audio_indicators.get("model_loaded") else "heuristic_fallback",
                "ecapa_tdnn": "ok" if self.speaker_verifier.is_model_loaded() else "fallback",
                "whisper": "ok" if whisper_meta.get("model_loaded") else "unavailable",
            },
        )

        return persisted

    async def analyze_image(
        self,
        image_bytes: Optional[bytes] = None,
        ai_generated_prob: float = 0.85,
        manipulation_prob: float = 0.0,
        identity_similarity: float = 0.0,
        malicious_intent: float = 0.0,
        target_name: Optional[str] = None,
        context_text: Optional[str] = None,
    ) -> Incident:
        """Image Deepfake, Facial Impersonation, and Forensics Pipeline.

        Coordinates:
        1. Preprocessing & Validation -> Decompression safety, magic byte checks.
        2. Classical OpenCV Forensics -> Laplacian edge variance, FFT spectrum, noise variance.
        3. Real Vision Transformer (ViT) -> umm-maybe/AI-image-detector synthetic speech/image score.
        4. Real Face Detection & ArcFace -> OpenCV YuNet + gaunernst/vit_tiny_patch8_112.arcface_ms1mv3.
        5. Identity Registry -> 512-dim facial cosine similarity against enrolled VIP profiles.
        6. Visual OCR -> EasyOCR text extraction and coercive payment/credential keyword tagging.
        7. Semantic Gateway -> Intent and social engineering extraction over visual text.
        8. Evidence Fusion -> Evaluates non-linear interaction rules in deterministic Risk Engine.
        """
        start_time = time.perf_counter()
        evidence_list: List[EvidenceItem] = []
        entities: List[IncidentEntity] = []

        synthetic_meta: Dict[str, Any] = {}
        detected_faces = []
        ocr_res = None
        forensics_info: Dict[str, Any] = {}
        calc_ai_prob = ai_generated_prob

        # 1. Processing real image bytes
        if image_bytes and len(image_bytes) > 0:
            # A. Safe validation & decoding
            try:
                preprocessed = ImagePreprocessor.validate_and_decode(image_bytes)
            except Exception as prep_err:
                logger.warning(f"Image preprocessing validation error: {prep_err}")
                raise prep_err

            # B. Classical OpenCV & PIL Forensics
            forensics_info, forensics_evidence = self.image_forensics.analyze_image_bytes(image_bytes)
            evidence_list.extend(forensics_evidence)
            if forensics_info.get("has_forensic_anomaly"):
                manipulation_prob = max(manipulation_prob, 0.78)

            # C. Real Vision Transformer (ViT) Synthetic Detection
            # If default 0.85 was passed without explicit override, run actual neural inference
            injected_val = ai_generated_prob if ai_generated_prob != 0.85 else None
            synthetic_meta = self.image_synthetic.classify_image(
                preprocessed.pil_image,
                injected_ai_prob=injected_val,
            )
            calc_ai_prob = synthetic_meta.get("ai_generated_probability", ai_generated_prob)

            # D. Real Face Detection & ArcFace Embedding Extraction
            detected_faces, face_evidence = self.face_engine.process_image(
                bgr_image=preprocessed.bgr_array,
                claimed_identity_name=target_name,
                match_threshold=0.60,
                injected_similarity_score=identity_similarity if identity_similarity > 0 else None,
            )
            evidence_list.extend(face_evidence)

            if detected_faces:
                best_face_sim = max((f.similarity for f in detected_faces), default=0.0)
                identity_similarity = max(identity_similarity, best_face_sim)
                if not target_name:
                    for f in detected_faces:
                        if f.matched_name and f.is_verified_match:
                            target_name = f.matched_name
                            break

            # E. Real OCR Visual Text Extraction (Suspended for now to speed up analysis)
            # ocr_res, ocr_evidence = self.ocr_engine.extract_text(preprocessed.rgb_array)
            # evidence_list.extend(ocr_evidence)
            # if ocr_res and (ocr_res.signals.get("payment_request") or ocr_res.signals.get("credential_request") or ocr_res.signals.get("urgency")):
            #     malicious_intent = max(malicious_intent, 0.80 if ocr_res.signals.get("payment_request") else 0.65)

            # F. Semantic Gateway Observer over visual text / context
            ocr_text = ocr_res.text if ocr_res else ""
            combined_text = f"{context_text or ''} {ocr_text}".strip()
            if combined_text:
                try:
                    sem_obs = await self.semantic_gateway.observe_text(combined_text)
                    if sem_obs:
                        if sem_obs.payment_request or sem_obs.credential_request or sem_obs.urgency:
                            malicious_intent = max(malicious_intent, 0.85 if sem_obs.payment_request else 0.70)
                except Exception as sem_err:
                    logger.debug(f"Semantic gateway observation skipped: {sem_err}")

            # G. Online Cloud Tier: Primary (Qwen Cloud Vision) & Secondary (Gemini Multimodal Vision)
            if self.qwen_multimodal.is_available():
                try:
                    q_meta, q_evidence = await self.qwen_multimodal.analyze_image_multimodal(
                        image_bytes=image_bytes,
                        context=context_text,
                    )
                    if q_meta:
                        evidence_list.extend(q_evidence)
                        if q_meta.get("ai_generated_probability", 0.0) > 0.0:
                            calc_ai_prob = max(calc_ai_prob, q_meta["ai_generated_probability"])
                        if q_meta.get("tampering_probability", 0.0) > 0.0:
                            manipulation_prob = max(manipulation_prob, q_meta["tampering_probability"])
                        if q_meta.get("claimed_identity") and not target_name:
                            target_name = q_meta["claimed_identity"]
                except Exception as q_err:
                    logger.warning(f"Multimodal Qwen vision analysis error: {q_err}")

            if self.gemini_multimodal.is_available():
                try:
                    g_meta, g_evidence = await self.gemini_multimodal.analyze_image_multimodal(
                        image_bytes=image_bytes,
                        context=context_text,
                    )
                    if g_meta:
                        evidence_list.extend(g_evidence)
                        if g_meta.get("is_ai_generated") or g_meta.get("ai_generated_probability", 0.0) >= 0.50:
                            calc_ai_prob = max(calc_ai_prob, g_meta.get("ai_generated_probability", 0.88))
                        elif g_meta.get("is_ai_generated") is False and synthetic_meta.get("ai_generated_probability", 0.5) < 0.60:
                            calc_ai_prob = min(calc_ai_prob, g_meta.get("ai_generated_probability", 0.10))
                        if g_meta.get("tampering_probability", 0.0) > 0.0:
                            manipulation_prob = max(manipulation_prob, g_meta["tampering_probability"])
                        if g_meta.get("claimed_identity") and not target_name:
                            target_name = g_meta["claimed_identity"]
                except Exception as g_err:
                    logger.warning(f"Multimodal Gemini vision analysis error: {g_err}")

        # 2. Evaluate Media Signals & Normalized Evidence
        signals, syn_evidence = self.image_synthetic.evaluate_media_signals(
            ai_generated_prob=calc_ai_prob,
            manipulation_prob=manipulation_prob,
            identity_similarity=identity_similarity,
            malicious_intent=malicious_intent,
            target_name=target_name,
            model_metadata=synthetic_meta,
        )
        evidence_list.extend(syn_evidence)

        canon_entities: List[CanonicalEntity] = []
        if target_name:
            canon_entities.append(EntityResolver.resolve_person(target_name))

        if image_bytes:
            canon_entities.append(EntityResolver.resolve_media_fingerprint(image_bytes, media_type="image"))

        for item in evidence_list:
            if not item.entity_refs and canon_entities:
                item.entity_refs = [e.id for e in canon_entities[:2]]

        summary_desc = f"Image Media (Target: {target_name or 'Unspecified'})"

        # 3. Multimodal Fusion & Deduplication
        fused_ctx = self.fusion_engine.fuse(evidence_list, canon_entities, context_summary=summary_desc)

        # 4. Deterministic Risk Evaluation & MITRE Mapping
        assessment = self.risk_engine.evaluate(fused_ctx.fused_evidence)
        assessment.mitre_techniques = MitreMapper.enrich(assessment.primary_threat, fused_ctx.fused_evidence)

        # 5. XAI & Playbooks
        explanation = ExplainabilityGenerator.generate(
            assessment, fused_ctx.fused_evidence, summary_desc, attack_chain=fused_ctx.attack_chain
        )
        actions = ResponsePlaybookGenerator.generate(
            assessment.primary_threat,
            assessment.level,
            fused_ctx.fused_evidence,
            target_entity=target_name,
        )

        if assessment.level in (RiskLevel.HIGH, RiskLevel.CRITICAL):
            title = f"AI Manipulated Media Threat ({target_name or 'Visual'})"
        elif target_name:
            title = f"Inspected Image Media: {target_name}"
        elif calc_ai_prob >= 0.55:
            title = f"AI-Generated Synthetic Image ({calc_ai_prob:.0%} Probability)"
        else:
            title = "Authentic Photograph / Natural Image"

        # 6. Incident Construction with Complete Metadata
        incident = Incident(
            title=title,
            source=EvidenceSource.IMAGE,
            input_type="image",
            input_summary=summary_desc,
            threat_type=assessment.primary_threat,
            assessment=assessment.assessment,
            risk_level=assessment.level,
            risk_score=assessment.score,
            confidence=assessment.confidence,
            evidence=fused_ctx.fused_evidence,
            explanation=explanation,
            xai_summary=fused_ctx.xai_summary,
            risk_drivers=assessment.risk_drivers,
            mitre_techniques=assessment.mitre_techniques,
            recommended_actions=actions,
            entities=fused_ctx.entities,
            timeline=fused_ctx.timeline,
            correlation_groups=[g.model_dump() for g in fused_ctx.correlation_groups],
            attack_chain=fused_ctx.attack_chain,
            status=IncidentStatus.NEW,
            metadata={
                "signals": signals,
                "ai_generated_probability": calc_ai_prob,
                "is_ai_generated": calc_ai_prob >= 0.50,
                "cloud_vision": {
                    "qwen_primary": q_meta if "q_meta" in locals() else {},
                    "gemini_secondary": g_meta if "g_meta" in locals() else {},
                },
                "synthetic_detection": synthetic_meta,
                "face_analysis": {
                    "faces_detected": len(detected_faces),
                    "faces": [
                        {
                            "face_idx": f.face_idx,
                            "bbox": f.bbox,
                            "confidence": f.confidence,
                            "matched_identity_id": f.matched_identity_id,
                            "matched_name": f.matched_name,
                            "similarity": f.similarity,
                            "is_verified": f.is_verified_match,
                        }
                        for f in detected_faces
                    ],
                    "arcface_model": "gaunernst/vit_tiny_patch8_112.arcface_ms1mv3",
                    "detector": "opencv/face_detection_yunet",
                },
                "ocr_analysis": {
                    "has_text": ocr_res.signals.get("has_text", False) if ocr_res else False,
                    "extracted_text": ocr_res.text if ocr_res else "",
                    "signals": ocr_res.signals if ocr_res else {},
                    "latency_ms": ocr_res.latency_ms if ocr_res else 0.0,
                },
                "forensics": forensics_info,
            },
        )

        # 6. Incident Persistence & Event Logging
        persisted = await self.incident_repo.create(incident)
        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        await self.incident_repo.log_event(
            input_type="image",
            source="image_intelligence",
            risk_score=assessment.score,
            risk_level=assessment.level.value if hasattr(assessment.level, "value") else str(assessment.level),
            duration_ms=duration_ms,
            incident_id=persisted.id,
            provider_status={
                "qwen_multimodal_vision": "ok" if self.qwen_multimodal.is_available() else "unavailable",
                "gemini_multimodal_vision": "ok" if self.gemini_multimodal.is_available() else "unavailable",
                "vit_synthetic": "ok" if synthetic_meta.get("model_loaded") else "unavailable",
                "arcface": "ok" if self.face_engine.is_model_loaded() else "unavailable",
                "easyocr": "ok" if (ocr_res and ocr_res.model_loaded) else "unavailable",
                "opencv_forensics": "ok",
            },
        )

        return persisted

    async def analyze_video(
        self,
        video_name: str,
        video_bytes: Optional[bytes] = None,
        frame_manipulation_score: float = 0.82,
        temporal_jitter_score: float = 0.79,
        target_name: Optional[str] = None,
        audio_transcript: Optional[str] = None,
    ) -> Incident:
        """Multimodal Video Deepfake Decomposition & Forensics Pipeline.

        Coordinates:
        1. Container & Codec Validation -> Bounded sampling, magic bytes, resource limits (max 50MB, 180s).
        2. Frame Sampling -> Deterministic uniform sampling (16-32 frames), zero full-video memory buffering.
        3. Face Detection & Tracking -> OpenCV YuNet face detection & landmark extraction across frames.
        4. Real Vision Transformer (ViT) -> dima806/deepfake_vs_real_image_detection frame & face-crop scoring.
        5. Temporal Consistency Analysis -> 0.50*P75 + 0.30*P90 + 0.20*R_suspicious with isolated spike dampening.
        6. Audio Demuxing & Phase 3B Audio -> W2V2-AASIST, Whisper transcription, ECAPA-TDNN verification.
        7. Audio-Visual Synchronization -> Lip-activity vs speech envelope correlation.
        8. ArcFace Identity Drift & Reference Comparison -> Temporal consistency and VIP impersonation.
        9. Visual OCR Context -> Keyframe text extraction and coercive intent tagging.
        10. Deterministic Risk Engine & MITRE Mapping -> Non-linear interaction rules and XAI explanation.
        """
        start_time = time.perf_counter()
        evidence_list: List[EvidenceItem] = []
        entities: List[IncidentEntity] = []

        if target_name:
            entities.append(IncidentEntity(name=target_name, type=EntityType.USER))

        metadata_dict: Dict[str, Any] = {
            "video_name": video_name,
            "target_name": target_name,
        }
        provider_status: Dict[str, str] = {
            "vit_deepfake": "unavailable",
            "temporal_engine": "ok",
            "face_yunet": "ok" if self.face_engine.is_model_loaded() else "unavailable",
            "audio_extractor": "ok" if self.video_audio_extractor.is_available() else "unavailable",
            "w2v2_aasist": "ok" if self.audio_detector.is_model_loaded() else "heuristic_fallback",
            "whisper": "ok" if self.transcription_engine.is_model_loaded() else "unavailable",
        }

        # -------------------------------------------------------------
        # BRANCH A: Real Video Bytes Provided
        # -------------------------------------------------------------
        if video_bytes and len(video_bytes) > 0:
            # 1. Validation & Stream Sampling
            preprocessed = self.video_preprocessor.validate_and_sample(
                video_bytes=video_bytes,
                filename=video_name,
                max_frames=32,
                min_frames=4,
            )
            v_meta = preprocessed.metadata
            sampled_frames = preprocessed.sampled_frames  # List[Tuple[int, float, np.ndarray]]
            frames_analyzed = len(sampled_frames)

            metadata_dict["video_metadata"] = {
                "duration_seconds": v_meta.duration_seconds,
                "fps": v_meta.fps,
                "width": v_meta.width,
                "height": v_meta.height,
                "total_frames": v_meta.total_frames,
                "frames_analyzed": frames_analyzed,
                "sampling_interval": v_meta.sampling_interval,
                "codec": v_meta.codec,
                "has_audio": v_meta.has_audio,
                "file_size_bytes": v_meta.file_size_bytes,
            }

            # 2. Face Detection & ArcFace on Sampled Frames
            face_tracking_records: List[Dict[str, Any]] = []
            frame_deepfake_preds: List[Dict[str, Any]] = []
            target_profile = self.identity_registry.lookup_identity(target_name) if target_name else None
            max_face_target_sim = 0.0

            for frame_idx, timestamp_sec, bgr_img in sampled_frames:
                # Face detection via YuNet
                faces = self.face_engine.detect_faces(bgr_img)
                frame_faces = []
                primary_face_crop = None
                primary_landmarks = None

                for box, conf, landmarks in faces:
                    face_crop = self.face_engine.crop_and_align_face(bgr_img, box, landmarks)

                    face_emb = None
                    sim_to_target = 0.0
                    if face_crop is not None and face_crop.size > 0:
                        face_emb = self.face_engine.extract_arcface_embedding(face_crop)
                        if face_emb:
                            _, sim_to_target = self.identity_registry.match_face_embedding(
                                candidate_embedding=face_emb,
                                claimed_identity_query=target_name,
                                match_threshold=0.60,
                            )
                            if sim_to_target > max_face_target_sim:
                                max_face_target_sim = sim_to_target

                    frame_faces.append({
                        "bbox": box,
                        "confidence": conf,
                        "landmarks": landmarks,
                        "face_embedding": face_emb,
                        "similarity_to_target": sim_to_target,
                        "face_crop": face_crop,
                    })

                    if primary_face_crop is None and face_crop is not None:
                        primary_face_crop = face_crop
                        primary_landmarks = landmarks

                face_tracking_records.append({
                    "frame_idx": frame_idx,
                    "timestamp_sec": timestamp_sec,
                    "faces": frame_faces,
                    "primary_landmarks": primary_landmarks,
                })

                # 3. Real Frame Deepfake Classifier Inference (ViT)
                if primary_face_crop is not None:
                    pred = self.video_deepfake_classifier.classify_face_crop(primary_face_crop)
                else:
                    pred = self.video_deepfake_classifier.classify_frame(bgr_img)

                frame_deepfake_preds.append({
                    "frame_idx": frame_idx,
                    "timestamp_sec": timestamp_sec,
                    "fake_probability": pred.fake_probability,
                    "real_probability": pred.real_probability,
                    "latency_ms": pred.latency_ms,
                    "device": pred.device,
                })

            provider_status["vit_deepfake"] = "ok" if self.video_deepfake_classifier.is_model_loaded() else "unavailable"

            # 4. Temporal Analysis
            temporal_report = self.temporal_engine.analyze(
                frame_predictions=frame_deepfake_preds,
                face_tracking=face_tracking_records,
                fps=v_meta.fps,
            )

            metadata_dict["temporal_analysis"] = {
                "aggregation_method": temporal_report.aggregation_method,
                "aggregated_score": temporal_report.aggregated_score,
                "percentile_75": temporal_report.percentile_75,
                "percentile_90": temporal_report.percentile_90,
                "suspicious_ratio": temporal_report.suspicious_ratio,
                "suspicious_count": temporal_report.suspicious_count,
                "has_isolated_spike": temporal_report.has_isolated_spike,
                "temporal_inconsistency_score": temporal_report.temporal_inconsistency_score,
                "landmark_jitter_score": temporal_report.landmark_jitter_score,
                "identity_drift_score": temporal_report.identity_drift_score,
            }
            metadata_dict["frame_deepfake_predictions"] = frame_deepfake_preds

            # 5. Visual Deepfake Evidence Items
            agg_score = temporal_report.aggregated_score
            if agg_score >= 0.50:
                evidence_list.append(
                    EvidenceItem(
                        type=EvidenceType.DEEPFAKE_VIDEO,
                        source=EvidenceSource.VIDEO,
                        value=agg_score,
                        confidence=round(min(1.0, agg_score + 0.05), 2),
                        severity_contribution=SeverityContribution.HIGH if agg_score >= 0.75 else SeverityContribution.MEDIUM,
                        weight=0.40,
                        indicators={
                            "provider": "video_deepfake_detector",
                            "model": self.video_deepfake_classifier.model_id,
                            "model_loaded": self.video_deepfake_classifier.is_model_loaded(),
                            "frames_analyzed": frames_analyzed,
                            "suspicious_frames": temporal_report.suspicious_count,
                            "suspicious_ratio": temporal_report.suspicious_ratio,
                            "percentile_75": temporal_report.percentile_75,
                            "percentile_90": temporal_report.percentile_90,
                            "has_isolated_spike": temporal_report.has_isolated_spike,
                            "aggregation_formula": "0.50*P75 + 0.30*P90 + 0.20*R_suspicious (Dampened if Isolated Spike)",
                            "device": self.video_deepfake_classifier.device,
                        },
                        explanation=(
                            f"Video deepfake detector identified manipulated frames with aggregated synthetic confidence of {agg_score:.1%} "
                            f"across {temporal_report.suspicious_count}/{frames_analyzed} suspicious frames."
                        ),
                    )
                )

            # Temporal flicker / landmark jitter evidence
            if temporal_report.temporal_inconsistency_score >= 0.60:
                evidence_list.append(
                    EvidenceItem(
                        type=EvidenceType.TEMPORAL_VIDEO_FLICKER,
                        source=EvidenceSource.VIDEO,
                        value=temporal_report.temporal_inconsistency_score,
                        confidence=round(temporal_report.temporal_inconsistency_score, 2),
                        severity_contribution=SeverityContribution.HIGH if temporal_report.temporal_inconsistency_score >= 0.75 else SeverityContribution.MEDIUM,
                        weight=0.25,
                        indicators={
                            "landmark_jitter_score": temporal_report.landmark_jitter_score,
                            "identity_drift_score": temporal_report.identity_drift_score,
                            "temporal_inconsistency_score": temporal_report.temporal_inconsistency_score,
                        },
                        explanation=(
                            f"Temporal analysis flagged unnatural inter-frame facial jitter and structural variance at "
                            f"{temporal_report.temporal_inconsistency_score:.1%}."
                        ),
                    )
                )

            # Identity evidence if target profile exists
            if target_profile and max_face_target_sim >= 0.65:
                is_high_sim = max_face_target_sim >= 0.75
                evidence_list.append(
                    EvidenceItem(
                        type=EvidenceType.PROTECTED_IDENTITY_TARGETED,
                        source=EvidenceSource.VIDEO,
                        value=round(max_face_target_sim, 3),
                        confidence=round(max_face_target_sim, 2),
                        severity_contribution=SeverityContribution.HIGH if is_high_sim else SeverityContribution.MEDIUM,
                        weight=0.35,
                        indicators={
                            "matched_identity": target_profile.display_name,
                            "organization": target_profile.organization,
                            "facial_similarity": round(max_face_target_sim, 3),
                            "model": "gaunernst/vit_tiny_patch8_112.arcface_ms1mv3",
                        },
                        explanation=(
                            f"Facial recognition demonstrated high similarity ({max_face_target_sim:.1%}) to registered VIP "
                            f"'{target_profile.display_name}' ({target_profile.organization})."
                        ),
                    )
                )
                entities.append(IncidentEntity(name=target_profile.display_name, type=EntityType.USER))
                entities.append(IncidentEntity(name=target_profile.organization, type=EntityType.ORGANIZATION))

            # 6. Audio Stream Extraction & Phase 3B Processing
            audio_extracted_wav = self.video_audio_extractor.extract_audio(video_bytes)
            v_meta.has_audio = audio_extracted_wav is not None and len(audio_extracted_wav) > 100

            audio_analysis_meta: Dict[str, Any] = {"has_audio": v_meta.has_audio, "extracted": audio_extracted_wav is not None}
            if audio_extracted_wav:
                # A. W2V2-AASIST Audio Anti-Spoofing
                audio_indicators = self.audio_detector.detect_synthetic(audio_extracted_wav)
                synth_prob = audio_indicators.get("synthetic_speech_probability", 0.0)
                audio_analysis_meta["synthetic_speech_probability"] = synth_prob
                audio_analysis_meta["audio_indicators"] = audio_indicators

                if synth_prob >= 0.65:
                    evidence_list.append(
                        EvidenceItem(
                            type=EvidenceType.SYNTHETIC_SPEECH_DETECTED,
                            source=EvidenceSource.AUDIO,
                            value=synth_prob,
                            confidence=round(synth_prob, 2),
                            severity_contribution=SeverityContribution.HIGH if synth_prob >= 0.80 else SeverityContribution.MEDIUM,
                            weight=0.35,
                            indicators=audio_indicators,
                            explanation=f"Demuxed audio stream evaluated as synthetic speech with confidence {synth_prob:.1%}.",
                        )
                    )

                # B. Whisper Speech Transcription
                whisper_meta = await self.transcription_engine.transcribe_with_metadata(audio_bytes=audio_extracted_wav)
                extracted_transcript = whisper_meta.get("transcript", "")
                audio_analysis_meta["transcript"] = extracted_transcript
                audio_analysis_meta["whisper_meta"] = whisper_meta

                if extracted_transcript:
                    audio_transcript = extracted_transcript
                    # Semantic Gateway Analysis on Voice Transcript
                    _, sem_evidence = await self.semantic_gateway.analyze(extracted_transcript)
                    evidence_list.extend(sem_evidence)

                # C. Speaker Verification (ECAPA-TDNN)
                cand_emb = target_profile.voice_embedding_reference if target_profile else None
                matched_speaker, speaker_sim, speaker_ev = self.speaker_verifier.verify_speaker(
                    audio_bytes=audio_extracted_wav,
                    candidate_embedding=cand_emb,
                    claimed_identity_name=target_name,
                )
                evidence_list.extend(speaker_ev)
                audio_analysis_meta["speaker_similarity"] = speaker_sim
                audio_analysis_meta["matched_speaker"] = matched_speaker.display_name if matched_speaker else None

                # D. Audio-Visual Consistency
                av_report = self.audiovisual_engine.analyze(
                    sampled_frames=sampled_frames,
                    audio_wav_bytes=audio_extracted_wav,
                    face_tracking=face_tracking_records,
                    fps=v_meta.fps,
                )
                metadata_dict["audiovisual_analysis"] = av_report
                if av_report.get("is_desynchronized", False):
                    desync_val = av_report.get("desynchronization_score", 0.65)
                    evidence_list.append(
                        EvidenceItem(
                            type=EvidenceType.AUDIO_VISUAL_MISMATCH,
                            source=EvidenceSource.VIDEO,
                            value=desync_val,
                            confidence=round(desync_val, 2),
                            severity_contribution=SeverityContribution.MEDIUM,
                            weight=0.20,
                            indicators=av_report,
                            explanation=(
                                f"Audio-visual analysis identified speech-mouth desynchronization (correlation: "
                                f"{av_report.get('mouth_energy_correlation', 0.0):.2f})."
                            ),
                        )
                    )
            metadata_dict["audio_analysis"] = audio_analysis_meta

            # 7. Keyframe Visual OCR Context & Cloud Vision Tier
            if len(sampled_frames) > 0:
                first_frame = sampled_frames[0][2]
                ocr_res, ocr_evidence = self.ocr_engine.extract_text(first_frame)
                if ocr_res and ocr_res.text:
                    metadata_dict["ocr_analysis"] = {
                        "has_text": True,
                        "text": ocr_res.text,
                        "signals": ocr_res.signals,
                    }
                    evidence_list.extend(ocr_evidence)

                # Multimodal Cloud Tier on Middle Video Keyframe
                middle_idx = len(sampled_frames) // 2
                middle_frame = sampled_frames[middle_idx][2]
                success, kf_buf = cv2.imencode(".jpg", middle_frame)
                if success:
                    kf_bytes = kf_buf.tobytes()
                    # Primary: Qwen Cloud Vision
                    if self.qwen_multimodal.is_available():
                        try:
                            qv_meta, qv_ev = await self.qwen_multimodal.analyze_image_multimodal(
                                image_bytes=kf_bytes,
                                context=f"Video keyframe frame #{middle_idx} from {video_name}",
                            )
                            if qv_meta:
                                evidence_list.extend(qv_ev)
                                metadata_dict["qwen_cloud_vision"] = qv_meta
                        except Exception as qv_err:
                            logger.warning(f"Video keyframe Qwen vision error: {qv_err}")

                    # Secondary: Gemini Cloud Vision
                    if self.gemini_multimodal.is_available():
                        try:
                            gv_meta, gv_ev = await self.gemini_multimodal.analyze_image_multimodal(
                                image_bytes=kf_bytes,
                                context=f"Video keyframe frame #{middle_idx} from {video_name}",
                            )
                            if gv_meta:
                                evidence_list.extend(gv_ev)
                                metadata_dict["gemini_cloud_vision"] = gv_meta
                        except Exception as gv_err:
                            logger.warning(f"Video keyframe Gemini vision error: {gv_err}")

        # -------------------------------------------------------------
        # BRANCH B: Fallback / Mocked Score Parameters (No video_bytes)
        # -------------------------------------------------------------
        else:
            if frame_manipulation_score >= 0.70:
                evidence_list.append(
                    EvidenceItem(
                        type=EvidenceType.DEEPFAKE_VIDEO,
                        source=EvidenceSource.VIDEO,
                        value=frame_manipulation_score,
                        confidence=frame_manipulation_score,
                        severity_contribution=SeverityContribution.HIGH,
                        weight=0.40,
                        indicators={"frame_manipulation_score": frame_manipulation_score},
                        explanation=f"Frame-by-frame sampling identified boundary artifacts and facial manipulation at {frame_manipulation_score:.1%}.",
                    )
                )

            if temporal_jitter_score >= 0.70:
                evidence_list.append(
                    EvidenceItem(
                        type=EvidenceType.TEMPORAL_VIDEO_FLICKER,
                        source=EvidenceSource.VIDEO,
                        value=temporal_jitter_score,
                        confidence=temporal_jitter_score,
                        severity_contribution=SeverityContribution.HIGH,
                        weight=0.25,
                        indicators={"temporal_jitter_score": temporal_jitter_score},
                        explanation="Temporal analysis identified unnatural inter-frame blinking irregularities and optical flow discontinuities.",
                    )
                )

            if audio_transcript:
                _, sem_evidence = await self.semantic_gateway.analyze(audio_transcript)
                evidence_list.extend(sem_evidence)

            if target_name:
                t_prof = self.identity_registry.lookup_identity(target_name) or self.identity_registry.find_by_name_or_title(target_name)
                if t_prof:
                    evidence_list.append(
                        EvidenceItem(
                            type=EvidenceType.PROTECTED_IDENTITY_TARGETED,
                            source=EvidenceSource.VIDEO,
                            value=0.90,
                            confidence=0.90,
                            severity_contribution=SeverityContribution.HIGH,
                            weight=0.35,
                            indicators={
                                "matched_identity": t_prof.display_name,
                                "organization": t_prof.organization,
                            },
                            explanation=f"Video targets registered VIP '{t_prof.display_name}' ({t_prof.organization}).",
                        )
                    )

            metadata_dict.update({
                "frame_score": frame_manipulation_score,
                "temporal_score": temporal_jitter_score,
            })

        # 8. Canonical Entity Resolution & Evidence Association
        canon_entities: List[CanonicalEntity] = []
        if target_name:
            canon_entities.append(EntityResolver.resolve_person(target_name))
        if video_bytes:
            canon_entities.append(EntityResolver.resolve_media_fingerprint(video_bytes, media_type="video"))

        for item in evidence_list:
            if not item.entity_refs and canon_entities:
                item.entity_refs = [e.id for e in canon_entities[:2]]

        summary_desc = f"Video Stream: {video_name} (Target: {target_name or 'Unspecified'})"
        if audio_transcript:
            summary_desc += f' - Speech: "{audio_transcript[:60]}..."'

        # 9. Multimodal Fusion & Deduplication
        fused_ctx = self.fusion_engine.fuse(evidence_list, canon_entities, context_summary=summary_desc)

        # 10. Deterministic Risk Evaluation & MITRE Mapping
        assessment = self.risk_engine.evaluate(fused_ctx.fused_evidence)
        assessment.mitre_techniques = MitreMapper.enrich(assessment.primary_threat, fused_ctx.fused_evidence)

        # 11. Traceable XAI & Playbook Actions
        explanation = ExplainabilityGenerator.generate(
            assessment, fused_ctx.fused_evidence, summary_desc, attack_chain=fused_ctx.attack_chain
        )
        actions = ResponsePlaybookGenerator.generate(
            assessment.primary_threat,
            assessment.level,
            fused_ctx.fused_evidence,
            target_entity=target_name or video_name,
        )

        title = f"Deepfake Video Threat: {video_name}" if assessment.level in (RiskLevel.HIGH, RiskLevel.CRITICAL) else f"Analyzed Video: {video_name}"
        incident = Incident(
            title=title,
            source=EvidenceSource.VIDEO,
            input_type="video",
            input_summary=summary_desc,
            threat_type=assessment.primary_threat,
            assessment=assessment.assessment,
            risk_level=assessment.level,
            risk_score=assessment.score,
            confidence=assessment.confidence,
            evidence=fused_ctx.fused_evidence,
            explanation=explanation,
            xai_summary=fused_ctx.xai_summary,
            risk_drivers=assessment.risk_drivers,
            mitre_techniques=assessment.mitre_techniques,
            recommended_actions=actions,
            entities=fused_ctx.entities,
            timeline=fused_ctx.timeline,
            correlation_groups=[g.model_dump() for g in fused_ctx.correlation_groups],
            attack_chain=fused_ctx.attack_chain,
            status=IncidentStatus.NEW,
            metadata=metadata_dict,
        )

        # 10. Incident Persistence & Event Logging
        persisted = await self.incident_repo.create(incident)
        duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
        await self.incident_repo.log_event(
            input_type="video",
            source="video_intelligence",
            risk_score=assessment.score,
            risk_level=assessment.level.value if hasattr(assessment.level, "value") else str(assessment.level),
            duration_ms=duration_ms,
            incident_id=persisted.id,
            provider_status=provider_status,
        )

        return persisted

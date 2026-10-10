import os
import tempfile
from pathlib import Path
from typing import Any, Dict, List, Optional
import cv2
import numpy as np
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field

from app.engines.phishing.orchestrator import WebIntelligenceOrchestrator
from app.engines.media.orchestrator import MediaIntelligenceOrchestrator
from app.engines.behavioural.orchestrator import BehaviouralOrchestrator
from app.schemas.incident import Incident, IncidentStatus
from app.schemas.evidence import EvidenceItem, EvidenceSource, EvidenceType
from app.engines.fusion.engine import EvidenceFusionEngine
from app.engines.fusion.entity import EntityResolver, CanonicalEntity
from app.risk.engine import RiskEngine
from app.risk.mitre import MitreMapper
from app.explainability.generator import ExplainabilityGenerator
from app.response.playbooks import ResponsePlaybookGenerator
from app.repositories.incident_repo import IncidentRepository

router = APIRouter(prefix="/analyze", tags=["Threat Analysis"])
orchestrator = WebIntelligenceOrchestrator()
media_orchestrator = MediaIntelligenceOrchestrator()
behavioural_orchestrator = BehaviouralOrchestrator()

# File validation constraints
MAX_IMAGE_SIZE = 15 * 1024 * 1024  # 15 MB
MAX_AUDIO_SIZE = 25 * 1024 * 1024  # 25 MB
MAX_VIDEO_SIZE = 50 * 1024 * 1024  # 50 MB

ALLOWED_IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp"}
ALLOWED_AUDIO_EXTS = {".mp3", ".wav", ".m4a", ".ogg"}
ALLOWED_VIDEO_EXTS = {".mp4", ".mov", ".webm"}



class URLAnalysisRequest(BaseModel):
    url: str = Field(description="URL to analyze for phishing, lookalikes, or malware indicators")
    context: Optional[str] = Field(default=None, description="Optional accompanying message text or email context")


class MessageAnalysisRequest(BaseModel):
    text: str = Field(description="Raw text of email, SMS, or social media communication")


class BrowserAnalysisRequest(BaseModel):
    url: str = Field(description="Current webpage URL")
    title: Optional[str] = Field(default=None, description="Page title")
    has_password_field: bool = Field(default=False, description="Whether page contains password input fields")
    form_actions: List[str] = Field(default_factory=list, description="Target destinations of visible forms")
    claimed_brand: Optional[str] = Field(default=None, description="Brand or organization claimed by page branding")


class AudioAnalysisRequest(BaseModel):
    claimed_identity_name: Optional[str] = Field(default=None, description="Claimed persona or caller identity")
    provided_transcript: Optional[str] = Field(default=None, description="Optional pre-extracted transcript")
    injected_synthetic_score: Optional[float] = Field(default=None, description="Direct synthetic speech probability [0-1]")
    injected_similarity_score: Optional[float] = Field(default=None, description="Direct acoustic similarity score [0-1]")
    audio_b64: Optional[str] = Field(default=None, description="Optional base64 encoded audio byte stream")


class ImageAnalysisRequest(BaseModel):
    ai_generated_prob: float = Field(default=0.85, description="Generative AI visual probability [0-1]")
    manipulation_prob: float = Field(default=0.0, description="Facial/document tampering indicator [0-1]")
    identity_similarity: float = Field(default=0.0, description="Similarity to high-profile reference target [0-1]")
    malicious_intent: float = Field(default=0.0, description="Disinformation or coercive intent probability [0-1]")
    target_name: Optional[str] = Field(default=None, description="Target high-profile persona name if applicable")
    image_b64: Optional[str] = Field(default=None, description="Optional base64 encoded image byte stream for OpenCV forensics")


class VideoAnalysisRequest(BaseModel):
    video_name: str = Field(description="Filename or identifier of the video clip")
    frame_manipulation_score: float = Field(default=0.82, description="Frame tampering score [0-1]")
    temporal_jitter_score: float = Field(default=0.79, description="Temporal inconsistency score [0-1]")
    target_name: Optional[str] = Field(default=None, description="Target executive or identity name")
    audio_transcript: Optional[str] = Field(default=None, description="Demuxed voice audio transcript")
    video_b64: Optional[str] = Field(default=None, description="Optional base64 encoded video byte stream")


@router.post("/url", response_model=Incident)
async def analyze_url(req: URLAnalysisRequest) -> Incident:
    """Analyze a suspicious URL and produce a canonical security incident."""
    if not req.url:
        raise HTTPException(status_code=400, detail="URL cannot be empty")
    return await orchestrator.analyze_url(req.url, req.context)


@router.post("/message", response_model=Incident)
async def analyze_message(req: MessageAnalysisRequest) -> Incident:
    """Analyze email, SMS, or social text for phishing and social engineering."""
    if not req.text:
        raise HTTPException(status_code=400, detail="Message text cannot be empty")
    return await orchestrator.analyze_message(req.text)


@router.post("/browser", response_model=Incident)
async def analyze_browser_page(req: BrowserAnalysisRequest) -> Incident:
    """Process bounded security DOM signals from the Browser Shield extension."""
    if not req.url:
        raise HTTPException(status_code=400, detail="URL cannot be empty")
    return await orchestrator.analyze_browser_page(
        url=req.url,
        title=req.title,
        has_password_field=req.has_password_field,
        form_actions=req.form_actions,
        claimed_brand=req.claimed_brand,
    )


@router.post("/audio", response_model=Incident)
async def analyze_audio(req: AudioAnalysisRequest) -> Incident:
    """Flagship Voice Impersonation & Audio Deepfake Analysis Pipeline."""
    import base64
    audio_bytes = None
    if req.audio_b64:
        try:
            audio_bytes = base64.b64decode(req.audio_b64)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base64 audio data: {e}")

    return await media_orchestrator.analyze_audio(
        audio_bytes=audio_bytes,
        provided_transcript=req.provided_transcript,
        claimed_identity_name=req.claimed_identity_name,
        injected_synthetic_score=req.injected_synthetic_score,
        injected_similarity_score=req.injected_similarity_score,
    )


@router.post("/image", response_model=Incident)
async def analyze_image(req: ImageAnalysisRequest) -> Incident:
    """Image Forensics and 4-Signal Generative Media Separation Pipeline."""
    import base64
    image_bytes = None
    if req.image_b64:
        try:
            image_bytes = base64.b64decode(req.image_b64)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base64 image data: {e}")

    return await media_orchestrator.analyze_image(
        image_bytes=image_bytes,
        ai_generated_prob=req.ai_generated_prob,
        manipulation_prob=req.manipulation_prob,
        identity_similarity=req.identity_similarity,
        malicious_intent=req.malicious_intent,
        target_name=req.target_name,
    )


@router.post("/video", response_model=Incident)
async def analyze_video(req: VideoAnalysisRequest) -> Incident:
    """Multimodal Video Deepfake Decomposition Pipeline."""
    import base64
    video_bytes = None
    if req.video_b64:
        try:
            video_bytes = base64.b64decode(req.video_b64)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base64 video data: {e}")

    return await media_orchestrator.analyze_video(
        video_name=req.video_name,
        video_bytes=video_bytes,
        frame_manipulation_score=req.frame_manipulation_score,
        temporal_jitter_score=req.temporal_jitter_score,
        target_name=req.target_name,
        audio_transcript=req.audio_transcript,
    )


class AuthEventAnalysisRequest(BaseModel):
    user_id: str = Field(description="Unique identity or username, e.g., 'exec_alice'")
    timestamp: Optional[Any] = Field(default=None, description="ISO timestamp of authentication event")
    ip_address: str = Field(default="127.0.0.1", description="Source IP address")
    source_ip: Optional[str] = Field(default=None, description="Alias for ip_address")
    latitude: Optional[float] = Field(default=None, description="GPS latitude coordinate")
    longitude: Optional[float] = Field(default=None, description="GPS longitude coordinate")
    city: Optional[str] = Field(default=None, description="Originating city")
    country: Optional[str] = Field(default=None, description="Two-letter ISO country code")
    user_agent: Optional[str] = Field(default=None, description="Browser / client user agent string")
    asn: Optional[str] = Field(default=None, description="Autonomous System Number, e.g., 'AS15169'")
    device_id: Optional[str] = Field(default=None, description="Hardware or cookie device identifier")
    success: bool = Field(default=True, description="Whether authentication credential verification succeeded")
    auth_method: str = Field(default="password", description="Authentication protocol or method used")
    failed_attempts: Optional[int] = Field(default=None, description="Failed authentication attempt count")
    failed_attempts_last_hour: Optional[int] = Field(default=None, description="Alias for failed_attempts")
    injected_failed_burst: Optional[int] = Field(default=None, description="Burst count for simulation testing")

    @property
    def effective_failed_attempts(self) -> Optional[int]:
        if self.failed_attempts is not None:
            return self.failed_attempts
        if self.failed_attempts_last_hour is not None:
            return self.failed_attempts_last_hour
        return self.injected_failed_burst

    @property
    def effective_ip_address(self) -> str:
        return self.source_ip or self.ip_address


@router.post("/auth-event", response_model=Incident)
async def analyze_auth_event(req: AuthEventAnalysisRequest) -> Incident:
    """Behavioural Security & Account Takeover (ATO) Prevention Pipeline."""
    if not req.user_id:
        raise HTTPException(status_code=400, detail="user_id cannot be empty")
    return await behavioural_orchestrator.analyze_auth_event(
        user_id=req.user_id,
        timestamp=req.timestamp,
        ip_address=req.effective_ip_address,
        latitude=req.latitude,
        longitude=req.longitude,
        city=req.city,
        country=req.country,
        user_agent=req.user_agent,
        asn=req.asn,
        device_id=req.device_id,
        success=req.success,
        auth_method=req.auth_method,
        injected_failed_burst=req.effective_failed_attempts,
    )


# ============================================================================
# Phase 1: Real Multipart Media Ingestion Endpoints with Strict Validation
# ============================================================================

async def _validate_image_upload(file: UploadFile) -> bytes:
    """Validate image MIME/extension, size, and OpenCV decodability."""
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file selected.")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_IMAGE_EXTS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload PNG, JPG or WEBP.",
        )

    content = await file.read()
    if not content or len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    if len(content) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File is too large. Maximum supported size is 15 MB.",
        )

    nparr = np.frombuffer(content, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(
            status_code=400,
            detail="Malformed image file could not be decoded. Please upload a valid PNG, JPG or WEBP image.",
        )

    return content


async def _validate_audio_upload(file: UploadFile) -> bytes:
    """Validate audio MIME/extension, size, and stream headers."""
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file selected.")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_AUDIO_EXTS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload MP3, WAV, M4A or OGG.",
        )

    content = await file.read()
    if not content or len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    if len(content) > MAX_AUDIO_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File is too large. Maximum supported size is 25 MB.",
        )

    # Magic byte header verification
    is_wav = content.startswith(b"RIFF") and len(content) >= 12 and content[8:12] == b"WAVE"
    is_mp3 = content.startswith(b"ID3") or (len(content) >= 2 and content[0] == 0xFF and (content[1] & 0xE0) == 0xE0)
    is_m4a = len(content) >= 8 and content[4:8] == b"ftyp"
    is_ogg = content.startswith(b"OggS")

    if not (is_wav or is_mp3 or is_m4a or is_ogg):
        raise HTTPException(
            status_code=400,
            detail="Malformed audio file. Audio stream header does not match a valid MP3, WAV, M4A or OGG format.",
        )

    return content


async def _validate_video_upload(file: UploadFile) -> bytes:
    """Validate video extension, size, header magic bytes, and frame accessibility."""
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file selected.")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_VIDEO_EXTS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Please upload MP4, MOV or WEBM.",
        )

    content = await file.read()
    if not content or len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    if len(content) > MAX_VIDEO_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File is too large. Maximum supported size is 50 MB.",
        )

    # Check container magic bytes
    is_mp4_mov = (len(content) >= 8 and content[4:8] in (b"ftyp", b"moov", b"wide", b"mdat", b"free")) or content.startswith(b"\x00\x00\x00")
    is_webm = content.startswith(b"\x1a\x45\xdf\xa3")
    is_avi = len(content) >= 12 and content.startswith(b"RIFF") and content[8:12] == b"AVI "

    if not (is_mp4_mov or is_webm or is_avi):
        raise HTTPException(
            status_code=400,
            detail="Malformed video file. Video stream header does not match a valid MP4, MOV, WEBM or AVI format.",
        )

    # Safe ephemeral processing using NamedTemporaryFile
    temp_dir = tempfile.gettempdir()
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=ext, dir=temp_dir)
    try:
        temp_file.write(content)
        temp_file.flush()
        temp_file.close()

        cap = cv2.VideoCapture(temp_file.name)
        if not cap.isOpened():
            raise HTTPException(
                status_code=400,
                detail="Malformed video file could not be decoded.",
            )
        cap.release()
    finally:
        # Immediate cleanup of temporary file to prevent persistence or leakage
        if os.path.exists(temp_file.name):
            try:
                os.unlink(temp_file.name)
            except OSError:
                pass

    return content


@router.post("/media/image", response_model=Incident)
async def upload_and_analyze_image(
    file: UploadFile = File(..., description="Image file (PNG, JPG, WEBP)"),
    claimed_identity: Optional[str] = Form(None, description="Claimed identity or target executive"),
    context: Optional[str] = Form(None, description="Additional context or incident narrative"),
) -> Incident:
    """Real multipart image upload and forensic intelligence analysis."""
    image_bytes = await _validate_image_upload(file)

    return await media_orchestrator.analyze_image(
        image_bytes=image_bytes,
        target_name=claimed_identity,
        context_text=context,
    )


@router.post("/media/audio", response_model=Incident)
async def upload_and_analyze_audio(
    file: UploadFile = File(..., description="Audio file (MP3, WAV, M4A, OGG)"),
    claimed_identity: Optional[str] = Form(None, description="Claimed caller or voice persona"),
    context: Optional[str] = Form(None, description="Transcript or call context"),
) -> Incident:
    """Real multipart audio upload with anti-spoofing and speaker verification."""
    audio_bytes = await _validate_audio_upload(file)

    return await media_orchestrator.analyze_audio(
        audio_bytes=audio_bytes,
        claimed_identity_name=claimed_identity,
        provided_transcript=context,
    )


@router.post("/media/video", response_model=Incident)
async def upload_and_analyze_video(
    file: UploadFile = File(..., description="Video file (MP4, MOV, WEBM)"),
    claimed_identity: Optional[str] = Form(None, description="Claimed subject or executive"),
    context: Optional[str] = Form(None, description="Optional audio transcript or context"),
) -> Incident:
    """Real multipart video upload with frame tampering and temporal analysis."""
    try:
        video_bytes = await _validate_video_upload(file)
        return await media_orchestrator.analyze_video(
            video_name=file.filename or "uploaded_video.mp4",
            video_bytes=video_bytes,
            target_name=claimed_identity,
            audio_transcript=context,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Video processing error: {str(exc)}"
        )


class MultimodalAnalysisRequest(BaseModel):
    message_text: Optional[str] = Field(default=None, description="Communication, email, or SMS content")
    url: Optional[str] = Field(default=None, description="Embedded or visited URL")
    claimed_identity_name: Optional[str] = Field(default=None, description="Claimed executive or persona")
    injected_synthetic_score: Optional[float] = Field(default=None, description="Synthetic media probability [0-1]")
    injected_similarity_score: Optional[float] = Field(default=None, description="Biometric resemblance probability [0-1]")
    provided_transcript: Optional[str] = Field(default=None, description="Voice transcript if audio analyzed")
    auth_event: Optional[Dict[str, Any]] = Field(default=None, description="Authentication telemetry payload")


@router.post("/multimodal", response_model=Incident)
async def analyze_multimodal(req: MultimodalAnalysisRequest) -> Incident:
    """End-to-End Multimodal Cross-Modal Correlation & Evidence Fusion Endpoint.

    Correlates observations across text, URLs, synthetic voice/video, identity claims,
    and behavioural anomalies into a unified, explainable Incident.
    """
    evidence_pool: List[EvidenceItem] = []
    entity_pool: List[CanonicalEntity] = []

    # 1. Message Intelligence
    if req.message_text:
        msg_inc = await orchestrator.analyze_message(req.message_text)
        evidence_pool.extend(msg_inc.evidence)
        entity_pool.extend(EntityResolver.extract_from_message(req.message_text))

    # 2. URL Intelligence
    if req.url:
        url_inc = await orchestrator.analyze_url(req.url, req.message_text)
        evidence_pool.extend(url_inc.evidence)
        norm_url, domain = EntityResolver.resolve_url(req.url)
        entity_pool.append(norm_url)
        entity_pool.append(domain)

    # 3. Audio / Media Intelligence
    if (
        req.claimed_identity_name
        or req.injected_synthetic_score is not None
        or req.injected_similarity_score is not None
        or req.provided_transcript
    ):
        audio_inc = await media_orchestrator.analyze_audio(
            claimed_identity_name=req.claimed_identity_name,
            injected_synthetic_score=req.injected_synthetic_score or 0.0,
            injected_similarity_score=req.injected_similarity_score or 0.0,
            provided_transcript=req.provided_transcript,
        )
        evidence_pool.extend(audio_inc.evidence)
        if req.claimed_identity_name:
            entity_pool.append(EntityResolver.resolve_person(req.claimed_identity_name))

    # 4. Behavioural / ATO Intelligence
    if req.auth_event:
        ae = req.auth_event
        auth_inc = await behavioural_orchestrator.analyze_auth_event(
            user_id=str(ae.get("user_id", "unknown")),
            ip_address=str(ae.get("ip_address", "127.0.0.1")),
            device_id=ae.get("device_id"),
            country=ae.get("country"),
            success=not bool(ae.get("is_failed_login", False)),
            injected_failed_burst=ae.get("failed_attempts_last_hour"),
        )
        evidence_pool.extend(auth_inc.evidence)
        if "user_id" in ae:
            entity_pool.append(EntityResolver.resolve_user(str(ae["user_id"])))
        if "ip_address" in ae:
            entity_pool.append(EntityResolver.resolve_ip(str(ae["ip_address"])))
        if "device_id" in ae:
            entity_pool.append(EntityResolver.resolve_device(str(ae["device_id"])))

    if not evidence_pool:
        raise HTTPException(
            status_code=400,
            detail="At least one modality (message_text, url, media attributes, or auth_event) must be provided.",
        )

    # 5. Multimodal Evidence Fusion & Cross-Modal Correlation
    fusion_engine = EvidenceFusionEngine()
    summary_desc = "Multimodal Complex Security Event"
    fused_ctx = fusion_engine.fuse(evidence_pool, entity_pool, context_summary=summary_desc)

    # 6. Deterministic Risk Evaluation & MITRE Mapping
    risk_engine = RiskEngine()
    assessment = risk_engine.evaluate(fused_ctx.fused_evidence)
    assessment.mitre_techniques = MitreMapper.enrich(assessment.primary_threat, fused_ctx.fused_evidence)

    # 7. XAI & Action Playbooks
    explanation = ExplainabilityGenerator.generate(
        assessment, fused_ctx.fused_evidence, summary_desc, attack_chain=fused_ctx.attack_chain
    )
    actions = ResponsePlaybookGenerator.generate(
        assessment.primary_threat,
        assessment.level,
        fused_ctx.fused_evidence,
    )

    # 8. Canonical Incident Construction & Persistence
    incident = Incident(
        title=f"Multimodal Security Incident: {assessment.primary_threat.replace('_', ' ').title()}",
        source=EvidenceSource.MULTIMODAL,
        input_type="multimodal",
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
            "multimodal_correlation": True,
            "correlation_groups_count": len(fused_ctx.correlation_groups),
            "attack_chain_depth": len(fused_ctx.attack_chain),
        },
    )

    repo = IncidentRepository()
    persisted = await repo.create(incident)
    return persisted





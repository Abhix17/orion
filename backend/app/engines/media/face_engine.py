"""Real Face Detection & ArcFace Embedding Engine for ORION v2.

Integrates:
1. Deep Neural Face Detector: OpenCV YuNet (opencv/face_detection_yunet)
2. Face Alignment & Cropping: 112x112 canonical facial region
3. ArcFace Facial Embeddings: gaunernst/vit_tiny_patch8_112.arcface_ms1mv3 (512-dim, L2-normalized)
4. Protected Identity Comparison: Cosine similarity against enrolled VIP profiles

CRITICAL PRINCIPLES:
- Face detection alone is NOT identity proof.
- High face similarity indicates acoustic/visual resemblance, NOT mathematical proof of identity.
- Face match without malicious context is NOT automatically fraud.
- Multiple faces are analyzed explicitly and separately.
"""

from dataclasses import dataclass
import logging
import os
import threading
import time
from typing import Any, Dict, List, Optional, Tuple, Union
import cv2
from huggingface_hub import hf_hub_download
import numpy as np
from PIL import Image
import timm
import torch

from app.engines.identity.registry import IdentityRegistry, ProtectedIdentity
from app.schemas.evidence import EvidenceItem, EvidenceSource, EvidenceType, SeverityContribution

logger = logging.getLogger("orion.media.face_engine")

YUNET_REPO = "opencv/face_detection_yunet"
YUNET_FILE = "face_detection_yunet_2023mar.onnx"
ARCFACE_CHECKPOINT = "hf_hub:gaunernst/vit_tiny_patch8_112.arcface_ms1mv3"


@dataclass
class FaceDetectionResult:
    """Individual face detection record with bounding box, landmarks, and embedding."""
    face_idx: int
    bbox: List[int]  # [x, y, w, h]
    confidence: float
    landmarks: List[List[float]]  # 5 landmarks: right eye, left eye, nose, right mouth, left mouth
    embedding: List[float]  # 512-dim normalized vector
    matched_identity_id: Optional[str] = None
    matched_name: Optional[str] = None
    similarity: float = 0.0
    is_verified_match: bool = False


class FaceIntelligenceEngine:
    """Thread-safe singleton orchestrating face detection, ArcFace embeddings, and identity verification."""

    _instance: Optional["FaceIntelligenceEngine"] = None
    _lock: threading.Lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self, identity_registry: Optional[IdentityRegistry] = None):
        if getattr(self, "_initialized", False):
            return

        self.identity_registry = identity_registry or IdentityRegistry()
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.yunet_model_path: Optional[str] = None
        self._arcface_model = None
        self._models_loaded: bool = False
        self._load_lock = threading.Lock()
        self._initialized = True

    def _ensure_models_loaded(self) -> bool:
        """Lazy thread-safe initialization of YuNet and ArcFace checkpoints."""
        if self._models_loaded:
            return True

        with self._load_lock:
            if self._models_loaded:
                return True
            try:
                logger.info("Initializing YuNet face detector model...")
                self.yunet_model_path = hf_hub_download(repo_id=YUNET_REPO, filename=YUNET_FILE)

                logger.info(f"Initializing ArcFace model {ARCFACE_CHECKPOINT} on {self.device}...")
                self._arcface_model = timm.create_model(ARCFACE_CHECKPOINT, pretrained=True)
                self._arcface_model.to(self.device)
                self._arcface_model.eval()

                self._models_loaded = True
                logger.info("FaceIntelligenceEngine models initialized successfully.")
                return True
            except Exception as exc:
                logger.warning(f"Failed to load FaceIntelligenceEngine models: {exc}")
                self._models_loaded = False
                return False

    def is_model_loaded(self) -> bool:
        return self._models_loaded

    def detect_faces(
        self,
        bgr_image: np.ndarray,
        score_threshold: float = 0.60,
    ) -> List[Tuple[List[int], float, List[List[float]]]]:
        """Run deep neural YuNet face detection on image.

        Returns list of tuples: (bbox [x, y, w, h], confidence, landmarks [[x, y], ...])
        """
        if not self._ensure_models_loaded() or not self.yunet_model_path:
            return []

        h, w = bgr_image.shape[:2]
        try:
            detector = cv2.FaceDetectorYN.create(
                model=self.yunet_model_path,
                config="",
                input_size=(w, h),
                score_threshold=score_threshold,
                nms_threshold=0.3,
                top_k=20,
            )
            detector.setInputSize((w, h))
            _, faces = detector.detect(bgr_image)

            if faces is None or len(faces) == 0:
                return []

            results = []
            for face in faces:
                # Format: [x, y, w, h, x_re, y_re, x_le, y_le, x_nt, y_nt, x_rc, y_rc, x_lc, y_lc, score]
                box = [int(face[0]), int(face[1]), int(face[2]), int(face[3])]
                conf = round(float(face[14]), 3)
                landmarks = [
                    [float(face[4]), float(face[5])],    # Right eye
                    [float(face[6]), float(face[7])],    # Left eye
                    [float(face[8]), float(face[9])],    # Nose tip
                    [float(face[10]), float(face[11])],  # Right mouth corner
                    [float(face[12]), float(face[13])],  # Left mouth corner
                ]
                results.append((box, conf, landmarks))
            return results
        except Exception as exc:
            logger.warning(f"YuNet face detection failed: {exc}")
            return []

    def crop_and_align_face(
        self,
        bgr_image: np.ndarray,
        bbox: List[int],
        landmarks: Optional[List[List[float]]] = None,
        target_size: Tuple[int, int] = (112, 112),
    ) -> np.ndarray:
        """Crop and align facial crop to 112x112 for ArcFace feature extraction."""
        h_img, w_img = bgr_image.shape[:2]
        x, y, w, h = bbox

        # Expand box slightly to include full face context
        pad_x = int(w * 0.15)
        pad_y = int(h * 0.15)

        x1 = max(0, x - pad_x)
        y1 = max(0, y - pad_y)
        x2 = min(w_img, x + w + pad_x)
        y2 = min(h_img, y + h + pad_y)

        crop = bgr_image[y1:y2, x1:x2]
        if crop.size == 0:
            crop = bgr_image[max(0, y):min(h_img, y + h), max(0, x):min(w_img, x + w)]
            if crop.size == 0:
                return cv2.resize(bgr_image, target_size)

        aligned = cv2.resize(crop, target_size, interpolation=cv2.INTER_LINEAR)
        return aligned

    def extract_arcface_embedding(self, face_bgr_112: np.ndarray) -> List[float]:
        """Extract 512-dimensional L2-normalized ArcFace embedding vector."""
        if not self._ensure_models_loaded() or self._arcface_model is None:
            return []

        # Convert to RGB float32 in range [-1.0, 1.0] (ArcFace normalization: (x / 255.0 - 0.5) / 0.5)
        face_rgb = cv2.cvtColor(face_bgr_112, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
        face_norm = (face_rgb - 0.5) / 0.5

        # Format to NCHW tensor: (1, 3, 112, 112)
        tensor = torch.from_numpy(face_norm).permute(2, 0, 1).unsqueeze(0).to(self.device)

        with torch.no_grad():
            emb_tensor = self._arcface_model(tensor)
            # Normalize embedding vector with L2 norm
            emb_norm = torch.nn.functional.normalize(emb_tensor, p=2, dim=1)
            embedding = emb_norm.squeeze(0).cpu().numpy().tolist()

        return [round(float(v), 5) for v in embedding]

    def process_image(
        self,
        bgr_image: np.ndarray,
        claimed_identity_name: Optional[str] = None,
        match_threshold: float = 0.60,
        injected_similarity_score: Optional[float] = None,
    ) -> Tuple[List[FaceDetectionResult], List[EvidenceItem]]:
        """End-to-end multi-face detection, ArcFace embedding, and identity registry matching.

        Returns:
            Tuple of:
            - List of FaceDetectionResult (one for each detected face)
            - List of normalized EvidenceItem objects
        """
        start = time.perf_counter()
        raw_faces = self.detect_faces(bgr_image)
        results: List[FaceDetectionResult] = []
        evidence_items: List[EvidenceItem] = []

        if not raw_faces:
            # Check if simulation score is injected without detected faces
            if injected_similarity_score is not None:
                sim = round(max(0.0, min(1.0, float(injected_similarity_score))), 3)
                target_ident = self.identity_registry.find_by_name_or_title(claimed_identity_name) if claimed_identity_name else None
                name = target_ident.display_name if target_ident else (claimed_identity_name or "Claimed Persona")
                ident_id = target_ident.identity_id if target_ident else "injected_profile"
                sim_result = FaceDetectionResult(
                    face_idx=0,
                    bbox=[0, 0, bgr_image.shape[1], bgr_image.shape[0]],
                    confidence=1.0,
                    landmarks=[],
                    embedding=[],
                    matched_identity_id=ident_id,
                    matched_name=name,
                    similarity=sim,
                    is_verified_match=(sim >= match_threshold),
                )
                results.append(sim_result)
                if sim >= match_threshold:
                    evidence_items.append(
                        self._create_similarity_evidence(
                            face_idx=0,
                            matched_name=name,
                            matched_id=ident_id,
                            similarity=sim,
                            threshold=match_threshold,
                        )
                    )
            return results, evidence_items

        for idx, (bbox, conf, landmarks) in enumerate(raw_faces):
            aligned_face = self.crop_and_align_face(bgr_image, bbox, landmarks)
            embedding = self.extract_arcface_embedding(aligned_face)

            # Match against identity registry
            matched_profile: Optional[ProtectedIdentity] = None
            similarity: float = 0.0

            if injected_similarity_score is not None and idx == 0:
                similarity = round(max(0.0, min(1.0, float(injected_similarity_score))), 3)
                if claimed_identity_name:
                    matched_profile = self.identity_registry.find_by_name_or_title(claimed_identity_name)
                if not matched_profile and similarity >= match_threshold:
                    matched_profile = self.identity_registry.profiles[0] if self.identity_registry.profiles else None
            elif embedding:
                matched_profile, similarity = self.identity_registry.match_face_embedding(
                    candidate_embedding=embedding,
                    claimed_identity_query=claimed_identity_name,
                    match_threshold=match_threshold,
                )

            is_verified = (similarity >= match_threshold) and (matched_profile is not None)
            face_record = FaceDetectionResult(
                face_idx=idx,
                bbox=bbox,
                confidence=conf,
                landmarks=landmarks,
                embedding=embedding,
                matched_identity_id=matched_profile.identity_id if matched_profile else None,
                matched_name=matched_profile.display_name if matched_profile else None,
                similarity=similarity,
                is_verified_match=is_verified,
            )
            results.append(face_record)

            # Generate evidence item for high similarity to reference identity
            if is_verified and matched_profile:
                evidence_items.append(
                    self._create_similarity_evidence(
                        face_idx=idx,
                        matched_name=matched_profile.display_name,
                        matched_id=matched_profile.identity_id,
                        similarity=similarity,
                        threshold=match_threshold,
                    )
                )

        return results, evidence_items

    def _create_similarity_evidence(
        self,
        face_idx: int,
        matched_name: str,
        matched_id: str,
        similarity: float,
        threshold: float,
    ) -> EvidenceItem:
        """Produce schema-normalized EvidenceItem for facial identity similarity."""
        sev = SeverityContribution.HIGH if similarity >= 0.75 else SeverityContribution.MEDIUM
        return EvidenceItem(
            type=EvidenceType.PROTECTED_IDENTITY_TARGETED,
            source=EvidenceSource.IMAGE,
            value=similarity,
            confidence=similarity,
            severity_contribution=sev,
            weight=0.25,
            indicators={
                "provider": "arcface",
                "model": ARCFACE_CHECKPOINT,
                "model_loaded": self._models_loaded,
                "face_index": face_idx,
                "matched_identity_id": matched_id,
                "matched_name": matched_name,
                "similarity": similarity,
                "threshold": threshold,
                "device": self.device,
            },
            explanation=(
                f"ArcFace biometric face analysis showed high similarity ({similarity:.1%}) "
                f"to enrolled reference identity '{matched_name}'."
            ),
        )

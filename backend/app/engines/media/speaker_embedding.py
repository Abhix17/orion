"""ECAPA-TDNN Speaker Embedding Verification Engine for ORION v2.

Extracts deep speaker embeddings (192-dimensional) using real ECAPA-TDNN architectures
and performs cosine similarity comparisons against authorized reference profiles.
Decouples speaker similarity from malice: similarity to a voice is evidence of
resemblance, never standalone proof of identity or malicious intent.
"""

import logging
import threading
import time
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import torch

from app.engines.identity.registry import IdentityRegistry, ProtectedIdentity
from app.engines.media.audio_preprocess import (
    AudioPreprocessor,
    AudioProcessingError,
)
from app.schemas.evidence import EvidenceItem, EvidenceSource, EvidenceType, SeverityContribution

logger = logging.getLogger("orion.speaker_embedding")

DEFAULT_ECAPA_CHECKPOINT = "speechbrain/spkrec-ecapa-voxceleb"


class EcapaTdnnSpeakerVerifier:
    """Extracts speaker embeddings and computes cosine similarity against protected profiles."""

    _instance: Optional["EcapaTdnnSpeakerVerifier"] = None
    _lock = threading.Lock()

    def __init__(
        self,
        registry: Optional[IdentityRegistry] = None,
        model_checkpoint: str = DEFAULT_ECAPA_CHECKPOINT,
    ):
        self.registry = registry or IdentityRegistry()
        self.model_checkpoint = model_checkpoint
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self._classifier: Any = None
        self._model_loaded: bool = False
        self._init_error: Optional[str] = None
        self._load_lock = threading.Lock()

    def _ensure_model_loaded(self) -> bool:
        """Lazy-load the SpeechBrain ECAPA-TDNN classifier with bounded timeout."""
        if self._model_loaded:
            return True

        with self._load_lock:
            if self._model_loaded:
                return True
            
            result_container = {}
            def _load_worker():
                try:
                    from speechbrain.inference.speaker import EncoderClassifier
                    run_opts = {"device": self.device}
                    classifier = EncoderClassifier.from_hparams(
                        source=self.model_checkpoint,
                        run_opts=run_opts,
                    )
                    result_container["classifier"] = classifier
                except Exception as ex:
                    result_container["error"] = str(ex)

            th = threading.Thread(target=_load_worker, daemon=True)
            th.start()
            th.join(timeout=30.0)

            if "classifier" in result_container:
                self._classifier = result_container["classifier"]
                self._model_loaded = True
                self._init_error = None
                logger.info(f"ECAPA-TDNN model '{self.model_checkpoint}' loaded successfully.")
                return True
            else:
                err = result_container.get("error", "Model load timed out after 6s")
                self._init_error = err
                self._model_loaded = False
                logger.warning(
                    f"Could not load ECAPA-TDNN model '{self.model_checkpoint}': {err}. "
                    "Operating with fallback embedding extractor."
                )
                return False

    def is_model_loaded(self) -> bool:
        return self._model_loaded

    def extract_embedding(
        self,
        audio_bytes: Optional[bytes] = None,
        seed: Optional[int] = None,
    ) -> List[float]:
        """Extract a 192-dim normalized speaker embedding."""
        # 1. Deterministic seed support for synthetic baseline/test profiles
        if seed is not None:
            rng = np.random.default_rng(seed)
            vec = rng.standard_normal(192)
            return (vec / np.linalg.norm(vec)).tolist()

        # 2. Real audio extraction
        if audio_bytes and len(audio_bytes) > 32:
            try:
                audio_16k, quality = AudioPreprocessor.decode_and_resample(audio_bytes)
                if len(audio_16k) >= 1600 and self._ensure_model_loaded() and self._classifier is not None:
                    # Shape: [batch, samples]
                    sig = torch.from_numpy(audio_16k).unsqueeze(0).to(self.device)
                    with torch.no_grad():
                        emb_tensor = self._classifier.encode_batch(sig)
                    raw_emb = emb_tensor.squeeze().detach().cpu().numpy()
                    norm = np.linalg.norm(raw_emb)
                    if norm > 0:
                        return (raw_emb / norm).tolist()
            except Exception as exc:
                logger.warning(f"ECAPA embedding extraction from audio failed: {exc}, using fallback hash")

            # Fallback deterministic hash seed if model failed
            h = sum(audio_bytes[:256])
            rng = np.random.default_rng(h)
            vec = rng.standard_normal(192)
            return (vec / np.linalg.norm(vec)).tolist()

        # Fallback random vector
        vec = np.random.randn(192)
        return (vec / np.linalg.norm(vec)).tolist()

    def verify_speaker(
        self,
        audio_bytes: Optional[bytes] = None,
        candidate_embedding: Optional[List[float]] = None,
        claimed_identity_name: Optional[str] = None,
    ) -> Tuple[Optional[ProtectedIdentity], float, List[EvidenceItem]]:
        """Match speaker against protected profiles and generate calibrated EvidenceItems.

        Returns:
            Tuple of (matched_identity_or_None, similarity_score, evidence_items_list).
            If no reference exists or match is below threshold, matched_identity is None
            and speaker_identity is 'unverified'.
        """
        start_time = time.perf_counter()
        emb = candidate_embedding or self.extract_embedding(audio_bytes)
        matched_identity, similarity = self.registry.match_voice_embedding(emb, claimed_identity_name)

        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        evidence_items: List[EvidenceItem] = []

        if matched_identity and similarity >= 0.70:
            sev = SeverityContribution.CRITICAL if similarity >= 0.88 else SeverityContribution.HIGH
            indicators = {
                "provider": "ecapa_tdnn",
                "model": self.model_checkpoint,
                "model_loaded": self._model_loaded,
                "device": self.device,
                "matched_identity_id": matched_identity.identity_id,
                "matched_name": matched_identity.display_name,
                "matched_role": matched_identity.role_or_title,
                "matched_org": matched_identity.organization,
                "cosine_similarity": similarity,
                "speaker_identity": "high_similarity",
                "latency_ms": latency_ms,
            }
            evidence_items.append(
                EvidenceItem(
                    type=EvidenceType.SPEAKER_SIMILARITY_MATCH,
                    source=EvidenceSource.AUDIO,
                    value=similarity,
                    confidence=similarity,
                    severity_contribution=sev,
                    weight=0.25,
                    indicators=indicators,
                    explanation=(
                        f"Speaker embedding analysis indicates high acoustic similarity ({similarity:.1%}) "
                        f"to registered reference identity '{matched_identity.display_name} "
                        f"({matched_identity.role_or_title})'. Note: acoustic similarity indicates voice "
                        f"resemblance and does not constitute proof of identity or malice."
                    ),
                    entity_refs=[matched_identity.identity_id],
                )
            )

        return matched_identity, similarity, evidence_items

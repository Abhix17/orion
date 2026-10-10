"""Synthetic AI-Generated Image Detection for ORION v2.

Employs real Hugging Face Vision Transformer (ViT) classification
(umm-maybe/AI-image-detector) to evaluate artificial vs natural image probability,
strictly decoupled from identity resemblance or malicious intent.
"""

import logging
import threading
import time
from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np
from PIL import Image
import torch
from transformers import AutoImageProcessor, AutoModelForImageClassification

from app.core.config import settings
from app.schemas.evidence import EvidenceItem, EvidenceSource, EvidenceType, SeverityContribution

logger = logging.getLogger("orion.media.image_synthetic")

MODEL_CHECKPOINT = "umm-maybe/AI-image-detector"


class ImageSyntheticClassifier:
    """Thread-safe singleton evaluating AI-generation probability using real ViT inference."""

    _instance: Optional["ImageSyntheticClassifier"] = None
    _lock: threading.Lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self, model_checkpoint: str = MODEL_CHECKPOINT):
        if getattr(self, "_initialized", False):
            return

        self.model_checkpoint = model_checkpoint
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self._processor: Optional[AutoImageProcessor] = None
        self._model: Optional[AutoModelForImageClassification] = None
        self._model_loaded: bool = False
        self._load_lock = threading.Lock()
        self._initialized = True

    def _ensure_model_loaded(self) -> bool:
        """Lazy thread-safe initialization of the Vision Transformer checkpoint."""
        if self._model_loaded:
            return True

        with self._load_lock:
            if self._model_loaded:
                return True
            try:
                logger.info(f"Loading synthetic image detector {self.model_checkpoint} on {self.device}...")
                self._processor = AutoImageProcessor.from_pretrained(self.model_checkpoint)
                self._model = AutoModelForImageClassification.from_pretrained(self.model_checkpoint)
                self._model.to(self.device)
                self._model.eval()
                self._model_loaded = True
                logger.info(f"Synthetic image detector {self.model_checkpoint} loaded successfully.")
                return True
            except Exception as exc:
                logger.warning(f"Failed to load synthetic image model {self.model_checkpoint}: {exc}")
                self._model = None
                self._processor = None
                self._model_loaded = False
                return False

    def is_model_loaded(self) -> bool:
        return self._model_loaded

    def classify_image(
        self,
        image_input: Union[Image.Image, np.ndarray, bytes],
        injected_ai_prob: Optional[float] = None,
    ) -> Dict[str, Any]:
        """Classify whether an image is AI-generated (artificial) or natural (human).

        Returns:
            Dictionary containing model metadata, calibrated probabilities, and latency.
        """
        # Support injected score for simulation testing and deterministic test suites
        if injected_ai_prob is not None:
            synth_p = round(max(0.0, min(1.0, float(injected_ai_prob))), 4)
            return {
                "provider": "w2v2_synthetic_simulation",
                "model": self.model_checkpoint,
                "model_loaded": True,
                "ai_generated_probability": synth_p,
                "natural_probability": round(1.0 - synth_p, 4),
                "device": self.device,
                "inference_latency_ms": 1.0,
            }

        # Convert input to PIL RGB
        pil_img: Image.Image
        if isinstance(image_input, Image.Image):
            pil_img = image_input.convert("RGB")
        elif isinstance(image_input, np.ndarray):
            # Assumes RGB numpy array
            pil_img = Image.fromarray(image_input).convert("RGB")
        elif isinstance(image_input, bytes):
            import io
            pil_img = Image.open(io.BytesIO(image_input)).convert("RGB")
        else:
            return {
                "provider": "unavailable",
                "model": self.model_checkpoint,
                "model_loaded": False,
                "error": "Unsupported image input format.",
                "ai_generated_probability": 0.5,
                "natural_probability": 0.5,
                "device": self.device,
                "inference_latency_ms": 0.0,
            }

        if not self._ensure_model_loaded():
            return {
                "provider": "unavailable",
                "model": self.model_checkpoint,
                "model_loaded": False,
                "error": "Model could not be initialized.",
                "ai_generated_probability": 0.5,
                "natural_probability": 0.5,
                "device": self.device,
                "inference_latency_ms": 0.0,
            }

        start = time.perf_counter()
        try:
            inputs = self._processor(images=pil_img, return_tensors="pt")
            inputs = {k: v.to(self.device) for k, v in inputs.items()}

            with torch.no_grad():
                outputs = self._model(**inputs)
                logits = outputs.logits
                probs = torch.softmax(logits, dim=1)[0].cpu().tolist()

            latency_ms = round((time.perf_counter() - start) * 1000, 2)

            # In umm-maybe/AI-image-detector:
            # label 0: 'artificial', label 1: 'human'
            ai_prob = round(float(probs[0]), 4)
            human_prob = round(float(probs[1]), 4)

            return {
                "provider": "synthetic_image_detector",
                "model": self.model_checkpoint,
                "model_loaded": True,
                "ai_generated_probability": ai_prob,
                "natural_probability": human_prob,
                "device": self.device,
                "inference_latency_ms": latency_ms,
            }
        except Exception as exc:
            logger.warning(f"Inference error during synthetic image classification: {exc}")
            return {
                "provider": "unavailable",
                "model": self.model_checkpoint,
                "model_loaded": False,
                "error": str(exc),
                "ai_generated_probability": 0.5,
                "natural_probability": 0.5,
                "device": self.device,
                "inference_latency_ms": round((time.perf_counter() - start) * 1000, 2),
            }

    async def predict_online_image(self, image_bytes: bytes) -> Optional[float]:
        """Optional online query to Hugging Face Inference API if HF_TOKEN is configured."""
        if not settings.HF_TOKEN or not image_bytes:
            return None
        import httpx
        url = f"https://router.huggingface.co/hf-inference/models/{self.model_checkpoint}"
        headers = {"Authorization": f"Bearer {settings.HF_TOKEN}"}
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(url, headers=headers, content=image_bytes)
                if res.status_code == 200:
                    data = res.json()
                    if isinstance(data, list):
                        for item in data:
                            lbl = item.get("label", "").lower()
                            if "artif" in lbl or "ai" in lbl or "fake" in lbl or "synthetic" in lbl:
                                return round(float(item.get("score", 0.9)), 3)
        except Exception:
            pass
        return None

    def evaluate_media_signals(
        self,
        ai_generated_prob: float,
        manipulation_prob: float = 0.0,
        identity_similarity: float = 0.0,
        malicious_intent: float = 0.0,
        target_name: Optional[str] = None,
        model_metadata: Optional[Dict[str, Any]] = None,
    ) -> Tuple[Dict[str, float], List[EvidenceItem]]:
        """Evaluate the separate dimensions and emit schema-normalized EvidenceItems.

        CRITICAL PRINCIPLES ENFORCED:
        - AI-generated image alone is NOT critical.
        - High face similarity alone is NOT critical.
        - Manipulation alone is NOT critical.
        """
        is_malicious_context = (identity_similarity >= 0.70) or (malicious_intent >= 0.70) or (manipulation_prob >= 0.70)

        # Risk multiplier reflects that AI-gen alone is benign, but targeted/manipulated media is hostile
        if not is_malicious_context:
            risk_multiplier = round(min(0.35, ai_generated_prob * 0.3), 3)
        else:
            hostile_factor = max(manipulation_prob, identity_similarity, malicious_intent)
            risk_multiplier = round(min(1.0, 0.40 + 0.60 * hostile_factor), 3)

        signals = {
            "ai_generated_probability": round(ai_generated_prob, 3),
            "manipulation_probability": round(manipulation_prob, 3),
            "identity_similarity": round(identity_similarity, 3),
            "malicious_intent": round(malicious_intent, 3),
            "risk_multiplier": risk_multiplier,
        }

        meta = model_metadata or {}
        evidence_items: List[EvidenceItem] = []

        # 1. AI-generated media signal (informational if not in malicious context)
        if ai_generated_prob >= 0.50:
            sev = SeverityContribution.CRITICAL if (ai_generated_prob >= 0.85 and is_malicious_context) else (
                SeverityContribution.HIGH if (ai_generated_prob >= 0.75 and is_malicious_context) else (
                    SeverityContribution.MEDIUM if is_malicious_context else SeverityContribution.LOW
                )
            )

            indicators = dict(signals)
            indicators.update({
                "provider": meta.get("provider", "synthetic_image_detector"),
                "model": meta.get("model", self.model_checkpoint),
                "model_loaded": meta.get("model_loaded", True),
                "ai_generated_probability": ai_generated_prob,
                "natural_probability": meta.get("natural_probability", round(1.0 - ai_generated_prob, 3)),
                "device": meta.get("device", self.device),
            })

            evidence_items.append(
                EvidenceItem(
                    type=EvidenceType.AI_GENERATED_MEDIA,
                    source=EvidenceSource.IMAGE,
                    value=ai_generated_prob,
                    confidence=ai_generated_prob,
                    severity_contribution=sev,
                    weight=0.20 if is_malicious_context else 0.05,
                    indicators=indicators,
                    explanation=(
                        f"Vision Transformer model ({self.model_checkpoint}) detected visual generative artifacts with "
                        f"{ai_generated_prob:.1%} probability."
                    ),
                )
            )

        # 2. Localized Face Tampering signal
        if manipulation_prob >= 0.70:
            evidence_items.append(
                EvidenceItem(
                    type=EvidenceType.FACE_TAMPERING_INDICATOR,
                    source=EvidenceSource.IMAGE,
                    value=manipulation_prob,
                    confidence=manipulation_prob,
                    severity_contribution=SeverityContribution.HIGH,
                    weight=0.25,
                    indicators=signals,
                    explanation=(
                        f"Face boundary and texture consistency analysis indicates localized manipulation "
                        f"or deepfake face-swapping ({manipulation_prob:.1%})."
                    ),
                )
            )

        # 3. Protected Identity Similarity Match
        if identity_similarity >= 0.60 and target_name:
            evidence_items.append(
                EvidenceItem(
                    type=EvidenceType.PROTECTED_IDENTITY_TARGETED,
                    source=EvidenceSource.IMAGE,
                    value=target_name,
                    confidence=identity_similarity,
                    severity_contribution=SeverityContribution.HIGH if identity_similarity >= 0.75 else SeverityContribution.MEDIUM,
                    weight=0.25,
                    indicators=signals,
                    explanation=f"Facial embedding matches protected profile '{target_name}' at {identity_similarity:.1%} similarity.",
                )
            )

        return signals, evidence_items

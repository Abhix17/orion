"""Real Vision Transformer (ViT) Video Deepfake & Face Tampering Classifier.

Utilizes public Hugging Face model checkpoint:
'dima806/deepfake_vs_real_image_detection'
Architecture: ViTForImageClassification (Google ViT base fine-tuned for Deepfake detection).
Label mapping: {0: 'Real', 1: 'Fake'}
Outputs: Calibrated softmax probabilities (frame_fake_probability, frame_real_probability).
"""

from dataclasses import dataclass
import logging
import threading
import time
from typing import Any, Dict, Optional, Tuple
import cv2
import numpy as np
from PIL import Image
import torch
from transformers import AutoImageProcessor, AutoModelForImageClassification

logger = logging.getLogger(__name__)

DEFAULT_DEEPFAKE_CHECKPOINT = "dima806/deepfake_vs_real_image_detection"


@dataclass
class FrameDeepfakeResult:
    """Inference result for an individual frame or face crop."""
    frame_fake_probability: float
    frame_real_probability: float
    model_loaded: bool
    model_name: str
    device: str
    latency_ms: float
    is_injected: bool = False

    @property
    def fake_probability(self) -> float:
        return self.frame_fake_probability

    @property
    def real_probability(self) -> float:
        return self.frame_real_probability


class VideoDeepfakeClassifier:
    """Thread-safe singleton for frame-level deepfake ViT classification."""

    _instance: Optional["VideoDeepfakeClassifier"] = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self, model_checkpoint: str = DEFAULT_DEEPFAKE_CHECKPOINT):
        if self._initialized:
            return
        with self._lock:
            if self._initialized:
                return
            self.model_checkpoint = model_checkpoint
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            self.processor = None
            self.model = None
            self._model_loaded = False
            self._init_error = None
            self._load_model()
            self._initialized = True

    def _load_model(self):
        """Lazy load tokenizer/processor and ViT classification model."""
        start_time = time.perf_counter()
        try:
            logger.info("Loading Video Deepfake ViT model: %s on %s", self.model_checkpoint, self.device)
            self.processor = AutoImageProcessor.from_pretrained(self.model_checkpoint)
            self.model = AutoModelForImageClassification.from_pretrained(self.model_checkpoint)
            self.model.to(self.device)
            self.model.eval()
            self._model_loaded = True
            load_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.info("Video Deepfake ViT model loaded in %s ms", load_ms)
        except Exception as e:
            self._model_loaded = False
            self._init_error = str(e)
            logger.warning("Video Deepfake ViT model loading failed: %s", str(e))

    @property
    def model_id(self) -> str:
        return self.model_checkpoint

    def is_model_loaded(self) -> bool:
        return self._model_loaded

    def classify_face_crop(self, face_bgr: np.ndarray, injected_score: Optional[float] = None) -> FrameDeepfakeResult:
        """Run deepfake inference on face crop (BGR or RGB)."""
        if face_bgr is None or face_bgr.size == 0:
            return FrameDeepfakeResult(0.0, 1.0, self._model_loaded, self.model_checkpoint, self.device, 0.0)
        # Convert BGR to RGB
        rgb = cv2.cvtColor(face_bgr, cv2.COLOR_BGR2RGB) if len(face_bgr.shape) == 3 and face_bgr.shape[2] == 3 else face_bgr
        return self.predict_frame(rgb, injected_score=injected_score)

    def classify_frame(self, frame_bgr: np.ndarray, injected_score: Optional[float] = None) -> FrameDeepfakeResult:
        """Run deepfake inference on full frame (BGR or RGB)."""
        if frame_bgr is None or frame_bgr.size == 0:
            return FrameDeepfakeResult(0.0, 1.0, self._model_loaded, self.model_checkpoint, self.device, 0.0)
        rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB) if len(frame_bgr.shape) == 3 and frame_bgr.shape[2] == 3 else frame_bgr
        return self.predict_frame(rgb, injected_score=injected_score)

    def predict_frame(
        self,
        rgb_array: np.ndarray,
        injected_score: Optional[float] = None,
    ) -> FrameDeepfakeResult:
        """Run deepfake inference on an RGB frame or face crop.

        Args:
            rgb_array: RGB numpy array (H, W, 3).
            injected_score: Optional mock score for benchmark/test reproducibility.

        Returns:
            FrameDeepfakeResult with calibrated probabilities.
        """
        start_t = time.perf_counter()

        # Handle backward compatibility / test injections
        if injected_score is not None:
            clamped = float(np.clip(injected_score, 0.0, 1.0))
            return FrameDeepfakeResult(
                frame_fake_probability=round(clamped, 4),
                frame_real_probability=round(1.0 - clamped, 4),
                model_loaded=self._model_loaded,
                model_name=self.model_checkpoint,
                device=self.device,
                latency_ms=0.1,
                is_injected=True,
            )

        if not self._model_loaded or self.model is None or self.processor is None:
            # Honest transparent fallback
            return FrameDeepfakeResult(
                frame_fake_probability=0.0,
                frame_real_probability=0.0,
                model_loaded=False,
                model_name="unavailable",
                device=self.device,
                latency_ms=0.0,
                is_injected=False,
            )

        try:
            # Convert numpy array to PIL Image
            if isinstance(rgb_array, np.ndarray):
                pil_img = Image.fromarray(rgb_array)
            else:
                pil_img = rgb_array

            inputs = self.processor(images=pil_img, return_tensors="pt")
            inputs = {k: v.to(self.device) for k, v in inputs.items()}

            with torch.no_grad():
                outputs = self.model(**inputs)
                logits = outputs.logits
                probs = torch.softmax(logits, dim=-1)[0].cpu().numpy()

            # id2label is {0: 'Real', 1: 'Fake'}
            real_prob = float(probs[0])
            fake_prob = float(probs[1])
            latency_ms = round((time.perf_counter() - start_t) * 1000, 2)

            return FrameDeepfakeResult(
                frame_fake_probability=round(fake_prob, 4),
                frame_real_probability=round(real_prob, 4),
                model_loaded=True,
                model_name=self.model_checkpoint,
                device=self.device,
                latency_ms=latency_ms,
                is_injected=False,
            )

        except Exception as e:
            logger.error("Inference failure on frame: %s", str(e))
            return FrameDeepfakeResult(
                frame_fake_probability=0.0,
                frame_real_probability=0.0,
                model_loaded=False,
                model_name="error",
                device=self.device,
                latency_ms=0.0,
                is_injected=False,
            )

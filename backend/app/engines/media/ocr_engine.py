"""OCR & Visual Text Extraction Engine for ORION v2.

Employs EasyOCR to extract embedded text from visual artifacts,
detecting fraudulent payment demands, executive authority assertions,
urgency signals, and credential phishing lures within images.
"""

from dataclasses import dataclass
import logging
import os
import threading
import time
from typing import Any, Dict, List, Optional, Tuple, Union
import numpy as np
from PIL import Image
import torch

from app.schemas.evidence import EvidenceItem, EvidenceSource, EvidenceType, SeverityContribution

logger = logging.getLogger("orion.media.ocr_engine")

# Keywords for rule-based semantic heuristic tagging over OCR text
URGENCY_KEYWORDS = ["urgent", "immediately", "immediate", "action required", "expedite", "asap", "deadline"]
FINANCIAL_KEYWORDS = ["wire transfer", "transfer funds", "payment", "bank", "invoice", "remittance", "rtgs", "neft", "crypto", "pay now"]
CREDENTIAL_KEYWORDS = ["password", "otp", "login", "verify account", "security update", "credentials", "passcode"]
AUTHORITY_KEYWORDS = ["chief financial officer", "cfo", "ceo", "director", "police", "customs", "reserve bank", "rbi", "income tax"]
COERCION_KEYWORDS = ["arrest", "legal action", "penalty", "disconnection", "suspension", "warrant"]


@dataclass
class OCRBlock:
    """Individual OCR bounding box and recognized text snippet."""
    text: str
    confidence: float
    bbox: List[List[int]]


@dataclass
class OCRResult:
    """Comprehensive OCR extraction summary with semantic keyword flags."""
    text: str
    blocks: List[OCRBlock]
    signals: Dict[str, bool]
    model_loaded: bool
    latency_ms: float


class OCREngine:
    """Thread-safe singleton OCR engine utilizing EasyOCR."""

    _instance: Optional["OCREngine"] = None
    _lock: threading.Lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if getattr(self, "_initialized", False):
            return

        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self._reader = None
        self._model_loaded: bool = False
        self._load_lock = threading.Lock()
        self._initialized = True

    def _ensure_model_loaded(self) -> bool:
        """Lazy thread-safe initialization of EasyOCR reader."""
        if self._model_loaded:
            return True

        with self._load_lock:
            if self._model_loaded:
                return True
            try:
                import easyocr
                # Ensure UTF-8 IO encoding on Windows
                os.environ["PYTHONIOENCODING"] = "utf-8"
                use_gpu = torch.cuda.is_available()
                logger.info(f"Initializing EasyOCR reader (gpu={use_gpu})...")
                self._reader = easyocr.Reader(["en"], gpu=use_gpu, verbose=False)
                self._model_loaded = True
                logger.info("EasyOCR reader initialized successfully.")
                return True
            except Exception as exc:
                logger.warning(f"Failed to load EasyOCR: {exc}")
                self._reader = None
                self._model_loaded = False
                return False

    def is_model_loaded(self) -> bool:
        return self._model_loaded

    def extract_text(
        self,
        image_input: Union[np.ndarray, Image.Image, bytes],
    ) -> Tuple[OCRResult, List[EvidenceItem]]:
        """Extract text from image and flag social engineering indicators.

        Returns:
            Tuple of (OCRResult, List[EvidenceItem])
        """
        start = time.perf_counter()

        # Convert to numpy array
        np_img: np.ndarray
        if isinstance(image_input, Image.Image):
            np_img = np.array(image_input.convert("RGB"))
        elif isinstance(image_input, np.ndarray):
            np_img = image_input
        elif isinstance(image_input, bytes):
            import io
            pil_img = Image.open(io.BytesIO(image_input)).convert("RGB")
            np_img = np.array(pil_img)
        else:
            return (
                OCRResult(text="", blocks=[], signals={}, model_loaded=False, latency_ms=0.0),
                [],
            )

        if not self._ensure_model_loaded() or self._reader is None:
            return (
                OCRResult(text="", blocks=[], signals={}, model_loaded=False, latency_ms=0.0),
                [],
            )

        try:
            raw_results = self._reader.readtext(np_img)
            latency_ms = round((time.perf_counter() - start) * 1000, 2)

            blocks: List[OCRBlock] = []
            text_snippets: List[str] = []

            for bbox, text, conf in raw_results:
                clean_text = str(text).strip()
                if clean_text:
                    text_snippets.append(clean_text)
                    box_coords = [[int(pt[0]), int(pt[1])] for pt in bbox]
                    blocks.append(
                        OCRBlock(text=clean_text, confidence=round(float(conf), 3), bbox=box_coords)
                    )

            full_text = " ".join(text_snippets)
            text_lower = full_text.lower()

            signals = {
                "has_text": len(blocks) > 0,
                "urgency": any(k in text_lower for k in URGENCY_KEYWORDS),
                "payment_request": any(k in text_lower for k in FINANCIAL_KEYWORDS),
                "credential_request": any(k in text_lower for k in CREDENTIAL_KEYWORDS),
                "authority_claim": any(k in text_lower for k in AUTHORITY_KEYWORDS),
                "coercion": any(k in text_lower for k in COERCION_KEYWORDS),
            }

            ocr_res = OCRResult(
                text=full_text,
                blocks=blocks,
                signals=signals,
                model_loaded=True,
                latency_ms=latency_ms,
            )

            evidence_items: List[EvidenceItem] = []

            # If malicious intent keywords are clearly visible in the image, produce contextual EvidenceItem
            if signals["payment_request"] or signals["credential_request"] or signals["coercion"]:
                sev = SeverityContribution.HIGH if (signals["payment_request"] and signals["urgency"]) else SeverityContribution.MEDIUM
                evi_type = EvidenceType.FINANCIAL_DEMAND_INTENT if signals["payment_request"] else EvidenceType.URGENT_CALL_TO_ACTION
                evidence_items.append(
                    EvidenceItem(
                        type=evi_type,
                        source=EvidenceSource.IMAGE,
                        value=0.80 if signals["payment_request"] else 0.65,
                        confidence=0.85,
                        severity_contribution=sev,
                        weight=0.20,
                        indicators={
                            "provider": "easyocr",
                            "extracted_text": full_text[:200],
                            "signals": signals,
                            "latency_ms": latency_ms,
                        },
                        explanation=(
                            f"Visual OCR analysis detected suspicious financial or coercive instructions: "
                            f"'{full_text[:120]}...'"
                        ),
                    )
                )

            return ocr_res, evidence_items

        except Exception as exc:
            logger.warning(f"EasyOCR text extraction error: {exc}")
            latency_ms = round((time.perf_counter() - start) * 1000, 2)
            return (
                OCRResult(text="", blocks=[], signals={}, model_loaded=False, latency_ms=latency_ms),
                [],
            )

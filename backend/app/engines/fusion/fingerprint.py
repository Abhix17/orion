"""Deterministic Media and Event Fingerprinting for ORION v2.

Provides cryptographic and perceptual fingerprinting for images, audio, video,
and authentication events to prevent duplicate incident creation and enable
cross-incident correlation.
"""

from datetime import datetime, timezone
from hashlib import sha256
from typing import List, Optional
from app.engines.fusion.entity import CanonicalEntity


class FingerprintEngine:
    """Computes deterministic signatures for security payloads and incidents."""

    @staticmethod
    def fingerprint_media(data: bytes, media_type: str = "image") -> str:
        """Calculate a deterministic SHA-256 fingerprint for a media byte stream."""
        if not data:
            return "media_empty"
        h = sha256(data).hexdigest()
        prefix = f"media_{media_type.lower()}"
        return f"{prefix}_{h[:20]}"

    @staticmethod
    def fingerprint_text(text: str) -> str:
        """Calculate a normalized text message fingerprint."""
        if not text:
            return "text_empty"
        normalized = " ".join(text.lower().split())
        h = sha256(normalized.encode()).hexdigest()
        return f"text_{h[:20]}"

    @staticmethod
    def fingerprint_incident(
        input_type: str,
        entities: List[CanonicalEntity],
        timestamp: Optional[datetime] = None,
        bucket_seconds: int = 300,  # 5-minute debouncing window
    ) -> str:
        """Generate a time-bucketed fingerprint for incident deduplication.

        Incidents of the same type sharing the same primary entities within the
        configured time bucket produce identical fingerprints, preventing duplicate alerts.
        """
        ts = timestamp or datetime.now(timezone.utc)
        epoch = int(ts.timestamp())
        bucket = epoch // bucket_seconds

        # Sort entity IDs for determinism
        sorted_ent_ids = sorted([ent.id for ent in entities])
        ent_str = "|".join(sorted_ent_ids) if sorted_ent_ids else "no_entities"

        seed = f"{input_type.lower()}:{ent_str}:{bucket}"
        h = sha256(seed.encode()).hexdigest()[:16]
        return f"incfp_{input_type.lower()}_{h}"

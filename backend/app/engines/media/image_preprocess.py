"""Image Preprocessing and Validation Engine for ORION v2.

Provides robust validation, format decoding, decompression safety,
and deterministic quality diagnostics for visual threat analysis.
"""

import io
from dataclasses import dataclass
from typing import Any, Dict, Optional, Tuple
import cv2
import numpy as np
from PIL import Image

# Safeguard against decompression bomb DOS attacks
Image.MAX_IMAGE_PIXELS = 25_000_000

MAX_IMAGE_BYTES = 15 * 1024 * 1024  # 15 MB
MAX_DIMENSION = 4096
MIN_DIMENSION = 16


class ImagePreprocessingError(Exception):
    """Base exception for image validation and decoding failures."""
    pass


class ImageEmptyError(ImagePreprocessingError):
    """Raised when uploaded image content is empty."""
    pass


class ImageCorruptedError(ImagePreprocessingError):
    """Raised when image bytes cannot be decoded or are corrupted."""
    pass


class ImageOversizedError(ImagePreprocessingError):
    """Raised when image exceeds dimension or file size limits."""
    pass


class UnsupportedImageFormatError(ImagePreprocessingError):
    """Raised when file format is not supported."""
    pass


@dataclass
class PreprocessedImage:
    """Standardized representation of a validated, decoded image."""
    image_bytes: bytes
    rgb_array: np.ndarray
    bgr_array: np.ndarray
    pil_image: Image.Image
    width: int
    height: int
    format: str
    channels: int
    metadata: Dict[str, Any]


class ImagePreprocessor:
    """Validates and preprocesses image files safely without modifying source."""

    @staticmethod
    def validate_magic_bytes(content: bytes) -> str:
        """Inspect file header magic numbers to verify genuine image type."""
        if not content or len(content) < 8:
            raise ImageEmptyError("Uploaded image file is empty or too small.")

        if content.startswith(b"\x89PNG\r\n\x1a\n"):
            return "PNG"
        if content.startswith(b"\xff\xd8\xff"):
            return "JPEG"
        if content.startswith(b"RIFF") and len(content) >= 12 and content[8:12] == b"WEBP":
            return "WEBP"

        raise UnsupportedImageFormatError(
            "Unsupported file format. Image must be a valid PNG, JPEG, or WEBP file."
        )

    @classmethod
    def validate_and_decode(cls, content: bytes) -> PreprocessedImage:
        """Decode image bytes safely with comprehensive security and corruption guards."""
        if not content or len(content) == 0:
            raise ImageEmptyError("Uploaded image file is empty.")

        if len(content) > MAX_IMAGE_BYTES:
            raise ImageOversizedError(
                f"File size exceeds maximum allowed limit of {MAX_IMAGE_BYTES // (1024 * 1024)} MB."
            )

        fmt = cls.validate_magic_bytes(content)

        # 1. PIL validation for integrity and dimensions
        try:
            pil_img = Image.open(io.BytesIO(content))
            pil_img.verify()
        except Exception as err:
            raise ImageCorruptedError(f"Image corrupted or unreadable by image parser: {err}")

        # 2. Re-open to read pixels after verify()
        try:
            pil_img = Image.open(io.BytesIO(content))
            width, height = pil_img.size

            if width > MAX_DIMENSION or height > MAX_DIMENSION:
                raise ImageOversizedError(
                    f"Image dimensions ({width}x{height}) exceed maximum allowed limit of {MAX_DIMENSION}x{MAX_DIMENSION}."
                )
            if width < MIN_DIMENSION or height < MIN_DIMENSION:
                raise ImageCorruptedError(
                    f"Image dimensions ({width}x{height}) are too small for forensic analysis."
                )

            # Convert to RGB safely (drops alpha or palette modes)
            pil_rgb = pil_img.convert("RGB")
            rgb_arr = np.array(pil_rgb, dtype=np.uint8)
        except (ImageOversizedError, ImageCorruptedError):
            raise
        except Exception as err:
            raise ImageCorruptedError(f"Failed to decode image pixels safely: {err}")

        # 3. OpenCV BGR conversion
        bgr_arr = cv2.cvtColor(rgb_arr, cv2.COLOR_RGB2BGR)

        # 4. Extract basic file/stream metadata
        metadata = {
            "format": fmt,
            "width": width,
            "height": height,
            "channels": 3,
            "aspect_ratio": round(width / max(1, height), 3),
            "file_size_bytes": len(content),
            "has_exif": bool(getattr(pil_img, "_getexif", lambda: None)()),
        }

        return PreprocessedImage(
            image_bytes=content,
            rgb_array=rgb_arr,
            bgr_array=bgr_arr,
            pil_image=pil_rgb,
            width=width,
            height=height,
            format=fmt,
            channels=3,
            metadata=metadata,
        )

"""Classical OpenCV & PIL Image Forensics for ORION v2."""

import io
from typing import Any, Dict, List, Optional, Tuple
import cv2
import numpy as np
from PIL import Image

from app.schemas.evidence import EvidenceItem, EvidenceSource, EvidenceType, SeverityContribution


class ImageForensicsEngine:
    """Extracts classical computer vision forensic indicators from images."""

    @staticmethod
    def analyze_image_bytes(image_bytes: bytes) -> Tuple[Dict[str, Any], List[EvidenceItem]]:
        """Run multi-layer forensic analysis: Laplacian variance, FFT spectrum, noise, and EXIF."""
        evidence_items: List[EvidenceItem] = []

        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                return {}, []

            height, width, _ = img.shape
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

            # 1. Laplacian Edge Variance (Blur & Splicing check)
            laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())

            # 2. FFT Frequency-Domain Analysis (Generative artifact check)
            f = np.fft.fft2(gray.astype(np.float32))
            fshift = np.fft.fftshift(f)
            magnitude_spectrum = 20 * np.log(np.abs(fshift) + 1e-6)

            # Check high-frequency energy ratio
            h, w = gray.shape
            crow, ccol = h // 2, w // 2
            center_region = magnitude_spectrum[crow - 20:crow + 20, ccol - 20:ccol + 20]
            outer_region_mean = float(np.mean(magnitude_spectrum))
            center_mean = float(np.mean(center_region))
            fft_anomaly_ratio = round(outer_region_mean / max(1.0, center_mean), 3)

            # 3. Noise Inconsistency Check (Color channel variance ratio)
            r, g, b = cv2.split(img)
            r_std, g_std, b_std = float(np.std(r)), float(np.std(g)), float(np.std(b))
            max_noise_diff = round(max(abs(r_std - g_std), abs(g_std - b_std), abs(r_std - b_std)), 2)

            # 4. Metadata & EXIF Inspection
            has_exif = False
            software_tag: Optional[str] = None
            try:
                pil_img = Image.open(io.BytesIO(image_bytes))
                exif_data = pil_img._getexif()
                if exif_data:
                    has_exif = True
                    # Tag 305 is Software in EXIF
                    software_tag = str(exif_data.get(305, "")) or None
            except Exception:
                pass

            is_forensic_anomaly = fft_anomaly_ratio > 0.85 or max_noise_diff > 35.0

            indicators = {
                "dimensions": f"{width}x{height}",
                "laplacian_variance": round(laplacian_var, 2),
                "laplacian_edge_variance": round(laplacian_var, 2),
                "fft_high_freq_ratio": fft_anomaly_ratio,
                "noise_channel_diff": max_noise_diff,
                "noise_std": round(float((r_std + g_std + b_std) / 3.0), 2),
                "has_forensic_anomaly": is_forensic_anomaly,
                "has_exif": has_exif,
                "software_tag": software_tag,
            }

            if is_forensic_anomaly:
                evidence_items.append(
                    EvidenceItem(
                        type=EvidenceType.IMAGE_FORENSIC_ANOMALY,
                        source=EvidenceSource.IMAGE,
                        value=fft_anomaly_ratio,
                        confidence=0.82,
                        severity_contribution=SeverityContribution.HIGH,
                        weight=0.25,
                        indicators=indicators,
                        explanation=(
                            f"Classical OpenCV forensic analysis identified frequency-domain anomalies "
                            f"(FFT ratio {fft_anomaly_ratio}) and noise distribution inconsistencies across color channels."
                        ),
                    )
                )

            return indicators, evidence_items

        except Exception as exc:
            return {"error": str(exc)}, []

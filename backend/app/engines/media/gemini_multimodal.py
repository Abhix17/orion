"""Multimodal Gemini Provider Engine for ORION v2.

Provides cloud-native multimodal security intelligence across image, audio, video,
and text modalities using Google Gemini 2.5 / 1.5 Flash models.
"""

import base64
import json
import logging
from typing import Any, Dict, List, Optional, Tuple
import httpx

from app.core.config import settings
from app.schemas.evidence import EvidenceItem, EvidenceSource, EvidenceType, SeverityContribution

from io import BytesIO
from PIL import Image

logger = logging.getLogger("orion.gemini_multimodal")


def _downsample_image(image_bytes: bytes, max_dim: int = 512) -> Tuple[bytes, str]:
    """Downsample image to max_dim pixels to maintain low token overhead and high speed."""
    try:
        img = Image.open(BytesIO(image_bytes))
        img = img.convert("RGB")
        w, h = img.size
        if w > max_dim or h > max_dim:
            scale = max_dim / max(w, h)
            new_w, new_h = max(1, int(w * scale)), max(1, int(h * scale))
            img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        buf = BytesIO()
        img.save(buf, format="JPEG", quality=85)
        return buf.getvalue(), "image/jpeg"
    except Exception as err:
        logger.warning(f"Image downsampling fallback: {err}")
        return image_bytes, "image/jpeg"


class MultimodalGeminiEngine:
    """Multimodal cloud intelligence provider leveraging Google Gemini API."""

    MODEL_FALLBACKS = [
        "gemini-3.7-flash",
        "gemini-3.5-flash",
        "gemini-2.5-flash",
        "gemini-3.1-flash-lite",
        "gemini-3.8-flash",
        "gemini-flash-latest",
    ]

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY

    def is_available(self) -> bool:
        """Check if GEMINI_API_KEY is configured."""
        return bool(self.api_key and len(self.api_key.strip()) > 5)

    async def analyze_image_multimodal(
        self,
        image_bytes: bytes,
        mime_type: str = "image/jpeg",
        context: Optional[str] = None,
    ) -> Tuple[Dict[str, Any], List[EvidenceItem]]:
        """Perform multimodal visual forensic analysis using Gemini Vision."""
        if not self.is_available() or not image_bytes:
            return {}, []

        compressed_bytes, final_mime = _downsample_image(image_bytes, max_dim=768)
        b64_data = base64.b64encode(compressed_bytes).decode("utf-8")
        prompt = """You are a world-class AI image forensics expert, digital media investigator, and computer vision researcher.
Carefully examine this image to determine if it is:
1. AI-Generated Synthetic Media (created with models like Midjourney, FLUX, Stable Diffusion, DALL-E 3, Imagen, etc.), or
2. Manipulated / Deepfake Tampered (face swap, deepfake splicing, AI inpainting/generative fill, localized face tampering), or
3. Authentic Natural Photograph (genuine camera shot or unmanipulated digital graphic).

Look for forensic visual cues:
- Skin texture: unnatural hyper-smoothness, plastic/waxy sheen, missing pores or repeating pore patterns.
- Anatomical anomalies: asymmetric irises, odd pupil shapes, distorted ear lobes, extra/merged teeth, unnatural fingers/fingernails.
- Lighting & Physics: inconsistent light sources, reflections in eyes that don't match ambient lighting, impossible shadow angles.
- Diffusion artifacts: blurred hair strands blending into background, painterly/illustrative background textures, nonsensical background text/signs.
- Edges and boundaries: seam halos around faces, blending blur between neck/collar, unnatural DOF (depth-of-field) falloff.

Output ONLY a valid JSON object matching this schema:
{
  "is_ai_generated": boolean,
  "ai_generated_probability": float between 0.0 and 1.0,
  "has_facial_tampering": boolean,
  "tampering_probability": float between 0.0 and 1.0,
  "detected_artifacts": list of strings (e.g. ["hyper_smooth_skin_texture", "unnatural_iris_reflections", "diffusion_background_blur", "unnatural_hair_blending"]),
  "extracted_text": string or null,
  "has_coercive_text": boolean,
  "claimed_identity": string or null,
  "verdict_summary": string explaining exact visual observations and why it is or is not AI-generated
}
"""
        if context:
            prompt += f"\nAdditional contextual note: {context}"

        contents = [
            {
                "parts": [
                    {"inline_data": {"mime_type": mime_type, "data": b64_data}},
                    {"text": prompt},
                ]
            }
        ]

        parsed = await self._query_gemini(contents)
        if not parsed:
            return {}, []

        is_ai = bool(parsed.get("is_ai_generated", False))
        ai_prob = float(parsed.get("ai_generated_probability", 0.88 if is_ai else 0.05))
        is_tamp = bool(parsed.get("has_facial_tampering", False))
        tamp_prob = float(parsed.get("tampering_probability", 0.80 if is_tamp else 0.05))
        artifacts = parsed.get("detected_artifacts", [])
        extracted_text = parsed.get("extracted_text", "")
        claimed_id = parsed.get("claimed_identity")
        verdict = parsed.get("verdict_summary") or parsed.get("summary", "")

        metadata = {
            "provider": "gemini_multimodal",
            "is_ai_generated": is_ai,
            "ai_generated_probability": round(ai_prob, 3),
            "has_facial_tampering": is_tamp,
            "tampering_probability": round(tamp_prob, 3),
            "detected_artifacts": artifacts,
            "extracted_text": extracted_text,
            "claimed_identity": claimed_id,
            "summary": verdict,
        }

        evidence_items: List[EvidenceItem] = []

        if ai_prob >= 0.50 or is_ai:
            evidence_items.append(
                EvidenceItem(
                    type=EvidenceType.AI_GENERATED_MEDIA,
                    source=EvidenceSource.IMAGE,
                    value=ai_prob,
                    confidence=round(ai_prob, 2),
                    severity_contribution=SeverityContribution.HIGH if ai_prob >= 0.80 else SeverityContribution.MEDIUM,
                    weight=0.35,
                    indicators={
                        "provider": "gemini_multimodal_vision",
                        "ai_generated_probability": ai_prob,
                        "artifacts": artifacts,
                        "verdict_summary": verdict,
                    },
                    explanation=f"Gemini Vision detected AI-generated synthetic markers ({ai_prob:.1%} confidence). Artifacts: {', '.join(artifacts[:4]) or 'Generative diffusion textures'}.",
                )
            )

        if tamp_prob >= 0.50 or is_tamp:
            evidence_items.append(
                EvidenceItem(
                    type=EvidenceType.FACE_TAMPERING_INDICATOR,
                    source=EvidenceSource.IMAGE,
                    value=tamp_prob,
                    confidence=round(tamp_prob, 2),
                    severity_contribution=SeverityContribution.HIGH if tamp_prob >= 0.75 else SeverityContribution.MEDIUM,
                    weight=0.30,
                    indicators={
                        "provider": "gemini_multimodal_vision",
                        "tampering_probability": tamp_prob,
                        "artifacts": artifacts,
                    },
                    explanation=f"Gemini Vision identified facial boundary tampering / deepfake swap artifacts ({tamp_prob:.1%} confidence).",
                )
            )

        if claimed_id:
            evidence_items.append(
                EvidenceItem(
                    type=EvidenceType.PROTECTED_IDENTITY_TARGETED,
                    source=EvidenceSource.IMAGE,
                    value=claimed_id,
                    confidence=0.85,
                    severity_contribution=SeverityContribution.HIGH,
                    weight=0.25,
                    indicators={"claimed_identity": claimed_id, "provider": "gemini_multimodal_vision"},
                    explanation=f"Gemini Vision recognized targeted entity / public figure '{claimed_id}' in image context.",
                )
            )

        return metadata, evidence_items

    async def analyze_audio_multimodal(
        self,
        audio_bytes: bytes,
        mime_type: str = "audio/wav",
        transcript: Optional[str] = None,
    ) -> Tuple[Dict[str, Any], List[EvidenceItem]]:
        """Perform multimodal audio synthetic and prosody analysis using Gemini Audio."""
        if not self.is_available() or not audio_bytes:
            return {}, []

        b64_data = base64.b64encode(audio_bytes).decode("utf-8")
        prompt = """You are an audio forensics specialist analyzing speech recordings for voice cloning, synthetic TTS, and social engineering coercion.
Analyze this audio recording and output ONLY a valid JSON object matching this schema:
{
  "is_synthetic_speech": boolean,
  "synthetic_speech_probability": float between 0.0 and 1.0,
  "detected_cues": list of strings (e.g., ["unnatural_breathiness", "robotic_pitch_cadence", "phase_discontinuity"]),
  "transcript": string or null,
  "coercive_intent": boolean,
  "claimed_speaker": string or null,
  "summary": string
}
"""
        if transcript:
            prompt += f"\nReference transcript: \"{transcript}\""

        contents = [
            {
                "parts": [
                    {"inline_data": {"mime_type": mime_type, "data": b64_data}},
                    {"text": prompt},
                ]
            }
        ]

        parsed = await self._query_gemini(contents)
        if not parsed:
            return {}, []

        synth_prob = float(parsed.get("synthetic_speech_probability", 0.0 if not parsed.get("is_synthetic_speech") else 0.85))
        cues = parsed.get("detected_cues", [])
        claimed_spk = parsed.get("claimed_speaker")

        metadata = {
            "provider": "gemini_multimodal_audio",
            "is_synthetic_speech": parsed.get("is_synthetic_speech", False),
            "synthetic_speech_probability": synth_prob,
            "detected_cues": cues,
            "transcript": parsed.get("transcript", transcript),
            "claimed_speaker": claimed_spk,
            "summary": parsed.get("summary", ""),
        }

        evidence_items: List[EvidenceItem] = []

        if synth_prob >= 0.65:
            evidence_items.append(
                EvidenceItem(
                    type=EvidenceType.SYNTHETIC_SPEECH_DETECTED,
                    source=EvidenceSource.AUDIO,
                    value=synth_prob,
                    confidence=round(synth_prob, 2),
                    severity_contribution=SeverityContribution.HIGH if synth_prob >= 0.80 else SeverityContribution.MEDIUM,
                    weight=0.35,
                    indicators={
                        "provider": "gemini_multimodal_audio",
                        "synthetic_speech_probability": synth_prob,
                        "cues": cues,
                    },
                    explanation=f"Gemini Audio identified synthetic speech / voice cloning acoustic cues (confidence: {synth_prob:.1%}). Cues: {', '.join(cues[:3]) or 'TTS prosody anomaly'}.",
                )
            )

        if claimed_spk:
            evidence_items.append(
                EvidenceItem(
                    type=EvidenceType.PROTECTED_IDENTITY_TARGETED,
                    source=EvidenceSource.AUDIO,
                    value=claimed_spk,
                    confidence=0.85,
                    severity_contribution=SeverityContribution.HIGH,
                    weight=0.25,
                    indicators={"claimed_speaker": claimed_spk, "provider": "gemini_multimodal_audio"},
                    explanation=f"Gemini Audio identified claimed speaker identity '{claimed_spk}'.",
                )
            )

        return metadata, evidence_items

    async def _query_gemini(self, contents: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Execute HTTP query with model fallback order."""
        for model in self.MODEL_FALLBACKS:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={self.api_key}"
            payload = {
                "contents": contents,
                "generationConfig": {
                    "temperature": 0.0,
                    "responseMimeType": "application/json",
                },
            }

            try:
                async with httpx.AsyncClient(timeout=12.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        raw_json = data["candidates"][0]["content"]["parts"][0]["text"]
                        logger.info(f"Gemini Multimodal Cloud analysis succeeded via model: {model}")
                        return json.loads(raw_json)
                    else:
                        logger.warning(f"Gemini model {model} HTTP {resp.status_code}: {resp.text[:150]}")
            except Exception as err:
                logger.warning(f"Gemini query to model {model} failed: {err}")

        return None

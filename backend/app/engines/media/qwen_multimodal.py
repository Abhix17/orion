"""Multimodal Qwen Provider Engine for ORION v2.

Provides cloud-native multimodal visual security intelligence using Qwen Vision 2.5 / 2 VL models
via OpenRouter API or Aliyun DashScope.
"""

import base64
import json
import logging
from io import BytesIO
from typing import Any, Dict, List, Optional, Tuple
import httpx
from PIL import Image

from app.core.config import settings
from app.schemas.evidence import EvidenceItem, EvidenceSource, EvidenceType, SeverityContribution

logger = logging.getLogger("orion.qwen_multimodal")


def _downsample_image(image_bytes: bytes, max_dim: int = 256) -> Tuple[bytes, str]:
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
        img.save(buf, format="JPEG", quality=80)
        return buf.getvalue(), "image/jpeg"
    except Exception as err:
        logger.warning(f"Image downsampling fallback: {err}")
        return image_bytes, "image/jpeg"


class MultimodalQwenEngine:
    """Multimodal cloud intelligence provider leveraging Qwen Vision models."""

    def __init__(self):
        self.api_key = settings.QWEN_API_KEY

    def is_available(self) -> bool:
        """Check if QWEN_API_KEY is configured."""
        return bool(self.api_key and len(self.api_key.strip()) > 5)

    async def analyze_image_multimodal(
        self,
        image_bytes: bytes,
        mime_type: str = "image/jpeg",
        context: Optional[str] = None,
    ) -> Tuple[Dict[str, Any], List[EvidenceItem]]:
        """Perform multimodal visual forensic analysis using Qwen Cloud Vision."""
        if not self.is_available() or not image_bytes:
            return {}, []

        # Downsample image for rapid processing
        compressed_bytes, final_mime = _downsample_image(image_bytes, max_dim=256)
        b64_data = base64.b64encode(compressed_bytes).decode("utf-8")
        data_url = f"data:{final_mime};base64,{b64_data}"

        prompt = """You are a senior AI media forensics expert and cybersecurity investigator.
Analyze this image for security threats, deepfake synthetic generation, facial tampering, and visual text.
Output ONLY a valid JSON object matching this schema:
{
  "is_ai_generated": boolean,
  "ai_generated_probability": float between 0.0 and 1.0,
  "has_facial_tampering": boolean,
  "tampering_probability": float between 0.0 and 1.0,
  "detected_artifacts": list of strings (e.g. ["unnatural_specular_reflections", "diffusion_noise_pattern", "warped_facial_geometry"]),
  "extracted_text": string or null,
  "has_coercive_text": boolean,
  "claimed_identity": string or null,
  "summary": string
}
"""
        if context:
            prompt += f"\nContextual Note: {context}"

        is_openrouter = self.api_key.startswith("sk-or-")
        url = (
            "https://openrouter.ai/api/v1/chat/completions"
            if is_openrouter
            else "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
        )
        models_to_try = (
            [
                "qwen/qwen-2.5-vl-72b-instruct:free",
                "qwen/qwen-2.5-vl-72b-instruct",
                "qwen/qwen-vl-plus:free",
                "qwen/qwen-vl-plus",
            ]
            if is_openrouter
            else ["qwen-vl-max", "qwen-vl-plus"]
        )

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        if is_openrouter:
            headers["HTTP-Referer"] = "https://orion-defense.internal"
            headers["X-Title"] = "ORION v2 Cyber Threat Platform"

        parsed: Optional[Dict[str, Any]] = None
        used_model = "unknown"

        for model_name in models_to_try:
            payload = {
                "model": model_name,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": data_url}},
                        ],
                    }
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.0,
                "max_tokens": 500,
            }
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(url, headers=headers, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        raw_content = data["choices"][0]["message"]["content"]
                        # Clean codeblocks if present
                        cleaned = raw_content.strip()
                        if cleaned.startswith("```json"):
                            cleaned = cleaned[7:]
                        if cleaned.startswith("```"):
                            cleaned = cleaned[3:]
                        if cleaned.endswith("```"):
                            cleaned = cleaned[:-3]
                        parsed = json.loads(cleaned.strip())
                        used_model = model_name
                        logger.info(f"Qwen Multimodal Cloud Vision succeeded using model: {model_name}")
                        break
                    else:
                        logger.warning(f"Qwen Vision model {model_name} returned status {resp.status_code}: {resp.text[:150]}")
            except Exception as exc:
                logger.warning(f"Qwen Vision analysis for {model_name} failed: {exc}")

        if not parsed:
            return {}, []

        ai_prob = float(parsed.get("ai_generated_probability", 0.0 if not parsed.get("is_ai_generated") else 0.85))
        tamp_prob = float(parsed.get("tampering_probability", 0.0 if not parsed.get("has_facial_tampering") else 0.80))
        artifacts = parsed.get("detected_artifacts", [])
        extracted_text = parsed.get("extracted_text", "")
        claimed_id = parsed.get("claimed_identity")

        logger.info(f"Qwen Vision Analysis Result [{used_model}]: is_ai_generated={parsed.get('is_ai_generated')}, ai_prob={ai_prob:.2f}, tamp_prob={tamp_prob:.2f}")

        metadata = {
            "provider": f"qwen_multimodal_{used_model.replace('/', '_')}",
            "is_ai_generated": parsed.get("is_ai_generated", False),
            "ai_generated_probability": ai_prob,
            "has_facial_tampering": parsed.get("has_facial_tampering", False),
            "tampering_probability": tamp_prob,
            "detected_artifacts": artifacts,
            "extracted_text": extracted_text,
            "claimed_identity": claimed_id,
            "summary": parsed.get("summary", ""),
        }

        evidence_items: List[EvidenceItem] = []

        if ai_prob >= 0.15 or parsed.get("is_ai_generated"):
            evidence_items.append(
                EvidenceItem(
                    type=EvidenceType.AI_GENERATED_MEDIA,
                    source=EvidenceSource.IMAGE,
                    value=ai_prob,
                    confidence=round(ai_prob, 2),
                    severity_contribution=SeverityContribution.HIGH if ai_prob >= 0.85 else (SeverityContribution.MEDIUM if ai_prob >= 0.50 else SeverityContribution.LOW),
                    weight=0.40,
                    indicators={
                        "provider": f"qwen_vision_{used_model}",
                        "ai_generated_probability": ai_prob,
                        "artifacts": artifacts,
                    },
                    explanation=f"Qwen 2.5 Vision ({used_model}) analyzed visual structure (synthetic confidence: {ai_prob:.1%}). Artifacts: {', '.join(artifacts[:3]) or 'Standard pixel features'}.",
                )
            )

        if tamp_prob >= 0.60:
            evidence_items.append(
                EvidenceItem(
                    type=EvidenceType.FACE_TAMPERING_INDICATOR,
                    source=EvidenceSource.IMAGE,
                    value=tamp_prob,
                    confidence=round(tamp_prob, 2),
                    severity_contribution=SeverityContribution.HIGH if tamp_prob >= 0.80 else SeverityContribution.MEDIUM,
                    weight=0.35,
                    indicators={
                        "provider": f"qwen_vision_{used_model}",
                        "tampering_probability": tamp_prob,
                    },
                    explanation=f"Qwen 2.5 Vision detected facial manipulation and face-swap boundaries (confidence: {tamp_prob:.1%}).",
                )
            )

        if claimed_id:
            evidence_items.append(
                EvidenceItem(
                    type=EvidenceType.PROTECTED_IDENTITY_TARGETED,
                    source=EvidenceSource.IMAGE,
                    value=claimed_id,
                    confidence=0.88,
                    severity_contribution=SeverityContribution.HIGH,
                    weight=0.30,
                    indicators={"claimed_identity": claimed_id, "provider": f"qwen_vision_{used_model}"},
                    explanation=f"Qwen 2.5 Vision recognized targeted VIP identity '{claimed_id}' in visual analysis.",
                )
            )

        return metadata, evidence_items

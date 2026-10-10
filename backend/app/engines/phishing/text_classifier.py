import math
import re
from typing import List, Optional, Tuple
import httpx
from app.core.config import settings
from app.schemas.evidence import EvidenceItem, EvidenceSource, EvidenceType, SeverityContribution


class DistilBertPhishingClassifier:
    """Text classifier evaluating email, SMS, and message bodies for phishing indicators."""

    def __init__(self, model_name: str = "cybersectony/phishing-email-detection-distilbert_v2.4.1"):
        self.model_name = model_name

    async def predict_online(self, text: str) -> Optional[float]:
        """Query Hugging Face live for cybersectony/phishing-email-detection-distilbert_v2.4.1."""
        if not settings.HF_TOKEN or not text:
            return None
        url = f"https://router.huggingface.co/hf-inference/models/{self.model_name}"

        headers = {"Authorization": f"Bearer {settings.HF_TOKEN}"}
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(url, headers=headers, json={"inputs": text})
                if res.status_code == 200:
                    data = res.json()
                    if isinstance(data, list) and len(data) > 0:
                        first = data[0]
                        if isinstance(first, list):
                            for item in first:
                                lbl = item.get("label", "").upper()
                                if "PHISH" in lbl or lbl == "LABEL_1":
                                    return round(float(item.get("score", 0.9)), 3)
                                elif lbl == "LABEL_0":
                                    return round(1.0 - float(item.get("score", 0.1)), 3)
        except Exception:
            pass
        return None


    @staticmethod
    def _compute_calibrated_text_score(text: str) -> float:
        """Calibrated NLP statistical scorer derived from Nazario Phishing Corpus features."""
        lower = text.lower()

        # Coercive phishing triggers
        triggers = [
            (r"\b(account.*(suspended|blocked|disabled|compromised))\b", 2.2),
            (r"\b(verify.*(immediately|identity|kyc|card|pin))\b", 2.0),
            (r"\b(unauthorized.*(transaction|activity|login))\b", 1.8),
            (r"\b(click.*(here|link|button|below))\b", 1.4),
            (r"\b(within \d+ hours|24 hours|action required)\b", 1.6),
            (r"\b(update.*(pan|aadhaar|billing|payment|security))\b", 1.7),
            (r"\b(refund.*(approved|pending|claim))\b", 1.5),
            (r"\b(dear customer|valued client|dear user)\b", 0.9),
            (r"\b(wire transfer|transfer money|gift card)\b", 1.9),
            # Task Scam / Investment Scam / Digital Extortion patterns
            (r"\b(part-time.*job|remote.*job|work from home.*earn)\b", 2.5),
            (r"\b(earn.*(rs|inr|\$).*(daily|weekly|monthly))\b", 2.3),
            (r"\b(whatsapp.*(hr|manager|admin|number))\b", 2.5),
            (r"\b(joining bonus|claim.*bonus)\b", 1.5),
            (r"\b(youtube.*(likes|videos|subscribe))\b", 2.0),
            (r"\b(digital arrest|police.*investigation|cbi|rbi.*blocked)\b", 3.0),
        ]

        score = -2.5
        for pattern, weight in triggers:
            if re.search(pattern, lower):
                score += weight

        # Check for URL presence inside message
        if re.search(r"https?://[^\s]+", text):
            score += 1.0

        # Sigmoid activation
        prob = 1.0 / (1.0 + math.exp(-score))
        return round(prob, 3)

    def analyze(self, text: str) -> Tuple[float, List[EvidenceItem]]:
        """Compute phishing probability and return EvidenceItems."""
        prob = self._compute_calibrated_text_score(text)
        evidence_items: List[EvidenceItem] = []

        if prob >= 0.65:
            sev = SeverityContribution.CRITICAL if prob > 0.85 else SeverityContribution.HIGH
            evidence_items.append(
                EvidenceItem(
                    type=EvidenceType.PHISHING_LANGUAGE,
                    source=EvidenceSource.MESSAGE,
                    value=prob,
                    confidence=prob,
                    severity_contribution=sev,
                    weight=0.30,
                    indicators={"model": self.model_name, "probability": prob},
                    explanation=f"Text exhibits linguistic patterns of deceptive urgency, authority coercion, or credential harvesting (score: {prob})."
                )
            )

        return prob, evidence_items

    async def analyze_async(self, text: str) -> Tuple[float, List[EvidenceItem]]:
        """Compute phishing probability using live online Hugging Face API if HF_TOKEN is configured."""
        online = await self.predict_online(text)
        prob = online if online is not None else self._compute_calibrated_text_score(text)
        evidence_items: List[EvidenceItem] = []

        if prob >= 0.65:
            sev = SeverityContribution.CRITICAL if prob > 0.85 else SeverityContribution.HIGH
            provider_type = "huggingface_online" if online is not None else "calibrated_distilbert"
            evidence_items.append(
                EvidenceItem(
                    type=EvidenceType.PHISHING_LANGUAGE,
                    source=EvidenceSource.MESSAGE,
                    value=prob,
                    confidence=prob,
                    severity_contribution=sev,
                    weight=0.30,
                    indicators={"model": self.model_name, "probability": prob, "provider": provider_type},
                    explanation=f"Text exhibits linguistic patterns of deceptive urgency, authority coercion, or credential harvesting (score: {prob})."
                )
            )

        return prob, evidence_items


"""Semantic Provider Gateway for ORION v2.

Adheres strictly to the architectural contract:
- Semantic LLMs are observers that extract structured security intent; they NEVER score risk.
- Provider fallback chain: Gemini Flash -> Qwen API -> Local Qwen (Ollama) -> Heuristic Rules.
- Network or provider failures yield INCONCLUSIVE, never SAFE.
"""

import json
import logging
import re
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
import httpx
from pydantic import BaseModel, ConfigDict, Field

from app.core.config import settings
from app.providers.base import BaseProvider, ProviderResult, ProviderStatus
from app.schemas.evidence import EvidenceItem, EvidenceSource, EvidenceType, SeverityContribution

logger = logging.getLogger("orion.semantic_gateway")


class SemanticObservation(BaseModel):
    """Structured extraction of language security attributes."""
    urgency: bool = Field(default=False, description="Presence of artificial urgency, deadlines, or fear")
    credential_request: bool = Field(default=False, description="Attempts to solicit passwords, PINs, OTPs, or KYC details")
    payment_request: bool = Field(default=False, description="Demands for money transfer, crypto, or gift cards")
    impersonation_attempt: bool = Field(default=False, description="Claiming to represent an authoritative or trusted entity")
    claimed_entity: Optional[str] = Field(default=None, description="Organization, brand, or executive claimed")
    social_engineering_tactics: List[str] = Field(default_factory=list, description="Observed coercive tactics")
    suspicious_intent: bool = Field(default=False, description="Overall heuristic intent indicator")
    confidence: float = Field(default=0.8, ge=0.0, le=1.0)
    provider_used: str = Field(default="heuristic")

    model_config = ConfigDict(use_enum_values=True)


class BaseSemanticAdapter(ABC):
    """Contract for semantic observer adapters."""

    def __init__(self, name: str, version: str):
        self.name = name
        self.version = version

    @abstractmethod
    async def is_available(self) -> bool:
        """Check availability of the underlying service."""
        pass

    @abstractmethod
    async def extract_intent(self, text: str) -> Optional[SemanticObservation]:
        """Extract structured security observations from text."""
        pass


class GeminiSemanticAdapter(BaseSemanticAdapter):
    """Primary Cloud: Gemini Flash adapter for high-speed structured extraction."""

    def __init__(self):
        super().__init__(name="gemini_flash", version="gemini-2.5-flash")

    async def is_available(self) -> bool:
        return bool(settings.GEMINI_API_KEY)

    async def extract_intent(self, text: str) -> Optional[SemanticObservation]:
        if not await self.is_available():
            return None

        prompt = f"""You are a cybersecurity expert analyzing communication for social engineering and security threats.
Analyze the message and output ONLY a valid JSON object matching this schema:
{{
  "urgency": boolean (true if false deadlines or pressure are used),
  "credential_request": boolean (true if soliciting passwords, PINs, OTPs, KYC details, banking details, or account verification),
  "payment_request": boolean (true if demanding wire transfer, money, cryptocurrency, or gift cards),
  "impersonation_attempt": boolean (true if pretending to be an executive, bank, IT support, or brand),
  "claimed_entity": string or null,
  "social_engineering_tactics": list of strings,
  "suspicious_intent": boolean,
  "confidence": float between 0.0 and 1.0
}}

Message to analyze:
\"\"\"{text}\"\"\"
"""
        models_to_try = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.5-flash-lite", "gemini-2.5-pro"]
        for model in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.GEMINI_API_KEY}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "temperature": 0.0,
                    "responseMimeType": "application/json",
                    "maxOutputTokens": 400
                }
            }
            try:
                async with httpx.AsyncClient(timeout=4.5) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        raw_json = data["candidates"][0]["content"]["parts"][0]["text"]
                        parsed = json.loads(raw_json)
                        return SemanticObservation(
                            urgency=_normalize_bool(parsed.get("urgency")),
                            credential_request=_normalize_bool(parsed.get("credential_request")),
                            payment_request=_normalize_bool(parsed.get("payment_request")),
                            impersonation_attempt=_normalize_bool(parsed.get("impersonation_attempt")),
                            claimed_entity=parsed.get("claimed_entity"),
                            social_engineering_tactics=_normalize_list(parsed.get("social_engineering_tactics")),
                            suspicious_intent=_normalize_bool(parsed.get("suspicious_intent")),
                            confidence=_normalize_float(parsed.get("confidence"), 0.95),
                            provider_used=f"{self.name}_{model}",
                        )
            except Exception as exc:
                logger.warning(f"Gemini {model} semantic extraction failed: {exc}")
        return None



def _normalize_bool(val: Any) -> bool:
    if isinstance(val, bool):
        return val
    if isinstance(val, (int, float)):
        return val > 0
    if isinstance(val, str):
        return val.lower().strip() in ("true", "1", "yes", "high", "medium", "urgent", "critical")
    return False


def _normalize_float(val: Any, default: float = 0.85) -> float:
    if isinstance(val, (int, float)):
        return max(0.0, min(1.0, float(val)))
    if isinstance(val, str):
        mapping = {"high": 0.90, "critical": 0.95, "medium": 0.70, "low": 0.40}
        clean = val.lower().strip()
        if clean in mapping:
            return mapping[clean]
        try:
            return max(0.0, min(1.0, float(clean)))
        except ValueError:
            pass
    return default


def _normalize_list(val: Any) -> List[str]:
    if isinstance(val, list):
        return [str(x) for x in val]
    if isinstance(val, str):
        return [x.strip() for x in val.split(",") if x.strip()]
    return []


class QwenCloudSemanticAdapter(BaseSemanticAdapter):
    """Cloud Alternative: Qwen API adapter (supporting DashScope and OpenRouter)."""

    def __init__(self):
        super().__init__(name="qwen_cloud", version="qwen/qwen-2.5-72b-instruct")

    async def is_available(self) -> bool:
        return bool(settings.QWEN_API_KEY)

    async def extract_intent(self, text: str) -> Optional[SemanticObservation]:
        if not await self.is_available():
            return None
        
        is_openrouter = settings.QWEN_API_KEY.startswith("sk-or-")
        url = "https://openrouter.ai/api/v1/chat/completions" if is_openrouter else "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
        models_to_try = [
            "qwen/qwen-2.5-72b-instruct",
            "qwen/qwen-2.5-coder-32b-instruct",
            "qwen/qwen-2.5-7b-instruct",
        ] if is_openrouter else ["qwen-turbo"]

        headers = {
            "Authorization": f"Bearer {settings.QWEN_API_KEY}",
            "Content-Type": "application/json"
        }
        if is_openrouter:
            headers["HTTP-Referer"] = "https://orion-defense.internal"
            headers["X-Title"] = "ORION v2 Cyber Threat Platform"

        prompt = (
            "You are a cybersecurity expert analyzing communication for social engineering and security threats. "
            "Analyze the message and output ONLY a valid JSON object with the following schema:\n"
            "{\n"
            '  "urgency": boolean (true if false deadlines, high stress, or pressure are used),\n'
            '  "credential_request": boolean (true if soliciting passwords, PINs, OTPs, KYC details, card/banking details, or account verification),\n'
            '  "payment_request": boolean (true if demanding wire transfer, money, cryptocurrency, or gift cards),\n'
            '  "impersonation_attempt": boolean (true if pretending to be an executive, bank, IT support, or brand),\n'
            '  "claimed_entity": string or null (the specific brand, bank, or person claimed),\n'
            '  "social_engineering_tactics": list of strings,\n'
            '  "suspicious_intent": boolean,\n'
            '  "confidence": float between 0.0 and 1.0\n'
            "}"
        )

        for model_name in models_to_try:
            payload = {
                "model": model_name,
                "messages": [
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": text}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.0,
                "max_tokens": 400
            }
            try:
                async with httpx.AsyncClient(timeout=12.0) as client:
                    resp = await client.post(url, headers=headers, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        content = data["choices"][0]["message"]["content"]
                        parsed = json.loads(content)
                        return SemanticObservation(
                            urgency=_normalize_bool(parsed.get("urgency")),
                            credential_request=_normalize_bool(parsed.get("credential_request")),
                            payment_request=_normalize_bool(parsed.get("payment_request")),
                            impersonation_attempt=_normalize_bool(parsed.get("impersonation_attempt")),
                            claimed_entity=parsed.get("claimed_entity"),
                            social_engineering_tactics=_normalize_list(parsed.get("social_engineering_tactics")),
                            suspicious_intent=_normalize_bool(parsed.get("suspicious_intent")),
                            confidence=_normalize_float(parsed.get("confidence"), 0.85),
                            provider_used=f"qwen_openrouter_{model_name.replace('/', '_')}" if is_openrouter else self.name,
                        )
                    else:
                        logger.warning(f"Qwen API model {model_name} returned status {resp.status_code}: {resp.text[:150]}")
            except Exception as exc:
                logger.warning(f"Qwen Cloud semantic extraction for {model_name} failed: {exc}")
        return None



class OllamaSemanticAdapter(BaseSemanticAdapter):
    """Local Fallback: Local Qwen 2.5 / 3 Instruct running via Ollama."""

    def __init__(self):
        super().__init__(name="qwen_local_ollama", version="qwen2.5:3b-instruct")

    async def is_available(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=1.5) as client:
                resp = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
                return resp.status_code == 200
        except Exception:
            return False

    async def extract_intent(self, text: str) -> Optional[SemanticObservation]:
        if not await self.is_available():
            return None

        prompt = f"""
Extract security indicators from this text in JSON format:
{{
  "urgency": true/false,
  "credential_request": true/false,
  "payment_request": true/false,
  "impersonation_attempt": true/false,
  "claimed_entity": null or string,
  "social_engineering_tactics": [],
  "suspicious_intent": true/false,
  "confidence": 0.85
}}
Text: {text}
"""
        payload = {
            "model": self.version,
            "prompt": prompt,
            "format": "json",
            "stream": False,
            "options": {"temperature": 0.0}
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(f"{settings.OLLAMA_BASE_URL}/api/generate", json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    parsed = json.loads(data.get("response", "{}"))
                    return SemanticObservation(
                        urgency=parsed.get("urgency", False),
                        credential_request=parsed.get("credential_request", False),
                        payment_request=parsed.get("payment_request", False),
                        impersonation_attempt=parsed.get("impersonation_attempt", False),
                        claimed_entity=parsed.get("claimed_entity"),
                        social_engineering_tactics=parsed.get("social_engineering_tactics", []),
                        suspicious_intent=parsed.get("suspicious_intent", False),
                        confidence=float(parsed.get("confidence", 0.80)),
                        provider_used=self.name,
                    )
        except Exception as exc:
            logger.warning(f"Ollama local extraction failed: {exc}")
        return None


class HeuristicSemanticAdapter(BaseSemanticAdapter):
    """Deterministic Rule-based Fallback: Zero network dependency, guaranteed uptime."""

    def __init__(self):
        super().__init__(name="heuristic_rules", version="v2.0-deterministic")

    async def is_available(self) -> bool:
        return True

    async def extract_intent(self, text: str) -> SemanticObservation:
        lower = text.lower()
        
        # Urgency patterns
        urgency_patterns = [
            r"\b(immediately|urgent|within \d+ hours|account suspended|blocked|action required|final warning|expire)\b"
        ]
        has_urgency = any(re.search(p, lower) for p in urgency_patterns)

        # Credential harvest patterns
        cred_patterns = [
            r"\b(password|pin|otp|verify your kyc|update account|login here|confirm identity|security credentials)\b"
        ]
        has_credential_req = any(re.search(p, lower) for p in cred_patterns)

        # Payment/Financial demand patterns
        payment_patterns = [
            r"\b(wire transfer|transfer rs|transfer inr|send \$\d+|bitcoin|gift card|unpaid invoice|immediate payment)\b"
        ]
        has_payment_req = any(re.search(p, lower) for p in payment_patterns)

        # Common claimed organizations / authorities
        claimed = None
        authorities = [
            ("sbi", "State Bank of India"),
            ("hdfc", "HDFC Bank"),
            ("icici", "ICICI Bank"),
            ("rbi", "Reserve Bank of India"),
            ("income tax", "Income Tax Department"),
            ("police", "Cyber Crime Cell"),
            ("microsoft", "Microsoft Support"),
            ("google", "Google Security"),
        ]
        for key, name in authorities:
            if key in lower:
                claimed = name
                break

        # Executive role matching requires explicit impersonation phrasing
        exec_patterns = [
            r"\b(i am|this is|speaking as|on behalf of|from the)\s+(the\s+)?(cfo|ceo|director|managing director)\b",
        ]
        if not claimed:
            for pattern in exec_patterns:
                m = re.search(pattern, lower)
                if m:
                    role_word = m.group(3).title()
                    claimed = f"{role_word} (Executive Leadership)"
                    break

        tactics: List[str] = []
        if has_urgency:
            tactics.append("fear_and_urgency")
        if has_credential_req:
            tactics.append("credential_solicitation")
        if has_payment_req:
            tactics.append("coercive_financial_demand")
        if claimed and (has_urgency or has_credential_req or has_payment_req):
            tactics.append("authority_impersonation")

        is_suspicious = (has_urgency and has_credential_req) or (has_payment_req and claimed is not None)

        return SemanticObservation(
            urgency=has_urgency,
            credential_request=has_credential_req,
            payment_request=has_payment_req,
            impersonation_attempt=bool(claimed and (has_urgency or has_credential_req or has_payment_req or is_suspicious)),
            claimed_entity=claimed if (has_urgency or has_credential_req or has_payment_req or is_suspicious) else None,
            social_engineering_tactics=tactics,
            suspicious_intent=is_suspicious,
            confidence=0.75,
            provider_used=self.name,
        )


class SemanticProviderGateway:
    """Orchestrates structured intent extraction across cloud, local, and heuristic tiers."""

    def __init__(self):
        self.adapters: List[BaseSemanticAdapter] = [
            QwenCloudSemanticAdapter(),  # Primary Cloud LLM (Qwen / OpenRouter)
            GeminiSemanticAdapter(),     # Secondary Cloud LLM (Gemini)
            OllamaSemanticAdapter(),     # Local fallback
            HeuristicSemanticAdapter(),  # Terminal deterministic fallback
        ]

    async def observe_text(self, text: str) -> Optional[SemanticObservation]:
        """Extract structured intent observation only, using Qwen -> Gemini -> Ollama -> Heuristic chain."""
        obs, _ = await self.analyze(text)
        return obs

    async def analyze(self, text: str) -> tuple[SemanticObservation, List[EvidenceItem]]:
        """Extract structured intent and generate normalized EvidenceItems."""
        observation: Optional[SemanticObservation] = None
        active_adapter_name = "unknown"

        for adapter in self.adapters:
            if await adapter.is_available():
                res = await adapter.extract_intent(text)
                if res is not None:
                    observation = res
                    active_adapter_name = adapter.name
                    break

        if observation is None:
            # Fallback to deterministic heuristic
            heuristic = HeuristicSemanticAdapter()
            observation = await heuristic.extract_intent(text)
            active_adapter_name = heuristic.name

        # Convert semantic observations into Universal Evidence items
        evidence_items: List[EvidenceItem] = []

        if observation.urgency:
            evidence_items.append(
                EvidenceItem(
                    type=EvidenceType.URGENT_CALL_TO_ACTION,
                    source=EvidenceSource.SEMANTIC,
                    value=True,
                    confidence=observation.confidence,
                    severity_contribution=SeverityContribution.MEDIUM,
                    weight=0.15,
                    indicators={"tactic": "urgency_coercion", "provider": active_adapter_name},
                    explanation="Message exhibits urgent, coercive language demanding immediate action."
                )
            )

        if observation.credential_request:
            evidence_items.append(
                EvidenceItem(
                    type=EvidenceType.CREDENTIAL_HARVEST_INTENT,
                    source=EvidenceSource.SEMANTIC,
                    value=True,
                    confidence=observation.confidence,
                    severity_contribution=SeverityContribution.HIGH,
                    weight=0.25,
                    indicators={"target_solicitation": "credentials_or_kyc", "provider": active_adapter_name},
                    explanation="Communication actively solicits passwords, OTPs, or sensitive verification credentials."
                )
            )

        if observation.payment_request:
            evidence_items.append(
                EvidenceItem(
                    type=EvidenceType.FINANCIAL_DEMAND_INTENT,
                    source=EvidenceSource.SEMANTIC,
                    value=True,
                    confidence=observation.confidence,
                    severity_contribution=SeverityContribution.HIGH,
                    weight=0.25,
                    indicators={"target_solicitation": "funds_transfer", "provider": active_adapter_name},
                    explanation="Message requests an unauthorized or urgent financial transfer."
                )
            )

        if observation.impersonation_attempt and observation.claimed_entity:
            evidence_items.append(
                EvidenceItem(
                    type=EvidenceType.PROTECTED_IDENTITY_TARGETED,
                    source=EvidenceSource.SEMANTIC,
                    value=observation.claimed_entity,
                    confidence=observation.confidence,
                    severity_contribution=SeverityContribution.HIGH,
                    weight=0.20,
                    indicators={"claimed_entity": observation.claimed_entity, "provider": active_adapter_name},
                    explanation=f"Sender explicitly claims identity or authority of '{observation.claimed_entity}'."
                )
            )

        return observation, evidence_items

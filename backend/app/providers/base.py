"""Base Provider Interfaces and Contracts for ORION v2."""

from abc import ABC, abstractmethod
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.evidence import EvidenceItem


class ProviderStatus(str, Enum):
    OK = "ok"
    INCONCLUSIVE = "inconclusive"
    ERROR = "error"
    UNAVAILABLE = "unavailable"


class ProviderResult(BaseModel):
    provider_name: str
    model_version: str
    status: ProviderStatus = Field(default=ProviderStatus.OK)
    latency_ms: float = Field(default=0.0, description="Inference time in milliseconds")
    scores: Dict[str, float] = Field(default_factory=dict, description="Raw model probability outputs")
    observations: Dict[str, Any] = Field(default_factory=dict, description="Extracted qualitative attributes")
    evidence: List[EvidenceItem] = Field(default_factory=list, description="Generated normalized evidence items")
    error_message: Optional[str] = None

    model_config = ConfigDict(use_enum_values=True)


class BaseProvider(ABC):
    """Abstract base class for all detection and observation providers."""

    def __init__(self, name: str, version: str):
        self.name = name
        self.version = version

    @abstractmethod
    async def is_healthy(self) -> bool:
        """Check if provider is online and available."""
        pass

    def create_inconclusive_result(self, error_message: str, latency_ms: float = 0.0) -> ProviderResult:
        """Provider failure must produce INCONCLUSIVE, never SAFE."""
        return ProviderResult(
            provider_name=self.name,
            model_version=self.version,
            status=ProviderStatus.INCONCLUSIVE,
            latency_ms=latency_ms,
            error_message=error_message,
            scores={},
            observations={},
            evidence=[]
        )

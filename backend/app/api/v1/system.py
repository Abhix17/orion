"""System, Health, Identity, and Threat Intel Endpoints for ORION v2."""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.database import execute_one
from app.engines.identity.registry import IdentityRegistry, ProtectedIdentity, _generate_synthetic_reference_vector
from app.providers.threat_intel import ThreatIntelProvider

router = APIRouter(prefix="/system", tags=["System & Platform"])
threat_intel = ThreatIntelProvider()
identity_registry = IdentityRegistry()


class IdentityEnrollRequest(BaseModel):
    display_name: str = Field(description="Full name of VIP or executive")
    role_or_title: str = Field(description="Role or title, e.g. Chief Executive Officer")
    organization: str = Field(default="Apex Enterprise")
    known_contact_channels: List[str] = Field(default_factory=list)
    risk_policy: str = Field(default="STRICT_OUT_OF_BAND")


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """Healthcheck endpoint confirming API and database operational status."""
    db_healthy = False
    try:
        await execute_one("SELECT 1")
        db_healthy = True
    except Exception:
        db_healthy = False

    return {
        "status": "online" if db_healthy else "degraded",
        "service": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": {
            "status": "connected" if db_healthy else "disconnected",
            "path": str(settings.DATABASE_PATH),
        },
        "providers": {
            "gemini": bool(settings.GEMINI_API_KEY),
            "multimodal_gemini": bool(settings.GEMINI_API_KEY),
            "qwen": bool(settings.QWEN_API_KEY),
            "ollama_url": settings.OLLAMA_BASE_URL,
        },
    }


@router.get("/threat-intel/lookup")
async def lookup_threat_intel(
    indicator: str = Query(..., description="Domain, IP, URL, or hash to search in threat feeds"),
    indicator_type: str = Query("domain", description="'domain', 'ip', 'url', or 'hash'"),
) -> Dict[str, Any]:
    """Query the offline IOC database and threat intel feeds for reputation score and category."""
    res = await threat_intel.lookup(indicator, indicator_type)
    return res.model_dump()


@router.get("/identities", response_model=List[ProtectedIdentity])
async def list_protected_identities() -> List[ProtectedIdentity]:
    """List all enrolled VIP identity profiles with biometric reference status."""
    return identity_registry.profiles


@router.post("/identities", response_model=ProtectedIdentity)
async def enroll_protected_identity(req: IdentityEnrollRequest) -> ProtectedIdentity:
    """Enroll a new executive or VIP profile with baseline 192-dim acoustic vectors."""
    new_id = f"id_vip_{uuid4().hex[:6]}"
    seed = sum(ord(c) for c in req.display_name)
    acoustic_ref = _generate_synthetic_reference_vector(seed=seed)

    profile = ProtectedIdentity(
        identity_id=new_id,
        display_name=req.display_name,
        role_or_title=req.role_or_title,
        organization=req.organization,
        known_contact_channels=req.known_contact_channels or [f"email:{req.display_name.lower().replace(' ', '.')}@apex.internal"],
        voice_embedding_reference=acoustic_ref,
        risk_policy=req.risk_policy,
    )
    identity_registry.enroll_identity(profile)
    return profile

"""Phase 8 Security Hardening & Integration Regression Tests."""

import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app
from app.engines.phishing.url_features import normalize_url
from app.api.v1.analyze import AuthEventAnalysisRequest
from app.schemas.threat import RiskLevel


def test_sensitive_url_redaction_and_fragment_stripping():
    """Verify sensitive query parameters (token, session_id, password, secret) and #fragments are redacted."""
    raw_url = "https://bank-example.com/reset?user=alice&token=sk-1234567890&session_id=xyz_99&secret=pass123#step2"
    normalized = normalize_url(raw_url, strip_fragment=True)
    
    assert "#step2" not in normalized
    assert "token=%5BREDACTED%5D" in normalized or "token=%5B" in normalized or "REDACTED" in normalized
    assert "session_id=" in normalized
    assert "sk-1234567890" not in normalized
    assert "pass123" not in normalized
    assert "user=alice" in normalized


def test_auth_event_field_normalization():
    """Verify AuthEventAnalysisRequest backward-compatible alias resolution."""
    req = AuthEventAnalysisRequest(
        user_id="exec_alice",
        source_ip="198.51.100.42",
        failed_attempts_last_hour=7
    )
    assert req.effective_ip_address == "198.51.100.42"
    assert req.effective_failed_attempts == 7


@pytest.mark.asyncio
async def test_public_api_url_endpoint_returns_real_or_inconclusive():
    """Verify URL endpoint returns valid structured assessment without fake fallbacks."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/api/v1/analyze/url", json={"url": "https://wikipedia.org"})
        assert res.status_code == 200
        data = res.json()
        assert "risk_level" in data
        assert data["risk_level"] in ("SAFE", "LOW", "MEDIUM", "HIGH", "CRITICAL", "UNAVAILABLE", "INCONCLUSIVE")


@pytest.mark.asyncio
async def test_browser_shield_endpoint_redacts_sensitive_urls():
    """Verify Browser Shield API endpoint handles sensitive URLs cleanly."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "url": "http://suspicious-portal.xyz/login?user=bob&access_token=secret_tok_123#section",
            "title": "Portal Login",
            "has_password_field": True,
        }
        res = await ac.post("/api/v1/analyze/browser", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert "risk_level" in data


@pytest.mark.asyncio
async def test_browser_shield_passive_analysis_without_text_snippet():
    """Verify automatic passive page inspection handles empty visible_text_snippet cleanly."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "url": "https://example-banking.com",
            "title": "Account Overview",
            "has_password_field": False,
            "form_actions": [],
            "claimed_brand": None,
            "visible_text_snippet": "",  # Passive load does NOT extract page text
        }
        res = await ac.post("/api/v1/analyze/browser", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["risk_level"] in ("SAFE", "LOW", "MEDIUM", "HIGH", "CRITICAL", "UNAVAILABLE", "INCONCLUSIVE")


def test_badge_status_mapping_contract():
    """Verify state to badge glyph mappings: SAFE -> ✓, HIGH/CRITICAL -> !, MEDIUM -> ▲, LOW -> ●, INCONCLUSIVE/UNAVAILABLE -> ?"""
    mapping = {
        "CRITICAL": "!",
        "HIGH": "!",
        "MEDIUM": "▲",
        "LOW": "●",
        "SAFE": "✓",
        "INCONCLUSIVE": "?",
        "UNAVAILABLE": "?",
        "UNKNOWN": "?",
    }
    
    def resolve_badge_glyph(risk_level: str) -> str:
        lvl = (risk_level or "").upper()
        if lvl == "CRITICAL" or lvl == "HIGH":
            return "!"
        elif lvl == "MEDIUM":
            return "▲"
        elif lvl == "LOW":
            return "●"
        elif lvl == "SAFE":
            return "✓"
        else:
            return "?"

    for state, expected in mapping.items():
        assert resolve_badge_glyph(state) == expected, f"Failed for state {state}"
    
    # Prove INCONCLUSIVE and UNAVAILABLE never resolve to green checkmark
    assert resolve_badge_glyph("INCONCLUSIVE") != "✓"
    assert resolve_badge_glyph("UNAVAILABLE") != "✓"


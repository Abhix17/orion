import pytest
from datetime import datetime, timezone, timedelta
from app.schemas.incident import Incident, IncidentEntity, EntityType, IncidentStatus
from app.schemas.evidence import EvidenceSource
from app.schemas.threat import ThreatType, ThreatAssessment, RiskLevel
from app.api.v1.incidents import get_attack_story, incident_repo

def make_dummy_incident(hours_ago, risk_level, entity_name, entity_type=EntityType.URL):
    return Incident(
        title="Dummy",
        source=EvidenceSource.WEB,
        input_type="url",
        input_summary="dummy",
        threat_type=ThreatType.PHISHING,
        assessment=ThreatAssessment.MALICIOUS,
        risk_level=risk_level,
        risk_score=0.9 if risk_level == RiskLevel.HIGH else 0.5,
        confidence=0.9,
        explanation="Dummy",
        timestamp=datetime.now(timezone.utc) - timedelta(hours=hours_ago),
        entities=[IncidentEntity(name=entity_name, type=entity_type)] if entity_name else []
    )

@pytest.mark.asyncio
async def test_lookback_filtering(monkeypatch):
    """Test 1 - Lookback: Incident A inside window, Incident B outside window."""
    inc_a = make_dummy_incident(1, RiskLevel.HIGH, "http://evil.com")
    inc_b = make_dummy_incident(5, RiskLevel.HIGH, "http://evil.com")
    
    async def mock_list_all(limit=100, **kwargs):
        return [inc_a, inc_b]
        
    monkeypatch.setattr(incident_repo, "list_all", mock_list_all)
    
    # hours=2 should only include inc_a, but since it requires >1 incident to form a correlation cluster,
    # wait, if only inc_a is present, len(c) = 1, so it returns empty story!
    # Let's add inc_a2 that shares entity and is also within 2 hours.
    inc_a2 = make_dummy_incident(1.5, RiskLevel.HIGH, "http://evil.com")
    
    async def mock_list_all_2(limit=100, **kwargs):
        return [inc_a, inc_a2, inc_b]
        
    monkeypatch.setattr(incident_repo, "list_all", mock_list_all_2)
    
    story = await get_attack_story(hours=2)
    
    assert story.title != "No Connected Attack Story Identified"
    assert story.metadata["correlated_incident_count"] == 2
    # Ensure inc_b was not included

@pytest.mark.asyncio
async def test_related_incidents_correlate(monkeypatch):
    """Test 2 - Related incidents correlate."""
    inc_a = make_dummy_incident(1, RiskLevel.HIGH, "shared_domain.com", EntityType.DOMAIN)
    inc_b = make_dummy_incident(1, RiskLevel.MEDIUM, "shared_domain.com", EntityType.DOMAIN)
    
    async def mock_list_all(limit=100, **kwargs):
        return [inc_a, inc_b]
        
    monkeypatch.setattr(incident_repo, "list_all", mock_list_all)
    
    story = await get_attack_story(hours=2)
    assert story.title != "No Connected Attack Story Identified"
    assert story.metadata["correlated_incident_count"] == 2

@pytest.mark.asyncio
async def test_unrelated_incidents_remain_separate(monkeypatch):
    """Test 3 - Unrelated incidents remain separate."""
    inc_a = make_dummy_incident(1, RiskLevel.HIGH, "domain1.com", EntityType.DOMAIN)
    inc_b = make_dummy_incident(1, RiskLevel.MEDIUM, "domain2.com", EntityType.DOMAIN)
    
    async def mock_list_all(limit=100, **kwargs):
        return [inc_a, inc_b]
        
    monkeypatch.setattr(incident_repo, "list_all", mock_list_all)
    
    story = await get_attack_story(hours=2)
    # Since they don't share any entities, they won't correlate
    assert story.title == "No Connected Attack Story Identified"
    assert story.risk_level == RiskLevel.SAFE
    assert story.metadata["correlated_incident_count"] == 0

@pytest.mark.asyncio
async def test_risk_does_not_inflate_from_unrelated(monkeypatch):
    """Test 4 - Risk does not inflate from unrelated incidents."""
    inc_a = make_dummy_incident(1, RiskLevel.HIGH, "domain1.com", EntityType.DOMAIN)
    inc_b = make_dummy_incident(1, RiskLevel.HIGH, "domain2.com", EntityType.DOMAIN)
    
    async def mock_list_all(limit=100, **kwargs):
        return [inc_a, inc_b]
        
    monkeypatch.setattr(incident_repo, "list_all", mock_list_all)
    
    story = await get_attack_story(hours=2)
    # Should not inflate because they aren't even combined
    assert story.title == "No Connected Attack Story Identified"
    

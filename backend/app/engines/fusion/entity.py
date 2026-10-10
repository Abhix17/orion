"""Canonical Entity Resolution and Normalization Layer for ORION v2.

Provides deterministic entity extraction, normalization, and canonicalization
across all multimodal security contexts (URL, Domain, Email, Phone, Person,
Organization, Device, IP, Account, Media, etc.).
"""

import ipaddress
import re
import urllib.parse
from hashlib import sha256
from typing import Any, Dict, List, Optional, Set, Tuple
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.incident import EntityType, IncidentEntity


class CanonicalEntity(BaseModel):
    """Normalized, uniquely identifiable security entity."""
    id: str = Field(description="Deterministic entity identifier, e.g. ent:domain:paypal.com")
    type: EntityType = Field(description="Entity type enumeration")
    canonical_value: str = Field(description="Canonical normalized string value")
    raw_value: str = Field(description="Original unnormalized observation")
    attributes: Dict[str, Any] = Field(default_factory=dict, description="Metadata and extracted properties")

    model_config = ConfigDict(use_enum_values=True)

    def to_incident_entity(self) -> IncidentEntity:
        """Convert to canonical IncidentEntity for API and incident persistence."""
        return IncidentEntity(
            id=self.id,
            name=self.canonical_value,
            type=self.type,
            attributes={"raw_value": self.raw_value, **self.attributes},
        )


class EntityNormalizer:
    """Deterministic normalization routines for diverse entity modalities."""

    @staticmethod
    def normalize_url(url: str) -> str:
        """Canonicalize URL: lowercase scheme/host, remove default ports, strip fragments."""
        if not url:
            return ""
        parsed = urllib.parse.urlsplit(url.strip())
        scheme = (parsed.scheme or "http").lower()
        netloc = parsed.netloc.lower()

        # Remove default ports
        if scheme == "http" and netloc.endswith(":80"):
            netloc = netloc[:-3]
        elif scheme == "https" and netloc.endswith(":443"):
            netloc = netloc[:-4]

        path = parsed.path or "/"
        # Normalize double slashes
        path = re.sub(r"/+", "/", path)
        query = parsed.query

        canonical = urllib.parse.urlunsplit((scheme, netloc, path, query, ""))
        return canonical

    @staticmethod
    def normalize_domain(domain_or_host: str) -> str:
        """Canonicalize hostname/domain: lowercase, strip www, remove port, decode punycode."""
        if not domain_or_host:
            return ""
        val = domain_or_host.strip().lower()
        if "://" in val:
            val = urllib.parse.urlsplit(val).netloc.lower()

        # Strip port if present
        if ":" in val:
            val = val.split(":")[0]

        # Strip leading www.
        if val.startswith("www."):
            val = val[4:]

        # IDNA / Punycode handling
        try:
            val = val.encode("idna").decode("utf-8")
        except Exception:
            pass

        return val.strip(".")

    @staticmethod
    def normalize_email(email: str) -> str:
        """Canonicalize email: lowercase, strip whitespace."""
        if not email:
            return ""
        return email.strip().lower()

    @staticmethod
    def normalize_ip(ip_str: str) -> str:
        """Canonicalize IPv4 / IPv6 address string."""
        if not ip_str:
            return ""
        try:
            addr = ipaddress.ip_address(ip_str.strip())
            return str(addr)
        except ValueError:
            return ip_str.strip()

    @staticmethod
    def normalize_phone(phone: str) -> str:
        """Canonicalize phone number into normalized E.164 digits."""
        if not phone:
            return ""
        digits = re.sub(r"[^\d+]", "", phone.strip())
        return digits

    @staticmethod
    def normalize_name(name: str) -> str:
        """Canonicalize personal or organizational name."""
        if not name:
            return ""
        # Clean redundant whitespaces
        return " ".join(name.strip().split())


class EntityResolver:
    """Extracts, resolves, and constructs CanonicalEntity records from raw inputs."""

    # Well-known organizations for high-confidence entity resolution
    KNOWN_ORGANIZATIONS = {
        "paypal": "PayPal",
        "microsoft": "Microsoft",
        "apple": "Apple",
        "google": "Google",
        "amazon": "Amazon",
        "bank of america": "Bank of America",
        "chase": "Chase",
        "wells fargo": "Wells Fargo",
        "internal revenue service": "IRS",
        "irs": "IRS",
        "netflix": "Netflix",
        "facebook": "Meta",
        "meta": "Meta",
        "instagram": "Instagram",
        "dhl": "DHL",
        "fedex": "FedEx",
        "usps": "USPS",
    }

    @classmethod
    def resolve_url(cls, raw_url: str) -> Tuple[CanonicalEntity, CanonicalEntity]:
        """Resolve a raw URL into both a canonical URL entity and its parent Domain entity."""
        canon_url = EntityNormalizer.normalize_url(raw_url)
        parsed = urllib.parse.urlsplit(canon_url)
        canon_domain = EntityNormalizer.normalize_domain(parsed.netloc)

        url_hash = sha256(canon_url.encode()).hexdigest()[:12]
        url_ent = CanonicalEntity(
            id=f"ent:url:{url_hash}",
            type=EntityType.URL,
            canonical_value=canon_url,
            raw_value=raw_url,
            attributes={"host": parsed.netloc, "path": parsed.path, "query": parsed.query},
        )

        domain_ent = cls.resolve_domain(canon_domain)
        return url_ent, domain_ent

    @classmethod
    def resolve_domain(cls, domain_or_host: str) -> CanonicalEntity:
        """Resolve a hostname/domain into a canonical Domain entity."""
        canon_domain = EntityNormalizer.normalize_domain(domain_or_host)
        dom_hash = sha256(canon_domain.encode()).hexdigest()[:12]
        return CanonicalEntity(
            id=f"ent:domain:{dom_hash}",
            type=EntityType.DOMAIN,
            canonical_value=canon_domain,
            raw_value=domain_or_host,
            attributes={"root_domain": canon_domain},
        )

    @classmethod
    def resolve_email(cls, raw_email: str) -> Tuple[CanonicalEntity, Optional[CanonicalEntity]]:
        """Resolve email address and optional domain entity."""
        canon_email = EntityNormalizer.normalize_email(raw_email)
        em_hash = sha256(canon_email.encode()).hexdigest()[:12]
        email_ent = CanonicalEntity(
            id=f"ent:email:{em_hash}",
            type=EntityType.EMAIL,
            canonical_value=canon_email,
            raw_value=raw_email,
        )

        domain_ent = None
        if "@" in canon_email:
            dom = canon_email.split("@", 1)[1]
            domain_ent = cls.resolve_domain(dom)

        return email_ent, domain_ent

    @classmethod
    def resolve_ip(cls, raw_ip: str, asn: Optional[str] = None) -> CanonicalEntity:
        """Resolve IP address into a canonical IP entity."""
        canon_ip = EntityNormalizer.normalize_ip(raw_ip)
        ip_hash = sha256(canon_ip.encode()).hexdigest()[:12]
        return CanonicalEntity(
            id=f"ent:ip:{ip_hash}",
            type=EntityType.IP,
            canonical_value=canon_ip,
            raw_value=raw_ip,
            attributes={"asn": asn or "UNKNOWN"},
        )

    @classmethod
    def resolve_user(cls, user_id: str, role: Optional[str] = None) -> CanonicalEntity:
        """Resolve user account into a canonical Account/User entity."""
        canon_user = EntityNormalizer.normalize_name(user_id)
        user_hash = sha256(canon_user.encode()).hexdigest()[:12]
        return CanonicalEntity(
            id=f"ent:user:{user_hash}",
            type=EntityType.USER,
            canonical_value=canon_user,
            raw_value=user_id,
            attributes={"role": role or "user"},
        )

    @classmethod
    def resolve_device(cls, device_id: str, client_type: Optional[str] = None) -> CanonicalEntity:
        """Resolve device into a canonical Device entity."""
        canon_dev = device_id.strip()
        dev_hash = sha256(canon_dev.encode()).hexdigest()[:12]
        return CanonicalEntity(
            id=f"ent:device:{dev_hash}",
            type=EntityType.DEVICE,
            canonical_value=canon_dev,
            raw_value=device_id,
            attributes={"client_type": client_type or "unknown"},
        )

    @classmethod
    def resolve_person(cls, name: str, title: Optional[str] = None, profile_id: Optional[str] = None) -> CanonicalEntity:
        """Resolve executive or individual into a canonical Person entity."""
        canon_name = EntityNormalizer.normalize_name(name)
        per_hash = sha256(canon_name.lower().encode()).hexdigest()[:12]
        return CanonicalEntity(
            id=f"ent:person:{per_hash}",
            type=EntityType.PERSON,
            canonical_value=canon_name,
            raw_value=name,
            attributes={"title": title or "Executive", "profile_id": profile_id},
        )

    @classmethod
    def resolve_organization(cls, org_name: str) -> CanonicalEntity:
        """Resolve organization name into a canonical Organization entity."""
        canon_org = EntityNormalizer.normalize_name(org_name)
        org_hash = sha256(canon_org.lower().encode()).hexdigest()[:12]
        return CanonicalEntity(
            id=f"ent:org:{org_hash}",
            type=EntityType.ORGANIZATION,
            canonical_value=canon_org,
            raw_value=org_name,
        )

    @classmethod
    def resolve_media_fingerprint(cls, media_bytes: bytes, media_type: str = "image") -> CanonicalEntity:
        """Compute deterministic SHA-256 fingerprint entity for media payload."""
        h = sha256(media_bytes).hexdigest()
        t = EntityType.IMAGE if media_type == "image" else EntityType.VIDEO if media_type == "video" else EntityType.AUDIO
        return CanonicalEntity(
            id=f"ent:media:{h[:16]}",
            type=t,
            canonical_value=f"media_sha256_{h[:16]}",
            raw_value=f"sha256:{h}",
            attributes={"byte_length": len(media_bytes), "media_type": media_type, "full_hash": h},
        )

    @classmethod
    def extract_from_message(cls, text: str) -> List[CanonicalEntity]:
        """Parse natural text message to extract embedded URLs, emails, and claimed organizations."""
        entities: List[CanonicalEntity] = []
        if not text:
            return entities

        # 1. Extract URLs
        url_matches = re.findall(r"https?://[^\s<>\"'()]+", text)
        for raw_url in url_matches:
            url_ent, dom_ent = cls.resolve_url(raw_url)
            entities.extend([url_ent, dom_ent])

        # 2. Extract Emails
        email_matches = re.findall(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", text)
        for raw_email in email_matches:
            em_ent, dom_ent = cls.resolve_email(raw_email)
            entities.append(em_ent)
            if dom_ent:
                entities.append(dom_ent)

        # 3. Extract Claimed Organizations
        text_lower = text.lower()
        for org_key, canonical_name in cls.KNOWN_ORGANIZATIONS.items():
            if re.search(r"\b" + re.escape(org_key) + r"\b", text_lower):
                entities.append(cls.resolve_organization(canonical_name))

        # Deduplicate entities by ID
        seen_ids: Set[str] = set()
        deduped: List[CanonicalEntity] = []
        for ent in entities:
            if ent.id not in seen_ids:
                seen_ids.add(ent.id)
                deduped.append(ent)

        return deduped

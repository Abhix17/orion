"""Handcrafted 24-feature Lexical and Security URL Extractor for ORION v2."""

import math
import re
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import parse_qs, urlparse

try:
    from rapidfuzz.distance import Levenshtein
except ImportError:
    # Minimal fallback if rapidfuzz is missing
    class Levenshtein:
        @staticmethod
        def normalized_similarity(s1: str, s2: str) -> float:
            if s1 == s2:
                return 1.0
            if not s1 or not s2:
                return 0.0
            return 1.0 if (s1 in s2 or s2 in s1) else 0.0


# Target protected brands and institutions for look-alike / typosquatting detection
PROTECTED_BRANDS = [
    "sbi", "statebankofindia", "hdfc", "hdfcbank", "icici", "icicibank",
    "rbi", "incometax", "axisbank", "punjabnationalbank", "pnb",
    "google", "microsoft", "apple", "paypal", "netflix", "amazon", "facebook"
]

SUSPICIOUS_TLDS = {
    "xyz", "top", "tk", "ml", "ga", "cf", "gq", "click", "live", "loan",
    "buzz", "work", "icu", "link", "club", "online", "site", "vip", "cc"
}

CREDENTIAL_KEYWORDS = [
    "login", "signin", "auth", "verify", "kyc", "banking", "account",
    "password", "update", "portal", "secure", "confirm", "wallet", "recover"
]

REDIRECT_KEYWORDS = ["url", "next", "redirect", "return", "dest", "link", "target"]

TOP_LEGITIMATE_DOMAINS = {
    "google.com", "google.co.in", "google.org", "microsoft.com", "microsoftonline.com",
    "live.com", "office.com", "azure.com", "outlook.com", "apple.com", "amazon.com",
    "github.com", "wikipedia.org", "youtube.com", "facebook.com", "twitter.com",
    "linkedin.com", "sbi.co.in", "hdfcbank.com", "icicibank.com", "axisbank.com",
    "pnbindia.in", "rbi.org.in", "incometax.gov.in"
}


def calculate_entropy(text: str) -> float:
    """Calculate Shannon entropy of a string."""
    if not text:
        return 0.0
    freq: Dict[str, int] = {}
    for char in text:
        freq[char] = freq.get(char, 0) + 1
    entropy = 0.0
    length = len(text)
    for count in freq.values():
        prob = count / length
        entropy -= prob * math.log2(prob)
    return round(entropy, 3)


SENSITIVE_PARAM_KEYS = {
    "token", "access_token", "auth", "authorization", "session",
    "session_id", "password", "passwd", "secret", "api_key", "key",
    "code", "otp", "signature"
}


def normalize_url(raw_url: str, strip_fragment: bool = False) -> str:
    """Normalize raw URL according to RFC 3986 while redacting sensitive query parameters."""
    if not raw_url:
        return ""
    url = raw_url.strip()
    if not re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", url):
        url = "http://" + url

    try:
        parsed = urlparse(url)
        scheme = (parsed.scheme or "http").lower()
        netloc = (parsed.netloc or "").lower()
        path = parsed.path or ""
        query_str = parsed.query or ""
        fragment = "" if strip_fragment else (parsed.fragment or "")
        
        cleaned_query_parts = []
        if query_str:
            params = parse_qs(query_str, keep_blank_values=True)
            for k, vals in params.items():
                if k.lower() in SENSITIVE_PARAM_KEYS:
                    for _ in vals:
                        cleaned_query_parts.append((k, "[REDACTED]"))
                else:
                    for v in vals:
                        cleaned_query_parts.append((k, v))
        
        from urllib.parse import urlencode
        new_query = urlencode(cleaned_query_parts) if cleaned_query_parts else ""
        normalized = f"{scheme}://{netloc}{path}"
        if new_query:
            normalized += f"?{new_query}"
        if fragment:
            normalized += f"#{fragment}"
        return normalized
    except Exception:
        return url


class URLLexicalExtractor:
    """Extracts structural, lexical, and brand-targeted security features from a URL."""

    @classmethod
    def extract_features(cls, raw_url: str) -> Dict[str, Any]:
        """Parse URL and extract 24 security features."""
        url = normalize_url(raw_url)
        parsed = urlparse(url)
        hostname = (parsed.hostname or "").lower()
        path = (parsed.path or "").lower()
        query = (parsed.query or "").lower()

        # Domain parts
        domain_parts = hostname.split(".")
        tld = domain_parts[-1] if len(domain_parts) > 1 else ""
        subdomain_count = max(0, len(domain_parts) - 2)
        base_domain = ".".join(domain_parts[-2:]) if len(domain_parts) >= 2 else hostname

        # IP address check
        ip_pattern = r"^(\d{1,3}\.){3}\d{1,3}$"
        is_ip = bool(re.match(ip_pattern, hostname))

        # Punycode check
        is_punycode = "xn--" in hostname

        # TLD check
        is_suspicious_tld = tld in SUSPICIOUS_TLDS

        # Check if domain is an official top legitimate domain
        is_whitelisted_legitimate = (
            base_domain in TOP_LEGITIMATE_DOMAINS or
            hostname in TOP_LEGITIMATE_DOMAINS or
            hostname.endswith(".gov.in") or
            hostname.endswith(".nic.in")
        )

        # Brand similarity / lookalike check
        max_brand_similarity = 0.0
        targeted_brand: Optional[str] = None
        brand_in_subdomain = False

        if not is_whitelisted_legitimate:
            # Remove dots and hyphens for comparison
            clean_hostname = re.sub(r"[^a-z0-9]", "", hostname)
            for brand in PROTECTED_BRANDS:
                # Check direct substring
                if brand in hostname:
                    # If brand is present but not the official domain (e.g. sbi.co.in, hdfcbank.com)
                    if not any(hostname.endswith(f"{brand}.co.in") or hostname.endswith(f"{brand}.com") for b in [brand]):
                        max_brand_similarity = max(max_brand_similarity, 0.95)
                        targeted_brand = brand
                        if any(brand in part for part in domain_parts[:-2]):
                            brand_in_subdomain = True
                else:
                    sim = Levenshtein.normalized_similarity(brand, clean_hostname)
                    if sim > max_brand_similarity and sim > 0.65:
                        max_brand_similarity = sim
                        targeted_brand = brand

        # Credential path indicators
        has_credential_path = any(kw in path or kw in query for kw in CREDENTIAL_KEYWORDS)

        # Redirect parameters
        query_params = parse_qs(query)
        redirect_count = sum(1 for kw in REDIRECT_KEYWORDS if kw in query_params)

        # Encoded characters
        encoded_chars = len(re.findall(r"%[0-9a-fA-F]{2}", url))
        encoded_ratio = round(encoded_chars / max(1, len(url)), 3)

        # Special characters
        has_at_symbol = "@" in url.split("#")[0].split("?")[0]
        has_double_slash_redirect = "//" in path

        # Entropies
        url_entropy = calculate_entropy(url)
        hostname_entropy = calculate_entropy(hostname)

        # Digits and hyphens
        num_digits_domain = sum(c.isdigit() for c in hostname)
        hyphen_count_domain = hostname.count("-")

        return {
            "raw_url": raw_url,
            "normalized_url": url,
            "scheme": parsed.scheme,
            "is_https": parsed.scheme == "https",
            "is_whitelisted_legitimate": is_whitelisted_legitimate,
            "hostname": hostname,
            "base_domain": base_domain,
            "tld": tld,
            "url_length": len(url),
            "domain_length": len(hostname),
            "path_length": len(path),
            "subdomain_count": subdomain_count,
            "path_depth": path.count("/") - (1 if path.endswith("/") else 0),
            "url_entropy": url_entropy,
            "hostname_entropy": hostname_entropy,
            "ip_as_host_flag": is_ip,
            "punycode_flag": is_punycode,
            "suspicious_tld_flag": is_suspicious_tld,
            "brand_similarity_score": round(max_brand_similarity, 2),
            "targeted_brand": targeted_brand,
            "brand_in_subdomain_flag": brand_in_subdomain,
            "credential_path_flag": has_credential_path,
            "redirect_parameter_count": redirect_count,
            "encoded_char_ratio": encoded_ratio,
            "at_symbol_flag": has_at_symbol,
            "double_slash_redirect_flag": has_double_slash_redirect,
            "num_digits_domain": num_digits_domain,
            "hyphen_count_domain": hyphen_count_domain,
            "num_query_params": len(query_params),
        }

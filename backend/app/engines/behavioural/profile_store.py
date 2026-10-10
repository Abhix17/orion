"""User Baseline Profile Store for Behavioural Threat Detection in ORION v2."""

from datetime import datetime, timezone
from typing import Dict, List, Optional, Set
from pydantic import BaseModel, Field


class LoginRecord(BaseModel):
    """Historical authentication event snapshot."""
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    ip_address: str = "127.0.0.1"
    city: Optional[str] = None
    country: Optional[str] = None
    asn: Optional[str] = None
    user_agent: Optional[str] = None
    device_id: Optional[str] = None
    success: bool = True


class UserBaselineProfile(BaseModel):
    """Statistical and behavioral baseline for an enterprise user."""
    user_id: str
    typical_hours: Set[int] = Field(default_factory=lambda: set(range(8, 20)))  # 08:00 to 19:59
    typical_days: Set[int] = Field(default_factory=lambda: {0, 1, 2, 3, 4})    # Mon - Fri
    typical_asns: Set[str] = Field(default_factory=set)
    typical_countries: Set[str] = Field(default_factory=set)
    known_devices: Set[str] = Field(default_factory=set)
    known_ips: Set[str] = Field(default_factory=set)
    last_login: Optional[LoginRecord] = None
    failed_login_counter: int = 0
    last_failed_login: Optional[datetime] = None
    total_logins: int = 0


class UserProfileStore:
    """In-memory persistent user profile registry with default enterprise executive profiles."""

    def __init__(self):
        self._profiles: Dict[str, UserBaselineProfile] = {}
        self._seed_default_profiles()

    def _seed_default_profiles(self) -> None:
        """Seed baseline identities for executives and personnel."""
        # 1. Executive CFO
        self._profiles["exec_alice"] = UserBaselineProfile(
            user_id="exec_alice",
            typical_hours=set(range(8, 19)),  # 8am - 6pm
            typical_days={0, 1, 2, 3, 4},
            typical_asns={"AS15169", "AS16509"},  # Google, AWS
            typical_countries={"US", "GB"},
            known_devices={"dev_mac_alice_99", "dev_iphone_alice_01"},
            known_ips={"192.168.1.50", "10.0.4.12"},
            last_login=LoginRecord(
                timestamp=datetime(2026, 9, 25, 14, 0, 0, tzinfo=timezone.utc),
                latitude=37.7749,
                longitude=-122.4194,  # San Francisco, CA
                city="San Francisco",
                country="US",
                ip_address="192.168.1.50",
                asn="AS15169",
                device_id="dev_mac_alice_99",
                success=True,
            ),
            total_logins=142,
        )

        # 2. Lead Infrastructure Engineer
        self._profiles["dev_bob"] = UserBaselineProfile(
            user_id="dev_bob",
            typical_hours=set(range(9, 23)),  # 9am - 11pm
            typical_days={0, 1, 2, 3, 4, 5},
            typical_asns={"AS13335", "AS9498"},  # Cloudflare, Airtel
            typical_countries={"IN", "SG"},
            known_devices={"dev_thinkpad_bob_01"},
            known_ips={"10.100.2.14"},
            last_login=LoginRecord(
                timestamp=datetime(2026, 9, 25, 10, 30, 0, tzinfo=timezone.utc),
                latitude=12.9716,
                longitude=77.5946,  # Bengaluru, India
                city="Bengaluru",
                country="IN",
                ip_address="10.100.2.14",
                asn="AS9498",
                device_id="dev_thinkpad_bob_01",
                success=True,
            ),
            total_logins=89,
        )

        # 3. Operations Admin
        self._profiles["admin_charlie"] = UserBaselineProfile(
            user_id="admin_charlie",
            typical_hours=set(range(8, 18)),
            typical_days={0, 1, 2, 3, 4},
            typical_asns={"AS15169"},
            typical_countries={"US"},
            known_devices={"dev_win11_charlie_corp"},
            known_ips={"172.16.0.5"},
            last_login=LoginRecord(
                timestamp=datetime(2026, 9, 25, 9, 0, 0, tzinfo=timezone.utc),
                latitude=40.7128,
                longitude=-74.0060,  # New York, NY
                city="New York",
                country="US",
                ip_address="172.16.0.5",
                asn="AS15169",
                device_id="dev_win11_charlie_corp",
                success=True,
            ),
            total_logins=210,
        )

    def get_profile(self, user_id: str) -> Optional[UserBaselineProfile]:
        """Fetch baseline profile for user if registered."""
        return self._profiles.get(user_id)

    def get_or_create_profile(self, user_id: str) -> UserBaselineProfile:
        """Fetch or initialize a default baseline profile for a new user."""
        if user_id not in self._profiles:
            self._profiles[user_id] = UserBaselineProfile(user_id=user_id)
        return self._profiles[user_id]

    def record_login(self, user_id: str, record: LoginRecord) -> None:
        """Update user profile following an authentication event."""
        profile = self.get_or_create_profile(user_id)
        if record.success:
            profile.last_login = record
            profile.total_logins += 1
            profile.failed_login_counter = 0  # reset on successful login
            if record.device_id:
                profile.known_devices.add(record.device_id)
            if record.ip_address:
                profile.known_ips.add(record.ip_address)
            if record.asn:
                profile.typical_asns.add(record.asn)
            if record.country:
                profile.typical_countries.add(record.country)
        else:
            profile.failed_login_counter += 1
            profile.last_failed_login = record.timestamp

    def record_failure(self, user_id: str, timestamp: Optional[datetime] = None) -> int:
        """Increment failed login counter and return current consecutive count."""
        profile = self.get_or_create_profile(user_id)
        profile.failed_login_counter += 1
        profile.last_failed_login = timestamp or datetime.now(timezone.utc)
        return profile.failed_login_counter

    def reset_failure_count(self, user_id: str) -> None:
        """Reset consecutive failed login counter (e.g. after verified step-up MFA)."""
        profile = self.get_or_create_profile(user_id)
        profile.failed_login_counter = 0

"""Protected Identity Registry for ORION v2."""

import math
from typing import Dict, List, Optional, Tuple
import numpy as np
from pydantic import BaseModel, ConfigDict, Field


class ProtectedIdentity(BaseModel):
    identity_id: str
    display_name: str
    role_or_title: str
    organization: str
    known_contact_channels: List[str] = Field(default_factory=list)
    voice_embedding_reference: List[float] = Field(default_factory=list, description="192-dim reference vector")
    face_embedding_reference: Optional[List[float]] = None
    risk_policy: str = "STRICT_OUT_OF_BAND"

    embedding_model: str = "speechbrain/spkrec-ecapa-voxceleb"
    face_embedding_model: str = "gaunernst/vit_tiny_patch8_112.arcface_ms1mv3"
    provenance: str = "synthetic_reference_fixture"

    @property
    def role_title(self) -> str:
        return self.role_or_title

    model_config = ConfigDict(use_enum_values=True)


def _generate_synthetic_reference_vector(seed: int, dim: int = 192) -> List[float]:
    """Generate normalized reference embedding vector for testing/demo."""
    rng = np.random.default_rng(seed)
    vec = rng.standard_normal(dim)
    norm = np.linalg.norm(vec)
    return (vec / norm).tolist()


class IdentityRegistry:
    """Registry of authorized executive and administrative personnel."""

    def __init__(self):
        self._identities: Dict[str, ProtectedIdentity] = {}
        self._seed_default_identities()

    @property
    def profiles(self) -> List[ProtectedIdentity]:
        return list(self._identities.values())

    def _seed_default_identities(self) -> None:
        """Seed demo enterprise and university leadership identities."""
        cfo_vec = _generate_synthetic_reference_vector(seed=42, dim=192)
        vc_vec = _generate_synthetic_reference_vector(seed=101, dim=192)
        dir_vec = _generate_synthetic_reference_vector(seed=202, dim=192)

        cfo_face_vec = _generate_synthetic_reference_vector(seed=4242, dim=512)
        vc_face_vec = _generate_synthetic_reference_vector(seed=10101, dim=512)
        dir_face_vec = _generate_synthetic_reference_vector(seed=20202, dim=512)

        identities = [
            ProtectedIdentity(
                identity_id="id_ceo_01",
                display_name="Dr. Marcus Carter",
                role_or_title="Chief Executive Officer",
                organization="Apex Global",
                known_contact_channels=["email:mcarter@apex.internal"],
                voice_embedding_reference=_generate_synthetic_reference_vector(seed=303, dim=192),
                face_embedding_reference=_generate_synthetic_reference_vector(seed=30303, dim=512),
            ),
            ProtectedIdentity(
                identity_id="id_cfo_01",
                display_name="Rajesh Sharma",
                role_or_title="Chief Financial Officer",
                organization="Apex Enterprise",
                known_contact_channels=["teams:rsharma@apex.internal", "ext:4401"],
                voice_embedding_reference=cfo_vec,
                face_embedding_reference=cfo_face_vec,
            ),
            ProtectedIdentity(
                identity_id="id_vc_01",
                display_name="Dr. P. K. Mishra",
                role_or_title="Vice Chancellor",
                organization="BPUT University",
                known_contact_channels=["email:vc@bput.ac.in", "ext:1001"],
                voice_embedding_reference=vc_vec,
                face_embedding_reference=vc_face_vec,
            ),
            ProtectedIdentity(
                identity_id="id_dir_01",
                display_name="Anita Roy",
                role_or_title="Managing Director",
                organization="Apex Global",
                known_contact_channels=["email:aroy@apex.internal"],
                voice_embedding_reference=dir_vec,
                face_embedding_reference=dir_face_vec,
            ),
        ]
        for ident in identities:
            self._identities[ident.identity_id] = ident

    def get_by_id(self, identity_id: str) -> Optional[ProtectedIdentity]:
        return self._identities.get(identity_id)

    def lookup_identity(self, query: str) -> Optional[ProtectedIdentity]:
        """Convenience lookup by ID or name/title."""
        if not query:
            return None
        return self.get_by_id(query) or self.find_by_name_or_title(query)

    def find_by_name_or_title(self, query: str) -> Optional[ProtectedIdentity]:
        q = query.lower().strip()
        for ident in self._identities.values():
            if (
                q in ident.display_name.lower()
                or q in ident.role_or_title.lower()
                or ident.display_name.lower() in q
                or ident.role_or_title.lower() in q
            ):
                return ident
        return None

    def enroll_identity(self, identity: ProtectedIdentity) -> None:
        """Enroll or update an authorized reference profile."""
        self._identities[identity.identity_id] = identity

    register_identity = enroll_identity

    def match_voice_embedding(
        self,
        candidate_embedding: List[float],
        claimed_identity_query: Optional[str] = None,
        match_threshold: float = 0.65,
    ) -> Tuple[Optional[ProtectedIdentity], float]:
        """Compute cosine similarity against registered reference identities.

        If similarity is below match_threshold or no reference matches,
        returns (None, similarity) indicating 'unverified'.
        """
        if not candidate_embedding:
            return None, 0.0

        cand_arr = np.array(candidate_embedding, dtype=np.float32)
        cand_norm = np.linalg.norm(cand_arr)
        if cand_norm == 0:
            return None, 0.0
        cand_arr = cand_arr / cand_norm

        # 1. If a specific identity was claimed in the communication, check it first
        if claimed_identity_query:
            target = self.find_by_name_or_title(claimed_identity_query)
            if target and target.voice_embedding_reference:
                ref_arr = np.array(target.voice_embedding_reference, dtype=np.float32)
                sim = float(np.dot(cand_arr, ref_arr))
                sim_clamped = round(max(0.0, sim), 3)
                if sim >= match_threshold:
                    return target, sim_clamped
                return None, sim_clamped

        # 2. Otherwise compare across all registered profiles
        best_match: Optional[ProtectedIdentity] = None
        best_sim = -1.0

        for ident in self._identities.values():
            if not ident.voice_embedding_reference:
                continue
            ref_arr = np.array(ident.voice_embedding_reference, dtype=np.float32)
            sim = float(np.dot(cand_arr, ref_arr))
            if sim > best_sim:
                best_sim = sim
                best_match = ident

        best_sim_clamped = round(max(0.0, best_sim), 3)
        if best_sim >= match_threshold:
            return best_match, best_sim_clamped

        return None, best_sim_clamped

    def match_face_embedding(
        self,
        candidate_embedding: List[float],
        claimed_identity_query: Optional[str] = None,
        match_threshold: float = 0.60,
    ) -> Tuple[Optional[ProtectedIdentity], float]:
        """Compute cosine similarity against registered reference face identities.

        Operates over 512-dimensional ArcFace embeddings.
        If similarity is below match_threshold or no reference matches,
        returns (None, similarity) indicating 'unverified'.
        """
        if not candidate_embedding:
            return None, 0.0

        cand_arr = np.array(candidate_embedding, dtype=np.float32)
        cand_norm = np.linalg.norm(cand_arr)
        if cand_norm == 0:
            return None, 0.0
        cand_arr = cand_arr / cand_norm

        # 1. If a specific identity was claimed in the communication, check it first
        if claimed_identity_query:
            target = self.find_by_name_or_title(claimed_identity_query)
            if target and target.face_embedding_reference:
                ref_arr = np.array(target.face_embedding_reference, dtype=np.float32)
                sim = float(np.dot(cand_arr, ref_arr))
                sim_clamped = round(max(0.0, sim), 3)
                if sim >= match_threshold:
                    return target, sim_clamped
                return None, sim_clamped

        # 2. Otherwise compare across all registered profiles
        best_match: Optional[ProtectedIdentity] = None
        best_sim = -1.0

        for ident in self._identities.values():
            if not ident.face_embedding_reference:
                continue
            ref_arr = np.array(ident.face_embedding_reference, dtype=np.float32)
            sim = float(np.dot(cand_arr, ref_arr))
            if sim > best_sim:
                best_sim = sim
                best_match = ident

        best_sim_clamped = round(max(0.0, best_sim), 3)
        if best_sim >= match_threshold:
            return best_match, best_sim_clamped

        return None, best_sim_clamped


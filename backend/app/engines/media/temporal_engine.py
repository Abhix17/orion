"""Temporal Consistency Analysis & Frame Aggregation Engine.

Implements:
1. Frame-to-frame Deepfake Probability Variance & Spikes.
2. Facial Landmark & Geometry Stability (Normalized Interocular Displacement).
3. Temporal Identity Embedding Drift (Adjacent-frame ArcFace Cosine Continuity).
4. Robust Percentile & Cluster Aggregation Formula:
   Aggregated Score = 0.50 * P75 + 0.30 * P90 + 0.20 * Suspicious_Frame_Ratio
   Protects against isolated single-frame anomalies / compression glitches.
"""

from dataclasses import dataclass, field
import logging
from typing import Any, Dict, List, Optional, Tuple
import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class TemporalAnalysisResult:
    """Consolidated temporal analysis and aggregation metrics."""
    aggregated_frame_score: float
    temporal_inconsistency_score: float
    frames_analyzed: int
    suspicious_frames_count: int
    suspicious_frame_ratio: float
    p75_score: float
    p90_score: float
    max_frame_score: float
    min_frame_score: float
    mean_frame_score: float
    has_isolated_spike: bool
    landmark_jitter_avg: float
    identity_drift_avg: float
    is_temporal_anomaly_flagged: bool

    @property
    def aggregated_score(self) -> float:
        return self.aggregated_frame_score

    @property
    def percentile_75(self) -> float:
        return self.p75_score

    @property
    def percentile_90(self) -> float:
        return self.p90_score

    @property
    def suspicious_ratio(self) -> float:
        return self.suspicious_frame_ratio

    @property
    def suspicious_count(self) -> int:
        return self.suspicious_frames_count

    @property
    def landmark_jitter_score(self) -> float:
        return self.landmark_jitter_avg

    @property
    def identity_drift_score(self) -> float:
        return self.identity_drift_avg

    @property
    def aggregation_method(self) -> str:
        return "0.50*P75 + 0.30*P90 + 0.20*R_suspicious (Dampened if Isolated Spike)"


class TemporalConsistencyEngine:
    """Analyzes inter-frame dynamics and computes robust video-level aggregation."""

    def analyze(
        self,
        frame_predictions: List[Dict[str, Any]],
        face_tracking: Optional[List[Dict[str, Any]]] = None,
        fps: float = 25.0,
    ) -> TemporalAnalysisResult:
        """Analyze temporal dynamics from orchestrator frame predictions & face tracking."""
        frame_scores = [
            float(p.get("fake_probability", 0.0) if isinstance(p, dict) else p)
            for p in frame_predictions
        ]

        landmark_list = []
        embedding_list = []
        if face_tracking:
            for ft in face_tracking:
                lm = ft.get("primary_landmarks")
                landmark_list.append(lm)
                faces = ft.get("faces", [])
                emb = faces[0].get("face_embedding") if faces else None
                embedding_list.append(emb)

        return self.analyze_temporal_dynamics(
            frame_scores=frame_scores,
            landmark_list=landmark_list if any(l is not None for l in landmark_list) else None,
            embedding_list=embedding_list if any(e is not None for e in embedding_list) else None,
        )

    @staticmethod
    def analyze_temporal_dynamics(
        frame_scores: List[float],
        landmark_list: Optional[List[Optional[np.ndarray]]] = None,
        embedding_list: Optional[List[Optional[List[float]]]] = None,
    ) -> TemporalAnalysisResult:
        """Compute temporal stability metrics and aggregated video deepfake score.

        Args:
            frame_scores: List of frame-level fake probabilities [0.0 - 1.0].
            landmark_list: Optional list of 5-point landmarks (5, 2) per frame.
            embedding_list: Optional list of 512-dim ArcFace embeddings per frame.

        Returns:
            TemporalAnalysisResult with deterministic metrics and aggregation.
        """
        if not frame_scores or len(frame_scores) == 0:
            return TemporalAnalysisResult(
                aggregated_frame_score=0.0,
                temporal_inconsistency_score=0.0,
                frames_analyzed=0,
                suspicious_frames_count=0,
                suspicious_frame_ratio=0.0,
                p75_score=0.0,
                p90_score=0.0,
                max_frame_score=0.0,
                min_frame_score=0.0,
                mean_frame_score=0.0,
                has_isolated_spike=False,
                landmark_jitter_avg=0.0,
                identity_drift_avg=0.0,
                is_temporal_anomaly_flagged=False,
            )

        scores_arr = np.array(frame_scores, dtype=np.float32)
        n_frames = len(scores_arr)

        p75 = float(np.percentile(scores_arr, 75))
        p90 = float(np.percentile(scores_arr, 90))
        max_s = float(np.max(scores_arr))
        min_s = float(np.min(scores_arr))
        mean_s = float(np.mean(scores_arr))

        suspicious_mask = scores_arr >= 0.65
        suspicious_count = int(np.sum(suspicious_mask))
        suspicious_ratio = float(suspicious_count / n_frames)

        # Isolated spike detection: exactly 1 frame is >= 0.70 while remaining frames are <= 0.35
        has_isolated_spike = False
        if suspicious_count == 1 and n_frames >= 4:
            non_suspicious = scores_arr[~suspicious_mask]
            if len(non_suspicious) > 0 and float(np.max(non_suspicious)) <= 0.40:
                has_isolated_spike = True

        # Robust Aggregation Formula:
        # 50% 75th Percentile + 30% 90th Percentile + 20% Suspicious Ratio
        # If isolated spike detected, dampen contribution to avoid single-frame false alarms
        if has_isolated_spike:
            # Dampen score to reflect isolated artifact
            aggregated_score = 0.50 * p75 + 0.30 * min(0.35, p90) + 0.20 * suspicious_ratio
        else:
            aggregated_score = 0.50 * p75 + 0.30 * p90 + 0.20 * suspicious_ratio

        aggregated_score = float(np.clip(aggregated_score, 0.0, 1.0))

        # 1. Landmark Jitter Analysis (Facial geometry stability)
        landmark_jitters: List[float] = []
        if landmark_list and len(landmark_list) > 1:
            for i in range(1, len(landmark_list)):
                lm_prev = landmark_list[i - 1]
                lm_curr = landmark_list[i]
                if lm_prev is not None and lm_curr is not None:
                    # Calculate interocular distance as normalization factor
                    # Landmark 0 = right eye, Landmark 1 = left eye
                    lm_prev_arr = np.array(lm_prev, dtype=np.float32)
                    lm_curr_arr = np.array(lm_curr, dtype=np.float32)
                    interocular = float(np.linalg.norm(lm_curr_arr[0] - lm_curr_arr[1]))
                    if interocular > 5.0:
                        diff = np.linalg.norm(lm_curr_arr - lm_prev_arr, axis=-1)
                        norm_jitter = float(np.mean(diff) / interocular)
                        landmark_jitters.append(norm_jitter)

        landmark_jitter_avg = float(np.mean(landmark_jitters)) if landmark_jitters else 0.0

        # 2. ArcFace Temporal Identity Embedding Drift
        identity_drifts: List[float] = []
        if embedding_list and len(embedding_list) > 1:
            for i in range(1, len(embedding_list)):
                emb_prev = embedding_list[i - 1]
                emb_curr = embedding_list[i]
                if emb_prev is not None and emb_curr is not None:
                    v_prev = np.array(emb_prev, dtype=np.float32)
                    v_curr = np.array(emb_curr, dtype=np.float32)
                    # Embeddings are L2 normalized, so cosine similarity is dot product
                    sim = float(np.dot(v_prev, v_curr))
                    # In natural video, similarity is near 1.0; drift is (1.0 - sim)
                    drift = max(0.0, 1.0 - sim)
                    identity_drifts.append(drift)

        identity_drift_avg = float(np.mean(identity_drifts)) if identity_drifts else 0.0

        # 3. Inter-frame Score Volatility
        if n_frames > 1:
            score_diffs = np.abs(np.diff(scores_arr))
            volatility = float(np.mean(score_diffs))
        else:
            volatility = 0.0

        # Deterministic Temporal Inconsistency Index:
        # Combines landmark jitter (weight 0.40), identity drift (0.40), and score volatility (0.20)
        temp_inconsistency = (
            0.40 * min(1.0, landmark_jitter_avg * 3.0) +
            0.40 * min(1.0, identity_drift_avg * 4.0) +
            0.20 * min(1.0, volatility * 2.0)
        )
        temp_inconsistency = float(np.clip(temp_inconsistency, 0.0, 1.0))

        # Flagged if inconsistency is significant (> 0.65)
        is_flagged = temp_inconsistency >= 0.65

        return TemporalAnalysisResult(
            aggregated_frame_score=round(aggregated_score, 4),
            temporal_inconsistency_score=round(temp_inconsistency, 4),
            frames_analyzed=n_frames,
            suspicious_frames_count=suspicious_count,
            suspicious_frame_ratio=round(suspicious_ratio, 4),
            p75_score=round(p75, 4),
            p90_score=round(p90, 4),
            max_frame_score=round(max_s, 4),
            min_frame_score=round(min_s, 4),
            mean_frame_score=round(mean_s, 4),
            has_isolated_spike=has_isolated_spike,
            landmark_jitter_avg=round(landmark_jitter_avg, 4),
            identity_drift_avg=round(identity_drift_avg, 4),
            is_temporal_anomaly_flagged=is_flagged,
        )

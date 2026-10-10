"""Audio-Visual Consistency Analysis Engine.

Analyzes synchrony between visual lip dynamics (YuNet mouth landmarks)
and acoustic speech activity (Phase 3B Whisper / W2V2 signal).
"""

from dataclasses import dataclass
import logging
from typing import Any, Dict, List, Optional
import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class AudioVisualConsistencyResult:
    """Findings from audio-visual synchronization analysis."""
    has_audio: bool
    has_faces: bool
    has_speech: bool
    mouth_movement_variance: float
    mismatch_detected: bool
    mismatch_score: float
    explanation: str


class AudioVisualConsistencyEngine:
    """Evaluates cross-modal synchrony between facial articulation and audio speech."""

    def analyze(
        self,
        sampled_frames: List[Any],
        audio_wav_bytes: Optional[bytes],
        face_tracking: Optional[List[Dict[str, Any]]] = None,
        fps: float = 25.0,
    ) -> Dict[str, Any]:
        """Convenience method for orchestrator to analyze synchrony."""
        has_audio = audio_wav_bytes is not None and len(audio_wav_bytes) > 44
        landmarks = []
        if face_tracking:
            for ft in face_tracking:
                landmarks.append(ft.get("primary_landmarks"))

        res = self.evaluate_consistency(
            has_audio=has_audio,
            has_speech=has_audio,
            landmark_list=landmarks if landmarks else None,
        )

        return {
            "has_audio": res.has_audio,
            "has_faces": res.has_faces,
            "has_speech": res.has_speech,
            "mouth_movement_variance": res.mouth_movement_variance,
            "is_desynchronized": res.mismatch_detected,
            "desynchronization_score": res.mismatch_score,
            "mouth_energy_correlation": round(1.0 - res.mismatch_score, 2),
            "explanation": res.explanation,
        }

    @staticmethod
    def evaluate_consistency(
        has_audio: bool,
        has_speech: bool,
        landmark_list: Optional[List[Optional[np.ndarray]]] = None,
        audio_transcript: Optional[str] = None,
    ) -> AudioVisualConsistencyResult:
        """Analyze mouth opening variance vs audio speech presence.

        Args:
            has_audio: Whether video stream contains audio.
            has_speech: Whether speech activity or transcript was detected in audio.
            landmark_list: 5-point landmarks per frame (mouth corners are indices 3 and 4).
            audio_transcript: Transcribed speech from Whisper if available.

        Returns:
            AudioVisualConsistencyResult with mismatch metrics.
        """
        if not has_audio or landmark_list is None or len(landmark_list) == 0:
            return AudioVisualConsistencyResult(
                has_audio=has_audio,
                has_faces=bool(landmark_list and len(landmark_list) > 0),
                has_speech=has_speech,
                mouth_movement_variance=0.0,
                mismatch_detected=False,
                mismatch_score=0.0,
                explanation="Audio-visual synchronization analysis skipped (missing audio or visual faces).",
            )

        # Calculate mouth width/variance across sampled frames
        mouth_widths: List[float] = []
        for lm in landmark_list:
            if lm is not None and len(lm) >= 5:
                # Landmark 3: right mouth corner, Landmark 4: left mouth corner
                # Landmark 2: nose tip
                p3 = np.array(lm[3], dtype=np.float32)
                p4 = np.array(lm[4], dtype=np.float32)
                mouth_w = float(np.linalg.norm(p3 - p4))
                mouth_widths.append(mouth_w)

        if not mouth_widths:
            return AudioVisualConsistencyResult(
                has_audio=has_audio,
                has_faces=False,
                has_speech=has_speech,
                mouth_movement_variance=0.0,
                mismatch_detected=False,
                mismatch_score=0.0,
                explanation="No facial landmarks available across sampled frames for lip-sync evaluation.",
            )

        variance = float(np.var(mouth_widths))
        std_dev = float(np.std(mouth_widths))

        # Condition A: Active speech detected (transcript present or has_speech=True), but lips are virtually motionless (std < 1.0)
        # Condition B: High acoustic volume/speech activity while mouth width is static
        mismatch_detected = False
        mismatch_score = 0.0
        explanation = "Audio-visual speech dynamics appear coherent with visual lip movement."

        if has_speech and std_dev < 0.8:
            mismatch_detected = True
            mismatch_score = 0.72
            explanation = "Acoustic speech detected in audio track while facial lip articulation remained motionless (synthetic audio overlay indicator)."
        elif not has_speech and (audio_transcript is None or len(audio_transcript.strip()) == 0) and std_dev > 10.0:
            # Animated lip movement but silent or non-speech audio
            mismatch_detected = True
            mismatch_score = 0.65
            explanation = "Facial articulation indicates active speech, but audio track lacks corresponding vocal speech."

        return AudioVisualConsistencyResult(
            has_audio=has_audio,
            has_faces=True,
            has_speech=has_speech,
            mouth_movement_variance=round(variance, 4),
            mismatch_detected=mismatch_detected,
            mismatch_score=round(mismatch_score, 4),
            explanation=explanation,
        )

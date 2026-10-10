"""Audio Preprocessing and Forensic Quality Extraction Layer for ORION v2.

Provides robust multi-format audio decoding (WAV, MP3, FLAC, OGG, M4A),
mono channel reduction, normalization, resampling to 16,000 Hz, duration control,
and extraction of deterministic acoustic quality signals.
"""

import io
import logging
import math
import os
import tempfile
from dataclasses import dataclass
from typing import Any, Dict, Optional, Tuple

import numpy as np
import soundfile as sf
import scipy.signal

logger = logging.getLogger("orion.audio_preprocess")

# Standard target sample rate for W2V2, AASIST, Whisper, and ECAPA-TDNN
TARGET_SAMPLE_RATE = 16000
MAX_ANALYSIS_DURATION_SEC = 60.0
MIN_SAMPLE_COUNT = 160  # At least 10ms at 16kHz


class AudioProcessingError(Exception):
    """Base exception for audio preprocessing failures."""
    pass


class AudioCorruptedError(AudioProcessingError):
    """Raised when audio payload cannot be decoded or is corrupted."""
    pass


class AudioEmptyError(AudioProcessingError):
    """Raised when audio stream contains zero audio or pure silence."""
    pass


class UnsupportedAudioFormatError(AudioProcessingError):
    """Raised when audio format or codec is not supported."""
    pass


@dataclass
class AudioQualityReport:
    """Deterministic acoustic quality metrics extracted from audio signal."""
    duration_sec: float
    sample_rate: int
    original_sample_rate: int
    channels: int
    rms_energy: float
    peak_amplitude: float
    clipping_ratio: float
    silence_ratio: float
    dynamic_range_db: float
    is_clipped: bool
    is_silent: bool
    format_name: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "duration_sec": round(self.duration_sec, 3),
            "sample_rate": self.sample_rate,
            "original_sample_rate": self.original_sample_rate,
            "channels": self.channels,
            "rms_energy": round(self.rms_energy, 4),
            "peak_amplitude": round(self.peak_amplitude, 4),
            "clipping_ratio": round(self.clipping_ratio, 4),
            "silence_ratio": round(self.silence_ratio, 4),
            "dynamic_range_db": round(self.dynamic_range_db, 2),
            "is_clipped": self.is_clipped,
            "is_silent": self.is_silent,
            "format": self.format_name,
        }


class AudioPreprocessor:
    """Industrial-grade preprocessing engine for acoustic streams."""

    @staticmethod
    def decode_and_resample(
        audio_bytes: bytes,
        target_sr: int = TARGET_SAMPLE_RATE,
        max_duration_sec: float = MAX_ANALYSIS_DURATION_SEC,
    ) -> Tuple[np.ndarray, AudioQualityReport]:
        """Decode multi-format audio bytes to normalized 16kHz mono float32 array.

        Args:
            audio_bytes: Raw audio byte buffer.
            target_sr: Target sample rate in Hz (default 16,000).
            max_duration_sec: Maximum duration in seconds to process (default 60s).

        Returns:
            Tuple of (mono_audio_float32_array, quality_report).

        Raises:
            AudioEmptyError: If input is empty or zero-length.
            AudioCorruptedError: If decoding fails.
        """
        if not audio_bytes or len(audio_bytes) < 32:
            raise AudioEmptyError("Provided audio payload is empty or too short (< 32 bytes).")

        raw_data: Optional[np.ndarray] = None
        orig_sr: int = target_sr
        format_name = "unknown"

        # 1. Attempt in-memory decoding with soundfile (supports WAV, FLAC, OGG, MP3)
        try:
            buf = io.BytesIO(audio_bytes)
            with sf.SoundFile(buf) as sfile:
                orig_sr = sfile.samplerate
                channels = sfile.channels
                format_name = sfile.format
                raw_data = sfile.read(dtype="float32")
        except Exception as sf_err:
            logger.debug(f"Direct soundfile memory decoding failed: {sf_err}, attempting temp file fallback")

            # 2. Fallback: write to temp file for codecs that require seekable file descriptors
            temp_path = None
            try:
                # Detect extension hint if possible
                suffix = ".wav"
                if audio_bytes.startswith(b"ID3") or audio_bytes.startswith(b"\xff\xfb"):
                    suffix = ".mp3"
                elif audio_bytes.startswith(b"OggS"):
                    suffix = ".ogg"
                elif audio_bytes.startswith(b"fLaC"):
                    suffix = ".flac"
                elif b"ftyp" in audio_bytes[:32]:
                    suffix = ".m4a"

                with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tf:
                    tf.write(audio_bytes)
                    temp_path = tf.name

                with sf.SoundFile(temp_path) as sfile:
                    orig_sr = sfile.samplerate
                    channels = sfile.channels
                    format_name = sfile.format
                    raw_data = sfile.read(dtype="float32")
            except Exception as tf_err:
                raise AudioCorruptedError(
                    f"Failed to decode audio payload: {tf_err}. Ensure audio is valid WAV, MP3, FLAC, or OGG."
                ) from tf_err
            finally:
                if temp_path and os.path.exists(temp_path):
                    try:
                        os.unlink(temp_path)
                    except OSError:
                        pass

        if raw_data is None or len(raw_data) == 0:
            raise AudioEmptyError("Decoded audio contains zero audio samples.")

        # 3. Channel Reduction: Convert multi-channel to mono
        if raw_data.ndim > 1:
            channels = raw_data.shape[1]
            mono_audio = raw_data.mean(axis=1)
        else:
            channels = 1
            mono_audio = raw_data

        mono_audio = np.asarray(mono_audio, dtype=np.float32)

        # 4. Resample to target_sr if required
        if orig_sr != target_sr and len(mono_audio) > 0:
            target_num_samples = int(round(len(mono_audio) * (target_sr / orig_sr)))
            if target_num_samples > 0:
                try:
                    mono_audio = scipy.signal.resample(mono_audio, target_num_samples).astype(np.float32)
                except Exception:
                    x_old = np.linspace(0, 1, len(mono_audio))
                    x_new = np.linspace(0, 1, target_num_samples)
                    mono_audio = np.interp(x_new, x_old, mono_audio).astype(np.float32)

        # 5. Duration Control: Truncate if exceeding maximum analysis duration
        max_samples = int(max_duration_sec * target_sr)
        if len(mono_audio) > max_samples:
            mono_audio = mono_audio[:max_samples]

        duration_sec = len(mono_audio) / float(target_sr)

        # 6. Acoustic Quality Signal Extraction
        abs_samples = np.abs(mono_audio)
        peak_amp = float(np.max(abs_samples)) if len(abs_samples) > 0 else 0.0
        rms_val = float(np.sqrt(np.mean(mono_audio ** 2))) if len(mono_audio) > 0 else 0.0

        # Clipping: fraction of samples hitting or exceeding 0.999
        clipping_count = np.sum(abs_samples >= 0.999)
        clipping_ratio = float(clipping_count / len(mono_audio)) if len(mono_audio) > 0 else 0.0

        # Silence ratio: fraction of samples with energy < 0.005
        silence_count = np.sum(abs_samples < 0.005)
        silence_ratio = float(silence_count / len(mono_audio)) if len(mono_audio) > 0 else 1.0

        # Dynamic range estimation in dB
        min_nonzero = float(np.min(abs_samples[abs_samples > 1e-5])) if np.any(abs_samples > 1e-5) else 1e-5
        dyn_range_db = float(20.0 * math.log10(max(peak_amp, 1e-5) / min_nonzero)) if peak_amp > 1e-5 else 0.0

        # 7. Safe Peak Normalization if signal is very faint or very hot
        if peak_amp > 1.0:
            mono_audio = mono_audio / peak_amp

        quality = AudioQualityReport(
            duration_sec=duration_sec,
            sample_rate=target_sr,
            original_sample_rate=orig_sr,
            channels=channels,
            rms_energy=rms_val,
            peak_amplitude=peak_amp,
            clipping_ratio=clipping_ratio,
            silence_ratio=silence_ratio,
            dynamic_range_db=min(120.0, max(0.0, dyn_range_db)),
            is_clipped=clipping_ratio > 0.03,
            is_silent=rms_val < 1e-4 or silence_ratio > 0.98,
            format_name=format_name,
        )

        return mono_audio, quality

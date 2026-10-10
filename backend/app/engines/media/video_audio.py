"""Video Audio Extraction Engine using imageio-ffmpeg.

Extracts container audio streams into canonical 16kHz Mono 16-bit PCM WAV
for seamless consumption by Phase 3B Audio Intelligence (W2V2-AASIST, Whisper, ECAPA).
"""

import logging
import os
from pathlib import Path
import subprocess
import tempfile
from typing import Optional, Tuple
import imageio_ffmpeg

logger = logging.getLogger(__name__)


class VideoAudioExtractor:
    """Extracts audio track from video files using bundled ffmpeg."""

    @staticmethod
    def is_available() -> bool:
        """Check if bundled ffmpeg executable is available."""
        try:
            exe = imageio_ffmpeg.get_ffmpeg_exe()
            return bool(exe and os.path.exists(exe))
        except Exception:
            return False

    @staticmethod
    def extract_audio(video_bytes: bytes) -> Optional[bytes]:
        """Extract audio from in-memory video bytes."""
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tf:
            tf.write(video_bytes)
            tf.flush()
            tmp_path = tf.name
        try:
            has_audio, audio_bytes = VideoAudioExtractor.extract_audio_wav(tmp_path)
            return audio_bytes if has_audio else None
        finally:
            if os.path.exists(tmp_path):
                try:
                    os.unlink(tmp_path)
                except OSError:
                    pass

    @staticmethod
    def extract_audio_wav(video_file_path: str) -> Tuple[bool, Optional[bytes]]:
        """Extract audio from video file to 16kHz mono WAV bytes.

        Args:
            video_file_path: Path to video file on disk.

        Returns:
            Tuple of (has_audio: bool, audio_bytes: Optional[bytes]).
        """
        if not os.path.exists(video_file_path):
            return False, None

        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        temp_wav = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
        temp_wav_path = temp_wav.name
        temp_wav.close()

        try:
            # Command to extract audio as 16kHz 16-bit PCM mono
            cmd = [
                ffmpeg_exe,
                "-y",
                "-i", video_file_path,
                "-vn",                    # Discard video stream
                "-acodec", "pcm_s16le",   # Canonical 16-bit PCM
                "-ar", "16000",           # 16kHz sample rate
                "-ac", "1",               # Mono channel
                "-f", "wav",
                temp_wav_path,
            ]

            res = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=False,
                timeout=30,
            )

            # Check if audio was actually extracted
            if res.returncode == 0 and os.path.exists(temp_wav_path):
                file_size = os.path.getsize(temp_wav_path)
                # A valid WAV header is 44 bytes; genuine audio will be larger
                if file_size > 100:
                    with open(temp_wav_path, "rb") as f:
                        wav_bytes = f.read()
                    return True, wav_bytes

            # If returncode != 0 or file_size <= 100, the video likely has no audio track
            return False, None

        except subprocess.TimeoutExpired:
            logger.warning("Audio extraction timed out for video: %s", video_file_path)
            return False, None
        except Exception as e:
            logger.warning("Audio extraction encountered non-fatal error: %s", str(e))
            return False, None
        finally:
            if os.path.exists(temp_wav_path):
                try:
                    os.unlink(temp_wav_path)
                except OSError:
                    pass

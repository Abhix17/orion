"""Video Preprocessing, Validation & Bounded Frame Extraction Engine.

Enforces:
1. Container Magic Byte & Extension Safety (MP4, MOV, WEBM, AVI).
2. Size & Resource Bounds: Max file size (50 MB), Max duration (180s), Max dimensions (3840x2160).
3. Ephemeral File Management: Bounded streaming with immediate unlink.
4. Deterministic Metadata Extraction: FPS, duration, frame count, codec, resolution.
5. Strategic Bounded Frame Sampling: Uniform sampling across beginning, middle, and end.
"""

from dataclasses import dataclass, field
import logging
import os
from pathlib import Path
import tempfile
from typing import List, Optional, Tuple
import cv2
import numpy as np

logger = logging.getLogger(__name__)

# Resource Limits
MAX_VIDEO_SIZE = 50 * 1024 * 1024  # 50 MB
MAX_VIDEO_DURATION_SEC = 180.0     # 3 minutes
MAX_VIDEO_WIDTH = 3840             # 4K UHD
MAX_VIDEO_HEIGHT = 2160
DEFAULT_MAX_SAMPLED_FRAMES = 16    # Balanced accuracy vs latency
MAX_ALLOWED_SAMPLED_FRAMES = 32

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".webm", ".avi", ".m4v"}


class VideoError(Exception):
    """Base exception for video processing errors."""
    pass


VideoValidationError = VideoError


class VideoEmptyError(VideoError):
    """Raised when uploaded video is 0 bytes."""
    pass


class VideoOversizedError(VideoError):
    """Raised when video exceeds size limits."""
    pass


class UnsupportedVideoFormatError(VideoError):
    """Raised when file format is not supported."""
    pass


class VideoCorruptedError(VideoError):
    """Raised when video container or stream cannot be decoded."""
    pass


class VideoDimensionError(VideoError):
    """Raised when video exceeds duration or dimension limits."""
    pass


@dataclass
class VideoMetadata:
    """Deterministic structural metadata extracted from video container."""
    duration_sec: float
    width: int
    height: int
    source_fps: float
    source_frame_count: int
    codec: str
    file_size_bytes: int
    has_audio: bool = False
    is_truncated_duration: bool = False

    @property
    def duration_seconds(self) -> float:
        return self.duration_sec

    @property
    def fps(self) -> float:
        return self.source_fps

    @property
    def total_frames(self) -> int:
        return self.source_frame_count

    @property
    def sampling_interval(self) -> int:
        return 1


@dataclass
class SampledFrame:
    """Individual sampled frame with temporal tracking metadata."""
    frame_idx: int
    timestamp_sec: float
    rgb_array: np.ndarray
    bgr_array: np.ndarray

    def __iter__(self):
        return iter((self.frame_idx, self.timestamp_sec, self.bgr_array))

    def __getitem__(self, idx: int):
        return (self.frame_idx, self.timestamp_sec, self.bgr_array)[idx]


@dataclass
class PreprocessedVideo:
    """Complete preprocessed video representation."""
    metadata: VideoMetadata
    sampled_frames: List[SampledFrame]
    sampling_interval: int
    temp_file_path: Optional[str] = None


class VideoPreprocessor:
    """Validates video containers and extracts bounded sample frames."""

    @staticmethod
    def validate_magic_bytes(content: bytes) -> str:
        """Inspect container binary headers."""
        if not content or len(content) == 0:
            raise VideoEmptyError("Video file is empty (0 bytes).")

        if len(content) > MAX_VIDEO_SIZE:
            raise VideoOversizedError(f"Video file exceeds size limit of {MAX_VIDEO_SIZE // (1024 * 1024)} MB.")

        # MP4 / MOV / M4V container verification
        is_mp4_mov = (len(content) >= 8 and content[4:8] in (b"ftyp", b"moov", b"wide", b"mdat", b"free")) or content.startswith(b"\x00\x00\x00")
        # WEBM / MKV container verification
        is_webm = content.startswith(b"\x1a\x45\xdf\xa3")
        # AVI container verification
        is_avi = content.startswith(b"RIFF") and len(content) >= 12 and content[8:12] == b"AVI "

        if is_mp4_mov:
            return ".mp4"
        elif is_webm:
            return ".webm"
        elif is_avi:
            return ".avi"
        else:
            raise UnsupportedVideoFormatError(
                "Video container header does not match a valid MP4, MOV, WEBM, or AVI format."
            )

    @classmethod
    def validate_and_sample(
        cls,
        video_bytes: bytes,
        filename: Optional[str] = None,
        max_samples: int = DEFAULT_MAX_SAMPLED_FRAMES,
        max_frames: Optional[int] = None,
        min_frames: int = 4,
        retain_temp_file: bool = False,
    ) -> PreprocessedVideo:
        """Decode video metadata and sample frames with bounded resource consumption.

        Args:
            video_bytes: Raw binary video stream.
            filename: Optional filename to validate extension against allowed types.
            max_samples: Maximum number of frames to sample (default 16, max 32).
            max_frames: Alias for max_samples.
            min_frames: Minimum number of frames to sample if available.
            retain_temp_file: If True, keeps the temporary file on disk for downstream audio extraction.

        Returns:
            PreprocessedVideo with metadata and sampled RGB/BGR frames.
        """
        if filename:
            ext_suffix = Path(filename).suffix.lower()
            if ext_suffix and ext_suffix not in ALLOWED_EXTENSIONS:
                raise UnsupportedVideoFormatError(f"Unsupported video file extension: {ext_suffix}")

        ext = cls.validate_magic_bytes(video_bytes)
        actual_max = max_frames if max_frames is not None else max_samples
        actual_max = max(min_frames, min(actual_max, MAX_ALLOWED_SAMPLED_FRAMES))
        max_samples = actual_max

        temp_dir = tempfile.gettempdir()
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=ext, dir=temp_dir)
        temp_path = temp_file.name

        try:
            temp_file.write(video_bytes)
            temp_file.flush()
            temp_file.close()

            cap = cv2.VideoCapture(temp_path)
            if not cap.isOpened():
                raise VideoCorruptedError("Video stream could not be opened or decoded.")

            fps = cap.get(cv2.CAP_PROP_FPS)
            if fps <= 0.0 or np.isnan(fps):
                fps = 25.0  # Fallback default FPS

            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            fourcc_int = int(cap.get(cv2.CAP_PROP_FOURCC))
            codec = "".join([chr((fourcc_int >> 8 * i) & 0xFF) for i in range(4)]).strip() or "unknown"

            if total_frames <= 0 or width <= 0 or height <= 0:
                # Try reading at least one frame
                ret, test_frame = cap.read()
                if not ret or test_frame is None:
                    cap.release()
                    raise VideoCorruptedError("Video stream contains zero decodable frames.")
                height, width = test_frame.shape[:2]
                total_frames = 1
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)

            duration_sec = total_frames / fps

            # Validate dimensions and duration
            if width > MAX_VIDEO_WIDTH or height > MAX_VIDEO_HEIGHT:
                cap.release()
                raise VideoDimensionError(
                    f"Video resolution {width}x{height} exceeds maximum supported 4K limit ({MAX_VIDEO_WIDTH}x{MAX_VIDEO_HEIGHT})."
                )

            if duration_sec > MAX_VIDEO_DURATION_SEC:
                logger.warning("Video duration %.1fs exceeds maximum %ds; capping processing to initial span.", duration_sec, MAX_VIDEO_DURATION_SEC)
                duration_sec = MAX_VIDEO_DURATION_SEC
                total_frames = int(duration_sec * fps)

            # Determine strategic frame indices
            num_samples = min(total_frames, max_samples)
            if num_samples <= 1:
                sample_indices = [0]
                interval = total_frames
            else:
                sample_indices = np.linspace(0, total_frames - 1, num_samples, dtype=int).tolist()
                # Deduplicate and sort
                sample_indices = sorted(list(set(sample_indices)))
                interval = max(1, total_frames // max(1, len(sample_indices)))

            sampled_frames: List[SampledFrame] = []
            for idx in sample_indices:
                cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
                ret, bgr_frame = cap.read()
                if not ret or bgr_frame is None:
                    continue
                rgb_frame = cv2.cvtColor(bgr_frame, cv2.COLOR_BGR2RGB)
                timestamp = round(float(idx / fps), 3)
                sampled_frames.append(
                    SampledFrame(
                        frame_idx=idx,
                        timestamp_sec=timestamp,
                        rgb_array=rgb_frame,
                        bgr_array=bgr_frame,
                    )
                )

            cap.release()

            if len(sampled_frames) == 0:
                raise VideoCorruptedError("Could not extract any valid frames from the video container.")

            meta = VideoMetadata(
                duration_sec=round(duration_sec, 2),
                width=width,
                height=height,
                source_fps=round(fps, 2),
                source_frame_count=total_frames,
                codec=codec,
                file_size_bytes=len(video_bytes),
                has_audio=False,  # Audio detector will verify audio stream presence
            )

            return PreprocessedVideo(
                metadata=meta,
                sampled_frames=sampled_frames,
                sampling_interval=interval,
                temp_file_path=temp_path if retain_temp_file else None,
            )

        except Exception as e:
            if not retain_temp_file and os.path.exists(temp_path):
                try:
                    os.unlink(temp_path)
                except OSError:
                    pass
            if isinstance(e, VideoError):
                raise
            raise VideoCorruptedError(f"Video preprocessing failed: {str(e)}") from e
        finally:
            if not retain_temp_file and os.path.exists(temp_path):
                try:
                    os.unlink(temp_path)
                except OSError:
                    pass

"""Whisper Speech Transcription Engine for ORION v2.

Transforms speech audio streams into accurate text transcripts for
downstream semantic analysis and intent extraction via the Semantic Gateway.
"""

import logging
import threading
import time
from typing import Any, Dict, Optional

import numpy as np
import torch
from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor

from app.engines.media.audio_preprocess import (
    AudioPreprocessor,
    AudioProcessingError,
)

logger = logging.getLogger("orion.whisper")

DEFAULT_WHISPER_CHECKPOINT = "openai/whisper-tiny"


class WhisperTranscriptionEngine:
    """Industrial-grade speech-to-text transcription engine using OpenAI Whisper."""

    _instance: Optional["WhisperTranscriptionEngine"] = None
    _lock = threading.Lock()

    def __init__(self, model_checkpoint: str = DEFAULT_WHISPER_CHECKPOINT):
        self.model_checkpoint = model_checkpoint
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self._processor: Optional[AutoProcessor] = None
        self._model: Optional[AutoModelForSpeechSeq2Seq] = None
        self._model_loaded: bool = False
        self._init_error: Optional[str] = None
        self._load_lock = threading.Lock()

    def _ensure_model_loaded(self) -> bool:
        """Lazy-load the Whisper speech recognition model with bounded timeout."""
        if self._model_loaded:
            return True

        with self._load_lock:
            if self._model_loaded:
                return True
            
            result_container = {}
            def _load_worker():
                try:
                    processor = AutoProcessor.from_pretrained(self.model_checkpoint)
                    model = AutoModelForSpeechSeq2Seq.from_pretrained(self.model_checkpoint)
                    model.to(self.device)
                    model.eval()
                    result_container["processor"] = processor
                    result_container["model"] = model
                except Exception as ex:
                    result_container["error"] = str(ex)

            th = threading.Thread(target=_load_worker, daemon=True)
            th.start()
            th.join(timeout=30.0)

            if "model" in result_container:
                self._processor = result_container["processor"]
                self._model = result_container["model"]
                self._model_loaded = True
                self._init_error = None
                logger.info(f"Whisper model '{self.model_checkpoint}' loaded successfully.")
                return True
            else:
                err = result_container.get("error", "Model load timed out after 6s")
                self._init_error = err
                self._model_loaded = False
                logger.warning(f"Could not load Whisper model '{self.model_checkpoint}': {err}.")
                return False

    def is_model_loaded(self) -> bool:
        return self._model_loaded

    async def transcribe(
        self,
        audio_bytes: Optional[bytes] = None,
        provided_transcript: Optional[str] = None,
    ) -> str:
        """Transcribe speech audio into text (canonical signature)."""
        result = await self.transcribe_with_metadata(
            audio_bytes=audio_bytes,
            provided_transcript=provided_transcript,
        )
        return result.get("transcript", "")

    async def transcribe_with_metadata(
        self,
        audio_bytes: Optional[bytes] = None,
        provided_transcript: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Transcribe speech audio and return full diagnostic metadata."""
        start_time = time.perf_counter()

        # 1. If explicit transcript or simulation text is provided
        if provided_transcript and provided_transcript.strip():
            return {
                "transcript": provided_transcript.strip(),
                "provider": "provided_context",
                "model": "user_provided",
                "model_loaded": True,
                "latency_ms": 0.0,
                "device": "none",
                "language": "en",
            }

        # 2. If raw bytes are passed
        if audio_bytes and len(audio_bytes) > 32:
            try:
                # Preprocess: decode, mono-convert, resample to 16kHz
                audio_16k, quality = AudioPreprocessor.decode_and_resample(audio_bytes)

                # Skip pure silence or extremely short clips
                if quality.is_silent or len(audio_16k) < 3200:  # < 0.2s
                    return {
                        "transcript": "",
                        "provider": "whisper",
                        "model": self.model_checkpoint,
                        "model_loaded": self._model_loaded,
                        "latency_ms": round((time.perf_counter() - start_time) * 1000, 2),
                        "device": self.device,
                        "note": "Audio clip is silent or too short for speech transcription.",
                    }

                if self._ensure_model_loaded() and self._model is not None and self._processor is not None:
                    # Whisper expects 16kHz audio array
                    inputs = self._processor(
                        audio_16k,
                        sampling_rate=16000,
                        return_tensors="pt",
                    )
                    input_features = inputs.input_features.to(self.device)

                    with torch.no_grad():
                        predicted_ids = self._model.generate(input_features)
                        transcription_list = self._processor.batch_decode(
                            predicted_ids, skip_special_tokens=True
                        )

                    transcript = transcription_list[0].strip() if transcription_list else ""
                    duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

                    return {
                        "transcript": transcript,
                        "provider": "whisper",
                        "model": self.model_checkpoint,
                        "model_loaded": True,
                        "latency_ms": duration_ms,
                        "device": self.device,
                        "audio_duration_sec": quality.duration_sec,
                    }

                else:
                    return {
                        "transcript": "",
                        "provider": "unavailable",
                        "model": self.model_checkpoint,
                        "model_loaded": False,
                        "error": self._init_error or "Model failed to load",
                        "latency_ms": round((time.perf_counter() - start_time) * 1000, 2),
                        "device": self.device,
                    }

            except AudioProcessingError as ape:
                logger.warning(f"Audio processing error during transcription: {ape}")
                return {
                    "transcript": "",
                    "provider": "whisper",
                    "model_loaded": False,
                    "error": str(ape),
                    "latency_ms": round((time.perf_counter() - start_time) * 1000, 2),
                    "device": self.device,
                }
            except Exception as exc:
                logger.error(f"Whisper inference error: {exc}")
                return {
                    "transcript": "",
                    "provider": "unavailable",
                    "model_loaded": False,
                    "error": str(exc),
                    "latency_ms": round((time.perf_counter() - start_time) * 1000, 2),
                    "device": self.device,
                }

        # Case 3: No audio or empty bytes
        return {
            "transcript": "",
            "provider": "whisper",
            "model_loaded": self._model_loaded,
            "latency_ms": 0.0,
            "device": self.device,
        }

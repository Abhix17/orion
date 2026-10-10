"""Core configuration settings for ORION v2."""

import os
from pathlib import Path
from typing import List

try:
    from pydantic_settings import BaseSettings
except ImportError:
    class BaseSettings:
        pass

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
DATABASE_PATH = DATA_DIR / "orion.db"
FIXTURES_DIR = DATA_DIR / "fixtures"
EVALUATION_DIR = DATA_DIR / "evaluation"
ENV_FILE = BASE_DIR / ".env"


def _load_env_file(filepath: Path) -> None:
    """Zero-dependency parser for .env key-value pairs."""
    if not filepath.exists():
        return
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    key, val = line.split("=", 1)
                    key = key.strip()
                    val = val.strip().strip('"').strip("'")
                    if key and key not in os.environ:
                        os.environ[key] = val
    except Exception:
        pass


_load_env_file(ENV_FILE)


class Settings:
    PROJECT_NAME: str = "ORION v2"
    PROJECT_VERSION: str = "2.0.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Storage
    DATABASE_PATH: Path = DATABASE_PATH
    DATA_DIR: Path = DATA_DIR
    FIXTURES_DIR: Path = FIXTURES_DIR
    EVALUATION_DIR: Path = EVALUATION_DIR
    
    # Pretrained Online Model APIs
    @property
    def GEMINI_API_KEY(self) -> str:
        _load_env_file(ENV_FILE)
        return os.getenv("GEMINI_API_KEY", "")

    @property
    def HF_TOKEN(self) -> str:
        _load_env_file(ENV_FILE)
        return os.getenv("HF_TOKEN", "")

    @property
    def QWEN_API_KEY(self) -> str:
        _load_env_file(ENV_FILE)
        return os.getenv("QWEN_API_KEY", "")

    @property
    def OLLAMA_BASE_URL(self) -> str:
        return os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    
    # Environment & Security
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    @property
    def CORS_ORIGINS(self) -> List[str]:
        raw = os.getenv("CORS_ORIGINS", "")
        if raw:
            return [origin.strip() for origin in raw.split(",") if origin.strip()]
        return ["*"]


settings = Settings()

# Ensure critical directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
FIXTURES_DIR.mkdir(parents=True, exist_ok=True)
EVALUATION_DIR.mkdir(parents=True, exist_ok=True)


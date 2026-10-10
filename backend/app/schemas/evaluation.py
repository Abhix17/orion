"""Evaluation and Benchmark Schemas for ORION v2 — Phase 7.

Extends Phase 5 schemas with:
- DatasetProvenance (per-sample and global)
- Risk-band evaluation
- Response evaluation
- Provider evaluation stubs
- NOT_MEASURED / UNAVAILABLE / INSUFFICIENT_GROUND_TRUTH sentinel values
- Sample-size-aware metrics
- Scenario matrix
- Reproducible run metadata
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from uuid import uuid4
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.threat import ThreatAssessment, ThreatType


# ---------------------------------------------------------------------------
# Sentinel values for honest reporting
# ---------------------------------------------------------------------------

class MeasurementStatus:
    MEASURED = "MEASURED"
    NOT_MEASURED = "NOT_MEASURED"
    UNAVAILABLE = "UNAVAILABLE"
    INSUFFICIENT_GROUND_TRUTH = "INSUFFICIENT_GROUND_TRUTH"


# ---------------------------------------------------------------------------
# Dataset Provenance
# ---------------------------------------------------------------------------

class DatasetProvenance(BaseModel):
    """Describes where an evaluation dataset came from."""
    name: str
    source: str
    dataset_type: str = Field(
        description="One of: SYNTHETIC_DATA, PUBLIC_DATA, AUTHORIZED_DATA, DEMO_FIXTURE"
    )
    version: Optional[str] = None
    generation_date: Optional[str] = None
    license: Optional[str] = None
    note: Optional[str] = None
    sample_count: int = 0


# ---------------------------------------------------------------------------
# Ground Truth Sample (Phase 7 extended)
# ---------------------------------------------------------------------------

class EvaluationSample(BaseModel):
    """Standardized ground-truth benchmark item — Phase 7 extended."""
    # Support both 'id' and 'case_id' fields for backward compatibility
    id: str
    case_id: Optional[str] = None
    scenario: Optional[str] = None          # e.g. "phishing", "account_takeover", "benign"
    modality: str = Field(description="'url', 'message', 'audio', 'auth_event'")
    input_data: Dict[str, Any]
    ground_truth_label: str = Field(description="'MALICIOUS', 'SAFE', 'SUSPICIOUS'")
    expected_threat_type: Optional[ThreatType] = None
    expected_risk_level: Optional[str] = None          # e.g. "SAFE", "LOW", "HIGH", "CRITICAL"
    expected_response_class: Optional[str] = None      # e.g. "BLOCK_AND_WARN", "NO_ACTION"
    description: str = ""
    dataset: Optional[Dict[str, Any]] = None           # Inline provenance metadata

    model_config = ConfigDict(use_enum_values=True)


# ---------------------------------------------------------------------------
# Per-Sample Result
# ---------------------------------------------------------------------------

class SampleEvaluationResult(BaseModel):
    """Outcome of running a single benchmark sample through ORION."""
    sample_id: str
    case_id: Optional[str] = None
    scenario: Optional[str] = None
    modality: str
    description: str
    predicted_assessment: ThreatAssessment
    ground_truth_assessment: str
    predicted_risk_score: float
    predicted_risk_level: Optional[str] = None        # Observed risk band
    expected_risk_level: Optional[str] = None         # Ground truth risk band
    risk_band_match: Optional[bool] = None            # True/False/None (not measured)
    predicted_threat_type: ThreatType
    expected_threat_type: Optional[str] = None
    threat_type_match: Optional[bool] = None
    expected_response_class: Optional[str] = None
    is_correct: bool
    is_false_positive: bool
    is_false_negative: bool
    latency_ms: float
    error: Optional[str] = None

    model_config = ConfigDict(use_enum_values=True)


# ---------------------------------------------------------------------------
# Confusion Matrix
# ---------------------------------------------------------------------------

class ConfusionMatrix(BaseModel):
    true_positives: int = 0
    true_negatives: int = 0
    false_positives: int = 0
    false_negatives: int = 0


# ---------------------------------------------------------------------------
# Honest Metric — supports NOT_MEASURED sentinel
# ---------------------------------------------------------------------------

class HonestMetric(BaseModel):
    """A metric value that explicitly distinguishes measured from unavailable."""
    status: str = Field(description="MEASURED | NOT_MEASURED | UNAVAILABLE | INSUFFICIENT_GROUND_TRUTH")
    value: Optional[float] = None
    sample_count: int = 0
    warning: Optional[str] = None

    @classmethod
    def measured(cls, value: float, n: int) -> "HonestMetric":
        warn = f"Small evaluation sample (n={n})" if n < 10 else None
        return cls(status=MeasurementStatus.MEASURED, value=round(value, 4), sample_count=n, warning=warn)

    @classmethod
    def not_measured(cls, reason: str = "insufficient ground truth") -> "HonestMetric":
        return cls(status=MeasurementStatus.NOT_MEASURED, value=None, sample_count=0, warning=reason)

    @classmethod
    def unavailable(cls, reason: str = "provider unavailable") -> "HonestMetric":
        return cls(status=MeasurementStatus.UNAVAILABLE, value=None, sample_count=0, warning=reason)

    @classmethod
    def insufficient(cls, n: int) -> "HonestMetric":
        return cls(
            status=MeasurementStatus.INSUFFICIENT_GROUND_TRUTH,
            value=None,
            sample_count=n,
            warning=f"Only {n} samples — insufficient for reliable metric",
        )


# ---------------------------------------------------------------------------
# Binary Detection Metrics (Phase 7 honest)
# ---------------------------------------------------------------------------

class DetectionMetrics(BaseModel):
    """Honest binary classification metrics with sample-size awareness."""
    modality: str
    sample_count: int
    small_sample_warning: Optional[str] = None
    precision: HonestMetric
    recall: HonestMetric
    f1_score: HonestMetric
    false_positive_rate: HonestMetric
    false_negative_rate: HonestMetric
    accuracy: HonestMetric
    confusion_matrix: ConfusionMatrix
    avg_latency_ms: Optional[float] = None
    p95_latency_ms: Optional[float] = None
    min_latency_ms: Optional[float] = None
    max_latency_ms: Optional[float] = None


# ---------------------------------------------------------------------------
# Risk Band Evaluation
# ---------------------------------------------------------------------------

class RiskBandResult(BaseModel):
    sample_id: str
    expected_risk_level: str
    observed_risk_level: str
    match: bool
    direction: str = Field(
        description="EXACT | OVER_CLASSIFIED | UNDER_CLASSIFIED"
    )


class RiskEvaluation(BaseModel):
    """Evaluation of the Risk Engine's band predictions vs ground truth."""
    sample_count: int
    measured_sample_count: int = 0
    exact_match_count: int = 0
    over_classified_count: int = 0
    under_classified_count: int = 0
    exact_match_rate: HonestMetric
    results: List[RiskBandResult] = Field(default_factory=list)
    note: str = "Risk band evaluation — compares expected vs observed risk level"


# ---------------------------------------------------------------------------
# Response Evaluation
# ---------------------------------------------------------------------------

class ResponseEvalResult(BaseModel):
    sample_id: str
    expected_response_class: str
    observed_response_category: str
    appropriate: bool
    note: Optional[str] = None


class ResponseEvaluation(BaseModel):
    """Evaluation of Phase 6 response recommendations vs expected response class."""
    status: str = MeasurementStatus.NOT_MEASURED
    sample_count: int = 0
    appropriate_count: int = 0
    inappropriate_count: int = 0
    appropriateness_rate: HonestMetric = Field(
        default_factory=lambda: HonestMetric.not_measured("Response evaluation requires ground truth with expected_response_class")
    )
    results: List[ResponseEvalResult] = Field(default_factory=list)
    note: str = "Response evaluation compares playbook output against expected response class in ground truth"


# ---------------------------------------------------------------------------
# Provider Availability Evaluation
# ---------------------------------------------------------------------------

class ProviderStatus(BaseModel):
    provider_name: str
    modality: str
    availability: str = Field(
        description="AVAILABLE | UNAVAILABLE | DEGRADED | NOT_TESTED"
    )
    unavailable_causes_safe: bool = False
    note: Optional[str] = None


class ProviderEvaluation(BaseModel):
    """Availability and behavior-under-failure evaluation for all providers."""
    providers: List[ProviderStatus] = Field(default_factory=list)
    unavailable_not_safe_verified: bool = False
    note: str = "Provider failure evaluation — verifies UNAVAILABLE != SAFE"


# ---------------------------------------------------------------------------
# Latency Statistics
# ---------------------------------------------------------------------------

class LatencyStats(BaseModel):
    modality: str
    sample_count: int
    mean_ms: Optional[float] = None
    median_ms: Optional[float] = None
    p95_ms: Optional[float] = None
    min_ms: Optional[float] = None
    max_ms: Optional[float] = None
    warm_vs_cold: str = "NOT_DISTINGUISHED"
    note: Optional[str] = None


# ---------------------------------------------------------------------------
# Scenario Matrix Row
# ---------------------------------------------------------------------------

class ScenarioMatrixRow(BaseModel):
    scenario: str
    modality: str
    total_samples: int
    valid_samples: int
    unavailable_samples: int = 0
    detection_status: str = MeasurementStatus.NOT_MEASURED
    classification_status: str = MeasurementStatus.NOT_MEASURED
    risk_status: str = MeasurementStatus.NOT_MEASURED
    note: Optional[str] = None


# ---------------------------------------------------------------------------
# Legacy ModalityMetrics (kept for backward compatibility with Phase 5 tests)
# ---------------------------------------------------------------------------

class ModalityMetrics(BaseModel):
    """Aggregated statistical evaluation metrics — Phase 5 compatible."""
    modality: str
    total_samples: int
    correct_predictions: int
    accuracy: float = Field(ge=0.0, le=1.0)
    precision: float = Field(ge=0.0, le=1.0)
    recall: float = Field(ge=0.0, le=1.0)
    f1_score: float = Field(ge=0.0, le=1.0)
    false_positive_rate: float = Field(ge=0.0, le=1.0)
    false_negative_rate: float = Field(ge=0.0, le=1.0)
    avg_latency_ms: float
    p95_latency_ms: float
    confusion_matrix: ConfusionMatrix


# ---------------------------------------------------------------------------
# Full Evaluation Run Result (Phase 7 extended)
# ---------------------------------------------------------------------------

class EvaluationRunResult(BaseModel):
    """Comprehensive evaluation report — Phase 7 extended with honest metrics."""
    run_id: str = Field(default_factory=lambda: f"eval_{uuid4().hex[:10]}")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    dataset_version: str = "7.0.0"
    risk_policy_version: str = "4.0"
    environment: str = "development"

    # Sample counts
    total_samples: int
    duration_seconds: float

    # Phase 5 compatible — legacy overall metrics
    overall_metrics: ModalityMetrics
    per_modality_metrics: Dict[str, ModalityMetrics]
    sample_results: List[SampleEvaluationResult] = Field(default_factory=list)

    # Phase 7 extended
    scenario_matrix: List[ScenarioMatrixRow] = Field(default_factory=list)
    detection_metrics: Dict[str, DetectionMetrics] = Field(default_factory=dict)
    risk_evaluation: Optional[RiskEvaluation] = None
    response_evaluation: Optional[ResponseEvaluation] = None
    provider_evaluation: Optional[ProviderEvaluation] = None
    latency_stats: List[LatencyStats] = Field(default_factory=list)
    provenance: Optional[DatasetProvenance] = None

    model_config = ConfigDict(use_enum_values=True)


# ---------------------------------------------------------------------------
# API Request
# ---------------------------------------------------------------------------

class EvaluationRunRequest(BaseModel):
    """Request payload to trigger benchmark execution."""
    modality: Optional[str] = Field(
        default=None,
        description="Optional modality filter ('url', 'message', 'audio', 'auth_event')"
    )
    sample_limit: Optional[int] = Field(
        default=None,
        description="Optional maximum number of samples to evaluate"
    )

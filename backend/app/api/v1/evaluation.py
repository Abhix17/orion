"""Evaluation and Benchmarking Endpoints for ORION v2 — Phase 7.

Phase 7 adds:
- GET /api/v1/evaluation/summary        — overall evaluation summary
- GET /api/v1/evaluation/scenarios      — scenario matrix
- GET /api/v1/evaluation/metrics        — Phase 7 honest detection metrics
- GET /api/v1/evaluation/latency        — latency statistics per modality
- GET /api/v1/evaluation/providers      — provider availability evaluation
- GET /api/v1/evaluation/risk           — risk band evaluation
- GET /api/v1/evaluation/response       — response recommendation evaluation

Existing endpoints preserved for Phase 5 backward compatibility:
- POST /api/v1/evaluation/run
- GET  /api/v1/evaluation/latest
- GET  /api/v1/evaluation/ground-truth
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException

from app.evaluation.runner import BenchmarkRunner
from app.schemas.evaluation import (
    EvaluationRunRequest,
    EvaluationRunResult,
    MeasurementStatus,
)

router = APIRouter(prefix="/evaluation", tags=["Evaluation & Benchmarks"])
runner = BenchmarkRunner()


def _ensure_latest(require_full: bool = False) -> EvaluationRunResult:
    """Return the latest cached result, or raise 404 with a helpful message."""
    res = runner.get_latest_result()
    if res is None:
        raise HTTPException(
            status_code=404,
            detail=(
                "No evaluation run available. "
                "POST /api/v1/evaluation/run to execute the benchmark suite first."
            ),
        )
    return res


# ---------------------------------------------------------------------------
# Existing Phase 5 Endpoints (preserved for backward compatibility)
# ---------------------------------------------------------------------------

@router.post("/run", response_model=EvaluationRunResult)
async def run_benchmark(req: EvaluationRunRequest = EvaluationRunRequest()) -> EvaluationRunResult:
    """Execute live in-app benchmark suite across detection modalities.

    Evaluates models and decision engines against labeled ground-truth datasets,
    computing real Precision, Recall, F1-Score, False Positive Rate (FPR),
    latency percentiles, risk-band accuracy, and response recommendation quality.

    All metrics are labeled MEASURED / NOT_MEASURED / UNAVAILABLE / INSUFFICIENT_GROUND_TRUTH.
    """
    try:
        return await runner.run(
            modality=req.modality,
            sample_limit=req.sample_limit,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Benchmark execution failed: {e}")


@router.get("/latest", response_model=Optional[EvaluationRunResult])
async def get_latest_benchmark() -> Optional[EvaluationRunResult]:
    """Retrieve the most recent benchmark run result.

    If no run has been performed yet, executes a fast 4-sample smoke benchmark.
    """
    res = runner.get_latest_result()
    if not res:
        # Execute a fast smoke benchmark for initial load
        res = await runner.run(sample_limit=4)
    return res


@router.get("/ground-truth", response_model=Dict[str, Any])
async def get_ground_truth_metadata() -> Dict[str, Any]:
    """Inspect ground-truth benchmark dataset metrics, modalities, and sample distributions.

    Returns provenance information including dataset type, source, and generation date.
    All samples in this dataset are SYNTHETIC_DATA.
    """
    return runner.get_ground_truth_summary()


# ---------------------------------------------------------------------------
# Phase 7 Extended Endpoints
# ---------------------------------------------------------------------------

@router.get("/summary", response_model=Dict[str, Any])
async def get_evaluation_summary() -> Dict[str, Any]:
    """Phase 7 evaluation summary.

    Returns a high-level overview of the most recent evaluation run:
    - Total samples evaluated
    - Modality breakdown
    - Overall detection metrics (with MEASURED/NOT_MEASURED distinction)
    - Risk evaluation summary
    - Response evaluation summary
    - Dataset provenance

    Metrics that cannot be measured are clearly labeled NOT_MEASURED or INSUFFICIENT_GROUND_TRUTH.
    """
    res = _ensure_latest()
    overall_dm = res.detection_metrics.get("overall")

    return {
        "run_id": res.run_id,
        "timestamp": res.timestamp.isoformat(),
        "dataset_version": res.dataset_version,
        "risk_policy_version": res.risk_policy_version,
        "total_samples": res.total_samples,
        "duration_seconds": res.duration_seconds,
        "modality_breakdown": {
            mod: metrics.total_samples
            for mod, metrics in res.per_modality_metrics.items()
        },
        "detection_summary": {
            "precision": overall_dm.precision.dict() if overall_dm else None,
            "recall": overall_dm.recall.dict() if overall_dm else None,
            "f1_score": overall_dm.f1_score.dict() if overall_dm else None,
            "false_positive_rate": overall_dm.false_positive_rate.dict() if overall_dm else None,
            "sample_count": overall_dm.sample_count if overall_dm else 0,
            "small_sample_warning": overall_dm.small_sample_warning if overall_dm else None,
        },
        "risk_evaluation_summary": {
            "measured_samples": res.risk_evaluation.measured_sample_count if res.risk_evaluation else 0,
            "exact_match_rate": (
                res.risk_evaluation.exact_match_rate.dict()
                if res.risk_evaluation else {"status": MeasurementStatus.NOT_MEASURED}
            ),
        },
        "response_evaluation_summary": {
            "status": res.response_evaluation.status if res.response_evaluation else MeasurementStatus.NOT_MEASURED,
            "sample_count": res.response_evaluation.sample_count if res.response_evaluation else 0,
            "appropriateness_rate": (
                res.response_evaluation.appropriateness_rate.dict()
                if res.response_evaluation else {"status": MeasurementStatus.NOT_MEASURED}
            ),
        },
        "provenance": res.provenance.dict() if res.provenance else None,
        "important_disclaimer": (
            "All metrics are measured against SYNTHETIC ground truth only. "
            "This is not a real-world benchmark. Results may not generalize to production data."
        ),
    }


@router.get("/scenarios", response_model=List[Dict[str, Any]])
async def get_scenario_matrix() -> List[Dict[str, Any]]:
    """Phase 7 scenario evaluation matrix.

    Returns evaluation status per scenario, including:
    - Sample count
    - Detection measurement status (MEASURED / NOT_MEASURED / UNAVAILABLE)
    - Classification measurement status
    - Risk measurement status
    - Notes on missing ground truth

    Scenarios with insufficient ground truth are explicitly marked:
    NOT MEASURED — INSUFFICIENT GROUND TRUTH
    """
    res = _ensure_latest()
    return [row.dict() for row in res.scenario_matrix]


@router.get("/metrics", response_model=Dict[str, Any])
async def get_detection_metrics() -> Dict[str, Any]:
    """Phase 7 honest detection metrics — per modality and overall.

    All metrics use the HonestMetric structure:
    {
        "status": "MEASURED" | "NOT_MEASURED" | "UNAVAILABLE" | "INSUFFICIENT_GROUND_TRUTH",
        "value": <float or null>,
        "sample_count": <int>,
        "warning": <string or null>
    }

    Small samples (n < 10) receive a warning. Zero denominators return NOT_MEASURED.
    """
    res = _ensure_latest()
    return {
        mod: dm.dict()
        for mod, dm in res.detection_metrics.items()
    }


@router.get("/latency", response_model=List[Dict[str, Any]])
async def get_latency_stats() -> List[Dict[str, Any]]:
    """Phase 7 latency statistics per modality.

    Reports mean, median, p95, min, max execution times.
    Single-execution results are labeled accordingly.
    p95 requires at least 2 samples.
    """
    res = _ensure_latest()
    return [stat.dict() for stat in res.latency_stats]


@router.get("/providers", response_model=Dict[str, Any])
async def get_provider_evaluation() -> Dict[str, Any]:
    """Phase 7 provider availability evaluation.

    Reports availability status for each provider and verifies that:
    - UNAVAILABLE provider != SAFE assessment
    - Provider failures are reflected in evidence records
    - No provider failure silently clears a threat signal

    Providers not tested due to missing ground truth are labeled NOT_TESTED.
    """
    res = _ensure_latest()
    if not res.provider_evaluation:
        return {
            "status": MeasurementStatus.NOT_MEASURED,
            "note": "No evaluation run available",
        }
    return {
        **res.provider_evaluation.dict(),
        "disclaimer": (
            "Provider evaluation is based on architectural inspection and injected-score fixture path, "
            "not adversarial live provider testing. Image/video providers are NOT_TESTED due to "
            "absence of ground truth samples."
        ),
    }


@router.get("/risk", response_model=Dict[str, Any])
async def get_risk_evaluation() -> Dict[str, Any]:
    """Phase 7 risk band evaluation.

    Compares expected risk level (from ground truth) with observed risk level
    from the ORION Risk Engine.

    Reports:
    - Exact match rate
    - Over-classification count
    - Under-classification count
    - Per-sample breakdown

    Only samples with explicit expected_risk_level in ground truth are evaluated.
    """
    res = _ensure_latest()
    if not res.risk_evaluation:
        return {
            "status": MeasurementStatus.NOT_MEASURED,
            "note": "No evaluation run available",
        }
    return {
        **res.risk_evaluation.dict(),
        "note": (
            "Risk evaluation is against SYNTHETIC ground truth only. "
            "Expected risk levels were assigned by hand during dataset construction. "
            "This does not validate the Risk Engine against real-world threat data."
        ),
    }


@router.get("/response", response_model=Dict[str, Any])
async def get_response_evaluation() -> Dict[str, Any]:
    """Phase 7 response recommendation evaluation.

    Compares expected response class (from ground truth) with the playbook
    recommendation generated by ORION for each evaluated sample.

    Expected response classes:
    - BLOCK_AND_WARN → BLOCK or WARN action categories
    - VERIFY_AND_FLAG → VERIFICATION, INVESTIGATION, or NOTIFICATION
    - SESSION_CONTAINMENT → SESSION or AUTHENTICATION
    - NO_ACTION → No Action Required (VERIFICATION category)

    If no expected_response_class is defined in ground truth: NOT_MEASURED.
    """
    res = _ensure_latest()
    if not res.response_evaluation:
        return {
            "status": MeasurementStatus.NOT_MEASURED,
            "note": "No evaluation run available",
        }
    return res.response_evaluation.dict()

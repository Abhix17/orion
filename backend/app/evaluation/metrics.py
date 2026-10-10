"""Statistical Evaluation Metrics Calculator for ORION v2 — Phase 7.

Phase 7 changes vs Phase 5:
- Zero-denominator returns NOT_MEASURED HonestMetric (not fabricated 1.0)
- Empty-list returns all NOT_MEASURED (not fabricated 1.0)
- Adds per-modality DetectionMetrics with HonestMetric wrapper
- Retains legacy ModalityMetrics for Phase 5 backward compatibility
- All latency stats include min, max, median, p95
- Sample-size warnings added for n < 10
"""

import statistics
from typing import List, Optional

import numpy as np

from app.schemas.evaluation import (
    ConfusionMatrix,
    DetectionMetrics,
    HonestMetric,
    ModalityMetrics,
    MeasurementStatus,
    SampleEvaluationResult,
)


# ---------------------------------------------------------------------------
# Legacy Calculator — preserved for Phase 5 backward compatibility
# ---------------------------------------------------------------------------

class EvaluationMetricsCalculator:
    """Computes precision, recall, F1, FPR, and latency percentiles over benchmark runs.

    IMPORTANT Phase 7 fix:
    - When total == 0, returns NOT_MEASURED markers (accuracy=0.0, all metrics 0.0)
      rather than fabricating 1.0 precision/recall/F1.
    """

    @classmethod
    def compute(cls, results: List[SampleEvaluationResult], modality_name: str = "overall") -> ModalityMetrics:
        """Calculate standard binary classification and latency metrics.

        Returns honest zeros when sample count is 0 — does NOT fabricate 1.0 values.
        """
        total = len(results)
        if total == 0:
            return ModalityMetrics(
                modality=modality_name,
                total_samples=0,
                correct_predictions=0,
                accuracy=0.0,         # Phase 7 fix: was 1.0 — fabricated. Now honest 0.0
                precision=0.0,        # Phase 7 fix: was 1.0 — fabricated
                recall=0.0,           # Phase 7 fix: was 1.0 — fabricated
                f1_score=0.0,         # Phase 7 fix: was 1.0 — fabricated
                false_positive_rate=0.0,
                false_negative_rate=0.0,
                avg_latency_ms=0.0,
                p95_latency_ms=0.0,
                confusion_matrix=ConfusionMatrix(),
            )

        tp = 0
        tn = 0
        fp = 0
        fn = 0
        latencies = []

        for r in results:
            latencies.append(r.latency_ms)
            gt_is_positive = r.ground_truth_assessment in ("MALICIOUS", "SUSPICIOUS")
            pred_is_positive = (
                r.predicted_assessment in ("MALICIOUS", "SUSPICIOUS", "HIGH", "CRITICAL")
                or r.predicted_risk_score >= 0.50
            )

            if gt_is_positive and pred_is_positive:
                tp += 1
            elif not gt_is_positive and not pred_is_positive:
                tn += 1
            elif not gt_is_positive and pred_is_positive:
                fp += 1
            elif gt_is_positive and not pred_is_positive:
                fn += 1

        correct = tp + tn
        accuracy = round(correct / total, 4)

        # Precision = TP / (TP + FP) — safe zero denominator
        denom_prec = tp + fp
        precision = round(tp / denom_prec, 4) if denom_prec > 0 else 0.0

        # Recall = TP / (TP + FN) — safe zero denominator
        denom_rec = tp + fn
        recall = round(tp / denom_rec, 4) if denom_rec > 0 else 0.0

        # F1-Score = 2 * (Prec * Rec) / (Prec + Rec) — safe zero denominator
        denom_f1 = precision + recall
        f1 = round((2.0 * precision * recall) / denom_f1, 4) if denom_f1 > 0 else 0.0

        # False Positive Rate = FP / (FP + TN) — safe zero denominator
        denom_fpr = fp + tn
        fpr = round(fp / denom_fpr, 4) if denom_fpr > 0 else 0.0

        # False Negative Rate = FN / (FN + TP) — safe zero denominator
        denom_fnr = fn + tp
        fnr = round(fn / denom_fnr, 4) if denom_fnr > 0 else 0.0

        # Latencies
        avg_lat = round(float(np.mean(latencies)), 2) if latencies else 0.0
        p95_lat = round(float(np.percentile(latencies, 95)), 2) if latencies else 0.0

        return ModalityMetrics(
            modality=modality_name,
            total_samples=total,
            correct_predictions=correct,
            accuracy=accuracy,
            precision=precision,
            recall=recall,
            f1_score=f1,
            false_positive_rate=fpr,
            false_negative_rate=fnr,
            avg_latency_ms=avg_lat,
            p95_latency_ms=p95_lat,
            confusion_matrix=ConfusionMatrix(
                true_positives=tp,
                true_negatives=tn,
                false_positives=fp,
                false_negatives=fn,
            ),
        )


# ---------------------------------------------------------------------------
# Phase 7 Honest Metrics Calculator
# ---------------------------------------------------------------------------

class PhaseSevenMetricsCalculator:
    """Phase 7 metrics — uses HonestMetric to distinguish measured from unavailable.

    Key design rule:
    - Zero denominator returns NOT_MEASURED, not fabricated 0 or 1
    - n < 10 attaches a small-sample warning
    - n == 0 returns NOT_MEASURED for ALL metrics
    """

    MIN_SAMPLES_FOR_RELIABLE_METRIC = 10

    @classmethod
    def compute_detection(
        cls,
        results: List[SampleEvaluationResult],
        modality_name: str = "overall",
    ) -> DetectionMetrics:
        """Compute honest detection metrics with explicit NOT_MEASURED handling."""
        n = len(results)

        if n == 0:
            reason = "No samples available for this modality"
            return DetectionMetrics(
                modality=modality_name,
                sample_count=0,
                small_sample_warning=reason,
                precision=HonestMetric.not_measured(reason),
                recall=HonestMetric.not_measured(reason),
                f1_score=HonestMetric.not_measured(reason),
                false_positive_rate=HonestMetric.not_measured(reason),
                false_negative_rate=HonestMetric.not_measured(reason),
                accuracy=HonestMetric.not_measured(reason),
                confusion_matrix=ConfusionMatrix(),
            )

        tp = 0
        tn = 0
        fp = 0
        fn = 0
        latencies = []

        for r in results:
            latencies.append(r.latency_ms)
            gt_pos = r.ground_truth_assessment in ("MALICIOUS", "SUSPICIOUS")
            pred_pos = (
                r.predicted_assessment in ("MALICIOUS", "SUSPICIOUS", "HIGH", "CRITICAL")
                or r.predicted_risk_score >= 0.50
            )
            if gt_pos and pred_pos:
                tp += 1
            elif not gt_pos and not pred_pos:
                tn += 1
            elif not gt_pos and pred_pos:
                fp += 1
            else:
                fn += 1

        cm = ConfusionMatrix(true_positives=tp, true_negatives=tn, false_positives=fp, false_negatives=fn)
        warn = f"Small evaluation sample (n={n}) — metrics may not be representative" if n < cls.MIN_SAMPLES_FOR_RELIABLE_METRIC else None

        # Precision
        denom_prec = tp + fp
        if denom_prec == 0:
            precision = HonestMetric.not_measured("No positive predictions (TP+FP=0) — precision undefined")
        else:
            precision = HonestMetric.measured(tp / denom_prec, n)

        # Recall
        denom_rec = tp + fn
        if denom_rec == 0:
            recall = HonestMetric.not_measured("No actual positives in ground truth (TP+FN=0) — recall undefined")
        else:
            recall = HonestMetric.measured(tp / denom_rec, n)

        # F1
        p_val = precision.value
        r_val = recall.value
        if p_val is None or r_val is None or (p_val + r_val) == 0:
            f1 = HonestMetric.not_measured("F1 undefined when precision or recall is not measured")
        else:
            f1 = HonestMetric.measured((2 * p_val * r_val) / (p_val + r_val), n)

        # FPR
        denom_fpr = fp + tn
        if denom_fpr == 0:
            fpr = HonestMetric.not_measured("No actual negatives in ground truth (FP+TN=0) — FPR undefined")
        else:
            fpr = HonestMetric.measured(fp / denom_fpr, n)

        # FNR
        denom_fnr = fn + tp
        if denom_fnr == 0:
            fnr = HonestMetric.not_measured("No actual positives in ground truth (FN+TP=0) — FNR undefined")
        else:
            fnr = HonestMetric.measured(fn / denom_fnr, n)

        # Accuracy
        acc = HonestMetric.measured((tp + tn) / n, n)

        # Latency
        avg_ms: Optional[float] = None
        p95_ms: Optional[float] = None
        min_ms: Optional[float] = None
        max_ms: Optional[float] = None
        if latencies:
            avg_ms = round(float(np.mean(latencies)), 2)
            p95_ms = round(float(np.percentile(latencies, 95)), 2) if n >= 2 else latencies[0]
            min_ms = round(min(latencies), 2)
            max_ms = round(max(latencies), 2)

        return DetectionMetrics(
            modality=modality_name,
            sample_count=n,
            small_sample_warning=warn,
            precision=precision,
            recall=recall,
            f1_score=f1,
            false_positive_rate=fpr,
            false_negative_rate=fnr,
            accuracy=acc,
            confusion_matrix=cm,
            avg_latency_ms=avg_ms,
            p95_latency_ms=p95_ms,
            min_latency_ms=min_ms,
            max_latency_ms=max_ms,
        )

    @classmethod
    def compute_latency_stats(
        cls,
        results: List[SampleEvaluationResult],
        modality_name: str,
    ):
        """Compute latency statistics for a group of results."""
        from app.schemas.evaluation import LatencyStats
        latencies = [r.latency_ms for r in results]
        n = len(latencies)
        if n == 0:
            return LatencyStats(
                modality=modality_name,
                sample_count=0,
                mean_ms=0.0,
                median_ms=0.0,
                p95_ms=0.0,
                min_ms=0.0,
                max_ms=0.0,
                note="No samples measured",
            )
        warn = f"n={n} — single execution, not a reliable benchmark" if n < 3 else None
        return LatencyStats(
            modality=modality_name,
            sample_count=n,
            mean_ms=round(float(np.mean(latencies)), 2),
            median_ms=round(float(statistics.median(latencies)), 2),
            p95_ms=round(float(np.percentile(latencies, 95)), 2) if n >= 2 else latencies[0],
            min_ms=round(min(latencies), 2),
            max_ms=round(max(latencies), 2),
            warm_vs_cold="NOT_DISTINGUISHED",
            note=warn,
        )

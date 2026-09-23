"""Scoring Engine for Fraud Probability and Uncertainty Estimation.

Implements Sections 7 & 8 of Member 2 handoff:
1. Strictly separates input ML risk_score from calculated fraud_probability.
2. Evaluates uncertainty independently (LOW, MEDIUM, HIGH).
3. Produces a 3-outcome verdict: FRAUD, LEGITIMATE, or UNCERTAIN.
"""

import math
from typing import Any, Dict, List, Tuple
from agent.schemas.evidence import EvidenceItem
from agent.schemas.investigation import VerdictContract, UncertaintyContract
from agent.config import settings


class ScoringEngine:
    """Computes fraud probability, uncertainty, and 3-outcome verdict."""

    @staticmethod
    def calculate(
        transaction: Dict[str, Any],
        evidence: List[EvidenceItem],
    ) -> Tuple[float, UncertaintyContract, VerdictContract]:
        """Compute (fraud_probability, uncertainty, verdict)."""
        input_risk = float(transaction.get("risk_score", 0.30))

        # 1. Evidence weight accumulation
        concern_weights = [e.weight for e in evidence if e.direction == "concern"]
        ease_weights = [e.weight for e in evidence if e.direction == "ease"]

        total_concern = sum(concern_weights)
        total_ease = sum(ease_weights)

        # Baseline logit from nominal base rate (0.15) modulated mildly by input risk_score signal
        # Notice input_risk is only one component of prior logit, NOT the verdict
        base_logit = math.log(0.20 / 0.80) + (input_risk - 0.5) * 1.2
        evidence_shift = (total_concern * 1.8) - (total_ease * 2.2)

        raw_logit = base_logit + evidence_shift
        # Sigmoid conversion
        fraud_prob = 1.0 / (1.0 + math.exp(-raw_logit))
        fraud_prob = round(max(0.01, min(0.99, fraud_prob)), 2)

        # 2. Uncertainty Assessment
        # Condition A: Conflicting evidence (strong concern AND strong ease)
        has_strong_concern = any(w >= 0.70 for w in concern_weights)
        has_strong_ease = any(w >= 0.70 for w in ease_weights)
        has_conflict = has_strong_concern and has_strong_ease

        # Condition B: Data sparsity
        total_items = len(evidence)

        # Condition C: Indeterminate probability band (0.40 - 0.65)
        is_borderline = 0.40 <= fraud_prob <= 0.65

        if has_conflict or total_items <= 1:
            uncertainty: UncertaintyContract = "HIGH"
        elif is_borderline or (total_concern > 0 and total_ease > 0):
            uncertainty = "MEDIUM"
        else:
            uncertainty = "LOW"

        # 3. Three-Outcome Model Decision (Section 8)
        # If uncertainty is HIGH or probability is borderline, verdict must be UNCERTAIN
        if uncertainty == "HIGH":
            verdict: VerdictContract = "UNCERTAIN"
        elif fraud_prob >= settings.fraud_threshold_high:
            verdict = "FRAUD"
        elif fraud_prob <= settings.legitimate_threshold_low:
            verdict = "LEGITIMATE"
        else:
            verdict = "UNCERTAIN"

        return fraud_prob, uncertainty, verdict

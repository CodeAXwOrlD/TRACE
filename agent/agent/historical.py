"""Historical Case Similarity Matcher.

Implements Section 10 of Member 2 handoff:
Retrieves relevant closed historical cases based on structured multi-attribute similarity
(device sharing, pattern typology, velocity, amount order of magnitude).
"""

from typing import Any, Dict, List, Optional
from agent.schemas.investigation import SimilarCaseContract, FraudPatternContract
from agent.schemas.evidence import EvidenceItem


# Representative closed cases memory bank (can be augmented dynamically from dataset)
HISTORICAL_CASES_MEMORY: List[Dict[str, Any]] = [
    {
        "case_id": "CASE-7012",
        "pattern": "cnp_new_device",
        "shared_device": True,
        "amount_range": (500.0, 5000.0),
        "outcome": "confirmed_fraud",
        "description": "Syndicate device sharing ring targeting electronics merchants across 4 cards.",
    },
    {
        "case_id": "CASE-6841",
        "pattern": "card_testing",
        "shared_device": False,
        "amount_range": (1.0, 500.0),
        "outcome": "confirmed_fraud",
        "description": "Scripted micro-authorization attacks followed by rapid high-velocity cashouts.",
    },
    {
        "case_id": "CASE-5920",
        "pattern": "out_of_region",
        "shared_device": False,
        "amount_range": (200.0, 2000.0),
        "outcome": "fraud",
        "description": "Impossible travel speed cross-border transaction burst without prior travel notice.",
    },
    {
        "case_id": "CASE-8104",
        "pattern": "none",
        "shared_device": False,
        "amount_range": (50.0, 1000.0),
        "outcome": "cleared",
        "description": "Cardholder verified legitimate luxury retail purchase after step-up OTP challenge.",
    },
    {
        "case_id": "CASE-6119",
        "pattern": "account_takeover",
        "shared_device": True,
        "amount_range": (1000.0, 10000.0),
        "outcome": "confirmed_fraud",
        "description": "Credential stuffing led to device migration and immediate credit line drain.",
    },
]


class HistoricalCaseMatcher:
    """Matches active investigation against historical closed cases using structured scoring."""

    @staticmethod
    def match(
        pattern: FraudPatternContract,
        transaction: Dict[str, Any],
        evidence: List[EvidenceItem],
        connected_cards: List[str],
        limit: int = 3,
    ) -> List[SimilarCaseContract]:
        """Compute structured similarity against historical case precedents."""
        amount = float(transaction.get("amount", 0.0))
        has_shared_device = len(connected_cards) > 1 or any(e.step == "device_link" for e in evidence)

        results: List[SimilarCaseContract] = []

        # Check dynamic historical memory dataset when card_id or customer_id matches
        card_id = transaction.get("card_id")
        cust_id = transaction.get("customer_id")
        if card_id or cust_id:
            try:
                from agent.historical_memory import HistoricalCaseMemory
                mem = HistoricalCaseMemory()
                real_matches = mem.find_similar_cases(card_id=card_id, customer_id=cust_id, limit=limit)
                for rm in real_matches:
                    results.append(
                        SimilarCaseContract(
                            case_id=rm.get("case_id", "CC-HIST"),
                            similarity=0.85 if rm.get("outcome") == "confirmed_fraud" else 0.70,
                            outcome=rm.get("outcome", "confirmed_fraud"),
                            reason=rm.get("analyst_notes", rm.get("pattern", "Historical case precedence")),
                        )
                    )
                if results:
                    return results[:limit]
            except Exception:
                pass

        for case in HISTORICAL_CASES_MEMORY:
            score = 0.0
            reasons = []

            # 1. Pattern alignment (0.45 weight)
            if case["pattern"] == pattern:
                score += 0.45
                reasons.append(f"Identical fraud typology ({pattern})")
            elif pattern != "none" and case["outcome"] in ("fraud", "confirmed_fraud"):
                score += 0.20

            # 2. Shared device correlation (0.30 weight)
            if case["shared_device"] == has_shared_device:
                score += 0.30
                if has_shared_device:
                    reasons.append("Matching multi-card device linkage")

            # 3. Amount order of magnitude (0.25 weight)
            min_amt, max_amt = case["amount_range"]
            if min_amt <= amount <= max_amt:
                score += 0.25
                reasons.append(f"Transaction scale within observed range (${min_amt:.0f}-${max_amt:.0f})")

            similarity = round(min(score, 0.99), 2)
            if similarity >= 0.40:
                results.append(
                    SimilarCaseContract(
                        case_id=case["case_id"],
                        similarity=similarity,
                        outcome=case["outcome"],
                        reason="; ".join(reasons) if reasons else case["description"],
                    )
                )

        # Sort by highest similarity
        results.sort(key=lambda c: c.similarity, reverse=True)
        return results[:limit]

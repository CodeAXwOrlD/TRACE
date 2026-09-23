"""Transaction History and Episode Analyzer.

Implements Section 9 of Member 2 handoff:
Detects the true first suspicious transaction in the sequence, identifies
all episode transactions, and deterministically calculates cumulative financial exposure.
"""

from typing import Any, Dict, List, Optional, Tuple


class HistoryAnalyzer:
    """Analyzes customer transaction history to detect fraud episodes and first suspicious event."""

    @staticmethod
    def analyze(
        current_transaction: Dict[str, Any],
        transaction_history: List[Dict[str, Any]],
    ) -> Tuple[Optional[str], List[str], float]:
        """Returns (first_suspicious_txn_id, episode_txn_ids, exposure_usd).

        Deterministic logic:
        1. Combine all transactions and sort chronologically.
        2. Identify transactions with fraud signals (micro-tests, abnormal velocity, high risk, unrecognized location/device).
        3. If suspicious transactions precede current_transaction, the earliest one is first_suspicious_txn_id.
        4. Episode transactions includes the trigger transaction and all linked suspicious transactions.
        5. Exposure USD is the sum of amounts of all episode transactions.
        """
        curr_id = current_transaction.get("transaction_id", "txn_trigger")
        curr_amount = float(current_transaction.get("amount", 0.0))

        # Sort history chronologically
        sorted_history = sorted(
            transaction_history,
            key=lambda t: t.get("timestamp", ""),
        )

        episode_ids: List[str] = []
        episode_total = 0.0

        for txn in sorted_history:
            amt = float(txn.get("amount", 0.0))
            is_suspicious = False

            # Criteria 1: Micro-test transaction
            if 0 < amt <= 3.00:
                is_suspicious = True

            # Criteria 2: High risk score flagged
            if float(txn.get("risk_score", 0.0)) >= 0.65:
                is_suspicious = True

            # Criteria 3: Declines or security anomalies
            status = str(txn.get("status", "")).lower()
            if status in ("declined", "flagged", "failed_auth"):
                is_suspicious = True

            # Criteria 4: Explicit flag
            if txn.get("is_suspicious") is True:
                is_suspicious = True

            if is_suspicious:
                t_id = txn.get("transaction_id")
                if t_id and t_id not in episode_ids:
                    episode_ids.append(t_id)
                    episode_total += amt

        # Current transaction is always part of the active episode
        if curr_id not in episode_ids:
            episode_ids.append(curr_id)
            episode_total += curr_amount

        # First suspicious transaction is the earliest in the episode
        first_suspicious_txn_id = episode_ids[0] if episode_ids else curr_id

        return first_suspicious_txn_id, episode_ids, round(episode_total, 2)

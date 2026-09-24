import os
import json
import logging
import polars as pl
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

class HistoricalCaseMemory:
    """Indexed memory for closed fraud cases."""

    def __init__(self, history_csv_path: str = "data/raw/closed_cases_history.csv"):
        self.csv_path = history_csv_path
        self._cases_df = None
        self._load()

    def _load(self):
        if not os.path.exists(self.csv_path):
            logger.warning(f"History file not found at {self.csv_path}")
            return
        try:
            self._cases_df = pl.read_csv(self.csv_path)
            logger.info(f"Loaded {len(self._cases_df)} closed historical cases.")
        except Exception as e:
            logger.error(f"Failed to load historical cases: {e}")

    def find_similar_cases(self, card_id: Optional[str] = None, customer_id: Optional[str] = None, limit: int = 5) -> List[Dict[str, Any]]:
        """Retrieve similar past cases by customer, card, or pattern."""
        if self._cases_df is None or len(self._cases_df) == 0:
            return []

        df = self._cases_df
        if customer_id:
            matched = df.filter(pl.col("customer_id") == customer_id)
            if len(matched) > 0:
                return matched.head(limit).to_dicts()

        if card_id:
            matched = df.filter(pl.col("card_id") == card_id)
            if len(matched) > 0:
                return matched.head(limit).to_dicts()

        return df.head(limit).to_dicts()

"""TigerGraph Fraud Case Graph Tools.

Directly maps to the schema created in TigerGraph Savanna 'FraudCaseGraph':
- Vertices: CaseRecord, Transaction, Customer, Card, Identity, TransactionDetail
- Edges:
  CaseRecord -(involves_card)-> Card
  CaseRecord -(involves_customer)-> Customer
  CaseRecord -(flags_transaction)-> Transaction (Undirected)
  CaseRecord -(first_fraud_transaction)-> Transaction
  Transaction -(transaction_detail)-> TransactionDetail
  Transaction -(transaction_identity)-> Identity
"""

import os
import logging
from typing import Dict, Any, List, Optional
from .tigergraph_mcp import TigerGraphMCPToolClient

logger = logging.getLogger(__name__)

class FraudCaseGraphTools:
    """Tools for querying and updating FraudCaseGraph in TigerGraph."""

    def __init__(self, client: Optional[TigerGraphMCPToolClient] = None):
        self.client = client or TigerGraphMCPToolClient()

    def get_case_record(self, case_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve CaseRecord vertex by ID."""
        conn = self.client.get_connection()
        if not conn:
            return None
        try:
            res = conn.getVerticesById("CaseRecord", case_id)
            return res[0]["attributes"] if res else None
        except Exception as e:
            logger.warning(f"Failed to fetch CaseRecord {case_id}: {e}")
            return None

    def get_transaction(self, transaction_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve Transaction vertex by ID."""
        conn = self.client.get_connection()
        if not conn:
            return None
        try:
            res = conn.getVerticesById("Transaction", str(transaction_id))
            return res[0]["attributes"] if res else None
        except Exception as e:
            logger.warning(f"Failed to fetch Transaction {transaction_id}: {e}")
            return None

    def get_connected_card_and_customer(self, case_id: str) -> Dict[str, Any]:
        """Traverse CaseRecord -> Card and CaseRecord -> Customer edges."""
        conn = self.client.get_connection()
        if not conn:
            return {"cards": [], "customers": []}
        try:
            edges = conn.getEdges("CaseRecord", case_id)
            cards = [e["to_id"] for e in edges if e.get("e_type") == "involves_card"]
            customers = [e["to_id"] for e in edges if e.get("e_type") == "involves_customer"]
            return {"cards": cards, "customers": customers}
        except Exception as e:
            logger.warning(f"Failed to traverse edges for case {case_id}: {e}")
            return {"cards": [], "customers": []}

    def write_case_to_graph(
        self,
        case_id: str,
        verdict: str,
        fraud_probability: float,
        pattern: str,
        first_suspicious_txn_id: Optional[str] = None,
        transaction_id: Optional[str] = None,
        card_id: Optional[str] = None,
        customer_id: Optional[str] = None,
    ) -> bool:
        """Upsert CaseRecord vertex and write links into FraudCaseGraph."""
        conn = self.client.get_connection()
        if not conn:
            logger.info(f"TigerGraph cluster offline/paused: Case {case_id} verdict saved locally.")
            return False
        try:
            # 1. Upsert CaseRecord vertex
            vertex_data = {
                case_id: {
                    "verdict": verdict,
                    "fraud_probability": fraud_probability,
                    "pattern": pattern,
                }
            }
            conn.upsertVertices("CaseRecord", vertex_data)

            # 2. Upsert edges if entities provided
            if card_id:
                conn.upsertEdge("CaseRecord", case_id, "involves_card", "Card", card_id)
            if customer_id:
                conn.upsertEdge("CaseRecord", case_id, "involves_customer", "Customer", customer_id)
            if transaction_id:
                conn.upsertEdge("CaseRecord", case_id, "flags_transaction", "Transaction", str(transaction_id))
            if first_suspicious_txn_id:
                conn.upsertEdge("CaseRecord", case_id, "first_fraud_transaction", "Transaction", str(first_suspicious_txn_id))
            logger.info(f"Successfully wrote case {case_id} to TigerGraph Savanna FraudCaseGraph.")
            return True
        except Exception as e:
            logger.warning(f"Failed writing case {case_id} to TigerGraph: {e}")
            return False

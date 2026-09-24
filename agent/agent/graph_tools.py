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

    def get_case_subgraph(self, case_id: str) -> Optional[Dict[str, Any]]:
        """Query live TigerGraph Savanna FraudCaseGraph directly for the Sigma.js subgraph contract."""
        conn = self.client.get_connection()
        if not conn:
            return None
        try:
            nodes = []
            edges = []
            seen_nodes = set()

            # 1. Fetch CaseRecord vertex from TigerGraph
            case_records = conn.getVerticesById("CaseRecord", case_id)
            if not case_records:
                return None
            case_attr = case_records[0].get("attributes", {})
            nodes.append({
                "id": f"case-{case_id}",
                "type": "case",
                "label": case_id,
                "meta": {
                    "caseId": case_id,
                    "verdict": case_attr.get("verdict", "pending"),
                    "fraudProbability": case_attr.get("fraud_probability", 0.0),
                    "pattern": case_attr.get("pattern", "unknown"),
                    "source": "tigergraph",
                }
            })
            seen_nodes.add(f"case-{case_id}")

            # 2. Fetch edges from CaseRecord
            case_edges = conn.getEdges("CaseRecord", case_id)
            for e in case_edges:
                target_id = str(e.get("to_id", ""))
                e_type = e.get("e_type", "")

                if e_type == "involves_customer":
                    node_id = f"cust-{target_id}"
                    if node_id not in seen_nodes:
                        nodes.append({
                            "id": node_id,
                            "type": "customer",
                            "label": target_id,
                            "meta": {"customerId": target_id, "source": "tigergraph"}
                        })
                        seen_nodes.add(node_id)
                    edges.append({
                        "id": f"e-case-{case_id}-{node_id}",
                        "source": f"case-{case_id}",
                        "target": node_id,
                        "type": "involves_customer",
                        "label": "involves_customer"
                    })

                elif e_type == "involves_card":
                    node_id = f"card-{target_id}"
                    if node_id not in seen_nodes:
                        nodes.append({
                            "id": node_id,
                            "type": "card",
                            "label": target_id,
                            "meta": {"cardId": target_id, "source": "tigergraph"}
                        })
                        seen_nodes.add(node_id)
                    edges.append({
                        "id": f"e-case-{case_id}-{node_id}",
                        "source": f"case-{case_id}",
                        "target": node_id,
                        "type": "involves_card",
                        "label": "involves_card"
                    })

                elif e_type in ("flags_transaction", "first_fraud_transaction"):
                    node_id = f"txn-{target_id}"
                    if node_id not in seen_nodes:
                        txn_v = conn.getVerticesById("Transaction", target_id)
                        txn_attr = txn_v[0].get("attributes", {}) if txn_v else {}
                        nodes.append({
                            "id": node_id,
                            "type": "transaction",
                            "label": f"${txn_attr.get('TransactionAmt', 0):.2f}" if 'TransactionAmt' in txn_attr else target_id,
                            "meta": {
                                "transactionId": target_id,
                                "amount": txn_attr.get("TransactionAmt", 0.0),
                                "riskScore": txn_attr.get("risk_score", 0.0),
                                "source": "tigergraph",
                            }
                        })
                        seen_nodes.add(node_id)
                    edges.append({
                        "id": f"e-case-{case_id}-{node_id}",
                        "source": f"case-{case_id}",
                        "target": node_id,
                        "type": e_type,
                        "label": e_type
                    })

            if len(nodes) > 1:
                return {
                    "nodes": nodes,
                    "edges": edges,
                    "source": "tigergraph",
                }
            return None
        except Exception as e:
            logger.warning(f"TigerGraph get_case_subgraph failed for {case_id}: {e}")
            return None

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

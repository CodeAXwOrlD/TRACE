"""Graph API router for TRACE.

Provides bounded subgraph representation (<= 200 nodes) for Sigma.js visualization,
linking customers, payment cards, transactions, shared devices, and historical cases.
"""

from fastapi import APIRouter
from typing import Dict, Any

from agent.graph_tools import FraudCaseGraphTools
from ..data.dataset_loader import build_case_graph

router = APIRouter()
_graph_tools = FraudCaseGraphTools()


@router.get("/graph/{case_id}")
async def get_case_graph(case_id: str) -> Dict[str, Any]:
    """Return interactive graph contract with nodes and edges.
    Queries live TigerGraph Savanna FraudCaseGraph first; seamlessly falls back to
    dataset graph if TigerGraph is unreachable/paused or vertex not yet written.
    """
    # 1. Direct TigerGraph query path
    try:
        tg_subgraph = _graph_tools.get_case_subgraph(case_id)
        if tg_subgraph and tg_subgraph.get("nodes"):
            return tg_subgraph
    except Exception:
        pass

    # 2. Benchmark dataset graph path
    return build_case_graph(case_id)


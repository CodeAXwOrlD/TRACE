"""Graph API router for TRACE.

Provides bounded subgraph representation (<= 200 nodes) for Sigma.js visualization,
linking customers, payment cards, transactions, shared devices, and historical cases.
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any

from agent.graph_tools import FraudCaseGraphTools
from ..data.dataset_loader import build_case_graph
from ..graph.client import client

router = APIRouter()
_graph_tools = FraudCaseGraphTools()


@router.get("/graph/{case_id}")
async def get_case_graph(case_id: str) -> Dict[str, Any]:
    """Return interactive graph contract with nodes and edges.
    Reads TigerGraph when available. Dataset topology is clearly labelled and is
    forbidden in REAL_MODE, so it can never be mistaken for a live graph.
    """
    # 1. Direct TigerGraph query path
    try:
        tg_subgraph = _graph_tools.get_case_subgraph(case_id)
        if tg_subgraph and tg_subgraph.get("nodes"):
            client.mark_connected()
            tg_subgraph["source"] = "tigergraph"
            tg_subgraph["graph_status"] = "CONNECTED"
            return tg_subgraph
    except Exception:
        pass

    # 2. Benchmark dataset graph path, explicitly degraded.
    if client.real_mode:
        raise HTTPException(
            status_code=503,
            detail="TIGERGRAPH_UNAVAILABLE: REAL_MODE does not permit dataset graph fallback.",
        )
    graph = build_case_graph(case_id)
    graph["source"] = "dataset"
    graph["graph_status"] = "OFFLINE"
    return graph

"""Graph API router for TRACE.

Provides bounded subgraph representation (<= 200 nodes) for Sigma.js visualization,
linking customers, payment cards, transactions, shared devices, and historical cases.
"""

from fastapi import APIRouter
from typing import Dict, Any

from ..data.dataset_loader import build_case_graph

router = APIRouter()


@router.get("/graph/{case_id}")
async def get_case_graph(case_id: str) -> Dict[str, Any]:
    """Return interactive graph contract with nodes and edges."""
    return build_case_graph(case_id)


from fastapi import APIRouter

from ..schemas.graph import InvestigationGraphData

router = APIRouter()

@router.get("/graph/{case_id}", response_model=InvestigationGraphData)
async def get_graph(case_id: str):
    # Mock response
    return InvestigationGraphData(
        nodes=[],
        edges=[]
    )

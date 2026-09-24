from fastapi import APIRouter, HTTPException
from typing import List

from ..schemas.case import Case, EvidenceRequest, CloseCaseRequest

router = APIRouter()

@router.get("/cases", response_model=List[Case])
async def list_cases():
    # Return mock cases for now
    return []

@router.get("/cases/{id}", response_model=Case)
async def get_case(id: str):
    raise HTTPException(status_code=404, detail="CASE_NOT_FOUND")

@router.post("/cases/{id}/evidence")
async def add_evidence(id: str, request: EvidenceRequest):
    return {"status": "success", "message": "Evidence added."}

@router.post("/cases/{id}/close")
async def close_case(id: str, request: CloseCaseRequest):
    return {"status": "success", "message": "Case closed."}

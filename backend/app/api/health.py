from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime, timezone
import os
from dotenv import load_dotenv
from app.graph.client import client

load_dotenv()

router = APIRouter()

class HealthResponse(BaseModel):
    status: str
    frontend: str
    fastapi: str
    tigergraph: str
    agent: str
    llm: str
    dataset: str
    timestamp: str

@router.get("/health", response_model=HealthResponse)
async def get_health():
    return HealthResponse(
        status="ok",
        frontend="online",
        fastapi="online",
        tigergraph=client.get_status(),
        agent="ready",
        llm="ready",
        dataset="loaded",
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


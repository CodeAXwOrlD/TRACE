from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime, timezone
import os
from dotenv import load_dotenv
from ..graph.client import client

load_dotenv()

router = APIRouter()

class HealthResponse(BaseModel):
    status: str
    frontend: str
    fastapi: str
    tigergraph: str
    graph_connection_state: str
    graph_mode: str
    agent: str
    llm: str
    dataset: str
    timestamp: str

@router.get("/health", response_model=HealthResponse)
async def get_health():
    graph_status = client.get_status()
    return HealthResponse(
        status="degraded" if client.real_mode and graph_status != "connected" else "ok",
        frontend="online",
        fastapi="online",
        tigergraph=graph_status,
        graph_connection_state="CONNECTED" if graph_status == "connected" else "OFFLINE",
        graph_mode="REAL" if client.real_mode else "DATASET_FALLBACK_ALLOWED",
        agent="ready",
        llm="ready",
        dataset="loaded",
        timestamp=datetime.now(timezone.utc).isoformat(),
    )

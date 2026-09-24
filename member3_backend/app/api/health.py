from fastapi import APIRouter
from pydantic import BaseModel
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

class HealthResponse(BaseModel):
    api: str
    graph: str
    dataset: str
    agent: str

@router.get("/health", response_model=HealthResponse)
async def get_health():
    mock_mode = os.environ.get("BACKEND_MOCK_MODE", "false").lower() == "true"
    
    return HealthResponse(
        api="ok",
        graph="ok" if not mock_mode else "mocked",
        dataset="loaded" if not mock_mode else "mocked",
        agent="ready" if not mock_mode else "mocked",
    )

"""TRACE Agent Configuration.

Handles environment variables, LLM provider configuration, mock mode,
and scoring thresholds for the TRACE fraud investigation system.
"""

from typing import Literal
import os
from pydantic_settings import BaseSettings
from pydantic import Field


class AgentSettings(BaseSettings):
    """Runtime configuration for TRACE Agent Layer."""

    # Provider and Mock Mode
    ai_mock_mode: bool = Field(
        default=False,
        validation_alias="AI_MOCK_MODE",
        description="When true, uses deterministic mock reasoning without external LLM calls.",
    )
    ai_provider: Literal["mock", "gemini", "groq"] = Field(
        default="groq",
        validation_alias="AI_PROVIDER",
        description="LLM provider: 'mock', 'gemini', or 'groq'.",
    )

    # API Keys & Models
    gemini_api_key: str = Field(
        default="",
        validation_alias="GEMINI_API_KEY",
        description="Google Gemini API Key.",
    )
    gemini_model: str = Field(
        default="gemini-1.5-flash",
        validation_alias="GEMINI_MODEL",
    )

    groq_api_key: str = Field(
        default="",
        validation_alias="GROQ_API_KEY",
        description="Groq Cloud API Key.",
    )
    groq_model: str = Field(
        default="openai/gpt-oss-20b",
        validation_alias="GROQ_MODEL",
    )

    # Scoring & Verdict Thresholds
    fraud_threshold_high: float = Field(
        default=0.70,
        description="Probability at or above which verdict becomes FRAUD (unless uncertainty is HIGH).",
    )
    legitimate_threshold_low: float = Field(
        default=0.30,
        description="Probability at or below which verdict becomes LEGITIMATE (unless uncertainty is HIGH).",
    )

    class Config:
        env_file = ["backend/.env", ".env"]
        extra = "ignore"


# Global singleton settings instance
settings = AgentSettings()

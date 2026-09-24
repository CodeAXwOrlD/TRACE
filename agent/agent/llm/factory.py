"""LLM Provider Factory.

Dynamically selects and configures the LLM provider based on AgentSettings.
Ensures zero-coupling and seamless switching between Mock, Gemini, and Groq.
"""

import logging
from agent.config import settings
from agent.llm.base import BaseLLMProvider
from agent.llm.mock import MockLLMProvider
from agent.llm.gemini import GeminiProvider
from agent.llm.groq import GroqProvider

logger = logging.getLogger(__name__)


def get_llm_provider() -> BaseLLMProvider:
    """Return the configured real LLM provider according to environment settings."""
    if settings.ai_mock_mode:
        logger.info("Using MockLLMProvider (AI_MOCK_MODE=true explicitly configured)")
        return MockLLMProvider()

    provider = settings.ai_provider.lower()

    if provider == "groq":
        if not settings.groq_api_key:
            raise ValueError("GROQ_API_KEY is not configured in backend/.env. Real LLM inference requires a valid GROQ_API_KEY.")
        return GroqProvider(api_key=settings.groq_api_key, model=settings.groq_model)

    if provider == "gemini":
        if not settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY is not configured in backend/.env. Real LLM inference requires a valid GEMINI_API_KEY.")
        return GeminiProvider(api_key=settings.gemini_api_key, model=settings.gemini_model)

    if provider == "mock":
        return MockLLMProvider()

    raise ValueError(f"Unsupported AI provider '{provider}'. Must be 'groq' or 'gemini'.")

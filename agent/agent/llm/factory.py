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
    """Return the configured LLM provider according to environment settings."""
    if settings.ai_mock_mode:
        logger.info("Using MockLLMProvider (AI_MOCK_MODE=true)")
        return MockLLMProvider()

    provider = settings.ai_provider.lower()

    if provider == "gemini":
        if not settings.gemini_api_key:
            logger.warning("GEMINI_API_KEY missing, falling back to MockLLMProvider.")
            return MockLLMProvider()
        return GeminiProvider(api_key=settings.gemini_api_key, model=settings.gemini_model)

    if provider == "groq":
        if not settings.groq_api_key:
            logger.warning("GROQ_API_KEY missing, falling back to MockLLMProvider.")
            return MockLLMProvider()
        return GroqProvider(api_key=settings.groq_api_key, model=settings.groq_model)

    return MockLLMProvider()

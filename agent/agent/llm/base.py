"""Abstract Base Class for LLM Providers.

Implements Section 14 of the Member 2 handoff:
Decouples agent reasoning from specific LLM providers.
"""

from abc import ABC, abstractmethod
from typing import Optional, Type, TypeVar
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class BaseLLMProvider(ABC):
    """Abstract interface for LLM completion and structured output."""

    @abstractmethod
    def generate_text(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        """Generate unstructured text from prompt."""
        pass

    @abstractmethod
    def generate_structured(
        self,
        prompt: str,
        response_model: Type[T],
        system_prompt: Optional[str] = None,
    ) -> T:
        """Generate validated Pydantic model response with automatic retry on malformed JSON."""
        pass

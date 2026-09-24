"""Groq Cloud LLM Provider implementation.

Uses Groq's high-speed inference API with structured JSON output and automatic retry.
"""

import json
import logging
from typing import Optional, Type, TypeVar
import requests
from pydantic import BaseModel, ValidationError

from agent.llm.base import BaseLLMProvider

T = TypeVar("T", bound=BaseModel)
logger = logging.getLogger(__name__)


class GroqProvider(BaseLLMProvider):
    """Groq Cloud completion and structured output provider."""

    def __init__(self, api_key: str, model: str = "llama-3.3-70b-versatile"):
        self.api_key = api_key
        self.model = model
        self.endpoint = "https://api.groq.com/openai/v1/chat/completions"

    def _call_groq_api(self, prompt: str, system_prompt: Optional[str] = None, json_mode: bool = False) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.1,
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        response = requests.post(self.endpoint, headers=headers, json=payload, timeout=30)
        if response.status_code != 200:
            raise RuntimeError(f"Groq API error ({response.status_code}): {response.text}")

        data = response.json()
        try:
            return data["choices"][0]["message"]["content"]
        except (KeyError, IndexError) as err:
            raise RuntimeError(f"Unexpected Groq response structure: {data}") from err

    def generate_text(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        return self._call_groq_api(prompt, system_prompt, json_mode=False)

    def generate_structured(
        self,
        prompt: str,
        response_model: Type[T],
        system_prompt: Optional[str] = None,
    ) -> T:
        """Call Groq with JSON response mode, Pydantic validation, and 1 retry on error."""
        schema_json = json.dumps(response_model.model_json_schema(), indent=2)
        full_prompt = (
            f"{prompt}\n\n"
            f"You MUST respond ONLY with a valid JSON object containing your actual generated values (do not output the schema itself) matching this schema:\n"
            f"```json\n{schema_json}\n```\n"
            f"Fill in all required fields with concrete analysis values. Do not include markdown ticks or any explanation outside JSON."
        )

        # Attempt 1
        raw_text = self._call_groq_api(full_prompt, system_prompt, json_mode=True)
        try:
            clean_text = raw_text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            data = json.loads(clean_text)
            return response_model.model_validate(data)
        except (json.JSONDecodeError, ValidationError) as e:
            logger.warning("Groq structured parsing attempt 1 failed: %s. Retrying once.", e)

            # Retry with error feedback
            retry_prompt = (
                f"{full_prompt}\n\n"
                f"Your previous output failed validation with error: {str(e)}.\n"
                f"Previous output was:\n{raw_text}\n"
                f"Fix the JSON syntax and schema compliance immediately."
            )
            raw_text = self._call_groq_api(retry_prompt, system_prompt, json_mode=True)
            clean_text = raw_text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            data = json.loads(clean_text)
            return response_model.model_validate(data)

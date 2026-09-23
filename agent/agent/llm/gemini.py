"""Google Gemini LLM Provider implementation.

Uses the Gemini API with structured JSON output and automatic retry on malformed responses.
"""

import json
import logging
from typing import Optional, Type, TypeVar
import requests
from pydantic import BaseModel, ValidationError

from agent.llm.base import BaseLLMProvider

T = TypeVar("T", bound=BaseModel)
logger = logging.getLogger(__name__)


class GeminiProvider(BaseLLMProvider):
    """Google Gemini completion and structured output provider."""

    def __init__(self, api_key: str, model: str = "gemini-1.5-flash"):
        self.api_key = api_key
        self.model = model
        self.endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"

    def _call_gemini_api(self, prompt: str, system_prompt: Optional[str] = None, json_mode: bool = False) -> str:
        url = f"{self.endpoint}?key={self.api_key}"
        headers = {"Content-Type": "application/json"}

        contents = []
        if system_prompt:
            contents.append({"role": "user", "parts": [{"text": f"SYSTEM INSTRUCTIONS:\n{system_prompt}"}]})
            contents.append({"role": "model", "parts": [{"text": "Understood. I will strictly follow these instructions."}]})

        contents.append({"role": "user", "parts": [{"text": prompt}]})

        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.1,
            },
        }
        if json_mode:
            payload["generationConfig"]["response_mime_type"] = "application/json"

        response = requests.post(url, headers=headers, json=payload, timeout=30)
        if response.status_code != 200:
            raise RuntimeError(f"Gemini API error ({response.status_code}): {response.text}")

        data = response.json()
        try:
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError) as err:
            raise RuntimeError(f"Unexpected Gemini response structure: {data}") from err

    def generate_text(self, prompt: str, system_prompt: Optional[str] = None) -> str:
        return self._call_gemini_api(prompt, system_prompt, json_mode=False)

    def generate_structured(
        self,
        prompt: str,
        response_model: Type[T],
        system_prompt: Optional[str] = None,
    ) -> T:
        """Call Gemini in JSON mode with Pydantic validation and 1 automatic retry on error."""
        schema_json = json.dumps(response_model.model_json_schema(), indent=2)
        full_prompt = (
            f"{prompt}\n\n"
            f"You MUST respond ONLY with a valid JSON object matching this schema:\n"
            f"```json\n{schema_json}\n```\n"
            f"Do not include any conversational preamble or markdown backticks around the json."
        )

        # Attempt 1
        raw_text = self._call_gemini_api(full_prompt, system_prompt, json_mode=True)
        try:
            clean_text = raw_text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            data = json.loads(clean_text)
            return response_model.model_validate(data)
        except (json.JSONDecodeError, ValidationError) as e:
            logger.warning("Gemini structured parsing attempt 1 failed: %s. Retrying once.", e)

            # Retry with error feedback
            retry_prompt = (
                f"{full_prompt}\n\n"
                f"Your previous output failed validation with error: {str(e)}.\n"
                f"Previous output was:\n{raw_text}\n"
                f"Fix the JSON syntax and schema compliance immediately."
            )
            raw_text = self._call_gemini_api(retry_prompt, system_prompt, json_mode=True)
            clean_text = raw_text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            data = json.loads(clean_text)
            return response_model.model_validate(data)

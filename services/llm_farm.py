"""LLM Farm service for multi-model AI chat with OpenRouter integration.

This service provides access to multiple AI models through OpenRouter API,
enabling chat functionality with various LLMs in a unified interface.
"""

import json
from collections.abc import AsyncIterator
from typing import Any

import httpx
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Chat request model for LLM Farm.

    Attributes:
        message: User's input message for the AI model.
        model: AI model identifier from OpenRouter.
    """
    message: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="User message for the AI model",
    )
    model: str = Field(
        default="openai/gpt-4o-mini",
        description="AI model identifier from OpenRouter",
    )


class ChatResponse(BaseModel):
    """Chat response model for LLM Farm.

    Attributes:
        message: AI-generated response in markdown format.
        model: AI model that generated the response.
    """
    message: str = Field(..., description="AI response in markdown format")
    model: str = Field(..., description="Model used for response")


class LLMFarmService:
    """Service for LLM Farm multi-model chat functionality."""

    def __init__(self, api_key: str, base_url: str = "https://openrouter.ai/api/v1"):
        """Initialize LLM Farm service.

        Args:
            api_key: OpenRouter API key.
            base_url: OpenRouter API base URL.
        """
        self.api_key = api_key
        self.base_url = base_url

    async def call_openrouter(self, message: str, model: str) -> dict[str, str]:
        """Call OpenRouter API to generate AI response.

        Args:
            message: User's input message.
            model: AI model identifier.

        Returns:
            Dictionary containing the AI response and model used.

        Raises:
            httpx.HTTPStatusError: If API request fails.
            Exception: For other unexpected errors.
        """
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": message}],
                },
                timeout=60.0,
            )
            response.raise_for_status()
            data = response.json()

            ai_message = data["choices"][0]["message"]["content"]
            return {"message": ai_message, "model": model}

    async def stream_openrouter(
        self, message: str, model: str
    ) -> AsyncIterator[dict[str, str]]:
        """Stream AI responses from OpenRouter API.

        Args:
            message: User's input message.
            model: AI model identifier.

        Yields:
            Dictionary chunks containing partial AI responses.

        Raises:
            httpx.HTTPStatusError: If API request fails.
            Exception: For other unexpected errors.
        """
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream(
                "POST",
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": message}],
                    "stream": True,
                },
            ) as response:
                response.raise_for_status()

                async for line in response.aiter_lines():
                    if not line.strip() or line.startswith(":"):
                        continue

                    if line.startswith("data: "):
                        data_str = line[6:]

                        if data_str.strip() == "[DONE]":
                            break

                        try:
                            data = json.loads(data_str)
                            delta = data["choices"][0].get("delta", {})
                            content = delta.get("content", "")

                            if content:
                                yield {"content": content, "model": model}
                        except (json.JSONDecodeError, KeyError, IndexError):
                            continue

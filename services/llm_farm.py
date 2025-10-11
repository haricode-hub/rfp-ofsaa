"""LLM Farm service for multi-model AI chat with OpenRouter integration.

This service provides access to multiple AI models through OpenRouter API,
enabling chat functionality with various LLMs in a unified interface.
Includes optional web search integration using Smithery.ai Exa search.
"""

import json
import os
from collections.abc import AsyncIterator
from datetime import datetime
from typing import Any

import httpx
from pydantic import BaseModel, Field


class DocumentAttachment(BaseModel):
    """Document attachment model for LLM Farm.

    Attributes:
        filename: Name of the uploaded document.
        file_type: File extension/type.
        file_size: Size of the file in bytes.
        extracted_text: Text content extracted from the document.
        upload_timestamp: When the document was uploaded.
    """
    filename: str = Field(..., description="Document filename")
    file_type: str = Field(..., description="File extension/type")
    file_size: int = Field(..., description="File size in bytes")
    extracted_text: str = Field(..., description="Extracted text content")
    upload_timestamp: datetime = Field(
        default_factory=datetime.now,
        description="Upload timestamp"
    )


class ChatRequest(BaseModel):
    """Chat request model for LLM Farm.

    Attributes:
        message: User's input message for the AI model.
        model: AI model identifier from OpenRouter.
        documents: Optional list of document attachments.
        enable_web_search: Enable web search for additional context.
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
    documents: list[DocumentAttachment] | None = Field(
        default=None,
        description="Optional document attachments"
    )
    enable_web_search: bool = Field(
        default=False,
        description="Enable web search for additional context"
    )


class WebSearchSource(BaseModel):
    """Web search source citation.

    Attributes:
        title: Title of the web page.
        url: URL of the source.
    """
    title: str = Field(..., description="Title of the web page")
    url: str = Field(..., description="URL of the source")


class ChatResponse(BaseModel):
    """Chat response model for LLM Farm.

    Attributes:
        message: AI-generated response in markdown format.
        model: AI model that generated the response.
        sources: Optional list of web search sources used.
    """
    message: str = Field(..., description="AI response in markdown format")
    model: str = Field(..., description="Model used for response")
    sources: list[WebSearchSource] | None = Field(
        default=None,
        description="Web search sources used (if web search was enabled)"
    )


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

        # Smithery credentials for web search
        self.smithery_api_key = os.getenv("SMITHERY_API_KEY", "")
        self.smithery_profile = os.getenv("SMITHERY_PROFILE", "")

    async def _web_search(self, query: str, max_results: int = 5) -> list[dict[str, str]]:
        """Perform web search using Smithery.ai Exa search.

        Args:
            query: Search query.
            max_results: Maximum number of results to return.

        Returns:
            List of search results with title, url, and text.
        """
        if not self.smithery_api_key or not self.smithery_profile:
            return []

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    "https://api.smithery.ai/v1/search",
                    headers={
                        "Authorization": f"Bearer {self.smithery_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "profile": self.smithery_profile,
                        "query": query,
                        "num_results": max_results,
                        "search_type": "auto",
                    }
                )

                if response.status_code == 200:
                    data = response.json()
                    results = []

                    for item in data.get("results", [])[:max_results]:
                        results.append({
                            "title": item.get("title", "Untitled"),
                            "url": item.get("url", ""),
                            "text": item.get("text", "")[:500]  # Limit text to 500 chars
                        })

                    return results
                else:
                    return []

        except Exception as e:
            # Silent failure - web search is optional
            return []

    def _format_message_with_documents(
        self, message: str, documents: list[DocumentAttachment] | None, web_results: list[dict[str, str]] | None = None
    ) -> str:
        """Format message with document context and web search results.

        Args:
            message: User's input message.
            documents: Optional list of document attachments.
            web_results: Optional web search results.

        Returns:
            Formatted message with all context prepended.
        """
        context_parts = []

        # Add document context if available
        if documents:
            context_parts.append("Context from uploaded documents:\n")
            for doc in documents:
                context_parts.append(
                    f"\n[Document: {doc.filename} ({doc.file_type})]\n{doc.extracted_text}\n"
                )

        # Add web search results if available
        if web_results:
            context_parts.append("\nWeb search results:\n")
            for idx, result in enumerate(web_results, 1):
                context_parts.append(
                    f"\n[Result {idx}: {result['title']}]\n"
                    f"URL: {result['url']}\n"
                    f"{result['text']}\n"
                )

        # Add user message
        if context_parts:
            context_parts.append(f"\n[User Message]\n{message}")
            return "\n".join(context_parts)

        return message

    async def call_openrouter(
        self, message: str, model: str, documents: list[DocumentAttachment] | None = None, enable_web_search: bool = False
    ) -> dict[str, str]:
        """Call OpenRouter API to generate AI response.

        Args:
            message: User's input message.
            model: AI model identifier.
            documents: Optional list of document attachments.
            enable_web_search: Enable web search for additional context.

        Returns:
            Dictionary containing the AI response and model used.

        Raises:
            httpx.HTTPStatusError: If API request fails.
            Exception: For other unexpected errors.
        """
        # Perform web search if enabled
        web_results = None
        if enable_web_search:
            web_results = await self._web_search(message)

        formatted_message = self._format_message_with_documents(message, documents, web_results)

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": formatted_message}],
                },
                timeout=60.0,
            )
            response.raise_for_status()
            data = response.json()

            ai_message = data["choices"][0]["message"]["content"]
            return {"message": ai_message, "model": model}

    async def stream_openrouter(
        self, message: str, model: str, documents: list[DocumentAttachment] | None = None, enable_web_search: bool = False
    ) -> AsyncIterator[dict[str, Any]]:
        """Stream AI responses from OpenRouter API.

        Args:
            message: User's input message.
            model: AI model identifier.
            documents: Optional list of document attachments.
            enable_web_search: Enable web search for additional context.

        Yields:
            Dictionary chunks containing partial AI responses and optional sources.

        Raises:
            httpx.HTTPStatusError: If API request fails.
            Exception: For other unexpected errors.
        """
        # Perform web search if enabled
        web_results = None
        if enable_web_search:
            web_results = await self._web_search(message)

        formatted_message = self._format_message_with_documents(message, documents, web_results)

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
                    "messages": [{"role": "user", "content": formatted_message}],
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

                # After streaming is complete, send sources if web search was used
                if web_results:
                    sources = [
                        {"title": result["title"], "url": result["url"]}
                        for result in web_results
                    ]
                    yield {"sources": sources, "model": model}

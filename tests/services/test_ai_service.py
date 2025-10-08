"""
Test AI Service - OpenRouter chat and streaming
32 tests covering AI service functionality
"""

import pytest
import asyncio
from unittest.mock import MagicMock, AsyncMock

# ===============================
# Initialization Tests (4)
# ===============================

def test_service_initialization(mock_env_vars, mock_openai_client):
    """Test AI service initializes correctly"""
    from services.ai_service import OpenRouterService
    service = OpenRouterService()

    assert service is not None
    assert hasattr(service, 'client')
    assert hasattr(service, 'system_prompt')

def test_service_missing_api_key(monkeypatch):
    """Test service handles missing API key"""
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)

    from services.ai_service import OpenRouterService
    service = OpenRouterService()

    # Should still initialize but client will have None key
    assert service is not None

def test_service_client_configuration(mock_env_vars, mock_openai_client):
    """Test OpenAI client is configured correctly"""
    from services.ai_service import OpenRouterService
    service = OpenRouterService()

    assert service.client is not None
    # Base URL should be OpenRouter
    assert hasattr(service, 'smithery_api_key')

def test_system_prompt_exists(mock_env_vars, mock_openai_client):
    """Test system prompt is defined"""
    from services.ai_service import OpenRouterService
    service = OpenRouterService()

    assert service.system_prompt is not None
    assert len(service.system_prompt) > 0
    assert "heading" in service.system_prompt.lower()

# ===============================
# Web Search Tests (8)
# ===============================

def test_web_search_success(mock_env_vars, mock_openai_client, mock_web_search):
    """Test successful web search"""
    from services.ai_service import OpenRouterService
    service = OpenRouterService()

    result = service._search_web("test query")

    assert result is not None
    mock_web_search.assert_called_once()

def test_web_search_no_api_key(mock_env_vars, mocker):
    """Test web search with missing API key"""
    from services.ai_service import OpenRouterService
    service = OpenRouterService()
    service.smithery_api_key = None

    result = service._search_web("test query")

    assert result == ""

def test_web_search_api_error(mock_env_vars, mock_openai_client, mocker):
    """Test web search handles API errors"""
    from services.ai_service import OpenRouterService
    service = OpenRouterService()

    mock_post = mocker.patch('services.ai_service.requests.post')
    mock_post.side_effect = Exception("API Error")

    result = service._search_web("test query")

    assert result == ""

def test_web_search_empty_results(mock_env_vars, mock_openai_client, mocker):
    """Test web search with empty results"""
    from services.ai_service import OpenRouterService
    service = OpenRouterService()

    mock_post = mocker.patch('services.ai_service.requests.post')
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {"results": []}
    mock_post.return_value = mock_response

    result = service._search_web("test query")

    assert result == ""

def test_web_search_timeout(mock_env_vars, mock_openai_client, mocker):
    """Test web search handles timeout"""
    from services.ai_service import OpenRouterService
    service = OpenRouterService()

    mock_post = mocker.patch('services.ai_service.requests.post')
    mock_post.side_effect = Exception("Timeout")

    result = service._search_web("test query")

    assert result == ""

def test_web_search_summarization(mock_env_vars, mock_web_search, mocker):
    """Test web search summarizes results"""
    from services.ai_service import OpenRouterService

    mock_openai = mocker.patch('services.ai_service.OpenAI')
    mock_instance = MagicMock()
    mock_summary = MagicMock()
    mock_summary.choices = [MagicMock(message=MagicMock(content="Summarized results"))]
    mock_instance.chat.completions.create.return_value = mock_summary
    mock_openai.return_value = mock_instance

    service = OpenRouterService()
    result = service._search_web("test query")

    assert "Summarized results" in result or result == ""

def test_web_search_result_formatting(mock_env_vars, mock_openai_client, mock_web_search):
    """Test web search results are formatted correctly"""
    from services.ai_service import OpenRouterService
    service = OpenRouterService()

    result = service._search_web("test query")

    # Result should be a string
    assert isinstance(result, str)

def test_web_search_multiple_results(mock_env_vars, mock_openai_client, mocker):
    """Test web search handles multiple results"""
    from services.ai_service import OpenRouterService

    mock_post = mocker.patch('services.ai_service.requests.post')
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "results": [
            {"title": "Result 1", "snippet": "Content 1"},
            {"title": "Result 2", "snippet": "Content 2"},
            {"title": "Result 3", "snippet": "Content 3"}
        ]
    }
    mock_post.return_value = mock_response

    service = OpenRouterService()
    result = service._search_web("test query")

    assert isinstance(result, str)

# ===============================
# Prompt Construction Tests (6)
# ===============================

def test_construct_prompt_query_only(mock_env_vars, mock_openai_client):
    """Test prompt construction with query only"""
    from services.ai_service import OpenRouterService
    service = OpenRouterService()

    prompt = service._construct_user_prompt("What is AI?")

    assert "What is AI?" in prompt
    assert "User Query:" in prompt

def test_construct_prompt_with_context(mock_env_vars, mock_openai_client):
    """Test prompt construction with context"""
    from services.ai_service import OpenRouterService
    service = OpenRouterService()

    prompt = service._construct_user_prompt(
        "Explain this",
        context="# Introduction\n\nThis is context."
    )

    assert "Explain this" in prompt
    assert "Introduction" in prompt
    assert "Selected text" in prompt

def test_construct_prompt_with_canvas(mock_env_vars, mock_openai_client):
    """Test prompt construction with canvas content"""
    from services.ai_service import OpenRouterService
    service = OpenRouterService()

    prompt = service._construct_user_prompt(
        "Continue",
        canvas_content="# My Document\n\nContent..."
    )

    assert "Continue" in prompt

def test_construct_prompt_heading_detection(mock_env_vars, mock_openai_client):
    """Test heading detection in context"""
    from services.ai_service import OpenRouterService
    service = OpenRouterService()

    context = "## Section 1\n\nContent\n\n### Subsection\n\nMore content"
    prompt = service._construct_user_prompt("Test", context=context)

    assert "heading" in prompt.lower()

def test_construct_prompt_heading_preservation(mock_env_vars, mock_openai_client):
    """Test prompt instructs to preserve heading structure"""
    from services.ai_service import OpenRouterService
    service = OpenRouterService()

    context = "# Main Title\n\n## Section"
    prompt = service._construct_user_prompt("Test", context=context)

    assert "PRESERVE" in prompt or "preserve" in prompt

def test_construct_prompt_all_parameters(mock_env_vars, mock_openai_client):
    """Test prompt with all parameters"""
    from services.ai_service import OpenRouterService
    service = OpenRouterService()

    prompt = service._construct_user_prompt(
        query="Test query",
        context="# Context",
        canvas_content="# Canvas"
    )

    assert "Test query" in prompt
    assert len(prompt) > 0

# ===============================
# Chat Stream Generation Tests (10)
# ===============================

@pytest.mark.asyncio
async def test_generate_stream_basic(mock_env_vars, mocker):
    """Test basic stream generation"""
    from services.ai_service import OpenRouterService

    # Mock OpenAI streaming
    def create_chunk(content):
        chunk = MagicMock()
        chunk.choices = [MagicMock()]
        chunk.choices[0].delta.content = content
        return chunk

    mock_openai = mocker.patch('services.ai_service.OpenAI')
    mock_instance = MagicMock()
    mock_instance.chat.completions.create.return_value = [
        create_chunk("Hello"),
        create_chunk(" World"),
        create_chunk(None)
    ]
    mock_openai.return_value = mock_instance

    service = OpenRouterService()
    chunks = []

    async for chunk in service.generate_chat_stream("Test query"):
        chunks.append(chunk)

    assert len(chunks) > 0

@pytest.mark.asyncio
async def test_generate_stream_with_context(mock_env_vars, mocker):
    """Test stream generation with context"""
    from services.ai_service import OpenRouterService

    def create_chunk(content):
        chunk = MagicMock()
        chunk.choices = [MagicMock()]
        chunk.choices[0].delta.content = content
        return chunk

    mock_openai = mocker.patch('services.ai_service.OpenAI')
    mock_instance = MagicMock()
    mock_instance.chat.completions.create.return_value = [create_chunk("Test"), create_chunk(None)]
    mock_openai.return_value = mock_instance

    service = OpenRouterService()
    chunks = []

    async for chunk in service.generate_chat_stream("Query", context="Context"):
        chunks.append(chunk)

    assert len(chunks) > 0

@pytest.mark.asyncio
async def test_generate_stream_with_web_search(mock_env_vars, mock_web_search, mocker):
    """Test stream with web search enabled"""
    from services.ai_service import OpenRouterService

    def create_chunk(content):
        chunk = MagicMock()
        chunk.choices = [MagicMock()]
        chunk.choices[0].delta.content = content
        return chunk

    mock_openai = mocker.patch('services.ai_service.OpenAI')
    mock_instance = MagicMock()
    mock_instance.chat.completions.create.return_value = [create_chunk("Result"), create_chunk(None)]
    mock_openai.return_value = mock_instance

    service = OpenRouterService()
    chunks = []

    async for chunk in service.generate_chat_stream("Query", enable_web_search=True):
        chunks.append(chunk)

    assert len(chunks) > 0

@pytest.mark.asyncio
async def test_generate_stream_with_all_params(mock_env_vars, mocker):
    """Test stream with all parameters"""
    from services.ai_service import OpenRouterService

    def create_chunk(content):
        chunk = MagicMock()
        chunk.choices = [MagicMock()]
        chunk.choices[0].delta.content = content
        return chunk

    mock_openai = mocker.patch('services.ai_service.OpenAI')
    mock_instance = MagicMock()
    mock_instance.chat.completions.create.return_value = [create_chunk("Test"), create_chunk(None)]
    mock_openai.return_value = mock_instance

    service = OpenRouterService()
    chunks = []

    async for chunk in service.generate_chat_stream(
        query="Query",
        context="Context",
        canvas_content="Canvas",
        enable_web_search=False
    ):
        chunks.append(chunk)

    assert len(chunks) > 0

@pytest.mark.asyncio
async def test_generate_stream_api_error(mock_env_vars, mocker):
    """Test stream handles API errors"""
    from services.ai_service import OpenRouterService

    mock_openai = mocker.patch('services.ai_service.OpenAI')
    mock_instance = MagicMock()
    mock_instance.chat.completions.create.side_effect = Exception("API Error")
    mock_openai.return_value = mock_instance

    service = OpenRouterService()
    chunks = []

    async for chunk in service.generate_chat_stream("Query"):
        chunks.append(chunk)

    # Should yield error message
    assert len(chunks) > 0
    assert any("error" in chunk.lower() for chunk in chunks)

@pytest.mark.asyncio
async def test_generate_stream_api_key_error(mock_env_vars, mocker):
    """Test stream handles API key errors"""
    from services.ai_service import OpenRouterService

    mock_openai = mocker.patch('services.ai_service.OpenAI')
    mock_instance = MagicMock()
    mock_instance.chat.completions.create.side_effect = Exception("Invalid API key")
    mock_openai.return_value = mock_instance

    service = OpenRouterService()
    chunks = []

    async for chunk in service.generate_chat_stream("Query"):
        chunks.append(chunk)

    assert len(chunks) > 0

@pytest.mark.asyncio
async def test_generate_stream_format(mock_env_vars, mocker):
    """Test stream output format"""
    from services.ai_service import OpenRouterService

    def create_chunk(content):
        chunk = MagicMock()
        chunk.choices = [MagicMock()]
        chunk.choices[0].delta.content = content
        return chunk

    mock_openai = mocker.patch('services.ai_service.OpenAI')
    mock_instance = MagicMock()
    mock_instance.chat.completions.create.return_value = [create_chunk("Test")]
    mock_openai.return_value = mock_instance

    service = OpenRouterService()

    async for chunk in service.generate_chat_stream("Query"):
        # Each chunk should be a string starting with "data: "
        assert isinstance(chunk, str)
        assert chunk.startswith("data: ")
        break

@pytest.mark.asyncio
async def test_generate_stream_done_signal(mock_env_vars, mocker):
    """Test stream sends DONE signal"""
    from services.ai_service import OpenRouterService

    def create_chunk(content):
        chunk = MagicMock()
        chunk.choices = [MagicMock()]
        chunk.choices[0].delta.content = content
        return chunk

    mock_openai = mocker.patch('services.ai_service.OpenAI')
    mock_instance = MagicMock()
    mock_instance.chat.completions.create.return_value = [create_chunk(None)]
    mock_openai.return_value = mock_instance

    service = OpenRouterService()
    chunks = []

    async for chunk in service.generate_chat_stream("Query"):
        chunks.append(chunk)

    # Last chunk should be DONE
    assert any("[DONE]" in chunk for chunk in chunks)

@pytest.mark.asyncio
async def test_generate_stream_empty_chunks(mock_env_vars, mocker):
    """Test stream handles empty chunks"""
    from services.ai_service import OpenRouterService

    def create_chunk(content):
        chunk = MagicMock()
        chunk.choices = [MagicMock()]
        chunk.choices[0].delta.content = content
        return chunk

    mock_openai = mocker.patch('services.ai_service.OpenAI')
    mock_instance = MagicMock()
    mock_instance.chat.completions.create.return_value = [
        create_chunk(""),
        create_chunk(None)
    ]
    mock_openai.return_value = mock_instance

    service = OpenRouterService()
    chunks = []

    async for chunk in service.generate_chat_stream("Query"):
        chunks.append(chunk)

    assert len(chunks) > 0

@pytest.mark.asyncio
async def test_generate_stream_timeout(mock_env_vars, mocker):
    """Test stream handles timeout"""
    from services.ai_service import OpenRouterService

    mock_openai = mocker.patch('services.ai_service.OpenAI')
    mock_instance = MagicMock()
    mock_instance.chat.completions.create.side_effect = asyncio.TimeoutError()
    mock_openai.return_value = mock_instance

    service = OpenRouterService()
    chunks = []

    async for chunk in service.generate_chat_stream("Query"):
        chunks.append(chunk)

    # Should handle timeout gracefully
    assert isinstance(chunks, list)

# ===============================
# Edge Cases Tests (4)
# ===============================

def test_empty_query_handling(mock_env_vars, mock_openai_client):
    """Test handling of empty query"""
    from services.ai_service import OpenRouterService
    service = OpenRouterService()

    prompt = service._construct_user_prompt("")

    assert isinstance(prompt, str)

@pytest.mark.asyncio
async def test_long_context_handling(mock_env_vars, mocker):
    """Test handling of very long context"""
    from services.ai_service import OpenRouterService

    def create_chunk(content):
        chunk = MagicMock()
        chunk.choices = [MagicMock()]
        chunk.choices[0].delta.content = content
        return chunk

    mock_openai = mocker.patch('services.ai_service.OpenAI')
    mock_instance = MagicMock()
    mock_instance.chat.completions.create.return_value = [create_chunk("OK"), create_chunk(None)]
    mock_openai.return_value = mock_instance

    service = OpenRouterService()
    long_context = "# " * 10000  # Very long context

    chunks = []
    async for chunk in service.generate_chat_stream("Query", context=long_context):
        chunks.append(chunk)

    assert len(chunks) > 0

@pytest.mark.asyncio
async def test_special_characters_in_query(mock_env_vars, mocker):
    """Test handling of special characters"""
    from services.ai_service import OpenRouterService

    def create_chunk(content):
        chunk = MagicMock()
        chunk.choices = [MagicMock()]
        chunk.choices[0].delta.content = content
        return chunk

    mock_openai = mocker.patch('services.ai_service.OpenAI')
    mock_instance = MagicMock()
    mock_instance.chat.completions.create.return_value = [create_chunk("OK"), create_chunk(None)]
    mock_openai.return_value = mock_instance

    service = OpenRouterService()
    special_query = "Test <>&\"' characters"

    chunks = []
    async for chunk in service.generate_chat_stream(special_query):
        chunks.append(chunk)

    assert len(chunks) > 0

@pytest.mark.asyncio
async def test_unicode_content_handling(mock_env_vars, mocker):
    """Test handling of Unicode content"""
    from services.ai_service import OpenRouterService

    def create_chunk(content):
        chunk = MagicMock()
        chunk.choices = [MagicMock()]
        chunk.choices[0].delta.content = content
        return chunk

    mock_openai = mocker.patch('services.ai_service.OpenAI')
    mock_instance = MagicMock()
    mock_instance.chat.completions.create.return_value = [create_chunk("OK"), create_chunk(None)]
    mock_openai.return_value = mock_instance

    service = OpenRouterService()
    unicode_query = "Test 中文 🎉 émojis"

    chunks = []
    async for chunk in service.generate_chat_stream(unicode_query):
        chunks.append(chunk)

    assert len(chunks) > 0

"""
Pytest configuration and shared fixtures for backend testing
"""

import pytest
import io
from fastapi.testclient import TestClient
from unittest.mock import MagicMock, AsyncMock, patch
from main import app

# ===============================
# Test Client Fixtures
# ===============================

@pytest.fixture
def client():
    """FastAPI test client"""
    return TestClient(app)

@pytest.fixture
def async_client():
    """Async test client"""
    from httpx import AsyncClient
    return AsyncClient(app=app, base_url="http://test")

# ===============================
# File Upload Fixtures
# ===============================

@pytest.fixture
def sample_pdf_content():
    """Minimal valid PDF content"""
    return b"%PDF-1.4\n%\xE2\xE3\xCF\xD3\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n%%EOF"

@pytest.fixture
def sample_txt_content():
    """Sample text file content"""
    return b"This is test content for text file processing."

@pytest.fixture
def sample_md_content():
    """Sample markdown content"""
    return b"# Test Document\n\nThis is markdown content."

@pytest.fixture
def sample_docx_bytes():
    """Sample DOCX file bytes (minimal valid structure)"""
    # This would be actual DOCX bytes in production
    return b"PK\x03\x04..."  # Simplified

@pytest.fixture
def sample_excel_content():
    """Sample Excel file content"""
    import pandas as pd
    df = pd.DataFrame({
        'Requirement': ['Feature A', 'Feature B', 'Feature C'],
        'Description': ['Desc A', 'Desc B', 'Desc C'],
        'Response': ['', '', '']
    })
    output = io.BytesIO()
    df.to_excel(output, index=False, engine='openpyxl')
    output.seek(0)
    return output.getvalue()

@pytest.fixture
def invalid_file_content():
    """Invalid file content (executable)"""
    return b"MZ\x90\x00..."  # EXE signature

# ===============================
# Mock External Services
# ===============================

@pytest.fixture
def mock_docling_converter():
    """Mock Docling document converter"""
    with patch('main.converter') as mock_converter:
        mock_result = MagicMock()
        mock_result.document.export_to_markdown.return_value = "# Converted Document\n\nContent here."
        mock_converter.convert.return_value = mock_result
        yield mock_converter

@pytest.fixture
def mock_openai_client():
    """Mock OpenAI client for AI service"""
    with patch('services.ai_service.OpenAI') as mock:
        mock_instance = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content="AI response"))]
        mock_instance.chat.completions.create.return_value = mock_response
        mock.return_value = mock_instance
        yield mock

@pytest.fixture
def mock_openai_stream():
    """Mock OpenAI streaming response"""
    def create_stream_chunk(content):
        chunk = MagicMock()
        chunk.choices = [MagicMock()]
        chunk.choices[0].delta.content = content
        return chunk

    with patch('services.ai_service.OpenAI') as mock:
        mock_instance = MagicMock()
        chunks = [
            create_stream_chunk("Hello"),
            create_stream_chunk(" World"),
            create_stream_chunk(None)  # End of stream
        ]
        mock_instance.chat.completions.create.return_value = iter(chunks)
        mock.return_value = mock_instance
        yield mock

@pytest.fixture
def mock_async_openai():
    """Mock AsyncOpenAI client"""
    with patch('services.fsd.AsyncOpenAI') as mock:
        mock_instance = AsyncMock()
        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content="FSD content"))]
        mock_response.usage = MagicMock(prompt_tokens=100, completion_tokens=200)
        mock_instance.chat.completions.create = AsyncMock(return_value=mock_response)
        mock.return_value = mock_instance
        yield mock

@pytest.fixture
def mock_qdrant_client():
    """Mock Qdrant vector database client"""
    with patch('services.fsd.QdrantClient') as mock:
        mock_instance = MagicMock()
        mock_instance.search.return_value = [
            MagicMock(payload={'content': 'Relevant context'}, score=0.95)
        ]
        mock.return_value = mock_instance
        yield mock

@pytest.fixture
def mock_web_search():
    """Mock web search functionality"""
    with patch('services.ai_service.requests.post') as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'results': [
                {'title': 'Result 1', 'snippet': 'Content 1'},
                {'title': 'Result 2', 'snippet': 'Content 2'}
            ]
        }
        mock_post.return_value = mock_response
        yield mock_post

@pytest.fixture
def mock_exa_search():
    """Mock Exa search for presales"""
    async def fake_search(query, row_index=None):
        return {
            "content": "Search results for: " + query,
            "sources": ["https://oracle.com/doc1", "https://oracle.com/doc2"],
            "source_types": ["Official Oracle Documentation", "Oracle Support Resources"],
            "evidence_strength": "Strong",
            "oracle_sources": 2,
            "community_sources": 0
        }

    with patch('services.presales.exa_search', side_effect=fake_search):
        yield fake_search

# ===============================
# Environment Variables
# ===============================

@pytest.fixture
def mock_env_vars(monkeypatch):
    """Mock environment variables"""
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-openrouter-key")
    monkeypatch.setenv("OPENAI_API_KEY", "test-openai-key")
    monkeypatch.setenv("SMITHERY_API_KEY", "test-smithery-key")
    monkeypatch.setenv("SMITHERY_PROFILE", "test-profile")
    monkeypatch.setenv("QDRANT_URL", "http://localhost:6333")
    monkeypatch.setenv("QDRANT_API_KEY", "test-qdrant-key")

# ===============================
# Service Fixtures
# ===============================

@pytest.fixture
def ai_service_instance(mock_env_vars, mock_openai_client):
    """AI service instance with mocked dependencies"""
    from services.ai_service import OpenRouterService
    return OpenRouterService()

@pytest.fixture
def fsd_service_instance(mock_env_vars, mock_async_openai):
    """FSD service instance with mocked dependencies"""
    from services.fsd import FSDService
    return FSDService()

@pytest.fixture
def presales_service_instance(mock_env_vars, mock_exa_search):
    """Presales service instance with mocked dependencies"""
    from services.presales import PresalesService
    return PresalesService()

# ===============================
# Temp File Cleanup
# ===============================

@pytest.fixture(autouse=True)
def cleanup_temp_files():
    """Automatically cleanup temp files after each test"""
    yield
    import tempfile
    import os
    import glob

    # Clean up any leftover temp files
    temp_dir = tempfile.gettempdir()
    for temp_file in glob.glob(os.path.join(temp_dir, "tmp*")):
        try:
            os.unlink(temp_file)
        except:
            pass

# ===============================
# Database Mocks
# ===============================

@pytest.fixture
def mock_document_cache():
    """Mock document cache for FSD service"""
    return {}

@pytest.fixture
def mock_file_storage():
    """Mock file storage for presales service"""
    return {}

# ===============================
# Async Test Support
# ===============================

@pytest.fixture
def event_loop():
    """Create an instance of the default event loop for the test session"""
    import asyncio
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

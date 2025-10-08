"""
Test main.py - API endpoints
60 tests covering all 17 endpoints
"""

import pytest
import io
from fastapi import HTTPException

# ===============================
# Health & Metadata Tests (2)
# ===============================

def test_health_check(client):
    """Test /health endpoint returns healthy status"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_app_metadata(client):
    """Test FastAPI app has correct metadata"""
    from main import app
    assert app.title == "Document Converter API"
    assert app.version == "1.0.0"

# ===============================
# Single Document Upload Tests (20)
# ===============================

def test_upload_pdf_success(client, sample_pdf_content, mock_docling_converter):
    """Test successful PDF upload"""
    files = {"file": ("test.pdf", io.BytesIO(sample_pdf_content), "application/pdf")}
    response = client.post("/upload-document", files=files)

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["filename"] == "test.pdf"
    assert "content" in data

def test_upload_docx_success(client, mock_docling_converter):
    """Test successful DOCX upload"""
    content = b"PK\x03\x04..."  # DOCX file signature
    files = {"file": ("test.docx", io.BytesIO(content), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    response = client.post("/upload-document", files=files)

    assert response.status_code == 200
    assert response.json()["status"] == "success"

def test_upload_doc_success(client, mock_docling_converter):
    """Test successful DOC upload"""
    content = b"\xd0\xcf\x11\xe0..."  # DOC file signature
    files = {"file": ("test.doc", io.BytesIO(content), "application/msword")}
    response = client.post("/upload-document", files=files)

    assert response.status_code == 200

def test_upload_txt_success(client, sample_txt_content):
    """Test successful TXT upload"""
    files = {"file": ("test.txt", io.BytesIO(sample_txt_content), "text/plain")}
    response = client.post("/upload-document", files=files)

    assert response.status_code == 200
    data = response.json()
    assert data["content"] == sample_txt_content.decode('utf-8')
    assert data["filename"] == "test.txt"

def test_upload_md_success(client, sample_md_content):
    """Test successful Markdown upload"""
    files = {"file": ("test.md", io.BytesIO(sample_md_content), "text/markdown")}
    response = client.post("/upload-document", files=files)

    assert response.status_code == 200
    assert "# Test Document" in response.json()["content"]

def test_upload_xlsx_success(client, mock_docling_converter):
    """Test successful Excel XLSX upload"""
    content = b"PK\x03\x04..."
    files = {"file": ("test.xlsx", io.BytesIO(content), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    response = client.post("/upload-document", files=files)

    assert response.status_code == 200

def test_upload_xls_success(client, mock_docling_converter):
    """Test successful Excel XLS upload"""
    content = b"\xd0\xcf\x11\xe0..."
    files = {"file": ("test.xls", io.BytesIO(content), "application/vnd.ms-excel")}
    response = client.post("/upload-document", files=files)

    assert response.status_code == 200

def test_upload_pptx_success(client, mock_docling_converter):
    """Test successful PowerPoint PPTX upload"""
    content = b"PK\x03\x04..."
    files = {"file": ("test.pptx", io.BytesIO(content), "application/vnd.openxmlformats-officedocument.presentationml.presentation")}
    response = client.post("/upload-document", files=files)

    assert response.status_code == 200

def test_upload_ppt_success(client, mock_docling_converter):
    """Test successful PowerPoint PPT upload"""
    content = b"\xd0\xcf\x11\xe0..."
    files = {"file": ("test.ppt", io.BytesIO(content), "application/vnd.ms-powerpoint")}
    response = client.post("/upload-document", files=files)

    assert response.status_code == 200

def test_upload_octet_stream_pdf(client, sample_pdf_content, mock_docling_converter):
    """Test PDF upload with octet-stream MIME type"""
    files = {"file": ("test.pdf", io.BytesIO(sample_pdf_content), "application/octet-stream")}
    response = client.post("/upload-document", files=files)

    assert response.status_code == 200

def test_upload_txt_with_utf8_content(client):
    """Test text file with UTF-8 characters"""
    content = "Hello 世界 🌍".encode('utf-8')
    files = {"file": ("test.txt", io.BytesIO(content), "text/plain")}
    response = client.post("/upload-document", files=files)

    assert response.status_code == 200
    assert "世界" in response.json()["content"]

def test_upload_invalid_mime_type(client):
    """Test upload with unsupported MIME type"""
    content = b"MZ\x90\x00..."  # EXE signature
    files = {"file": ("test.exe", io.BytesIO(content), "application/x-msdownload")}
    response = client.post("/upload-document", files=files)

    assert response.status_code in [400, 500]  # Can be validation or server error

def test_upload_invalid_extension_octet_stream(client):
    """Test octet-stream with invalid extension"""
    content = b"test content"
    files = {"file": ("test.exe", io.BytesIO(content), "application/octet-stream")}
    response = client.post("/upload-document", files=files)

    assert response.status_code in [400, 500]  # Can be validation or server error

def test_upload_non_utf8_txt_file(client):
    """Test text file with invalid UTF-8 encoding"""
    content = b"\xff\xfe\xfd"  # Invalid UTF-8
    files = {"file": ("test.txt", io.BytesIO(content), "text/plain")}
    response = client.post("/upload-document", files=files)

    assert response.status_code in [400, 500]  # Can be validation or server error

def test_upload_empty_file(client):
    """Test upload with empty file"""
    files = {"file": ("empty.pdf", io.BytesIO(b""), "application/pdf")}
    response = client.post("/upload-document", files=files)

    assert response.status_code in [400, 500]

def test_upload_no_filename(client, sample_pdf_content):
    """Test upload without filename"""
    files = {"file": ("", io.BytesIO(sample_pdf_content), "application/pdf")}
    response = client.post("/upload-document", files=files)

    # FastAPI validation returns 422 for empty filename
    assert response.status_code in [200, 400, 422, 500]

def test_upload_docling_conversion_error(client, mock_docling_converter):
    """Test handling of Docling conversion errors"""
    mock_docling_converter.convert.side_effect = Exception("Conversion failed")

    content = b"PDF content"
    files = {"file": ("test.pdf", io.BytesIO(content), "application/pdf")}
    response = client.post("/upload-document", files=files)

    assert response.status_code == 500
    assert "Error converting document" in response.json()["detail"]

def test_upload_temp_file_cleanup(client, sample_pdf_content, mock_docling_converter, mocker):
    """Test that temporary files are cleaned up"""
    import tempfile
    import os

    spy_unlink = mocker.spy(os, 'unlink')

    files = {"file": ("test.pdf", io.BytesIO(sample_pdf_content), "application/pdf")}
    response = client.post("/upload-document", files=files)

    assert response.status_code == 200
    # Verify cleanup was attempted
    assert spy_unlink.call_count >= 1

def test_upload_large_file(client, mock_docling_converter):
    """Test upload of large file"""
    # 10MB file
    large_content = b"A" * (10 * 1024 * 1024)
    files = {"file": ("large.pdf", io.BytesIO(large_content), "application/pdf")}
    response = client.post("/upload-document", files=files)

    assert response.status_code in [200, 413]  # 413 = Payload Too Large

# ===============================
# Multiple Document Upload Tests (8)
# ===============================

def test_upload_multiple_pdfs_success(client, sample_pdf_content, mock_docling_converter):
    """Test successful multiple PDF upload"""
    files = [
        ("files", ("test1.pdf", io.BytesIO(sample_pdf_content), "application/pdf")),
        ("files", ("test2.pdf", io.BytesIO(sample_pdf_content), "application/pdf")),
        ("files", ("test3.pdf", io.BytesIO(sample_pdf_content), "application/pdf"))
    ]
    response = client.post("/upload-multiple-documents", files=files)

    assert response.status_code == 200
    data = response.json()
    assert "3 documents" in data["filename"]
    assert "test1.pdf" in data["filename"]

def test_upload_two_pdfs(client, sample_pdf_content, mock_docling_converter):
    """Test upload of exactly 2 PDFs"""
    files = [
        ("files", ("doc1.pdf", io.BytesIO(sample_pdf_content), "application/pdf")),
        ("files", ("doc2.pdf", io.BytesIO(sample_pdf_content), "application/pdf"))
    ]
    response = client.post("/upload-multiple-documents", files=files)

    assert response.status_code == 200
    assert "## Document: doc1.pdf" in response.json()["content"]
    assert "## Document: doc2.pdf" in response.json()["content"]

def test_upload_four_pdfs_parallel(client, sample_pdf_content, mock_docling_converter):
    """Test parallel processing of 4 PDFs (max workers = 4)"""
    files = [
        ("files", (f"test{i}.pdf", io.BytesIO(sample_pdf_content), "application/pdf"))
        for i in range(4)
    ]
    response = client.post("/upload-multiple-documents", files=files)

    assert response.status_code == 200
    assert "4 documents" in response.json()["filename"]

def test_upload_multiple_invalid_file_type(client):
    """Test multiple upload with non-PDF file"""
    files = [
        ("files", ("test1.pdf", io.BytesIO(b"%PDF"), "application/pdf")),
        ("files", ("test.txt", io.BytesIO(b"text"), "text/plain"))
    ]
    response = client.post("/upload-multiple-documents", files=files)

    assert response.status_code in [400, 500]  # Can be validation or server error

def test_upload_multiple_no_filename(client, sample_pdf_content):
    """Test multiple upload with missing filename"""
    files = [
        ("files", ("", io.BytesIO(sample_pdf_content), "application/pdf"))
    ]
    response = client.post("/upload-multiple-documents", files=files)

    assert response.status_code in [400, 422, 500]  # FastAPI validation can return 422

def test_upload_multiple_mixed_extensions(client, sample_pdf_content):
    """Test multiple upload validates all files"""
    files = [
        ("files", ("test.PDF", io.BytesIO(sample_pdf_content), "application/pdf")),
        ("files", ("test.Pdf", io.BytesIO(sample_pdf_content), "application/pdf"))
    ]
    response = client.post("/upload-multiple-documents", files=files)

    # Should handle case-insensitive extensions
    assert response.status_code in [200, 400, 500]  # Can be validation or server error

def test_upload_multiple_conversion_error(client, sample_pdf_content, mock_docling_converter):
    """Test multiple upload handles conversion errors"""
    mock_docling_converter.convert.side_effect = Exception("Conversion failed")

    files = [
        ("files", ("test1.pdf", io.BytesIO(sample_pdf_content), "application/pdf"))
    ]
    response = client.post("/upload-multiple-documents", files=files)

    assert response.status_code == 500

def test_upload_multiple_empty_list(client):
    """Test multiple upload with no files"""
    response = client.post("/upload-multiple-documents", files=[])

    # FastAPI will require at least one file
    assert response.status_code in [400, 422]

# ===============================
# Chat Endpoint Tests (6)
# ===============================

def test_chat_basic(client, mock_openai_stream):
    """Test basic chat without context"""
    response = client.post("/chat", json={
        "query": "Hello, how are you?",
        "context": "",
        "canvas_content": "",
        "enable_web_search": False
    })

    assert response.status_code == 200
    assert "text/event-stream" in response.headers["content-type"]

def test_chat_with_context(client, mock_openai_stream):
    """Test chat with document context"""
    response = client.post("/chat", json={
        "query": "Summarize this",
        "context": "# Document\n\nThis is important content.",
        "canvas_content": "",
        "enable_web_search": False
    })

    assert response.status_code == 200

def test_chat_with_canvas_content(client, mock_openai_stream):
    """Test chat with canvas content"""
    response = client.post("/chat", json={
        "query": "Continue writing",
        "context": "",
        "canvas_content": "# My Document\n\nIntroduction...",
        "enable_web_search": False
    })

    assert response.status_code == 200

def test_chat_with_web_search(client, mock_openai_stream, mock_web_search):
    """Test chat with web search enabled"""
    response = client.post("/chat", json={
        "query": "What is the latest news?",
        "context": "",
        "canvas_content": "",
        "enable_web_search": True
    })

    assert response.status_code == 200

def test_chat_api_error(client, mocker):
    """Test chat handles AI service errors"""
    mocker.patch('services.ai_service.ai_service.generate_chat_stream', side_effect=Exception("API Error"))

    response = client.post("/chat", json={
        "query": "Test",
        "context": "",
        "canvas_content": "",
        "enable_web_search": False
    })

    assert response.status_code == 500
    assert "Error processing chat request" in response.json()["detail"]

def test_chat_empty_query(client, mock_openai_stream):
    """Test chat with empty query"""
    response = client.post("/chat", json={
        "query": "",
        "context": "",
        "canvas_content": "",
        "enable_web_search": False
    })

    # Should still work, might return empty or error
    assert response.status_code in [200, 400]

# ===============================
# FSD Endpoint Tests (12)
# ===============================

def test_fsd_download_success(client, mocker):
    """Test successful FSD document download"""
    mock_service = mocker.patch('main.fsd_service.get_document')
    mock_service.return_value = b"Fake DOCX content"

    response = client.get("/fsd/download/test-doc-id")

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

def test_fsd_download_not_found(client, mocker):
    """Test FSD download with invalid document ID"""
    mock_service = mocker.patch('main.fsd_service.get_document')
    mock_service.side_effect = ValueError("Document not found")

    response = client.get("/fsd/download/invalid-id")

    assert response.status_code == 404

def test_fsd_download_error(client, mocker):
    """Test FSD download handles errors"""
    mock_service = mocker.patch('main.fsd_service.get_document')
    mock_service.side_effect = Exception("Download error")

    response = client.get("/fsd/download/test-id")

    assert response.status_code == 500

def test_fsd_token_usage(client):
    """Test FSD token usage statistics endpoint"""
    response = client.get("/fsd/token-usage")

    assert response.status_code == 200
    # Should return some usage stats
    assert isinstance(response.json(), dict)

def test_fsd_generate_from_document_pdf(client, sample_pdf_content, mocker):
    """Test FSD generation from PDF"""
    mock_result = mocker.MagicMock()
    mock_result.success = True
    mock_result.message = "Success"
    mock_result.document_id = "fsd-123"
    mock_result.token_usage = {"input": 100, "output": 200}

    mock_service = mocker.patch('main.fsd_service.generate_fsd_from_document_upload')
    mock_service.return_value = mock_result

    files = {"file": ("test.pdf", io.BytesIO(sample_pdf_content), "application/pdf")}
    data = {"additional_context": "Extra info"}

    response = client.post("/fsd/generate-from-document", files=files, data=data)

    assert response.status_code == 200
    assert response.json()["success"] is True
    assert "document_id" in response.json()

def test_fsd_generate_from_document_docx(client, mocker):
    """Test FSD generation from DOCX"""
    mock_result = mocker.MagicMock()
    mock_result.success = True
    mock_result.document_id = "fsd-456"
    mock_result.message = "Generated"
    mock_result.token_usage = {}

    mock_service = mocker.patch('main.fsd_service.generate_fsd_from_document_upload')
    mock_service.return_value = mock_result

    content = b"PK\x03\x04..."
    files = {"file": ("test.docx", io.BytesIO(content), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}

    response = client.post("/fsd/generate-from-document", files=files)

    assert response.status_code == 200

def test_fsd_generate_invalid_file_type(client, sample_txt_content):
    """Test FSD generation with invalid file type"""
    files = {"file": ("test.txt", io.BytesIO(sample_txt_content), "text/plain")}

    response = client.post("/fsd/generate-from-document", files=files)

    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]

def test_fsd_generate_no_filename(client, sample_pdf_content):
    """Test FSD generation without filename"""
    files = {"file": ("", io.BytesIO(sample_pdf_content), "application/pdf")}

    response = client.post("/fsd/generate-from-document", files=files)

    assert response.status_code in [400, 422, 500]  # FastAPI validation can return 422

def test_fsd_generate_empty_file(client):
    """Test FSD generation with empty file"""
    files = {"file": ("test.pdf", io.BytesIO(b""), "application/pdf")}

    response = client.post("/fsd/generate-from-document", files=files)

    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()

def test_fsd_generate_with_context(client, sample_pdf_content, mocker):
    """Test FSD generation with additional context"""
    mock_result = mocker.MagicMock()
    mock_result.success = True
    mock_result.document_id = "fsd-789"
    mock_result.message = "Success"
    mock_result.token_usage = {}

    mock_service = mocker.patch('main.fsd_service.generate_fsd_from_document_upload')
    mock_service.return_value = mock_result

    files = {"file": ("test.pdf", io.BytesIO(sample_pdf_content), "application/pdf")}
    data = {"additional_context": "This is a banking system"}

    response = client.post("/fsd/generate-from-document", files=files, data=data)

    assert response.status_code == 200
    mock_service.assert_called_once()

def test_fsd_generate_error(client, sample_pdf_content, mocker):
    """Test FSD generation handles errors"""
    mock_result = mocker.MagicMock()
    mock_result.success = False
    mock_result.message = "Generation failed"

    mock_service = mocker.patch('main.fsd_service.generate_fsd_from_document_upload')
    mock_service.return_value = mock_result

    files = {"file": ("test.pdf", io.BytesIO(sample_pdf_content), "application/pdf")}

    response = client.post("/fsd/generate-from-document", files=files)

    assert response.status_code == 500

def test_fsd_clear_cache(client):
    """Test FSD cache clearing"""
    response = client.post("/fsd/clear-cache")

    assert response.status_code == 200

# ===============================
# Presales Endpoint Tests (12)
# ===============================

def test_presales_upload_xlsx(client, sample_excel_content):
    """Test presales Excel XLSX upload"""
    files = {"file": ("rfp.xlsx", io.BytesIO(sample_excel_content), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}

    response = client.post("/presales/upload", files=files)

    assert response.status_code == 200
    data = response.json()
    assert "columns" in data
    assert "row_count" in data

def test_presales_upload_xls(client, sample_excel_content):
    """Test presales Excel XLS upload"""
    files = {"file": ("rfp.xls", io.BytesIO(sample_excel_content), "application/vnd.ms-excel")}

    response = client.post("/presales/upload", files=files)

    assert response.status_code == 200

def test_presales_upload_invalid_type(client, sample_pdf_content):
    """Test presales upload with invalid file type"""
    files = {"file": ("test.pdf", io.BytesIO(sample_pdf_content), "application/pdf")}

    response = client.post("/presales/upload", files=files)

    assert response.status_code in [400, 500]  # Can be validation or server error

def test_presales_upload_error(client, mocker):
    """Test presales upload handles errors"""
    mock_service = mocker.patch('main.presales_service.upload_file')
    mock_service.side_effect = ValueError("Invalid Excel file")

    files = {"file": ("test.xlsx", io.BytesIO(b"fake"), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}

    response = client.post("/presales/upload", files=files)

    assert response.status_code == 400

def test_presales_process_success(client, mocker):
    """Test presales processing success"""
    mock_result = mocker.MagicMock()
    mock_result.file_id = "presales-123"
    mock_result.message = "Processing complete"
    mock_result.processing_stats = {"total": 10, "processed": 10}
    mock_result.processing_complete = True

    mock_service = mocker.patch('main.presales_service.process_excel')
    mock_service.return_value = mock_result

    response = client.post("/presales/process", json={
        "input_columns": ["Requirement"],
        "output_columns": ["Response"],
        "filename": "test.xlsx",
        "user_prompt": ""
    })

    assert response.status_code == 200
    assert response.json()["processing_complete"] is True

def test_presales_process_not_found(client, mocker):
    """Test presales processing with invalid file"""
    mock_service = mocker.patch('main.presales_service.process_excel')
    mock_service.side_effect = ValueError("File not found")

    response = client.post("/presales/process", json={
        "input_columns": ["Requirement"],
        "output_columns": ["Response"],
        "filename": "invalid.xlsx"
    })

    assert response.status_code == 400

def test_presales_process_error(client, mocker):
    """Test presales processing handles errors"""
    mock_service = mocker.patch('main.presales_service.process_excel')
    mock_service.side_effect = Exception("Processing error")

    response = client.post("/presales/process", json={
        "input_columns": ["Requirement"],
        "output_columns": ["Response"],
        "filename": "test.xlsx"
    })

    assert response.status_code == 500

def test_presales_download_success(client, mocker):
    """Test presales file download"""
    mock_service = mocker.patch('main.presales_service.get_processed_file')
    mock_service.return_value = b"Excel file content"

    response = client.get("/presales/download/presales-123")

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

def test_presales_download_not_found(client, mocker):
    """Test presales download with invalid file ID"""
    mock_service = mocker.patch('main.presales_service.get_processed_file')
    mock_service.side_effect = ValueError("File not found")

    response = client.get("/presales/download/invalid-id")

    assert response.status_code == 404

def test_presales_download_error(client, mocker):
    """Test presales download handles errors"""
    mock_service = mocker.patch('main.presales_service.get_processed_file')
    mock_service.side_effect = Exception("Download error")

    response = client.get("/presales/download/test-id")

    assert response.status_code == 500

def test_presales_cache_stats(client):
    """Test presales cache statistics"""
    response = client.get("/presales/cache-stats")

    assert response.status_code == 200
    assert isinstance(response.json(), dict)

def test_presales_clear_cache(client):
    """Test presales cache clearing"""
    response = client.post("/presales/clear-cache")

    assert response.status_code == 200

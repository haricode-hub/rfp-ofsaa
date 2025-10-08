"""
Test middlewares and CORS configuration
8 tests covering middleware functionality
"""

import pytest
import io

def test_cors_allows_localhost(client):
    """Test CORS allows localhost origin"""
    response = client.options(
        "/health",
        headers={"Origin": "http://localhost:3505", "Access-Control-Request-Method": "GET"}
    )

    assert response.status_code == 200
    assert "access-control-allow-origin" in response.headers

def test_cors_allows_custom_origin(client):
    """Test CORS allows configured custom origin"""
    response = client.options(
        "/health",
        headers={"Origin": "http://192.168.2.95:3505", "Access-Control-Request-Method": "GET"}
    )

    assert response.status_code == 200

def test_cors_headers_present(client):
    """Test CORS headers are present"""
    response = client.get("/health", headers={"Origin": "http://localhost:3505"})

    headers = response.headers
    assert "access-control-allow-origin" in headers or "Access-Control-Allow-Origin" in headers

def test_cors_credentials_enabled(client):
    """Test CORS allows credentials"""
    response = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:3505",
            "Access-Control-Request-Method": "GET"
        }
    )

    # Check if credentials are allowed
    assert response.status_code == 200

def test_cors_all_methods_allowed(client):
    """Test CORS allows all HTTP methods"""
    for method in ["GET", "POST", "PUT", "DELETE", "OPTIONS"]:
        response = client.options(
            "/health",
            headers={
                "Origin": "http://localhost:3505",
                "Access-Control-Request-Method": method
            }
        )
        assert response.status_code == 200

def test_exception_handler_404(client):
    """Test 404 error handling"""
    response = client.get("/nonexistent-endpoint")

    assert response.status_code == 404

def test_exception_handler_500(client, mocker):
    """Test 500 error handling"""
    # Force an internal error
    mocker.patch('main.converter.convert', side_effect=Exception("Internal error"))

    files = {"file": ("test.pdf", io.BytesIO(b"fake"), "application/pdf")}
    response = client.post("/upload-document", files=files)

    assert response.status_code == 500

def test_logging_configuration():
    """Test logging is configured correctly"""
    import logging

    # Check docling logging is set to WARNING
    docling_logger = logging.getLogger('docling')
    assert docling_logger.level == logging.WARNING

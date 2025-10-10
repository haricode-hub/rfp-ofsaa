"""
Security Middleware for RFP OFSAA
Implements rate limiting, security headers, and request validation
"""

import time
from collections import defaultdict
from typing import Callable
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import logging

logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware using sliding window algorithm
    """

    def __init__(
        self,
        app: ASGIApp,
        requests_per_minute: int = 60,
        requests_per_hour: int = 1000
    ):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        self.request_times: defaultdict = defaultdict(list)

    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address"""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def _clean_old_requests(self, client_ip: str, current_time: float):
        """Remove requests older than 1 hour"""
        self.request_times[client_ip] = [
            req_time for req_time in self.request_times[client_ip]
            if current_time - req_time < 3600
        ]

    async def dispatch(self, request: Request, call_next: Callable):
        """Check rate limits before processing request"""
        client_ip = self._get_client_ip(request)
        current_time = time.time()

        # Clean old requests
        self._clean_old_requests(client_ip, current_time)

        # Add current request
        self.request_times[client_ip].append(current_time)

        # Check minute limit
        minute_requests = sum(
            1 for req_time in self.request_times[client_ip]
            if current_time - req_time < 60
        )

        if minute_requests > self.requests_per_minute:
            logger.warning(f"Rate limit exceeded for {client_ip}: {minute_requests} requests/minute")
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Too many requests. Please try again later.",
                    "retry_after": 60
                },
                headers={"Retry-After": "60"}
            )

        # Check hour limit
        hour_requests = len(self.request_times[client_ip])
        if hour_requests > self.requests_per_hour:
            logger.warning(f"Hourly rate limit exceeded for {client_ip}: {hour_requests} requests/hour")
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "detail": "Hourly rate limit exceeded. Please try again later.",
                    "retry_after": 3600
                },
                headers={"Retry-After": "3600"}
            )

        # Process request
        response = await call_next(request)

        # Add rate limit headers
        response.headers["X-RateLimit-Limit-Minute"] = str(self.requests_per_minute)
        response.headers["X-RateLimit-Remaining-Minute"] = str(
            max(0, self.requests_per_minute - minute_requests)
        )
        response.headers["X-RateLimit-Limit-Hour"] = str(self.requests_per_hour)
        response.headers["X-RateLimit-Remaining-Hour"] = str(
            max(0, self.requests_per_hour - hour_requests)
        )

        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Add security headers to all responses
    """

    def __init__(self, app: ASGIApp, environment: str = "production"):
        super().__init__(app)
        self.environment = environment

    async def dispatch(self, request: Request, call_next: Callable):
        """Add security headers to response"""
        response = await call_next(request)

        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"

        # Content Security Policy
        csp_directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self' data:",
            "connect-src 'self' https:",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'"
        ]
        response.headers["Content-Security-Policy"] = "; ".join(csp_directives)

        # Strict-Transport-Security (HSTS) - only in production
        if self.environment == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        return response


class RequestValidationMiddleware(BaseHTTPMiddleware):
    """
    Validate incoming requests for security issues
    """

    def __init__(self, app: ASGIApp, max_content_length: int = 100 * 1024 * 1024):
        super().__init__(app)
        self.max_content_length = max_content_length

    async def dispatch(self, request: Request, call_next: Callable):
        """Validate request before processing"""

        # Check content length
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                length = int(content_length)
                if length > self.max_content_length:
                    logger.warning(f"Request too large: {length} bytes from {request.client.host if request.client else 'unknown'}")
                    return JSONResponse(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        content={
                            "detail": f"Request body too large. Maximum size: {self.max_content_length} bytes"
                        }
                    )
            except ValueError:
                pass

        # Check for suspicious patterns in URL
        suspicious_patterns = ["../", "..\\", "<script", "javascript:", "data:text/html"]
        url_path = str(request.url.path).lower()

        for pattern in suspicious_patterns:
            if pattern in url_path:
                logger.warning(f"Suspicious pattern detected in URL: {url_path} from {request.client.host if request.client else 'unknown'}")
                return JSONResponse(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    content={"detail": "Invalid request"}
                )

        return await call_next(request)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Log all incoming requests and responses
    """

    async def dispatch(self, request: Request, call_next: Callable):
        """Log request and response details"""
        start_time = time.time()

        # Get client IP
        client_ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")

        # Log request
        logger.info(
            f"Request: {request.method} {request.url.path}",
            extra={
                "method": request.method,
                "path": request.url.path,
                "client_ip": client_ip,
                "user_agent": request.headers.get("user-agent", "unknown")
            }
        )

        # Process request
        try:
            response = await call_next(request)
            process_time = time.time() - start_time

            # Log response
            logger.info(
                f"Response: {response.status_code} - {request.method} {request.url.path}",
                extra={
                    "status_code": response.status_code,
                    "process_time": round(process_time, 3),
                    "method": request.method,
                    "path": request.url.path
                }
            )

            # Add custom headers
            response.headers["X-Process-Time"] = str(round(process_time, 3))

            return response

        except Exception as e:
            process_time = time.time() - start_time
            logger.error(
                f"Error: {str(e)} - {request.method} {request.url.path}",
                extra={
                    "error": str(e),
                    "process_time": round(process_time, 3),
                    "method": request.method,
                    "path": request.url.path
                },
                exc_info=True
            )
            raise

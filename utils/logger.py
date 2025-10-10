"""
Structured Logging Configuration for RFP OFSAA
Implements JSON-formatted logging with request tracing
"""

import logging
import sys
import json
from datetime import datetime
from typing import Any, Dict
from pathlib import Path
import traceback


class JSONFormatter(logging.Formatter):
    """
    JSON formatter for structured logging
    """

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON"""
        log_data: Dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add request ID if available
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id

        # Add extra fields from record
        if hasattr(record, "extra_fields"):
            log_data.update(record.extra_fields)

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = {
                "type": record.exc_info[0].__name__ if record.exc_info[0] else None,
                "message": str(record.exc_info[1]) if record.exc_info[1] else None,
                "traceback": traceback.format_exception(*record.exc_info)
            }

        # Add any extra attributes from the record
        for key, value in record.__dict__.items():
            if key not in [
                "name", "msg", "args", "created", "filename", "funcName",
                "levelname", "levelno", "lineno", "module", "msecs",
                "message", "pathname", "process", "processName",
                "relativeCreated", "thread", "threadName", "exc_info",
                "exc_text", "stack_info", "extra_fields", "request_id"
            ]:
                if not key.startswith("_"):
                    try:
                        json.dumps(value)  # Test if serializable
                        log_data[key] = value
                    except (TypeError, ValueError):
                        log_data[key] = str(value)

        return json.dumps(log_data, default=str)


class TextFormatter(logging.Formatter):
    """
    Colored text formatter for development
    """

    # ANSI color codes
    COLORS = {
        "DEBUG": "\033[36m",      # Cyan
        "INFO": "\033[32m",       # Green
        "WARNING": "\033[33m",    # Yellow
        "ERROR": "\033[31m",      # Red
        "CRITICAL": "\033[35m",   # Magenta
        "RESET": "\033[0m"        # Reset
    }

    def format(self, record: logging.LogRecord) -> str:
        """Format log record with colors"""
        color = self.COLORS.get(record.levelname, self.COLORS["RESET"])
        reset = self.COLORS["RESET"]

        # Format timestamp
        timestamp = datetime.fromtimestamp(record.created).strftime("%Y-%m-%d %H:%M:%S")

        # Build log message
        message = f"{color}[{timestamp}] {record.levelname:8s}{reset} "
        message += f"{record.name} - {record.getMessage()}"

        # Add exception info if present
        if record.exc_info:
            message += "\n" + self.formatException(record.exc_info)

        return message


def setup_logging(
    log_level: str = "INFO",
    log_format: str = "json",
    log_file: str = None,
    enable_console: bool = True
) -> None:
    """
    Configure application logging

    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_format: Format type ("json" or "text")
        log_file: Path to log file (optional)
        enable_console: Whether to enable console logging
    """
    # Get root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper()))

    # Remove existing handlers
    root_logger.handlers = []

    # Choose formatter
    if log_format == "json":
        formatter = JSONFormatter()
    else:
        formatter = TextFormatter()

    # Console handler
    if enable_console:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        root_logger.addHandler(console_handler)

    # File handler
    if log_file:
        # Create log directory if it doesn't exist
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)

        # Create file handler with rotation
        from logging.handlers import RotatingFileHandler
        file_handler = RotatingFileHandler(
            log_file,
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=5,
            encoding='utf-8'
        )
        file_handler.setFormatter(JSONFormatter())  # Always use JSON for file logs
        root_logger.addHandler(file_handler)

    # Set specific loggers to WARNING to reduce noise
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("fastapi").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)

    # Log initialization
    root_logger.info(
        "Logging configured",
        extra={
            "log_level": log_level,
            "log_format": log_format,
            "log_file": log_file,
            "console_enabled": enable_console
        }
    )


class RequestLogger:
    """
    Contextual logger that includes request ID
    """

    def __init__(self, logger: logging.Logger, request_id: str):
        self.logger = logger
        self.request_id = request_id

    def _log(self, level: int, message: str, **kwargs):
        """Log with request ID"""
        extra = kwargs.get("extra", {})
        extra["request_id"] = self.request_id
        kwargs["extra"] = extra
        self.logger.log(level, message, **kwargs)

    def debug(self, message: str, **kwargs):
        self._log(logging.DEBUG, message, **kwargs)

    def info(self, message: str, **kwargs):
        self._log(logging.INFO, message, **kwargs)

    def warning(self, message: str, **kwargs):
        self._log(logging.WARNING, message, **kwargs)

    def error(self, message: str, **kwargs):
        self._log(logging.ERROR, message, **kwargs)

    def critical(self, message: str, **kwargs):
        self._log(logging.CRITICAL, message, **kwargs)


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance

    Args:
        name: Logger name (typically __name__)

    Returns:
        Logger instance
    """
    return logging.getLogger(name)


def get_request_logger(name: str, request_id: str) -> RequestLogger:
    """
    Get a request-specific logger

    Args:
        name: Logger name
        request_id: Unique request identifier

    Returns:
        RequestLogger instance
    """
    logger = logging.getLogger(name)
    return RequestLogger(logger, request_id)

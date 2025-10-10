"""
Configuration Management for RFP OFSAA
Centralized configuration with environment validation using Pydantic
"""

import os
from typing import Literal, Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with validation"""

    # Application Settings
    app_name: str = "RFP OFSAA"
    app_version: str = "1.0.0"
    environment: Literal["development", "staging", "production"] = Field(
        default="development",
        description="Application environment"
    )
    debug: bool = Field(default=False, description="Debug mode")

    # Server Configuration
    host: str = Field(default="0.0.0.0", description="Server host")
    port: int = Field(default=8505, ge=1, le=65535, description="Server port")
    workers: int = Field(default=4, ge=1, le=16, description="Number of workers")
    reload: bool = Field(default=False, description="Hot reload (dev only)")

    # CORS Configuration
    cors_origins: list[str] = Field(
        default=[
            "http://localhost:3505",
            "http://localhost:3000",
            "http://127.0.0.1:3505",
        ],
        description="Allowed CORS origins"
    )
    cors_allow_credentials: bool = True
    cors_allow_methods: list[str] = ["*"]
    cors_allow_headers: list[str] = ["*"]

    # API Keys (Required)
    openai_api_key: str = Field(..., min_length=20, description="OpenAI API key")
    openrouter_api_key: str = Field(..., min_length=20, description="OpenRouter API key")

    # Optional API Keys
    qdrant_url: Optional[str] = Field(None, description="Qdrant vector database URL")
    qdrant_api_key: Optional[str] = Field(None, description="Qdrant API key")
    smithery_api_key: Optional[str] = Field(None, description="Smithery.ai API key")
    smithery_profile: Optional[str] = Field(None, description="Smithery profile")

    # Redis Configuration
    redis_url: str = Field(
        default="redis://localhost:6379",
        description="Redis connection URL"
    )
    redis_max_connections: int = Field(default=50, description="Max Redis connections")

    # Database Configuration
    database_url: Optional[str] = Field(
        None,
        description="PostgreSQL database URL"
    )

    # File Upload Configuration
    max_upload_size: int = Field(
        default=100 * 1024 * 1024,  # 100MB
        description="Maximum file upload size in bytes"
    )
    allowed_extensions: set[str] = Field(
        default={".pdf", ".doc", ".docx", ".txt", ".md", ".xls", ".xlsx", ".ppt", ".pptx"},
        description="Allowed file extensions"
    )
    upload_dir: str = Field(default="uploads", description="Upload directory")

    # Security Configuration
    secret_key: str = Field(
        default="",
        description="Secret key for signing (auto-generated if not provided)"
    )
    rate_limit_enabled: bool = Field(default=True, description="Enable rate limiting")
    rate_limit_per_minute: int = Field(default=60, description="Requests per minute")
    rate_limit_per_hour: int = Field(default=1000, description="Requests per hour")

    # Logging Configuration
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = Field(
        default="INFO",
        description="Logging level"
    )
    log_format: Literal["json", "text"] = Field(
        default="json",
        description="Log output format"
    )
    log_file: Optional[str] = Field(
        default="logs/app.log",
        description="Log file path"
    )

    # Performance Configuration
    pdf_max_workers: int = Field(
        default=32,
        ge=1,
        le=64,
        description="Max workers for PDF processing"
    )
    enable_profiling: bool = Field(default=False, description="Enable profiling")

    # Feature Flags
    enable_web_search: bool = Field(default=True, description="Enable web search feature")
    enable_vector_search: bool = Field(default=True, description="Enable vector search")
    enable_metrics: bool = Field(default=True, description="Enable metrics collection")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    @field_validator("environment")
    @classmethod
    def validate_environment(cls, v: str) -> str:
        """Validate environment value"""
        if v not in ["development", "staging", "production"]:
            raise ValueError("Environment must be development, staging, or production")
        return v

    @field_validator("reload")
    @classmethod
    def validate_reload(cls, v: bool, info) -> bool:
        """Ensure reload is only enabled in development"""
        if v and info.data.get("environment") == "production":
            raise ValueError("Reload cannot be enabled in production")
        return v

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Parse CORS origins from string or list"""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    @field_validator("secret_key")
    @classmethod
    def generate_secret_key(cls, v: str) -> str:
        """Generate secret key if not provided"""
        if not v:
            import secrets
            return secrets.token_urlsafe(32)
        return v

    def get_cors_config(self) -> dict:
        """Get CORS middleware configuration"""
        return {
            "allow_origins": self.cors_origins,
            "allow_credentials": self.cors_allow_credentials,
            "allow_methods": self.cors_allow_methods,
            "allow_headers": self.cors_allow_headers,
        }

    def is_production(self) -> bool:
        """Check if running in production"""
        return self.environment == "production"

    def is_development(self) -> bool:
        """Check if running in development"""
        return self.environment == "development"


# Singleton instance
_settings: Optional[Settings] = None


def get_settings() -> Settings:
    """Get settings instance (singleton pattern)"""
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings


# Export settings instance
settings = get_settings()


# Validate required settings on import
if __name__ != "__main__":
    try:
        settings = get_settings()
        print(f"✅ Configuration loaded successfully for {settings.environment} environment")
    except Exception as e:
        print(f"❌ Configuration error: {e}")
        raise

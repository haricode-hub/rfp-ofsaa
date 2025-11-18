from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False
    
    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:8000"]
    
    # File processing
    max_file_size_mb: int = 20
    
    # AI Processing
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.1:8b"
    ollama_timeout: int = 60
    analysis_timeout: int = 80
    analysis_max_chars: int = 6000
    
    # Organization
    org_name: str = "JMR Infotech"
    org_tagline: str = "AI-orchestrated Delivery • Banking & Cloud"
    org_website: str = "https://www.jmrinfotech.com"
    org_email: str = "contact@jmrinfotech.com"
    org_phone: str = "+91 99999 99999"
    org_address: str = "Bengaluru, India"
    currency: str = "USD"
    default_tax_percent: float = 18.0
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
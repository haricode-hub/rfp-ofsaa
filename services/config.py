from pydantic_settings import BaseSettings
from typing import List
from pydantic import Field, ConfigDict

class Settings(BaseSettings):
    # Server
    host: str = Field(default="0.0.0.0", description="Server host")
    port: int = Field(default=8000, description="Server port")
    debug: bool = Field(default=False, description="Debug mode")
    
    # CORS
    cors_origins_str: str = Field(
        default="http://localhost:3000,http://localhost:8000,http://127.0.0.1:8000",
        description="Allowed CORS origins as comma-separated string"
    )
    
    # File processing
    max_file_size_mb: int = Field(default=20, description="Maximum file size in MB")
    temp_dir: str = Field(default="temp", description="Temporary file directory")
    logs_dir: str = Field(default="logs", description="Logs directory")
    
    # AI Processing (Ollama for RFP)
    ollama_base_url: str = Field(default="http://localhost:11434", description="Ollama base URL")
    ollama_model: str = Field(default="llama3.1:8b", description="Ollama model to use")
    ollama_timeout: int = Field(default=60, description="Ollama API timeout in seconds")
    analysis_timeout: int = Field(default=80, description="Analysis timeout in seconds")
    analysis_max_chars: int = Field(default=6000, description="Maximum characters for analysis")
    
    # Organization
    org_name: str = Field(default="JMR Infotech", description="Organization name")
    org_tagline: str = Field(default="AI-orchestrated Delivery • Banking & Cloud", description="Organization tagline")
    org_website: str = Field(default="https://www.jmrinfotech.com", description="Organization website")
    org_email: str = Field(default="contact@jmrinfotech.com", description="Organization email")
    org_phone: str = Field(default="+91 99999 99999", description="Organization phone")
    org_address: str = Field(default="Bengaluru, India", description="Organization address")
    currency: str = Field(default="USD", description="Default currency")
    default_tax_percent: float = Field(default=18.0, description="Default tax percentage")
    
    model_config = ConfigDict(
        env_file=".env",
        case_sensitive=False,
    )
    
    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins_str.split(",") if origin.strip()]
    
    @property
    def max_file_size_bytes(self) -> int:
        return self.max_file_size_mb * 1024 * 1024

settings = Settings()
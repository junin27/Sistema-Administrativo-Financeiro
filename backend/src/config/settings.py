"""
Configurações da aplicação usando Pydantic Settings.
Aplica o padrão de configuração centralizada com validação de tipos.
"""

from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Configurações da aplicação com validação de tipos."""
    
    # Database Configuration
    database_url: str = Field(default="postgresql://postgres:postgres@localhost:5432/sistema_financeiro", description="URL de conexão com PostgreSQL")
    
    # Google Gemini AI Configuration
    gemini_api_key: str = Field(default="fake_key_for_development", description="Chave da API do Google Gemini")
    
    # Application Configuration
    app_name: str = Field(default="Sistema Administrativo Financeiro")
    app_version: str = Field(default="1.0.0")
    debug: bool = Field(default=True)
    
    # Security Configuration
    secret_key: str = Field(default="dev-secret-key-change-in-production", description="Chave secreta para JWT")
    
    # CORS Configuration
    allowed_origins: List[str] = Field(
        default=["http://localhost:3000", "http://127.0.0.1:3000"]
    )
    
    # File Upload Configuration
    max_file_size_mb: int = Field(default=10)
    upload_folder: str = Field(default="uploads")
    
    # Logging Configuration
    log_level: str = Field(default="INFO")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Instância global das configurações
settings = Settings()

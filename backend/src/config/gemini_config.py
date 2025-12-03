"""
Configuração dinâmica da API key do Gemini.
Permite atualizar a API key em runtime sem reiniciar o servidor.
"""

from typing import Optional
import os
from .settings import settings

# Armazenamento em memória para API key do Gemini
_gemini_api_key_memory: Optional[str] = None


def set_gemini_api_key(api_key: str) -> None:
    """
    Define a API key do Gemini em memória.
    
    Args:
        api_key: Chave da API do Google Gemini
    """
    global _gemini_api_key_memory
    _gemini_api_key_memory = api_key
    # Também atualiza a variável de ambiente para esta sessão
    os.environ["GEMINI_API_KEY"] = api_key
    # Atualiza o settings (isso não persiste, mas permite uso imediato)
    settings.gemini_api_key = api_key


def get_gemini_api_key() -> Optional[str]:
    """
    Obtém a API key do Gemini.
    
    Prioridade:
    1. Memória (atualizada via endpoint)
    2. Variável de ambiente
    3. Settings
    
    Returns:
        API key do Gemini ou None se não configurada
    """
    global _gemini_api_key_memory
    
    return (
        _gemini_api_key_memory or
        os.getenv("GEMINI_API_KEY") or
        os.getenv("GOOGLE_API_KEY") or
        (settings.gemini_api_key if settings.gemini_api_key else None)
    )


def has_gemini_api_key() -> bool:
    """
    Verifica se há uma API key do Gemini configurada.
    
    Returns:
        True se há API key configurada, False caso contrário
    """
    return bool(get_gemini_api_key())


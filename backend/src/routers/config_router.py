"""
Router para configurações da aplicação.
Permite atualizar configurações em runtime, como API keys.
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
import logging

from ..config.gemini_config import set_gemini_api_key, get_gemini_api_key, has_gemini_api_key

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/config", tags=["Config"])


class GeminiApiKeyRequest(BaseModel):
    """Request para atualizar API key do Gemini."""
    api_key: str = Field(..., description="Chave da API do Google Gemini", min_length=1)


class GeminiApiKeyResponse(BaseModel):
    """Response da atualização da API key."""
    success: bool
    message: str
    has_api_key: bool


@router.post("/gemini-api-key", response_model=GeminiApiKeyResponse)
async def update_gemini_api_key(request: GeminiApiKeyRequest):
    """
    Atualiza a API key do Gemini em runtime.
    
    A API key será armazenada em memória e usada por todos os serviços
    que precisam da API do Gemini. Esta atualização não persiste após
    reiniciar o servidor.
    """
    global _gemini_api_key_memory
    
    try:
        api_key = request.api_key.strip()
        
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="API key não pode ser vazia"
            )
        
        # Validar formato básico da API key (começa com AIza)
        if not api_key.startswith("AIza"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Formato de API key inválido. A API key do Google Gemini deve começar com 'AIza'"
            )
        
        # Armazenar em memória
        set_gemini_api_key(api_key)
        
        logger.info("API key do Gemini atualizada com sucesso")
        
        return GeminiApiKeyResponse(
            success=True,
            message="API key do Gemini atualizada com sucesso",
            has_api_key=True
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar API key do Gemini: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao atualizar API key: {str(e)}"
        )


@router.get("/gemini-api-key", response_model=GeminiApiKeyResponse)
async def get_gemini_api_key_status():
    """
    Verifica se há uma API key do Gemini configurada.
    
    Não retorna a API key por segurança, apenas indica se está configurada.
    """
    has_key = has_gemini_api_key()
    
    return GeminiApiKeyResponse(
        success=True,
        message="Status da API key verificado",
        has_api_key=has_key
    )


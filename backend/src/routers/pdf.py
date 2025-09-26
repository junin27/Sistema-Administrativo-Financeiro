"""
Router principal para processamento de PDF.
Implementa upload e processamento com Google Gemini AI.
"""

import time
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from ..config.database import get_db
from ..agent.pdf_processing import PDFProcessingService
from ..schemas.pdf_processing import ProcessamentoPDFResponseSchema

router = APIRouter(prefix="/pdf", tags=["Processamento PDF"])

# Constantes
ERRO_INTERNO = "Erro interno do servidor"
ARQUIVO_INVALIDO = "Arquivo inválido ou não é um PDF"
TAMANHO_MAXIMO_MB = 10


def get_pdf_service() -> PDFProcessingService:
    """Dependency injection para PDFProcessingService."""
    return PDFProcessingService()


@router.post("/upload", response_model=ProcessamentoPDFResponseSchema)
async def processar_pdf(
    file: UploadFile = File(..., description="Arquivo PDF da nota fiscal"),
    service: PDFProcessingService = Depends(get_pdf_service)
):
    """
    Faz upload e processa PDF extraindo dados da nota fiscal.
    Retorna dados estruturados e classificações automáticas.
    """
    try:
        # Validar tipo de arquivo
        if not file.content_type or "pdf" not in file.content_type.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=ARQUIVO_INVALIDO
            )
        
        # Validar tamanho do arquivo
        content = await file.read()
        
        if len(content) > TAMANHO_MAXIMO_MB * 1024 * 1024:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Arquivo muito grande. Máximo permitido: {TAMANHO_MAXIMO_MB}MB"
            )
        
        if len(content) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Arquivo vazio"
            )
        
        # Processar PDF
        resultado = await service.process_pdf(content, file.filename or "upload.pdf")
        
        return resultado
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{ERRO_INTERNO}: {str(e)}"
        )


@router.get("/health", response_model=Dict[str, Any])
async def health_check():
    """Verifica a saúde do serviço de processamento de PDF."""
    try:
        service = PDFProcessingService()
        
        return {
            "status": "healthy",
            "service": "PDF Processing",
            "timestamp": time.time(),
            "gemini_configured": hasattr(service, 'model') and service.model is not None
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Serviço indisponível: {str(e)}"
        )

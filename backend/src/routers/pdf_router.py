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
from ..schemas.post_processing_schemas import PostProcessingResult
from ..core.exceptions import DuplicateInvoiceError

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
    service: PDFProcessingService = Depends(get_pdf_service),
    db: Session = Depends(get_db),
    enable_post_processing: bool = False
):
    """
    Faz upload e processa PDF extraindo dados da nota fiscal.
    Retorna dados estruturados e classificações automáticas.
    
    Args:
        file: Arquivo PDF da nota fiscal
        service: Serviço de processamento de PDF
        db: Sessão do banco de dados
        enable_post_processing: Se deve executar pós-processamento (verificação e criação de entidades)
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
        if enable_post_processing:
            # Usar o novo fluxo com pós-processamento
            resultado_completo = await service.process_post_extraction(
                content, 
                file.filename or "upload.pdf",
                db
            )
            
            # Converter para o formato esperado pelo endpoint original
            resultado = ProcessamentoPDFResponseSchema(
                sucesso=resultado_completo.success,
                dados_extraidos=resultado_completo.extracted_data,
                erro=resultado_completo.error_message if not resultado_completo.success else None,
                tempo_processamento=resultado_completo.processing_time
            )
        else:
            # Usar o fluxo original (apenas extração)
            resultado = await service.process_pdf(content, file.filename or "upload.pdf")
        
        return resultado
    
    except HTTPException:
        raise
    except DuplicateInvoiceError:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{ERRO_INTERNO}: {str(e)}"
        )


@router.post("/process-complete", response_model=ProcessamentoPDFResponseSchema)
async def processar_pdf_completo(
    file: UploadFile = File(..., description="Arquivo PDF da nota fiscal"),
    service: PDFProcessingService = Depends(get_pdf_service),
    db: Session = Depends(get_db)
):
    """
    Faz upload, processa PDF e executa pós-processamento completo.
    Inclui verificação de existência e criação automática de entidades.
    Retorna dados no formato compatível com o frontend.
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
        
        # Processar PDF com pós-processamento completo
        print(f"DEBUG: Iniciando process_post_extraction para arquivo: {file.filename}")
        resultado_post = await service.process_post_extraction(
            content, 
            file.filename or "upload.pdf",
            db
        )
        print(f"DEBUG: Resultado do pós-processamento - Success: {resultado_post.success}")
        print(f"DEBUG: Fornecedor: {resultado_post.fornecedor}")
        print(f"DEBUG: Faturado: {resultado_post.faturado}")
        print(f"DEBUG: Despesas: {resultado_post.despesas}")
        print(f"DEBUG: Extracted data: {resultado_post.extracted_data}")
        
        # Converter resultado para formato compatível com frontend
        if resultado_post.success and resultado_post.extracted_data:
            # Criar verificações baseadas nos resultados do pós-processamento
            print(f"DEBUG: Criando verificações...")
            verificacoes = {
                "supplier": {
                    "exists": resultado_post.fornecedor.status.exists if resultado_post.fornecedor else False,
                    "message": "Verificado" if resultado_post.fornecedor else "Não verificado",
                    "id": str(resultado_post.fornecedor.status.entity_id) if resultado_post.fornecedor and resultado_post.fornecedor.status.entity_id else None,
                    "company_name": resultado_post.extracted_data.fornecedor.razao_social if resultado_post.extracted_data else None,
                    "tax_id": resultado_post.extracted_data.fornecedor.cnpj if resultado_post.extracted_data else None
                },
                "billed_person": {
                    "exists": resultado_post.faturado.status.exists if resultado_post.faturado else False,
                    "message": "Verificado" if resultado_post.faturado else "Não verificado",
                    "id": str(resultado_post.faturado.status.entity_id) if resultado_post.faturado and resultado_post.faturado.status.entity_id else None,
                    "full_name": resultado_post.extracted_data.faturado.nome_completo if resultado_post.extracted_data and resultado_post.extracted_data.faturado else None,
                    "document_id": resultado_post.extracted_data.faturado.cpf if resultado_post.extracted_data and resultado_post.extracted_data.faturado else None
                },
                "expenses": []
            }
            print(f"DEBUG: Verificações criadas: {verificacoes}")
            
            # Adicionar verificações de despesas baseadas nas classificações
            print(f"DEBUG: Adicionando despesas às verificações - Total: {len(resultado_post.despesas) if resultado_post.despesas else 0}")
            if resultado_post.despesas:
                for despesa in resultado_post.despesas:
                    verificacoes["expenses"].append({
                        "exists": despesa.status.exists,
                        "message": "Verificado" if despesa.status.exists else "Não encontrado",
                        "id": str(despesa.status.entity_id) if despesa.status.entity_id else None,
                        "category": despesa.categoria,
                        "description": despesa.descricao or "Classificação automática",
                        "confidence": 1.0  # Assumindo alta confiança para dados extraídos
                    })
            else:
                print("DEBUG: Nenhuma verificação de despesa encontrada no resultado do pós-processamento")
            print(f"DEBUG: Verificações finais com despesas: {verificacoes}")
            
            # Criar registros criados
            registros_criados = {
                "supplier_created": resultado_post.fornecedor.status.created if resultado_post.fornecedor else False,
                "billed_person_created": resultado_post.faturado.status.created if resultado_post.faturado else False,
                "expense_types_created": [
                    {"category": d.categoria, "description": d.descricao or ""} 
                    for d in resultado_post.despesas if d.status.created
                ] if resultado_post.despesas else [],
                "payable_account_created": resultado_post.movimento_criado,
                "installments_created": resultado_post.movimento_criado
            }
            
            return ProcessamentoPDFResponseSchema(
                sucesso=True,
                dados_extraidos=resultado_post.extracted_data,
                verificacoes=verificacoes,
                registros_criados=registros_criados,
                tempo_processamento=resultado_post.processing_time
            )
            print(f"DEBUG: Resposta final criada com verificações: {verificacoes is not None}")
        else:
            return ProcessamentoPDFResponseSchema(
                sucesso=False,
                erro=resultado_post.error_message or "Erro no processamento",
                tempo_processamento=resultado_post.processing_time
            )
    
    except DuplicateInvoiceError:
        raise
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
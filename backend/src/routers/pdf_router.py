"""
Router principal para processamento de PDF.
Implementa upload e processamento com Google Gemini AI.
Usa arquitetura de agentes para processamento modular.
"""

import time
import tempfile
import os
import logging
from datetime import datetime
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from ..config.database import get_db
from ..agents.orchestrator.orchestrator_agent import OrchestratorAgent
from ..schemas.pdf_processing import ProcessamentoPDFResponseSchema
from ..core.exceptions import DuplicateInvoiceError

router = APIRouter(prefix="/pdf", tags=["Processamento PDF"])
logger = logging.getLogger(__name__)

# Constantes
ERRO_INTERNO = "Erro interno do servidor"
ARQUIVO_INVALIDO = "Arquivo inválido ou não é um PDF"
TAMANHO_MAXIMO_MB = 10


def _generate_transaction_id() -> str:
    """Gera ID único para transação."""
    return f"TRX-{datetime.now().strftime('%Y%m%d%H%M%S')}"


def _save_temp_file(content: bytes, filename: str) -> str:
    """
    Salva arquivo temporário e retorna o caminho.
    
    Args:
        content: Conteúdo do arquivo
        filename: Nome original do arquivo
        
    Returns:
        Caminho completo do arquivo temporário
    """
    temp_dir = tempfile.gettempdir()
    temp_path = os.path.join(temp_dir, f"{_generate_transaction_id()}_{filename}")
    
    with open(temp_path, "wb") as f:
        f.write(content)
    
    return temp_path


@router.post("/analyze-only")
async def analisar_pdf_sem_salvar(
    file: UploadFile = File(..., description="Arquivo PDF da nota fiscal"),
    db: Session = Depends(get_db)
):
    """
    Analisa PDF e retorna dados extraídos SEM SALVAR no banco de dados.
    O usuário pode revisar os dados antes de decidir salvar.
    
    Args:
        file: Arquivo PDF da nota fiscal
        db: Sessão do banco de dados
    
    Returns:
        Dados extraídos e verificações (sem salvar)
    """
    temp_path = None
    
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
        
        # Salvar arquivo temporário
        temp_path = _save_temp_file(content, file.filename or "upload.pdf")
        
        # APENAS ANALISAR - NÃO SALVAR
        from ..agents.pdf_analyzer.pdf_analyzer_agent import PDFAnalyzerAgent
        from ..agents.data_analyzer.data_analyzer_agent import DataAnalyzerAgent
        
        pdf_analyzer = PDFAnalyzerAgent()
        data_analyzer = DataAnalyzerAgent(db)
        
        # 1. Extrair dados do PDF
        dados_pdf = await pdf_analyzer.process_pdf(temp_path)
        
        logger.info(f"📋 PDF analisado - Nota Fiscal: {dados_pdf.numero_nota_fiscal}")
        logger.info("⚠️ MODO ANÁLISE - NÃO SERÁ SALVO NO BANCO DE DADOS")
        
        # 2. Verificar existências SEM criar
        fornecedor_check = await data_analyzer.check_fornecedor_exists(
            cnpj=dados_pdf.fornecedor.cnpj,
            razao_social=dados_pdf.fornecedor.razao_social
        )
        
        logger.info(f"Fornecedor existe? {fornecedor_check.status.exists}")
        
        faturado_check = None
        if dados_pdf.faturado:
            faturado_check = await data_analyzer.check_faturado_exists(
                cpf=dados_pdf.faturado.cpf,
                nome_completo=dados_pdf.faturado.nome_completo
            )
        
        classificacoes_check = []
        for classif in dados_pdf.classificacoes_despesa:
            check = await data_analyzer.check_classificacao_exists(
                tipo="DESPESA",
                descricao=classif.descricao
            )
            classificacoes_check.append({
                "exists": check[0],
                "id": check[1],
                "categoria": classif.categoria,
                "descricao": classif.descricao,
                "confianca": classif.confianca
            })
        
        # 3. Retornar dados para revisão
        return {
            "success": True,
            "message": "PDF analisado com sucesso. Revise os dados antes de salvar.",
            "dados_extraidos": dados_pdf,
            "verificacoes": {
                "fornecedor": {
                    "exists": fornecedor_check.status.exists,
                    "id": fornecedor_check.status.entity_id,
                    "razao_social": dados_pdf.fornecedor.razao_social,
                    "cnpj": dados_pdf.fornecedor.cnpj,
                    "acao": "Usar existente" if fornecedor_check.status.exists else "Criar novo"
                },
                "faturado": {
                    "exists": faturado_check.status.exists if faturado_check else False,
                    "id": faturado_check.status.entity_id if faturado_check else None,
                    "nome_completo": dados_pdf.faturado.nome_completo if dados_pdf.faturado else None,
                    "cpf": dados_pdf.faturado.cpf if dados_pdf.faturado else None,
                    "acao": "Usar existente" if (faturado_check and faturado_check.status.exists) else "Criar novo"
                } if dados_pdf.faturado else None,
                "classificacoes": classificacoes_check
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao analisar PDF: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao analisar PDF: {str(e)}"
        )
    finally:
        # Limpar arquivo temporário
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception as e:
                logger.warning(f"Erro ao remover arquivo temporário: {e}")


@router.post("/upload", response_model=ProcessamentoPDFResponseSchema)
async def processar_pdf(
    file: UploadFile = File(..., description="Arquivo PDF da nota fiscal"),
    db: Session = Depends(get_db)
):
    """
    Faz upload e processa PDF extraindo dados da nota fiscal.
    Usa arquitetura de agentes: PDFAnalyzerAgent + DataAnalyzerAgent + OrchestratorAgent.
    
    Args:
        file: Arquivo PDF da nota fiscal
        db: Sessão do banco de dados
    
    Returns:
        Dados estruturados com análise completa do PDF
    """
    temp_path = None
    
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
        
        # Salvar arquivo temporário
        temp_path = _save_temp_file(content, file.filename or "upload.pdf")
        
        # Criar orchestrator agent
        orchestrator = OrchestratorAgent(db)
        
        # Processar PDF completo com agentes
        inicio = time.time()
        resultado = await orchestrator.process_pdf_complete(
            pdf_path=temp_path,
            transaction_id=_generate_transaction_id()
        )
        tempo_processamento = time.time() - inicio
        
        # Converter resultado para schema esperado
        return ProcessamentoPDFResponseSchema(
            sucesso=resultado["success"],
            dados_extraidos=resultado["pdf_analysis"]["dados_extraidos"],
            erro=None if resultado["success"] else "Erro no processamento",
            tempo_processamento=tempo_processamento
        )
    
    except HTTPException:
        raise
    except DuplicateInvoiceError:
        raise
    except Exception as e:
        logger.error(f"Erro ao processar PDF: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{ERRO_INTERNO}: {str(e)}"
        )
    finally:
        # Limpar arquivo temporário
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception as e:
                logger.warning(f"Erro ao remover arquivo temporário: {str(e)}")


@router.post("/process-complete", response_model=ProcessamentoPDFResponseSchema)
async def processar_pdf_completo(
    file: UploadFile = File(..., description="Arquivo PDF da nota fiscal"),
    db: Session = Depends(get_db)
):
    """
    Faz upload, processa PDF e executa workflow completo.
    Inclui verificação de existência e criação automática de entidades.
    Retorna dados no formato compatível com o frontend.
    
    Workflow:
    1. PDFAnalyzerAgent: Extrai dados do PDF com IA Gemini
    2. DataAnalyzerAgent: Verifica existência de fornecedor/faturado/classificações
    3. OrchestratorAgent: Cria movimento + parcelas + vincula classificações
    """
    temp_path = None
    
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
        
        # Salvar arquivo temporário
        temp_path = _save_temp_file(content, file.filename or "upload.pdf")
        
        # Criar orchestrator agent
        orchestrator = OrchestratorAgent(db)
        
        # Processar PDF completo
        inicio = time.time()
        resultado = await orchestrator.process_pdf_complete(
            pdf_path=temp_path,
            transaction_id=_generate_transaction_id()
        )
        tempo_processamento = time.time() - inicio
        
        logger.info(f"PDF processado com sucesso: {resultado['movimento_id']}")
        
        # Converter resultado para formato esperado pelo frontend
        if resultado["success"]:
            # Criar verificações baseadas nos resultados
            verificacoes = {
                "supplier": {
                    "exists": resultado["entities_created"]["fornecedor"]["exists"],
                    "message": "Verificado",
                    "id": str(resultado["entities_ids"]["fornecedor_id"]) if resultado["entities_ids"]["fornecedor_id"] else None,
                    "company_name": resultado["pdf_analysis"]["dados_extraidos"].fornecedor.razao_social,
                    "tax_id": resultado["pdf_analysis"]["dados_extraidos"].fornecedor.cnpj
                },
                "billed_person": {
                    "exists": resultado["entities_created"]["faturado"]["exists"],
                    "message": "Verificado",
                    "id": str(resultado["entities_ids"]["faturado_id"]) if resultado["entities_ids"]["faturado_id"] else None,
                    "full_name": resultado["pdf_analysis"]["dados_extraidos"].faturado.nome_completo if resultado["pdf_analysis"]["dados_extraidos"].faturado else None,
                    "document_id": resultado["pdf_analysis"]["dados_extraidos"].faturado.cpf if resultado["pdf_analysis"]["dados_extraidos"].faturado else None
                },
                "expenses": [
                    {
                        "exists": classif["exists"],
                        "message": "Verificado",
                        "id": str(classif["id"]) if classif["id"] else None,
                        "category": classif["categoria"],
                        "description": classif["descricao"],
                        "confidence": 1.0
                    }
                    for classif in resultado["entities_created"]["classificacoes"]
                ]
            }
            
            # Criar registros criados
            registros_criados = {
                "supplier_created": resultado["entities_created"]["fornecedor"]["created"],
                "billed_person_created": resultado["entities_created"]["faturado"]["created"],
                "expense_types_created": [
                    {"category": c["categoria"], "description": c["descricao"]} 
                    for c in resultado["entities_created"]["classificacoes"] if c["created"]
                ],
                "payable_account_created": True,
                "installments_created": True
            }
            
            return ProcessamentoPDFResponseSchema(
                sucesso=True,
                dados_extraidos=resultado["pdf_analysis"]["dados_extraidos"],
                erro=None,
                tempo_processamento=tempo_processamento
            )
        else:
            return ProcessamentoPDFResponseSchema(
                sucesso=False,
                erro="Erro no processamento do PDF",
                dados_extraidos=None,
                tempo_processamento=tempo_processamento
            )
    
    except DuplicateInvoiceError:
        raise
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao processar PDF completo: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"{ERRO_INTERNO}: {str(e)}"
        )
    finally:
        # Limpar arquivo temporário
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception as e:
                logger.warning(f"Erro ao remover arquivo temporário: {str(e)}")


# ==================== COMANDOS DOS AGENTES ====================

@router.post("/agent/check-exists")
async def verificar_entidade_existe(
    entity_type: str,
    db: Session = Depends(get_db),
    **kwargs
) -> Dict[str, Any]:
    """
    Comando: Verificar se entidade existe no banco.
    
    Args:
        entity_type: Tipo da entidade (fornecedor, faturado, classificacao)
        **kwargs: Parâmetros específicos do tipo de entidade
        
    Examples:
        - fornecedor: cnpj="12345678000190", razao_social="Empresa XYZ"
        - faturado: cpf="12345678900", nome_completo="João Silva"
        - classificacao: tipo="DESPESA", descricao="Alimentação"
    
    Returns:
        {"exists": bool, "id": int|None, "message": str}
    """
    try:
        orchestrator = OrchestratorAgent(db)
        resultado = await orchestrator.check_entity_exists(entity_type, **kwargs)
        return resultado
    except Exception as e:
        logger.error(f"Erro ao verificar existência: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao verificar existência: {str(e)}"
        )


@router.post("/agent/create-entity")
async def criar_entidade(
    entity_type: str,
    db: Session = Depends(get_db),
    **kwargs
) -> Dict[str, Any]:
    """
    Comando: Criar nova entidade no banco (botão ADICIONAR).
    
    Args:
        entity_type: Tipo da entidade (fornecedor, faturado, classificacao)
        **kwargs: Dados da entidade a ser criada
        
    Examples:
        - fornecedor: cnpj, razao_social, endereco, telefone
        - faturado: cpf, nome_completo, endereco
        - classificacao: tipo, descricao
    
    Returns:
        {"success": bool, "id": int|None, "message": str}
    """
    try:
        orchestrator = OrchestratorAgent(db)
        resultado = await orchestrator.create_entity(entity_type, **kwargs)
        return resultado
    except Exception as e:
        logger.error(f"Erro ao criar entidade: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao criar entidade: {str(e)}"
        )


@router.delete("/agent/delete-entity/{entity_type}/{entity_id}")
async def deletar_entidade(
    entity_type: str,
    entity_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Comando: Deletar entidade (soft delete) - botão REMOVER.
    
    Args:
        entity_type: Tipo da entidade (pessoa, movimento, classificacao)
        entity_id: ID da entidade a ser inativada
    
    Returns:
        {"success": bool, "message": str}
    """
    try:
        orchestrator = OrchestratorAgent(db)
        resultado = await orchestrator.delete_entity(entity_type, entity_id)
        return resultado
    except Exception as e:
        logger.error(f"Erro ao deletar entidade: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao deletar entidade: {str(e)}"
        )


@router.get("/check-invoice-exists")
async def verificar_nota_fiscal_existe(
    numero_nota_fiscal: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Verifica se uma nota fiscal já está cadastrada no sistema.
    
    Args:
        numero_nota_fiscal: Número da nota fiscal a ser verificada
        db: Sessão do banco de dados
    
    Returns:
        {"exists": bool, "movimento_id": int|None, "numero_nota_fiscal": str, "fornecedor_razao_social": str|None}
    """
    try:
        from ..repositories.ddl_repositories import MovimentoContasRepository
        from ..models.ddl_models import Pessoas, MovimentoContas
        
        movimento_repo = MovimentoContasRepository(db)
        
        # Buscar movimento pela nota fiscal
        movimento = db.query(MovimentoContas).filter(
            MovimentoContas.numeronotafiscal == numero_nota_fiscal,
            MovimentoContas.deleted_at.is_(None)
        ).first()
        
        if movimento:
            # Buscar fornecedor
            fornecedor = db.query(Pessoas).filter(
                Pessoas.idPessoas == movimento.Pessoas_idFornecedorCliente
            ).first()
            
            return {
                "exists": True,
                "movimento_id": getattr(movimento, 'idMovimentoContas', None),
                "numero_nota_fiscal": numero_nota_fiscal,
                "fornecedor_razao_social": getattr(fornecedor, 'razaosocial', None) if fornecedor else None
            }
        else:
            return {
                "exists": False,
                "movimento_id": None,
                "numero_nota_fiscal": numero_nota_fiscal,
                "fornecedor_razao_social": None
            }
    
    except Exception as e:
        logger.error(f"Erro ao verificar nota fiscal: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao verificar nota fiscal: {str(e)}"
        )


@router.delete("/delete-invoice/{movimento_id}")
async def deletar_nota_fiscal(
    movimento_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Deleta (soft delete) um movimento e suas parcelas associadas.
    
    Args:
        movimento_id: ID do movimento a ser deletado
        db: Sessão do banco de dados
    
    Returns:
        {"success": bool, "message": str}
    """
    try:
        from ..repositories.ddl_repositories import MovimentoContasRepository
        from ..repositories.parcelas_repository import ParcelasContasRepository
        from ..models.ddl_models import MovimentoContas
        from ..models.parcelas_models import ParcelasContas
        
        movimento_repo = MovimentoContasRepository(db)
        parcelas_repo = ParcelasContasRepository(db)
        
        # Buscar movimento
        movimento = movimento_repo.get_by_id(movimento_id)
        
        if not movimento:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Movimento {movimento_id} não encontrado"
            )
        
        # Verificar se já foi deletado
        if movimento.deleted_at is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Movimento {movimento_id} já foi deletado anteriormente"
            )
        
        # Inativar movimento (soft delete) - definir deleted_at
        from datetime import datetime
        movimento.deleted_at = datetime.now()  # type: ignore
        
        logger.info(f"🗑️ Soft delete aplicado ao movimento {movimento_id} (Nota Fiscal: {movimento.numeronotafiscal})")
        
        # Contar parcelas associadas antes de deletar
        parcelas = db.query(ParcelasContas).filter(
            ParcelasContas.MovimentoContas_idMovimentoContas == movimento_id
        ).all()
        
        parcelas_count = len(parcelas)
        
        logger.info(f"Deletando {parcelas_count} parcela(s) associadas...")
        
        # Deletar parcelas associadas (hard delete, pois não tem soft delete)
        for parcela in parcelas:
            db.delete(parcela)
        
        db.commit()
        
        logger.info(f"✅ MOVIMENTO DELETADO! ID: {movimento_id}, Parcelas: {parcelas_count}")
        
        return {
            "success": True,
            "message": f"Movimento {movimento_id} e {parcelas_count} parcela(s) deletados com sucesso"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao deletar movimento: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao deletar movimento: {str(e)}"
        )


@router.post("/save-analyzed-data")
async def salvar_dados_analisados(
    dados_validados: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """
    Salva no banco de dados os dados que foram previamente analisados e validados pelo usuário.
    Este endpoint é chamado quando o usuário clica no botão "Inserir Dados" após revisar.
    
    Args:
        dados_validados: Dados do PDF já validados pelo usuário
        db: Sessão do banco de dados
    
    Returns:
        Resultado da operação de salvamento
    """
    try:
        from ..schemas.pdf_processing import DadosExtraidosPDFSchema
        from ..agent.data_analyzer import DataAnalyzerAgent
        from ..repositories.ddl_repositories import MovimentoContasRepository
        from ..repositories.parcelas_repository import ParcelasContasRepository
        from ..schemas.ddl_schemas import MovimentoContasCreate
        from ..schemas.parcelas_schemas import ParcelasContasCreate
        from ..models.ddl_models import MovimentoContas
        
        # Reconstruir schema a partir dos dados validados
        dados_pdf = DadosExtraidosPDFSchema(**dados_validados)
        
        logger.info(f"💾 SALVANDO dados da Nota Fiscal: {dados_pdf.numero_nota_fiscal}")
        
        # VERIFICAR SE A NOTA FISCAL JÁ EXISTE
        movimento_repo = MovimentoContasRepository(db)
        movimento_existente = db.query(MovimentoContas).filter(
            MovimentoContas.numeronotafiscal == dados_pdf.numero_nota_fiscal,
            MovimentoContas.deleted_at.is_(None)
        ).first()
        
        if movimento_existente:
            logger.warning(f"❌ Nota Fiscal {dados_pdf.numero_nota_fiscal} JÁ EXISTE no banco (ID: {movimento_existente.idMovimentoContas})")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Não é possível inserir esses dados, pois eles já estão armazenados no sistema!"
            )
        
        # Criar data analyzer
        data_analyzer = DataAnalyzerAgent(db)
        
        # Processar entidades
        # 1. Fornecedor
        fornecedor_check = await data_analyzer.check_fornecedor_exists(
            cnpj=dados_pdf.fornecedor.cnpj,
            razao_social=dados_pdf.fornecedor.razao_social
        )
        
        if not fornecedor_check.status.exists:
            fornecedor, msg = await data_analyzer.create_fornecedor(
                cnpj=dados_pdf.fornecedor.cnpj,
                razao_social=dados_pdf.fornecedor.razao_social
            )
            db.commit()
            db.refresh(fornecedor)
            fornecedor_id = getattr(fornecedor, 'idPessoas', None)
        else:
            fornecedor_id = fornecedor_check.status.entity_id
        
        # Garantir que fornecedor_id não seja None
        if fornecedor_id is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao obter ID do fornecedor"
            )
        
        # 2. Faturado (se existir)
        faturado_id: int | None = None
        if dados_pdf.faturado:
            faturado_check = await data_analyzer.check_faturado_exists(
                cpf=dados_pdf.faturado.cpf,
                nome_completo=dados_pdf.faturado.nome_completo
            )
            
            if not faturado_check.status.exists:
                faturado, msg = await data_analyzer.create_faturado(
                    cpf=dados_pdf.faturado.cpf,
                    nome_completo=dados_pdf.faturado.nome_completo
                )
                db.commit()
                db.refresh(faturado)
                faturado_id = getattr(faturado, 'idPessoas', None)
            else:
                faturado_id = faturado_check.status.entity_id
        
        # 3. Classificações
        classificacoes_ids = []
        for classif in dados_pdf.classificacoes_despesa:
            check = await data_analyzer.check_classificacao_exists(
                tipo="DESPESA",
                descricao=classif.descricao
            )
            
            if not check[0]:
                nova_classif, msg = await data_analyzer.create_classificacao(
                    tipo="DESPESA",
                    descricao=classif.descricao
                )
                db.commit()
                db.refresh(nova_classif)
                classificacoes_ids.append(getattr(nova_classif, 'idClassificacao', None))
            else:
                classificacoes_ids.append(check[1])
        
        # 4. Criar movimento
        movimento_repo = MovimentoContasRepository(db)
        movimento_data = MovimentoContasCreate(
            tipo="DESPESA",
            numeronotafiscal=dados_pdf.numero_nota_fiscal,
            dataemissao=dados_pdf.data_emissao,
            descricao=dados_pdf.descricao_produtos,
            status="PENDENTE",
            valortotal=float(dados_pdf.valor_total),
            Pessoas_idFornecedorCliente=fornecedor_id,
            Pessoas_idfaturado=faturado_id if faturado_id is not None else 0
        )
        movimento = movimento_repo.create(movimento_data.model_dump())
        db.commit()
        db.refresh(movimento)
        movimento_id = getattr(movimento, 'idMovimentoContas', None)
        
        # Garantir que movimento_id não seja None
        if movimento_id is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Erro ao criar movimento"
            )
        
        # 5. Criar parcelas
        parcelas_repo = ParcelasContasRepository(db)
        for parcela in dados_pdf.parcelas:
            identificacao = f"{dados_pdf.numero_nota_fiscal}-P{parcela.numero_parcela:02d}"
            parcela_data = ParcelasContasCreate(
                identificacao=identificacao,
                numero_parcela=parcela.numero_parcela,
                valorparcela=float(parcela.valor_parcela),
                datavencimento=parcela.data_vencimento,
                statusparcela="PENDENTE",
                MovimentoContas_idMovimentoContas=movimento_id
            )
            parcelas_repo.create(parcela_data.model_dump())
        
        # 6. Vincular classificações
        if classificacoes_ids:
            from ..models.classificacao_models import Classificacao
            for classif_id in classificacoes_ids:
                classificacao = db.query(Classificacao).filter(
                    Classificacao.idClassificacao == classif_id
                ).first()
                if classificacao:
                    movimento.classificacoes.append(classificacao)
        
        db.commit()
        
        logger.info(f"✅ DADOS SALVOS COM SUCESSO! Movimento ID: {movimento_id}, Nota Fiscal: {dados_pdf.numero_nota_fiscal}")
        
        return {
            "success": True,
            "message": "Dados salvos com sucesso!",
            "movimento_id": movimento_id,
            "fornecedor_id": fornecedor_id,
            "faturado_id": faturado_id,
            "classificacoes_ids": classificacoes_ids
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao salvar dados: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao salvar dados: {str(e)}"
        )


@router.get("/agent/query-entities/{entity_type}")
async def consultar_entidades(
    entity_type: str,
    db: Session = Depends(get_db),
    include_deleted: bool = False
) -> Dict[str, Any]:
    """
    Comando: Consultar entidades com filtros (comando QUERY).
    
    Args:
        entity_type: Tipo da entidade (pessoa, movimento, classificacao)
        include_deleted: Se deve incluir registros inativos
    
    Returns:
        {"success": bool, "count": int, "entities": List[dict]}
    """
    try:
        orchestrator = OrchestratorAgent(db)
        resultado = await orchestrator.query_entities(
            entity_type=entity_type,
            filters=None,
            include_deleted=include_deleted
        )
        return resultado
    except Exception as e:
        logger.error(f"Erro ao consultar entidades: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao consultar entidades: {str(e)}"
        )


@router.get("/health", response_model=Dict[str, Any])
async def health_check():
    """Verifica a saúde do serviço de processamento de PDF."""
    try:
        return {
            "status": "healthy",
            "service": "PDF Processing - Agent Architecture",
            "timestamp": time.time(),
            "agents": {
                "pdf_analyzer": "PDFAnalyzerAgent (Gemini AI)",
                "data_analyzer": "DataAnalyzerAgent (CRUD)",
                "orchestrator": "OrchestratorAgent (Coordinator)"
            }
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Serviço indisponível: {str(e)}"
        )
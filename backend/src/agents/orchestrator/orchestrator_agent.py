"""
Orchestrator Agent - Coordena o fluxo entre PDFAnalyzerAgent e DataAnalyzerAgent.

Responsabilidades:
- Gerenciar o pipeline completo de processamento de PDF
- Coordenar análise de PDF → análise de dados → criação de entidades
- Decidir quando criar, consultar ou deletar dados
- Consolidar logs e mensagens dos agentes
- Retornar resposta unificada
"""
import logging
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from ..pdf_analyzer.pdf_analyzer_agent import PDFAnalyzerAgent
from ..data_analyzer.data_analyzer_agent import DataAnalyzerAgent
from ...schemas.pdf_processing import DadosExtraidosPDFSchema
from ...repositories.ddl_repositories import MovimentoContasRepository
from ...repositories.parcelas_repository import ParcelasContasRepository
from ...repositories.classificacao_repository import ClassificacaoRepository
from ...schemas.ddl_schemas import MovimentoContasCreate
from ...schemas.parcelas_schemas import ParcelasContasCreate
from ...core.exceptions import PDFProcessingError

logger = logging.getLogger(__name__)


class OrchestratorAgent:
    """
    Agent orquestrador que coordena todo o fluxo de processamento.
    
    Workflow:
    1. Recebe PDF
    2. Aciona PDFAnalyzerAgent para extrair dados
    3. Aciona DataAnalyzerAgent para verificar/criar entidades
    4. Cria movimento com parcelas e classificações
    5. Retorna resposta consolidada
    """
    
    def __init__(self, db: Session):
        """
        Inicializa o orchestrator com sessão do banco.
        
        Args:
            db: Sessão SQLAlchemy
        """
        self.db = db
        self.pdf_analyzer = PDFAnalyzerAgent()
        self.data_analyzer = DataAnalyzerAgent(db)
        
        self.movimento_repo = MovimentoContasRepository(db)
        self.parcelas_repo = ParcelasContasRepository(db)
        self.classificacao_repo = ClassificacaoRepository(db)
        
        self.logs: List[str] = []
        
        logger.info("OrchestratorAgent inicializado")
    
    async def process_pdf_complete(
        self,
        pdf_path: str,
        transaction_id: str
    ) -> Dict[str, Any]:
        """
        Pipeline completo de processamento de PDF.
        
        Args:
            pdf_path: Caminho do arquivo PDF
            transaction_id: ID único da transação
            
        Returns:
            Dicionário com resultado completo do processamento
        """
        self.logs = []
        self._add_log(f"🚀 Iniciando processamento de PDF - Transaction ID: {transaction_id}")
        
        try:
            # PASSO 1: Análise do PDF
            self._add_log("📄 PASSO 1: Analisando PDF com IA...")
            dados_pdf = await self.pdf_analyzer.process_pdf(pdf_path)
            self._add_log(f"✅ PDF analisado: NF-e {dados_pdf.numero_nota_fiscal}")
            
            # PASSO 2: Análise de dados - Fornecedor
            self._add_log("🔍 PASSO 2: Verificando dados no banco...")
            fornecedor_check = await self._handle_fornecedor(dados_pdf)
            
            # PASSO 3: Análise de dados - Faturado
            faturado_check = await self._handle_faturado(dados_pdf)
            
            # PASSO 4: Análise de dados - Classificações
            despesas_check = await self._handle_classificacoes(dados_pdf)
            
            # PASSO 5: Sugestões do DataAnalyzer
            sugestoes = await self.data_analyzer.suggest_actions(
                fornecedor_exists=fornecedor_check["exists"],
                faturado_exists=faturado_check["exists"],
                classificacoes_missing=[d["descricao"] for d in despesas_check if not d["exists"]]
            )
            self._add_log(f"💡 Ações necessárias: {len(sugestoes['actions_required'])}")
            
            # PASSO 6: Criação do movimento
            self._add_log("💾 PASSO 3: Criando movimento financeiro...")
            movimento_id = await self._create_movimento_completo(
                dados_pdf=dados_pdf,
                fornecedor_id=fornecedor_check["id"],
                faturado_id=faturado_check["id"],
                despesas_check=despesas_check
            )
            
            # PASSO 7: Consolidação da resposta
            resposta = self._build_response(
                movimento_id=movimento_id,
                dados_pdf=dados_pdf,
                fornecedor_check=fornecedor_check,
                faturado_check=faturado_check,
                despesas_check=despesas_check,
                sugestoes=sugestoes,
                transaction_id=transaction_id
            )
            
            self._add_log(f"✅ Processamento concluído com sucesso - Movimento ID: {movimento_id}")
            
            return resposta
            
        except Exception as e:
            error_msg = f"❌ Erro no processamento: {str(e)}"
            self._add_log(error_msg)
            logger.error(error_msg, exc_info=True)
            raise PDFProcessingError(error_msg)
    
    async def _handle_fornecedor(self, dados_pdf: DadosExtraidosPDFSchema) -> Dict[str, Any]:
        """Gerencia verificação e criação de fornecedor."""
        if not dados_pdf.fornecedor:
            self._add_log("⚠️ Fornecedor não informado no PDF")
            return {"exists": False, "id": None, "created": False}
        
        self._add_log(f"🔎 Verificando FORNECEDOR: {dados_pdf.fornecedor.razao_social}")
        
        check = await self.data_analyzer.check_fornecedor_exists(
            cnpj=dados_pdf.fornecedor.cnpj,
            razao_social=dados_pdf.fornecedor.razao_social
        )
        
        if check.status.exists:
            self._add_log(f"✓ Fornecedor já existe (ID: {check.status.entity_id})")
            return {"exists": True, "id": check.status.entity_id, "created": False}
        else:
            self._add_log(f"✗ Fornecedor não encontrado - criando...")
            fornecedor, msg = await self.data_analyzer.create_fornecedor(
                cnpj=dados_pdf.fornecedor.cnpj,
                razao_social=dados_pdf.fornecedor.razao_social,
                endereco=None,
                telefone=None
            )
            self._add_log(msg)
            return {"exists": False, "id": getattr(fornecedor, 'idPessoas', None), "created": True}
    
    async def _handle_faturado(self, dados_pdf: DadosExtraidosPDFSchema) -> Dict[str, Any]:
        """Gerencia verificação e criação de faturado."""
        if not dados_pdf.faturado:
            self._add_log("⚠️ Faturado não informado no PDF")
            return {"exists": False, "id": None, "created": False}
        
        self._add_log(f"🔎 Verificando FATURADO: {dados_pdf.faturado.nome_completo}")
        
        check = await self.data_analyzer.check_faturado_exists(
            cpf=dados_pdf.faturado.cpf,
            nome_completo=dados_pdf.faturado.nome_completo
        )
        
        if check.status.exists:
            self._add_log(f"✓ Cliente já existe (ID: {check.status.entity_id})")
            return {"exists": True, "id": check.status.entity_id, "created": False}
        else:
            self._add_log(f"✗ Cliente não encontrado - criando...")
            faturado, msg = await self.data_analyzer.create_faturado(
                cpf=dados_pdf.faturado.cpf,
                nome_completo=dados_pdf.faturado.nome_completo,
                endereco=None
            )
            self._add_log(msg)
            return {"exists": False, "id": getattr(faturado, 'idPessoas', None), "created": True}
    
    async def _handle_classificacoes(self, dados_pdf: DadosExtraidosPDFSchema) -> List[Dict[str, Any]]:
        """Gerencia verificação e criação de classificações."""
        if not dados_pdf.classificacoes_despesa:
            self._add_log("ℹ️ Nenhuma despesa classificada no PDF")
            return []
        
        self._add_log(f"🔎 Verificando {len(dados_pdf.classificacoes_despesa)} classificação(ões)...")
        
        despesas_check = []
        
        for despesa in dados_pdf.classificacoes_despesa:
            exists, class_id, msg = await self.data_analyzer.check_classificacao_exists(
                tipo="DESPESA",
                descricao=despesa.descricao
            )
            
            if exists:
                self._add_log(f"✓ Classificação '{despesa.descricao}' existe (ID: {class_id})")
                despesas_check.append({
                    "exists": True,
                    "id": class_id,
                    "descricao": despesa.descricao,
                    "percentual": despesa.percentual,
                    "created": False
                })
            else:
                self._add_log(f"✗ Classificação '{despesa.descricao}' não encontrada - criando...")
                classificacao, msg_create = await self.data_analyzer.create_classificacao(
                    tipo="DESPESA",
                    descricao=despesa.descricao
                )
                self._add_log(msg_create)
                despesas_check.append({
                    "exists": False,
                    "id": classificacao.idClassificacao,
                    "descricao": despesa.descricao,
                    "percentual": despesa.percentual,
                    "created": True
                })
        
        return despesas_check
    
    async def _create_movimento_completo(
        self,
        dados_pdf: DadosExtraidosPDFSchema,
        fornecedor_id: Optional[int],
        faturado_id: Optional[int],
        despesas_check: List[Dict[str, Any]]
    ) -> int:
        """
        Cria movimento com parcelas e classificações.
        
        Args:
            dados_pdf: Dados extraídos do PDF
            fornecedor_id: ID do fornecedor
            faturado_id: ID do faturado
            despesas_check: Lista com classificações verificadas
            
        Returns:
            ID do movimento criado
        """
        # Criar movimento
        movimento_data = MovimentoContasCreate(
            tipo="DESPESA",
            numeronotafiscal=dados_pdf.numero_nota_fiscal,
            dataemissao=dados_pdf.data_emissao,
            descricao=dados_pdf.descricao_produtos[:300] if dados_pdf.descricao_produtos else "Sem descrição",
            status="PENDENTE",
            valortotal=dados_pdf.valor_total,
            Pessoas_idFornecedorCliente=fornecedor_id if fornecedor_id else 0,
            Pessoas_idfaturado=faturado_id if faturado_id else 0
        )
        
        movimento = self.movimento_repo.create(movimento_data.model_dump())
        movimento_id_int = getattr(movimento, 'idMovimentoContas', 0)
        movimento_id_final = int(movimento_id_int) if movimento_id_int else 0
        self._add_log(f"✅ Movimento criado: ID={movimento_id_final}")
        
        # Criar parcelas
        parcelas_criadas = await self._create_parcelas(movimento_id_final, dados_pdf)
        self._add_log(f"✅ {parcelas_criadas} parcela(s) criada(s) para o movimento")
        
        # Vincular classificações
        class_vinculadas = await self._link_classificacoes(movimento_id_final, despesas_check)
        self._add_log(f"✅ {class_vinculadas} classificação(ões) vinculada(s) ao movimento")
        
        return movimento_id_final
    
    async def _create_parcelas(
        self,
        movimento_id: int,
        dados_pdf: DadosExtraidosPDFSchema
    ) -> int:
        """Cria parcelas do movimento."""
        if not dados_pdf.parcelas or len(dados_pdf.parcelas) == 0:
            # Se não houver parcelas, cria uma única com valor total
            parcela_data = ParcelasContasCreate(
                MovimentoContas_idMovimentoContas=movimento_id,
                identificacao=f"{dados_pdf.numero_nota_fiscal}-P01",
                numero_parcela=1,
                valorparcela=dados_pdf.valor_total,
                datavencimento=dados_pdf.data_emissao,
                statusparcela="PENDENTE"
            )
            self.parcelas_repo.create(parcela_data.model_dump())
            return 1
        
        # Criar múltiplas parcelas
        for i, parcela in enumerate(dados_pdf.parcelas, 1):
            parcela_data = ParcelasContasCreate(
                MovimentoContas_idMovimentoContas=movimento_id,
                identificacao=f"{dados_pdf.numero_nota_fiscal}-P{i:02d}",
                numero_parcela=i,
                valorparcela=parcela.valor_parcela,
                datavencimento=parcela.data_vencimento,
                statusparcela="PENDENTE"
            )
            self.parcelas_repo.create(parcela_data.model_dump())
        
        return len(dados_pdf.parcelas)
    
    async def _link_classificacoes(
        self,
        movimento_id: int,
        despesas_check: List[Dict[str, Any]]
    ) -> int:
        """Vincula classificações ao movimento."""
        if not despesas_check:
            return 0
        
        # TODO: Implementar vinculação de classificações ao movimento
        # Requer criação de tabela de relacionamento many-to-many
        # Por enquanto, apenas retorna a contagem
        self._add_log(f"⚠️ Vinculação de classificações não implementada (aguardando tabela de relacionamento)")
        
        return len(despesas_check)
    
    def _build_response(
        self,
        movimento_id: int,
        dados_pdf: DadosExtraidosPDFSchema,
        fornecedor_check: Dict[str, Any],
        faturado_check: Dict[str, Any],
        despesas_check: List[Dict[str, Any]],
        sugestoes: Dict[str, Any],
        transaction_id: str
    ) -> Dict[str, Any]:
        """Constrói resposta consolidada."""
        return {
            "success": True,
            "transaction_id": transaction_id,
            "movimento_id": movimento_id,
            "pdf_analysis": {
                "dados_extraidos": dados_pdf,
                "numero_nota_fiscal": dados_pdf.numero_nota_fiscal,
                "valor_total": float(dados_pdf.valor_total),
                "data_emissao": dados_pdf.data_emissao.isoformat() if dados_pdf.data_emissao else None,
                "total_parcelas": len(dados_pdf.parcelas) if dados_pdf.parcelas else 1,
                "total_despesas": len(dados_pdf.classificacoes_despesa) if dados_pdf.classificacoes_despesa else 0
            },
            "entities_created": {
                "fornecedor": fornecedor_check,
                "faturado": faturado_check,
                "classificacoes": despesas_check
            },
            "entities_ids": {
                "fornecedor_id": fornecedor_check["id"],
                "faturado_id": faturado_check["id"],
                "classificacoes_ids": [d["id"] for d in despesas_check]
            },
            "suggestions": sugestoes,
            "logs": self.logs,
            "processed_at": datetime.now().isoformat()
        }
    
    def _add_log(self, message: str):
        """Adiciona mensagem aos logs."""
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_message = f"[{timestamp}] {message}"
        self.logs.append(log_message)
        logger.info(message)
    
    # ==================== COMANDOS PÚBLICOS ====================
    
    async def check_entity_exists(
        self,
        entity_type: str,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Comando público: Verificar se entidade existe.
        
        Args:
            entity_type: fornecedor, faturado ou classificacao
            **kwargs: Parâmetros específicos
            
        Returns:
            Dicionário com resultado da verificação
        """
        if entity_type == "fornecedor":
            check = await self.data_analyzer.check_fornecedor_exists(
                cnpj=kwargs.get("cnpj", ""),
                razao_social=kwargs.get("razao_social", "")
            )
            return {
                "exists": check.status.exists,
                "id": check.status.entity_id,
                "message": "Fornecedor já existe" if check.status.exists else "Fornecedor não encontrado"
            }
        
        elif entity_type == "faturado":
            check = await self.data_analyzer.check_faturado_exists(
                cpf=kwargs.get("cpf", ""),
                nome_completo=kwargs.get("nome_completo", "")
            )
            return {
                "exists": check.status.exists,
                "id": check.status.entity_id,
                "message": "Faturado já existe" if check.status.exists else "Faturado não encontrado"
            }
        
        elif entity_type == "classificacao":
            exists, id, msg = await self.data_analyzer.check_classificacao_exists(
                tipo=kwargs.get("tipo", "DESPESA"),
                descricao=kwargs.get("descricao", "")
            )
            return {"exists": exists, "id": id, "message": msg}
        
        else:
            return {"error": f"Tipo de entidade inválido: {entity_type}"}
    
    async def create_entity(
        self,
        entity_type: str,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Comando público: Criar nova entidade.
        
        Args:
            entity_type: fornecedor, faturado ou classificacao
            **kwargs: Parâmetros específicos
            
        Returns:
            Dicionário com resultado da criação
        """
        if entity_type == "fornecedor":
            entity, msg = await self.data_analyzer.create_fornecedor(**kwargs)
            return {"success": True, "id": entity.idPessoas, "message": msg}
        
        elif entity_type == "faturado":
            entity, msg = await self.data_analyzer.create_faturado(**kwargs)
            return {"success": True, "id": entity.idPessoas, "message": msg}
        
        elif entity_type == "classificacao":
            entity, msg = await self.data_analyzer.create_classificacao(**kwargs)
            return {"success": True, "id": entity.idClassificacao, "message": msg}
        
        else:
            return {"error": f"Tipo de entidade inválido: {entity_type}"}
    
    async def delete_entity(
        self,
        entity_type: str,
        entity_id: int
    ) -> Dict[str, Any]:
        """
        Comando público: Deletar entidade (soft delete).
        
        Args:
            entity_type: pessoa, movimento ou classificacao
            entity_id: ID da entidade
            
        Returns:
            Dicionário com resultado da deleção
        """
        success, msg = await self.data_analyzer.delete_entity(entity_type, entity_id)
        return {"success": success, "message": msg}
    
    async def query_entities(
        self,
        entity_type: str,
        filters: Optional[Dict[str, Any]] = None,
        include_deleted: bool = False
    ) -> Dict[str, Any]:
        """
        Comando público: Consultar entidades.
        
        Args:
            entity_type: pessoa, movimento ou classificacao
            filters: Filtros opcionais
            include_deleted: Se deve incluir inativos
            
        Returns:
            Dicionário com resultados da consulta
        """
        entities = await self.data_analyzer.query_entities(
            entity_type=entity_type,
            filters=filters,
            include_deleted=include_deleted
        )
        
        return {
            "success": True,
            "count": len(entities),
            "entities": entities
        }

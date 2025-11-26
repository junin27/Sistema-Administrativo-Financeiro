"""
Data Analyzer Agent - Consulta e manipula dados no banco de dados.

Responsabilidades:
- Verificar existência de entidades (Fornecedor, Cliente, Classificação)
- Criar novas entidades quando necessário
- Deletar entidades (soft delete)
- Consultar dados com filtros avançados
- Retornar análises e sugestões
"""
import logging
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime
from sqlalchemy.orm import Session

from ...models.ddl_models import Pessoas, MovimentoContas
from ...models.classificacao_models import Classificacao
from ...repositories.ddl_repositories import PessoasRepository, MovimentoContasRepository
from ...repositories.classificacao_repository import ClassificacaoRepository
from ...schemas.ddl_schemas import (
    PessoasCreate, 
    MovimentoContasCreate
)
from ...schemas.post_processing_schemas import (
    FornecedorExistenceCheck,
    FaturadoExistenceCheck,
    EntityExistenceStatus
)
from ...schemas.classificacao_schemas import (
    ClassificacaoCreate,
    TipoClassificacao,
    StatusClassificacao
)

logger = logging.getLogger(__name__)


class DataAnalyzerAgent:
    """
    Agent especializado em análise e manipulação de dados no banco.
    
    Fornece métodos para:
    - check_exists: Verificar se dado existe
    - create: Criar nova entidade
    - delete: Remover entidade (soft delete)
    - query: Consultar com filtros
    - suggest: Sugerir ações baseadas em análise
    """
    
    def __init__(self, db: Session):
        """
        Inicializa o agente com sessão do banco.
        
        Args:
            db: Sessão SQLAlchemy
        """
        self.db = db
        self.pessoas_repo = PessoasRepository(db)
        self.movimento_repo = MovimentoContasRepository(db)
        self.classificacao_repo = ClassificacaoRepository(db)
        
        logger.info("DataAnalyzerAgent inicializado")
    
    # ==================== FORNECEDOR ====================
    
    async def check_fornecedor_exists(
        self, 
        cnpj: str, 
        razao_social: str
    ) -> FornecedorExistenceCheck:
        """
        Verifica se fornecedor existe no banco.
        
        Args:
            cnpj: CNPJ do fornecedor (apenas números)
            razao_social: Razão social
            
        Returns:
            FornecedorExistenceCheck com resultado da consulta
        """
        logger.info(f"Verificando existência de fornecedor: CNPJ={cnpj}")
        
        # Buscar por documento primeiro
        fornecedor = self.pessoas_repo.find_by_documento(cnpj)
        
        # Se não encontrar por documento, buscar por razão social
        if not fornecedor:
            fornecedor = self.pessoas_repo.find_by_razao_social(razao_social)
        
        if fornecedor:
            logger.info(f"Fornecedor encontrado: ID={fornecedor.idPessoas}")
            return FornecedorExistenceCheck(
                documento=cnpj,
                razao_social=razao_social,
                status=EntityExistenceStatus(
                    exists=True,
                    entity_id=getattr(fornecedor, 'idPessoas', None),
                    entity_data={
                        "razao_social": fornecedor.razaosocial,
                        "documento": fornecedor.documento,
                        "tipo": fornecedor.tipo
                    },
                    created=False
                )
            )
        else:
            logger.info("Fornecedor não encontrado")
            return FornecedorExistenceCheck(
                documento=cnpj,
                razao_social=razao_social,
                status=EntityExistenceStatus(
                    exists=False,
                    entity_id=None,
                    entity_data=None,
                    created=False
                )
            )
    
    async def create_fornecedor(
        self,
        cnpj: str,
        razao_social: str,
        endereco: Optional[str] = None,
        telefone: Optional[str] = None
    ) -> Tuple[Pessoas, str]:
        """
        Cria novo fornecedor no banco.
        
        Args:
            cnpj: CNPJ do fornecedor
            razao_social: Razão social
            endereco: Endereço completo
            telefone: Telefone de contato
            
        Returns:
            Tuple (Pessoa criada, mensagem de log)
        """
        logger.info(f"Criando novo fornecedor: {razao_social}")
        
        pessoa_data = PessoasCreate(
            tipo="FORNECEDOR",
            documento=cnpj,
            razaosocial=razao_social,
            fantasia=razao_social,
            status="ativo"
        )
        
        fornecedor = self.pessoas_repo.create(pessoa_data.model_dump())
        
        mensagem = f"✅ FORNECEDOR criado: {razao_social} (ID: {fornecedor.idPessoas})"
        logger.info(mensagem)
        
        return fornecedor, mensagem
    
    # ==================== FATURADO ====================
    
    async def check_faturado_exists(
        self,
        cpf: str,
        nome_completo: str
    ) -> 'FaturadoExistenceCheck':
        """
        Verifica se faturado (cliente) existe no banco.
        
        Args:
            cpf: CPF do cliente (apenas números)
            nome_completo: Nome completo
            
        Returns:
            FaturadoExistenceCheck com resultado da consulta
        """
        logger.info(f"Verificando existência de faturado: CPF={cpf}")
        
        # Buscar por documento primeiro
        faturado = self.pessoas_repo.find_by_documento(cpf)
        
        # Se não encontrar por documento, buscar por razão social
        if not faturado:
            faturado = self.pessoas_repo.find_by_razao_social(nome_completo)
        
        if faturado:
            logger.info(f"Faturado encontrado: ID={faturado.idPessoas}")
            return FaturadoExistenceCheck(
                documento=cpf,
                razao_social=nome_completo,
                status=EntityExistenceStatus(
                    exists=True,
                    entity_id=getattr(faturado, 'idPessoas', None),
                    entity_data={
                        "razao_social": faturado.razaosocial,
                        "documento": faturado.documento,
                        "tipo": faturado.tipo
                    },
                    created=False
                )
            )
        else:
            logger.info("Faturado não encontrado")
            return FaturadoExistenceCheck(
                documento=cpf,
                razao_social=nome_completo,
                status=EntityExistenceStatus(
                    exists=False,
                    entity_id=None,
                    entity_data=None,
                    created=False
                )
            )
    
    async def create_faturado(
        self,
        cpf: str,
        nome_completo: str,
        endereco: Optional[str] = None
    ) -> Tuple[Pessoas, str]:
        """
        Cria novo faturado (cliente) no banco.
        
        Args:
            cpf: CPF do cliente
            nome_completo: Nome completo
            endereco: Endereço completo
            
        Returns:
            Tuple (Pessoa criada, mensagem de log)
        """
        logger.info(f"Criando novo faturado: {nome_completo}")
        
        pessoa_data = PessoasCreate(
            tipo="CLIENTE",
            documento=cpf,
            razaosocial=nome_completo,
            fantasia=nome_completo,
            status="ativo"
        )
        
        faturado = self.pessoas_repo.create(pessoa_data.model_dump())
        
        mensagem = f"✅ CLIENTE criado: {nome_completo} (ID: {faturado.idPessoas})"
        logger.info(mensagem)
        
        return faturado, mensagem
    
    # ==================== CLASSIFICAÇÃO ====================
    
    async def check_classificacao_exists(
        self,
        tipo: str,
        descricao: str
    ) -> Tuple[bool, Optional[int], str]:
        """
        Verifica se classificação existe no banco.
        
        Args:
            tipo: RECEITA ou DESPESA
            descricao: Descrição da classificação
            
        Returns:
            Tuple (existe, id, mensagem)
        """
        logger.info(f"Verificando classificação: tipo={tipo}, descricao={descricao}")
        
        classificacao = self.classificacao_repo.find_by_tipo_and_descricao(
            tipo=tipo,
            descricao=descricao
        )
        
        if classificacao:
            logger.info(f"Classificação encontrada: ID={classificacao.idClassificacao}")
            return (
                True,
                getattr(classificacao, 'idClassificacao', None),
                f"Classificação '{descricao}' já cadastrada"
            )
        else:
            logger.info("Classificação não encontrada")
            return (
                False,
                None,
                f"Classificação '{descricao}' não encontrada - pode ser criada"
            )
    
    async def create_classificacao(
        self,
        tipo: str,
        descricao: str
    ) -> Tuple[Classificacao, str]:
        """
        Cria nova classificação no banco.
        
        Args:
            tipo: RECEITA ou DESPESA
            descricao: Descrição da classificação
            
        Returns:
            Tuple (Classificacao criada, mensagem de log)
        """
        logger.info(f"Criando nova classificação: {tipo} - {descricao}")
        
        classificacao_data = ClassificacaoCreate(
            tipo=TipoClassificacao(tipo),
            descricao=descricao,
            status=StatusClassificacao.ATIVO
        )
        
        classificacao = self.classificacao_repo.create(classificacao_data.model_dump())
        
        mensagem = f"✅ CLASSIFICAÇÃO criada: {descricao} (ID: {classificacao.idClassificacao})"
        logger.info(mensagem)
        
        return classificacao, mensagem
    
    # ==================== CRUD GENÉRICO ====================
    
    async def delete_entity(
        self,
        entity_type: str,
        entity_id: int
    ) -> Tuple[bool, str]:
        """
        Remove entidade do banco (soft delete).
        
        Args:
            entity_type: Tipo da entidade (pessoa, movimento, classificacao)
            entity_id: ID da entidade
            
        Returns:
            Tuple (sucesso, mensagem)
        """
        logger.info(f"Deletando {entity_type} ID={entity_id}")
        
        try:
            if entity_type == "pessoa":
                result = self.pessoas_repo.inactivate(entity_id)
            elif entity_type == "movimento":
                result = self.movimento_repo.inactivate(entity_id)
            elif entity_type == "classificacao":
                result = self.classificacao_repo.inactivate(entity_id)
            else:
                return False, f"Tipo de entidade inválido: {entity_type}"
            
            if result:
                mensagem = f"✅ {entity_type.upper()} inativado: ID={entity_id}"
                logger.info(mensagem)
                return True, mensagem
            else:
                return False, f"{entity_type.upper()} não encontrado: ID={entity_id}"
                
        except Exception as e:
            logger.error(f"Erro ao deletar {entity_type}: {str(e)}")
            return False, f"Erro ao inativar {entity_type}: {str(e)}"
    
    async def query_entities(
        self,
        entity_type: str,
        filters: Optional[Dict[str, Any]] = None,
        include_deleted: bool = False
    ) -> List[Any]:
        """
        Consulta entidades com filtros.
        
        Args:
            entity_type: Tipo da entidade
            filters: Dicionário com filtros
            include_deleted: Se deve incluir registros inativos
            
        Returns:
            Lista de entidades encontradas
        """
        logger.info(f"Consultando {entity_type} com filtros: {filters}")
        
        try:
            if entity_type == "pessoa":
                entities = self.pessoas_repo.get_all(
                    skip=0,
                    limit=1000,
                    include_deleted=include_deleted
                )
            elif entity_type == "movimento":
                entities = self.movimento_repo.get_all(
                    skip=0,
                    limit=1000,
                    include_deleted=include_deleted
                )
            elif entity_type == "classificacao":
                if include_deleted:
                    entities = self.classificacao_repo.get_all(skip=0, limit=1000)
                else:
                    entities = self.classificacao_repo.find_active()
            else:
                return []
            
            # Aplicar filtros customizados
            if filters:
                entities = self._apply_filters(entities, filters)
            
            logger.info(f"Encontrados {len(entities)} registros")
            return entities
            
        except Exception as e:
            logger.error(f"Erro ao consultar {entity_type}: {str(e)}")
            return []
    
    def _apply_filters(self, entities: List[Any], filters: Dict[str, Any]) -> List[Any]:
        """
        Aplica filtros customizados à lista de entidades.
        
        Args:
            entities: Lista de entidades
            filters: Dicionário com filtros
            
        Returns:
            Lista filtrada
        """
        filtered = entities
        
        for key, value in filters.items():
            if value is not None:
                filtered = [e for e in filtered if getattr(e, key, None) == value]
        
        return filtered
    
    # ==================== ANÁLISE E SUGESTÕES ====================
    
    async def suggest_actions(
        self,
        fornecedor_exists: bool,
        faturado_exists: bool,
        classificacoes_missing: List[str]
    ) -> Dict[str, Any]:
        """
        Sugere ações baseadas na análise de dados.
        
        Args:
            fornecedor_exists: Se fornecedor existe
            faturado_exists: Se faturado existe
            classificacoes_missing: Lista de classificações que faltam
            
        Returns:
            Dicionário com sugestões
        """
        sugestoes = {
            "actions_required": [],
            "warnings": [],
            "recommendations": []
        }
        
        if not fornecedor_exists:
            sugestoes["actions_required"].append({
                "action": "create_fornecedor",
                "priority": "high",
                "message": "Fornecedor não cadastrado - será criado automaticamente"
            })
        
        if not faturado_exists:
            sugestoes["actions_required"].append({
                "action": "create_faturado",
                "priority": "high",
                "message": "Cliente não cadastrado - será criado automaticamente"
            })
        
        if classificacoes_missing:
            sugestoes["actions_required"].append({
                "action": "create_classificacoes",
                "priority": "medium",
                "count": len(classificacoes_missing),
                "message": f"{len(classificacoes_missing)} classificação(ões) será(ão) criada(s)"
            })
        
        if not sugestoes["actions_required"]:
            sugestoes["recommendations"].append({
                "message": "Todas as entidades já estão cadastradas - processamento direto"
            })
        
        return sugestoes
    
    async def get_statistics(self) -> Dict[str, Any]:
        """
        Retorna estatísticas gerais do banco de dados.
        
        Returns:
            Dicionário com estatísticas
        """
        logger.info("Gerando estatísticas do banco de dados")
        
        total_pessoas = len(self.pessoas_repo.get_all(skip=0, limit=10000))
        total_movimentos = len(self.movimento_repo.get_all(skip=0, limit=10000))
        total_classificacoes = len(self.classificacao_repo.find_active())
        
        pessoas_inativas = len(self.pessoas_repo.find_inactive())
        movimentos_inativos = len(self.movimento_repo.find_inactive())
        
        return {
            "total_pessoas": total_pessoas,
            "total_movimentos": total_movimentos,
            "total_classificacoes": total_classificacoes,
            "pessoas_inativas": pessoas_inativas,
            "movimentos_inativos": movimentos_inativos,
            "data_geracao": datetime.now().isoformat()
        }

"""
Schemas para processamento pós-extração de dados do PDF.
Define estruturas para consultas de existência e criação de entidades.
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class EntityExistenceStatus(BaseModel):
    """Status de existência de uma entidade no banco de dados."""
    exists: bool = Field(..., description="Se a entidade existe no banco")
    entity_id: Optional[int] = Field(None, description="ID da entidade se existir")
    entity_data: Optional[Dict[str, Any]] = Field(None, description="Dados da entidade se existir")
    created: bool = Field(False, description="Se a entidade foi criada neste processamento")


class FornecedorExistenceCheck(BaseModel):
    """Resultado da verificação de existência do fornecedor."""
    documento: Optional[str] = Field(None, description="CNPJ/CPF do fornecedor")
    razao_social: str = Field(..., description="Razão social do fornecedor")
    status: EntityExistenceStatus = Field(..., description="Status de existência")


class FaturadoExistenceCheck(BaseModel):
    """Resultado da verificação de existência do faturado."""
    documento: Optional[str] = Field(None, description="CNPJ/CPF do faturado")
    razao_social: str = Field(..., description="Razão social do faturado")
    status: EntityExistenceStatus = Field(..., description="Status de existência")


class DespesaExistenceCheck(BaseModel):
    """Resultado da verificação de existência do tipo de despesa."""
    descricao: str = Field(..., description="Descrição da despesa")
    categoria: str = Field(..., description="Categoria da despesa")
    status: EntityExistenceStatus = Field(..., description="Status de existência")


class PostProcessingResult(BaseModel):
    """Resultado completo do processamento pós-extração."""
    success: bool = Field(..., description="Se o processamento foi bem-sucedido")
    fornecedor: Optional[FornecedorExistenceCheck] = Field(None, description="Status do fornecedor")
    faturado: Optional[FaturadoExistenceCheck] = Field(None, description="Status do faturado")
    despesas: Optional[List[DespesaExistenceCheck]] = Field(None, description="Status das despesas")
    extracted_data: Optional[Any] = Field(None, description="Dados extraídos do PDF")
    movimento_criado: bool = Field(False, description="Se o movimento foi criado")
    movimento_id: Optional[int] = Field(None, description="ID do movimento criado")
    transaction_id: str = Field(..., description="ID único da transação")
    processing_time: float = Field(..., description="Tempo de processamento em segundos")
    logs: List[str] = Field(default_factory=list, description="Logs do processamento")
    errors: List[str] = Field(default_factory=list, description="Erros encontrados")
    error_message: Optional[str] = Field(None, description="Mensagem de erro principal")


class CreateEntityRequest(BaseModel):
    """Request para criação de nova entidade."""
    entity_type: str = Field(..., description="Tipo da entidade (fornecedor, faturado, despesa)")
    entity_data: Dict[str, Any] = Field(..., description="Dados para criação da entidade")


class TransactionLog(BaseModel):
    """Log de transação para auditoria."""
    transaction_id: str = Field(..., description="ID único da transação")
    operation: str = Field(..., description="Operação realizada")
    entity_type: str = Field(..., description="Tipo da entidade")
    entity_id: Optional[int] = Field(None, description="ID da entidade")
    timestamp: datetime = Field(default_factory=datetime.now, description="Timestamp da operação")
    details: Dict[str, Any] = Field(default_factory=dict, description="Detalhes da operação")
    success: bool = Field(..., description="Se a operação foi bem-sucedida")
    error_message: Optional[str] = Field(None, description="Mensagem de erro se houver")
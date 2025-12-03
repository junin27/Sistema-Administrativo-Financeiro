"""
Schemas Pydantic para Classificacao.
Define validação e serialização de dados para classificações de receitas e despesas.
"""

from datetime import datetime
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field, ConfigDict, validator


class TipoClassificacao(str, Enum):
    """Enum para tipo de classificação."""
    RECEITA = "RECEITA"
    DESPESA = "DESPESA"


class StatusClassificacao(str, Enum):
    """Enum para status da classificação."""
    ATIVO = "ativo"
    INATIVO = "inativo"


class ClassificacaoBase(BaseModel):
    """Schema base para Classificacao."""
    tipo: TipoClassificacao = Field(..., description="Tipo: RECEITA ou DESPESA")
    descricao: str = Field(..., max_length=150, description="Descrição da classificação")
    status: Optional[StatusClassificacao] = Field(StatusClassificacao.ATIVO, description="Status da classificação")


class ClassificacaoCreate(ClassificacaoBase):
    """Schema para criação de Classificacao."""
    pass


class ClassificacaoUpdate(BaseModel):
    """Schema para atualização de Classificacao."""
    tipo: Optional[TipoClassificacao] = Field(None, description="Tipo: RECEITA ou DESPESA")
    descricao: Optional[str] = Field(None, max_length=150, description="Descrição da classificação")
    status: Optional[StatusClassificacao] = Field(None, description="Status da classificação")


class ClassificacaoResponse(BaseModel):
    """Schema de resposta para Classificacao."""
    idClassificacao: int = Field(..., description="ID único da classificação")
    tipo: Optional[str] = Field(None, description="Tipo: RECEITA ou DESPESA")
    descricao: Optional[str] = Field(None, max_length=150, description="Descrição da classificação")
    status: Optional[str] = Field(None, description="Status da classificação")
    deleted_at: Optional[datetime] = Field(None, description="Data de inativação (soft delete)")
    created_at: Optional[datetime] = Field(None, description="Data de criação")
    updated_at: Optional[datetime] = Field(None, description="Data de atualização")
    
    model_config = ConfigDict(from_attributes=True)


class ClassificacaoListResponse(BaseModel):
    """Schema para listagem de classificações."""
    items: List[ClassificacaoResponse]
    total: int
    page: int
    size: int
    pages: int


class ClassificacaoFilter(BaseModel):
    """Schema para filtros de busca de classificações."""
    tipo: Optional[TipoClassificacao] = None
    status: Optional[StatusClassificacao] = None
    search: Optional[str] = Field(None, description="Busca por descrição")

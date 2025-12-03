"""
Schemas Pydantic para os modelos DDL (Pessoas e MovimentoContas).
Define validação e serialização de dados seguindo o DDL fornecido.
"""

from datetime import date
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict

from .classificacao_schemas import ClassificacaoResponse


class PessoasBase(BaseModel):
    """Schema base para Pessoas."""
    tipo: Optional[str] = Field(None, max_length=45, description="Tipo da pessoa (cliente, fornecedor, etc.)")
    razaosocial: Optional[str] = Field(None, max_length=150, description="Razão social")
    fantasia: Optional[str] = Field(None, max_length=150, description="Nome fantasia")
    documento: Optional[str] = Field(None, max_length=45, description="Documento (CPF/CNPJ)")
    status: Optional[str] = Field(None, max_length=45, description="Status da pessoa")


class PessoasCreate(PessoasBase):
    """Schema para criação de Pessoas."""
    pass


class PessoasUpdate(PessoasBase):
    """Schema para atualização de Pessoas."""
    pass


class PessoasResponse(PessoasBase):
    """Schema de resposta para Pessoas."""
    idPessoas: int = Field(..., description="ID único da pessoa")
    
    model_config = ConfigDict(from_attributes=True)


class MovimentoContasBase(BaseModel):
    """Schema base para MovimentoContas."""
    tipo: Optional[str] = Field(None, max_length=45, description="Tipo do movimento (pagar, receber)")
    numeronotafiscal: Optional[str] = Field(None, max_length=45, description="Número da nota fiscal")
    dataemissao: Optional[date] = Field(None, description="Data de emissão")
    descricao: Optional[str] = Field(None, max_length=300, description="Descrição do movimento")
    status: Optional[str] = Field(None, max_length=45, description="Status do movimento")
    valortotal: Optional[float] = Field(None, ge=0, description="Valor total")
    Pessoas_idFornecedorCliente: int = Field(..., description="ID do fornecedor/cliente")
    Pessoas_idfaturado: int = Field(..., description="ID da pessoa faturada")


class MovimentoContasCreate(MovimentoContasBase):
    """Schema para criação de MovimentoContas."""
    pass


class MovimentoContasUpdate(MovimentoContasBase):
    """Schema para atualização de MovimentoContas."""
    Pessoas_idFornecedorCliente: Optional[int] = Field(None, description="ID do fornecedor/cliente")
    Pessoas_idfaturado: Optional[int] = Field(None, description="ID da pessoa faturada")


class MovimentoContasResponse(BaseModel):
    """Schema de resposta para MovimentoContas."""
    idMovimentoContas: int = Field(..., description="ID único do movimento")
    tipo: Optional[str] = Field(None, max_length=45, description="Tipo do movimento (pagar, receber)")
    numeronotafiscal: Optional[str] = Field(None, max_length=45, description="Número da nota fiscal")
    dataemissao: Optional[date] = Field(None, description="Data de emissão")
    descricao: Optional[str] = Field(None, max_length=300, description="Descrição do movimento")
    status: Optional[str] = Field(None, max_length=45, description="Status do movimento")
    valortotal: Optional[float] = Field(None, ge=0, description="Valor total")
    Pessoas_idFornecedorCliente: Optional[int] = Field(None, description="ID do fornecedor/cliente")
    Pessoas_idfaturado: Optional[int] = Field(None, description="ID da pessoa faturada")
    
    # Relacionamentos opcionais
    fornecedor_cliente: Optional[PessoasResponse] = Field(None, description="Dados do fornecedor/cliente")
    faturado: Optional[PessoasResponse] = Field(None, description="Dados da pessoa faturada")
    classificacoes: List[ClassificacaoResponse] = Field(default_factory=list, description="Classificações vinculadas")
    
    model_config = ConfigDict(from_attributes=True)


# Schemas para listagem e paginação
class PessoasListResponse(BaseModel):
    """Schema para listagem de pessoas."""
    items: List[PessoasResponse]
    total: int
    page: int
    size: int
    pages: int


class MovimentoContasListResponse(BaseModel):
    """Schema para listagem de movimentos."""
    items: List[MovimentoContasResponse]
    total: int
    page: int
    size: int
    pages: int


# Schemas para filtros e busca
class PessoasFilter(BaseModel):
    """Schema para filtros de busca de pessoas."""
    tipo: Optional[str] = None
    status: Optional[str] = None
    documento: Optional[str] = None
    search: Optional[str] = Field(None, description="Busca por razão social ou fantasia")


class MovimentoContasFilter(BaseModel):
    """Schema para filtros de busca de movimentos."""
    tipo: Optional[str] = None
    status: Optional[str] = None
    numeronotafiscal: Optional[str] = None
    fornecedor_id: Optional[int] = None
    faturado_id: Optional[int] = None
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None


# Schemas para relatórios
class MovimentoContasResumo(BaseModel):
    """Schema para resumo de movimentos por tipo."""
    tipo: str
    total_movimentos: int
    valor_total: float  # Mudando de Decimal para float para evitar erro de serialização JSON
    
    model_config = ConfigDict(from_attributes=True)
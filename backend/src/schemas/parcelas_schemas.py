"""
Schemas Pydantic para ParcelasContas.
Define validação e serialização de dados para parcelas de movimentações.
"""

from datetime import date
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, validator
from decimal import Decimal


class ParcelasContasBase(BaseModel):
    """Schema base para ParcelasContas."""
    identificacao: str = Field(..., max_length=45, description="Identificação única da parcela")
    valorparcela: Optional[float] = Field(None, ge=0, description="Valor da parcela")
    datavencimento: Optional[date] = Field(None, description="Data de vencimento")
    statusparcela: Optional[str] = Field(None, max_length=45, description="Status da parcela")
    MovimentoContas_idMovimentoContas: int = Field(..., description="ID do movimento vinculado")
    
    @validator('valorparcela')
    def validate_valor(cls, v):
        """Valida que valor da parcela é positivo."""
        if v is not None and v < 0:
            raise ValueError('Valor da parcela deve ser positivo')
        return v
    
    @validator('datavencimento')
    def validate_data_vencimento(cls, v):
        """Valida data de vencimento."""
        if v is None:
            raise ValueError('Data de vencimento é obrigatória')
        return v


class ParcelasContasCreate(ParcelasContasBase):
    """Schema para criação de ParcelasContas."""
    pass


class ParcelasContasUpdate(BaseModel):
    """Schema para atualização de ParcelasContas."""
    valorparcela: Optional[float] = Field(None, ge=0, description="Valor da parcela")
    datavencimento: Optional[date] = Field(None, description="Data de vencimento")
    statusparcela: Optional[str] = Field(None, max_length=45, description="Status da parcela")


class ParcelasContasResponse(ParcelasContasBase):
    """Schema de resposta para ParcelasContas."""
    idParcelasContas: int = Field(..., description="ID único da parcela")
    
    model_config = ConfigDict(from_attributes=True)


class ParcelasContasWithMovimento(ParcelasContasResponse):
    """Schema de resposta com informações do movimento."""
    movimento: Optional[dict] = Field(None, description="Dados do movimento vinculado")

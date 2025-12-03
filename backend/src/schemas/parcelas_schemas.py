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
    numero_parcela: Optional[int] = Field(None, ge=1, description="Número sequencial da parcela")
    valorparcela: Optional[float] = Field(None, ge=0, description="Valor da parcela")
    valorpago: Optional[float] = Field(0, ge=0, description="Valor pago na parcela")
    valorsaldo: Optional[float] = Field(0, ge=0, description="Saldo da parcela (valorparcela - valorpago)")
    datavencimento: Optional[date] = Field(None, description="Data de vencimento")
    datapagamento: Optional[date] = Field(None, description="Data de pagamento da parcela")
    statusparcela: Optional[str] = Field(None, max_length=45, description="Status da parcela")
    MovimentoContas_idMovimentoContas: int = Field(..., description="ID do movimento vinculado")
    
    @validator('valorparcela')
    def validate_valor(cls, v):
        """Valida que valor da parcela é positivo."""
        if v is not None and v < 0:
            raise ValueError('Valor da parcela deve ser positivo')
        return v

    @validator('valorpago')
    def validate_valorpago(cls, v):
        """Valida que valor pago não é negativo."""
        if v is not None and v < 0:
            raise ValueError('Valor pago não pode ser negativo')
        return v

    @validator('valorsaldo')
    def validate_valorsaldo(cls, v):
        """Valida que saldo não é negativo (será recalculado no servidor)."""
        if v is not None and v < 0:
            raise ValueError('Saldo não pode ser negativo')
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
    numero_parcela: Optional[int] = Field(None, ge=1, description="Número da parcela")
    valorparcela: Optional[float] = Field(None, ge=0, description="Valor da parcela")
    valorpago: Optional[float] = Field(None, ge=0, description="Valor pago na parcela")
    valorsaldo: Optional[float] = Field(None, ge=0, description="Saldo da parcela")
    datavencimento: Optional[date] = Field(None, description="Data de vencimento")
    datapagamento: Optional[date] = Field(None, description="Data de pagamento")
    statusparcela: Optional[str] = Field(None, max_length=45, description="Status da parcela")


class ParcelasContasResponse(ParcelasContasBase):
    """Schema de resposta para ParcelasContas."""
    idParcelasContas: int = Field(..., description="ID único da parcela")
    
    model_config = ConfigDict(from_attributes=True)


class ParcelaStatusUpdate(BaseModel):
    """Payload para atualização de status da parcela."""
    status: str = Field(..., description="Novo status da parcela")
    datapagamento: Optional[date] = Field(None, description="Data de pagamento, quando status=PAGA")


class ParcelasContasWithMovimento(ParcelasContasResponse):
    """Schema de resposta com informações do movimento."""
    movimento: Optional[dict] = Field(None, description="Dados do movimento vinculado")


class GerarParcelasRequest(BaseModel):
    """Payload para geração automática de parcelas de um movimento."""
    numero_parcelas: int = Field(..., ge=1, le=120, description="Quantidade de parcelas a gerar")
    primeiro_vencimento: Optional[date] = Field(None, description="Data do primeiro vencimento (padrão: data de emissão do movimento)")
    intervalo_meses: int = Field(1, ge=1, le=24, description="Intervalo de meses entre vencimentos")

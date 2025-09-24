"""
Schemas para processamento de PDF com IA Gemini.
Define estruturas para upload e extração de dados.
"""

from datetime import date
from decimal import Decimal
from typing import List, Optional, Dict, Any
from pydantic import Field, BaseModel
from uuid import UUID

from .base import BaseSchema


class PDFUploadSchema(BaseSchema):
    """Schema para upload de arquivo PDF."""
    
    filename: str = Field(..., description="Nome do arquivo PDF")
    content_type: str = Field(..., description="Tipo de conteúdo do arquivo")
    size: int = Field(..., gt=0, description="Tamanho do arquivo em bytes")


class FornecedorExtraidoSchema(BaseSchema):
    """Schema para dados de fornecedor extraídos do PDF."""
    
    razao_social: str = Field(..., description="Razão social do fornecedor")
    nome_fantasia: Optional[str] = Field(None, description="Nome fantasia")
    cnpj: str = Field(..., description="CNPJ do fornecedor")


class FaturadoExtraidoSchema(BaseSchema):
    """Schema para dados de faturado extraídos do PDF."""
    
    nome_completo: str = Field(..., description="Nome completo do faturado")
    cpf: str = Field(..., description="CPF do faturado")


class ParcelaExtraidaSchema(BaseSchema):
    """Schema para parcela extraída do PDF."""
    
    numero_parcela: int = Field(..., ge=1, description="Número da parcela")
    data_vencimento: date = Field(..., description="Data de vencimento")
    valor_parcela: Decimal = Field(..., gt=0, description="Valor da parcela")


class ClassificacaoDespesaExtraidaSchema(BaseSchema):
    """Schema para classificação de despesa extraída automaticamente."""
    
    categoria: str = Field(..., description="Categoria da despesa")
    descricao: str = Field(..., description="Descrição específica")
    percentual: Decimal = Field(default=100.00, ge=0, le=100, description="Percentual de classificação")
    confianca: float = Field(..., ge=0, le=1, description="Nível de confiança da IA")


class DadosExtraidosPDFSchema(BaseSchema):
    """Schema para todos os dados extraídos do PDF."""
    
    # Dados básicos da nota fiscal
    numero_nota_fiscal: Optional[str] = Field(None, description="Número da nota fiscal")
    data_emissao: date = Field(..., description="Data de emissão")
    descricao_produtos: str = Field(..., description="Descrição dos produtos/serviços")
    valor_total: Decimal = Field(..., gt=0, description="Valor total da nota")
    
    # Entidades relacionadas
    fornecedor: FornecedorExtraidoSchema = Field(..., description="Dados do fornecedor")
    faturado: Optional[FaturadoExtraidoSchema] = Field(None, description="Dados do faturado")
    
    # Parcelas
    parcelas: List[ParcelaExtraidaSchema] = Field(..., min_items=1, description="Lista de parcelas")
    quantidade_parcelas: int = Field(..., ge=1, description="Quantidade total de parcelas")
    
    # Classificações automáticas
    classificacoes_despesa: List[ClassificacaoDespesaExtraidaSchema] = Field(
        ..., min_items=1, description="Classificações de despesa sugeridas pela IA"
    )
    
    # Metadados da extração
    confianca_geral: float = Field(..., ge=0, le=1, description="Confiança geral da extração")
    observacoes_ia: Optional[str] = Field(None, description="Observações da IA sobre a extração")


class ProcessamentoPDFResponseSchema(BaseSchema):
    """Schema para resposta do processamento de PDF."""
    
    sucesso: bool = Field(..., description="Se o processamento foi bem-sucedido")
    dados_extraidos: Optional[DadosExtraidosPDFSchema] = Field(None, description="Dados extraídos do PDF")
    erro: Optional[str] = Field(None, description="Mensagem de erro se houver")
    tempo_processamento: float = Field(..., description="Tempo de processamento em segundos")


class ContaGeradaSchema(BaseSchema):
    """Schema para conta gerada a partir do PDF processado."""
    
    conta_pagar_id: UUID = Field(..., description="ID da conta a pagar criada")
    fornecedor_id: UUID = Field(..., description="ID do fornecedor")
    faturado_id: Optional[UUID] = Field(None, description="ID do faturado")
    parcelas_ids: List[UUID] = Field(..., description="IDs das parcelas criadas")
    classificacoes_aplicadas: List[UUID] = Field(..., description="IDs das classificações aplicadas")


class GerarContaPDFSchema(BaseSchema):
    """Schema para gerar conta a partir de dados extraídos do PDF."""
    
    dados_extraidos: DadosExtraidosPDFSchema = Field(..., description="Dados extraídos do PDF")
    confirmar_criacao: bool = Field(default=False, description="Confirmar criação automática")
    ajustes_manuais: Optional[Dict[str, Any]] = Field(None, description="Ajustes manuais nos dados")

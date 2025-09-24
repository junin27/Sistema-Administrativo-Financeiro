"""
Schemas para entidades de pessoas (Supplier, Customer, BilledPerson).
Implementa validações específicas de CPF e CNPJ.
"""

from typing import Optional, List
from pydantic import Field, validator
import re

from .base import BaseCreateSchema, BaseUpdateSchema, BaseResponseSchema, FilterSchema


def validate_tax_id(tax_id: str) -> str:
    """Valida formato básico do CNPJ."""
    if not tax_id:
        raise ValueError("CNPJ é obrigatório")
    
    # Remove caracteres especiais
    tax_id_clean = re.sub(r'[^\d]', '', tax_id)
    
    if len(tax_id_clean) != 14:
        raise ValueError("CNPJ deve ter 14 dígitos")
    
    # Formatar CNPJ com máscara
    return f"{tax_id_clean[:2]}.{tax_id_clean[2:5]}.{tax_id_clean[5:8]}/{tax_id_clean[8:12]}-{tax_id_clean[12:]}"


def validate_document_id(document_id: str) -> str:
    """Valida formato básico do CPF."""
    if not document_id:
        raise ValueError("CPF é obrigatório")
    
    # Remove caracteres especiais
    document_id_clean = re.sub(r'[^\d]', '', document_id)
    
    if len(document_id_clean) != 11:
        raise ValueError("CPF deve ter 11 dígitos")
    
    # Formatar CPF com máscara
    return f"{document_id_clean[:3]}.{document_id_clean[3:6]}.{document_id_clean[6:9]}-{document_id_clean[9:]}"


# ==================== SUPPLIER ====================

class SupplierCreateSchema(BaseCreateSchema):
    """Schema para criação de fornecedor."""
    
    company_name: str = Field(..., min_length=1, max_length=255, description="Razão social do fornecedor")
    trade_name: Optional[str] = Field(None, max_length=255, description="Nome fantasia")
    tax_id: str = Field(..., description="CNPJ do fornecedor")
    
    @validator('tax_id')
    def validate_tax_id_format(cls, v):
        return validate_tax_id(v)


class SupplierUpdateSchema(BaseUpdateSchema):
    """Schema para atualização de fornecedor."""
    
    company_name: Optional[str] = Field(None, min_length=1, max_length=255)
    trade_name: Optional[str] = Field(None, max_length=255)
    tax_id: Optional[str] = Field(None)
    
    @validator('tax_id')
    def validate_tax_id_format(cls, v):
        if v:
            return validate_tax_id(v)
        return v


class SupplierResponseSchema(BaseResponseSchema):
    """Schema de resposta para fornecedor."""
    
    company_name: str
    trade_name: Optional[str] = None
    tax_id: str


class SupplierFilterSchema(FilterSchema):
    """Schema para filtros de fornecedor."""
    
    company_name: Optional[str] = None
    trade_name: Optional[str] = None
    tax_id: Optional[str] = None


# ==================== CUSTOMER ====================

class CustomerCreateSchema(BaseCreateSchema):
    """Schema para criação de cliente."""
    
    full_name: str = Field(..., min_length=1, max_length=255, description="Nome completo do cliente")
    document_id: str = Field(..., description="CPF do cliente")
    
    @validator('document_id')
    def validate_document_id_format(cls, v):
        return validate_document_id(v)


class CustomerUpdateSchema(BaseUpdateSchema):
    """Schema para atualização de cliente."""
    
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    document_id: Optional[str] = Field(None)
    
    @validator('document_id')
    def validate_document_id_format(cls, v):
        if v:
            return validate_document_id(v)
        return v


class CustomerResponseSchema(BaseResponseSchema):
    """Schema de resposta para cliente."""
    
    full_name: str
    document_id: str


class CustomerFilterSchema(FilterSchema):
    """Schema para filtros de cliente."""
    
    full_name: Optional[str] = None
    document_id: Optional[str] = None


# ==================== BILLED PERSON ====================

class BilledPersonCreateSchema(BaseCreateSchema):
    """Schema para criação de faturado."""
    
    full_name: str = Field(..., min_length=1, max_length=255, description="Nome completo do faturado")
    document_id: str = Field(..., description="CPF do faturado")
    
    @validator('document_id')
    def validate_document_id_format(cls, v):
        return validate_document_id(v)


class BilledPersonUpdateSchema(BaseUpdateSchema):
    """Schema para atualização de faturado."""
    
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    document_id: Optional[str] = Field(None)
    
    @validator('document_id')
    def validate_document_id_format(cls, v):
        if v:
            return validate_document_id(v)
        return v


class BilledPersonResponseSchema(BaseResponseSchema):
    """Schema de resposta para faturado."""
    
    full_name: str
    document_id: str


class BilledPersonFilterSchema(FilterSchema):
    """Schema para filtros de faturado."""
    
    full_name: Optional[str] = None
    document_id: Optional[str] = None


# ==================== BULK OPERATIONS ====================

class BulkSupplierResponseSchema(BaseResponseSchema):
    """Schema para resposta de operações em lote de fornecedores."""
    
    suppliers: List[SupplierResponseSchema]
    total: int
    page: int
    per_page: int

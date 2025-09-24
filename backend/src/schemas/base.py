"""
Schemas base para validação com Pydantic.
Implementa padrões comuns de serialização e validação.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


class BaseSchema(BaseModel):
    """Schema base com configurações padrão."""
    
    model_config = ConfigDict(
        from_attributes=True,
        validate_assignment=True,
        arbitrary_types_allowed=True
    )


class BaseEntitySchema(BaseSchema):
    """Schema base para entidades com campos de auditoria."""
    
    id: Optional[UUID] = None
    active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class BaseCreateSchema(BaseSchema):
    """Schema base para criação de entidades."""
    pass


class BaseUpdateSchema(BaseSchema):
    """Schema base para atualização de entidades."""
    pass


class BaseResponseSchema(BaseEntitySchema):
    """Schema base para resposta de APIs."""
    pass


class PaginationSchema(BaseSchema):
    """Schema para paginação de resultados."""
    
    page: int = Field(default=1, ge=1, description="Número da página")
    size: int = Field(default=20, ge=1, le=100, description="Tamanho da página")
    total: Optional[int] = Field(default=None, description="Total de registros")
    pages: Optional[int] = Field(default=None, description="Total de páginas")


class FilterSchema(BaseSchema):
    """Schema base para filtros."""
    
    active: Optional[bool] = Field(default=None, description="Filtrar por status ativo/inativo")
    search: Optional[str] = Field(default=None, description="Texto para busca geral")

"""
Modelos base para implementação de soft delete e auditoria.
Aplica o padrão de herança para funcionalidades comuns.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Boolean
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.dialects.postgresql import UUID
import uuid


class BaseModel:
    """
    Classe base para todos os modelos com campos comuns.
    Implementa soft delete e auditoria automaticamente.
    """
    
    @declared_attr
    def id(cls):
        return Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    @declared_attr
    def active(cls):
        return Column(Boolean, default=True, nullable=False, index=True)
    
    @declared_attr
    def created_at(cls):
        return Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    @declared_attr
    def updated_at(cls):
        return Column(
            DateTime, 
            default=lambda: datetime.now(timezone.utc), 
            onupdate=lambda: datetime.now(timezone.utc), 
            nullable=False
        )
    
    def soft_delete(self) -> None:
        """Inativa o registro (soft delete)."""
        self.active = False
        self.updated_at = datetime.now(timezone.utc)
    
    def reactivate(self) -> None:
        """Reativa o registro."""
        self.active = True
        self.updated_at = datetime.now(timezone.utc)
    
    def __repr__(self) -> str:
        return f"<{self.__class__.__name__}(id={self.id}, active={self.active})>"

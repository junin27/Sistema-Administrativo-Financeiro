"""
Modelos para tipos de despesa.
Implementa a estrutura para classificação de despesas.
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func

from ..config.database import Base


class ExpenseType(Base):
    """
    Modelo para tipos de despesa.
    Armazena as classificações de despesas disponíveis no sistema.
    """
    __tablename__ = "expense_types"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    description = Column(String(255), nullable=False, unique=True)
    category = Column(String(100), nullable=False)
    notes = Column(String(1000), nullable=True)
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self) -> str:
        return f"<ExpenseType(id={self.id}, description='{self.description}', category='{self.category}')>"
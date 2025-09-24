"""
Modelos para classificações de receitas e despesas.
Implementa categorização hierárquica para melhor organização.
"""

from sqlalchemy import Column, String, Text, Index
from sqlalchemy.orm import relationship

from .base import BaseModel
from ..config.database import Base


class RevenueType(Base, BaseModel):
    """
    Modelo para classificação de tipos de receita.
    Permite categorização detalhada das receitas.
    """
    __tablename__ = "revenue_types"
    
    description = Column(String(255), nullable=False, index=True)
    notes = Column(Text, nullable=True)
    
    # Relacionamentos many-to-many com contas a receber
    receivable_accounts = relationship(
        "ReceivableAccount",
        secondary="receivable_account_revenue_classification",
        back_populates="revenue_types",
        lazy="select"
    )
    
    # Índices para performance
    __table_args__ = (
        Index('idx_revenue_type_active_desc', 'active', 'description'),
    )
    
    def __repr__(self) -> str:
        return f"<RevenueType(description='{self.description}')>"


class ExpenseType(Base, BaseModel):
    """
    Modelo para classificação de tipos de despesa.
    Implementa categorização baseada nas categorias agrícolas especificadas.
    """
    __tablename__ = "expense_types"
    
    # Categorias pré-definidas conforme especificação
    CATEGORIES = [
        "INSUMOS AGRÍCOLAS",
        "MANUTENÇÃO E OPERAÇÃO", 
        "RECURSOS HUMANOS",
        "SERVIÇOS OPERACIONAIS",
        "INFRAESTRUTURA E UTILIDADES",
        "ADMINISTRATIVAS",
        "SEGUROS E PROTEÇÃO",
        "IMPOSTOS E TAXAS",
        "INVESTIMENTOS"
    ]
    
    description = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    notes = Column(Text, nullable=True)
    
    # Relacionamentos many-to-many com contas a pagar
    payable_accounts = relationship(
        "PayableAccount",
        secondary="payable_account_expense_classification",
        back_populates="expense_types",
        lazy="select"
    )
    
    # Índices compostos para performance
    __table_args__ = (
        Index('idx_expense_type_active_category', 'active', 'category'),
        Index('idx_expense_type_category_desc', 'category', 'description'),
    )
    
    def __repr__(self) -> str:
        return f"<ExpenseType(category='{self.category}', description='{self.description}')>"

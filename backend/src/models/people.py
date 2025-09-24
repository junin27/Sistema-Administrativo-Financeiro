"""
Modelos para entidades de pessoas (Supplier, Customer, Billed).
Implementa validações específicas e relacionamentos otimizados.
"""

from sqlalchemy import Column, String, Index
from sqlalchemy.orm import relationship

from .base import BaseModel
from ..config.database import Base


class Supplier(Base, BaseModel):
    """
    Modelo para fornecedores.
    Implementa validação de CNPJ e relacionamentos com contas a pagar.
    """
    __tablename__ = "suppliers"
    
    company_name = Column(String(255), nullable=False, index=True)
    trade_name = Column(String(255), nullable=True, index=True)
    tax_id = Column(String(18), nullable=False, unique=True, index=True)
    
    # Relacionamentos
    payable_accounts = relationship(
        "PayableAccount", 
        back_populates="supplier",
        lazy="select"
    )
    
    # Índices compostos para performance
    __table_args__ = (
        Index('idx_supplier_active_company_name', 'active', 'company_name'),
        Index('idx_supplier_tax_id_active', 'tax_id', 'active'),
    )
    
    def __repr__(self) -> str:
        return f"<Supplier(company_name='{self.company_name}', tax_id='{self.tax_id}')>"


class Customer(Base, BaseModel):
    """
    Modelo para clientes.
    Implementa validação de CPF e relacionamentos com contas a receber.
    """
    __tablename__ = "customers"
    
    full_name = Column(String(255), nullable=False, index=True)
    document_id = Column(String(14), nullable=False, unique=True, index=True)
    
    # Relacionamentos
    receivable_accounts = relationship(
        "ReceivableAccount", 
        back_populates="customer",
        lazy="select"
    )
    
    # Índices compostos para performance
    __table_args__ = (
        Index('idx_customer_active_name', 'active', 'full_name'),
        Index('idx_customer_document_id_active', 'document_id', 'active'),
    )
    
    def __repr__(self) -> str:
        return f"<Customer(full_name='{self.full_name}', document_id='{self.document_id}')>"


class BilledPerson(Base, BaseModel):
    """
    Modelo para faturados (pessoas que recebem a fatura).
    Usado principalmente no processamento de PDF.
    """
    __tablename__ = "billed_people"
    
    full_name = Column(String(255), nullable=False, index=True)
    document_id = Column(String(14), nullable=False, unique=True, index=True)
    
    # Relacionamentos
    payable_accounts = relationship(
        "PayableAccount", 
        back_populates="billed_person",
        lazy="select"
    )
    
    # Índices compostos para performance
    __table_args__ = (
        Index('idx_billed_person_active_name', 'active', 'full_name'),
        Index('idx_billed_person_document_id_active', 'document_id', 'active'),
    )
    
    def __repr__(self) -> str:
        return f"<BilledPerson(full_name='{self.full_name}', document_id='{self.document_id}')>"

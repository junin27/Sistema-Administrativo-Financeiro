"""
Modelos para contas a pagar e receber com relacionamentos complexos.
Implementa suporte a múltiplas parcelas e classificações.
"""

from decimal import Decimal
from datetime import date
from sqlalchemy import (
    Column, String, Text, Numeric, Date, Integer, 
    ForeignKey, Index, Table
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from .base import BaseModel
from ..config.database import Base

# Tabelas de associação para relacionamentos many-to-many
payable_account_expense_association = Table(
    'payable_account_expense_classification',
    Base.metadata,
    Column('payable_account_id', UUID(as_uuid=True), ForeignKey('payable_accounts.id'), primary_key=True),
    Column('expense_type_id', UUID(as_uuid=True), ForeignKey('expense_types.id'), primary_key=True),
    Column('percentage', Numeric(5, 2), default=100.00, nullable=False)
)

receivable_account_revenue_association = Table(
    'receivable_account_revenue_classification', 
    Base.metadata,
    Column('receivable_account_id', UUID(as_uuid=True), ForeignKey('receivable_accounts.id'), primary_key=True),
    Column('revenue_type_id', UUID(as_uuid=True), ForeignKey('revenue_types.id'), primary_key=True),
    Column('percentage', Numeric(5, 2), default=100.00, nullable=False)
)


class PayableAccount(Base, BaseModel):
    """
    Modelo para contas a pagar.
    Suporte a múltiplas parcelas e classificações de despesa.
    """
    __tablename__ = "payable_accounts"
    
    invoice_number = Column(String(50), nullable=True, index=True)
    issue_date = Column(Date, nullable=False, index=True)
    product_description = Column(Text, nullable=False)
    total_amount = Column(Numeric(15, 2), nullable=False)
    
    # Relacionamentos com pessoas
    supplier_id = Column(UUID(as_uuid=True), ForeignKey('suppliers.id'), nullable=False)
    billed_person_id = Column(UUID(as_uuid=True), ForeignKey('billed_people.id'), nullable=True)
    
    supplier = relationship("Supplier", back_populates="payable_accounts")
    billed_person = relationship("BilledPerson", back_populates="payable_accounts")
    
    # Relacionamento com parcelas
    installments = relationship(
        "PayableInstallment", 
        back_populates="payable_account",
        cascade="all, delete-orphan",
        lazy="select"
    )
    
    # Relacionamento many-to-many com tipos de despesa
    expense_types = relationship(
        "ExpenseType",
        secondary=payable_account_expense_association,
        lazy="select"
    )
    
    # Índices compostos para performance
    __table_args__ = (
        Index('idx_payable_account_supplier_date', 'supplier_id', 'issue_date'),
        Index('idx_payable_account_invoice_active', 'invoice_number', 'active'),
        Index('idx_payable_account_date_active', 'issue_date', 'active'),
    )
    
    def __repr__(self) -> str:
        return f"<PayableAccount(invoice_number='{self.invoice_number}', total_amount={self.total_amount})>"


class ReceivableAccount(Base, BaseModel):
    """
    Modelo para contas a receber.
    Suporte a múltiplas parcelas e classificações de receita.
    """
    __tablename__ = "receivable_accounts"
    
    document_number = Column(String(50), nullable=True, index=True)
    issue_date = Column(Date, nullable=False, index=True)
    description = Column(Text, nullable=False)
    total_amount = Column(Numeric(15, 2), nullable=False)
    
    # Relacionamento com cliente
    customer_id = Column(UUID(as_uuid=True), ForeignKey('customers.id'), nullable=False)
    customer = relationship("Customer", back_populates="receivable_accounts")
    
    # Relacionamento com parcelas
    installments = relationship(
        "ReceivableInstallment", 
        back_populates="receivable_account",
        cascade="all, delete-orphan",
        lazy="select"
    )
    
    # Relacionamento many-to-many com tipos de receita
    revenue_types = relationship(
        "RevenueType",
        secondary=receivable_account_revenue_association,
        lazy="select"
    )
    
    # Índices compostos para performance
    __table_args__ = (
        Index('idx_receivable_account_customer_date', 'customer_id', 'issue_date'),
        Index('idx_receivable_account_doc_active', 'document_number', 'active'),
        Index('idx_receivable_account_date_active', 'issue_date', 'active'),
    )
    
    def __repr__(self) -> str:
        return f"<ReceivableAccount(document_number='{self.document_number}', total_amount={self.total_amount})>"


class PayableInstallment(Base, BaseModel):
    """
    Modelo para parcelas de contas a pagar.
    Permite múltiplas parcelas com datas distintas.
    """
    __tablename__ = "payable_installments"
    
    installment_number = Column(Integer, nullable=False)
    due_date = Column(Date, nullable=False, index=True)
    installment_amount = Column(Numeric(15, 2), nullable=False)
    payment_date = Column(Date, nullable=True)
    paid_amount = Column(Numeric(15, 2), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Relacionamento com conta a pagar
    payable_account_id = Column(UUID(as_uuid=True), ForeignKey('payable_accounts.id'), nullable=False)
    payable_account = relationship("PayableAccount", back_populates="installments")
    
    # Índices para performance
    __table_args__ = (
        Index('idx_payable_installment_account_number', 'payable_account_id', 'installment_number'),
        Index('idx_payable_installment_due_date', 'due_date', 'active'),
    )
    
    @property
    def payment_status(self) -> str:
        """Retorna o status do pagamento da parcela."""
        if self.payment_date:
            return "PAID"
        elif self.due_date < date.today():
            return "OVERDUE"
        else:
            return "PENDING"
    
    def __repr__(self) -> str:
        return f"<PayableInstallment(number={self.installment_number}, due_date={self.due_date})>"


class ReceivableInstallment(Base, BaseModel):
    """
    Modelo para parcelas de contas a receber.
    Permite múltiplas parcelas com datas distintas.
    """
    __tablename__ = "receivable_installments"
    
    installment_number = Column(Integer, nullable=False)
    due_date = Column(Date, nullable=False, index=True)
    installment_amount = Column(Numeric(15, 2), nullable=False)
    receipt_date = Column(Date, nullable=True)
    received_amount = Column(Numeric(15, 2), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Relacionamento com conta a receber
    receivable_account_id = Column(UUID(as_uuid=True), ForeignKey('receivable_accounts.id'), nullable=False)
    receivable_account = relationship("ReceivableAccount", back_populates="installments")
    
    # Índices para performance
    __table_args__ = (
        Index('idx_receivable_installment_account_number', 'receivable_account_id', 'installment_number'),
        Index('idx_receivable_installment_due_date', 'due_date', 'active'),
    )
    
    @property
    def receipt_status(self) -> str:
        """Retorna o status do recebimento da parcela."""
        if self.receipt_date:
            return "RECEIVED"
        elif self.due_date < date.today():
            return "OVERDUE"
        else:
            return "PENDING"
    
    def __repr__(self) -> str:
        return f"<ReceivableInstallment(number={self.installment_number}, due_date={self.due_date})>"

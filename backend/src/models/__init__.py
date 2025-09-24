"""
Módulo de modelos do sistema.
Centraliza a importação de todos os modelos SQLAlchemy.
"""

from .base import BaseModel
from .people import Supplier, Customer, BilledPerson
from .classifications import RevenueType, ExpenseType
from .accounts import (
    PayableAccount, ReceivableAccount, 
    PayableInstallment, ReceivableInstallment,
    payable_account_expense_association,
    receivable_account_revenue_association
)

__all__ = [
    "BaseModel",
    "Supplier", 
    "Customer", 
    "BilledPerson",
    "RevenueType", 
    "ExpenseType",
    "PayableAccount", 
    "ReceivableAccount",
    "PayableInstallment", 
    "ReceivableInstallment",
    "payable_account_expense_association",
    "receivable_account_revenue_association"
]

"""
Módulo de modelos do sistema.
Centraliza a importação de todos os modelos SQLAlchemy.
"""

# TEMPORÁRIO: Comentando importações antigas para banco limpo
# from .base import BaseModel
# from .people import Supplier, Customer, BilledPerson
# from .classifications import RevenueType, ExpenseType
# from .accounts import (
#     PayableAccount, ReceivableAccount, 
#     PayableInstallment, ReceivableInstallment,
#     payable_account_expense_association,
#     receivable_account_revenue_association
# )

# Importar apenas modelos DDL
from .ddl_models import Pessoas, MovimentoContas

__all__ = [
    # TEMPORÁRIO: Comentando modelos antigos
    # "BaseModel",
    # "Supplier", 
    # "Customer", 
    # "BilledPerson",
    # "RevenueType", 
    # "ExpenseType",
    # "PayableAccount", 
    # "ReceivableAccount",
    # "PayableInstallment", 
    # "ReceivableInstallment",
    # "payable_account_expense_association",
    # "receivable_account_revenue_association",
    
    # Apenas modelos DDL
    "Pessoas",
    "MovimentoContas"
]

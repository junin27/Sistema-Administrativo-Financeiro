"""
Módulo de schemas do sistema.
Centraliza a importação de todos os schemas Pydantic.
"""

from .base import (
    BaseSchema, BaseEntitySchema, BaseCreateSchema, 
    BaseUpdateSchema, BaseResponseSchema, PaginationSchema, FilterSchema
)
from .people import (
    SupplierCreateSchema, SupplierUpdateSchema, SupplierResponseSchema, SupplierFilterSchema,
    CustomerCreateSchema, CustomerUpdateSchema, CustomerResponseSchema, CustomerFilterSchema,
    BilledPersonCreateSchema, BilledPersonUpdateSchema, BilledPersonResponseSchema, BilledPersonFilterSchema
)
# from .classifications import (
#     RevenueTypeCreateSchema, RevenueTypeUpdateSchema, RevenueTypeResponseSchema, RevenueTypeFilterSchema,
#     ExpenseTypeCreateSchema, ExpenseTypeUpdateSchema, ExpenseTypeResponseSchema, ExpenseTypeFilterSchema
# )
from .pdf_processing import (
    PDFUploadSchema, DadosExtraidosPDFSchema, ProcessamentoPDFResponseSchema,
    ContaGeradaSchema, GerarContaPDFSchema
)

__all__ = [
    # Base schemas
    "BaseSchema", "BaseEntitySchema", "BaseCreateSchema", 
    "BaseUpdateSchema", "BaseResponseSchema", "PaginationSchema", "FilterSchema",
    
    # People schemas
    "SupplierCreateSchema", "SupplierUpdateSchema", "SupplierResponseSchema", "SupplierFilterSchema",
    "CustomerCreateSchema", "CustomerUpdateSchema", "CustomerResponseSchema", "CustomerFilterSchema", 
    "BilledPersonCreateSchema", "BilledPersonUpdateSchema", "BilledPersonResponseSchema", "BilledPersonFilterSchema",
    
    # PDF Processing schemas
    "PDFUploadSchema", "DadosExtraidosPDFSchema", "ProcessamentoPDFResponseSchema",
    "ContaGeradaSchema", "GerarContaPDFSchema"
]

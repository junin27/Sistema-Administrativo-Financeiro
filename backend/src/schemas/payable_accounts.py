"""
Schemas para contas a pagar - Etapa 2.
Implementa validação de dados para o fluxo de registro de contas a pagar.
"""

from typing import List, Optional
from datetime import date
from decimal import Decimal
from pydantic import BaseModel, Field, validator
from uuid import UUID


class SupplierValidationSchema(BaseModel):
    """Schema para validação de fornecedor."""
    company_name: str = Field(..., description="Razão social do fornecedor")
    tax_id: str = Field(..., description="CNPJ do fornecedor")


class BilledPersonValidationSchema(BaseModel):
    """Schema para validação de pessoa faturada."""
    full_name: str = Field(..., description="Nome completo da pessoa faturada")
    document_id: str = Field(..., description="CPF da pessoa faturada")


class ExpenseValidationSchema(BaseModel):
    """Schema para validação de despesa."""
    description: str = Field(..., description="Descrição da despesa")
    category: Optional[str] = Field(None, description="Categoria da despesa")


class InstallmentCreateSchema(BaseModel):
    """Schema para criação de parcela."""
    installment_number: int = Field(..., ge=1, description="Número da parcela")
    due_date: date = Field(..., description="Data de vencimento")
    installment_amount: Decimal = Field(..., gt=0, description="Valor da parcela")
    notes: Optional[str] = Field(None, description="Observações da parcela")


class PayableAccountCreateSchema(BaseModel):
    """Schema para criação de conta a pagar - Etapa 2."""
    
    # Dados do movimento
    invoice_number: Optional[str] = Field(None, description="Número da nota fiscal")
    issue_date: date = Field(..., description="Data de emissão")
    product_description: str = Field(..., description="Descrição do produto/serviço")
    total_amount: Decimal = Field(..., gt=0, description="Valor total")
    
    # Dados para validação/criação
    supplier: SupplierValidationSchema = Field(..., description="Dados do fornecedor")
    billed_person: Optional[BilledPersonValidationSchema] = Field(None, description="Dados da pessoa faturada")
    expense: ExpenseValidationSchema = Field(..., description="Dados da despesa")
    
    # Parcelas
    installments: List[InstallmentCreateSchema] = Field(..., min_items=1, description="Lista de parcelas")
    
    @validator('installments')
    def validate_installments_total(cls, v, values):
        """Valida se a soma das parcelas é igual ao valor total."""
        if 'total_amount' in values:
            total_installments = sum(installment.installment_amount for installment in v)
            if total_installments != values['total_amount']:
                raise ValueError('A soma das parcelas deve ser igual ao valor total')
        return v


class ValidationResultSchema(BaseModel):
    """Schema para resultado de validação."""
    exists: bool = Field(..., description="Se o registro existe")
    id: Optional[UUID] = Field(None, description="ID do registro se existir")
    message: str = Field(..., description="Mensagem de resultado")


class PayableAccountValidationResponseSchema(BaseModel):
    """Schema para resposta da validação de conta a pagar."""
    supplier_validation: ValidationResultSchema = Field(..., description="Resultado da validação do fornecedor")
    billed_person_validation: Optional[ValidationResultSchema] = Field(None, description="Resultado da validação da pessoa faturada")
    expense_validation: ValidationResultSchema = Field(..., description="Resultado da validação da despesa")


class PayableAccountCreateResponseSchema(BaseModel):
    """Schema para resposta da criação de conta a pagar."""
    success: bool = Field(..., description="Se o registro foi criado com sucesso")
    message: str = Field(..., description="Mensagem de resultado")
    payable_account_id: Optional[UUID] = Field(None, description="ID da conta a pagar criada")
    validation_results: PayableAccountValidationResponseSchema = Field(..., description="Resultados das validações")
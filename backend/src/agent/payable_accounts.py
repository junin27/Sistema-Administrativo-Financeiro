"""
Serviço para gerenciamento de contas a pagar - Etapa 2.
Implementa validações e criações automáticas conforme especificação.
"""

from typing import Optional, Tuple
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from decimal import Decimal

from ..models.people import Supplier, BilledPerson
from ..models.classifications import ExpenseType
from ..models.accounts import PayableAccount, PayableInstallment, payable_account_expense_association
from ..schemas.payable_accounts import (
    PayableAccountCreateSchema,
    ValidationResultSchema,
    PayableAccountValidationResponseSchema,
    PayableAccountCreateResponseSchema
)
from ..core.exceptions import ValidationError, DatabaseError


class PayableAccountService:
    """Serviço para gerenciamento de contas a pagar."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def validate_supplier(self, company_name: str, tax_id: str) -> ValidationResultSchema:
        """
        Valida se o fornecedor existe no banco de dados.
        
        Args:
            company_name: Razão social do fornecedor
            tax_id: CNPJ do fornecedor
            
        Returns:
            ValidationResultSchema com resultado da validação
        """
        try:
            # Busca por CNPJ primeiro (mais específico)
            supplier = self.db.query(Supplier).filter(
                Supplier.tax_id == tax_id,
                Supplier.active == True
            ).first()
            
            if supplier:
                return ValidationResultSchema(
                    exists=True,
                    id=supplier.id,
                    message=f"EXISTE - ID: {supplier.id}"
                )
            
            # Se não encontrou por CNPJ, busca por razão social
            supplier = self.db.query(Supplier).filter(
                Supplier.company_name.ilike(f"%{company_name}%"),
                Supplier.active == True
            ).first()
            
            if supplier:
                return ValidationResultSchema(
                    exists=True,
                    id=supplier.id,
                    message=f"EXISTE - ID: {supplier.id}"
                )
            
            return ValidationResultSchema(
                exists=False,
                id=None,
                message="NÃO EXISTE"
            )
            
        except SQLAlchemyError as e:
            raise DatabaseError(f"Erro ao validar fornecedor: {str(e)}")
    
    def validate_billed_person(self, full_name: str, document_id: str) -> ValidationResultSchema:
        """
        Valida se a pessoa faturada existe no banco de dados.
        
        Args:
            full_name: Nome completo da pessoa
            document_id: CPF da pessoa
            
        Returns:
            ValidationResultSchema com resultado da validação
        """
        try:
            # Busca por CPF primeiro (mais específico)
            billed_person = self.db.query(BilledPerson).filter(
                BilledPerson.document_id == document_id,
                BilledPerson.active == True
            ).first()
            
            if billed_person:
                return ValidationResultSchema(
                    exists=True,
                    id=billed_person.id,
                    message=f"EXISTE - ID: {billed_person.id}"
                )
            
            # Se não encontrou por CPF, busca por nome
            billed_person = self.db.query(BilledPerson).filter(
                BilledPerson.full_name.ilike(f"%{full_name}%"),
                BilledPerson.active == True
            ).first()
            
            if billed_person:
                return ValidationResultSchema(
                    exists=True,
                    id=billed_person.id,
                    message=f"EXISTE - ID: {billed_person.id}"
                )
            
            return ValidationResultSchema(
                exists=False,
                id=None,
                message="NÃO EXISTE"
            )
            
        except SQLAlchemyError as e:
            raise DatabaseError(f"Erro ao validar pessoa faturada: {str(e)}")
    
    def validate_expense(self, description: str, category: Optional[str] = None) -> ValidationResultSchema:
        """
        Valida se a despesa existe no banco de dados.
        
        Args:
            description: Descrição da despesa
            category: Categoria da despesa (opcional)
            
        Returns:
            ValidationResultSchema com resultado da validação
        """
        try:
            query = self.db.query(ExpenseType).filter(
                ExpenseType.description.ilike(f"%{description}%"),
                ExpenseType.active == True
            )
            
            if category:
                query = query.filter(ExpenseType.category.ilike(f"%{category}%"))
            
            expense = query.first()
            
            if expense:
                return ValidationResultSchema(
                    exists=True,
                    id=expense.id,
                    message=f"EXISTE - ID: {expense.id}"
                )
            
            return ValidationResultSchema(
                exists=False,
                id=None,
                message="NÃO EXISTE"
            )
            
        except SQLAlchemyError as e:
            raise DatabaseError(f"Erro ao validar despesa: {str(e)}")
    
    def create_supplier_if_not_exists(self, company_name: str, tax_id: str) -> UUID:
        """
        Cria um novo fornecedor se não existir.
        
        Args:
            company_name: Razão social do fornecedor
            tax_id: CNPJ do fornecedor
            
        Returns:
            UUID do fornecedor (existente ou criado)
        """
        try:
            validation = self.validate_supplier(company_name, tax_id)
            
            if validation.exists:
                return validation.id
            
            # Criar novo fornecedor
            new_supplier = Supplier(
                company_name=company_name,
                tax_id=tax_id,
                trade_name=company_name,  # Usar razão social como nome fantasia por padrão
                active=True
            )
            
            self.db.add(new_supplier)
            self.db.flush()  # Para obter o ID sem commit
            
            return new_supplier.id
            
        except SQLAlchemyError as e:
            self.db.rollback()
            raise DatabaseError(f"Erro ao criar fornecedor: {str(e)}")
    
    def create_billed_person_if_not_exists(self, full_name: str, document_id: str) -> UUID:
        """
        Cria uma nova pessoa faturada se não existir.
        
        Args:
            full_name: Nome completo da pessoa
            document_id: CPF da pessoa
            
        Returns:
            UUID da pessoa faturada (existente ou criada)
        """
        try:
            validation = self.validate_billed_person(full_name, document_id)
            
            if validation.exists:
                return validation.id
            
            # Criar nova pessoa faturada
            new_billed_person = BilledPerson(
                full_name=full_name,
                document_id=document_id,
                active=True
            )
            
            self.db.add(new_billed_person)
            self.db.flush()  # Para obter o ID sem commit
            
            return new_billed_person.id
            
        except SQLAlchemyError as e:
            self.db.rollback()
            raise DatabaseError(f"Erro ao criar pessoa faturada: {str(e)}")
    
    def create_expense_if_not_exists(self, description: str, category: str = "MANUTENÇÃO E OPERAÇÃO") -> UUID:
        """
        Cria uma nova despesa se não existir.
        
        Args:
            description: Descrição da despesa
            category: Categoria da despesa
            
        Returns:
            UUID da despesa (existente ou criada)
        """
        try:
            validation = self.validate_expense(description, category)
            
            if validation.exists:
                return validation.id
            
            # Criar nova despesa
            new_expense = ExpenseType(
                description=description,
                category=category,
                active=True
            )
            
            self.db.add(new_expense)
            self.db.flush()  # Para obter o ID sem commit
            
            return new_expense.id
            
        except SQLAlchemyError as e:
            self.db.rollback()
            raise DatabaseError(f"Erro ao criar despesa: {str(e)}")
    
    def validate_payable_account_data(self, data: PayableAccountCreateSchema) -> PayableAccountValidationResponseSchema:
        """
        Valida todos os dados necessários para criar uma conta a pagar.
        
        Args:
            data: Dados da conta a pagar
            
        Returns:
            PayableAccountValidationResponseSchema com resultados das validações
        """
        try:
            # Validar fornecedor
            supplier_validation = self.validate_supplier(
                data.supplier.company_name,
                data.supplier.tax_id
            )
            
            # Validar pessoa faturada (se fornecida)
            billed_person_validation = None
            if data.billed_person:
                billed_person_validation = self.validate_billed_person(
                    data.billed_person.full_name,
                    data.billed_person.document_id
                )
            
            # Validar despesa
            expense_validation = self.validate_expense(
                data.expense.description,
                data.expense.category
            )
            
            return PayableAccountValidationResponseSchema(
                supplier_validation=supplier_validation,
                billed_person_validation=billed_person_validation,
                expense_validation=expense_validation
            )
            
        except Exception as e:
            raise ValidationError(f"Erro na validação dos dados: {str(e)}")
    
    def create_payable_account(self, data: PayableAccountCreateSchema) -> PayableAccountCreateResponseSchema:
        """
        Cria uma nova conta a pagar com todas as validações e criações automáticas.
        
        Args:
            data: Dados da conta a pagar
            
        Returns:
            PayableAccountCreateResponseSchema com resultado da operação
        """
        try:
            # Iniciar transação
            self.db.begin()
            
            # Realizar validações
            validation_results = self.validate_payable_account_data(data)
            
            # Criar/obter IDs das entidades relacionadas
            supplier_id = self.create_supplier_if_not_exists(
                data.supplier.company_name,
                data.supplier.tax_id
            )
            
            billed_person_id = None
            if data.billed_person:
                billed_person_id = self.create_billed_person_if_not_exists(
                    data.billed_person.full_name,
                    data.billed_person.document_id
                )
            
            expense_id = self.create_expense_if_not_exists(
                data.expense.description,
                data.expense.category or "MANUTENÇÃO E OPERAÇÃO"
            )
            
            # Criar conta a pagar
            payable_account = PayableAccount(
                invoice_number=data.invoice_number,
                issue_date=data.issue_date,
                product_description=data.product_description,
                total_amount=data.total_amount,
                supplier_id=supplier_id,
                billed_person_id=billed_person_id,
                active=True
            )
            
            self.db.add(payable_account)
            self.db.flush()
            
            # Criar relacionamento com classificação de despesa
            expense_association = payable_account_expense_association.insert().values(
                payable_account_id=payable_account.id,
                expense_type_id=expense_id,
                percentage=100.00
            )
            self.db.execute(expense_association)
            
            # Criar parcelas
            for installment_data in data.installments:
                installment = PayableInstallment(
                    installment_number=installment_data.installment_number,
                    due_date=installment_data.due_date,
                    installment_amount=installment_data.installment_amount,
                    notes=installment_data.notes,
                    payable_account_id=payable_account.id,
                    active=True
                )
                self.db.add(installment)
            
            # Commit da transação
            self.db.commit()
            
            return PayableAccountCreateResponseSchema(
                success=True,
                message="REGISTRO FOI LANÇADO COM SUCESSO",
                payable_account_id=payable_account.id,
                validation_results=validation_results
            )
            
        except Exception as e:
            self.db.rollback()
            raise DatabaseError(f"Erro ao criar conta a pagar: {str(e)}")
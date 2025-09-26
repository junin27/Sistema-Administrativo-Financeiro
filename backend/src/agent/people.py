"""
Services para entidades de pessoas.
Implementa lógica de negócio e validações específicas.
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session

from ..models.people import Supplier, Customer, BilledPerson
from ..repositories.people import SupplierRepository, CustomerRepository, BilledPersonRepository
from ..schemas.people import (
    SupplierCreateSchema, SupplierUpdateSchema,
    CustomerCreateSchema, CustomerUpdateSchema,
    BilledPersonCreateSchema, BilledPersonUpdateSchema
)
from ..core.exceptions import DuplicateError, NotFoundError


class SupplierService:
    """
    Service para gerenciamento de fornecedores.
    Implementa validações de negócio e operações complexas.
    """
    
    def __init__(self, db: Session):
        self.repository = SupplierRepository(db)
    
    def create(self, supplier_data: SupplierCreateSchema) -> Supplier:
        """Cria um novo fornecedor com validações de negócio."""
        # Verificar se já existe fornecedor com mesmo CNPJ
        existing_supplier = self.repository.get_by_tax_id(supplier_data.tax_id)
        if existing_supplier:
            raise DuplicateError("Fornecedor", "CNPJ", supplier_data.tax_id)
        
        return self.repository.create(supplier_data.dict())
    
    def get_by_id(self, supplier_id: UUID) -> Optional[Supplier]:
        """Obtém fornecedor por ID."""
        return self.repository.get_by_id(supplier_id)
    
    def get_by_tax_id(self, tax_id: str) -> Optional[Supplier]:
        """Obtém fornecedor por CNPJ."""
        return self.repository.get_by_tax_id(tax_id)
    
    def get_all(
        self,
        skip: int = 0,
        limit: int = 20,
        filters: Optional[Dict[str, Any]] = None,
        include_inactive: bool = False
    ) -> List[Supplier]:
        """Lista fornecedores com filtros opcionais."""
        return self.repository.get_all(
            skip=skip,
            limit=limit,
            filters=filters,
            include_inactive=include_inactive
        )
    
    def update(self, supplier_id: UUID, supplier_data: SupplierUpdateSchema) -> Optional[Supplier]:
        """Atualiza fornecedor existente."""
        # Verificar se existe
        supplier = self.repository.get_by_id(supplier_id)
        if not supplier:
            return None
        
        # Verificar CNPJ único se estiver sendo alterado
        if supplier_data.tax_id and supplier_data.tax_id != supplier.tax_id:
            existing_supplier = self.repository.get_by_tax_id(supplier_data.tax_id)
            if existing_supplier and existing_supplier.id != supplier_id:
                raise DuplicateError("Fornecedor", "CNPJ", supplier_data.tax_id)
        
        update_data = supplier_data.dict(exclude_unset=True)
        return self.repository.update(supplier_id, update_data)
    
    def soft_delete(self, supplier_id: UUID) -> bool:
        """Inativa fornecedor (soft delete)."""
        return self.repository.soft_delete(supplier_id)
    
    def reactivate(self, supplier_id: UUID) -> bool:
        """Reativa fornecedor inativo."""
        return self.repository.reactivate(supplier_id)
    
    def search_by_name(self, search_term: str, skip: int = 0, limit: int = 20) -> List[Supplier]:
        """Busca fornecedores por nome (razão social ou fantasia)."""
        return self.repository.search_by_name(search_term, skip, limit)
    
    def get_or_create_by_tax_id(self, tax_id: str, **kwargs) -> Supplier:
        """Obtém fornecedor existente ou cria novo baseado no CNPJ."""
        supplier = self.repository.get_by_tax_id(tax_id)
        if supplier:
            return supplier
        
        # Criar novo fornecedor
        create_data = {"tax_id": tax_id, **kwargs}
        return self.repository.create(create_data)


class CustomerService:
    """
    Service para gerenciamento de clientes.
    Implementa validações de negócio e operações complexas.
    """
    
    def __init__(self, db: Session):
        self.repository = CustomerRepository(db)
    
    def create(self, customer_data: CustomerCreateSchema) -> Customer:
        """Cria um novo cliente com validações de negócio."""
        # Verificar se já existe cliente com mesmo CPF
        existing_customer = self.repository.get_by_document_id(customer_data.document_id)
        if existing_customer:
            raise DuplicateError("Cliente", "CPF", customer_data.document_id)
        
        return self.repository.create(customer_data.dict())
    
    def get_by_id(self, customer_id: UUID) -> Optional[Customer]:
        """Obtém cliente por ID."""
        return self.repository.get_by_id(customer_id)
    
    def get_by_document_id(self, document_id: str) -> Optional[Customer]:
        """Obtém cliente por CPF."""
        return self.repository.get_by_document_id(document_id)
    
    def get_all(
        self,
        skip: int = 0,
        limit: int = 20,
        filters: Optional[Dict[str, Any]] = None,
        include_inactive: bool = False
    ) -> List[Customer]:
        """Lista clientes com filtros opcionais."""
        return self.repository.get_all(
            skip=skip,
            limit=limit,
            filters=filters,
            include_inactive=include_inactive
        )
    
    def update(self, customer_id: UUID, customer_data: CustomerUpdateSchema) -> Optional[Customer]:
        """Atualiza cliente existente."""
        # Verificar se existe
        customer = self.repository.get_by_id(customer_id)
        if not customer:
            return None
        
        # Verificar CPF único se estiver sendo alterado
        if customer_data.document_id and customer_data.document_id != customer.document_id:
            existing_customer = self.repository.get_by_document_id(customer_data.document_id)
            if existing_customer and existing_customer.id != customer_id:
                raise DuplicateError("Cliente", "CPF", customer_data.document_id)
        
        update_data = customer_data.dict(exclude_unset=True)
        return self.repository.update(customer_id, update_data)
    
    def soft_delete(self, customer_id: UUID) -> bool:
        """Inativa cliente (soft delete)."""
        return self.repository.soft_delete(customer_id)
    
    def reactivate(self, customer_id: UUID) -> bool:
        """Reativa cliente inativo."""
        return self.repository.reactivate(customer_id)
    
    def search_by_name(self, search_term: str, skip: int = 0, limit: int = 20) -> List[Customer]:
        """Busca clientes por nome."""
        return self.repository.search_by_name(search_term, skip, limit)


class BilledPersonService:
    """
    Service para gerenciamento de pessoas faturadas.
    Usado principalmente no processamento de PDF.
    """
    
    def __init__(self, db: Session):
        self.repository = BilledPersonRepository(db)
    
    def create(self, billed_person_data: BilledPersonCreateSchema) -> BilledPerson:
        """Cria uma nova pessoa faturada com validações de negócio."""
        # Verificar se já existe pessoa faturada com mesmo CPF
        existing_person = self.repository.get_by_document_id(billed_person_data.document_id)
        if existing_person:
            raise DuplicateError("Pessoa faturada", "CPF", billed_person_data.document_id)
        
        return self.repository.create(billed_person_data.dict())
    
    def get_by_id(self, person_id: UUID) -> Optional[BilledPerson]:
        """Obtém pessoa faturada por ID."""
        return self.repository.get_by_id(person_id)
    
    def get_by_document_id(self, document_id: str) -> Optional[BilledPerson]:
        """Obtém pessoa faturada por CPF."""
        return self.repository.get_by_document_id(document_id)
    
    def get_all(
        self,
        skip: int = 0,
        limit: int = 20,
        filters: Optional[Dict[str, Any]] = None,
        include_inactive: bool = False
    ) -> List[BilledPerson]:
        """Lista pessoas faturadas com filtros opcionais."""
        return self.repository.get_all(
            skip=skip,
            limit=limit,
            filters=filters,
            include_inactive=include_inactive
        )
    
    def update(self, person_id: UUID, person_data: BilledPersonUpdateSchema) -> Optional[BilledPerson]:
        """Atualiza pessoa faturada existente."""
        # Verificar se existe
        person = self.repository.get_by_id(person_id)
        if not person:
            return None
        
        # Verificar CPF único se estiver sendo alterado
        if person_data.document_id and person_data.document_id != person.document_id:
            existing_person = self.repository.get_by_document_id(person_data.document_id)
            if existing_person and existing_person.id != person_id:
                raise DuplicateError("Pessoa faturada", "CPF", person_data.document_id)
        
        update_data = person_data.dict(exclude_unset=True)
        return self.repository.update(person_id, update_data)
    
    def soft_delete(self, person_id: UUID) -> bool:
        """Inativa pessoa faturada (soft delete)."""
        return self.repository.soft_delete(person_id)
    
    def reactivate(self, person_id: UUID) -> bool:
        """Reativa pessoa faturada inativa."""
        return self.repository.reactivate(person_id)
    
    def get_or_create_by_document_id(self, document_id: str, **kwargs) -> BilledPerson:
        """Obtém pessoa faturada existente ou cria nova baseado no CPF."""
        person = self.repository.get_by_document_id(document_id)
        if person:
            return person
        
        # Criar nova pessoa faturada
        create_data = {"document_id": document_id, **kwargs}
        return self.repository.create(create_data)

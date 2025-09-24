"""
Repositories para entidades de pessoas.
Implementa acesso a dados com operações específicas e otimizadas.
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from .base import BaseRepository
from ..models.people import Supplier, Customer, BilledPerson


class SupplierRepository(BaseRepository[Supplier]):
    """
    Repository para fornecedores.
    Implementa operações específicas de busca e validação.
    """
    
    def __init__(self, db: Session):
        super().__init__(db, Supplier)
    
    def get_by_tax_id(self, tax_id: str) -> Optional[Supplier]:
        """Busca fornecedor por CNPJ."""
        return self.db.query(Supplier).filter(
            and_(
                Supplier.tax_id == tax_id,
                Supplier.active == True
            )
        ).first()
    
    def search_by_name(self, search_term: str, skip: int = 0, limit: int = 20) -> List[Supplier]:
        """
        Busca fornecedores por nome (razão social ou fantasia).
        Usa busca parcial case-insensitive.
        """
        return self.db.query(Supplier).filter(
            and_(
                Supplier.active == True,
                or_(
                    Supplier.company_name.ilike(f"%{search_term}%"),
                    Supplier.trade_name.ilike(f"%{search_term}%")
                )
            )
        ).offset(skip).limit(limit).all()
    
    def get_by_filters(self, filters: Dict[str, Any]) -> List[Supplier]:
        """
        Busca fornecedores com múltiplos filtros.
        Suporta filtros por company_name, trade_name, tax_id e active.
        """
        query = self.db.query(Supplier)
        
        # Filtros de busca
        if "company_name" in filters:
            query = query.filter(Supplier.company_name.ilike(f"%{filters['company_name']}%"))
        
        if "trade_name" in filters:
            query = query.filter(Supplier.trade_name.ilike(f"%{filters['trade_name']}%"))
        
        if "tax_id" in filters:
            query = query.filter(Supplier.tax_id == filters["tax_id"])
        
        if "active" in filters:
            query = query.filter(Supplier.active == filters["active"])
        else:
            # Por padrão, apenas ativos
            query = query.filter(Supplier.active == True)
        
        return query.all()
    
    def get_active_suppliers_count(self) -> int:
        """Retorna quantidade de fornecedores ativos."""
        return self.db.query(Supplier).filter(Supplier.active == True).count()
    
    def get_suppliers_by_company_name_prefix(self, prefix: str, limit: int = 10) -> List[Supplier]:
        """Busca fornecedores que começam com determinado prefixo (para autocomplete)."""
        return self.db.query(Supplier).filter(
            and_(
                Supplier.active == True,
                Supplier.company_name.ilike(f"{prefix}%")
            )
        ).limit(limit).all()


class CustomerRepository(BaseRepository[Customer]):
    """
    Repository para clientes.
    Implementa operações específicas de busca e validação.
    """
    
    def __init__(self, db: Session):
        super().__init__(db, Customer)
    
    def get_by_document_id(self, document_id: str) -> Optional[Customer]:
        """Busca cliente por CPF."""
        return self.db.query(Customer).filter(
            and_(
                Customer.document_id == document_id,
                Customer.active == True
            )
        ).first()
    
    def search_by_name(self, search_term: str, skip: int = 0, limit: int = 20) -> List[Customer]:
        """
        Busca clientes por nome completo.
        Usa busca parcial case-insensitive.
        """
        return self.db.query(Customer).filter(
            and_(
                Customer.active == True,
                Customer.full_name.ilike(f"%{search_term}%")
            )
        ).offset(skip).limit(limit).all()
    
    def get_by_filters(self, filters: Dict[str, Any]) -> List[Customer]:
        """
        Busca clientes com múltiplos filtros.
        Suporta filtros por full_name, document_id e active.
        """
        query = self.db.query(Customer)
        
        # Filtros de busca
        if "full_name" in filters:
            query = query.filter(Customer.full_name.ilike(f"%{filters['full_name']}%"))
        
        if "document_id" in filters:
            query = query.filter(Customer.document_id == filters["document_id"])
        
        if "active" in filters:
            query = query.filter(Customer.active == filters["active"])
        else:
            # Por padrão, apenas ativos
            query = query.filter(Customer.active == True)
        
        return query.all()
    
    def get_active_customers_count(self) -> int:
        """Retorna quantidade de clientes ativos."""
        return self.db.query(Customer).filter(Customer.active == True).count()
    
    def get_customers_by_name_prefix(self, prefix: str, limit: int = 10) -> List[Customer]:
        """Busca clientes que começam com determinado prefixo (para autocomplete)."""
        return self.db.query(Customer).filter(
            and_(
                Customer.active == True,
                Customer.full_name.ilike(f"{prefix}%")
            )
        ).limit(limit).all()


class BilledPersonRepository(BaseRepository[BilledPerson]):
    """
    Repository para pessoas faturadas.
    Implementa operações específicas para processamento de PDF.
    """
    
    def __init__(self, db: Session):
        super().__init__(db, BilledPerson)
    
    def get_by_document_id(self, document_id: str) -> Optional[BilledPerson]:
        """Busca pessoa faturada por CPF."""
        return self.db.query(BilledPerson).filter(
            and_(
                BilledPerson.document_id == document_id,
                BilledPerson.active == True
            )
        ).first()
    
    def search_by_name(self, search_term: str, skip: int = 0, limit: int = 20) -> List[BilledPerson]:
        """
        Busca pessoas faturadas por nome completo.
        Usa busca parcial case-insensitive.
        """
        return self.db.query(BilledPerson).filter(
            and_(
                BilledPerson.active == True,
                BilledPerson.full_name.ilike(f"%{search_term}%")
            )
        ).offset(skip).limit(limit).all()
    
    def get_by_filters(self, filters: Dict[str, Any]) -> List[BilledPerson]:
        """
        Busca pessoas faturadas com múltiplos filtros.
        Suporta filtros por full_name, document_id e active.
        """
        query = self.db.query(BilledPerson)
        
        # Filtros de busca
        if "full_name" in filters:
            query = query.filter(BilledPerson.full_name.ilike(f"%{filters['full_name']}%"))
        
        if "document_id" in filters:
            query = query.filter(BilledPerson.document_id == filters["document_id"])
        
        if "active" in filters:
            query = query.filter(BilledPerson.active == filters["active"])
        else:
            # Por padrão, apenas ativos
            query = query.filter(BilledPerson.active == True)
        
        return query.all()
    
    def get_or_create_by_document_id(self, document_id: str, full_name: str) -> BilledPerson:
        """
        Obtém pessoa faturada existente ou cria nova.
        Usado no processamento de PDF.
        """
        # Tentar encontrar existente
        existing = self.get_by_document_id(document_id)
        if existing:
            return existing
        
        # Criar nova
        create_data = {
            "document_id": document_id,
            "full_name": full_name,
            "active": True
        }
        return self.create(create_data)
    
    def get_active_billed_people_count(self) -> int:
        """Retorna quantidade de pessoas faturadas ativas."""
        return self.db.query(BilledPerson).filter(BilledPerson.active == True).count()

"""
Repositório para tipos de despesa.
Implementa operações CRUD para ExpenseType.
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from ..models.expense_type_models import ExpenseType


class ExpenseTypeRepository:
    """
    Repositório para a tabela ExpenseType.
    Implementa operações específicas para gerenciamento de tipos de despesa.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, expense_type_data: dict) -> ExpenseType:
        """Cria um novo tipo de despesa."""
        expense_type = ExpenseType(**expense_type_data)
        self.db.add(expense_type)
        self.db.commit()
        self.db.refresh(expense_type)
        return expense_type
    
    def get_by_id(self, expense_type_id: int) -> Optional[ExpenseType]:
        """Busca tipo de despesa por ID."""
        return self.db.query(ExpenseType).filter(ExpenseType.id == expense_type_id).first()
    
    def get_all(self, skip: int = 0, limit: int = 100, include_inactive: bool = False) -> List[ExpenseType]:
        """Lista todos os tipos de despesa com paginação."""
        query = self.db.query(ExpenseType)
        if not include_inactive:
            query = query.filter(ExpenseType.active == True)
        return query.offset(skip).limit(limit).all()
    
    def update(self, expense_type_id: int, expense_type_data: dict) -> Optional[ExpenseType]:
        """Atualiza um tipo de despesa."""
        expense_type = self.get_by_id(expense_type_id)
        if expense_type:
            for key, value in expense_type_data.items():
                setattr(expense_type, key, value)
            self.db.commit()
            self.db.refresh(expense_type)
        return expense_type
    
    def delete(self, expense_type_id: int) -> bool:
        """Remove um tipo de despesa (soft delete)."""
        expense_type = self.get_by_id(expense_type_id)
        if expense_type:
            expense_type.active = False
            self.db.commit()
            return True
        return False
    
    def reactivate(self, expense_type_id: int) -> bool:
        """Reativa um tipo de despesa."""
        expense_type = self.get_by_id(expense_type_id)
        if expense_type:
            expense_type.active = True
            self.db.commit()
            return True
        return False
    
    def find_by_description(self, description: str) -> Optional[ExpenseType]:
        """Busca tipo de despesa por descrição exata (case insensitive)."""
        return self.db.query(ExpenseType).filter(
            and_(
                func.upper(ExpenseType.description) == func.upper(description),
                ExpenseType.active == True
            )
        ).first()
    
    def find_by_description_ilike(self, description: str) -> List[ExpenseType]:
        """Busca tipos de despesa por descrição (case insensitive)."""
        return self.db.query(ExpenseType).filter(
            and_(
                ExpenseType.description.ilike(f"%{description}%"),
                ExpenseType.active == True
            )
        ).all()
    
    def find_by_category(self, category: str) -> List[ExpenseType]:
        """Busca tipos de despesa por categoria."""
        return self.db.query(ExpenseType).filter(
            and_(
                ExpenseType.category == category,
                ExpenseType.active == True
            )
        ).all()
    
    def search_by_term(self, search_term: str) -> List[ExpenseType]:
        """Busca tipos de despesa por termo (descrição ou categoria)."""
        return self.db.query(ExpenseType).filter(
            and_(
                or_(
                    ExpenseType.description.ilike(f"%{search_term}%"),
                    ExpenseType.category.ilike(f"%{search_term}%")
                ),
                ExpenseType.active == True
            )
        ).all()
    
    def count_active(self) -> int:
        """Conta o número de tipos de despesa ativos."""
        return self.db.query(func.count(ExpenseType.id)).filter(ExpenseType.active == True).scalar()
    
    def exists_by_description(self, description: str, exclude_id: Optional[int] = None) -> bool:
        """Verifica se já existe um tipo de despesa com a descrição."""
        query = self.db.query(ExpenseType).filter(ExpenseType.description == description)
        if exclude_id:
            query = query.filter(ExpenseType.id != exclude_id)
        return query.first() is not None
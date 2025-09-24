"""
Repository base implementando padrões comuns de acesso a dados.
Aplica princípios de alta coesão e baixo acoplamento.
"""

from abc import ABC, abstractmethod
from typing import Generic, TypeVar, List, Optional, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from ..models.base import BaseModel

ModelType = TypeVar("ModelType", bound=BaseModel)


class BaseRepository(Generic[ModelType], ABC):
    """
    Repository base com operações CRUD comuns.
    Implementa soft delete e operações de consulta otimizadas.
    """
    
    def __init__(self, db: Session, model: type[ModelType]):
        self.db = db
        self.model = model
    
    def create(self, obj_data: Dict[str, Any]) -> ModelType:
        """Cria um novo registro."""
        db_obj = self.model(**obj_data)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj
    
    def get_by_id(self, id: UUID, include_inactive: bool = False) -> Optional[ModelType]:
        """Busca registro por ID."""
        query = self.db.query(self.model).filter(self.model.id == id)
        
        if not include_inactive:
            query = query.filter(self.model.active == True)
            
        return query.first()
    
    def get_all(
        self, 
        skip: int = 0, 
        limit: int = 100, 
        include_inactive: bool = False,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[ModelType]:
        """Busca todos os registros com paginação e filtros."""
        query = self.db.query(self.model)
        
        if not include_inactive:
            query = query.filter(self.model.active == True)
        
        if filters:
            query = self._apply_filters(query, filters)
        
        return query.offset(skip).limit(limit).all()
    
    def count(
        self, 
        include_inactive: bool = False,
        filters: Optional[Dict[str, Any]] = None
    ) -> int:
        """Conta total de registros com filtros."""
        query = self.db.query(func.count(self.model.id))
        
        if not include_inactive:
            query = query.filter(self.model.active == True)
        
        if filters:
            query = self._apply_filters(query, filters)
        
        return query.scalar()
    
    def update(self, id: UUID, obj_data: Dict[str, Any]) -> Optional[ModelType]:
        """Atualiza um registro existente."""
        db_obj = self.get_by_id(id)
        if not db_obj:
            return None
        
        for field, value in obj_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
        
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj
    
    def soft_delete(self, id: UUID) -> bool:
        """Inativa um registro (soft delete)."""
        db_obj = self.get_by_id(id)
        if not db_obj:
            return False
        
        db_obj.soft_delete()
        self.db.commit()
        return True
    
    def reactivate(self, id: UUID) -> bool:
        """Reativa um registro inativo."""
        db_obj = self.get_by_id(id, include_inactive=True)
        if not db_obj:
            return False
        
        db_obj.reactivate()
        self.db.commit()
        return True
    
    def exists(self, **filters) -> bool:
        """Verifica se existe um registro com os filtros especificados."""
        query = self.db.query(self.model.id)
        
        for field, value in filters.items():
            if hasattr(self.model, field):
                query = query.filter(getattr(self.model, field) == value)
        
        return query.first() is not None
    
    def search(
        self, 
        search_term: str, 
        search_fields: List[str],
        skip: int = 0,
        limit: int = 100,
        include_inactive: bool = False
    ) -> List[ModelType]:
        """Busca textual em múltiplos campos."""
        query = self.db.query(self.model)
        
        if not include_inactive:
            query = query.filter(self.model.active == True)
        
        # Construir filtros de busca
        search_filters = []
        for field in search_fields:
            if hasattr(self.model, field):
                field_attr = getattr(self.model, field)
                search_filters.append(field_attr.ilike(f"%{search_term}%"))
        
        if search_filters:
            query = query.filter(or_(*search_filters))
        
        return query.offset(skip).limit(limit).all()
    
    @abstractmethod
    def _apply_filters(self, query, filters: Dict[str, Any]):
        """Aplica filtros específicos do modelo. Deve ser implementado por cada repository."""
        pass

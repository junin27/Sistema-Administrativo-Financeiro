"""
Repositório para Classificacao.
Implementa operações CRUD com soft delete e consultas específicas.
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from datetime import datetime

from ..models.classificacao_models import Classificacao


class ClassificacaoRepository:
    """
    Repositório para a tabela Classificacao.
    Implementa operações específicas com suporte a soft delete.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, classificacao_data: dict) -> Classificacao:
        """Cria uma nova classificação."""
        classificacao = Classificacao(**classificacao_data)
        self.db.add(classificacao)
        self.db.commit()
        self.db.refresh(classificacao)
        return classificacao
    
    def get_by_id(self, classificacao_id: int, include_deleted: bool = False) -> Optional[Classificacao]:
        """
        Busca classificação por ID.
        Por padrão, ignora registros inativados (soft delete).
        """
        query = self.db.query(Classificacao).filter(
            Classificacao.idClassificacao == classificacao_id
        )
        
        if not include_deleted:
            query = query.filter(Classificacao.deleted_at.is_(None))
        
        return query.first()
    
    def get_all(self, skip: int = 0, limit: int = 100, include_deleted: bool = False) -> List[Classificacao]:
        """
        Lista todas as classificações com paginação.
        Por padrão, ignora registros inativados.
        """
        query = self.db.query(Classificacao)
        
        if not include_deleted:
            query = query.filter(Classificacao.deleted_at.is_(None))
        
        return query.offset(skip).limit(limit).all()
    
    def update(self, classificacao_id: int, classificacao_data: dict) -> Optional[Classificacao]:
        """Atualiza uma classificação."""
        classificacao = self.get_by_id(classificacao_id)
        if classificacao:
            for key, value in classificacao_data.items():
                if value is not None:
                    setattr(classificacao, key, value)
            self.db.commit()
            self.db.refresh(classificacao)
        return classificacao
    
    def delete(self, classificacao_id: int) -> bool:
        """
        Remove uma classificação FISICAMENTE.
        ATENÇÃO: Viola regra de negócio - use inactivate() ao invés.
        """
        classificacao = self.get_by_id(classificacao_id, include_deleted=True)
        if classificacao:
            self.db.delete(classificacao)
            self.db.commit()
            return True
        return False
    
    def inactivate(self, classificacao_id: int) -> Optional[Classificacao]:
        """
        INATIVA uma classificação (soft delete).
        Define deleted_at com timestamp atual e status como 'inativo'.
        """
        classificacao = self.get_by_id(classificacao_id)
        if classificacao:
            setattr(classificacao, 'deleted_at', datetime.now())
            setattr(classificacao, 'status', "inativo")
            self.db.commit()
            self.db.refresh(classificacao)
        return classificacao
    
    def reactivate(self, classificacao_id: int) -> Optional[Classificacao]:
        """
        REATIVA uma classificação inativada.
        Remove deleted_at e define status como 'ativo'.
        """
        classificacao = self.get_by_id(classificacao_id, include_deleted=True)
        if classificacao and classificacao.deleted_at is not None:
            setattr(classificacao, 'deleted_at', None)
            setattr(classificacao, 'status', "ativo")
            self.db.commit()
            self.db.refresh(classificacao)
        return classificacao
    
    def find_by_tipo(self, tipo: str, include_deleted: bool = False) -> List[Classificacao]:
        """Busca classificações por tipo (RECEITA/DESPESA)."""
        query = self.db.query(Classificacao).filter(
            func.upper(Classificacao.tipo) == func.upper(tipo)
        )
        
        if not include_deleted:
            query = query.filter(Classificacao.deleted_at.is_(None))
        
        return query.all()
    
    def find_by_descricao(self, descricao: str, include_deleted: bool = False) -> Optional[Classificacao]:
        """Busca classificação por descrição exata (case insensitive)."""
        query = self.db.query(Classificacao).filter(
            func.upper(Classificacao.descricao) == func.upper(descricao)
        )
        
        if not include_deleted:
            query = query.filter(Classificacao.deleted_at.is_(None))
        
        return query.first()
    
    def find_by_descricao_partial(self, termo: str, include_deleted: bool = False) -> List[Classificacao]:
        """Busca classificações por termo parcial na descrição."""
        query = self.db.query(Classificacao).filter(
            Classificacao.descricao.ilike(f"%{termo}%")
        )
        
        if not include_deleted:
            query = query.filter(Classificacao.deleted_at.is_(None))
        
        return query.all()
    
    def find_active(self) -> List[Classificacao]:
        """Busca apenas classificações ativas (não inativadas)."""
        return self.db.query(Classificacao).filter(
            and_(
                Classificacao.deleted_at.is_(None),
                func.upper(Classificacao.status) == 'ATIVO'
            )
        ).all()
    
    def find_inactive(self) -> List[Classificacao]:
        """Busca classificações inativadas (soft deleted)."""
        return self.db.query(Classificacao).filter(
            Classificacao.deleted_at.is_not(None)
        ).all()
    
    def find_by_tipo_and_descricao(self, tipo: str, descricao: str, include_deleted: bool = False) -> Optional[Classificacao]:
        """Busca classificação por tipo e descrição."""
        query = self.db.query(Classificacao).filter(
            and_(
                func.upper(Classificacao.tipo) == func.upper(tipo),
                func.upper(Classificacao.descricao) == func.upper(descricao)
            )
        )
        
        if not include_deleted:
            query = query.filter(Classificacao.deleted_at.is_(None))
        
        return query.first()
    
    def count_by_tipo(self, tipo: str, include_deleted: bool = False) -> int:
        """Conta classificações por tipo."""
        query = self.db.query(Classificacao).filter(
            func.upper(Classificacao.tipo) == func.upper(tipo)
        )
        
        if not include_deleted:
            query = query.filter(Classificacao.deleted_at.is_(None))
        
        return query.count()

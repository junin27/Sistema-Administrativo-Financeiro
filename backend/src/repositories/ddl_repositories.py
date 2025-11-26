"""
Repositórios para os modelos DDL (Pessoas e MovimentoContas).
Implementa operações CRUD básicas seguindo o padrão do sistema.
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from datetime import datetime

from ..models.ddl_models import Pessoas, MovimentoContas


class PessoasRepository:
    """
    Repositório para a tabela Pessoas.
    Implementa operações específicas para gerenciamento de pessoas.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, pessoa_data: dict) -> Pessoas:
        """Cria uma nova pessoa."""
        pessoa = Pessoas(**pessoa_data)
        self.db.add(pessoa)
        self.db.commit()
        self.db.refresh(pessoa)
        return pessoa
    
    def get_by_id(self, pessoa_id: int, include_deleted: bool = False) -> Optional[Pessoas]:
        """
        Busca pessoa por ID.
        Por padrão, ignora registros inativados (soft delete).
        """
        query = self.db.query(Pessoas).filter(Pessoas.idPessoas == pessoa_id)
        
        if not include_deleted:
            query = query.filter(Pessoas.deleted_at.is_(None))
        
        return query.first()
    
    def get_all(self, skip: int = 0, limit: int = 100, include_deleted: bool = False) -> List[Pessoas]:
        """
        Lista todas as pessoas com paginação.
        Por padrão, ignora registros inativados.
        """
        query = self.db.query(Pessoas)
        
        if not include_deleted:
            query = query.filter(Pessoas.deleted_at.is_(None))
        
        return query.offset(skip).limit(limit).all()
    
    def update(self, pessoa_id: int, pessoa_data: dict) -> Optional[Pessoas]:
        """Atualiza uma pessoa."""
        pessoa = self.get_by_id(pessoa_id)
        if pessoa:
            for key, value in pessoa_data.items():
                setattr(pessoa, key, value)
            self.db.commit()
            self.db.refresh(pessoa)
        return pessoa
    
    def delete(self, pessoa_id: int) -> bool:
        """Remove uma pessoa."""
        pessoa = self.get_by_id(pessoa_id)
        if pessoa:
            self.db.delete(pessoa)
            self.db.commit()
            return True
        return False
    
    def find_by_documento(self, documento: str) -> Optional[Pessoas]:
        """Busca pessoa por documento."""
        return self.db.query(Pessoas).filter(Pessoas.documento == documento).first()

    def find_by_documento_paginated(self, documento: str, skip: int = 0, limit: int = 100) -> tuple[List[Pessoas], int]:
        """Busca pessoas por documento com paginação."""
        query = self.db.query(Pessoas).filter(Pessoas.documento == documento)
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total
    
    def find_by_tipo(self, tipo: str) -> List[Pessoas]:
        """Busca pessoas por tipo."""
        return self.db.query(Pessoas).filter(Pessoas.tipo == tipo).all()
    
    def find_by_razao_social(self, razao_social: str) -> Optional[Pessoas]:
        """Busca pessoa por razão social."""
        return self.db.query(Pessoas).filter(Pessoas.razaosocial == razao_social).first()
    
    def search_by_name(self, search_term: str) -> List[Pessoas]:
        """Busca pessoas por termo no nome (razão social ou fantasia)."""
        return self.db.query(Pessoas).filter(
            or_(
                Pessoas.razaosocial.ilike(f"%{search_term}%"),
                Pessoas.fantasia.ilike(f"%{search_term}%")
            )
        ).all()
    
    def find_active_by_status(self, status: str) -> List[Pessoas]:
        """Busca pessoas ativas por status."""
        return self.db.query(Pessoas).filter(Pessoas.status == status).all()
    
    def find_fornecedor_by_documento_and_name(self, documento: str, razao_social: str) -> Optional[Pessoas]:
        """Busca fornecedor por documento (CNPJ/CPF) e razão social."""
        return self.db.query(Pessoas).filter(
            and_(
                Pessoas.documento == documento,
                Pessoas.razaosocial == razao_social,
                Pessoas.tipo == "FORNECEDOR"
            )
        ).first()

    def count_all(self, include_deleted: bool = False) -> int:
        """Conta total de pessoas."""
        query = self.db.query(func.count(Pessoas.idPessoas))
        if not include_deleted:
            query = query.filter(Pessoas.deleted_at.is_(None))
        return query.scalar()

    def search_by_name_paginated(self, search_term: str, skip: int = 0, limit: int = 100) -> tuple[List[Pessoas], int]:
        """Busca pessoas por termo no nome com paginação."""
        query = self.db.query(Pessoas).filter(
            or_(
                Pessoas.razaosocial.ilike(f"%{search_term}%"),
                Pessoas.fantasia.ilike(f"%{search_term}%")
            )
        )
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total

    def find_by_tipo_paginated(self, tipo: str, skip: int = 0, limit: int = 100) -> tuple[List[Pessoas], int]:
        """Busca pessoas por tipo com paginação."""
        query = self.db.query(Pessoas).filter(Pessoas.tipo == tipo)
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total

    def find_active_by_status_paginated(self, status: str, skip: int = 0, limit: int = 100) -> tuple[List[Pessoas], int]:
        """Busca pessoas ativas por status com paginação."""
        query = self.db.query(Pessoas).filter(Pessoas.status == status)
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total
    
    def find_with_filters_paginated(
        self, 
        skip: int = 0, 
        limit: int = 100,
        tipo: Optional[str] = None,
        status: Optional[str] = None,
        documento: Optional[str] = None,
        search: Optional[str] = None,
        include_deleted: bool = False
    ) -> tuple[List[Pessoas], int]:
        """Busca pessoas com múltiplos filtros combinados."""
        query = self.db.query(Pessoas)
        
        # Aplicar filtro de soft delete
        if not include_deleted:
            query = query.filter(Pessoas.deleted_at.is_(None))
        
        # Aplicar filtros combinados
        if documento:
            query = query.filter(Pessoas.documento.ilike(f"%{documento}%"))
        
        if search:
            query = query.filter(
                or_(
                    Pessoas.razaosocial.ilike(f"%{search}%"),
                    Pessoas.fantasia.ilike(f"%{search}%")
                )
            )
        
        if tipo:
            query = query.filter(func.upper(Pessoas.tipo) == func.upper(tipo))
        
        if status:
            query = query.filter(func.upper(Pessoas.status) == func.upper(status))
        
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total
    
    def find_faturado_by_documento_and_name(self, documento: str, nome_completo: str) -> Optional[Pessoas]:
        """Busca pessoa faturada por documento (CPF) e nome completo."""
        return self.db.query(Pessoas).filter(
            and_(
                Pessoas.documento == documento,
                func.upper(Pessoas.razaosocial) == func.upper(nome_completo),
                func.upper(Pessoas.tipo) == 'FATURADO'
            )
        ).first()
    
    def find_by_documento_and_tipo(self, documento: str, tipo: str) -> Optional[Pessoas]:
        """Busca pessoa por documento e tipo."""
        return self.db.query(Pessoas).filter(
            and_(
                Pessoas.documento == documento,
                func.upper(Pessoas.tipo) == func.upper(tipo)
            )
        ).first()
    
    def find_by_razao_social_and_tipo(self, razao_social: str, tipo: str) -> Optional[Pessoas]:
        """Busca pessoa por razão social e tipo."""
        return self.db.query(Pessoas).filter(
            and_(
                func.upper(Pessoas.razaosocial) == func.upper(razao_social),
                func.upper(Pessoas.tipo) == func.upper(tipo)
            )
        ).first()
    
    def inactivate(self, pessoa_id: int) -> Optional[Pessoas]:
        """
        INATIVA uma pessoa (soft delete).
        Define deleted_at com timestamp atual.
        """
        pessoa = self.get_by_id(pessoa_id)
        if pessoa:
            setattr(pessoa, 'deleted_at', datetime.now())
            self.db.commit()
            self.db.refresh(pessoa)
        return pessoa
    
    def reactivate(self, pessoa_id: int) -> Optional[Pessoas]:
        """
        REATIVA uma pessoa inativada.
        Remove deleted_at.
        """
        pessoa = self.get_by_id(pessoa_id, include_deleted=True)
        if pessoa and pessoa.deleted_at is not None:
            setattr(pessoa, 'deleted_at', None)
            self.db.commit()
            self.db.refresh(pessoa)
        return pessoa
    
    def find_inactive(self) -> List[Pessoas]:
        """Busca apenas pessoas inativadas (soft deleted)."""
        return self.db.query(Pessoas).filter(
            Pessoas.deleted_at.is_not(None)
        ).all()


class MovimentoContasRepository:
    """
    Repositório para a tabela MovimentoContas.
    Implementa operações específicas para gerenciamento de movimentos.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, movimento_data: dict) -> MovimentoContas:
        """Cria um novo movimento."""
        movimento = MovimentoContas(**movimento_data)
        self.db.add(movimento)
        self.db.commit()
        self.db.refresh(movimento)
        return movimento
    
    def get_by_id(self, movimento_id: int, include_deleted: bool = False) -> Optional[MovimentoContas]:
        """
        Busca movimento por ID.
        Por padrão, ignora registros inativados (soft delete).
        """
        query = self.db.query(MovimentoContas).filter(
            MovimentoContas.idMovimentoContas == movimento_id
        )
        
        if not include_deleted:
            query = query.filter(MovimentoContas.deleted_at.is_(None))
        
        return query.first()
    
    def get_all(self, skip: int = 0, limit: int = 100, include_deleted: bool = False) -> List[MovimentoContas]:
        """
        Lista todos os movimentos com paginação.
        Por padrão, ignora registros inativados.
        """
        query = self.db.query(MovimentoContas)
        
        if not include_deleted:
            query = query.filter(MovimentoContas.deleted_at.is_(None))
        
        return query.offset(skip).limit(limit).all()
    
    def update(self, movimento_id: int, movimento_data: dict) -> Optional[MovimentoContas]:
        """Atualiza um movimento."""
        movimento = self.get_by_id(movimento_id)
        if movimento:
            for key, value in movimento_data.items():
                setattr(movimento, key, value)
            self.db.commit()
            self.db.refresh(movimento)
        return movimento
    
    def delete(self, movimento_id: int) -> bool:
        """Remove um movimento."""
        movimento = self.get_by_id(movimento_id)
        if movimento:
            self.db.delete(movimento)
            self.db.commit()
            return True
        return False
    
    def find_by_nota_fiscal(self, numero_nota: str) -> Optional[MovimentoContas]:
        """Busca movimento por número da nota fiscal (case insensitive)."""
        return self.db.query(MovimentoContas).filter(
            func.upper(MovimentoContas.numeronotafiscal) == func.upper(numero_nota)
        ).first()
    
    def find_by_fornecedor(self, fornecedor_id: int) -> List[MovimentoContas]:
        """Busca movimentos por fornecedor/cliente."""
        return self.db.query(MovimentoContas).filter(
            MovimentoContas.Pessoas_idFornecedorCliente == fornecedor_id
        ).all()
    
    def find_by_faturado(self, faturado_id: int) -> List[MovimentoContas]:
        """Busca movimentos por pessoa faturada."""
        return self.db.query(MovimentoContas).filter(
            MovimentoContas.Pessoas_idfaturado == faturado_id
        ).all()
    
    def find_by_tipo(self, tipo: str) -> List[MovimentoContas]:
        """Busca movimentos por tipo."""
        return self.db.query(MovimentoContas).filter(MovimentoContas.tipo == tipo).all()
    
    def find_by_status(self, status: str) -> List[MovimentoContas]:
        """Busca movimentos por status."""
        return self.db.query(MovimentoContas).filter(MovimentoContas.status == status).all()

    def count_all(self, include_deleted: bool = False) -> int:
        """Conta total de movimentos."""
        query = self.db.query(func.count(MovimentoContas.idMovimentoContas))
        if not include_deleted:
            query = query.filter(MovimentoContas.deleted_at.is_(None))
        return query.scalar()

    def find_by_tipo_paginated(self, tipo: str, skip: int = 0, limit: int = 100) -> tuple[List[MovimentoContas], int]:
        """Busca movimentos por tipo com paginação."""
        query = self.db.query(MovimentoContas).filter(MovimentoContas.tipo == tipo)
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total

    def find_by_status_paginated(self, status: str, skip: int = 0, limit: int = 100) -> tuple[List[MovimentoContas], int]:
        """Busca movimentos por status com paginação."""
        query = self.db.query(MovimentoContas).filter(MovimentoContas.status == status)
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total

    def find_by_fornecedor_paginated(self, fornecedor_id: int, skip: int = 0, limit: int = 100) -> tuple[List[MovimentoContas], int]:
        """Busca movimentos por fornecedor com paginação."""
        query = self.db.query(MovimentoContas).filter(
            MovimentoContas.Pessoas_idFornecedorCliente == fornecedor_id
        )
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total
    
    def find_by_nota_fiscal_paginated(self, numero_nota: str, skip: int = 0, limit: int = 100, include_deleted: bool = False) -> tuple[List[MovimentoContas], int]:
        """Busca movimentos por número da nota fiscal com paginação (case insensitive, partial match)."""
        query = self.db.query(MovimentoContas).filter(
            func.upper(MovimentoContas.numeronotafiscal).ilike(f"%{func.upper(numero_nota)}%")
        )
        
        if not include_deleted:
            query = query.filter(MovimentoContas.deleted_at.is_(None))
        
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total
    
    def find_with_filters_paginated(
        self,
        skip: int = 0,
        limit: int = 100,
        tipo: Optional[str] = None,
        status: Optional[str] = None,
        fornecedor_id: Optional[int] = None,
        numeronotafiscal: Optional[str] = None,
        include_deleted: bool = False
    ) -> tuple[List[MovimentoContas], int]:
        """Busca movimentos com múltiplos filtros combinados."""
        query = self.db.query(MovimentoContas)
        
        # Aplicar filtro de soft delete
        if not include_deleted:
            query = query.filter(MovimentoContas.deleted_at.is_(None))
        
        # Aplicar filtros combinados
        if numeronotafiscal:
            query = query.filter(
                func.upper(MovimentoContas.numeronotafiscal).ilike(f"%{func.upper(numeronotafiscal)}%")
            )
        
        if tipo:
            query = query.filter(func.upper(MovimentoContas.tipo) == func.upper(tipo))
        
        if status:
            query = query.filter(func.upper(MovimentoContas.status) == func.upper(status))
        
        if fornecedor_id:
            query = query.filter(MovimentoContas.Pessoas_idFornecedorCliente == fornecedor_id)
        
        total = query.count()
        items = query.offset(skip).limit(limit).all()
        return items, total

    def find_inactive(self) -> List[MovimentoContas]:
        """Busca apenas movimentos inativados (soft deleted)."""
        return self.db.query(MovimentoContas).filter(
            MovimentoContas.deleted_at.is_not(None)
        ).all()

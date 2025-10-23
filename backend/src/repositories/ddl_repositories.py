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
    
    def get_by_id(self, pessoa_id: int) -> Optional[Pessoas]:
        """Busca pessoa por ID."""
        return self.db.query(Pessoas).filter(Pessoas.idPessoas == pessoa_id).first()
    
    def get_all(self, skip: int = 0, limit: int = 100) -> List[Pessoas]:
        """Lista todas as pessoas com paginação."""
        return self.db.query(Pessoas).offset(skip).limit(limit).all()
    
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
                func.upper(Pessoas.razaosocial) == func.upper(razao_social),
                func.upper(Pessoas.tipo) == 'FORNECEDOR'
            )
        ).first()
    
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
    
    def get_by_id(self, movimento_id: int) -> Optional[MovimentoContas]:
        """Busca movimento por ID."""
        return self.db.query(MovimentoContas).filter(
            MovimentoContas.idMovimentoContas == movimento_id
        ).first()
    
    def get_all(self, skip: int = 0, limit: int = 100) -> List[MovimentoContas]:
        """Lista todos os movimentos com paginação."""
        return self.db.query(MovimentoContas).offset(skip).limit(limit).all()
    
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
    
    def find_by_date_range(self, start_date: datetime, end_date: datetime) -> List[MovimentoContas]:
        """Busca movimentos por período de emissão."""
        return self.db.query(MovimentoContas).filter(
            and_(
                MovimentoContas.dataemissao >= start_date,
                MovimentoContas.dataemissao <= end_date
            )
        ).all()
    
    def get_total_by_tipo(self, tipo: str) -> float:
        """Calcula o total de valores por tipo."""
        result = self.db.query(
            func.sum(MovimentoContas.valortotal)
        ).filter(MovimentoContas.tipo == tipo).scalar()
        # Converter Decimal para float para evitar erro de serialização JSON
        if result is not None:
            return float(result)
        return 0.0
    
    def get_movimentos_with_pessoas(self, skip: int = 0, limit: int = 100) -> List[MovimentoContas]:
        """Lista movimentos com dados das pessoas relacionadas."""
        return self.db.query(MovimentoContas).join(
            Pessoas, MovimentoContas.Pessoas_idFornecedorCliente == Pessoas.idPessoas
        ).offset(skip).limit(limit).all()
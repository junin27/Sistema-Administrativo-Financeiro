"""
Repositório para ParcelasContas.
Implementa operações CRUD e consultas específicas para parcelas.
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from datetime import datetime, date

from ..models.parcelas_models import ParcelasContas


class ParcelasContasRepository:
    """
    Repositório para a tabela ParcelasContas.
    Implementa operações específicas para gerenciamento de parcelas.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def create(self, parcela_data: dict) -> ParcelasContas:
        """Cria uma nova parcela."""
        parcela = ParcelasContas(**parcela_data)
        self.db.add(parcela)
        self.db.commit()
        self.db.refresh(parcela)
        return parcela
    
    def create_many(self, parcelas_data: List[dict]) -> List[ParcelasContas]:
        """Cria múltiplas parcelas de uma vez."""
        parcelas = [ParcelasContas(**data) for data in parcelas_data]
        self.db.add_all(parcelas)
        self.db.commit()
        for parcela in parcelas:
            self.db.refresh(parcela)
        return parcelas
    
    def get_by_id(self, parcela_id: int) -> Optional[ParcelasContas]:
        """Busca parcela por ID."""
        return self.db.query(ParcelasContas).filter(
            ParcelasContas.idParcelasContas == parcela_id
        ).first()
    
    def get_all(self, skip: int = 0, limit: int = 100) -> List[ParcelasContas]:
        """Lista todas as parcelas com paginação."""
        return self.db.query(ParcelasContas).offset(skip).limit(limit).all()
    
    def update(self, parcela_id: int, parcela_data: dict) -> Optional[ParcelasContas]:
        """Atualiza uma parcela."""
        parcela = self.get_by_id(parcela_id)
        if parcela:
            for key, value in parcela_data.items():
                if value is not None:  # Apenas atualizar valores não-nulos
                    setattr(parcela, key, value)
            self.db.commit()
            self.db.refresh(parcela)
        return parcela
    
    def delete(self, parcela_id: int) -> bool:
        """Remove uma parcela."""
        parcela = self.get_by_id(parcela_id)
        if parcela:
            self.db.delete(parcela)
            self.db.commit()
            return True
        return False
    
    def find_by_identificacao(self, identificacao: str) -> Optional[ParcelasContas]:
        """Busca parcela por identificação única."""
        return self.db.query(ParcelasContas).filter(
            func.upper(ParcelasContas.identificacao) == func.upper(identificacao)
        ).first()
    
    def find_by_movimento(self, movimento_id: int) -> List[ParcelasContas]:
        """Busca todas as parcelas de um movimento."""
        return self.db.query(ParcelasContas).filter(
            ParcelasContas.MovimentoContas_idMovimentoContas == movimento_id
        ).order_by(ParcelasContas.datavencimento).all()
    
    def find_by_status(self, status: str) -> List[ParcelasContas]:
        """Busca parcelas por status."""
        return self.db.query(ParcelasContas).filter(
            func.upper(ParcelasContas.statusparcela) == func.upper(status)
        ).all()
    
    def find_vencidas(self, data_referencia: Optional[date] = None) -> List[ParcelasContas]:
        """Busca parcelas vencidas até uma data (padrão: hoje)."""
        if data_referencia is None:
            data_referencia = date.today()
        
        return self.db.query(ParcelasContas).filter(
            and_(
                ParcelasContas.datavencimento < data_referencia,
                or_(
                    ParcelasContas.statusparcela.is_(None),
                    func.upper(ParcelasContas.statusparcela) != 'PAGA'
                )
            )
        ).order_by(ParcelasContas.datavencimento).all()
    
    def find_a_vencer(self, dias: int = 7) -> List[ParcelasContas]:
        """Busca parcelas que vencem nos próximos N dias."""
        data_hoje = date.today()
        from datetime import timedelta
        data_limite = data_hoje + timedelta(days=dias)
        
        return self.db.query(ParcelasContas).filter(
            and_(
                ParcelasContas.datavencimento >= data_hoje,
                ParcelasContas.datavencimento <= data_limite,
                or_(
                    ParcelasContas.statusparcela.is_(None),
                    func.upper(ParcelasContas.statusparcela) != 'PAGA'
                )
            )
        ).order_by(ParcelasContas.datavencimento).all()
    
    def update_status(self, parcela_id: int, novo_status: str) -> Optional[ParcelasContas]:
        """Atualiza apenas o status de uma parcela."""
        return self.update(parcela_id, {"statusparcela": novo_status})
    
    def get_total_valor_movimento(self, movimento_id: int) -> float:
        """Calcula o total das parcelas de um movimento."""
        result = self.db.query(
            func.sum(ParcelasContas.valorparcela)
        ).filter(
            ParcelasContas.MovimentoContas_idMovimentoContas == movimento_id
        ).scalar()
        
        return float(result) if result is not None else 0.0
    
    def count_by_movimento(self, movimento_id: int) -> int:
        """Conta quantas parcelas um movimento possui."""
        return self.db.query(ParcelasContas).filter(
            ParcelasContas.MovimentoContas_idMovimentoContas == movimento_id
        ).count()

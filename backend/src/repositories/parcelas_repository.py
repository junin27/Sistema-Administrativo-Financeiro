"""
Repositório para ParcelasContas.
Implementa operações CRUD e consultas específicas para parcelas.
"""

from typing import List, Optional
from decimal import Decimal
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
        # Garantir consistência de valores
        valorparcela = parcela_data.get("valorparcela") or 0
        valorpago = parcela_data.get("valorpago") or 0
        parcela_data["valorsaldo"] = max((valorparcela or 0) - (valorpago or 0), 0)

        parcela = ParcelasContas(**parcela_data)
        self.db.add(parcela)
        self.db.commit()
        self.db.refresh(parcela)
        return parcela
    
    def create_many(self, parcelas_data: List[dict]) -> List[ParcelasContas]:
        """Cria múltiplas parcelas de uma vez."""
        parcelas = []
        for data in parcelas_data:
            # Garantir consistência de valores
            valorparcela = data.get("valorparcela") or 0
            valorpago = data.get("valorpago") or 0
            data["valorsaldo"] = max((valorparcela or 0) - (valorpago or 0), 0)

            parcelas.append(ParcelasContas(**data))
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
    
    def get_all(self, skip: int = 0, limit: int = 100, order_by: Optional[str] = None, order_dir: Optional[str] = None) -> List[ParcelasContas]:
        """Lista todas as parcelas com paginação e ordenação."""
        query = self.db.query(ParcelasContas)
        
        # Aplicar ordenação
        if order_by:
            order_field = getattr(ParcelasContas, order_by, None)
            if order_field is not None:
                if order_dir and order_dir.lower() == 'desc':
                    query = query.order_by(order_field.desc())
                else:
                    query = query.order_by(order_field.asc())
        else:
            # Ordem padrão: por ID (ordem de armazenamento)
            query = query.order_by(ParcelasContas.idParcelasContas.asc())
        
        return query.offset(skip).limit(limit).all()
    
    def update(self, parcela_id: int, parcela_data: dict) -> Optional[ParcelasContas]:
        """Atualiza uma parcela."""
        parcela = self.get_by_id(parcela_id)
        if parcela:
            for key, value in parcela_data.items():
                if value is not None:  # Apenas atualizar valores não-nulos
                    setattr(parcela, key, value)
            # Recalcular saldo se valores forem alterados
            valorparcela = Decimal(str(parcela.valorparcela or 0))
            valorpago = Decimal(str(parcela.valorpago or 0))
            saldo_calculado = max(valorparcela - valorpago, Decimal('0'))
            setattr(parcela, 'valorsaldo', saldo_calculado)
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
    
    def find_by_movimento(self, movimento_id: int, order_by: Optional[str] = None, order_dir: Optional[str] = None) -> List[ParcelasContas]:
        """Busca todas as parcelas de um movimento com ordenação."""
        query = self.db.query(ParcelasContas).filter(
            ParcelasContas.MovimentoContas_idMovimentoContas == movimento_id
        )
        
        # Aplicar ordenação
        if order_by:
            order_field = getattr(ParcelasContas, order_by, None)
            if order_field is not None:
                if order_dir and order_dir.lower() == 'desc':
                    query = query.order_by(order_field.desc())
                else:
                    query = query.order_by(order_field.asc())
        else:
            # Ordem padrão: por data de vencimento
            query = query.order_by(ParcelasContas.datavencimento.asc())
        
        return query.all()
    
    def find_by_status(self, status: str, order_by: Optional[str] = None, order_dir: Optional[str] = None) -> List[ParcelasContas]:
        """Busca parcelas por status com ordenação."""
        query = self.db.query(ParcelasContas).filter(
            func.upper(ParcelasContas.statusparcela) == func.upper(status)
        )
        
        # Aplicar ordenação
        if order_by:
            order_field = getattr(ParcelasContas, order_by, None)
            if order_field is not None:
                if order_dir and order_dir.lower() == 'desc':
                    query = query.order_by(order_field.desc())
                else:
                    query = query.order_by(order_field.asc())
        else:
            # Ordem padrão: por ID (ordem de armazenamento)
            query = query.order_by(ParcelasContas.idParcelasContas.asc())
        
        return query.all()
    
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
    
    def update_status(self, parcela_id: int, novo_status: str, datapagamento: Optional[date] = None) -> Optional[ParcelasContas]:
        """Atualiza status e ajusta dados correlatos (pagamento/saldo)."""
        parcela = self.get_by_id(parcela_id)
        if not parcela:
            return None
        setattr(parcela, 'statusparcela', novo_status)
        # Se marcar como PAGA, ajustar valores
        if novo_status and novo_status.upper() == 'PAGA':
            valor_parcela = Decimal(str(parcela.valorparcela or 0))
            setattr(parcela, 'valorpago', valor_parcela)
            setattr(parcela, 'valorsaldo', Decimal('0'))
            setattr(parcela, 'datapagamento', datapagamento or date.today())
        elif novo_status and novo_status.upper() != 'PAGA':
            # Se não estiver paga, não definir data de pagamento automaticamente
            if datapagamento is not None:
                setattr(parcela, 'datapagamento', datapagamento)
        self.db.commit()
        self.db.refresh(parcela)
        return parcela
    
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

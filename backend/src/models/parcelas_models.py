"""
Modelo para tabela ParcelasContas seguindo exatamente o DDL fornecido.
Armazena informações das parcelas de movimentações financeiras.
"""

from sqlalchemy import Column, Integer, String, Date, Numeric, ForeignKey, Index
from sqlalchemy.orm import relationship

from ..config.database import Base


class ParcelasContas(Base):
    """
    Modelo para a tabela ParcelasContas seguindo o DDL fornecido.
    Armazena as parcelas de contas a pagar ou receber.
    """
    __tablename__ = "parcelas_contas"
    
    idParcelasContas = Column(Integer, primary_key=True, autoincrement=True)
    identificacao = Column(String(45), nullable=False, unique=True, 
                          comment="Identificação única da parcela")
    valorparcela = Column(Numeric(10, 2), nullable=True, 
                         comment="Valor da parcela")
    datavencimento = Column(Date, nullable=True, 
                           comment="Data de vencimento da parcela")
    statusparcela = Column(String(45), nullable=True, 
                          comment="Status da parcela (pendente, paga, vencida, etc)")
    
    # Chave estrangeira
    MovimentoContas_idMovimentoContas = Column(
        Integer, 
        ForeignKey('movimento_contas.idMovimentoContas'), 
        nullable=False,
        comment="FK para MovimentoContas"
    )
    
    # Relacionamento
    movimento = relationship(
        "MovimentoContas",
        back_populates="parcelas"
    )
    
    # Índice para performance (seguindo o DDL)
    __table_args__ = (
        Index('fk_ParcelasContas_MovimentoContas1_idx', 'MovimentoContas_idMovimentoContas'),
        Index('idx_identificacao_unique', 'identificacao', unique=True),
    )
    
    def __repr__(self) -> str:
        return f"<ParcelasContas(idParcelasContas={self.idParcelasContas}, identificacao='{self.identificacao}', valor={self.valorparcela})>"

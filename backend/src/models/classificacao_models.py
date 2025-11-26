"""
Modelo para tabela Classificacao seguindo exatamente o DDL fornecido.
Armazena tipos de receitas e despesas para classificação de movimentos.
"""

from sqlalchemy import Column, Integer, String, Index, Table, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..config.database import Base


# Tabela associativa para relacionamento many-to-many
movimento_contas_has_classificacao = Table(
    'movimento_contas_has_classificacao',
    Base.metadata,
    Column('MovimentoContas_idMovimentoContas', Integer, 
           ForeignKey('movimento_contas.idMovimentoContas'), 
           primary_key=True),
    Column('Classificacao_idClassificacao', Integer, 
           ForeignKey('classificacao.idClassificacao'), 
           primary_key=True),
    Index('fk_MovimentoContas_has_Classificacao_Classificacao1_idx', 
          'Classificacao_idClassificacao'),
    Index('fk_MovimentoContas_has_Classificacao_MovimentoContas1_idx', 
          'MovimentoContas_idMovimentoContas')
)


class Classificacao(Base):
    """
    Modelo para a tabela Classificacao seguindo o DDL fornecido.
    Armazena tipos de receitas e despesas para classificação.
    
    Regra de Negócio: Soft Delete - Registros nunca são excluídos fisicamente.
    """
    __tablename__ = "classificacao"
    
    idClassificacao = Column(Integer, primary_key=True, autoincrement=True)
    tipo = Column(String(45), nullable=True, 
                 comment="Tipo da classificação: RECEITA ou DESPESA")
    descricao = Column(String(150), nullable=True, 
                      comment="Descrição da classificação")
    status = Column(String(45), nullable=True, 
                   comment="Status da classificação (ativo/inativo)")
    
    # Soft Delete
    deleted_at = Column(DateTime(timezone=True), nullable=True, 
                       comment="Data de inativação (soft delete)")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relacionamento many-to-many com MovimentoContas
    movimentos = relationship(
        "MovimentoContas",
        secondary=movimento_contas_has_classificacao,
        back_populates="classificacoes"
    )
    
    def __repr__(self) -> str:
        return f"<Classificacao(idClassificacao={self.idClassificacao}, tipo='{self.tipo}', descricao='{self.descricao}')>"

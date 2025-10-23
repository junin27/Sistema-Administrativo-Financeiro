"""
Modelos implementados seguindo exatamente o DDL fornecido.
Mantém compatibilidade com a estrutura original especificada.
"""

from sqlalchemy import Column, Integer, String, Date, Numeric, ForeignKey, Index
from sqlalchemy.orm import relationship

from ..config.database import Base


class Pessoas(Base):
    """
    Modelo para a tabela Pessoas seguindo o DDL fornecido.
    Armazena informações de clientes, fornecedores ou outras entidades.
    """
    __tablename__ = "pessoas"
    
    idPessoas = Column(Integer, primary_key=True, autoincrement=True)
    tipo = Column(String(45), nullable=True)
    razaosocial = Column(String(150), nullable=True)
    fantasia = Column(String(150), nullable=True)
    documento = Column(String(45), nullable=True)
    status = Column(String(45), nullable=True)
    
    # Relacionamentos com MovimentoContas
    movimento_contas_fornecedor = relationship(
        "MovimentoContas",
        foreign_keys="MovimentoContas.Pessoas_idFornecedorCliente",
        back_populates="fornecedor_cliente"
    )
    
    movimento_contas_faturado = relationship(
        "MovimentoContas",
        foreign_keys="MovimentoContas.Pessoas_idfaturado",
        back_populates="faturado"
    )
    
    def __repr__(self) -> str:
        return f"<Pessoas(idPessoas={self.idPessoas}, razaosocial='{self.razaosocial}', tipo='{self.tipo}')>"


class MovimentoContas(Base):
    """
    Modelo para a tabela MovimentoContas seguindo o DDL fornecido.
    Registra transações (contas a pagar ou receber).
    """
    __tablename__ = "movimento_contas"
    
    idMovimentoContas = Column(Integer, primary_key=True, autoincrement=True)
    tipo = Column(String(45), nullable=True)
    numeronotafiscal = Column(String(45), nullable=True)
    dataemissao = Column(Date, nullable=True)
    descricao = Column(String(300), nullable=True)
    status = Column(String(45), nullable=True)
    valortotal = Column(Numeric(10, 2), nullable=True)
    
    # Chaves estrangeiras
    Pessoas_idFornecedorCliente = Column(Integer, ForeignKey('pessoas.idPessoas'), nullable=False)
    Pessoas_idfaturado = Column(Integer, ForeignKey('pessoas.idPessoas'), nullable=False)
    
    # Relacionamentos
    fornecedor_cliente = relationship(
        "Pessoas",
        foreign_keys=[Pessoas_idFornecedorCliente],
        back_populates="movimento_contas_fornecedor"
    )
    
    faturado = relationship(
        "Pessoas",
        foreign_keys=[Pessoas_idfaturado],
        back_populates="movimento_contas_faturado"
    )
    
    # Índices para performance (seguindo o DDL)
    __table_args__ = (
        Index('fk_MovimentoContas_Pessoas1_idx', 'Pessoas_idFornecedorCliente'),
        Index('fk_MovimentoContas_Pessoas2_idx', 'Pessoas_idfaturado'),
    )
    
    def __repr__(self) -> str:
        return f"<MovimentoContas(idMovimentoContas={self.idMovimentoContas}, numeronotafiscal='{self.numeronotafiscal}', valortotal={self.valortotal})>"
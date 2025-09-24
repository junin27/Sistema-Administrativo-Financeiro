"""
Configuração da conexão com PostgreSQL usando SQLAlchemy.
Implementa o padrão Repository com pool de conexões otimizado.
"""

from sqlalchemy import create_engine, MetaData, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from sqlalchemy.exc import OperationalError
from typing import Generator
import logging

from .settings import settings

logger = logging.getLogger(__name__)


# Configuração do engine com pool de conexões otimizado
# Detecta se é SQLite e ajusta configurações
if settings.database_url.startswith("sqlite"):
    engine = create_engine(
        settings.database_url,
        echo=settings.debug,  # Log SQL queries apenas em debug
        connect_args={"check_same_thread": False}  # Necessário para SQLite
    )
else:
    engine = create_engine(
        settings.database_url,
        poolclass=QueuePool,
        pool_size=20,
        max_overflow=30,
        pool_recycle=3600,  # Recicla conexões a cada hora
        pool_pre_ping=True,  # Verifica conexões antes de usar
        echo=settings.debug,  # Log SQL queries apenas em debug
    )

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para modelos SQLAlchemy
Base = declarative_base()

# Metadata para migrations
metadata = MetaData()


def get_db() -> Generator:
    """
    Dependency injection para sessão do banco de dados.
    Garante que a sessão seja sempre fechada após o uso.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_database_if_not_exists():
    """
    Cria o banco de dados automaticamente se não existir.
    Conecta no banco 'postgres' padrão para criar o banco da aplicação.
    """
    # Extrair informações da URL do banco
    db_url = settings.database_url
    
    if not db_url.startswith("postgresql"):
        logger.info("Não é PostgreSQL, pulando criação automática do banco")
        return
    
    # Extrair nome do banco da URL
    db_name = db_url.split('/')[-1]
    
    # URL para conectar no banco postgres padrão
    postgres_url = db_url.replace(f'/{db_name}', '/postgres')
    
    try:
        # Conectar no banco postgres padrão
        temp_engine = create_engine(postgres_url, isolation_level='AUTOCOMMIT')
        
        with temp_engine.connect() as conn:
            # Verificar se o banco já existe
            result = conn.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :db_name"),
                {"db_name": db_name}
            )
            
            if not result.fetchone():
                logger.info(f"Criando banco de dados: {db_name}")
                conn.execute(text(f'CREATE DATABASE "{db_name}"'))
                logger.info(f"Banco de dados {db_name} criado com sucesso!")
            else:
                logger.info(f"Banco de dados {db_name} já existe")
        
        temp_engine.dispose()
        
    except Exception as e:
        logger.error(f"Erro ao criar banco de dados: {e}")
        raise


def init_db() -> None:
    """
    Inicializa o banco de dados criando todas as tabelas.
    Usado principalmente para desenvolvimento e testes.
    """
    # Primeiro, criar o banco se não existir
    create_database_if_not_exists()
    
    # Importar todos os modelos para que sejam registrados no metadata
    from ..models import (
        BaseModel, Supplier, Customer, BilledPerson,
        RevenueType, ExpenseType, PayableAccount, ReceivableAccount,
        PayableInstallment, ReceivableInstallment
    )
    
    logger.info("Criando tabelas no banco de dados...")
    # Depois criar as tabelas
    Base.metadata.create_all(bind=engine)
    logger.info("Tabelas criadas com sucesso!")

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
    
    ⚠️ IMPORTANTE: PostgreSQL precisa estar rodando!
    """
    # Extrair informações da URL do banco
    db_url = settings.database_url
    
    if not db_url.startswith("postgresql"):
        logger.info("ℹ️ Não é PostgreSQL, pulando criação automática do banco")
        return
    
    # Extrair nome do banco da URL
    db_name = db_url.split('/')[-1].split('?')[0]  # Remove query params se houver
    
    # URL para conectar no banco postgres padrão
    postgres_url = db_url.rsplit('/', 1)[0] + '/postgres'
    
    try:
        logger.info("🔍 Verificando se o banco de dados existe...")
        
        # Conectar no banco postgres padrão
        temp_engine = create_engine(postgres_url, isolation_level='AUTOCOMMIT')
        
        with temp_engine.connect() as conn:
            # Verificar se o banco já existe
            result = conn.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :db_name"),
                {"db_name": db_name}
            )
            
            if not result.fetchone():
                logger.info(f"📦 Criando banco de dados: {db_name}")
                conn.execute(text(f'CREATE DATABASE "{db_name}"'))
                logger.info(f"✅ Banco de dados '{db_name}' criado com sucesso!")
            else:
                logger.info(f"ℹ️ Banco de dados '{db_name}' já existe")
        
        temp_engine.dispose()
        
    except Exception as e:
        logger.error(f"❌ Erro ao criar banco de dados: {e}")
        logger.error(f"💡 Verifique se o PostgreSQL está rodando e as credenciais estão corretas")
        raise


def init_db() -> None:
    """
    Inicializa o banco de dados criando todas as tabelas via ORM.
    Usado principalmente para desenvolvimento e testes.
    """
    # Primeiro, criar o banco se não existir (apenas PostgreSQL)
    create_database_if_not_exists()
    
    # Importar TODOS os modelos para criação das tabelas
    from ..models.ddl_models import Pessoas, MovimentoContas
    from ..models.parcelas_models import ParcelasContas
    from ..models.classificacao_models import Classificacao
    
    logger.info("🔧 Criando todas as tabelas no banco de dados via ORM...")
    
    # Criar todas as tabelas usando Base.metadata
    Base.metadata.create_all(bind=engine)

    # Executar migrações básicas para garantir consistência do schema em instalações existentes
    try:
        run_basic_migrations()
        logger.info("✅ Migrações básicas aplicadas com sucesso!")
    except Exception as e:
        logger.warning(f"⚠️ Falha ao aplicar migrações básicas automaticamente: {e}")
    
    logger.info("✅ Tabelas criadas com sucesso!")
    logger.info(f"📊 Tabelas disponíveis: {list(Base.metadata.tables.keys())}")


def run_basic_migrations() -> None:
    """Aplica migrações básicas diretamente via SQL para garantir colunas/índices críticos.
    Usado quando Alembic não está configurado ou em ambientes onde create_all não altera schema.
    """
    db_url = settings.database_url
    if not db_url.startswith("postgresql"):
        # Em SQLite, create_all já cobre; skip alterações diretas
        return

    with engine.begin() as conn:
        # Garantir colunas essenciais em parcelas_contas
        # numero_parcela
        col_exists = conn.execute(text(
            """
            SELECT 1 FROM information_schema.columns
            WHERE table_name='parcelas_contas' AND column_name='numero_parcela'
            """
        )).fetchone()
        if not col_exists:
            conn.execute(text("ALTER TABLE parcelas_contas ADD COLUMN numero_parcela INTEGER"))
            logger.info("➕ Coluna 'numero_parcela' adicionada em parcelas_contas")

        # valorsaldo
        col_exists = conn.execute(text(
            """
            SELECT 1 FROM information_schema.columns
            WHERE table_name='parcelas_contas' AND column_name='valorsaldo'
            """
        )).fetchone()
        if not col_exists:
            conn.execute(text("ALTER TABLE parcelas_contas ADD COLUMN valorsaldo NUMERIC(15,2) DEFAULT 0"))
            logger.info("➕ Coluna 'valorsaldo' adicionada em parcelas_contas")

        # Índice único para identificacao (caso não exista)
        idx_exists = conn.execute(text(
            """
            SELECT 1 FROM pg_indexes WHERE tablename='parcelas_contas' AND indexname='idx_identificacao_unique'
            """
        )).fetchone()
        if not idx_exists:
            conn.execute(text("CREATE UNIQUE INDEX idx_identificacao_unique ON parcelas_contas (identificacao)"))
            logger.info("🔒 Índice único 'idx_identificacao_unique' criado em identificacao")

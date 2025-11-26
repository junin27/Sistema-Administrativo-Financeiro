"""
Script de Setup Completo do PostgreSQL
=======================================

Este script faz TUDO automaticamente:
1. ✅ Cria o banco de dados 'sistema_financeiro' (se não existir)
2. ✅ Cria todas as tabelas via ORM
3. ✅ Mostra as tabelas criadas
4. ✅ Testa a conexão

REQUISITOS:
- PostgreSQL instalado e rodando
- Credenciais: postgres/postgres
- Porta: 5432

USO:
    python setup_postgresql.py
"""

import sys
from pathlib import Path

# Adicionar o diretório src ao path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from sqlalchemy import create_engine, text, inspect
from sqlalchemy.exc import OperationalError
import logging

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(message)s'
)
logger = logging.getLogger(__name__)

# Configurações
POSTGRES_USER = "postgres"
POSTGRES_PASSWORD = "postgres"
POSTGRES_HOST = "localhost"
POSTGRES_PORT = "5432"
DATABASE_NAME = "sistema_financeiro"

POSTGRES_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/postgres"
DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{DATABASE_NAME}"


def print_header(text: str):
    """Imprime cabeçalho formatado"""
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70)


def check_postgresql_running():
    """Verifica se PostgreSQL está rodando"""
    print_header("1️⃣ VERIFICANDO POSTGRESQL")
    
    try:
        engine = create_engine(POSTGRES_URL)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version_row = result.fetchone()
            if version_row is not None:
                version = version_row[0]
                logger.info(f"✅ PostgreSQL está rodando!")
                logger.info(f"📌 Versão: {version.split(',')[0]}")
                return True
            else:
                logger.error("❌ Não foi possível obter a versão do PostgreSQL!")
                return False
    except OperationalError as e:
        logger.error(f"❌ PostgreSQL não está rodando ou credenciais incorretas!")
        logger.error(f"💡 Erro: {str(e)}")
        logger.error("\n🔧 Soluções:")
        logger.error("   1. Verifique se PostgreSQL está instalado")
        logger.error("   2. Inicie o serviço: Services → PostgreSQL")
        logger.error("   3. Ou rode: pg_ctl -D 'C:\\Program Files\\PostgreSQL\\15\\data' start")
        logger.error("   4. Ou use Docker: docker-compose -f docker-compose.postgresql.yml up -d postgres")
        return False
    finally:
        if 'engine' in locals():
            engine.dispose()


def create_database():
    """Cria o banco de dados se não existir"""
    print_header("2️⃣ CRIANDO BANCO DE DADOS")
    
    try:
        engine = create_engine(POSTGRES_URL, isolation_level='AUTOCOMMIT')
        
        with engine.connect() as conn:
            # Verificar se banco existe
            result = conn.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :db_name"),
                {"db_name": DATABASE_NAME}
            )
            
            if not result.fetchone():
                logger.info(f"📦 Criando banco de dados: {DATABASE_NAME}")
                conn.execute(text(f'CREATE DATABASE "{DATABASE_NAME}"'))
                logger.info(f"✅ Banco de dados '{DATABASE_NAME}' criado com sucesso!")
            else:
                logger.info(f"ℹ️ Banco de dados '{DATABASE_NAME}' já existe")
        
        engine.dispose()
        return True
        
    except Exception as e:
        logger.error(f"❌ Erro ao criar banco de dados: {e}")
        return False


def create_tables():
    """Cria todas as tabelas via ORM"""
    print_header("3️⃣ CRIANDO TABELAS VIA ORM")
    
    try:
        # Importar configuração do banco
        from src.config.database import engine, Base
        
        # Importar TODOS os modelos
        from src.models.ddl_models import Pessoas, MovimentoContas
        from src.models.parcelas_models import ParcelasContas
        from src.models.classificacao_models import Classificacao
        
        logger.info("📋 Modelos importados:")
        logger.info("   - Pessoas (Fornecedores, Clientes, Faturados)")
        logger.info("   - MovimentoContas (Contas a Pagar/Receber)")
        logger.info("   - ParcelasContas (Parcelas)")
        logger.info("   - Classificacao (Tipos de Receita/Despesa)")
        
        logger.info("\n🔧 Criando tabelas no PostgreSQL...")
        Base.metadata.create_all(bind=engine)
        
        # Verificar tabelas criadas
        inspector = inspect(engine)
        tabelas = inspector.get_table_names()
        
        logger.info(f"\n✅ {len(tabelas)} tabelas criadas com sucesso!")
        for i, tabela in enumerate(tabelas, 1):
            logger.info(f"   {i}. {tabela}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Erro ao criar tabelas: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_connection():
    """Testa a conexão e mostra informações do banco"""
    print_header("4️⃣ TESTANDO CONEXÃO")
    
    try:
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as conn:
            # Contar registros em cada tabela
            tabelas = ['Pessoas', 'MovimentoContas', 'ParcelasContas', 'Classificacao']
            
            logger.info("📊 Registros por tabela:")
            for tabela in tabelas:
                try:
                    result = conn.execute(text(f'SELECT COUNT(*) FROM "{tabela}"'))
                    count_row = result.fetchone()
                    count = count_row[0] if count_row is not None else 0
                    logger.info(f"   - {tabela}: {count} registros")
                except Exception:
                    logger.info(f"   - {tabela}: 0 registros")
        
        engine.dispose()
        return True
        
    except Exception as e:
        logger.error(f"❌ Erro ao testar conexão: {e}")
        return False


def main():
    """Executa o setup completo"""
    print("\n" + "=" * 70)
    print("  🐘 SETUP COMPLETO DO POSTGRESQL")
    print("  Sistema Administrativo Financeiro")
    print("=" * 70)
    
    # Passo 1: Verificar PostgreSQL
    if not check_postgresql_running():
        print("\n❌ Setup abortado - PostgreSQL não está acessível")
        return False
    
    # Passo 2: Criar banco
    if not create_database():
        print("\n❌ Setup abortado - Erro ao criar banco de dados")
        return False
    
    # Passo 3: Criar tabelas
    if not create_tables():
        print("\n❌ Setup abortado - Erro ao criar tabelas")
        return False
    
    # Passo 4: Testar conexão
    if not test_connection():
        print("\n⚠️ Tabelas criadas, mas erro ao testar conexão")
        return False
    
    # Sucesso!
    print_header("✅ SETUP CONCLUÍDO COM SUCESSO!")
    
    print("\n📝 PRÓXIMOS PASSOS:")
    print("\n1️⃣ Conectar no DBeaver:")
    print("   Host:     localhost")
    print("   Port:     5432")
    print("   Database: sistema_financeiro")
    print("   User:     postgres")
    print("   Password: postgres")
    
    print("\n2️⃣ Rodar o backend:")
    print("   cd backend")
    print("   uvicorn src.main:app --reload")
    
    print("\n3️⃣ Acessar a aplicação:")
    print("   Frontend: http://localhost:3000")
    print("   API Docs: http://localhost:8000/docs")
    
    print("\n" + "=" * 70)
    print("  🎉 Tudo pronto para usar!")
    print("=" * 70 + "\n")
    
    return True


if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️ Setup interrompido pelo usuário")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Erro inesperado: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

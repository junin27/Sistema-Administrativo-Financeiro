"""
Script de Migração de SQLite para PostgreSQL usando ORM (SQLAlchemy).
Não usa SQL manual - tudo via Python ORM.

Como usar:
1. Certifique-se que PostgreSQL está rodando
2. Crie o banco: CREATE DATABASE sistema_financeiro;
3. Execute: python migrate_to_postgresql.py
"""

import os
import sys
from pathlib import Path

# Adicionar o diretório src ao path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# Importar modelos
from src.models.ddl_models import Base, Pessoas, MovimentoContas
from src.models.parcelas_models import ParcelasContas
from src.models.classificacao_models import Classificacao

# URLs dos bancos
SQLITE_URL = "sqlite:///./sistema_financeiro.db"
POSTGRES_URL = "postgresql://postgres:postgres@localhost:5432/sistema_financeiro"

print("🔄 Iniciando migração de SQLite para PostgreSQL...")
print("=" * 60)

# Criar engines
print("\n1️⃣ Conectando aos bancos de dados...")
sqlite_engine = create_engine(SQLITE_URL)
postgres_engine = create_engine(POSTGRES_URL)

# Criar sessions
SqliteSession = sessionmaker(bind=sqlite_engine)
PostgresSession = sessionmaker(bind=postgres_engine)

sqlite_session = SqliteSession()
postgres_session = PostgresSession()

print("   ✅ SQLite conectado")
print("   ✅ PostgreSQL conectado")

# Criar todas as tabelas no PostgreSQL usando ORM
print("\n2️⃣ Criando tabelas no PostgreSQL via ORM...")
Base.metadata.create_all(postgres_engine)
print("   ✅ Tabelas criadas com sucesso!")

# Verificar tabelas criadas
inspector = inspect(postgres_engine)
tabelas = inspector.get_table_names()
print(f"\n📊 Tabelas criadas no PostgreSQL: {len(tabelas)}")
for tabela in tabelas:
    print(f"   - {tabela}")

# Migrar dados usando ORM
print("\n3️⃣ Migrando dados usando ORM...")

try:
    # Migrar Pessoas (Fornecedores, Clientes, Faturados)
    print("\n   📦 Migrando Pessoas...")
    pessoas_sqlite = sqlite_session.query(Pessoas).all()
    count_pessoas = 0
    for pessoa in pessoas_sqlite:
        nova_pessoa = Pessoas(
            idPessoas=pessoa.idPessoas,
            tipo=pessoa.tipo,
            razaosocial=pessoa.razaosocial,
            fantasia=pessoa.fantasia,
            documento=pessoa.documento,
            status=pessoa.status,
            deleted_at=pessoa.deleted_at,
            created_at=pessoa.created_at,
            updated_at=pessoa.updated_at
        )
        postgres_session.merge(nova_pessoa)  # merge evita duplicatas
        count_pessoas += 1
    
    postgres_session.commit()
    print(f"      ✅ {count_pessoas} pessoas migradas")

    # Migrar Classificações
    print("\n   📦 Migrando Classificações...")
    classificacoes_sqlite = sqlite_session.query(Classificacao).all()
    count_classificacoes = 0
    for classif in classificacoes_sqlite:
        nova_classif = Classificacao(
            idClassificacao=classif.idClassificacao,
            tipo=classif.tipo,
            descricao=classif.descricao,
            status=classif.status
        )
        postgres_session.merge(nova_classif)
        count_classificacoes += 1
    
    postgres_session.commit()
    print(f"      ✅ {count_classificacoes} classificações migradas")

    # Migrar Movimentos
    print("\n   📦 Migrando Movimentos de Contas...")
    movimentos_sqlite = sqlite_session.query(MovimentoContas).all()
    count_movimentos = 0
    for movimento in movimentos_sqlite:
        novo_movimento = MovimentoContas(
            idMovimentoContas=movimento.idMovimentoContas,
            tipo=movimento.tipo,
            numeronotafiscal=movimento.numeronotafiscal,
            dataemissao=movimento.dataemissao,
            descricao=movimento.descricao,
            status=movimento.status,
            valortotal=movimento.valortotal,
            deleted_at=movimento.deleted_at,
            created_at=movimento.created_at,
            updated_at=movimento.updated_at,
            Pessoas_idFornecedorCliente=movimento.Pessoas_idFornecedorCliente,
            Pessoas_idfaturado=movimento.Pessoas_idfaturado
        )
        postgres_session.merge(novo_movimento)
        count_movimentos += 1
    
    postgres_session.commit()
    print(f"      ✅ {count_movimentos} movimentos migrados")

    # Migrar Parcelas
    print("\n   📦 Migrando Parcelas...")
    parcelas_sqlite = sqlite_session.query(ParcelasContas).all()
    count_parcelas = 0
    for parcela in parcelas_sqlite:
        nova_parcela = ParcelasContas(
            idParcelasContas=parcela.idParcelasContas,
            identificacao=parcela.identificacao,
            valorparcela=parcela.valorparcela,
            datavencimento=parcela.datavencimento,
            statusparcela=parcela.statusparcela,
            MovimentoContas_idMovimentoContas=parcela.MovimentoContas_idMovimentoContas
        )
        postgres_session.merge(nova_parcela)
        count_parcelas += 1
    
    postgres_session.commit()
    print(f"      ✅ {count_parcelas} parcelas migradas")

    print("\n" + "=" * 60)
    print("✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!")
    print("=" * 60)
    print(f"\n📊 Resumo da Migração:")
    print(f"   - Pessoas: {count_pessoas}")
    print(f"   - Classificações: {count_classificacoes}")
    print(f"   - Movimentos: {count_movimentos}")
    print(f"   - Parcelas: {count_parcelas}")
    print(f"\n🎯 Total de registros migrados: {count_pessoas + count_classificacoes + count_movimentos + count_parcelas}")
    
    print("\n📝 Próximos passos:")
    print("   1. Verifique os dados no DBeaver")
    print("   2. Atualize o .env com: DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sistema_financeiro")
    print("   3. Reinicie o backend")
    print("   4. Teste a aplicação!")

except Exception as e:
    print(f"\n❌ ERRO durante a migração: {str(e)}")
    postgres_session.rollback()
    import traceback
    traceback.print_exc()
    sys.exit(1)

finally:
    sqlite_session.close()
    postgres_session.close()
    print("\n🔌 Conexões fechadas")

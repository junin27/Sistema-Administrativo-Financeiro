#!/bin/bash

echo "Iniciando backend..."

# Navegar para o diretório do backend
cd /app/backend

# Criar o arquivo do banco SQLite no caminho correto conforme settings.py
DB_PATH="/app/backend/sistema_financeiro.db"
echo "Criando banco SQLite em: $DB_PATH"

# Garantir que o diretório existe e tem permissões corretas
mkdir -p /app/backend
chmod 755 /app/backend

if [ ! -f "$DB_PATH" ]; then
    echo "Criando arquivo do banco SQLite..."
    touch "$DB_PATH"
    chmod 666 "$DB_PATH"
    chown root:root "$DB_PATH"
fi

# Verificar se o arquivo existe e tem permissões corretas
ls -la "$DB_PATH"

# Criar estrutura básica do banco usando SQLite diretamente
echo "Criando estrutura básica do banco..."
sqlite3 "$DB_PATH" "CREATE TABLE IF NOT EXISTS test_table (id INTEGER PRIMARY KEY);"

# Testar se o banco está funcionando
echo "Testando acesso ao banco..."
python -c "
import sqlite3
try:
    conn = sqlite3.connect('$DB_PATH')
    cursor = conn.cursor()
    cursor.execute('SELECT name FROM sqlite_master WHERE type=\"table\";')
    tables = cursor.fetchall()
    print(f'Tabelas encontradas: {tables}')
    conn.close()
    print('Banco SQLite funcionando!')
except Exception as e:
    print(f'Erro ao testar banco: {e}')
"

# Inicializar o banco de dados com SQLAlchemy (sem falhar se der erro)
echo "Tentando inicializar com SQLAlchemy..."
python -c "
from src.config.database import init_db
try:
    init_db()
    print('Banco inicializado com SQLAlchemy!')
except Exception as e:
    print(f'Aviso - Erro ao inicializar com SQLAlchemy: {e}')
    print('Continuando mesmo assim...')
" || echo "Continuando sem SQLAlchemy..."

# Iniciar o servidor uvicorn
echo "Iniciando servidor uvicorn..."
cd /app/backend
uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
#!/bin/bash

# Script de inicialização do Sistema Administrativo Financeiro
# Este script automatiza a configuração inicial do projeto

echo "🚀 Iniciando configuração do Sistema Administrativo Financeiro..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Por favor, instale o Docker primeiro."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não encontrado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

# Verificar se Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 não encontrado. Por favor, instale o Python 3.11+ primeiro."
    exit 1
fi

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale o Node.js 18+ primeiro."
    exit 1
fi

echo "✅ Dependências verificadas com sucesso!"

# Criar arquivo .env se não existir
if [ ! -f backend/.env ]; then
    echo "📝 Criando arquivo .env para o backend..."
    cp backend/.env.example backend/.env
    echo "⚠️  IMPORTANTE: Configure as variáveis no arquivo backend/.env antes de continuar"
fi

# Iniciar banco de dados com Docker
echo "🐳 Iniciando PostgreSQL com Docker..."
docker-compose up -d postgres

# Aguardar banco ficar disponível
echo "⏳ Aguardando banco de dados ficar disponível..."
sleep 10

# Verificar se o banco está rodando
if ! docker-compose ps postgres | grep -q "Up"; then
    echo "❌ Falha ao iniciar o banco de dados PostgreSQL"
    exit 1
fi

echo "✅ PostgreSQL iniciado com sucesso!"

# Configurar backend
echo "🐍 Configurando backend Python..."
cd backend

# Criar ambiente virtual se não existir
if [ ! -d "venv" ]; then
    echo "📦 Criando ambiente virtual Python..."
    python3 -m venv venv
fi

# Ativar ambiente virtual
echo "🔧 Ativando ambiente virtual..."
source venv/bin/activate

# Instalar dependências
echo "📦 Instalando dependências Python..."
pip install --upgrade pip
pip install -r requirements.txt

# Executar migrations
echo "📊 Executando migrations do banco de dados..."
alembic upgrade head

# Voltar para diretório principal
cd ..

# Configurar frontend
echo "⚛️  Configurando frontend React..."
cd frontend

# Instalar dependências Node.js
echo "📦 Instalando dependências Node.js..."
npm install

# Voltar para diretório principal
cd ..

echo "🎉 Configuração concluída com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure suas variáveis de ambiente em backend/.env"
echo "2. Adicione sua GEMINI_API_KEY no arquivo .env"
echo "3. Execute os comandos abaixo para iniciar a aplicação:"
echo ""
echo "🐍 Backend (Terminal 1):"
echo "cd backend"
echo "source venv/bin/activate"
echo "uvicorn src.main:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "⚛️  Frontend (Terminal 2):"
echo "cd frontend"
echo "npm run dev"
echo ""
echo "🌐 URLs da aplicação:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:8000"
echo "- Documentação API: http://localhost:8000/docs"
echo "- PgAdmin: http://localhost:5050 (admin@sistema.com / admin123)"
echo ""
echo "🔧 Para parar os serviços Docker:"
echo "docker-compose down"

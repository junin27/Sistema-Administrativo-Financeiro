@echo off
REM Script de inicialização do Sistema Administrativo Financeiro para Windows
REM Este script automatiza a configuração inicial do projeto

echo 🚀 Iniciando configuração do Sistema Administrativo Financeiro...

REM Verificar se Docker está instalado
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker não encontrado. Por favor, instale o Docker Desktop primeiro.
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose não encontrado. Por favor, instale o Docker Compose primeiro.
    pause
    exit /b 1
)

REM Verificar se Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python não encontrado. Por favor, instale o Python 3.11+ primeiro.
    pause
    exit /b 1
)

REM Verificar se Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js não encontrado. Por favor, instale o Node.js 18+ primeiro.
    pause
    exit /b 1
)

echo ✅ Dependências verificadas com sucesso!

REM Criar arquivo .env se não existir
if not exist "backend\.env" (
    echo 📝 Criando arquivo .env para o backend...
    copy "backend\.env.example" "backend\.env"
    echo ⚠️  IMPORTANTE: Configure as variáveis no arquivo backend\.env antes de continuar
)

REM Iniciar banco de dados com Docker
echo 🐳 Iniciando PostgreSQL com Docker...
docker-compose up -d postgres

REM Aguardar banco ficar disponível
echo ⏳ Aguardando banco de dados ficar disponível...
timeout /t 10 /nobreak >nul

echo ✅ PostgreSQL iniciado com sucesso!

REM Configurar backend
echo 🐍 Configurando backend Python...
cd backend

REM Criar ambiente virtual se não existir
if not exist "venv" (
    echo 📦 Criando ambiente virtual Python...
    python -m venv venv
)

REM Ativar ambiente virtual
echo 🔧 Ativando ambiente virtual...
call venv\Scripts\activate.bat

REM Instalar dependências
echo 📦 Instalando dependências Python...
python -m pip install --upgrade pip
pip install -r requirements.txt

REM Executar migrations
echo 📊 Executando migrations do banco de dados...
alembic upgrade head

REM Voltar para diretório principal
cd ..

REM Configurar frontend
echo ⚛️  Configurando frontend React...
cd frontend

REM Instalar dependências Node.js
echo 📦 Instalando dependências Node.js...
npm install

REM Voltar para diretório principal
cd ..

echo.
echo 🎉 Configuração concluída com sucesso!
echo.
echo 📋 Próximos passos:
echo 1. Configure suas variáveis de ambiente em backend\.env
echo 2. Adicione sua GEMINI_API_KEY no arquivo .env
echo 3. Execute os comandos abaixo para iniciar a aplicação:
echo.
echo 🐍 Backend (Terminal 1):
echo cd backend
echo venv\Scripts\activate.bat
echo uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
echo.
echo ⚛️  Frontend (Terminal 2):
echo cd frontend
echo npm run dev
echo.
echo 🌐 URLs da aplicação:
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:8000
echo - Documentação API: http://localhost:8000/docs
echo - PgAdmin: http://localhost:5050 (admin@sistema.com / admin123)
echo.
echo 🔧 Para parar os serviços Docker:
echo docker-compose down
echo.
pause

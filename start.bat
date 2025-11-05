@echo off
echo 🚀 Iniciando Sistema Administrativo Financeiro...
echo.

REM Verificar se Docker está instalado
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker não está instalado!
    echo Por favor, instale o Docker: https://docs.docker.com/get-docker/
    pause
    exit /b 1
)

REM Verificar se Docker Compose está instalado
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose não está instalado!
    echo Por favor, instale o Docker Compose: https://docs.docker.com/compose/install/
    pause
    exit /b 1
)

REM Verificar se o arquivo .env existe
if not exist .env (
    echo ⚠️  Arquivo .env não encontrado!
    echo Criando .env a partir de .env.example...
    copy .env.example .env
    echo.
    echo 📝 ATENÇÃO: Configure a GEMINI_API_KEY no arquivo .env antes de continuar!
    echo    1. Abra o arquivo .env
    echo    2. Substitua 'sua_chave_api_aqui' pela sua chave do Google Gemini
    echo    3. Obtenha a chave em: https://makersuite.google.com/app/apikey
    echo.
    pause
)

REM Parar containers existentes
echo 🛑 Parando containers existentes...
docker-compose down

REM Construir e iniciar containers
echo 🔨 Construindo e iniciando containers...
docker-compose up --build -d

REM Aguardar containers iniciarem
echo ⏳ Aguardando serviços iniciarem...
timeout /t 5 /nobreak >nul

REM Verificar status dos containers
echo.
echo 📊 Status dos containers:
docker-compose ps

echo.
echo ✅ Sistema iniciado com sucesso!
echo.
echo 🌐 Acesse a aplicação:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:8000
echo    Documentação API: http://localhost:8000/docs
echo.
echo 📝 Comandos úteis:
echo    docker-compose logs -f          # Ver logs em tempo real
echo    docker-compose logs backend     # Ver logs do backend
echo    docker-compose logs frontend    # Ver logs do frontend
echo    docker-compose stop             # Parar containers
echo    docker-compose down             # Parar e remover containers
echo.
pause

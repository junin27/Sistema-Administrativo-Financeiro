@echo off
:: Sistema Administrativo Financeiro - Script de Inicialização
:: Para Windows PowerShell/CMD

echo.
echo =====================================================
echo   SISTEMA ADMINISTRATIVO FINANCEIRO
echo =====================================================
echo.

:: Verificar se Docker está instalado
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Docker não encontrado! Instale o Docker Desktop primeiro.
    echo    Download: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

:: Verificar se Docker Compose está disponível
docker compose version >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Docker Compose não encontrado!
    pause
    exit /b 1
)

echo ✅ Docker encontrado!

:: Verificar se arquivo .env existe
if not exist ".env" (
    echo ⚠️  Arquivo .env não encontrado. Criando a partir do .env.example...
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo ✅ Arquivo .env criado!
    ) else (
        echo ❌ Arquivo .env.example não encontrado!
        pause
        exit /b 1
    )
)

echo.
echo Escolha uma opção:
echo.
echo 1. 🚀 Iniciar ambiente de DESENVOLVIMENTO
echo 2. 🏭 Iniciar ambiente de PRODUÇÃO
echo 3. 🗄️  Iniciar apenas PostgreSQL
echo 4. 📊 Ver status dos containers
echo 5. 📝 Ver logs dos containers
echo 6. 🛑 Parar todos os containers
echo 7. 🧹 Limpar containers e volumes
echo 8. 💾 Fazer backup do banco
echo 9. 🆘 Mostrar ajuda
echo 0. ❌ Sair
echo.

set /p choice="Digite sua escolha (0-9): "

if "%choice%"=="1" goto dev
if "%choice%"=="2" goto prod
if "%choice%"=="3" goto db_only
if "%choice%"=="4" goto status
if "%choice%"=="5" goto logs
if "%choice%"=="6" goto stop
if "%choice%"=="7" goto clean
if "%choice%"=="8" goto backup
if "%choice%"=="9" goto help
if "%choice%"=="0" goto exit
goto invalid

:dev
echo.
echo 🚀 Iniciando ambiente de desenvolvimento...
echo.
docker compose -f docker-compose.dev.yml up -d
echo.
echo ✅ Ambiente iniciado! Acesse:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:8000
echo    API Docs: http://localhost:8000/docs
echo    PgAdmin:  http://localhost:5050
echo.
goto menu

:prod
echo.
echo 🏭 Iniciando ambiente de produção...
echo.
docker compose -f docker-compose.prod.yml up -d
echo.
echo ✅ Ambiente de produção iniciado!
echo.
goto menu

:db_only
echo.
echo 🗄️  Iniciando apenas PostgreSQL...
echo.
docker compose -f docker-compose.dev.yml up -d postgres
echo.
echo ✅ PostgreSQL iniciado na porta 5432
echo.
goto menu

:status
echo.
echo 📊 Status dos containers:
echo.
docker compose -f docker-compose.dev.yml ps
echo.
goto menu

:logs
echo.
echo 📝 Logs dos containers (pressione Ctrl+C para sair):
echo.
docker compose -f docker-compose.dev.yml logs -f
goto menu

:stop
echo.
echo 🛑 Parando todos os containers...
echo.
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.prod.yml down
echo.
echo ✅ Containers parados!
echo.
goto menu

:clean
echo.
echo ⚠️  ATENÇÃO: Isso irá remover todos os containers, volumes e dados!
set /p confirm="Tem certeza? Digite 'confirmo' para continuar: "
if not "%confirm%"=="confirmo" (
    echo Operação cancelada.
    goto menu
)
echo.
echo 🧹 Removendo containers, volumes e dados...
echo.
docker compose -f docker-compose.dev.yml down -v --rmi local
docker compose -f docker-compose.prod.yml down -v --rmi local
docker system prune -f
echo.
echo ✅ Limpeza concluída!
echo.
goto menu

:backup
echo.
echo 💾 Criando backup do banco de dados...
if not exist "backups" mkdir backups
set timestamp=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set timestamp=%timestamp: =0%
docker compose -f docker-compose.dev.yml exec postgres pg_dump -U dev_user sistema_financeiro_dev > backups\backup_%timestamp%.sql
echo.
echo ✅ Backup criado em backups\backup_%timestamp%.sql
echo.
goto menu

:help
echo.
echo 🆘 AJUDA - Sistema Administrativo Financeiro
echo.
echo COMANDOS DISPONÍVEIS:
echo.
echo Desenvolvimento:
echo   make dev         - Inicia ambiente de desenvolvimento
echo   make dev-stop    - Para ambiente de desenvolvimento
echo   make dev-logs    - Mostra logs do desenvolvimento
echo.
echo Produção:
echo   make prod        - Inicia ambiente de produção
echo   make prod-stop   - Para ambiente de produção
echo.
echo Banco de Dados:
echo   make db-only     - Inicia apenas PostgreSQL
echo   make db-migrate  - Executa migrations
echo   make db-reset    - Reseta banco (cuidado!)
echo.
echo Utilitários:
echo   make status      - Status dos containers
echo   make logs        - Logs de todos os serviços
echo   make clean       - Remove containers e volumes
echo   make backup      - Backup do banco
echo   make test        - Executa testes
echo.
echo Shells:
echo   make shell-backend  - Acessa shell do backend
echo   make shell-db       - Acessa shell do PostgreSQL
echo.
echo Para usar estes comandos, você precisa ter o Make instalado.
echo Alternativamente, use os comandos Docker Compose diretamente.
echo.
goto menu

:invalid
echo.
echo ❌ Opção inválida! Tente novamente.
echo.

:menu
echo.
echo Pressione qualquer tecla para voltar ao menu...
pause >nul
cls
goto start

:exit
echo.
echo 👋 Até logo!
echo.
exit /b 0

:start
cls
goto begin

:begin
goto dev

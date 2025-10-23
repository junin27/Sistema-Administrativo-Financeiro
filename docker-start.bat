@echo off
echo ==========================================
echo Sistema Administrativo Financeiro
echo Docker Unificado com SQLite
echo ==========================================
echo.

echo Parando containers existentes...
docker-compose down

echo.
echo Construindo e iniciando aplicacao unificada...
docker-compose up --build -d

echo.
echo Aguardando inicializacao dos servicos...
timeout /t 10 /nobreak > nul

echo.
echo ==========================================
echo Aplicacao iniciada com sucesso!
echo ==========================================
echo.
echo Acesse:
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:8000
echo - Documentacao API: http://localhost:8000/docs
echo - PgAdmin: http://localhost:5050
echo.
echo Para parar a aplicacao, pressione Ctrl+C
echo Pressione qualquer tecla para continuar...
pause > nul
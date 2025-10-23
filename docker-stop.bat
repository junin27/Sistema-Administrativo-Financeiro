@echo off
echo ==========================================
echo Sistema Administrativo Financeiro
echo Parando containers Docker
echo ==========================================
echo.

echo Parando todos os containers...
docker-compose down

echo.
echo Removendo volumes (opcional - descomente se necessario):
REM docker-compose down -v

echo.
echo ==========================================
echo Containers parados com sucesso!
echo ==========================================
echo.
echo Pressione qualquer tecla para continuar...
pause > nul
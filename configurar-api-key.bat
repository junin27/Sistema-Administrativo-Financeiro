@echo off
echo ========================================
echo  Configurar API Key do Google Gemini
echo ========================================
echo.
echo Para processar PDFs, voce precisa de uma API Key do Google Gemini.
echo.
echo 1. Acesse: https://aistudio.google.com/app/apikey
echo 2. Faca login com sua conta Google
echo 3. Clique em "Create API Key"
echo 4. Copie a chave gerada
echo.
echo Cole sua API Key abaixo (ou pressione Enter para pular):
set /p API_KEY="API Key: "

if "%API_KEY%"=="" (
    echo.
    echo Nenhuma API key foi configurada.
    echo Voce pode configurar depois usando uma das opcoes:
    echo   1. Definir variavel de ambiente: set GEMINI_API_KEY=sua_chave
    echo   2. Editar docker-compose.postgresql.yml
    echo   3. Criar arquivo .env na pasta backend
    echo.
    pause
    exit /b
)

echo.
echo Configurando API Key como variavel de ambiente...
setx GEMINI_API_KEY "%API_KEY%"
set GEMINI_API_KEY=%API_KEY%

echo.
echo ========================================
echo  API Key configurada!
echo ========================================
echo.
echo IMPORTANTE: Feche e reabra o terminal/PowerShell para a variavel
echo de ambiente ser carregada, ou reinicie o Docker Compose.
echo.
echo Para reiniciar o Docker Compose:
echo   docker-compose -f docker-compose.postgresql.yml restart backend
echo.
pause


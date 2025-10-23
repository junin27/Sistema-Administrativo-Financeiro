#!/bin/bash

echo "========================================"
echo "  Sistema Administrativo Financeiro"
echo "  Docker Unificado com SQLite"
echo "========================================"
echo
echo "Iniciando aplicacao unificada..."
echo "- Frontend: React + Vite"
echo "- Backend: FastAPI + Python"
echo "- Banco de Dados: SQLite"
echo

docker-compose -f docker-compose.unified.yml up --build

echo
echo "========================================"
echo "  Aplicacao iniciada com sucesso!"
echo "========================================"
echo
echo "Acesse:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:8000"
echo "- Documentacao API: http://localhost:8000/docs"
echo
echo "Para parar a aplicacao, pressione Ctrl+C"
echo""

# Tornar o script executável
chmod +x "$0"

# Iniciar com docker-compose
docker-compose -f docker-compose.unified.yml up --build
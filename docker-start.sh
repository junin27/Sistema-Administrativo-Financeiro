#!/bin/bash

echo "========================================"
echo " Sistema Administrativo Financeiro"
echo " Iniciando com Docker Compose"
echo "========================================"
echo ""

echo "[1/3] Parando containers existentes..."
docker-compose -f docker-compose.postgresql.yml down

echo ""
echo "[2/3] Construindo imagens..."
docker-compose -f docker-compose.postgresql.yml build

echo ""
echo "[3/3] Iniciando serviços..."
docker-compose -f docker-compose.postgresql.yml up -d

echo ""
echo "========================================"
echo " Serviços iniciados!"
echo "========================================"
echo ""
echo " Frontend:  http://localhost:3000"
echo " Backend:   http://localhost:8000"
echo " API Docs:  http://localhost:8000/docs"
echo " PostgreSQL: localhost:54320"
echo ""
echo " Para ver os logs:"
echo "   docker-compose -f docker-compose.postgresql.yml logs -f"
echo ""
echo " Para parar os serviços:"
echo "   docker-compose -f docker-compose.postgresql.yml down"
echo ""


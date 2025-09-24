# Sistema Administrativo Financeiro - Makefile
# Facilita comandos Docker e desenvolvimento

.PHONY: help dev prod stop clean logs test lint format

# Variáveis
DOCKER_COMPOSE_DEV = docker-compose -f docker-compose.dev.yml
DOCKER_COMPOSE_PROD = docker-compose -f docker-compose.prod.yml

help: ## Exibe esta ajuda
	@echo "Sistema Administrativo Financeiro - Comandos disponíveis:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ================================
# COMANDOS DE DESENVOLVIMENTO
# ================================

dev: ## Inicia ambiente de desenvolvimento
	@echo "🚀 Iniciando ambiente de desenvolvimento..."
	@if [ ! -f .env ]; then echo "⚠️  Arquivo .env não encontrado. Copiando .env.example..."; cp .env.example .env; fi
	$(DOCKER_COMPOSE_DEV) up -d
	@echo "✅ Ambiente iniciado! Acesse:"
	@echo "   Frontend: http://localhost:3000"
	@echo "   Backend: http://localhost:8000"
	@echo "   Docs API: http://localhost:8000/docs"
	@echo "   PgAdmin: http://localhost:5050"

dev-build: ## Reconstrói containers de desenvolvimento
	@echo "🔨 Reconstruindo containers..."
	$(DOCKER_COMPOSE_DEV) up -d --build

dev-logs: ## Exibe logs do ambiente de desenvolvimento
	$(DOCKER_COMPOSE_DEV) logs -f

dev-stop: ## Para ambiente de desenvolvimento
	@echo "🛑 Parando ambiente de desenvolvimento..."
	$(DOCKER_COMPOSE_DEV) down

# ================================
# COMANDOS DE PRODUÇÃO
# ================================

prod: ## Inicia ambiente de produção
	@echo "🚀 Iniciando ambiente de produção..."
	@if [ ! -f .env ]; then echo "❌ Arquivo .env obrigatório para produção!"; exit 1; fi
	$(DOCKER_COMPOSE_PROD) up -d
	@echo "✅ Ambiente de produção iniciado!"

prod-build: ## Reconstrói containers de produção
	@echo "🔨 Reconstruindo containers de produção..."
	$(DOCKER_COMPOSE_PROD) up -d --build

prod-logs: ## Exibe logs do ambiente de produção
	$(DOCKER_COMPOSE_PROD) logs -f

prod-stop: ## Para ambiente de produção
	@echo "🛑 Parando ambiente de produção..."
	$(DOCKER_COMPOSE_PROD) down

# ================================
# COMANDOS DE BANCO DE DADOS
# ================================

db-only: ## Inicia apenas o banco PostgreSQL
	@echo "🗄️  Iniciando apenas PostgreSQL..."
	$(DOCKER_COMPOSE_DEV) up -d postgres
	@echo "✅ PostgreSQL iniciado na porta 5432"

db-migrate: ## Executa migrations do banco
	@echo "🔄 Executando migrations..."
	$(DOCKER_COMPOSE_DEV) exec backend alembic upgrade head

db-reset: ## Reseta banco de dados (CUIDADO!)
	@echo "⚠️  RESETANDO BANCO DE DADOS..."
	@read -p "Tem certeza? Digite 'confirmo' para continuar: " confirm && [ "$$confirm" = "confirmo" ]
	$(DOCKER_COMPOSE_DEV) down -v
	$(DOCKER_COMPOSE_DEV) up -d postgres
	sleep 5
	$(DOCKER_COMPOSE_DEV) exec backend alembic upgrade head
	$(DOCKER_COMPOSE_DEV) exec backend python populate_db.py

# ================================
# COMANDOS DE UTILIDADE
# ================================

stop: ## Para todos os containers
	@echo "🛑 Parando todos os containers..."
	$(DOCKER_COMPOSE_DEV) down
	$(DOCKER_COMPOSE_PROD) down

clean: ## Remove containers, volumes e imagens
	@echo "🧹 Limpando containers, volumes e imagens..."
	@read -p "Tem certeza? Digite 'confirmo' para continuar: " confirm && [ "$$confirm" = "confirmo" ]
	$(DOCKER_COMPOSE_DEV) down -v --rmi local
	$(DOCKER_COMPOSE_PROD) down -v --rmi local
	docker system prune -f

logs: ## Exibe logs de todos os serviços
	$(DOCKER_COMPOSE_DEV) logs -f

status: ## Exibe status dos containers
	@echo "📊 Status dos containers:"
	$(DOCKER_COMPOSE_DEV) ps

# ================================
# COMANDOS DE DESENVOLVIMENTO
# ================================

shell-backend: ## Acessa shell do container backend
	$(DOCKER_COMPOSE_DEV) exec backend /bin/bash

shell-frontend: ## Acessa shell do container frontend
	$(DOCKER_COMPOSE_DEV) exec frontend /bin/sh

shell-db: ## Acessa shell do PostgreSQL
	$(DOCKER_COMPOSE_DEV) exec postgres psql -U dev_user -d sistema_financeiro_dev

# ================================
# COMANDOS DE TESTE E QUALIDADE
# ================================

test: ## Executa testes do backend
	@echo "🧪 Executando testes..."
	$(DOCKER_COMPOSE_DEV) exec backend python -m pytest

test-coverage: ## Executa testes com coverage
	@echo "🧪 Executando testes com coverage..."
	$(DOCKER_COMPOSE_DEV) exec backend python -m pytest --cov=src --cov-report=html

lint: ## Executa linting do código
	@echo "🔍 Executando linting..."
	$(DOCKER_COMPOSE_DEV) exec backend python -m flake8 src/
	$(DOCKER_COMPOSE_DEV) exec backend python -m mypy src/

format: ## Formata código com black
	@echo "🎨 Formatando código..."
	$(DOCKER_COMPOSE_DEV) exec backend python -m black src/
	$(DOCKER_COMPOSE_DEV) exec backend python -m isort src/

# ================================
# COMANDOS DE INSTALAÇÃO
# ================================

install: ## Primeira instalação do projeto
	@echo "📦 Primeira instalação do projeto..."
	@if [ ! -f .env ]; then cp .env.example .env; echo "✅ Arquivo .env criado"; fi
	$(DOCKER_COMPOSE_DEV) build
	$(DOCKER_COMPOSE_DEV) up -d postgres
	@echo "⏳ Aguardando PostgreSQL inicializar..."
	sleep 10
	$(DOCKER_COMPOSE_DEV) exec postgres psql -U dev_user -d sistema_financeiro_dev -c "SELECT 1;"
	$(DOCKER_COMPOSE_DEV) up -d backend
	sleep 5
	$(DOCKER_COMPOSE_DEV) exec backend alembic upgrade head
	$(DOCKER_COMPOSE_DEV) exec backend python populate_db.py
	$(DOCKER_COMPOSE_DEV) up -d
	@echo "🎉 Instalação concluída!"
	@echo "   Frontend: http://localhost:3000"
	@echo "   Backend: http://localhost:8000/docs"
	@echo "   PgAdmin: http://localhost:5050"

update: ## Atualiza projeto com novas mudanças
	@echo "🔄 Atualizando projeto..."
	git pull
	$(DOCKER_COMPOSE_DEV) build
	$(DOCKER_COMPOSE_DEV) exec backend alembic upgrade head
	$(DOCKER_COMPOSE_DEV) restart
	@echo "✅ Projeto atualizado!"

# ================================
# COMANDOS DE BACKUP
# ================================

backup: ## Cria backup do banco de dados
	@echo "💾 Criando backup do banco..."
	mkdir -p backups
	$(DOCKER_COMPOSE_DEV) exec postgres pg_dump -U dev_user sistema_financeiro_dev > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ Backup criado em backups/"

restore: ## Restaura backup do banco (especifique BACKUP_FILE=arquivo.sql)
	@echo "🔄 Restaurando backup do banco..."
	@if [ -z "$(BACKUP_FILE)" ]; then echo "❌ Especifique BACKUP_FILE=arquivo.sql"; exit 1; fi
	$(DOCKER_COMPOSE_DEV) exec -T postgres psql -U dev_user -d sistema_financeiro_dev < $(BACKUP_FILE)
	@echo "✅ Backup restaurado!"

# Comando padrão
.DEFAULT_GOAL := help

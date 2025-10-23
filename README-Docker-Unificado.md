# 🐳 Docker Unificado - Sistema Administrativo Financeiro

Este setup permite executar **Frontend**, **Backend** e **Banco de Dados SQLite** em um único container Docker, ideal para desenvolvimento local.

## 📋 Pré-requisitos

- **Docker** instalado
- **Docker Compose** instalado

## 🚀 Como Usar

### Opção 1: Scripts Automatizados

#### Windows:
```bash
./start-unified.bat
```

#### Linux/Mac:
```bash
chmod +x start-unified.sh
./start-unified.sh
```

### Opção 2: Comando Manual
```bash
docker-compose -f docker-compose.unified.yml up --build
```

## 🌐 Acessos

Após iniciar, você pode acessar:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Documentação da API**: http://localhost:8000/docs

## 🏗️ Estrutura do Docker Unificado

### Container Único
- **Frontend**: React + Vite (porta 3000)
- **Backend**: FastAPI + Python (porta 8000)
- **Banco de Dados**: SQLite (arquivo persistente)

### Tecnologias
- **Supervisor**: Gerencia múltiplos processos no container
- **SQLite**: Banco de dados leve e sem dependências externas
- **Hot Reload**: Ambos frontend e backend recarregam automaticamente

## 📁 Arquivos Criados

- `Dockerfile.unified` - Container unificado
- `docker-compose.unified.yml` - Orquestração simplificada
- `start-unified.bat` - Script para Windows
- `start-unified.sh` - Script para Linux/Mac

## 💡 Dicas de Desenvolvimento

### Ver Logs
```bash
docker-compose -f docker-compose.unified.yml logs -f
```

### Parar Serviços
```bash
docker-compose -f docker-compose.unified.yml down
```

### Rebuild (após mudanças no Dockerfile)
```bash
docker-compose -f docker-compose.unified.yml up --build
```

### Acessar Container
```bash
docker exec -it sistema_financeiro_app bash
```

## 🔧 Troubleshooting

### Porta já em uso
Se as portas 3000 ou 8000 estiverem em uso:
```bash
# Verificar processos usando as portas
netstat -ano | findstr :3000
netstat -ano | findstr :8000

# Parar containers existentes
docker-compose -f docker-compose.unified.yml down
```

### Problemas de Build
```bash
# Limpar cache do Docker
docker system prune -a

# Rebuild completo
docker-compose -f docker-compose.unified.yml build --no-cache
```

### Banco de Dados
- O SQLite é criado automaticamente no primeiro uso
- Os dados ficam persistentes no volume `sqlite_data`
- Para resetar o banco: `docker volume rm sistema-administrativo-financeiro_sqlite_data`

## ✅ Vantagens

- **Simplicidade**: Um único comando para subir tudo
- **Desenvolvimento**: Hot reload em ambos os serviços
- **Portabilidade**: Funciona em qualquer sistema com Docker
- **Leve**: SQLite não requer container separado
- **Rápido**: Inicialização mais rápida que setup com PostgreSQL

## ⚠️ Limitações

- **Apenas Desenvolvimento**: Não recomendado para produção
- **Performance**: SQLite tem limitações para alta concorrência
- **Backup**: Dados ficam no volume Docker (fazer backup regularmente)

## 🔄 Migração para Produção

Para produção, recomenda-se usar:
- Containers separados (frontend, backend, banco)
- PostgreSQL ao invés de SQLite
- Nginx como proxy reverso
- Configurações de segurança adequadas
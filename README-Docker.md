# Sistema Administrativo Financeiro - Docker

## 📋 Pré-requisitos

### 1. Docker Desktop
Para usar este sistema com Docker, você precisa ter o Docker Desktop instalado e rodando:

1. **Baixe o Docker Desktop**: https://www.docker.com/products/docker-desktop/
2. **Instale seguindo as instruções** para Windows
3. **Inicie o Docker Desktop** e aguarde até que apareça "Docker Desktop is running"
4. **Verifique a instalação** executando no terminal:
   ```bash
   docker --version
   docker info
   ```

### 2. Configuração de Variáveis de Ambiente
1. Copie o arquivo `.env.example` para `.env`:
   ```bash
   copy .env.example .env
   ```
2. Edite o arquivo `.env` e configure suas variáveis, especialmente:
   - `GOOGLE_API_KEY`: Sua chave da API do Google Gemini (opcional)

## 🚀 Como Usar

### Opção 1: Scripts Automatizados (Recomendado)

#### Para Iniciar:
```bash
docker-start.bat
```

#### Para Parar:
```bash
docker-stop.bat
```

### Opção 2: Comandos Manuais

#### Para Iniciar:
```bash
# Construir e iniciar todos os serviços
docker-compose up --build -d

# Verificar status dos containers
docker-compose ps
```

#### Para Parar:
```bash
# Parar todos os serviços
docker-compose down

# Parar e remover volumes (dados serão perdidos)
docker-compose down -v
```

## 🌐 Acessos

Após iniciar os containers, você pode acessar:

- **Frontend (React)**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Documentação da API**: http://localhost:8000/docs
- **PgAdmin (Gerenciador do Banco)**: http://localhost:5050
  - Email: admin@sistema.com
  - Senha: admin123

## 🏗️ Arquitetura

O sistema é composto por 4 serviços:

1. **PostgreSQL**: Banco de dados principal
2. **Backend FastAPI**: API REST com Python
3. **Frontend React**: Interface do usuário
4. **PgAdmin**: Interface web para gerenciar o banco

## 🔧 Configurações

### Portas Utilizadas:
- `3000`: Frontend React
- `8000`: Backend FastAPI
- `5432`: PostgreSQL
- `5050`: PgAdmin

### Volumes:
- `postgres_data`: Dados do PostgreSQL
- `pgadmin_data`: Configurações do PgAdmin

## 🐛 Solução de Problemas

### Docker Desktop não está rodando:
```
Error: open //./pipe/dockerDesktopLinuxEngine: O sistema não pode encontrar o arquivo especificado.
```
**Solução**: Inicie o Docker Desktop e aguarde até que esteja completamente carregado.

### Porta já está em uso:
```
Error: bind: address already in use
```
**Solução**: 
1. Pare outros serviços que estejam usando as portas (3000, 8000, 5432, 5050)
2. Ou modifique as portas no `docker-compose.yml`

### Problemas de permissão:
**Solução**: Execute o terminal como Administrador

### Container não inicia:
```bash
# Verificar logs de um serviço específico
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Verificar todos os logs
docker-compose logs
```

## 🔄 Comandos Úteis

```bash
# Ver status dos containers
docker-compose ps

# Ver logs em tempo real
docker-compose logs -f

# Reconstruir apenas um serviço
docker-compose up --build backend

# Executar comando dentro de um container
docker-compose exec backend bash
docker-compose exec postgres psql -U postgres -d sistema_financeiro

# Limpar tudo (cuidado: remove volumes)
docker-compose down -v
docker system prune -a
```

## 📝 Desenvolvimento

Para desenvolvimento, os volumes estão configurados para hot-reload:
- Mudanças no código do backend são refletidas automaticamente
- Mudanças no código do frontend são refletidas automaticamente

## 🔐 Segurança

- As senhas padrão são apenas para desenvolvimento
- Em produção, altere todas as senhas no arquivo `.env`
- Nunca commite o arquivo `.env` no repositório

## 📞 Suporte

Se encontrar problemas:
1. Verifique se o Docker Desktop está rodando
2. Verifique os logs com `docker-compose logs`
3. Tente reconstruir com `docker-compose up --build`
4. Em último caso, limpe tudo com `docker-compose down -v` e tente novamente
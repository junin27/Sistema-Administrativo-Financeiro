# Configuração do Docker - Sistema Administrativo Financeiro

## Pré-requisitos

1. Docker e Docker Compose instalados
2. API Key do Google Gemini (para processamento de PDFs)

## Configuração da API Key do Google Gemini

### Opção 1: Variável de Ambiente no Sistema

No Windows (PowerShell):
```powershell
$env:GEMINI_API_KEY="sua_api_key_aqui"
```

No Linux/Mac:
```bash
export GEMINI_API_KEY="sua_api_key_aqui"
```

### Opção 2: Arquivo .env

Crie um arquivo `.env` na raiz do projeto ou na pasta `backend/`:

```env
GEMINI_API_KEY=sua_api_key_aqui
```

### Opção 3: Editar docker-compose.postgresql.yml

Edite o arquivo `docker-compose.postgresql.yml` e substitua `${GEMINI_API_KEY:-}` pela sua API key:

```yaml
environment:
  - GEMINI_API_KEY=sua_api_key_aqui
```

## Como obter a API Key do Google Gemini

1. Acesse: https://aistudio.google.com/app/apikey
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada
5. Configure usando uma das opções acima

## Iniciar o Sistema

```bash
docker-compose -f docker-compose.postgresql.yml up -d --build
```

## Verificar se está funcionando

```bash
# Ver logs
docker-compose -f docker-compose.postgresql.yml logs -f backend

# Verificar se a API key está configurada
docker-compose -f docker-compose.postgresql.yml exec backend env | grep GEMINI
```

## Parar o Sistema

```bash
docker-compose -f docker-compose.postgresql.yml down
```


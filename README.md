# 🏢 Sistema Administrativo Financeiro

<div align="center">

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

**Sistema completo para gestão financeira com IA integrada**

[📋 Funcionalidades](#-funcionalidades) • [🚀 Instalação](#-instalação) • [📚 Documentação](#-documentação) • [🤝 Contribuição](#-contribuição)

</div>

---

## 📋 Sobre o Projeto

Sistema administrativo financeiro moderno com **processamento inteligente de PDFs** via Google Gemini AI. Desenvolvido com arquitetura limpa e práticas de engenharia de software, oferece gestão completa de fornecedores, contas a pagar/receber e classificação automática de despesas.

### ✨ Principais Características

- 🔍 **Processamento IA**: Extração automática de dados de notas fiscais
- 📊 **Classificação Inteligente**: Categorização automática de despesas
- 🏗️ **Arquitetura Robusta**: Clean Architecture + Repository Pattern
- 🐳 **Containerizado**: Ambientes de desenvolvimento e produção
- 📱 **Interface Moderna**: React 18 + TypeScript + TailwindCSS
- 🔒 **Segurança**: Validação rigorosa e tratamento de erros

---

## 🚀 Tecnologias

### Backend
- **FastAPI** - Framework web moderno e rápido
- **SQLAlchemy** - ORM completo para PostgreSQL
- **Pydantic** - Validação de dados e serialização
- **Alembic** - Migrations de banco de dados

### Frontend
- **React 18** - Biblioteca para interfaces de usuário
- **TypeScript** - Tipagem estática para JavaScript
- **TailwindCSS** - Framework CSS utilitário
- **Vite** - Build tool e dev server ultra-rápido

### IA e Infraestrutura
- **Google Gemini AI** - Processamento de documentos
- **PostgreSQL** - Banco de dados robusto
- **Docker** - Containerização completa
- **Redis** - Cache e sessões (planejado)

---

## 📦 Instalação e Configuração

### Pré-requisitos

- **Python 3.8+** (para o backend)
- **Node.js 18+** e **npm** (para o frontend)
- **PostgreSQL** (banco de dados)
- **Git** (controle de versão)
- **Chave da API do Google Gemini** (para processamento de IA)

### 1️⃣ Clone o Repositório

```bash
git clone <url-do-repositorio>
cd sistema-financeiro
```

### 2️⃣ Configuração do Banco de Dados

Primeiro, configure o PostgreSQL:

1. **Instale o PostgreSQL** em sua máquina
2. **Crie o banco de dados:**
   ```sql
   CREATE DATABASE sistema_financeiro;
   ```
3. **Anote as credenciais** (usuário, senha, host, porta)

### 3️⃣ Configuração do Backend (FastAPI)

#### Passo 1: Navegue para a pasta do backend
```bash
cd backend
```

#### Passo 2: Crie e ative o ambiente virtual
```bash
# Windows
python -m venv venv
.\venv\Scripts\Activate.ps1

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

#### Passo 3: Instale as dependências
```bash
pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic pydantic-settings alembic python-multipart google-generativeai
```

#### Passo 4: Configure o arquivo .env
Crie um arquivo `.env` na pasta `backend` com:
```env
# Database Configuration
DATABASE_URL=postgresql://postgres:sua_senha@localhost:5432/sistema_financeiro

# Google Gemini AI Configuration
GEMINI_API_KEY=sua_chave_gemini_aqui

# Application Configuration
APP_NAME=Sistema Administrativo Financeiro
DEBUG=True
SECRET_KEY=dev-secret-key-change-in-production

# CORS Configuration (para permitir frontend)
ALLOWED_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]
```

#### Passo 5: Execute o servidor backend
```bash
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

O backend estará rodando em: **http://localhost:8000**

### 4️⃣ Configuração do Frontend (React)

#### Passo 1: Abra um novo terminal e navegue para a pasta do frontend
```bash
cd frontend
```

#### Passo 2: Instale as dependências
```bash
npm install
```

#### Passo 3: Configure o arquivo .env (se necessário)
Crie um arquivo `.env` na pasta `frontend` com:
```env
VITE_API_URL=http://localhost:8000
```

#### Passo 4: Execute o servidor frontend
```bash
npm run dev
```

O frontend estará rodando em: **http://localhost:3000**

### 5️⃣ Configuração da IA (Google Gemini)

1. **Acesse o Google AI Studio:** https://makersuite.google.com/app/apikey
2. **Crie uma nova API Key**
3. **Adicione a chave no arquivo `.env` do backend:**
   ```env
   GEMINI_API_KEY=sua_chave_gemini_aqui
   ```

### 6️⃣ Verificação da Instalação

1. **Backend:** Acesse http://localhost:8000/health
   - Deve retornar status "healthy"
   
2. **Frontend:** Acesse http://localhost:3000
   - Deve carregar a interface do sistema
   
3. **API Docs:** Acesse http://localhost:8000/docs
   - Documentação interativa da API

## 🚀 Executando o Projeto

### Sequência de Inicialização

1. **Primeiro Terminal - Backend:**
   ```bash
   cd backend
   .\venv\Scripts\Activate.ps1  # Windows
   # source venv/bin/activate   # Linux/Mac
   uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Segundo Terminal - Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

### Comandos Úteis

#### Backend
```bash
# Ativar ambiente virtual
.\venv\Scripts\Activate.ps1  # Windows
source venv/bin/activate     # Linux/Mac

# Executar servidor
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Executar com logs detalhados
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000 --log-level debug
```

#### Frontend
```bash
# Modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview

# Verificar tipos TypeScript
npm run type-check

# Linting
npm run lint
```

---

## 🌐 Acessos

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | http://localhost:3000 | Interface principal |
| **API Backend** | http://localhost:8000 | API REST |
| **Documentação** | http://localhost:8000/docs | Swagger UI |

---

## 📋 Funcionalidades

### ✅ Implementadas

#### 🏢 Gestão de Fornecedores
- Cadastro completo com validação de CNPJ
- Busca por razão social e nome fantasia
- Soft delete com inativação/reativação
- Histórico de alterações

#### 📄 Processamento de PDFs
- Upload de notas fiscais
- Extração automática via Google Gemini AI
- Classificação inteligente de despesas
- Geração automática de contas a pagar

#### 💰 Contas a Pagar/Receber
- Múltiplas parcelas por conta
- Controle de vencimentos
- Integração com fornecedores/clientes
- Status de pagamento

#### 🏷️ Classificações de Despesa
- Categorias pré-definidas
- Classificação automática por IA
- Percentual de confiança
- Ajustes manuais

#### 🧠 Sistema de Confiança IA
- **Algoritmo de Confiança**: Baseado em análise de keywords
- **Múltiplas Categorias**: Até 3 classificações por despesa
- **Threshold Inteligente**: Confiança mínima de 30%
- **Boost Automático**: Multiplicador para múltiplas keywords

---

## 🏗️ Arquitetura

```
sistema-financeiro/
├── backend/                 # API FastAPI
│   ├── src/
│   │   ├── config/         # Configurações
│   │   ├── models/         # Modelos SQLAlchemy
│   │   ├── schemas/        # Schemas Pydantic
│   │   ├── agent/         # Lógica de negócio e IA
│   │   ├── repositories/   # Acesso a dados
│   │   ├── routers/        # Endpoints da API
│   │   └── core/          # Exceções e constantes
│   ├── migrations/        # Migrations Alembic
│   └── requirements.txt   # Dependências Python
├── frontend/              # Interface React
│   ├── src/
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── pages/        # Páginas da aplicação
│   │   ├── services/     # Camada de API
│   │   ├── types/        # Tipos TypeScript
│   │   └── utils/        # Utilitários
│   ├── package.json      # Dependências Node.js
│   └── vite.config.ts    # Configuração Vite
├── docker-compose.yml    # Orquestração Docker
├── .env.example         # Template de ambiente
└── README.md           # Documentação
```

### 🎯 Princípios Arquiteturais

- **Clean Architecture** - Separação clara de responsabilidades
- **SOLID Principles** - Princípios de design orientado a objetos
- **Repository Pattern** - Abstração de acesso a dados
- **Dependency Injection** - Inversão de controle
- **Domain-Driven Design** - Modelagem orientada ao domínio

---

## 🧠 Algoritmo de Confiança IA

### 📊 Como Funciona o Cálculo de Confiança

O sistema utiliza um algoritmo inteligente para calcular o nível de confiança na classificação automática de despesas. O cálculo está implementado no arquivo:

**📍 Localização:** `backend/src/agent/pdf_processing.py`

#### 🔍 Método Principal: `_calculate_classification_confidence`

```python
# Linhas 513-535 do arquivo pdf_processing.py
def _calculate_classification_confidence(
    self, 
    texto: str, 
    descricao: str, 
    keywords: List[str]
) -> float:
    """Calcula confiança da classificação baseada em keywords."""
    
    total_keywords = len(keywords)
    found_keywords = 0
    
    for keyword in keywords:
        if keyword in texto or keyword in descricao:
            found_keywords += 1
    
    # Confiança básica baseada na proporção de keywords encontradas
    base_confidence = found_keywords / total_keywords
    
    # Boost adicional se múltiplas keywords foram encontradas
    if found_keywords > 1:
        base_confidence *= 1.2
    
    return min(base_confidence, 1.0)
```

#### 🎯 Fórmula do Algoritmo

1. **Confiança Base** = `keywords_encontradas / total_keywords`
2. **Boost Múltiplas Keywords** = `confiança_base × 1.2` (se > 1 keyword)
3. **Confiança Final** = `min(resultado, 1.0)` (máximo 100%)

#### 📋 Sistema de Keywords por Categoria

O sistema utiliza **palavras-chave (keywords)** para identificar automaticamente a categoria da despesa. Cada categoria possui uma lista específica de termos que são procurados tanto no **texto completo** da nota fiscal quanto na **descrição dos produtos**.

### 🔍 **Como Funcionam as Keywords:**

- **Busca Inteligente**: O sistema procura as keywords no texto em **lowercase** (minúsculas)
- **Peso Duplo**: Keywords encontradas na **descrição dos produtos** valem mais que no texto geral
- **Múltiplas Detecções**: Quanto mais keywords encontradas, maior a confiança
- **Boost Específico**: Cada categoria tem um multiplicador de confiança próprio

### 📊 **8 Categorias e suas Keywords:**

#### 🌱 **1. INSUMOS AGRÍCOLAS** (Boost: 0.95)
```
Sementes: semente, sementes, milho, soja, feijão, arroz, trigo

Fertilizantes: fertilizante, adubo, ureia, npk, superfosfato, 
cloreto de potássio, sulfato de amônio, fosfato, nitrato

Defensivos: defensivo, herbicida, inseticida, fungicida, pesticida, 
agrotóxico, roundup, glifosato, atrazina

Corretivos: corretivo, calcário, cal, gesso, micronutriente, inoculante
```

#### 🔧 **2. MANUTENÇÃO E OPERAÇÃO** (Boost: 0.90)
```
Combustíveis: combustível, diesel, gasolina, álcool, etanol, óleo, 
lubrificante, graxa, fluido hidráulico, s10, aditivado, b s10

Peças: peça, peças, parafuso, porca, arruela, rolamento, vedação, 
componente, reparo, reposição, tubo, cabo, kit, fixação, fixacoes, 
din, bucha, anel, junta

Manutenção: manutenção, conserto, oficina, mecânico, soldagem

Consumíveis: pneu, pneus, filtro, correia, mangueira, vela, bateria
```

#### 👥 **3. RECURSOS HUMANOS** (Boost: 0.95)
```
Mão de Obra: mão de obra, trabalhador, funcionário, operário, 
diarista, temporário, safrista

Encargos: salário, ordenado, pagamento, encargo, fgts, inss, 
vale transporte, vale refeição, cesta básica, 13º salário, 
férias, rescisão
```

#### 🚚 **4. SERVIÇOS OPERACIONAIS** (Boost: 0.90)
```
Transporte: frete, transporte, carreto, mudança, logística

Terceirizados: colheita, terceirizada, colheitadeira, prestação de serviço

Armazenagem: secagem, armazenagem, silo, estocagem, beneficiamento

Aplicações: pulverização, aplicação, plantio, semeadura, cultivo
```

#### 🏗️ **5. INFRAESTRUTURA E UTILIDADES** (Boost: 0.85)
```
Energia: energia, elétrica, eletricidade, luz, força

Propriedade: arrendamento, aluguel, terra, propriedade, hectare

Construção: construção, reforma, obra, edificação, ampliação

Materiais: material, concreto, cimento, ferro, madeira, tijolo, 
telha, tinta, hidráulico, elétrico
```

#### 📋 **6. ADMINISTRATIVAS** (Boost: 0.90)
```
Honorários: honorário, contábil, advocatício, agronômico, 
consultoria, assessoria, auditoria, perícia

Bancárias: despesa bancária, financeira, juros, tarifa, anuidade, 
cartão, conta corrente, empréstimo
```

#### 🛡️ **7. SEGUROS E PROTEÇÃO** (Boost: 0.95)
```
Seguros: seguro, agrícola, rural, safra, produtividade, ativo, 
máquina, veículo, equipamento, prestamista, vida, proteção, 
cobertura, sinistro
```

#### 💰 **8. IMPOSTOS E TAXAS** (Boost: 0.98)
```
Impostos Rurais: itr, iptu, ipva, incra, ccir

Impostos Gerais: imposto, taxa, contribuição, tributo, icms, 
ipi, pis, cofins, ir, csll, simples
```

### ⚙️ **Configuração das Keywords:**

As keywords estão definidas no arquivo:
**📍 `backend/src/agent/pdf_processing.py` (linhas 52-168)**

```python
self.classification_rules = {
    "INSUMOS AGRÍCOLAS": {
        "keywords": ["semente", "fertilizante", "adubo", ...],
        "confidence_boost": 0.95
    },
    # ... outras categorias
}
```

### 🎯 **Como Personalizar:**

Para adicionar novas keywords ou categorias:

1. **Edite o arquivo**: `backend/src/agent/pdf_processing.py`
2. **Localize o método**: `_setup_classification_rules()` (linha 52)
3. **Adicione keywords** na lista da categoria desejada
4. **Reinicie o backend** para aplicar as mudanças

### 📈 **Exemplo de Detecção:**

Para uma nota com descrição: *"Compra de óleo diesel S10 aditivado"*

```
✅ Categoria: MANUTENÇÃO E OPERAÇÃO
✅ Keywords encontradas: ["óleo", "diesel", "s10", "aditivado"]
✅ Confiança: 4/25 keywords = 16% × 1.5 (boost descrição) = 24%
✅ Resultado: Classificação aceita (> 15% threshold)
```

#### ⚙️ Processo de Classificação Atualizado

```python
# Linhas 465-511 do arquivo pdf_processing.py
def _apply_automatic_classification(self, dados, texto_original):
    """Aplica classificação automática de despesas baseada em keywords."""
    
    # 1. Converte texto para lowercase
    texto_lower = texto_original.lower()
    descricao_lower = dados.descricao_produtos.lower()
    
    # 2. Para cada categoria, calcula confiança
    for categoria, rules in self.classification_rules.items():
        confidence = self._calculate_classification_confidence(
            texto_lower, descricao_lower, rules["keywords"]
        )
        
        # 3. Aplica threshold mínimo de 15%
        if confidence > 0.15:
            # Adiciona classificação
            
    # 4. Ordena por confiança (maior primeiro)
    # 5. Retorna até 3 melhores classificações
```

#### 🎛️ Parâmetros Configuráveis (Versão Atual)

- **Threshold Mínimo**: `0.15` (15% de confiança)
- **Boost Múltiplas Keywords**: `1.2` (20% adicional)
- **Boost Descrição**: `1.5` (50% adicional se keyword na descrição)
- **Penalização Fiscal**: `0.3` (70% redução para impostos sem match na descrição)
- **Máximo Classificações**: `3` por despesa
- **Confiança Máxima**: `1.0` (100%)

#### 📈 Exemplo Prático Atualizado

Para uma nota fiscal com descrição: *"15.000,00 L de ÓLEO DIESEL B S10 ADITIVADO"*

1. **Categoria**: MANUTENÇÃO E OPERAÇÃO
2. **Keywords da categoria**: [combustível, diesel, óleo, s10, aditivado, ...]
3. **Keywords encontradas na descrição**: óleo, diesel, s10, aditivado (4 de 25)
4. **Confiança base**: 4/25 = 0.16 (16%)
5. **Boost múltiplas**: 0.16 × 1.2 = 0.192
6. **Boost descrição**: 0.192 × 1.5 = 0.288
7. **Confiança final**: 28.8%

✅ **Resultado**: Classificação aceita (28.8% > 15% threshold)

---

## 🔧 Troubleshooting

### Problemas Comuns

#### ❌ Erro de Conexão com Banco de Dados
```
sqlalchemy.exc.OperationalError: could not connect to server
```
**Solução:**
1. Verifique se o PostgreSQL está rodando
2. Confirme as credenciais no arquivo `.env`
3. Teste a conexão: `psql -h localhost -U postgres -d sistema_financeiro`

#### ❌ Erro de Importação no Backend
```
ModuleNotFoundError: No module named 'fastapi'
```
**Solução:**
1. Ative o ambiente virtual: `.\venv\Scripts\Activate.ps1`
2. Instale as dependências: `pip install -r requirements.txt` (ou os comandos do passo 3)

#### ❌ Erro de Porta Ocupada
```
Error: Port 8000 is already in use
```
**Solução:**
1. Mate o processo: `netstat -ano | findstr :8000` (Windows)
2. Ou use outra porta: `uvicorn src.main:app --reload --port 8001`

#### ❌ Frontend não conecta com Backend
**Solução:**
1. Verifique se o backend está rodando em `http://localhost:8000`
2. Confirme o CORS no arquivo `.env` do backend
3. Verifique o arquivo `.env` do frontend com `VITE_API_URL=http://localhost:8000`

#### ❌ Erro de API Key do Gemini
```
google.api_core.exceptions.Unauthenticated: 401 API key not valid
```
**Solução:**
1. Verifique se a API Key está correta no `.env`
2. Confirme se a API Key tem permissões para Gemini AI
3. Teste a key em: https://makersuite.google.com/

### Logs e Debug

#### Backend
```bash
# Logs detalhados
uvicorn src.main:app --reload --log-level debug

# Verificar saúde da aplicação
curl http://localhost:8000/health
```

#### Frontend
```bash
# Console do navegador (F12)
# Verificar erros de rede na aba Network
# Verificar console para erros JavaScript
```

---

## 🔧 Desenvolvimento

### 🚀 Início Rápido (Para Desenvolvedores)

Se você já tem Python, Node.js e PostgreSQL instalados:

```bash
# 1. Clone e entre no projeto
git clone <url-do-repositorio>
cd sistema-financeiro

# 2. Configure o banco
createdb sistema_financeiro  # ou via pgAdmin

# 3. Backend (Terminal 1)
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows
pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic pydantic-settings alembic python-multipart google-generativeai
# Configure o .env com suas credenciais
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# 4. Frontend (Terminal 2)
cd frontend
npm install
npm run dev
```

### Estrutura de Pastas

```
sistema-financeiro/
├── 📁 backend/                 # API FastAPI
│   ├── 📁 src/
│   │   ├── 📁 config/         # Configurações (database.py, settings.py)
│   │   ├── 📁 models/         # Modelos SQLAlchemy
│   │   ├── 📁 schemas/        # Schemas Pydantic (validação)
│   │   ├── 📁 agent/         # Lógica de negócio e IA
│   │   ├── 📁 repositories/   # Acesso a dados
│   │   ├── 📁 routers/        # Endpoints da API
│   │   ├── 📁 core/          # Exceções e constantes
│   │   └── 📄 main.py        # Aplicação principal
│   ├── 📁 venv/              # Ambiente virtual Python
│   └── 📄 .env               # Variáveis de ambiente
├── 📁 frontend/               # Interface React
│   ├── 📁 src/
│   │   ├── 📁 components/    # Componentes reutilizáveis
│   │   ├── 📁 pages/        # Páginas da aplicação
│   │   ├── 📁 services/     # Camada de API
│   │   ├── 📁 types/        # Tipos TypeScript
│   │   └── 📁 utils/        # Utilitários
│   ├── 📄 package.json      # Dependências Node.js
│   ├── 📄 vite.config.ts    # Configuração Vite
│   └── 📄 .env             # Variáveis de ambiente
└── 📄 README.md            # Este arquivo
```

### 🧪 Testes

```bash
# Backend (quando implementados)
cd backend
pytest

# Frontend
cd frontend
npm run test        # Testes unitários
npm run test:ui     # Testes visuais (se configurado)
```

### 📝 Migrations (Banco de Dados)

```bash
# Entrar no ambiente do backend
cd backend
.\venv\Scripts\Activate.ps1

# Criar nova migration
alembic revision --autogenerate -m "Descrição da mudança"

# Aplicar migrations
alembic upgrade head
```

---

## 📚 Documentação da API

Acesse a documentação interativa da API:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **OpenAPI Schema:** http://localhost:8000/openapi.json

---

## 🤝 Contribuição

Contribuições são muito bem-vindas! Siga estes passos:

1. **Fork** o projeto
2. **Crie** sua branch de feature (`git checkout -b feature/nova-funcionalidade`)
3. **Commit** suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. **Push** para a branch (`git push origin feature/nova-funcionalidade`)
5. **Abra** um Pull Request

### 📋 Diretrizes para Contribuição

- Mantenha os testes atualizados
- Siga os padrões de código estabelecidos
- Documente novas funcionalidades
- Use conventional commits
- Atualize a documentação quando necessário

---

<div align="center">

[⭐ Star no GitHub](https://github.com/seu-usuario/sistema-financeiro) •
[🐛 Reportar Bug](https://github.com/seu-usuario/sistema-financeiro/issues) •

---

*Última atualização: 24 de setembro de 2025*</div>

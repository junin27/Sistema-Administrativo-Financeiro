# Sistema Administrativo Financeiro# 🏢 Sistema Administrativo Financeiro



Sistema de gestão financeira com processamento inteligente de documentos PDF usando IA (Google Gemini).<div align="center">



## 📋 Índice[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)

- [Sobre o Projeto](#sobre-o-projeto)[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

- [Tecnologias Utilizadas](#tecnologias-utilizadas)[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

- [Arquitetura](#arquitetura)[![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

- [Funcionalidades](#funcionalidades)

- [Pré-requisitos](#pré-requisitos)**Sistema completo para gestão financeira com IA integrada**

- [Instalação e Configuração](#instalação-e-configuração)

- [Como Rodar o Projeto](#como-rodar-o-projeto)[📋 Funcionalidades](#-funcionalidades) • [🚀 Instalação](#-instalação) • [📚 Documentação](#-documentação) • [🤝 Contribuição](#-contribuição)

- [Configuração do DBeaver](#configuração-do-dbeaver)

- [Possíveis Problemas e Soluções](#possíveis-problemas-e-soluções)</div>

- [Estrutura do Banco de Dados](#estrutura-do-banco-de-dados)

- [Endpoints da API](#endpoints-da-api)---



---## 📋 Sobre o Projeto



## 🎯 Sobre o ProjetoSistema administrativo financeiro moderno com **processamento inteligente de PDFs** via Google Gemini AI. Desenvolvido com arquitetura limpa e práticas de engenharia de software, oferece gestão completa de fornecedores, contas a pagar/receber e classificação automática de despesas.



Sistema completo de gestão financeira desenvolvido para automatizar o processamento de notas fiscais e documentos financeiros. Utiliza Inteligência Artificial (Google Gemini) para extrair informações de PDFs automaticamente, reduzindo trabalho manual e aumentando a precisão dos dados.### ✨ Principais Características



### Características Principais:- 🔍 **Processamento IA**: Extração automática de dados de notas fiscais

- 📊 **Classificação Inteligente**: Categorização automática de despesas

- ✅ **Upload e processamento automático de PDFs** com IA- 🏗️ **Arquitetura Robusta**: Clean Architecture + Repository Pattern

- ✅ **Extração inteligente** de dados de notas fiscais (fornecedor, valores, datas, itens)- 🐳 **Containerizado**: Ambientes de desenvolvimento e produção

- ✅ **Gestão completa** de pessoas (fornecedores, clientes, faturados)- 📱 **Interface Moderna**: React 18 + TypeScript + TailwindCSS

- ✅ **Controle de movimentações** financeiras (receitas e despesas)- 🔒 **Segurança**: Validação rigorosa e tratamento de erros

- ✅ **Sistema de parcelas** para pagamentos

- ✅ **Classificações múltiplas** por movimento (many-to-many)---

- ✅ **Soft delete** - registros nunca são excluídos, apenas inativados

- ✅ **Interface moderna** e responsiva## 🚀 Tecnologias



---### Backend

- **FastAPI** - Framework web moderno e rápido

## 🚀 Tecnologias Utilizadas- **SQLAlchemy** - ORM completo para PostgreSQL

- **Pydantic** - Validação de dados e serialização

### Backend- **Alembic** - Migrations de banco de dados

- **Python 3.11+** - Linguagem de programação

- **FastAPI** - Framework web moderno e rápido### Frontend

- **SQLAlchemy** - ORM para banco de dados- **React 18** - Biblioteca para interfaces de usuário

- **PostgreSQL 15** - Banco de dados relacional- **TypeScript** - Tipagem estática para JavaScript

- **Google Gemini AI** - Processamento inteligente de PDFs- **TailwindCSS** - Framework CSS utilitário

- **Pydantic** - Validação de dados- **Vite** - Build tool e dev server ultra-rápido

- **Uvicorn** - Servidor ASGI

### IA e Infraestrutura

### Frontend- **Google Gemini AI** - Processamento de documentos

- **React 18** - Biblioteca JavaScript para UI- **PostgreSQL** - Banco de dados robusto

- **TypeScript 5** - Tipagem estática- **Docker** - Containerização completa

- **Vite** - Build tool moderna- **Redis** - Cache e sessões (planejado)

- **TailwindCSS** - Framework CSS utilitário

- **React Router** - Roteamento---



### DevOps## 📦 Instalação e Configuração

- **Docker** - Containerização

- **Docker Compose** - Orquestração de containers### Pré-requisitos

- **PostgreSQL Alpine** - Imagem leve do banco

- **Python 3.8+** (para o backend)

---- **Node.js 18+** e **npm** (para o frontend)

- **PostgreSQL** (banco de dados)

## 🏗️ Arquitetura- **Git** (controle de versão)

- **Chave da API do Google Gemini** (para processamento de IA)

### Padrões Aplicados:

- **Clean Architecture** - Separação de responsabilidades### 1️⃣ Clone o Repositório

- **Repository Pattern** - Abstração de acesso a dados

- **Service Layer** - Lógica de negócio isolada```bash

- **SOLID Principles** - Código limpo e manutenívelgit clone <url-do-repositorio>

- **Alta Coesão, Baixo Acoplamento**cd sistema-financeiro

```

### Estrutura do Projeto:

### 2️⃣ Configuração do Banco de Dados

```

Sistema-Administrativo-Financeiro/Primeiro, configure o PostgreSQL:

├── backend/

│   ├── src/1. **Instale o PostgreSQL** em sua máquina

│   │   ├── agent/           # Processamento de PDF com IA2. **Crie o banco de dados:**

│   │   ├── config/          # Configurações e database   ```sql

│   │   ├── models/          # Modelos SQLAlchemy   CREATE DATABASE sistema_financeiro;

│   │   ├── repositories/    # Camada de acesso a dados   ```

│   │   ├── routers/         # Endpoints da API3. **Anote as credenciais** (usuário, senha, host, porta)

│   │   ├── schemas/         # Validação Pydantic

│   │   └── main.py          # Aplicação FastAPI### 3️⃣ Configuração do Backend (FastAPI)

│   ├── Dockerfile

│   └── requirements.txt#### Passo 1: Navegue para a pasta do backend

├── frontend/```bash

│   ├── src/cd backend

│   │   ├── components/      # Componentes React```

│   │   ├── pages/           # Páginas da aplicação

│   │   ├── services/        # Chamadas à API#### Passo 2: Crie e ative o ambiente virtual

│   │   └── types/           # Tipos TypeScript```bash

│   ├── Dockerfile# Windows

│   └── package.jsonpython -m venv venv

└── docker-compose.postgresql.yml.\venv\Scripts\Activate.ps1

```

# Linux/Mac

---python3 -m venv venv

source venv/bin/activate

## ⚙️ Funcionalidades```



### 1. Gestão de Pessoas#### Passo 3: Instale as dependências

- Cadastro de fornecedores, clientes e faturados```bash

- Suporte a CPF e CNPJpip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic pydantic-settings alembic python-multipart google-generativeai

- Informações completas (razão social, contato, endereço)```

- Soft delete (inativação ao invés de exclusão)

#### Passo 4: Configure o arquivo .env

### 2. Movimentações FinanceirasCrie um arquivo `.env` na pasta `backend` com:

- Registro de receitas e despesas```env

- Vinculação com fornecedores/clientes# Database Configuration

- Suporte a notas fiscaisDATABASE_URL=postgresql://postgres:sua_senha@localhost:5432/sistema_financeiro

- Descrição detalhada

- Controle de status (ativo/inativo)# Google Gemini AI Configuration
GEMINI_API_KEY=sua_chave_gemini_aqui
# Modelo padrão: gemini-2.0-flash-lite (recomendado para plano gratuito - limites maiores)
# Alternativas: gemini-2.5-flash, gemini-2.0-flash, gemini-2.5-pro
GEMINI_MODEL=gemini-2.0-flash-lite

### 3. Sistema de Parcelas

- Divisão de pagamentos em múltiplas parcelas# Application Configuration

- Controle de vencimentoAPP_NAME=Sistema Administrativo Financeiro

- Rastreamento de pagamentosDEBUG=True

- Vinculação com movimentosSECRET_KEY=dev-secret-key-change-in-production



### 4. Classificações# CORS Configuration (para permitir frontend)

- Sistema de categorização flexívelALLOWED_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]

- Many-to-many com movimentos (um movimento pode ter várias classificações)```

- Descrição e categoria personalizáveis

#### Passo 5: Execute o servidor backend

### 5. Processamento Inteligente de PDF```bash

- **Upload de notas fiscais** em PDFuvicorn src.main:app --reload --host 0.0.0.0 --port 8000

- **Extração automática** via IA Gemini:```

  - Dados do fornecedor (CNPJ, razão social, endereço)

  - Dados do cliente/faturadoO backend estará rodando em: **http://localhost:8000**

  - Itens da nota (descrição, quantidade, valores)

  - Totais e impostos### 4️⃣ Configuração do Frontend (React)

  - Data de emissão

- **Criação automática** de registros no banco#### Passo 1: Abra um novo terminal e navegue para a pasta do frontend

- **Log detalhado** do processamento```bash

cd frontend

---```



## 📦 Pré-requisitos#### Passo 2: Instale as dependências

```bash

### Obrigatórios:npm install

- **Docker Desktop** 4.0+ ([Download](https://www.docker.com/products/docker-desktop))```

- **Git** ([Download](https://git-scm.com/downloads))

#### Passo 3: Configure o arquivo .env (se necessário)

### Opcional:Crie um arquivo `.env` na pasta `frontend` com:

- **DBeaver** - Para visualizar o banco de dados ([Download](https://dbeaver.io/download/))```env

VITE_API_URL=http://localhost:8000

---```



## 🔧 Instalação e Configuração#### Passo 4: Execute o servidor frontend

```bash

### Passo 1: Instalar Docker Desktopnpm run dev

```

1. Baixe o Docker Desktop em: https://www.docker.com/products/docker-desktop

2. Execute o instaladorO frontend estará rodando em: **http://localhost:3000**

3. **IMPORTANTE:** Durante a instalação:

   - Marque "Use WSL 2 instead of Hyper-V"### 5️⃣ Configuração da IA (Google Gemini)

   - Reinicie o computador quando solicitado

4. Após reiniciar, abra o Docker Desktop1. **Acesse o Google AI Studio:** https://makersuite.google.com/app/apikey

5. Aguarde inicializar completamente (ícone deve ficar verde)2. **Crie uma nova API Key**

3. **Adicione a chave no arquivo `.env` do backend:**

### Passo 2: Verificar instalação do Docker   ```env
   GEMINI_API_KEY=sua_chave_gemini_aqui
   # Modelo padrão: gemini-2.0-flash-lite (recomendado para plano gratuito - limites maiores)
   # Alternativas: gemini-2.5-flash, gemini-2.0-flash, gemini-2.5-pro
   GEMINI_MODEL=gemini-2.0-flash-lite
   ```

Abra o **PowerShell** e execute:   ```



```powershell### 5️⃣.1 Configuração do Modelo Gemini

O sistema usa por padrão o modelo **`gemini-2.5-flash`**, que é o mais recente e estável. 

**Modelos disponíveis:**
- `gemini-2.0-flash-lite` - **Recomendado para plano gratuito** (padrão) - Mais leve, limites maiores, menor consumo de quota
- `gemini-2.5-flash` - Mais recente, mas consome mais quota
- `gemini-2.0-flash` - Alternativa estável
- `gemini-2.5-pro` - Mais poderoso, mas mais lento e consome mais quota

**Como verificar modelos disponíveis na sua API:**
```bash
docker-compose -f docker-compose.postgresql.yml exec backend python test_models.py
```

**Como alterar o modelo:**
1. Edite `backend/src/config/settings.py` e altere o valor padrão de `gemini_model`
2. Ou configure via variável de ambiente no docker-compose:
   ```yaml
   environment:
     - GEMINI_MODEL=gemini-2.5-flash
   ```

### 6️⃣ Verificação da Instalação

docker --version

docker-compose --version1. **Backend:** Acesse http://localhost:8000/health

```   - Deve retornar status "healthy"

   

Deve mostrar as versões instaladas.2. **Frontend:** Acesse http://localhost:3000

   - Deve carregar a interface do sistema

### Passo 3: Clonar o Repositório   

3. **API Docs:** Acesse http://localhost:8000/docs

```powershell   - Documentação interativa da API

# Navegue até onde deseja salvar o projeto

cd C:\Users\SeuUsuario\Desktop## 🚀 Executando o Projeto



# Clone o repositório### Sequência de Inicialização

git clone https://github.com/junin27/Sistema-Administrativo-Financeiro.git

1. **Primeiro Terminal - Backend:**

# Entre na pasta   ```bash

cd Sistema-Administrativo-Financeiro   cd backend

```   .\venv\Scripts\Activate.ps1  # Windows

   # source venv/bin/activate   # Linux/Mac

---   uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

   ```

## 🚀 Como Rodar o Projeto

2. **Segundo Terminal - Frontend:**

### 1. Iniciar todos os serviços   ```bash

   cd frontend

No PowerShell, na pasta do projeto:   npm run dev

   ```

```powershell

docker-compose -f docker-compose.postgresql.yml up -d### Comandos Úteis

```

#### Backend

**O que esse comando faz:**```bash

- `-d` = roda em background (modo daemon)# Ativar ambiente virtual

- Cria e inicia 3 containers automaticamente:.\venv\Scripts\Activate.ps1  # Windows

  - `sistema_financeiro_postgres` - Banco de dados PostgreSQL (porta 54320)source venv/bin/activate     # Linux/Mac

  - `sistema_financeiro_backend` - API FastAPI (porta 8000)

  - `sistema_financeiro_frontend` - Interface React (porta 3000)# Executar servidor

uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

### 2. Aguardar inicialização (30-60 segundos)

# Executar com logs detalhados

O backend aguarda o PostgreSQL ficar "healthy" antes de iniciar. Durante esse tempo:uvicorn src.main:app --reload --host 0.0.0.0 --port 8000 --log-level debug

- PostgreSQL inicia e aceita conexões```

- Backend cria o banco `sistema_financeiro` automaticamente

- Backend cria as 5 tabelas via ORM (SQLAlchemy)#### Frontend

- Frontend compila e inicia o servidor de desenvolvimento```bash

# Modo desenvolvimento

### 3. Verificar se está rodandonpm run dev



```powershell# Build para produção

docker psnpm run build

```

# Preview da build

Você deve ver 3 containers com STATUS "Up":npm run preview



```# Verificar tipos TypeScript

CONTAINER ID   IMAGE                  STATUSnpm run type-check

xxxxxxxxxxxx   postgres:15-alpine     Up X seconds (healthy)

xxxxxxxxxxxx   ...-backend            Up X seconds# Linting

xxxxxxxxxxxx   ...-frontend           Up X secondsnpm run lint

``````



### 4. Acessar a aplicação---



- **Frontend (Interface):** http://localhost:3000## 🌐 Acessos

- **Backend (API):** http://localhost:8000

- **Documentação da API:** http://localhost:8000/docs| Serviço | URL | Descrição |

- **PostgreSQL:** localhost:54320|---------|-----|-----------|

| **Frontend** | http://localhost:3000 | Interface principal |

### 5. Verificar logs (opcional)| **API Backend** | http://localhost:8000 | API REST |

| **Documentação** | http://localhost:8000/docs | Swagger UI |

```powershell

# Ver logs do backend---

docker logs sistema_financeiro_backend

## 📋 Funcionalidades

# Ver logs do PostgreSQL

docker logs sistema_financeiro_postgres### ✅ Implementadas



# Ver logs do frontend#### 🏢 Gestão de Fornecedores

docker logs sistema_financeiro_frontend- Cadastro completo com validação de CNPJ

- Busca por razão social e nome fantasia

# Acompanhar logs em tempo real- Soft delete com inativação/reativação

docker logs -f sistema_financeiro_backend- Histórico de alterações

```

#### 📄 Processamento de PDFs

Procure por:- Upload de notas fiscais

- `✅ Tabelas criadas com sucesso!`- Extração automática via Google Gemini AI

- `📊 Tabelas disponíveis: ['pessoas', 'movimento_contas', ...]`- Classificação inteligente de despesas

- `Aplicação iniciada com sucesso!`- Geração automática de contas a pagar



### 6. Parar os serviços#### 💰 Contas a Pagar/Receber

- Múltiplas parcelas por conta

```powershell- Controle de vencimentos

docker-compose -f docker-compose.postgresql.yml down- Integração com fornecedores/clientes

```- Status de pagamento



### 7. Reiniciar do zero (apaga o banco de dados)#### 🏷️ Classificações de Despesa

- Categorias pré-definidas

**CUIDADO:** Isso remove todos os dados!- Classificação automática por IA

- Percentual de confiança

```powershell- Ajustes manuais

# Parar tudo

docker-compose -f docker-compose.postgresql.yml down#### 🧠 Sistema de Confiança IA

- **Algoritmo de Confiança**: Baseado em análise de keywords

# Remover volumes (apaga o banco!)- **Múltiplas Categorias**: Até 3 classificações por despesa

docker volume rm sistema-administrativo-financeiro_postgres_data- **Threshold Inteligente**: Confiança mínima de 30%

- **Boost Automático**: Multiplicador para múltiplas keywords

# Subir novamente

docker-compose -f docker-compose.postgresql.yml up -d---

```

## 🏗️ Arquitetura

---

```

## 🗄️ Configuração do DBeaversistema-financeiro/

├── backend/                 # API FastAPI

### Por que DBeaver?│   ├── src/

Para visualizar, consultar e gerenciar o banco de dados PostgreSQL de forma visual.│   │   ├── config/         # Configurações

│   │   ├── models/         # Modelos SQLAlchemy

### Passo a Passo Detalhado:│   │   ├── schemas/        # Schemas Pydantic

│   │   ├── agent/         # Lógica de negócio e IA

#### 1. Baixar e Instalar DBeaver│   │   ├── repositories/   # Acesso a dados

│   │   ├── routers/        # Endpoints da API

- Download: https://dbeaver.io/download/│   │   └── core/          # Exceções e constantes

- Escolha "Community Edition" (gratuita)│   ├── migrations/        # Migrations Alembic

- Execute o instalador│   └── requirements.txt   # Dependências Python

- Abra o DBeaver├── frontend/              # Interface React

│   ├── src/

#### 2. Criar Nova Conexão│   │   ├── components/    # Componentes reutilizáveis

│   │   ├── pages/        # Páginas da aplicação

- Menu: **Database** → **New Database Connection**│   │   ├── services/     # Camada de API

- Ou clique no ícone de "plug" (New Connection) na barra de ferramentas│   │   ├── types/        # Tipos TypeScript

- Selecione: **PostgreSQL**│   │   └── utils/        # Utilitários

- Clique em **Next**│   ├── package.json      # Dependências Node.js

│   └── vite.config.ts    # Configuração Vite

#### 3. Configurar Conexão├── docker-compose.yml    # Orquestração Docker

├── .env.example         # Template de ambiente

**⚠️ ATENÇÃO: Use EXATAMENTE estas configurações:**└── README.md           # Documentação

```

```

Host: localhost### 🎯 Princípios Arquiteturais

Port: 54320  ← IMPORTANTE! NÃO é 5432!

Database: (deixe VAZIO - não preencha nada)- **Clean Architecture** - Separação clara de responsabilidades

Username: postgres- **SOLID Principles** - Princípios de design orientado a objetos

Password: postgres- **Repository Pattern** - Abstração de acesso a dados

```- **Dependency Injection** - Inversão de controle

- **Domain-Driven Design** - Modelagem orientada ao domínio

**Importante:**

- ✅ Marque: **"Save password"** (para não precisar digitar toda vez)---

- ✅ Marque: **"Show all databases"** (se disponível)

- ❌ **NÃO** preencha o campo "Database" - deixe em branco!## 🧠 Algoritmo de Confiança IA



#### 4. Testar Conexão### 📊 Como Funciona o Cálculo de Confiança



- Clique em **"Test Connection..."**O sistema utiliza um algoritmo inteligente para calcular o nível de confiança na classificação automática de despesas. O cálculo está implementado no arquivo:

- Se for a primeira vez:

  - Aparecerá um popup pedindo para baixar drivers**📍 Localização:** `backend/src/agent/pdf_processing.py`

  - Clique em **"Download"**

  - Aguarde o download#### 🔍 Método Principal: `_calculate_classification_confidence`

- Deve aparecer: **"Connected"** com informações da versão do PostgreSQL

- Se der erro, veja a seção "Possíveis Problemas" abaixo```python

# Linhas 513-535 do arquivo pdf_processing.py

#### 5. Finalizardef _calculate_classification_confidence(

    self, 

- Clique em **"Finish"** ou **"Concluir"**    texto: str, 

- A conexão aparecerá na árvore do lado esquerdo    descricao: str, 

    keywords: List[str]

#### 6. Navegar até o Banco de Dados) -> float:

    """Calcula confiança da classificação baseada em keywords."""

Na árvore de conexões (lado esquerdo):    

1. **Expanda** a conexão criada (clique na setinha)    total_keywords = len(keywords)

2. **Expanda** "Databases" ou "Bancos de dados"    found_keywords = 0

3. **Clique com botão direito** em "Databases" → **"Refresh"** (F5)    

4. **Expanda** `sistema_financeiro` ← O banco criado automaticamente pelo Docker!    for keyword in keywords:

5. **Expanda** "Schemas" → "public" → "Tables"        if keyword in texto or keyword in descricao:

            found_keywords += 1

**Você verá as 5 tabelas criadas automaticamente:**    

- `pessoas` - Fornecedores, clientes, faturados    # Confiança básica baseada na proporção de keywords encontradas

- `movimento_contas` - Receitas e despesas    base_confidence = found_keywords / total_keywords

- `parcelas_contas` - Parcelas de pagamento    

- `classificacao` - Categorias    # Boost adicional se múltiplas keywords foram encontradas

- `movimento_contas_has_classificacao` - Relacionamento many-to-many    if found_keywords > 1:

        base_confidence *= 1.2

#### 7. Consultar Dados    

    return min(base_confidence, 1.0)

- Clique com botão direito em uma tabela → **"View Data"** → **"View Data"**```

- Ou: Clique duplo na tabela → aba "Data"

- Para executar SQL: Clique em **"SQL Editor"** → **"New SQL Script"**#### 🎯 Fórmula do Algoritmo



---1. **Confiança Base** = `keywords_encontradas / total_keywords`

2. **Boost Múltiplas Keywords** = `confiança_base × 1.2` (se > 1 keyword)

## ⚠️ Possíveis Problemas e Soluções3. **Confiança Final** = `min(resultado, 1.0)` (máximo 100%)



### Problema 1: "FATAL: database does not exist" no DBeaver#### 📋 Sistema de Keywords por Categoria



**Causa:** Você especificou um banco de dados na conexão que ainda não existe.O sistema utiliza **palavras-chave (keywords)** para identificar automaticamente a categoria da despesa. Cada categoria possui uma lista específica de termos que são procurados tanto no **texto completo** da nota fiscal quanto na **descrição dos produtos**.



**Solução:**### 🔍 **Como Funcionam as Keywords:**

1. Edite a conexão do DBeaver (botão direito na conexão → Edit Connection)

2. No campo **"Database"** ou **"Banco de dados"**, **APAGUE** tudo e deixe **VAZIO**- **Busca Inteligente**: O sistema procura as keywords no texto em **lowercase** (minúsculas)

3. Clique em "Test Connection" para confirmar- **Peso Duplo**: Keywords encontradas na **descrição dos produtos** valem mais que no texto geral

4. Salve (Finish/OK)- **Múltiplas Detecções**: Quanto mais keywords encontradas, maior a confiança

5. Expanda "Databases"- **Boost Específico**: Cada categoria tem um multiplicador de confiança próprio

6. Clique com botão direito em "Databases" → **"Refresh"** (F5)

7. Navegue: sistema_financeiro → Schemas → public → Tables### 📊 **8 Categorias e suas Keywords:**



---#### 🌱 **1. INSUMOS AGRÍCOLAS** (Boost: 0.95)

```

### Problema 2: "password authentication failed for user postgres" no DBeaverSementes: semente, sementes, milho, soja, feijão, arroz, trigo



**Causa:** Você tem um PostgreSQL instalado no Windows usando a mesma porta ou senha diferente.Fertilizantes: fertilizante, adubo, ureia, npk, superfosfato, 

cloreto de potássio, sulfato de amônio, fosfato, nitrato

**Soluções:**

Defensivos: defensivo, herbicida, inseticida, fungicida, pesticida, 

**Opção A (Recomendada):** Certifique-se de usar a porta corretaagrotóxico, roundup, glifosato, atrazina

- Porta: **54320** (não 5432!)

- Password: `postgres`Corretivos: corretivo, calcário, cal, gesso, micronutriente, inoculante

- Username: `postgres````



**Opção B:** Parar o PostgreSQL do Windows#### 🔧 **2. MANUTENÇÃO E OPERAÇÃO** (Boost: 0.90)

1. Abra **Serviços** do Windows (Win + R → `services.msc`)```

2. Procure por serviços que começam com "postgresql"Combustíveis: combustível, diesel, gasolina, álcool, etanol, óleo, 

3. Clique com botão direito → **"Parar"**lubrificante, graxa, fluido hidráulico, s10, aditivado, b s10

4. Tente conectar novamente no DBeaver

Peças: peça, peças, parafuso, porca, arruela, rolamento, vedação, 

**Opção C:** Conectar via IP do Dockercomponente, reparo, reposição, tubo, cabo, kit, fixação, fixacoes, 

```powershelldin, bucha, anel, junta

# Descobrir o IP do container

docker inspect sistema_financeiro_postgres -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'Manutenção: manutenção, conserto, oficina, mecânico, soldagem



# Use esse IP no campo "Host" do DBeaver (ex: 172.18.0.2)Consumíveis: pneu, pneus, filtro, correia, mangueira, vela, bateria

# Porta: 5432 (dentro do Docker é a porta padrão)```

```

#### 👥 **3. RECURSOS HUMANOS** (Boost: 0.95)

---```

Mão de Obra: mão de obra, trabalhador, funcionário, operário, 

### Problema 3: Banco "sistema_financeiro" não aparece no DBeaverdiarista, temporário, safrista



**Causa:** Cache do DBeaver ou containers não iniciaram corretamente.Encargos: salário, ordenado, pagamento, encargo, fgts, inss, 

vale transporte, vale refeição, cesta básica, 13º salário, 

**Solução:**férias, rescisão

1. Verifique se os containers estão rodando:```

   ```powershell

   docker ps#### 🚚 **4. SERVIÇOS OPERACIONAIS** (Boost: 0.90)

   ``````

   Transporte: frete, transporte, carreto, mudança, logística

2. Veja os logs do backend para confirmar criação do banco:

   ```powershellTerceirizados: colheita, terceirizada, colheitadeira, prestação de serviço

   docker logs sistema_financeiro_backend | Select-String "Banco de dados"

   ```Armazenagem: secagem, armazenagem, silo, estocagem, beneficiamento

   

3. No DBeaver:Aplicações: pulverização, aplicação, plantio, semeadura, cultivo

   - Expanda "Databases"```

   - Clique com botão direito → **"Refresh"** (F5)

   - Aguarde alguns segundos#### 🏗️ **5. INFRAESTRUTURA E UTILIDADES** (Boost: 0.85)

   ```

4. Se ainda não aparecer, verifique a porta:Energia: energia, elétrica, eletricidade, luz, força

   - Deve ser **54320** (não 5432)

Propriedade: arrendamento, aluguel, terra, propriedade, hectare

---

Construção: construção, reforma, obra, edificação, ampliação

### Problema 4: Docker não inicia / "Docker daemon is not running"

Materiais: material, concreto, cimento, ferro, madeira, tijolo, 

**Solução:**telha, tinta, hidráulico, elétrico

1. Abra o **Docker Desktop** manualmente```

2. Aguarde inicializar completamente (pode demorar 1-2 minutos)

3. O ícone deve ficar **verde** na bandeja do sistema#### 📋 **6. ADMINISTRATIVAS** (Boost: 0.90)

4. Tente o comando `docker-compose up` novamente```

Honorários: honorário, contábil, advocatício, agronômico, 

---consultoria, assessoria, auditoria, perícia



### Problema 5: "Port is already allocated" (porta já em uso)Bancárias: despesa bancária, financeira, juros, tarifa, anuidade, 

cartão, conta corrente, empréstimo

**Causa:** Outra aplicação está usando as portas 8000, 3000 ou 54320.```



**Solução:**#### 🛡️ **7. SEGUROS E PROTEÇÃO** (Boost: 0.95)

```

```powershellSeguros: seguro, agrícola, rural, safra, produtividade, ativo, 

# Ver qual processo está usando cada portamáquina, veículo, equipamento, prestamista, vida, proteção, 

netstat -ano | findstr ":8000"cobertura, sinistro

netstat -ano | findstr ":3000"```

netstat -ano | findstr ":54320"

#### 💰 **8. IMPOSTOS E TAXAS** (Boost: 0.98)

# O último número é o PID do processo```

# Para matar o processo (substitua <PID> pelo número):Impostos Rurais: itr, iptu, ipva, incra, ccir

taskkill /PID <número> /F

```Impostos Gerais: imposto, taxa, contribuição, tributo, icms, 

ipi, pis, cofins, ir, csll, simples

**Ou** edite `docker-compose.postgresql.yml` e mude as portas:```

```yaml

ports:### ⚙️ **Configuração das Keywords:**

  - "55000:5432"  # Exemplo: mude de 54320 para 55000

```As keywords estão definidas no arquivo:

**📍 `backend/src/agent/pdf_processing.py` (linhas 52-168)**

---

```python

### Problema 6: "WSL 2 installation is incomplete" no Dockerself.classification_rules = {

    "INSUMOS AGRÍCOLAS": {

**Causa:** WSL 2 não está instalado ou atualizado.        "keywords": ["semente", "fertilizante", "adubo", ...],

        "confidence_boost": 0.95

**Solução:**    },

1. Abra PowerShell **como Administrador** (botão direito → "Executar como administrador")    # ... outras categorias

2. Execute:}

   ```powershell```

   wsl --update

   wsl --set-default-version 2### 🎯 **Como Personalizar:**

   ```

3. Reinicie o computadorPara adicionar novas keywords ou categorias:

4. Abra Docker Desktop novamente

5. Aguarde inicializar completamente1. **Edite o arquivo**: `backend/src/agent/pdf_processing.py`

2. **Localize o método**: `_setup_classification_rules()` (linha 52)

---3. **Adicione keywords** na lista da categoria desejada

4. **Reinicie o backend** para aplicar as mudanças

### Problema 7: Frontend não carrega / tela branca

### 📈 **Exemplo de Detecção:**

**Causa:** Frontend ainda está compilando (primeira vez demora mais).

Para uma nota com descrição: *"Compra de óleo diesel S10 aditivado"*

**Solução:**

1. Aguarde 1-2 minutos após `docker-compose up````

2. Verifique logs:✅ Categoria: MANUTENÇÃO E OPERAÇÃO

   ```powershell✅ Keywords encontradas: ["óleo", "diesel", "s10", "aditivado"]

   docker logs sistema_financeiro_frontend✅ Confiança: 4/25 keywords = 16% × 1.5 (boost descrição) = 24%

   ```✅ Resultado: Classificação aceita (> 15% threshold)

3. Procure por erros```

4. Acesse: http://localhost:3000 (não https!)

5. Limpe o cache do navegador:#### ⚙️ Processo de Classificação Atualizado

   - Chrome/Edge: Ctrl + Shift + Del

   - Marque "Cookies" e "Cache"```python

   - Recarregue a página (F5)# Linhas 465-511 do arquivo pdf_processing.py

def _apply_automatic_classification(self, dados, texto_original):

---    """Aplica classificação automática de despesas baseada em keywords."""

    

### Problema 8: API retorna 404 / "Not Found"    # 1. Converte texto para lowercase

    texto_lower = texto_original.lower()

**Causa:** Backend ainda está inicializando ou rota incorreta.    descricao_lower = dados.descricao_produtos.lower()

    

**Solução:**    # 2. Para cada categoria, calcula confiança

1. Aguarde 30-60 segundos após `docker-compose up`    for categoria, rules in self.classification_rules.items():

2. Verifique logs:        confidence = self._calculate_classification_confidence(

   ```powershell            texto_lower, descricao_lower, rules["keywords"]

   docker logs sistema_financeiro_backend        )

   ```        

3. Procure por: `Aplicação iniciada com sucesso!`        # 3. Aplica threshold mínimo de 15%

4. Teste a documentação: http://localhost:8000/docs        if confidence > 0.15:

5. As rotas da API começam com `/api/v1/`            # Adiciona classificação

   - Exemplo: http://localhost:8000/api/v1/pessoas            

    # 4. Ordena por confiança (maior primeiro)

---    # 5. Retorna até 3 melhores classificações

```

### Problema 9: "Cannot connect to the Docker daemon"

#### 🎛️ Parâmetros Configuráveis (Versão Atual)

**Causa:** Docker Desktop não está rodando.

- **Threshold Mínimo**: `0.15` (15% de confiança)

**Solução:**- **Boost Múltiplas Keywords**: `1.2` (20% adicional)

1. Inicie o Docker Desktop- **Boost Descrição**: `1.5` (50% adicional se keyword na descrição)

2. Aguarde o ícone ficar verde- **Penalização Fiscal**: `0.3` (70% redução para impostos sem match na descrição)

3. Execute o comando novamente- **Máximo Classificações**: `3` por despesa

- **Confiança Máxima**: `1.0` (100%)

---

#### 📈 Exemplo Prático Atualizado

### Problema 10: Containers param sozinhos / "Exited (1)"

Para uma nota fiscal com descrição: *"15.000,00 L de ÓLEO DIESEL B S10 ADITIVADO"*

**Causa:** Erro de configuração ou falta de recursos.

1. **Categoria**: MANUTENÇÃO E OPERAÇÃO

**Solução:**2. **Keywords da categoria**: [combustível, diesel, óleo, s10, aditivado, ...]

1. Veja os logs do container que parou:3. **Keywords encontradas na descrição**: óleo, diesel, s10, aditivado (4 de 25)

   ```powershell4. **Confiança base**: 4/25 = 0.16 (16%)

   docker logs sistema_financeiro_backend5. **Boost múltiplas**: 0.16 × 1.2 = 0.192

   ```6. **Boost descrição**: 0.192 × 1.5 = 0.288

2. Procure por mensagens de erro7. **Confiança final**: 28.8%

3. Comum: "ERRO: banco de dados não existe"

   - Solução: Certifique-se que o PostgreSQL iniciou primeiro✅ **Resultado**: Classificação aceita (28.8% > 15% threshold)

   - O docker-compose já faz isso com `depends_on` e `healthcheck`

---

---

## 🔧 Troubleshooting

## 🗃️ Estrutura do Banco de Dados

### Problemas Comuns

### Diagrama ER (Entidade-Relacionamento):

#### ❌ Erro de Conexão com Banco de Dados

``````

┌─────────────────┐          ┌──────────────────────┐sqlalchemy.exc.OperationalError: could not connect to server

│     pessoas     │          │  movimento_contas    │```

├─────────────────┤          ├──────────────────────┤**Solução:**

│ idPessoas (PK)  │◄────────┤│ idMovimentoContas(PK)│1. Verifique se o PostgreSQL está rodando

│ tipo            │  1    N ││ idPessoas_Fornecedor │2. Confirme as credenciais no arquivo `.env`

│ documento       │          ││ idPessoas_Faturado   │3. Teste a conexão: `psql -h localhost -U postgres -d sistema_financeiro`

│ razaosocial     │          ││ numero_nota_fiscal   │

│ nomefantasia    │          ││ descricao            │#### ❌ Erro de Importação no Backend

│ telefone        │          ││ valor                │```

│ celular         │          ││ data_movimento       │ModuleNotFoundError: No module named 'fastapi'

│ email           │          ││ ativo                │```

│ logradouro      │          ││ created_at           │**Solução:**

│ numero          │          ││ updated_at           │1. Ative o ambiente virtual: `.\venv\Scripts\Activate.ps1`

│ bairro          │          │└──────────────────────┘2. Instale as dependências: `pip install -r requirements.txt` (ou os comandos do passo 3)

│ cidade          │                    │ 1

│ uf              │                    │#### ❌ Erro de Porta Ocupada

│ cep             │                    │ N```

│ ativo           │          ┌─────────▼──────────┐Error: Port 8000 is already in use

│ created_at      │          │ parcelas_contas    │```

│ updated_at      │          ├────────────────────┤**Solução:**

└─────────────────┘          │ idParcelasContas(PK)1. Mate o processo: `netstat -ano | findstr :8000` (Windows)

                             │ idMovimentoContas  │2. Ou use outra porta: `uvicorn src.main:app --reload --port 8001`

        ┌────────────────────┤ numero_parcela     │

        │                    │ valor_parcela      │#### ❌ Frontend não conecta com Backend

        │ N                  │ data_vencimento    │**Solução:**

        │                    │ ativo              │1. Verifique se o backend está rodando em `http://localhost:8000`

┌───────▼──────────┐         │ created_at         │2. Confirme o CORS no arquivo `.env` do backend

│  classificacao   │         │ updated_at         │3. Verifique o arquivo `.env` do frontend com `VITE_API_URL=http://localhost:8000`

├──────────────────┤         └────────────────────┘

│ idClassificacao  │#### ❌ Erro de API Key do Gemini

│ descricao        │```

│ categoria        │google.api_core.exceptions.Unauthenticated: 401 API key not valid

│ ativo            │```

│ created_at       │         ┌────────────────────────────────┐**Solução:**

│ updated_at       │         │movimento_contas_has_classificacao│1. Verifique se a API Key está correta no `.env`

└──────────────────┘         ├────────────────────────────────┤2. Confirme se a API Key tem permissões para Gemini AI

        │ N                  │ idMovimentoContas (FK)         │3. Teste a key em: https://makersuite.google.com/

        │                    │ idClassificacao (FK)           │

        └────────────────────┤ PK(idMovimentoContas + id...)  │### Logs e Debug

                       N     └────────────────────────────────┘

```#### Backend

```bash

### Tabelas:# Logs detalhados

uvicorn src.main:app --reload --log-level debug

#### 1. `pessoas`

Armazena todos os tipos de pessoas: fornecedores, clientes e faturados.# Verificar saúde da aplicação

curl http://localhost:8000/health

**Campos:**```

```sql

idPessoas           SERIAL PRIMARY KEY#### Frontend

tipo                VARCHAR(20) NOT NULL  -- FORNECEDOR, CLIENTE, FATURADO```bash

documento           VARCHAR(18)           -- CPF ou CNPJ# Console do navegador (F12)

razaosocial         VARCHAR(255)# Verificar erros de rede na aba Network

nomefantasia        VARCHAR(255)# Verificar console para erros JavaScript

telefone            VARCHAR(15)```

celular             VARCHAR(15)

email               VARCHAR(255)---

logradouro          VARCHAR(255)

numero              VARCHAR(10)## 🔧 Desenvolvimento

bairro              VARCHAR(100)

cidade              VARCHAR(100)### 🚀 Início Rápido (Para Desenvolvedores)

uf                  VARCHAR(2)

cep                 VARCHAR(9)Se você já tem Python, Node.js e PostgreSQL instalados:

ativo               BOOLEAN DEFAULT TRUE

created_at          TIMESTAMP DEFAULT NOW()```bash

updated_at          TIMESTAMP DEFAULT NOW()# 1. Clone e entre no projeto

```git clone <url-do-repositorio>

cd sistema-financeiro

**Regras:**

- Um fornecedor pode ter múltiplos movimentos# 2. Configure o banco

- Soft delete: `ativo = FALSE` ao invés de DELETEcreatedb sistema_financeiro  # ou via pgAdmin

- `tipo` define se é fornecedor, cliente ou faturado

# 3. Backend (Terminal 1)

#### 2. `movimento_contas`cd backend

Registros de receitas e despesas.python -m venv venv

.\venv\Scripts\Activate.ps1  # Windows

**Campos:**pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic pydantic-settings alembic python-multipart google-generativeai

```sql# Configure o .env com suas credenciais

idMovimentoContas       SERIAL PRIMARY KEYuvicorn src.main:app --reload --host 0.0.0.0 --port 8000

idPessoas_Fornecedor    INTEGER REFERENCES pessoas(idPessoas)

idPessoas_Faturado      INTEGER REFERENCES pessoas(idPessoas)# 4. Frontend (Terminal 2)

numero_nota_fiscal      VARCHAR(50)cd frontend

descricao               TEXTnpm install

valor                   DECIMAL(15,2) NOT NULLnpm run dev

data_movimento          DATE NOT NULL```

ativo                   BOOLEAN DEFAULT TRUE

created_at              TIMESTAMP DEFAULT NOW()### Estrutura de Pastas

updated_at              TIMESTAMP DEFAULT NOW()

``````

sistema-financeiro/

**Regras:**├── 📁 backend/                 # API FastAPI

- Pode ter 1 fornecedor E 1 faturado│   ├── 📁 src/

- Pode ter múltiplas parcelas│   │   ├── 📁 config/         # Configurações (database.py, settings.py)

- Pode ter múltiplas classificações (many-to-many)│   │   ├── 📁 models/         # Modelos SQLAlchemy

- Soft delete: `ativo = FALSE`│   │   ├── 📁 schemas/        # Schemas Pydantic (validação)

│   │   ├── 📁 agent/         # Lógica de negócio e IA

#### 3. `parcelas_contas`│   │   ├── 📁 repositories/   # Acesso a dados

Parcelas de pagamento de um movimento.│   │   ├── 📁 routers/        # Endpoints da API

│   │   ├── 📁 core/          # Exceções e constantes

**Campos:**│   │   └── 📄 main.py        # Aplicação principal

```sql│   ├── 📁 venv/              # Ambiente virtual Python

idParcelasContas    SERIAL PRIMARY KEY│   └── 📄 .env               # Variáveis de ambiente

idMovimentoContas   INTEGER REFERENCES movimento_contas(idMovimentoContas)├── 📁 frontend/               # Interface React

numero_parcela      INTEGER NOT NULL│   ├── 📁 src/

valor_parcela       DECIMAL(15,2) NOT NULL│   │   ├── 📁 components/    # Componentes reutilizáveis

data_vencimento     DATE NOT NULL│   │   ├── 📁 pages/        # Páginas da aplicação

ativo               BOOLEAN DEFAULT TRUE│   │   ├── 📁 services/     # Camada de API

created_at          TIMESTAMP DEFAULT NOW()│   │   ├── 📁 types/        # Tipos TypeScript

updated_at          TIMESTAMP DEFAULT NOW()│   │   └── 📁 utils/        # Utilitários

```│   ├── 📄 package.json      # Dependências Node.js

│   ├── 📄 vite.config.ts    # Configuração Vite

**Regras:**│   └── 📄 .env             # Variáveis de ambiente

- Cada parcela pertence a 1 movimento└── 📄 README.md            # Este arquivo

- Um movimento pode ter N parcelas```

- Soma das parcelas = valor do movimento

### 🧪 Testes

#### 4. `classificacao`

Categorias para classificar movimentos.```bash

# Backend (quando implementados)

**Campos:**cd backend

```sqlpytest

idClassificacao     SERIAL PRIMARY KEY

descricao           VARCHAR(255) NOT NULL# Frontend

categoria           VARCHAR(100)cd frontend

ativo               BOOLEAN DEFAULT TRUEnpm run test        # Testes unitários

created_at          TIMESTAMP DEFAULT NOW()npm run test:ui     # Testes visuais (se configurado)

updated_at          TIMESTAMP DEFAULT NOW()```

```

### 📝 Migrations (Banco de Dados)

**Regras:**

- Uma classificação pode estar em múltiplos movimentos```bash

- Soft delete: `ativo = FALSE`# Entrar no ambiente do backend

cd backend

#### 5. `movimento_contas_has_classificacao`.\venv\Scripts\Activate.ps1

Tabela associativa many-to-many entre movimentos e classificações.

# Criar nova migration

**Campos:**alembic revision --autogenerate -m "Descrição da mudança"

```sql

idMovimentoContas   INTEGER REFERENCES movimento_contas(idMovimentoContas)# Aplicar migrations

idClassificacao     INTEGER REFERENCES classificacao(idClassificacao)alembic upgrade head

PRIMARY KEY (idMovimentoContas, idClassificacao)```

```

---

**Regras:**

- Um movimento pode ter múltiplas classificações## 📚 Documentação da API

- Uma classificação pode estar em múltiplos movimentos

- Chave primária compostaAcesse a documentação interativa da API:



### Relacionamentos:- **Swagger UI:** http://localhost:8000/docs

- **ReDoc:** http://localhost:8000/redoc

```- **OpenAPI Schema:** http://localhost:8000/openapi.json

pessoas (1) ──┬──→ (N) movimento_contas [como fornecedor]

              └──→ (N) movimento_contas [como faturado]---



movimento_contas (1) ──→ (N) parcelas_contas## 🤝 Contribuição



movimento_contas (N) ←──→ (N) classificacaoContribuições são muito bem-vindas! Siga estes passos:

         [via movimento_contas_has_classificacao]

```1. **Fork** o projeto

2. **Crie** sua branch de feature (`git checkout -b feature/nova-funcionalidade`)

---3. **Commit** suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)

4. **Push** para a branch (`git push origin feature/nova-funcionalidade`)

## 📡 Endpoints da API5. **Abra** um Pull Request



### Documentação Interativa### 📋 Diretrizes para Contribuição



Acesse: **http://localhost:8000/docs**- Mantenha os testes atualizados

- Siga os padrões de código estabelecidos

A documentação Swagger permite:- Documente novas funcionalidades

- Ver todos os endpoints- Use conventional commits

- Testar requisições direto no navegador- Atualize a documentação quando necessário

- Ver schemas de request/response

- Experimentar a API sem precisar escrever código---



### Principais Endpoints:<div align="center">



#### 📋 Pessoas[⭐ Star no GitHub](https://github.com/seu-usuario/sistema-financeiro) •

```[🐛 Reportar Bug](https://github.com/seu-usuario/sistema-financeiro/issues) •

GET    /api/v1/pessoas                 - Listar todas (com paginação)

GET    /api/v1/pessoas/{id}            - Buscar por ID---

POST   /api/v1/pessoas                 - Criar nova pessoa

PUT    /api/v1/pessoas/{id}            - Atualizar pessoa*Última atualização: 24 de setembro de 2025*</div>

DELETE /api/v1/pessoas/{id}            - Inativar pessoa (soft delete)
```

**Exemplo de Request (POST /api/v1/pessoas):**
```json
{
  "tipo": "FORNECEDOR",
  "documento": "12.345.678/0001-90",
  "razaosocial": "Empresa XYZ Ltda",
  "nomefantasia": "XYZ",
  "telefone": "(11) 1234-5678",
  "celular": "(11) 98765-4321",
  "email": "contato@xyz.com.br",
  "logradouro": "Rua das Flores",
  "numero": "123",
  "bairro": "Centro",
  "cidade": "São Paulo",
  "uf": "SP",
  "cep": "01234-567"
}
```

#### 💰 Movimentos
```
GET    /api/v1/movimentos              - Listar todos
GET    /api/v1/movimentos/{id}         - Buscar por ID
GET    /api/v1/movimentos/resumo       - Resumo financeiro (total receitas/despesas)
POST   /api/v1/movimentos              - Criar movimento
PUT    /api/v1/movimentos/{id}         - Atualizar movimento
DELETE /api/v1/movimentos/{id}         - Inativar movimento
```

**Exemplo de Request (POST /api/v1/movimentos):**
```json
{
  "idPessoas_Fornecedor": 1,
  "idPessoas_Faturado": 2,
  "numero_nota_fiscal": "NF-12345",
  "descricao": "Compra de materiais",
  "valor": 1500.00,
  "data_movimento": "2025-11-04"
}
```

#### 📅 Parcelas
```
GET    /api/v1/parcelas                        - Listar todas
GET    /api/v1/parcelas/movimento/{id}         - Parcelas de um movimento específico
POST   /api/v1/parcelas                        - Criar parcela
PUT    /api/v1/parcelas/{id}                   - Atualizar parcela
DELETE /api/v1/parcelas/{id}                   - Inativar parcela
```

**Exemplo de Request (POST /api/v1/parcelas):**
```json
{
  "idMovimentoContas": 1,
  "numero_parcela": 1,
  "valor_parcela": 500.00,
  "data_vencimento": "2025-12-04"
}
```

#### 📄 Processamento de PDF
```
POST   /api/v1/pdf/processar           - Upload e processar PDF
```

**Como usar:**
1. No Swagger (http://localhost:8000/docs), vá até `/api/v1/pdf/processar`
2. Clique em "Try it out"
3. Clique em "Choose File" e selecione um PDF de nota fiscal
4. Clique em "Execute"
5. A IA Gemini vai:
   - Extrair dados do PDF
   - Criar fornecedor (se não existir)
   - Criar faturado (se não existir)
   - Criar movimento com os dados extraídos
   - Retornar JSON com todos os dados e IDs criados

**Resposta de sucesso:**
```json
{
  "success": true,
  "fornecedor": {
    "descricao": "EMPRESA XYZ LTDA",
    "status": {
      "exists": true,
      "entity_id": 1,
      "created": true
    }
  },
  "movimento_criado": true,
  "movimento_id": 1,
  "logs": [
    "Fornecedor criado: EMPRESA XYZ LTDA (ID: 1)",
    "Movimento criado com sucesso: ID 1"
  ],
  "processing_time": 3.45
}
```

---

## 📌 Atualizações Recentes: Parcelas e RAG

### 🧮 Parcelas: geração automática e regras funcionais
- Endpoint: `POST /api/v1/parcelas/gerar` (router: `gerar_parcelas_para_movimento`).
- Regras implementadas:
  - Valida existência do movimento e do `valortotal`.
  - Determina data base de vencimento a partir do payload, `dataemissao` do movimento, ou data atual.
  - Ajuste mensal de datas com preservação do dia quando possível.
  - Divide o valor igualmente; a última parcela recebe o ajuste de arredondamento.
  - Continua a numeração a partir do maior `numero_parcela` já existente.
  - Gera `identificacao` no formato `<numero_nota_fiscal>-PXX` (ex.: `NF-123-P01`).
  - Define `statusparcela = "PENDENTE"` e calcula `valorsaldo`.
  - Criação em lote (`create_many`) para eficiência.

- Observações:
  - A `identificacao` é única por índice; se o movimento não possuir `numero_nota_fiscal`, defina um identificador consistente para evitar colisões (ex.: `MOV<id>-PXX`).

- Exemplo de requisição:
  ```json
  {
    "movimento_id": 42,
    "numero_parcelas": 3,
    "primeiro_vencimento": "2025-01-15",
    "intervalo_meses": 1
  }
  ```

### 🤖 Consulta Inteligente (RAG)
- Endpoints:
  - `POST /api/v1/rag/simple`
  - `POST /api/v1/rag/embeddings/query`

- Payload:
  ```json
  { "question": "Quais as parcelas pendentes deste mês?" }
  ```

- Resposta (exemplo):
  ```json
  {
    "answer": "...texto com a resposta elaborada...",
    "strategy": "RAG Simples",
    "sources": [
      { "title": "parcela.txt", "snippet": "regras de geração de parcelas", "score": 0.87 }
    ],
    "meta": { "consulta": "parcelas pendentes", "total_encontrado": 12 }
  }
  ```

- Estratégias:
  - "RAG Simples": consulta direta aos repositórios (Pessoas, Movimentos, Parcelas) para estatísticas e respostas estruturadas.
  - "RAG Embeddings": índice leve baseado em documentos locais (`parcela.txt`, modelos e schemas) com similaridade cosseno e elaboração por LLM quando disponível.

- Frontend:
  - Página: `Consulta RAG` (`/rag`) com seleção de estratégia e campo de pergunta.
  - Serviço: `frontend/src/services/ragService.ts` com `askSimple` e `askEmbeddings`.
  - Menu lateral: item "Consulta RAG".

- Exemplo com `curl`:
  ```bash
  curl -X POST http://localhost:8000/api/v1/rag/simple \
    -H "Content-Type: application/json" \
    -d '{"question":"Como funciona a geração de parcelas?"}'
  ```

## 👨‍💻 Desenvolvido por

Gilberto Junior - [@junin27](https://github.com/junin27)

---

## 📄 Licença

Este projeto foi desenvolvido para fins acadêmicos.
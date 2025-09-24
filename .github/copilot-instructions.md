# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Projeto Sistema Administrativo Financeiro

Este é um projeto de sistema administrativo financeiro com as seguintes características:

### Tecnologias:
- **Backend:** Python com FastAPI
- **Frontend:** React com TypeScript e TailwindCSS  
- **Base de Dados:** PostgreSQL
- **IA:** Google Gemini API para processamento de PDF

### Boas Práticas Obrigatórias:
- Aplique SOLID principles
- Use alta coesão e baixo acoplamento
- Implemente Clean Architecture
- Use Repository Pattern e Service Layer
- Sempre use Type Hints no Python
- Componentes React funcionais com hooks
- Interfaces TypeScript bem definidas

### Regras de Negócio:
- Registros NUNCA são excluídos, apenas INATIVADOS
- Soft delete em todas as entidades
- Relacionamentos many-to-many entre contas e classificações
- Múltiplas parcelas por conta

### Entidades CRUD:
- FORNECEDOR, CLIENTE, FATURADO
- TIPO DE RECEITA, TIPO DE DESPESA  
- CONTAS A PAGAR, CONTAS A RECEBER

### Funcionalidade Principal:
- Upload e processamento de PDF com IA Gemini
- Extração automática de dados de notas fiscais
- Classificação automática de despesas

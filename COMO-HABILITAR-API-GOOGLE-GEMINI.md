# Como Habilitar a API Generative Language do Google

## Problema

Ao tentar analisar um PDF de nota fiscal, você recebe o erro:

```
403 Generative Language API has not been used in project [PROJECT_ID] before or it is disabled.
```

Isso significa que a API do Google Gemini não está habilitada no seu projeto Google Cloud.

## Solução

### Passo 1: Acesse o Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Faça login com a conta Google associada à sua API Key do Gemini

### Passo 2: Selecione o Projeto Correto

1. No topo da página, clique no seletor de projetos
2. Selecione o projeto que corresponde ao ID mencionado no erro (ex: `230928254310`)
3. Se não encontrar o projeto, você pode precisar criar um novo ou usar um existente

### Passo 3: Habilite a API Generative Language

**Opção A: Usando o link direto do erro**

Se o erro forneceu um link de ativação, clique nele diretamente. Ele deve ser algo como:
```
https://console.developers.google.com/apis/api/generativelanguage.googleapis.com/overview?project=230928254310
```

**Opção B: Habilitar manualmente**

1. Acesse: https://console.developers.google.com/apis/library/generativelanguage.googleapis.com
2. Certifique-se de que o projeto correto está selecionado (verifique no topo da página)
3. Clique no botão **"HABILITAR"** ou **"ENABLE"**

### Passo 4: Aguarde a Propagação

Após habilitar a API:

1. **Aguarde 2-5 minutos** para que a mudança seja propagada pelos sistemas do Google
2. Tente analisar o PDF novamente

### Passo 5: Verificar se Funcionou

1. Tente fazer upload e análise de um PDF novamente
2. Se ainda der erro, aguarde mais alguns minutos e tente novamente

## Verificação Adicional

### Verificar se a API está habilitada

1. Acesse: https://console.developers.google.com/apis/dashboard
2. Selecione o projeto correto
3. Procure por "Generative Language API" na lista
4. Deve aparecer como **"Habilitada"** ou **"Enabled"**

### Verificar Permissões da API Key

1. Acesse: https://console.cloud.google.com/apis/credentials
2. Encontre sua API Key do Gemini
3. Verifique se ela tem permissões para a API "Generative Language API"
4. Se necessário, edite a API Key e adicione a permissão

## Notas Importantes

- ⏱️ **Tempo de propagação**: Após habilitar a API, pode levar alguns minutos para ficar ativa
- 🔑 **API Key**: Certifique-se de que está usando a API Key correta do projeto onde habilitou a API
- 💰 **Cobrança**: A API Generative Language tem um plano gratuito com limites. Verifique os limites em: https://ai.google.dev/pricing
- 🌐 **Região**: A API funciona globalmente, não há necessidade de configurar região específica

## Links Úteis

- **Google AI Studio**: https://aistudio.google.com/
- **Documentação da API**: https://ai.google.dev/gemini-api/docs
- **Limites e Quotas**: https://ai.google.dev/gemini-api/docs/quota
- **Preços**: https://ai.google.dev/pricing

## Ainda com Problemas?

Se após seguir todos os passos o problema persistir:

1. Verifique se a API Key está correta no arquivo `.env` ou nas variáveis de ambiente
2. Verifique se o projeto Google Cloud está ativo e não foi desabilitado
3. Tente criar uma nova API Key no Google AI Studio: https://aistudio.google.com/app/apikey
4. Verifique os logs do backend para mais detalhes do erro


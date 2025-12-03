# 🚀 Deploy no Vercel - Guia de Configuração

## ⚠️ Configuração Obrigatória

Para que o frontend funcione corretamente no Vercel, você **DEVE** configurar a variável de ambiente `VITE_API_URL` com a URL completa do seu backend.

## 📝 Passo a Passo

### 1. Configure a Variável de Ambiente no Vercel

1. Acesse o [Dashboard do Vercel](https://vercel.com/dashboard)
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Adicione a seguinte variável:

```
Nome: VITE_API_URL
Valor: https://seu-backend-url.com/api/v1
```

**Exemplos:**
- Se o backend está no Koyeb: `https://seu-app.koyeb.app/api/v1`
- Se o backend está no Railway: `https://seu-app.railway.app/api/v1`
- Se o backend está em outro serviço: `https://api.seudominio.com/api/v1`

**URL do Backend deste Projeto:**
```
https://gross-dari-paraiba-3a6b05e3.koyeb.app/api/v1
```

### 2. Importante sobre Variáveis VITE_*

⚠️ **ATENÇÃO**: Variáveis de ambiente que começam com `VITE_` são injetadas no código durante o **build**, não em runtime.

Isso significa que:
- Você precisa fazer um **novo deploy** após adicionar/modificar `VITE_API_URL`
- A variável não pode ser alterada sem fazer rebuild
- O valor é "embutido" no código JavaScript gerado

### 3. Verificar se está Funcionando

Após o deploy, abra o console do navegador (F12) e verifique os logs:
- Deve aparecer: `[API] API Base URL (client - PROD): https://seu-backend-url.com/api/v1`
- Se aparecer erro sobre `VITE_API_URL não está configurada`, a variável não foi definida corretamente

### 4. Troubleshooting

#### Problema: Ainda retorna HTML ao invés de JSON

**Solução:**
1. Verifique se `VITE_API_URL` está configurada corretamente no Vercel
2. Faça um novo deploy (as variáveis VITE_* só são aplicadas no build)
3. Verifique se a URL do backend está correta e acessível
4. Verifique se o backend permite CORS do domínio do Vercel

#### Problema: Erro de CORS

**Solução:**
Configure o backend para aceitar requisições do domínio do Vercel. No arquivo `backend/src/config/settings.py`, adicione o domínio do Vercel em `allowed_origins`:

```python
allowed_origins: List[str] = Field(
    default=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://seu-app.vercel.app",  # Adicione aqui
        "*"
    ]
)
```

## 🔍 Como o Código Funciona

O código em `src/services/api.ts` detecta automaticamente:

1. **Desenvolvimento** (`npm run dev`): Usa proxy do Vite (`/api/v1`)
2. **Produção** (Vercel): Usa `VITE_API_URL` da variável de ambiente
3. **Fallback**: Se `VITE_API_URL` não estiver definida e estiver em localhost, usa `http://localhost:8000/api/v1`

## 📚 Referências

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)


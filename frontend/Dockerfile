# Usar Node.js 18 como base (não Alpine para evitar problemas com binários nativos)
FROM node:18-slim

# Definir variáveis de ambiente
ENV NODE_ENV=development
ENV CHOKIDAR_USEPOLLING=true

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Criar diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json primeiro para cache do Docker
COPY package*.json ./

# Instalar dependências e garantir que rollup seja instalado corretamente
RUN npm ci || npm install
# Instalar explicitamente o rollup para Linux x64 (glibc)
RUN npm install @rollup/rollup-linux-x64-gnu --save-optional --force || true

# Copiar código da aplicação
COPY . .

# Expor porta da aplicação
EXPOSE 3000

# Comando padrão para desenvolvimento
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

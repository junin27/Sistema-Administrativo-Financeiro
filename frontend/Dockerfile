# Usar Node.js 18 como base
FROM node:18-alpine

# Definir variáveis de ambiente
ENV NODE_ENV=development
ENV CHOKIDAR_USEPOLLING=true

# Instalar dependências do sistema
RUN apk add --no-cache curl

# Criar diretório de trabalho
WORKDIR /app

# Copiar package.json e package-lock.json primeiro para cache do Docker
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código da aplicação
COPY . .

# Expor porta da aplicação
EXPOSE 3000

# Comando padrão para desenvolvimento
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

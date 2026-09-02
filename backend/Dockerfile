# Imagem base leve do Node.js LTS
FROM node:20-alpine

# Define diretório de trabalho
WORKDIR /app

# Copia arquivos de definição de pacotes
COPY package*.json ./

# Instala apenas dependências de produção
RUN npm ci --omit=dev

# Copia o código fonte do backend
COPY . .

# Expõe a porta do servidor Express
EXPOSE 3001

# Variável de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3001

# Comando de inicialização
CMD ["npm", "start"]

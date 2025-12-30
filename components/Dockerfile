# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app

# Dependências
COPY package*.json ./
# Se existir, usa lockfile para build reprodutível
COPY package-lock.json ./

RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

# Código
COPY . .

# Variáveis públicas (Vite). ANON_KEY não é segredo.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

FROM nginx:alpine
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

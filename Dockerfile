# Build stage (mais estável que alpine)
FROM node:20-bookworm-slim AS build
WORKDIR /app

# Instala deps do jeito certo pra CI
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Copia o restante do projeto
COPY . .

# Build-time env (Vite embute no bundle; isso é PUBLICO)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Build
RUN npm run build

# Serve stage
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

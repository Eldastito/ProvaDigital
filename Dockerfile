# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# (opcional, mas ajuda em CI)
ENV CI=true
ENV NPM_CONFIG_FUND=false
ENV NPM_CONFIG_AUDIT=false

# Install deps first (better caching)
COPY package.json package-lock.json* ./

# npm ci é mais estável e usa 100% o package-lock
RUN npm ci --no-audit --no-fund

# Copy source
COPY . .

# Build-time env (Vite embeds VITE_* into the build)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN npm run build

# Serve stage
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

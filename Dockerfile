# Build stage
FROM node:22-alpine AS build
WORKDIR /app

# Install deps first (better caching)
COPY package.json package-lock.json* ./
RUN npm install

# Copy source
COPY . .

# Build-time env (Vite embeds these into the build)
# NOTE: VITE_* variables are meant to be public (supabase anon key is public).
# DO NOT embed private keys in the frontend build for production.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG GEMINI_API_KEY

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY

RUN npm run build

# Serve stage
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
ARG CACHEBUST=2
COPY . .

# Accept build arguments (environment variables)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_GEMINI_API_KEY
ARG VITE_SENTRY_DSN
ARG VITE_POSTHOG_KEY

# Set them as environment variables (Vite will use these during npm run build)
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN
ENV VITE_POSTHOG_KEY=$VITE_POSTHOG_KEY

# Log variables presence (masked for safety)
RUN echo "VITE_SUPABASE_URL is set: $([ -n "$VITE_SUPABASE_URL" ] && echo 'yes' || echo 'no')"
RUN echo "VITE_GEMINI_API_KEY is set: $([ -n "$VITE_GEMINI_API_KEY" ] && echo 'yes' || echo 'no')"

# Build the application
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

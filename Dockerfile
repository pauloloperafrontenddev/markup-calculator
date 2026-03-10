# ────────────────────────────────────────────────────────────────────────────
# Multi-stage production Dockerfile — Markup Calculator (TanStack Start)
# ────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Install dependencies ────────────────────────────────────────────
FROM node:24-alpine AS deps

WORKDIR /app

# Install only what's needed for the OS layer
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
# ci = clean install, reproducible from lock file, faster than install
RUN npm ci

# ── Stage 2: Build the application ───────────────────────────────────────────
FROM node:24-alpine AS builder

WORKDIR /app

# Copy deps from stage 1
COPY --from=deps /app/node_modules ./node_modules
# Copy all source (respects .dockerignore — no .env files copied)
COPY . .

# Build args become VITE_ env vars at build time.
# Pass them with: docker build --build-arg VITE_SUPABASE_URL=... --build-arg VITE_SUPABASE_ANON_KEY=...
# Or let docker-compose.prod.yml supply them.
# Note: VITE_SUPABASE_ANON_KEY is Supabase's browser-safe public key.
# It is intentionally baked into the client JS bundle (this is how Supabase works).
# True secrets (SUPABASE_SERVICE_ROLE_KEY) are never build args — they are runtime env vars only.
# hadolint ignore=DL3044
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV NODE_ENV=production

RUN npm run build

# ── Stage 3: Lean production runner ──────────────────────────────────────────
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
# Runtime env vars are injected by docker-compose / your orchestrator at run time.
# VITE_ vars are baked into the client bundle at build time (stage 2).
# Non-VITE server-only secrets (SUPABASE_SERVICE_ROLE_KEY etc.) go here.

# Copy only what's needed to run
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# Healthcheck — nginx/load balancer can probe this
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["node", "dist/server/server.js"]

FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.25.0 --activate
WORKDIR /app

# ── Dependencies ─────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ── Build: production ─────────────────────────────────────────────────────────
FROM deps AS builder-production
COPY . .
RUN pnpm exec ng build --configuration production \
    && node scripts/fix-ssr-manifest.mjs

# ── Build: development ────────────────────────────────────────────────────────
FROM deps AS builder-development
COPY . .
ARG API_URL=http://localhost:3000
RUN printf "export const environment = {\n  production: false,\n  apiUrl: '%s',\n  apiKey: 'sk_dev',\n};\n" "$API_URL" \
    > src/environments/environment.development.ts
RUN pnpm exec ng build --configuration development \
    && node scripts/fix-ssr-manifest.mjs

# ── Prod-only node_modules ────────────────────────────────────────────────────
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod

# ── Final: production ─────────────────────────────────────────────────────────
FROM node:22-alpine AS production
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder-production /app/dist/frontend-lcdp ./dist/frontend-lcdp
ENV PORT=80
EXPOSE 80
CMD ["node", "dist/frontend-lcdp/server/server.mjs"]

# ── Final: development ────────────────────────────────────────────────────────
FROM node:22-alpine AS development
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder-development /app/dist/frontend-lcdp ./dist/frontend-lcdp
ENV PORT=80
EXPOSE 80
CMD ["node", "dist/frontend-lcdp/server/server.mjs"]

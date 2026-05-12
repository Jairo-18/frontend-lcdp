FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps

FROM deps AS builder-production
WORKDIR /app
COPY . .
RUN npx ng build --configuration production && node scripts/fix-ssr-manifest.mjs

FROM deps AS builder-development
WORKDIR /app
COPY . .
ARG API_URL=http://localhost:3000
RUN printf "export const environment = {\n  production: false,\n  apiUrl: '%s',\n  apiKey: 'sk_dev',\n};\n" "$API_URL" \
    > src/environments/environment.development.ts
RUN npx ng build --configuration development && node scripts/fix-ssr-manifest.mjs

FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps --omit=dev

FROM node:22-alpine AS production
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder-production /app/dist/frontend-lcdp ./dist/frontend-lcdp
ENV PORT=80
EXPOSE 80
CMD ["node", "dist/frontend-lcdp/server/server.mjs"]

FROM node:22-alpine AS development
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder-development /app/dist/frontend-lcdp ./dist/frontend-lcdp
ENV PORT=80
EXPOSE 80
CMD ["node", "dist/frontend-lcdp/server/server.mjs"]

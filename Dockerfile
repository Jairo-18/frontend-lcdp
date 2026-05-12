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

FROM node:18-alpine AS builder

ARG BUILD_CONFIG=production

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build -- --configuration=$BUILD_CONFIG

FROM nginx:alpine

COPY --from=builder /app/dist/frontend-lcdp/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

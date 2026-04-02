FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.29-alpine
WORKDIR /usr/share/nginx/html

COPY infra/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY infra/nginx/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
COPY infra/nginx/runtime-config.template.js /opt/medcallon/runtime-config.template.js
COPY --from=build /app/dist/Front/browser ./

EXPOSE 80

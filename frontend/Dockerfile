FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Caddy liefert das Frontend aus, leitet /api an die API weiter und holt das HTTPS-Zertifikat
FROM caddy:2-alpine
COPY --from=build /app/dist /srv

# Image officielle Playwright — Chromium + toutes ses dépendances système déjà inclus
FROM mcr.microsoft.com/playwright:v1.50.0-noble

WORKDIR /app

# Copier les manifests pour profiter du cache Docker (npm install ne re-tourne que si package.json change)
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/package.json
COPY backend/package.json ./backend/package.json

RUN npm ci

# Copier les sources
COPY shared/ ./shared/
COPY backend/ ./backend/

# Build shared puis backend
RUN npm run build --workspace=shared
RUN npm run build --workspace=backend

WORKDIR /app/backend

EXPOSE 3000

CMD ["node", "dist/main.js"]

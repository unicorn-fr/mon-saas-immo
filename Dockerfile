# API Bailio (VPS, voir deploy/vps). Le site est construit à part (deploy/vps/Dockerfile.caddy).
# Node 22, version suivie (Node 20 n'a plus de correctifs depuis avril 2026, dont Node2Shell, CVE-2026-111497,
# corrigé en 22.23.4). update.sh reconstruit avec --pull : chaque mise à jour reprend le dernier correctif de Node 22.
FROM node:22-slim
# openssl : Prisma. tesseract-ocr(-fra) et poppler-utils : lecture des baux importés, sur le serveur.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl tesseract-ocr tesseract-ocr-fra poppler-utils \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server ./
RUN npm run build
ENV NODE_ENV=production
EXPOSE 5000
# migrate deploy n'applique que des migrations versionnées : il ne supprime jamais de données.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]

# API Bailio (VPS, voir deploy/vps). Le site est construit à part (deploy/vps/Dockerfile.caddy).
FROM node:20-slim
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

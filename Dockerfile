# API Bailio (Railway). Le site est déployé séparément sur Vercel (dossier client/).
FROM node:20-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server ./
RUN npm run build
ENV NODE_ENV=production
EXPOSE 5000
# migrate deploy n'applique que des migrations versionnées : il ne supprime jamais de données.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]

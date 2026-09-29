# API Bailio (Railway). Le client est déployé séparément sur Vercel (dossier client/).
FROM node:20-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/
RUN npm ci --workspace server --include-workspace-root
COPY server ./server
RUN npm run build --workspace server
ENV NODE_ENV=production
EXPOSE 5000
# migrate deploy n'applique que des migrations versionnées : il ne supprime jamais de données.
CMD ["sh", "-c", "cd server && npx prisma migrate deploy && node dist/server.js"]

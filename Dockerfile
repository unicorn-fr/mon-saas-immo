FROM node:20-slim

# ── Dépendances système ────────────────────────────────────────────────────────
# Python3 + pip + Tesseract OCR (avec pack français) + libs OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip \
    tesseract-ocr tesseract-ocr-fra \
    libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# ── Dépendances Python OCR ─────────────────────────────────────────────────────
# Léger (~150MB) — fastmrz (MRZ ICAO) + pytesseract + OpenCV + FastAPI
RUN pip3 install --no-cache-dir --break-system-packages \
    fastapi \
    "uvicorn[standard]" \
    fastmrz \
    pytesseract \
    opencv-python-headless \
    numpy \
    Pillow

WORKDIR /app

# ── Dépendances Node ───────────────────────────────────────────────────────────
COPY package*.json ./
COPY server/package*.json ./server/
RUN npm --prefix server ci

# ── Code source ────────────────────────────────────────────────────────────────
COPY . .

# ── Build TypeScript + génération client Prisma ────────────────────────────────
RUN npm --prefix server run build

EXPOSE 5000

# ── Démarrage production ───────────────────────────────────────────────────────
# 1. ulimit pour les connexions SSE
# 2. Prisma db push (applique le schema)
# 3. PM2 cluster mode
CMD ["sh", "-c", "\
  ulimit -n 65535 2>/dev/null || true && \
  cd server && \
  ./node_modules/.bin/prisma db push --accept-data-loss --skip-generate && \
  npx pm2-runtime ecosystem.config.cjs --env production \
"]

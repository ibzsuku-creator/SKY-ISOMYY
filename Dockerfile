# ── SKY-ISOMYY — Image Docker unique pour Render / Railway / Koyeb ──
FROM node:20-bookworm-slim

# Dépendances système : ffmpeg (conversion audio pour song.js), libs pour sharp, git
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    build-essential \
    libvips-dev \
    git \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps --omit=dev

COPY . .

RUN mkdir -p sessions temp

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "web.js"]


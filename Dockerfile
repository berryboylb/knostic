# ---------- builder ----------
FROM node:20-slim AS builder
RUN apt-get update && apt-get install -y python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json package-lock.json* ./
COPY frontend/package.json frontend/package-lock.json* ./frontend/
COPY backend/package.json backend/package-lock.json* ./backend/

RUN npm install --workspaces
COPY . .

RUN npm run build --workspace frontend
RUN npm run build --workspace backend

# ---------- runtime ----------
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/frontend/dist ./backend/dist/public
COPY --from=builder /app/backend/package.json ./backend/package.json

WORKDIR /app/backend
RUN npm install --omit=dev --only=production

EXPOSE 8080
CMD ["node", "dist/index.js"]

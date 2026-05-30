# ── Stage 1: Build Frontend ───────────────────────────────
FROM node:20-alpine AS client-builder
WORKDIR /app/client

# Copy client dependencies and install
COPY client/package*.json ./
RUN npm ci

# Copy client source code and build
COPY client/ ./
RUN npm run build

# ── Stage 2: Build & Run Backend ──────────────────────────
FROM node:20-alpine
WORKDIR /app/server

# Copy server dependencies and install
COPY server/package*.json ./
RUN npm ci --only=production

# Copy server source code
COPY server/ ./

# Copy built frontend assets into server's public folder
COPY --from=client-builder /app/client/dist ./public

# Expose port and configure execution
EXPOSE 5000
ENV PORT=5000
ENV NODE_ENV=production

CMD ["node", "index.js"]

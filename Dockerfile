FROM node:20-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci --legacy-peer-deps

COPY client/ ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

COPY server/ ./

COPY --from=client-builder /app/client/dist ./public

EXPOSE 5000
ENV PORT=5000
ENV NODE_ENV=production

CMD ["node", "index.js"]

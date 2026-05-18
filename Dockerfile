# ── Etapa 1: builder ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# 1. Instalamos dependencias
COPY package*.json ./
RUN npm ci

# 2. Generamos Prisma
COPY prisma ./prisma
RUN npx prisma generate

# 3. Copiamos TODOS los archivos necesarios para compilar
COPY tsconfig*.json ./
COPY src ./src
COPY scripts ./scripts

# 4. AHORA SÍ, ejecutamos el build (ya tiene todo lo que necesita)
RUN npm run build

# ── Etapa 2: runner ───────────────────────────────────────────
FROM node:20-alpine AS runner

ARG COMMIT_SHA
ENV COMMIT_SHA=$COMMIT_SHA

WORKDIR /app

# 1. Instalamos SOLO dependencias de producción (más rápido y ligero)
COPY package*.json ./
RUN npm ci --omit=dev

# 2. Prisma necesita su cliente en producción también
COPY prisma ./prisma
RUN npx prisma generate

# 3. Copiamos la carpeta 'dist' ya compilada desde la Etapa 1
COPY --from=builder /app/dist ./dist

# Si vas a usar el entrypoint de tu segunda versión, lo ponemos aquí:
# COPY docker-entrypoint.sh ./
# RUN chmod +x docker-entrypoint.sh

EXPOSE ${PORT:-3000}

# Arrancamos el servidor
CMD ["node", "dist/server.js"]
# Si usabas el entrypoint, borra el CMD de arriba y descomenta esta línea:
# ENTRYPOINT ["./docker-entrypoint.sh"]
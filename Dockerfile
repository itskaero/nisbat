# Nisbat Home — production image (Next.js standalone server).
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    NISBAT_DATA_DIR=/data
RUN apk add --no-cache su-exec && addgroup -S nisbat && adduser -S nisbat -G nisbat && mkdir -p /data
COPY --from=build --chown=nisbat:nisbat /app/.next/standalone ./
COPY --from=build --chown=nisbat:nisbat /app/.next/static ./.next/static
COPY --from=build --chown=nisbat:nisbat /app/public ./public
COPY --chmod=755 docker/entrypoint.sh /usr/local/bin/entrypoint.sh
EXPOSE 3000
VOLUME ["/data"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["node", "server.js"]

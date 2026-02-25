# node production image with pm2-runtime
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
# agar sizda native deps bo'lsa build tools kerak bo'lishi mumkin
RUN npm ci --production
COPY . .


FROM node:20-alpine
WORKDIR /app
# pm2-runtime for container-friendly process management
RUN npm install -g pm2@5
COPY --from=builder /app /app
ENV NODE_ENV=production
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
CMD wget --spider --quiet http://localhost:3000/health || exit 1
# Run with pm2-runtime so signals are forwarded correctly
CMD ["pm2-runtime", "start", "ecosystem.config.js", "--env", "production"]
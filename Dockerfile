# ── Enterprise Workflow Hub ── Production Dockerfile ──
FROM node:20-alpine

LABEL maintainer="Enterprise Workflow Team"
LABEL version="2.1.0"

WORKDIR /app

# Install dependencies first for layer caching
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY docs/ ./docs/
COPY servicenow/ ./servicenow/
COPY tests/ ./tests/
COPY logs/ ./logs/
COPY server.js ./
COPY .env.example ./
COPY README.md ./
COPY CHANGELOG.md ./

# Create logs directory if not present
RUN mkdir -p logs

# Expose HTTP + WebSocket port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r => { if(r.status !== 200) process.exit(1) })" || exit 1

USER node

CMD ["node", "backend/server.js"]

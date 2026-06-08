# ── Enterprise Workflow Hub ── Production Dockerfile ──
FROM node:20-alpine

LABEL maintainer="Enterprise Workflow Team"
LABEL version="2.1.0"

WORKDIR /app

# Install dependencies first for layer caching
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application code
COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY docs/ ./docs/
COPY servicenow/ ./servicenow/
COPY tests/ ./tests/
COPY server.js ./
COPY .env.example ./
COPY README.md ./
COPY CHANGELOG.md ./

# Create the runtime logs directory and make the app writable by the non-root
# "node" user. logs/ is gitignored, so it is intentionally NOT COPYed from the
# build context (it would not exist on a fresh checkout and would break the build).
RUN mkdir -p logs && chown -R node:node /app

# Expose HTTP + WebSocket port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r => { if(r.status !== 200) process.exit(1) })" || exit 1

USER node

CMD ["node", "backend/server.js"]

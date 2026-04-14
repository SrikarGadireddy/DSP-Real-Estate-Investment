# ---- Build stage: compile the React frontend ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests for both workspaces
COPY package.json ./
COPY backend/package.json backend/package-lock.json ./backend/
COPY frontend/package.json frontend/package-lock.json ./frontend/

# Install frontend dependencies
RUN cd frontend && npm ci

# Copy source and build the frontend
COPY frontend/ ./frontend/
RUN cd frontend && npm run build

# ---- Runtime stage ----
FROM node:20-alpine AS runtime

WORKDIR /app

# Install build tools required by better-sqlite3
RUN apk add --no-cache python3 make g++

# Copy backend package manifests and install production dependencies
COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm ci --omit=dev

# Copy backend source
COPY backend/ ./backend/

# Copy the built frontend from the builder stage
COPY --from=builder /app/frontend/dist ./frontend/dist

# Default data directory (override with volume mount in production)
ENV DB_PATH=/data/dsp_real_estate.db
ENV UPLOADS_DIR=/data/uploads
ENV NODE_ENV=production

EXPOSE 5000

# Create the data directory so the app starts even without a mounted volume
RUN mkdir -p /data/uploads

CMD ["node", "backend/src/server.js"]

FROM node:20-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Remove devDependencies to reduce image size
RUN npm prune --production

# Expose port
EXPOSE 3003

# Health check (используем PORT из env или 3003 по умолчанию)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3003}/health || exit 1

# Start the application
CMD ["npm", "start"] 
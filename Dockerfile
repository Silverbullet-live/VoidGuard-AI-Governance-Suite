# VoidGuard AI Governance Suite - Production Docker Image
# Multi-stage build for optimized production deployment

# =============================================================================
# Stage 1: Dependencies and build preparation
# =============================================================================
FROM node:18-alpine AS base

# Install system dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    postgresql-client \
    curl \
    && rm -rf /var/cache/apk/*

# Create application directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# =============================================================================
# Stage 2: Development image (for development/testing)
# =============================================================================
FROM base AS development

# Install development dependencies
RUN npm ci

# Copy source code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S voidguard -u 1001

# Change ownership of app directory
RUN chown -R voidguard:nodejs /app
USER voidguard

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start development server
CMD ["npm", "run", "dev"]

# =============================================================================
# Stage 3: Production image
# =============================================================================
FROM base AS production

# Copy source code
COPY --chown=node:node . .

# Build documentation
RUN npm run build

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S voidguard -u 1001

# Create necessary directories
RUN mkdir -p /app/logs /app/uploads && \
    chown -R voidguard:nodejs /app

# Switch to non-root user
USER voidguard

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Production startup command
CMD ["npm", "start"]

# =============================================================================
# Build args and labels
# =============================================================================
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION=1.0.0

LABEL maintainer="Ricardo Amaral <team@silverbullet.live>" \
      org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.name="VoidGuard AI Governance Suite" \
      org.label-schema.description="Complete Enterprise AI Safety & Governance Platform" \
      org.label-schema.url="https://voidguard.ai" \
      org.label-schema.vcs-ref=$VCS_REF \
      org.label-schema.vcs-url="https://github.com/silverbullet-research/voidguard-ai-governance-suite" \
      org.label-schema.vendor="Silverbullet Research" \
      org.label-schema.version=$VERSION \
      org.label-schema.schema-version="1.0"
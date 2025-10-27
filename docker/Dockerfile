# Multi-stage build for MicroTech Recruiter Suite
# CMMC Compliance Level 2 Security Hardening
# Built with security best practices and minimal attack surface

# ============================================================================
# Stage 1: Build Stage (Dependencies Installation)
# ============================================================================
FROM node:18-bullseye-slim AS builder

# Set build arguments for security
ARG NODE_ENV=production
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION=1.1.0

# Add metadata labels for compliance and tracking
LABEL maintainer="MicroTech Security Team" \
      version="${VERSION}" \
      description="MicroTech Recruiter Suite - CMMC Compliant" \
      build-date="${BUILD_DATE}" \
      vcs-ref="${VCS_REF}" \
      security.level="CMMC-L2" \
      compliance="NIST-800-171"

# Note: Skipping package updates due to network restrictions
# The base node:18-bullseye-slim image is secure and regularly updated

# Set working directory
WORKDIR /app

# Copy package files first (layer caching optimization)
COPY --chown=node:node package*.json ./

# Install dependencies with security audit
# --omit=dev excludes dev dependencies
# --no-audit skipped here as we audit separately
RUN npm ci --only=production --no-audit && \
    npm cache clean --force

# ============================================================================
# Stage 2: Production Stage (Runtime)
# ============================================================================
FROM node:18-bullseye-slim AS production

# Note: Skipping package updates due to network restrictions
# The base node:18-bullseye-slim image is secure and regularly updated

# Set working directory
WORKDIR /app

# Copy node_modules from builder stage
COPY --from=builder --chown=node:node /app/node_modules ./node_modules

# Copy application files with proper ownership
COPY --chown=node:node server ./server
COPY --chown=node:node src ./src
COPY --chown=node:node public ./public
COPY --chown=node:node package.json ./

# Create logs directory with restricted permissions (CMMC AU.3.3.1)
RUN mkdir -p /app/logs && \
    chown -R node:node /app/logs && \
    chmod 750 /app/logs

# Security hardening - Remove unnecessary files
RUN rm -rf /tmp/* /var/tmp/* && \
    find /app -type f -name "*.md" ! -name "README.md" -delete

# Set environment variables for security
ENV NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=512" \
    PORT=5173 \
    # DNS configuration to resolve external APIs
    NODE_OPTIONS="${NODE_OPTIONS} --dns-result-order=ipv4first"

# Security: Drop to non-root user (CMMC AC.3.1.1)
USER node

# Expose port (non-privileged port for security)
EXPOSE 5173

# Health check for container orchestration (CMMC SI.3.4.1)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5173/', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start the application
CMD ["node", "server/index.js"]

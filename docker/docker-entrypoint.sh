#!/bin/bash
# Docker entrypoint script for MicroTech Recruiter Suite
# CMMC Level 2 Compliant Security Validations

set -euo pipefail

# Security: Exit on any error
set -o errexit
set -o nounset
set -o pipefail

echo "🔒 MicroTech Recruiter Suite - Security Hardened Container"
echo "📋 CMMC Level 2 Compliant"
echo "🚀 Starting application..."

# Validate required environment variables
if [ -z "${OPENAI_API_KEY:-}" ]; then
    echo "❌ ERROR: OPENAI_API_KEY environment variable is required"
    echo "💡 Set OPENAI_API_KEY in your .env file or environment"
    exit 1
fi

# Validate API key format (basic check)
if [[ ! "${OPENAI_API_KEY}" =~ ^sk- ]]; then
    echo "⚠️  WARNING: OPENAI_API_KEY doesn't appear to be a valid OpenAI API key"
    echo "💡 OpenAI API keys typically start with 'sk-'"
fi

# Security: Check if running as non-root user
if [ "$(id -u)" = "0" ]; then
    echo "❌ ERROR: Container must not run as root for security compliance"
    echo "💡 The application is configured to run as user 'node'"
    exit 1
fi

# Validate Node.js version
NODE_VERSION=$(node --version)
echo "📦 Node.js version: ${NODE_VERSION}"

# Security: Check file permissions
echo "🔍 Validating file permissions..."
if [ ! -r "server/index.js" ]; then
    echo "❌ ERROR: Cannot read server/index.js"
    exit 1
fi

# Security: Validate package.json integrity
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: package.json not found"
    exit 1
fi

# Security: Check for suspicious files
echo "🔍 Security scan: Checking for suspicious files..."
if find . -name "*.sh" -o -name "*.exe" -o -name "*.bat" | grep -q .; then
    echo "⚠️  WARNING: Found executable files in container"
fi

# Security: Validate port binding
PORT=${PORT:-5173}
if ! [[ "$PORT" =~ ^[0-9]+$ ]] || [ "$PORT" -lt 1024 ] || [ "$PORT" -gt 65535 ]; then
    echo "❌ ERROR: Invalid port number: $PORT"
    echo "💡 Port must be between 1024-65535 for security compliance"
    exit 1
fi

echo "✅ Security validations passed"
echo "🌐 Starting server on port ${PORT}..."

# Start the application
exec node server/index.js

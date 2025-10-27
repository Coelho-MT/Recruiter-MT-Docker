#!/bin/bash
# Build script for MicroTech Recruiter Suite Docker image
# CMMC Level 2 Compliant Build Process

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏗️  MicroTech Recruiter Suite - Docker Build Script${NC}"
echo -e "${BLUE}📋 CMMC Level 2 Compliant${NC}"
echo ""

# Configuration
IMAGE_NAME="recruiter-mt"
VERSION="${VERSION:-1.1.0}"
BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
VCS_REF=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

echo -e "${YELLOW}📦 Build Configuration:${NC}"
echo "  Image: ${IMAGE_NAME}"
echo "  Version: ${VERSION}"
echo "  Build Date: ${BUILD_DATE}"
echo "  Git Commit: ${VCS_REF}"
echo ""

# Validate Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ ERROR: Docker is not running${NC}"
    echo "💡 Please start Docker Desktop and try again"
    exit 1
fi

# Validate .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  WARNING: .env file not found${NC}"
    echo "💡 Create a .env file with your OPENAI_API_KEY"
    echo "   Example: echo 'OPENAI_API_KEY=your_key_here' > .env"
fi

# Build the Docker image
echo -e "${BLUE}🔨 Building Docker image...${NC}"
docker build \
    --build-arg NODE_ENV=production \
    --build-arg BUILD_DATE="${BUILD_DATE}" \
    --build-arg VCS_REF="${VCS_REF}" \
    --build-arg VERSION="${VERSION}" \
    --tag "${IMAGE_NAME}:${VERSION}" \
    --tag "${IMAGE_NAME}:latest" \
    --file docker/Dockerfile \
    .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Docker image built successfully!${NC}"
    echo ""
    echo -e "${YELLOW}📋 Image Details:${NC}"
    docker images "${IMAGE_NAME}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
    echo ""
    echo -e "${GREEN}🚀 Ready to deploy!${NC}"
    echo ""
    echo -e "${BLUE}💡 Next steps:${NC}"
    echo "  1. Test locally: cd docker && docker compose up"
    echo "  2. Deploy to production: docker compose -f docker/docker-compose.production.yml up -d"
    echo "  3. Access at: http://localhost:5173"
else
    echo -e "${RED}❌ Docker build failed${NC}"
    exit 1
fi

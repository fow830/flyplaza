#!/bin/bash

# FlyPlaza Deployment Script for Timeweb.cloud
# Version: 1.0.0

set -e

echo "🚀 FlyPlaza Deployment to Timeweb.cloud"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="flyplaza"
APP_PORT="3002"
DOCKER_IMAGE="flyplaza:latest"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo "Please create .env file from .env.example"
    exit 1
fi

# Load environment variables
source .env

# Check if AVIASALES_API_TOKEN is set
if [ -z "$AVIASALES_API_TOKEN" ]; then
    echo -e "${RED}❌ Error: AVIASALES_API_TOKEN is not set${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables loaded${NC}"
echo ""

# Stop and remove old containers
echo "🛑 Stopping old containers..."
docker-compose down 2>/dev/null || true

# Remove old images
echo "🗑️  Removing old images..."
docker rmi $DOCKER_IMAGE 2>/dev/null || true

# Build new image
echo "🔨 Building Docker image..."
docker build -t $DOCKER_IMAGE .

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"
echo ""

# Start containers
echo "🚀 Starting containers..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to start containers${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Containers started${NC}"
echo ""

# Wait for app to be ready
echo "⏳ Waiting for application to be ready..."
sleep 10

# Health check
echo "🏥 Performing health check..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$APP_PORT || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Application is healthy${NC}"
    echo ""
    echo "🎉 Deployment successful!"
    echo ""
    echo "📍 Application URL: http://localhost:$APP_PORT"
    echo "📊 Container logs: docker-compose logs -f"
    echo "🛑 Stop application: docker-compose down"
else
    echo -e "${RED}❌ Health check failed (HTTP $HTTP_CODE)${NC}"
    echo "📋 Checking logs..."
    docker-compose logs --tail=50
    exit 1
fi

echo ""
echo "✨ FlyPlaza is now running!"


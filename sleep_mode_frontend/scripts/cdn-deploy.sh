#!/usr/bin/env bash
# CDN Deployment Script for Sleep Mode Frontend Static Assets

set -e  # Exit on any error

echo "📦 Deploying Sleep Mode Frontend Assets to CDN..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
APP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$APP_ROOT/dist"
ASSETS_DIR="$BUILD_DIR/assets"
CDN_CONFIG_DIR="$APP_ROOT/cdn-config"

# Load environment variables
if [ -f ".env.production" ]; then
    print_status "Loading production environment variables..."
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# CDN Configuration
CDN_PROVIDER=${CDN_PROVIDER:-"cloudflare"}
CDN_URL=${VITE_CDN_URL:-"https://cdn.sleepmode.app"}
ASSETS_CDN=${VITE_ASSETS_CDN:-"https://assets.sleepmode.app"}

# Check if build exists
if [ ! -d "$BUILD_DIR" ]; then
    print_error "Build directory not found: $BUILD_DIR"
    print_status "Please run 'npm run build:prod' first"
    exit 1
fi

print_status "Starting CDN deployment process..."
echo ""
echo "📋 Deployment Configuration:"
echo "  - CDN Provider: $CDN_PROVIDER"
echo "  - CDN URL: $CDN_URL"
echo "  - Assets CDN: $ASSETS_CDN"
echo ""

# Create CDN configuration directory
mkdir -p "$CDN_CONFIG_DIR"

# Analyze assets for deployment
print_status "Analyzing assets for CDN deployment..."

TOTAL_SIZE=0
FILE_COUNT=0

if [ -d "$ASSETS_DIR" ]; then
    # Calculate total size
    TOTAL_SIZE=$(du -sb "$ASSETS_DIR" 2>/dev/null | cut -f1 || echo "0")
    FILE_COUNT=$(find "$ASSETS_DIR" -type f | wc -l)
    TOTAL_SIZE_MB=$(echo "scale=2; $TOTAL_SIZE / 1048576" | bc -l 2>/dev/null || echo "0")
    
    echo "  Total: ${TOTAL_SIZE_MB}MB ($FILE_COUNT files)"
fi

print_success "CDN deployment script ready! Configure your CDN provider and run deployment." 
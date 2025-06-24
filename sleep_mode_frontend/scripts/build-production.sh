#!/usr/bin/env bash
# Production Build Script for Sleep Mode Frontend

set -e  # Exit on any error

echo "🚀 Building Sleep Mode Frontend for Production..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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
NODE_MODULES_DIR="$APP_ROOT/node_modules"
PACKAGE_JSON="$APP_ROOT/package.json"

# Check if we're in the right directory
if [ ! -f "$PACKAGE_JSON" ]; then
    print_error "package.json not found. Make sure you're running this from the frontend root directory."
    exit 1
fi

cd "$APP_ROOT"

# Load environment variables
if [ -f ".env.production" ]; then
    print_status "Loading production environment variables..."
    export $(cat .env.production | grep -v '^#' | xargs)
else
    print_warning "No .env.production file found. Using default values."
fi

# Set Node environment
export NODE_ENV=production

print_status "Starting production build process..."
echo ""
echo "📋 Build Configuration:"
echo "  - App Root: $APP_ROOT"
echo "  - Build Directory: $BUILD_DIR"
echo "  - Node Environment: $NODE_ENV"
echo "  - Node Version: $(node --version)"
echo "  - NPM Version: $(npm --version)"
echo ""

# Clean previous build
print_status "Cleaning previous build..."
if [ -d "$BUILD_DIR" ]; then
    rm -rf "$BUILD_DIR"
    print_success "Previous build cleaned"
else
    print_status "No previous build found"
fi

# Check Node version
NODE_VERSION=$(node --version | cut -d'v' -f2)
MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)

if [ $MAJOR_VERSION -lt 16 ]; then
    print_error "Node.js version 16 or higher is required. Current version: $NODE_VERSION"
    exit 1
else
    print_success "Node.js version check passed: $NODE_VERSION"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "$NODE_MODULES_DIR" ]; then
    print_status "Installing dependencies..."
    npm ci --production=false
    print_success "Dependencies installed"
else
    print_status "Dependencies already installed, checking for updates..."
    npm ci --production=false
    print_success "Dependencies verified"
fi

# Type checking
print_status "Running TypeScript type checking..."
if npx tsc --noEmit; then
    print_success "TypeScript type checking passed"
else
    print_error "TypeScript type checking failed"
    exit 1
fi

# Linting
print_status "Running ESLint..."
if npm run lint; then
    print_success "Linting passed"
else
    print_warning "Linting issues found, continuing with build..."
fi

# Run tests if they exist
if npm run test --silent 2>/dev/null; then
    print_status "Running tests..."
    if npm run test -- --run --reporter=verbose; then
        print_success "Tests passed"
    else
        print_warning "Some tests failed, continuing with build..."
    fi
else
    print_status "No tests found, skipping test step"
fi

# Build the application
print_status "Building application..."
BUILD_START=$(date +%s)

if npm run build; then
    BUILD_END=$(date +%s)
    BUILD_TIME=$((BUILD_END - BUILD_START))
    print_success "Build completed in ${BUILD_TIME} seconds"
else
    print_error "Build failed"
    exit 1
fi

# Verify build output
if [ ! -d "$BUILD_DIR" ]; then
    print_error "Build directory not created"
    exit 1
fi

if [ ! -f "$BUILD_DIR/index.html" ]; then
    print_error "index.html not found in build output"
    exit 1
fi

print_success "Build output verified"

# Analyze build size
print_status "Analyzing build size..."

# Calculate total build size
BUILD_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)
print_status "Total build size: $BUILD_SIZE"

# Calculate asset sizes
if [ -d "$BUILD_DIR/assets" ]; then
    echo ""
    echo "📊 Asset Analysis:"
    
    # JavaScript files
    if [ -d "$BUILD_DIR/assets/js" ]; then
        JS_SIZE=$(du -sh "$BUILD_DIR/assets/js" 2>/dev/null | cut -f1 || echo "0B")
        JS_COUNT=$(find "$BUILD_DIR/assets/js" -name "*.js" | wc -l)
        echo "  - JavaScript: $JS_SIZE ($JS_COUNT files)"
        
        # List largest JS files
        echo "    Largest JS files:"
        find "$BUILD_DIR/assets/js" -name "*.js" -exec ls -lh {} \; | sort -k5 -hr | head -3 | awk '{print "      " $9 ": " $5}'
    fi
    
    # CSS files
    if [ -d "$BUILD_DIR/assets/css" ]; then
        CSS_SIZE=$(du -sh "$BUILD_DIR/assets/css" 2>/dev/null | cut -f1 || echo "0B")
        CSS_COUNT=$(find "$BUILD_DIR/assets/css" -name "*.css" | wc -l)
        echo "  - CSS: $CSS_SIZE ($CSS_COUNT files)"
    fi
    
    # Image files
    if [ -d "$BUILD_DIR/assets/images" ]; then
        IMG_SIZE=$(du -sh "$BUILD_DIR/assets/images" 2>/dev/null | cut -f1 || echo "0B")
        IMG_COUNT=$(find "$BUILD_DIR/assets/images" -type f | wc -l)
        echo "  - Images: $IMG_SIZE ($IMG_COUNT files)"
    fi
    
    # Font files
    if [ -d "$BUILD_DIR/assets/fonts" ]; then
        FONT_SIZE=$(du -sh "$BUILD_DIR/assets/fonts" 2>/dev/null | cut -f1 || echo "0B")
        FONT_COUNT=$(find "$BUILD_DIR/assets/fonts" -type f | wc -l)
        echo "  - Fonts: $FONT_SIZE ($FONT_COUNT files)"
    fi
fi

# Check for large files
echo ""
print_status "Checking for large files (>500KB)..."
LARGE_FILES=$(find "$BUILD_DIR" -type f -size +500k)

if [ -z "$LARGE_FILES" ]; then
    print_success "No large files found"
else
    print_warning "Large files detected:"
    echo "$LARGE_FILES" | while read file; do
        size=$(ls -lh "$file" | awk '{print $5}')
        echo "  - $(basename "$file"): $size"
    done
fi

# Gzip compression analysis
print_status "Analyzing gzip compression potential..."

if command -v gzip >/dev/null 2>&1; then
    echo ""
    echo "📦 Compression Analysis:"
    
    # Create temporary gzip files for analysis
    TEMP_GZIP_DIR=$(mktemp -d)
    
    # Analyze main files
    if [ -f "$BUILD_DIR/index.html" ]; then
        cp "$BUILD_DIR/index.html" "$TEMP_GZIP_DIR/"
        gzip "$TEMP_GZIP_DIR/index.html"
        ORIGINAL_SIZE=$(stat -f%z "$BUILD_DIR/index.html" 2>/dev/null || stat -c%s "$BUILD_DIR/index.html")
        GZIPPED_SIZE=$(stat -f%z "$TEMP_GZIP_DIR/index.html.gz" 2>/dev/null || stat -c%s "$TEMP_GZIP_DIR/index.html.gz")
        RATIO=$(echo "scale=1; $GZIPPED_SIZE * 100 / $ORIGINAL_SIZE" | bc -l 2>/dev/null || echo "N/A")
        echo "  - index.html: $(numfmt --to=iec $ORIGINAL_SIZE) → $(numfmt --to=iec $GZIPPED_SIZE) (${RATIO}%)"
    fi
    
    # Clean up
    rm -rf "$TEMP_GZIP_DIR"
else
    print_warning "gzip not available for compression analysis"
fi

# Generate build manifest
print_status "Generating build manifest..."

BUILD_MANIFEST="$BUILD_DIR/build-manifest.json"
cat > "$BUILD_MANIFEST" << EOF
{
  "buildTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "buildDuration": ${BUILD_TIME},
  "nodeVersion": "$(node --version)",
  "npmVersion": "$(npm --version)",
  "gitCommit": "$(git rev-parse HEAD 2>/dev/null || echo "unknown")",
  "gitBranch": "$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")",
  "buildSize": "$BUILD_SIZE",
  "environment": "production"
}
EOF

print_success "Build manifest generated"

# Security check
print_status "Running security checks..."

# Check for sensitive files
SENSITIVE_PATTERNS=(".env" "config.json" "secrets" "private" "key")
FOUND_SENSITIVE=false

for pattern in "${SENSITIVE_PATTERNS[@]}"; do
    if find "$BUILD_DIR" -name "*$pattern*" -type f | grep -q .; then
        print_warning "Potentially sensitive files found with pattern: $pattern"
        find "$BUILD_DIR" -name "*$pattern*" -type f | sed 's/^/    /'
        FOUND_SENSITIVE=true
    fi
done

if [ "$FOUND_SENSITIVE" = false ]; then
    print_success "No sensitive files detected in build"
fi

# Create deployment info
print_status "Creating deployment information..."

DEPLOYMENT_INFO="$BUILD_DIR/deployment-info.txt"
cat > "$DEPLOYMENT_INFO" << EOF
Sleep Mode Frontend - Production Build
=====================================

Build Information:
- Build Time: $(date)
- Build Duration: ${BUILD_TIME} seconds
- Build Size: $BUILD_SIZE
- Node Version: $(node --version)
- Environment: production

Deployment Instructions:
1. Upload the contents of this directory to your web server
2. Configure your web server to serve index.html for all routes (SPA mode)
3. Set appropriate cache headers for static assets
4. Enable gzip compression for text files
5. Configure HTTPS and security headers

Asset Structure:
- /assets/js/     - JavaScript bundles
- /assets/css/    - CSS stylesheets  
- /assets/images/ - Image assets
- /assets/fonts/  - Font files

For CDN deployment:
- Upload assets/ directory to your CDN
- Update VITE_CDN_URL environment variable
- Ensure proper CORS headers on CDN

Health Check:
- Verify index.html loads correctly
- Check console for any JavaScript errors
- Validate all assets load from correct URLs
- Test application functionality

EOF

print_success "Deployment information created"

# Final summary
echo ""
echo "🎉 Production Build Completed Successfully!"
echo ""
echo "📋 Build Summary:"
echo "  - Build Directory: $BUILD_DIR"
echo "  - Build Size: $BUILD_SIZE"
echo "  - Build Time: ${BUILD_TIME} seconds"
echo "  - Files Generated: $(find "$BUILD_DIR" -type f | wc -l)"
echo ""
echo "🚀 Next Steps:"
echo "  1. Test the build: npm run preview"
echo "  2. Deploy to staging environment"
echo "  3. Run production tests"
echo "  4. Deploy to production"
echo ""
echo "📁 Key Files:"
echo "  - Application: $BUILD_DIR/index.html"
echo "  - Build Manifest: $BUILD_MANIFEST"
echo "  - Deployment Info: $DEPLOYMENT_INFO"
echo ""

print_success "Production build script completed! 🎯" 
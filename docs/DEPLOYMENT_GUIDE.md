# Sleep Mode Deployment Guide

This comprehensive guide covers deployment procedures for the Sleep Mode multi-platform application, including Rails API backend, React frontend, and Flutter mobile app.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Production Deployment](#production-deployment)
- [Development Deployment](#development-deployment)
- [Database Setup](#database-setup)
- [Mobile App Deployment](#mobile-app-deployment)
- [Monitoring and Health Checks](#monitoring-and-health-checks)
- [Backup and Recovery](#backup-and-recovery)
- [Post-Deployment Verification](#post-deployment-verification)

## Overview

Sleep Mode consists of three main components:
- **Rails API Backend** (`sleep_mode_rails/`) - Ruby on Rails 8.0.2 API-only application
- **React Frontend** (`sleep_mode_frontend/`) - React 19.1.0 with TypeScript and Vite
- **Flutter Mobile App** (`sleep_mode_flutter/`) - Cross-platform mobile application

## Prerequisites

### System Requirements

#### Backend (Rails API)
- **Ruby**: 3.3.0 or higher
- **Rails**: 8.0.2
- **Database**: PostgreSQL 14+ (production) / SQLite (development)
- **Cache/Session Store**: Redis 6+ (production)
- **Web Server**: Puma (included with Rails)

#### Frontend (React)
- **Node.js**: 18.19.0 or higher
- **NPM**: 9.6.0 or higher
- **Build Tool**: Vite 6.0.7

#### Mobile (Flutter)
- **Flutter SDK**: 3.22.0 or higher
- **Dart SDK**: 3.3.0 or higher
- **Android SDK**: API level 21+ (Android 5.0+)
- **iOS**: iOS 12+ (for iOS deployment)

### Required Services

#### Production
- **Database**: PostgreSQL instance
- **Cache**: Redis instance
- **CDN**: For static asset delivery (recommended)
- **SSL Certificate**: For HTTPS
- **Monitoring**: Application and infrastructure monitoring

#### Development
- **Database**: PostgreSQL (recommended) or SQLite
- **Cache**: Redis (optional for development)

## Environment Configuration

### 1. Environment Variables

Create `.env` files in each component directory:

#### Rails Backend (`.env`)
```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost/sleep_mode_production
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY_BASE=your_secret_key_base_here
JWT_SECRET=your_jwt_secret_here

# CORS Configuration
FRONTEND_URL=https://your-frontend-domain.com
MOBILE_APP_SCHEME=sleepmode

# Email Configuration (if using email features)
SMTP_SERVER=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=your_smtp_username
SMTP_PASSWORD=your_smtp_password

# External API Keys (if applicable)
EXTERNAL_API_KEY=your_external_api_key

# Environment
RAILS_ENV=production
RACK_ENV=production
```

#### React Frontend (`.env.production`)
```bash
# API Configuration
VITE_API_URL=https://api.your-domain.com
VITE_API_VERSION=v1

# Authentication
VITE_JWT_STORAGE_KEY=sleep_mode_token

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true

# CDN Configuration
VITE_CDN_URL=https://cdn.your-domain.com
```

#### Flutter Mobile (environment configuration in `lib/config/`)
```dart
// lib/config/environment.dart
class Environment {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://api.your-domain.com',
  );
  
  static const String apiVersion = String.fromEnvironment(
    'API_VERSION',
    defaultValue: 'v1',
  );
  
  static const bool enableAnalytics = bool.fromEnvironment(
    'ENABLE_ANALYTICS',
    defaultValue: true,
  );
}
```

### 2. Configuration Files

#### Rails Application Configuration

**config/environments/production.rb**
```ruby
Rails.application.configure do
  config.cache_classes = true
  config.eager_load = true
  config.consider_all_requests_local = false
  config.public_file_server.enabled = ENV['RAILS_SERVE_STATIC_FILES'].present?
  config.force_ssl = true
  config.log_level = :info
  config.log_tags = [ :request_id ]
  
  # Database configuration
  config.active_record.dump_schema_after_migration = false
  
  # Cache store
  config.cache_store = :redis_cache_store, { url: ENV['REDIS_URL'] }
  
  # Session store
  config.session_store :redis_store, {
    servers: [ENV['REDIS_URL']],
    expire_after: 90.minutes,
    key: '_sleep_mode_session'
  }
end
```

**config/puma.rb (Production)**
```ruby
max_threads_count = ENV.fetch("RAILS_MAX_THREADS") { 5 }
min_threads_count = ENV.fetch("RAILS_MIN_THREADS") { max_threads_count }
threads min_threads_count, max_threads_count

port ENV.fetch("PORT") { 3000 }
environment ENV.fetch("RAILS_ENV") { "production" }

workers ENV.fetch("WEB_CONCURRENCY") { 2 }
preload_app!

allow_puma_mode = ENV.fetch("ALLOW_PUMA_MODE") { true }

on_worker_boot do
  ActiveRecord::Base.establish_connection if defined?(ActiveRecord)
end

plugin :tmp_restart
```

## Production Deployment

### 1. Rails API Backend Deployment

#### Option A: Traditional Server Deployment

**Step 1: Prepare the Server**
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Ruby via rbenv
curl -fsSL https://github.com/rbenv/rbenv-installer/raw/HEAD/bin/rbenv-installer | bash
echo 'export PATH="$HOME/.rbenv/bin:$PATH"' >> ~/.bashrc
echo 'eval "$(rbenv init -)"' >> ~/.bashrc
source ~/.bashrc

# Install Ruby
rbenv install 3.3.0
rbenv global 3.3.0

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Install Redis
sudo apt install redis-server -y
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

**Step 2: Database Setup**
```bash
# Create database user
sudo -u postgres createuser --interactive --pwprompt sleep_mode_user

# Create database
sudo -u postgres createdb -O sleep_mode_user sleep_mode_production
```

**Step 3: Application Deployment**
```bash
# Clone repository
git clone https://github.com/your-username/sleep-mode.git
cd sleep-mode/sleep_mode_rails

# Install dependencies
bundle install --deployment --without development test

# Setup database
RAILS_ENV=production bundle exec rails db:create db:migrate

# Precompile assets (if any)
RAILS_ENV=production bundle exec rails assets:precompile

# Start server
RAILS_ENV=production bundle exec puma -C config/puma.rb
```

#### Option B: Docker Deployment

**Dockerfile**
```dockerfile
FROM ruby:3.3.0-alpine

# Install system dependencies
RUN apk add --no-cache \
    build-base \
    postgresql-dev \
    nodejs \
    npm \
    git

# Set working directory
WORKDIR /app

# Copy Gemfile and install gems
COPY Gemfile Gemfile.lock ./
RUN bundle install --deployment --without development test

# Copy application
COPY . .

# Precompile assets
RUN RAILS_ENV=production bundle exec rails assets:precompile

# Expose port
EXPOSE 3000

# Start server
CMD ["bundle", "exec", "puma", "-C", "config/puma.rb"]
```

**docker-compose.yml**
```yaml
version: '3.8'
services:
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: sleep_mode_production
      POSTGRES_USER: sleep_mode_user
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"

  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://sleep_mode_user:your_password@db:5432/sleep_mode_production
      REDIS_URL: redis://redis:6379/0
      RAILS_ENV: production
    depends_on:
      - db
      - redis
    volumes:
      - ./log:/app/log

volumes:
  postgres_data:
```

### 2. React Frontend Deployment

#### Build for Production
```bash
cd sleep_mode_frontend

# Install dependencies
npm ci

# Run tests
npm run test:coverage

# Build for production
npm run build

# Verify build
npm run preview
```

#### Option A: Static Hosting (Netlify/Vercel)

**netlify.toml**
```toml
[build]
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18.19.0"
```

**vercel.json**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "env": {
    "VITE_API_URL": "https://api.your-domain.com"
  }
}
```

#### Option B: Nginx Deployment

**nginx.conf**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;

    root /var/www/sleep-mode-frontend/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (optional, if not using separate domain)
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. SSL Certificate Setup

#### Using Let's Encrypt (Certbot)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d api.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Development Deployment

### 1. Local Development Setup

#### Backend Setup
```bash
cd sleep_mode_rails

# Install Ruby dependencies
bundle install

# Setup database
rails db:create db:migrate db:seed

# Start server
rails server -p 3000
```

#### Frontend Setup
```bash
cd sleep_mode_frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

#### Flutter Setup
```bash
cd sleep_mode_flutter

# Get dependencies
flutter pub get

# Run on connected device/emulator
flutter run

# For specific platform
flutter run -d android
flutter run -d ios
```

### 2. Docker Development Environment

**docker-compose.dev.yml**
```yaml
version: '3.8'
services:
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: sleep_mode_development
      POSTGRES_USER: sleep_mode_user
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"

  api:
    build:
      context: ./sleep_mode_rails
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://sleep_mode_user:password@db:5432/sleep_mode_development
      REDIS_URL: redis://redis:6379/0
    depends_on:
      - db
      - redis
    volumes:
      - ./sleep_mode_rails:/app
      - bundle_cache:/usr/local/bundle

  frontend:
    build:
      context: ./sleep_mode_frontend
      dockerfile: Dockerfile.dev
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:3000
    volumes:
      - ./sleep_mode_frontend:/app
      - node_modules:/app/node_modules

volumes:
  postgres_dev_data:
  bundle_cache:
  node_modules:
```

## Database Setup

### 1. PostgreSQL Configuration

#### Installation and Setup
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start and enable service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create user and database
sudo -u postgres psql
CREATE USER sleep_mode_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE sleep_mode_production OWNER sleep_mode_user;
GRANT ALL PRIVILEGES ON DATABASE sleep_mode_production TO sleep_mode_user;
\q
```

#### Production Optimization
```sql
-- /etc/postgresql/14/main/postgresql.conf
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
```

### 2. Database Migrations

#### Production Migration Process
```bash
# Backup database before migration
pg_dump sleep_mode_production > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migrations
RAILS_ENV=production bundle exec rails db:migrate

# Verify migration
RAILS_ENV=production bundle exec rails db:migrate:status
```

#### Rollback Process
```bash
# Rollback to specific version
RAILS_ENV=production bundle exec rails db:migrate:down VERSION=20241201000000

# Restore from backup if needed
psql sleep_mode_production < backup_20241201_120000.sql
```

## Mobile App Deployment

### 1. Android Deployment

#### Build Process
```bash
cd sleep_mode_flutter

# Clean previous builds
flutter clean
flutter pub get

# Build APK for testing
flutter build apk --release

# Build App Bundle for Play Store
flutter build appbundle --release
```

#### Play Store Deployment
```bash
# Generate keystore (first time only)
keytool -genkey -v -keystore ~/upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload

# Configure signing in android/key.properties
storePassword=your_store_password
keyPassword=your_key_password
keyAlias=upload
storeFile=/path/to/upload-keystore.jks

# Build signed app bundle
flutter build appbundle --release

# Upload to Play Console
# File location: build/app/outputs/bundle/release/app-release.aab
```

### 2. iOS Deployment

#### Prerequisites
```bash
# Xcode Command Line Tools
xcode-select --install

# CocoaPods
sudo gem install cocoapods
```

#### Build Process
```bash
cd sleep_mode_flutter

# Install iOS dependencies
cd ios
pod install
cd ..

# Build for iOS
flutter build ios --release

# Archive for App Store (requires Xcode)
# Open ios/Runner.xcworkspace in Xcode
# Product -> Archive -> Distribute App
```

#### App Store Connect
1. Create app record in App Store Connect
2. Configure app information, pricing, and availability
3. Upload build using Xcode or Application Loader
4. Submit for review

## Monitoring and Health Checks

### 1. Application Monitoring

#### Rails Health Check Endpoint
```ruby
# config/routes.rb
Rails.application.routes.draw do
  get '/health', to: 'health#check'
end

# app/controllers/health_controller.rb
class HealthController < ApplicationController
  def check
    health_status = {
      status: 'healthy',
      timestamp: Time.current.iso8601,
      version: Rails.application.config.version,
      database: database_status,
      redis: redis_status,
      dependencies: dependencies_status
    }
    
    render json: health_status, status: :ok
  rescue => e
    render json: { 
      status: 'unhealthy', 
      error: e.message,
      timestamp: Time.current.iso8601 
    }, status: :service_unavailable
  end

  private

  def database_status
    ActiveRecord::Base.connection.execute('SELECT 1')
    'connected'
  rescue
    'disconnected'
  end

  def redis_status
    Rails.cache.redis.ping == 'PONG' ? 'connected' : 'disconnected'
  rescue
    'disconnected'
  end

  def dependencies_status
    {
      postgresql: database_status,
      redis: redis_status
    }
  end
end
```

#### Monitoring Script
```bash
#!/bin/bash
# monitoring/health_check.sh

API_URL="https://api.your-domain.com/health"
FRONTEND_URL="https://your-domain.com"

# Check API health
api_status=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)
if [ $api_status -eq 200 ]; then
    echo "API: Healthy"
else
    echo "API: Unhealthy (Status: $api_status)"
    # Send alert (email, Slack, etc.)
fi

# Check frontend
frontend_status=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL)
if [ $frontend_status -eq 200 ]; then
    echo "Frontend: Healthy"
else
    echo "Frontend: Unhealthy (Status: $frontend_status)"
    # Send alert
fi
```

### 2. Log Management

#### Rails Logging Configuration
```ruby
# config/environments/production.rb
config.log_level = :info
config.log_formatter = ::Logger::Formatter.new
config.log_tags = [ :request_id, :remote_ip, :user_agent ]

# Use structured logging
config.logger = ActiveSupport::Logger.new(STDOUT)
config.logger.formatter = proc do |severity, timestamp, progname, msg|
  {
    timestamp: timestamp.iso8601,
    severity: severity,
    progname: progname,
    message: msg,
    request_id: Current.request_id
  }.to_json + "\n"
end
```

#### Log Rotation
```bash
# /etc/logrotate.d/sleep-mode
/var/log/sleep-mode/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 deploy deploy
}
```

## Backup and Recovery

### 1. Database Backup

#### Automated Backup Script
```bash
#!/bin/bash
# scripts/backup_database.sh

BACKUP_DIR="/var/backups/sleep-mode"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="sleep_mode_production"
DB_USER="sleep_mode_user"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
pg_dump -h localhost -U $DB_USER -d $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

#### Cron Job Setup
```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /path/to/scripts/backup_database.sh >> /var/log/backup.log 2>&1
```

### 2. Application Backup

#### File System Backup
```bash
#!/bin/bash
# scripts/backup_application.sh

APP_DIR="/var/www/sleep-mode"
BACKUP_DIR="/var/backups/sleep-mode/app"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application files (excluding node_modules, .git, etc.)
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz \
    --exclude="node_modules" \
    --exclude=".git" \
    --exclude="log/*" \
    --exclude="tmp/*" \
    $APP_DIR

echo "Application backup completed: app_backup_$DATE.tar.gz"
```

### 3. Recovery Procedures

#### Database Recovery
```bash
# Stop application
sudo systemctl stop sleep-mode-api

# Restore database
gunzip -c /var/backups/sleep-mode/backup_20241201_020000.sql.gz | psql -U sleep_mode_user -d sleep_mode_production

# Start application
sudo systemctl start sleep-mode-api
```

#### Application Recovery
```bash
# Extract backup
cd /var/www
tar -xzf /var/backups/sleep-mode/app/app_backup_20241201_020000.tar.gz

# Restart services
sudo systemctl restart sleep-mode-api
sudo systemctl restart nginx
```

## Post-Deployment Verification

### 1. System Verification Checklist

```bash
#!/bin/bash
# scripts/verify_deployment.sh

echo "=== Sleep Mode Deployment Verification ==="

# Check API health
echo "Checking API health..."
api_response=$(curl -s https://api.your-domain.com/health)
if echo $api_response | grep -q "healthy"; then
    echo "✅ API is healthy"
else
    echo "❌ API health check failed"
    exit 1
fi

# Check frontend
echo "Checking frontend..."
frontend_status=$(curl -s -o /dev/null -w "%{http_code}" https://your-domain.com)
if [ $frontend_status -eq 200 ]; then
    echo "✅ Frontend is accessible"
else
    echo "❌ Frontend check failed (Status: $frontend_status)"
    exit 1
fi

# Check database connectivity
echo "Checking database..."
if RAILS_ENV=production bundle exec rails runner "ActiveRecord::Base.connection.execute('SELECT 1')" > /dev/null 2>&1; then
    echo "✅ Database is connected"
else
    echo "❌ Database connection failed"
    exit 1
fi

# Check Redis
echo "Checking Redis..."
if redis-cli ping | grep -q "PONG"; then
    echo "✅ Redis is responding"
else
    echo "❌ Redis check failed"
    exit 1
fi

# Check SSL certificate
echo "Checking SSL certificate..."
cert_expiry=$(echo | openssl s_client -servername your-domain.com -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
echo "✅ SSL certificate expires: $cert_expiry"

echo "=== Verification completed successfully ==="
```

### 2. Performance Testing

#### Load Testing Script
```bash
#!/bin/bash
# scripts/load_test.sh

# Install Apache Bench if not available
# sudo apt install apache2-utils

echo "Running load tests..."

# Test API endpoints
echo "Testing user authentication..."
ab -n 100 -c 10 -H "Content-Type: application/json" \
   -p test_data/login.json \
   https://api.your-domain.com/auth/login

echo "Testing sleep sessions list..."
ab -n 100 -c 10 -H "Authorization: Bearer $TEST_TOKEN" \
   https://api.your-domain.com/sleep_sessions

echo "Testing frontend..."
ab -n 100 -c 10 https://your-domain.com/

echo "Load testing completed"
```

### 3. Security Verification

#### Security Check Script
```bash
#!/bin/bash
# scripts/security_check.sh

echo "=== Security Verification ==="

# Check HTTPS redirect
echo "Checking HTTPS redirect..."
http_status=$(curl -s -o /dev/null -w "%{http_code}" http://your-domain.com)
if [ $http_status -eq 301 ] || [ $http_status -eq 302 ]; then
    echo "✅ HTTP redirects to HTTPS"
else
    echo "❌ HTTP redirect not configured"
fi

# Check security headers
echo "Checking security headers..."
headers=$(curl -s -I https://your-domain.com)

if echo "$headers" | grep -q "Strict-Transport-Security"; then
    echo "✅ HSTS header present"
else
    echo "❌ HSTS header missing"
fi

if echo "$headers" | grep -q "X-Content-Type-Options"; then
    echo "✅ X-Content-Type-Options header present"
else
    echo "❌ X-Content-Type-Options header missing"
fi

if echo "$headers" | grep -q "X-Frame-Options"; then
    echo "✅ X-Frame-Options header present"
else
    echo "❌ X-Frame-Options header missing"
fi

echo "=== Security verification completed ==="
```

---

## Quick Reference Commands

### Rails Commands
```bash
# Production deployment
RAILS_ENV=production bundle exec rails db:migrate
RAILS_ENV=production bundle exec rails server

# Check status
RAILS_ENV=production bundle exec rails db:migrate:status
RAILS_ENV=production bundle exec rails console
```

### Frontend Commands
```bash
# Build and deploy
npm ci
npm run build
npm run preview

# Testing
npm run test
npm run test:coverage
npm run test:e2e
```

### Flutter Commands
```bash
# Build for production
flutter build apk --release
flutter build appbundle --release
flutter build ios --release

# Install and run
flutter pub get
flutter run
```

### System Commands
```bash
# Service management
sudo systemctl status sleep-mode-api
sudo systemctl restart sleep-mode-api
sudo systemctl restart nginx

# Log monitoring
tail -f /var/log/sleep-mode/production.log
journalctl -u sleep-mode-api -f
```

---

## Next Steps

After deployment:

1. **Monitor application performance** using the health check endpoints
2. **Set up automated backups** with the provided scripts
3. **Configure alerting** for critical system failures
4. **Review logs regularly** for errors and performance issues
5. **Keep dependencies updated** with security patches
6. **Test disaster recovery procedures** periodically

For troubleshooting common issues, refer to the [Troubleshooting Guide](TROUBLESHOOTING_GUIDE.md). 
# Sleep Mode Troubleshooting Guide

This guide provides solutions to common issues encountered during development, deployment, and operation of the Sleep Mode multi-platform application.

## Table of Contents

- [General Troubleshooting](#general-troubleshooting)
- [Rails API Backend Issues](#rails-api-backend-issues)
- [React Frontend Issues](#react-frontend-issues)
- [Flutter Mobile App Issues](#flutter-mobile-app-issues)
- [Database Issues](#database-issues)
- [Authentication Issues](#authentication-issues)
- [Deployment Issues](#deployment-issues)
- [Performance Issues](#performance-issues)
- [Network and API Issues](#network-and-api-issues)
- [Testing Issues](#testing-issues)
- [Development Environment Issues](#development-environment-issues)

## General Troubleshooting

### Debug Information Collection

Before troubleshooting, collect the following information:

```bash
# System information
uname -a
cat /etc/os-release

# Application versions
ruby --version
node --version
flutter --version

# Service status
systemctl status sleep-mode-api
systemctl status postgresql
systemctl status redis-server

# Log files
tail -f /var/log/sleep-mode/production.log
journalctl -u sleep-mode-api -f
```

### Log Analysis

#### Centralized Logging Command
```bash
# Monitor all service logs simultaneously
tail -f /var/log/sleep-mode/*.log /var/log/nginx/*.log /var/log/postgresql/*.log
```

#### Log Parsing Script
```bash
#!/bin/bash
# scripts/parse_logs.sh

# Extract error patterns from logs
echo "=== Recent Errors ==="
grep -i "error\|exception\|fatal" /var/log/sleep-mode/production.log | tail -20

echo "=== Failed Requests ==="
grep "5[0-9][0-9]" /var/log/nginx/access.log | tail -10

echo "=== Database Errors ==="
grep -i "error\|failed\|timeout" /var/log/postgresql/postgresql-*.log | tail -10
```

## Rails API Backend Issues

### Common Backend Problems

#### 1. Server Won't Start

**Symptoms:**
- Rails server fails to start
- Port already in use error
- Bundle install errors

**Solutions:**

```bash
# Check for running processes on port 3000
sudo lsof -i :3000
sudo kill -9 <PID>

# Bundle install issues
bundle install --deployment
bundle update

# Database connection issues
RAILS_ENV=production bundle exec rails db:migrate:status
RAILS_ENV=production bundle exec rails db:create

# Permissions issues
sudo chown -R deploy:deploy /var/www/sleep-mode
chmod -R 755 /var/www/sleep-mode
```

#### 2. Database Connection Errors

**Error Messages:**
- `ActiveRecord::ConnectionNotEstablished`
- `PG::ConnectionBad`
- `Database does not exist`

**Solutions:**

```bash
# Check PostgreSQL service
sudo systemctl status postgresql
sudo systemctl start postgresql

# Verify database configuration
RAILS_ENV=production bundle exec rails runner "puts ActiveRecord::Base.connection.current_database"

# Test database connection
psql -h localhost -U sleep_mode_user -d sleep_mode_production

# Reset database (development only)
RAILS_ENV=development bundle exec rails db:drop db:create db:migrate db:seed
```

#### 3. JWT Token Issues

**Symptoms:**
- Authentication failures
- Token verification errors
- Expired token errors

**Solutions:**

```ruby
# Check JWT configuration in Rails console
RAILS_ENV=production bundle exec rails console
puts Rails.application.credentials.jwt_secret
JWT.decode(token, Rails.application.credentials.jwt_secret, true, { algorithm: 'HS256' })

# Verify token expiration
payload = JWT.decode(token, nil, false).first
puts Time.at(payload['exp'])
```

#### 4. CORS Issues

**Symptoms:**
- Browser console errors about CORS
- Cross-origin request blocked

**Solutions:**

```ruby
# config/initializers/cors.rb
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins '*' # Change to specific domains in production
    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      expose: ['Authorization']
  end
end
```

#### 5. Redis Connection Issues

**Symptoms:**
- Session storage errors
- Cache write failures
- Redis connection refused

**Solutions:**

```bash
# Check Redis service
sudo systemctl status redis-server
sudo systemctl start redis-server

# Test Redis connection
redis-cli ping

# Check Redis configuration
cat /etc/redis/redis.conf | grep bind
cat /etc/redis/redis.conf | grep port

# Clear Redis cache
redis-cli flushall
```

### Performance Issues

#### 1. Slow API Responses

**Diagnosis:**
```bash
# Monitor API response times
tail -f /var/log/nginx/access.log | awk '{print $10, $7}'

# Check database query performance
RAILS_ENV=production bundle exec rails console
ActiveRecord::Base.logger = Logger.new(STDOUT)
```

**Solutions:**
```ruby
# Add database indexes
class AddIndexesToSleepSessions < ActiveRecord::Migration[7.0]
  def change
    add_index :sleep_sessions, :user_id
    add_index :sleep_sessions, :created_at
    add_index :sleep_sessions, [:user_id, :created_at]
  end
end

# Optimize queries with includes
SleepSession.includes(:user).where(user_id: user.id)

# Add pagination
@sessions = SleepSession.page(params[:page]).per(25)
```

#### 2. Memory Issues

**Symptoms:**
- Out of memory errors
- Slow garbage collection
- High memory usage

**Solutions:**
```bash
# Monitor memory usage
free -h
ps aux | grep ruby | head -10

# Configure Puma workers
# config/puma.rb
workers ENV.fetch("WEB_CONCURRENCY") { 1 } # Reduce workers
threads_count = ENV.fetch("RAILS_MAX_THREADS") { 2 } # Reduce threads
```

## React Frontend Issues

### Common Frontend Problems

#### 1. Build Failures

**Symptoms:**
- Vite build errors
- TypeScript compilation errors
- Module not found errors

**Solutions:**

```bash
# Clear build cache
rm -rf node_modules/.cache
rm -rf dist

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run type-check

# Build with verbose output
npm run build -- --verbose
```

#### 2. API Connection Issues

**Symptoms:**
- Network errors in console
- API requests failing
- CORS errors

**Solutions:**

```typescript
// Check API configuration
console.log('API URL:', import.meta.env.VITE_API_URL);

// Add request interceptor for debugging
import axios from 'axios';

axios.interceptors.request.use(request => {
  console.log('Starting Request:', request);
  return request;
});

axios.interceptors.response.use(
  response => response,
  error => {
    console.error('Request Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
```

#### 3. Authentication State Issues

**Symptoms:**
- User not staying logged in
- Token storage issues
- Infinite authentication loops

**Solutions:**

```typescript
// Debug authentication state
import { useAuth } from './contexts/AuthContext';

function DebugAuth() {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  console.log('Auth State:', {
    user,
    isAuthenticated,
    isLoading,
    token: localStorage.getItem('sleep_mode_token')
  });
  
  return null;
}

// Check for token expiration
const token = localStorage.getItem('sleep_mode_token');
if (token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = payload.exp * 1000 < Date.now();
    console.log('Token expired:', isExpired);
  } catch (error) {
    console.error('Invalid token format');
    localStorage.removeItem('sleep_mode_token');
  }
}
```

#### 4. Router Issues

**Symptoms:**
- 404 errors on refresh
- Routes not working
- Navigation issues

**Solutions:**

```typescript
// Ensure proper route configuration
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard/*" element={<DashboardRoutes />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

// Configure nginx for SPA routing
# nginx.conf
location / {
    try_files $uri $uri/ /index.html;
}
```

#### 5. Performance Issues

**Symptoms:**
- Slow page loads
- Large bundle size
- Memory leaks

**Solutions:**

```typescript
// Implement code splitting
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Dashboard />
    </Suspense>
  );
}

// Optimize bundle size
npm run build -- --analyze

// Check for memory leaks
useEffect(() => {
  const timer = setInterval(() => {
    // Some operation
  }, 1000);

  return () => clearInterval(timer); // Cleanup
}, []);
```

### Testing Issues

#### 1. Test Failures

**Symptoms:**
- Tests failing unexpectedly
- Mock issues
- Environment setup problems

**Solutions:**

```bash
# Clear test cache
npm run test -- --clearCache

# Run tests with verbose output
npm run test -- --verbose

# Check test environment
npm run test -- --detectOpenHandles
```

```typescript
// Fix common mock issues
jest.mock('../services/authService', () => ({
  authService: {
    login: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn().mockReturnValue(null),
  },
}));

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
```

## Flutter Mobile App Issues

### Common Mobile App Problems

#### 1. Build Failures

**Symptoms:**
- Gradle build errors (Android)
- Pod install failures (iOS)
- Dependency conflicts

**Android Solutions:**
```bash
# Clean Flutter build
flutter clean
flutter pub get

# Clean Gradle cache
cd android
./gradlew clean
cd ..

# Update Android dependencies
flutter pub upgrade

# Check Android SDK
flutter doctor -v
```

**iOS Solutions:**
```bash
# Clean iOS build
flutter clean
cd ios
rm -rf Pods
rm Podfile.lock
pod cache clean --all
pod install
cd ..

# Update iOS dependencies
flutter pub upgrade
```

#### 2. API Integration Issues

**Symptoms:**
- Network requests failing
- SSL certificate errors
- Authentication failures

**Solutions:**

```dart
// Debug network requests
import 'package:dio/dio.dart';

final dio = Dio();

// Add logging interceptor
dio.interceptors.add(LogInterceptor(
  requestBody: true,
  responseBody: true,
  error: true,
));

// Handle SSL issues (development only)
(dio.httpClientAdapter as DefaultHttpClientAdapter).onHttpClientCreate = (client) {
  client.badCertificateCallback = (cert, host, port) => true;
  return client;
};
```

#### 3. Platform-Specific Issues

**Android Issues:**
```dart
// Android network security config
// android/app/src/main/res/xml/network_security_config.xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">10.0.2.2</domain>
    </domain-config>
</network-security-config>

// Add to android/app/src/main/AndroidManifest.xml
android:networkSecurityConfig="@xml/network_security_config"
```

**iOS Issues:**
```dart
// iOS App Transport Security
// ios/Runner/Info.plist
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

#### 4. State Management Issues

**Symptoms:**
- State not updating
- Widget not rebuilding
- Provider issues

**Solutions:**

```dart
// Debug state changes
class MyWidget extends StatefulWidget {
  @override
  _MyWidgetState createState() => _MyWidgetState();
}

class _MyWidgetState extends State<MyWidget> {
  @override
  Widget build(BuildContext context) {
    print('Building MyWidget with state: $state');
    return Container();
  }
}

// Check Provider setup
MultiProvider(
  providers: [
    ChangeNotifierProvider(create: (_) => AuthProvider()),
    ChangeNotifierProvider(create: (_) => SleepSessionProvider()),
  ],
  child: MyApp(),
)
```

## Database Issues

### PostgreSQL Problems

#### 1. Connection Issues

**Symptoms:**
- `Connection refused`
- `Database does not exist`
- `Role does not exist`

**Solutions:**

```bash
# Check PostgreSQL status
sudo systemctl status postgresql
sudo systemctl start postgresql

# Check configuration
sudo -u postgres psql -c "SELECT version();"

# Verify user and database
sudo -u postgres psql
\l                           # List databases
\du                          # List users
\q

# Create missing user/database
sudo -u postgres createuser --interactive sleep_mode_user
sudo -u postgres createdb -O sleep_mode_user sleep_mode_production
```

#### 2. Performance Issues

**Symptoms:**
- Slow queries
- High CPU usage
- Connection limits reached

**Solutions:**

```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Find slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats 
WHERE schemaname = 'public' 
AND n_distinct > 100;
```

```bash
# Tune PostgreSQL configuration
# /etc/postgresql/14/main/postgresql.conf
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
```

#### 3. Migration Issues

**Symptoms:**
- Migration failures
- Schema version conflicts
- Rollback errors

**Solutions:**

```bash
# Check migration status
RAILS_ENV=production bundle exec rails db:migrate:status

# Force specific migration version
RAILS_ENV=production bundle exec rails db:migrate:down VERSION=20241201000000
RAILS_ENV=production bundle exec rails db:migrate:up VERSION=20241201000000

# Reset schema (development only)
RAILS_ENV=development bundle exec rails db:schema:load
```

## Authentication Issues

### JWT Token Problems

#### 1. Token Expiration

**Symptoms:**
- Unexpected logouts
- 401 Unauthorized errors
- Authentication loops

**Solutions:**

```typescript
// Implement token refresh
async function refreshToken() {
  try {
    const response = await api.post('/auth/refresh');
    const { token } = response.data;
    localStorage.setItem('sleep_mode_token', token);
    return token;
  } catch (error) {
    // Redirect to login
    window.location.href = '/login';
  }
}

// Add request interceptor
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      try {
        await refreshToken();
        // Retry original request
        return api.request(error.config);
      } catch (refreshError) {
        // Redirect to login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

#### 2. Cross-Platform Token Sync

**Flutter Token Storage:**
```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthService {
  static const _storage = FlutterSecureStorage();
  static const _tokenKey = 'sleep_mode_token';

  Future<void> saveToken(String token) async {
    await _storage.write(key: _tokenKey, value: token);
  }

  Future<String?> getToken() async {
    return await _storage.read(key: _tokenKey);
  }

  Future<void> clearToken() async {
    await _storage.delete(key: _tokenKey);
  }
}
```

## Deployment Issues

### Production Deployment Problems

#### 1. Environment Variables

**Symptoms:**
- Missing environment variables
- Configuration errors
- Service startup failures

**Solutions:**

```bash
# Check environment variables
printenv | grep SLEEP_MODE
echo $DATABASE_URL
echo $JWT_SECRET

# Set missing variables
export DATABASE_URL="postgresql://user:pass@localhost/sleep_mode_production"
echo 'export DATABASE_URL="..."' >> ~/.bashrc

# Verify Rails configuration
RAILS_ENV=production bundle exec rails runner "puts Rails.env"
RAILS_ENV=production bundle exec rails runner "puts Rails.application.credentials.jwt_secret"
```

#### 2. Asset Compilation

**Symptoms:**
- Missing CSS/JS files
- 404 errors for assets
- Precompilation failures

**Solutions:**

```bash
# Precompile assets
RAILS_ENV=production bundle exec rails assets:precompile

# Clear old assets
RAILS_ENV=production bundle exec rails assets:clobber

# Check asset paths
ls -la public/assets/

# Configure asset serving
# config/environments/production.rb
config.public_file_server.enabled = true
config.assets.compile = false
```

#### 3. SSL Certificate Issues

**Symptoms:**
- SSL errors
- Certificate expired warnings
- Mixed content errors

**Solutions:**

```bash
# Check certificate status
openssl x509 -in /path/to/certificate.crt -text -noout

# Renew Let's Encrypt certificate
sudo certbot renew --dry-run
sudo certbot renew

# Check certificate expiration
echo | openssl s_client -servername your-domain.com -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates
```

### Docker Deployment Issues

#### 1. Container Build Failures

**Symptoms:**
- Docker build errors
- Dependency installation failures
- Out of disk space

**Solutions:**

```bash
# Clean Docker cache
docker system prune -a

# Build with no cache
docker build --no-cache -t sleep-mode-api .

# Check disk space
df -h

# Remove unused images
docker image prune -a
```

#### 2. Container Networking

**Symptoms:**
- Services can't communicate
- Database connection errors
- Port conflicts

**Solutions:**

```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    networks:
      - app-network
    environment:
      DATABASE_URL: postgresql://user:pass@db:5432/sleep_mode_production
  
  db:
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

## Performance Issues

### Monitoring and Diagnosis

#### 1. Application Performance

**Rails Performance Monitoring:**
```ruby
# Add to Gemfile
gem 'rack-mini-profiler'
gem 'memory_profiler'
gem 'stackprof'

# In development.rb
config.middleware.use Rack::MiniProfiler

# Monitor memory usage
require 'memory_profiler'
report = MemoryProfiler.report do
  # Your code here
end
report.pretty_print
```

**React Performance Monitoring:**
```typescript
// React Developer Tools Profiler
import { Profiler } from 'react';

function onRenderCallback(id, phase, actualDuration) {
  console.log('Component render:', { id, phase, actualDuration });
}

<Profiler id="Dashboard" onRender={onRenderCallback}>
  <Dashboard />
</Profiler>
```

#### 2. Database Performance

**Query Optimization:**
```sql
-- Enable query logging
# postgresql.conf
log_statement = 'all'
log_min_duration_statement = 1000

-- Analyze slow queries
EXPLAIN ANALYZE SELECT * FROM sleep_sessions WHERE user_id = 1;

-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_sleep_sessions_user_created 
ON sleep_sessions(user_id, created_at DESC);
```

#### 3. Network Performance

**API Response Time Monitoring:**
```bash
# Monitor API response times
curl -w "@curl-format.txt" -o /dev/null -s "https://api.your-domain.com/health"

# curl-format.txt
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
```

## Network and API Issues

### API Communication Problems

#### 1. Request Timeout Issues

**Symptoms:**
- Requests timing out
- Slow API responses
- Gateway timeout errors

**Solutions:**

```typescript
// Increase timeout settings
const api = axios.create({
  timeout: 30000, // 30 seconds
  retry: 3,
});

// Add retry logic
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.code === 'ECONNABORTED' && error.config.retry > 0) {
      error.config.retry--;
      return api.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

```ruby
# Rails timeout configuration
# config/puma.rb
worker_timeout 60

# Database timeout
# config/database.yml
production:
  adapter: postgresql
  timeout: 30000
  pool: 10
```

#### 2. Rate Limiting Issues

**Symptoms:**
- 429 Too Many Requests
- API calls being blocked
- Unexpected request limits

**Solutions:**

```ruby
# Implement rate limiting
# Gemfile
gem 'rack-attack'

# config/initializers/rack_attack.rb
Rack::Attack.throttle('requests by ip', limit: 300, period: 5.minutes) do |req|
  req.ip
end

Rack::Attack.throttle('login attempts', limit: 5, period: 1.minute) do |req|
  req.ip if req.path == '/auth/login' && req.post?
end
```

```typescript
// Handle rate limiting on frontend
const apiRequest = async (url, options) => {
  try {
    return await api.request({ url, ...options });
  } catch (error) {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return apiRequest(url, options);
    }
    throw error;
  }
};
```

## Testing Issues

### Test Environment Problems

#### 1. Test Database Issues

**Symptoms:**
- Tests failing due to database state
- Migration issues in test environment
- Data persistence between tests

**Solutions:**

```ruby
# spec/rails_helper.rb
RSpec.configure do |config|
  config.use_transactional_fixtures = true
  
  config.before(:suite) do
    DatabaseCleaner.strategy = :transaction
    DatabaseCleaner.clean_with(:truncation)
  end

  config.around(:each) do |example|
    DatabaseCleaner.cleaning do
      example.run
    end
  end
end
```

#### 2. Mock and Stub Issues

**React Testing:**
```typescript
// Mock API responses
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/sleep-sessions', (req, res, ctx) => {
    return res(ctx.json({ sessions: [] }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

**Rails Testing:**
```ruby
# spec/support/api_helpers.rb
module ApiHelpers
  def json_response
    JSON.parse(response.body)
  end

  def auth_headers(user)
    token = JWT.encode({ user_id: user.id }, Rails.application.credentials.jwt_secret)
    { 'Authorization' => "Bearer #{token}" }
  end
end
```

#### 3. End-to-End Testing Issues

**Playwright Issues:**
```typescript
// Handle flaky tests
import { test, expect } from '@playwright/test';

test('user login flow', async ({ page }) => {
  await page.goto('/login');
  
  // Wait for network to be idle
  await page.waitForLoadState('networkidle');
  
  // Use more reliable selectors
  await page.fill('[data-testid="email-input"]', 'test@example.com');
  await page.fill('[data-testid="password-input"]', 'password123');
  
  // Wait for specific element instead of timeout
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('/dashboard');
  
  await expect(page).toHaveURL('/dashboard');
});
```

## Development Environment Issues

### Local Setup Problems

#### 1. Version Conflicts

**Symptoms:**
- Ruby version errors
- Node.js compatibility issues
- Flutter SDK problems

**Solutions:**

```bash
# Ruby version management
rbenv install 3.3.0
rbenv local 3.3.0
rbenv rehash

# Node.js version management
nvm install 18.19.0
nvm use 18.19.0
nvm alias default 18.19.0

# Flutter version management
flutter channel stable
flutter upgrade
flutter doctor -v
```

#### 2. Dependency Conflicts

**Ruby Dependencies:**
```bash
# Clear bundle cache
rm -rf .bundle
rm Gemfile.lock
bundle install

# Update specific gems
bundle update rails
bundle outdated
```

**Node.js Dependencies:**
```bash
# Clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Check for vulnerabilities
npm audit
npm audit fix
```

**Flutter Dependencies:**
```bash
# Clear pub cache
flutter pub cache repair
flutter pub get
flutter pub upgrade

# Check dependencies
flutter pub deps
```

#### 3. IDE and Editor Issues

**VS Code Configuration:**
```json
// .vscode/settings.json
{
  "ruby.intellisense": "rubyLocate",
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "eslint.workingDirectories": ["sleep_mode_frontend"],
  "dart.flutterSdkPath": "/path/to/flutter"
}
```

### Git and Version Control

#### 1. Merge Conflicts in Generated Files

**Common Conflicts:**
- `package-lock.json`
- `Gemfile.lock`
- `pubspec.lock`

**Solutions:**
```bash
# For package-lock.json conflicts
rm package-lock.json
npm install

# For Gemfile.lock conflicts
rm Gemfile.lock
bundle install

# For pubspec.lock conflicts
rm pubspec.lock
flutter pub get
```

---

## Emergency Procedures

### System Recovery

#### 1. Complete System Failure

**Recovery Steps:**
```bash
# 1. Check all services
sudo systemctl status postgresql nginx redis-server

# 2. Restart services in order
sudo systemctl start postgresql
sudo systemctl start redis-server
sudo systemctl start sleep-mode-api
sudo systemctl start nginx

# 3. Verify functionality
curl -f https://api.your-domain.com/health
curl -f https://your-domain.com

# 4. Check logs for errors
journalctl -u sleep-mode-api --since "1 hour ago"
tail -f /var/log/nginx/error.log
```

#### 2. Database Corruption

**Recovery Steps:**
```bash
# 1. Stop application
sudo systemctl stop sleep-mode-api

# 2. Restore from latest backup
gunzip -c /var/backups/sleep-mode/backup_latest.sql.gz | psql -U sleep_mode_user -d sleep_mode_production

# 3. Verify data integrity
psql -U sleep_mode_user -d sleep_mode_production -c "SELECT COUNT(*) FROM users;"

# 4. Start application
sudo systemctl start sleep-mode-api
```

### Contact Information

For additional support:
- **Development Team**: dev@sleepmode.app
- **Infrastructure Team**: ops@sleepmode.app
- **Emergency Contact**: +1-XXX-XXX-XXXX

### External Resources

- [Rails Guides](https://guides.rubyonrails.org/)
- [React Documentation](https://react.dev/)
- [Flutter Documentation](https://docs.flutter.dev/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)

---

*Last updated: December 2024* 
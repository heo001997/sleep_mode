# Testing & Coverage Guide - Sleep Mode

Comprehensive testing infrastructure and code coverage reporting for the Sleep Mode cross-platform application.

## Overview

Sleep Mode implements a multi-layered testing strategy across all platforms:

- **Flutter App**: Integration tests covering user journeys and performance
- **Rails API**: RSpec unit/integration tests with SimpleCov coverage
- **React Frontend**: Vitest unit tests + Playwright E2E tests with comprehensive coverage reporting

## Test Structure

### 1. Flutter Mobile App

**Location**: `sleep_mode_flutter/integration_test/`

**Test Coverage**:
- ✅ User journey tests (825+ lines)
- ✅ Sleep session management flows
- ✅ Performance monitoring
- ✅ Device permissions handling
- ✅ Security and authentication flows

**Run Tests**:
```bash
cd sleep_mode_flutter
flutter test integration_test/
```

### 2. Rails API Backend

**Location**: `sleep_mode_rails/spec/`

**Test Coverage**:
- ✅ Controller request specs
- ✅ Model validations and associations
- ✅ Service object testing
- ✅ API authentication flows
- ✅ Error handling and edge cases

**Coverage Configuration**: Enhanced `.simplecov` with:
- 85% minimum global coverage threshold
- 75% minimum per-file coverage
- Grouped reporting by functionality
- Multiple output formats (HTML, JSON, LCOV, Cobertura)
- Custom console reporting with detailed metrics

**Run Tests**:
```bash
cd sleep_mode_rails
bundle exec rspec --format documentation
```

**Coverage Report**:
```bash
# Generate coverage report
bundle exec rspec

# View HTML report
open coverage/index.html
```

### 3. React Frontend

**Location**: `sleep_mode_frontend/src/__tests__/`

**Test Coverage**:

#### Unit Tests (Vitest)
- ✅ Component rendering and interactions (52 tests passing)
- ✅ Hook behavior and state management
- ✅ Service and utility functions
- ✅ Authentication flows
- ✅ API integration

#### End-to-End Tests (Playwright)
- ✅ **Authentication Flows** (11 test scenarios)
  - User registration with validation
  - Login/logout flows
  - Session persistence
  - Protected route access

- ✅ **Sleep Session Management** (45+ test scenarios)
  - CRUD operations via UI
  - Dashboard display and navigation
  - Filtering and search functionality
  - Analytics and data visualization

- ✅ **Navigation & UX** (60+ test scenarios)
  - Primary and breadcrumb navigation
  - Modal and dialog interactions
  - Form state management
  - Keyboard navigation and accessibility
  - Mobile responsiveness

- ✅ **Error Handling** (15+ test scenarios)
  - Network connectivity issues
  - API error responses
  - Graceful fallbacks
  - User error messaging

## Coverage Configuration

### Enhanced Coverage Setup

#### Frontend Coverage (`vitest.config.ts`)

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'html', 'json', 'lcov', 'cobertura', 'clover'],
  reportsDirectory: './coverage',
  
  // Component-specific thresholds
  thresholds: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    },
    // Enhanced per-directory thresholds
    './src/components/': {
      statements: 85,
      branches: 80,
      functions: 90,
      lines: 85
    },
    './src/services/': {
      statements: 90,
      branches: 85,
      functions: 95,
      lines: 90
    }
  }
}
```

#### Backend Coverage (`.simplecov`)

```ruby
SimpleCov.start 'rails' do
  minimum_coverage 85          # Global minimum
  minimum_coverage_by_file 75  # Per-file minimum
  maximum_coverage_drop 5      # Maximum allowed drop
  
  # Detailed grouping
  add_group 'Controllers', 'app/controllers'
  add_group 'Models', 'app/models' 
  add_group 'Services', 'app/services'
  # ... more groups
end
```

## Running Tests

### Quick Commands

```bash
# Frontend - All tests with coverage
cd sleep_mode_frontend
npm run test:all:coverage

# Backend - All tests with coverage  
cd sleep_mode_rails
bundle exec rspec

# Flutter - Integration tests
cd sleep_mode_flutter
flutter test integration_test/
```

### Detailed Test Commands

#### Frontend Tests

```bash
# Unit tests
npm run test                    # Watch mode
npm run test:run               # Single run
npm run test:coverage          # With coverage
npm run test:coverage:open     # Coverage + open report

# E2E tests
npm run test:e2e              # All E2E tests
npm run test:e2e:ui           # With Playwright UI
npm run test:e2e:debug        # Debug mode
npm run test:e2e:report       # View test report

# Quality gate
npm run quality:check         # Lint + Coverage + E2E

# CI/CD
npm run ci:test               # JUnit output for CI
npm run ci:coverage           # Coverage with CI reporting
npm run ci:e2e                # E2E with CI reporting
```

#### Backend Tests

```bash
# All tests
bundle exec rspec

# Specific test files
bundle exec rspec spec/controllers/
bundle exec rspec spec/models/
bundle exec rspec spec/requests/

# With documentation format
bundle exec rspec --format documentation

# Parallel execution
bundle exec rspec --parallel
```

## Coverage Reports

### Generated Reports

#### Frontend
- **HTML Report**: `coverage/index.html` - Interactive coverage browser
- **JSON Report**: `coverage/coverage-summary.json` - Programmatic access
- **LCOV Report**: `coverage/lcov.info` - CI/CD integration
- **Badge Data**: `coverage/badges.json` - Automated badge generation

#### Backend  
- **HTML Report**: `coverage/index.html` - Detailed Ruby coverage
- **JSON Report**: `coverage/.resultset.json` - SimpleCov data
- **Console Report**: Detailed terminal output with group breakdowns

### Coverage Badges

Generate coverage badges for README:

```bash
cd sleep_mode_frontend
npm run coverage:badges
```

Outputs:
- `coverage/badges.json` - Badge data
- `coverage/badges.md` - Ready-to-use markdown badges

### Coverage Thresholds

| Component | Statements | Branches | Functions | Lines |
|-----------|------------|----------|-----------|--------|
| **Frontend Components** | 85% | 80% | 90% | 85% |
| **Frontend Services** | 90% | 85% | 95% | 90% |
| **Frontend Utils** | 85% | 80% | 90% | 85% |
| **Frontend Hooks** | 80% | 75% | 85% | 80% |
| **Frontend Pages** | 75% | 70% | 80% | 75% |
| **Backend Global** | 85% | - | - | - |
| **Backend Per-File** | 75% | - | - | - |

## Test Environment Requirements

### Minimum Requirements

- **Node.js**: 18.19+ (required for Playwright)
- **Ruby**: 2.7+ (required for Rails 7)
- **Flutter**: 3.22+ (null safety support)

### Browser Support (E2E)

- **Desktop**: Chrome, Firefox, Safari
- **Mobile**: Chrome Mobile, Safari Mobile
- **Headless**: Chromium (CI/CD)

### Environment Variables

Create `.env` files with required API keys:

```bash
# Frontend (.env)
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_APP_NAME=Sleep Mode

# Backend (.env)
RAILS_ENV=test
DATABASE_URL=sqlite3:db/test.sqlite3

# E2E Tests (.env.test)
PLAYWRIGHT_BASE_URL=http://localhost:5173
API_BASE_URL=http://localhost:3000/api/v1
TEST_USER_EMAIL=test@sleepmode.app
TEST_USER_PASSWORD=testpassword123
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests & Coverage

on: [push, pull_request]

jobs:
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18.19'
      
      - name: Install dependencies
        run: npm ci
        working-directory: sleep_mode_frontend
      
      - name: Run unit tests with coverage
        run: npm run ci:coverage
        working-directory: sleep_mode_frontend
      
      - name: Install Playwright
        run: npx playwright install --with-deps
        working-directory: sleep_mode_frontend
      
      - name: Run E2E tests
        run: npm run ci:e2e
        working-directory: sleep_mode_frontend
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          files: ./sleep_mode_frontend/coverage/lcov.info

  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.0'
          bundler-cache: true
      
      - name: Setup database
        run: |
          bundle exec rails db:create
          bundle exec rails db:schema:load
        working-directory: sleep_mode_rails
        env:
          RAILS_ENV: test
      
      - name: Run tests with coverage
        run: bundle exec rspec --format RspecJunitFormatter --out tmp/rspec.xml
        working-directory: sleep_mode_rails
        env:
          RAILS_ENV: test
```

## Troubleshooting

### Common Issues

#### Node.js Version
```bash
# Check version
node --version

# Update via nvm
nvm install 18.19
nvm use 18.19
```

#### Ruby Version
```bash
# Check version  
ruby --version

# Update via rbenv
rbenv install 3.0.0
rbenv global 3.0.0
```

#### Playwright Installation
```bash
# Install browsers
npx playwright install

# Install system dependencies
npx playwright install-deps
```

#### Port Conflicts
```bash
# Check port usage
lsof -i :3000
lsof -i :5173

# Kill processes
kill -9 $(lsof -ti:3000)
```

### Coverage Issues

#### Low Coverage
1. Check excluded files in configuration
2. Review test completeness
3. Add missing test cases
4. Verify threshold settings

#### Missing Reports
1. Ensure test commands include `--coverage` flag
2. Check output directory permissions
3. Verify configuration syntax
4. Review console output for errors

## Best Practices

### Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies

### Coverage Goals
- Aim for 80-85% overall coverage
- Focus on critical business logic
- Don't chase 100% coverage blindly
- Test edge cases and error scenarios

### E2E Testing
- Test user journeys, not individual components
- Use page object model for maintainability
- Keep tests independent and isolated
- Use meaningful test data

### Performance
- Run unit tests in watch mode during development
- Use parallel execution for faster CI/CD
- Cache dependencies in CI environments
- Only run E2E tests on critical paths

## Continuous Improvement

### Monitoring
- Track coverage trends over time
- Monitor test execution times
- Review failing test patterns
- Update thresholds based on project maturity

### Enhancement Opportunities
- Add visual regression testing
- Implement performance testing
- Add accessibility testing
- Enhance mobile testing coverage

---

For questions or issues with testing setup, please refer to the project documentation or create an issue in the repository. 
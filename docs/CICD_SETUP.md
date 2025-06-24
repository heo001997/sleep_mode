# CI/CD Pipeline Setup - Sleep Mode

Comprehensive continuous integration and deployment setup for the multi-platform Sleep Mode application.

## Overview

The Sleep Mode CI/CD pipeline implements a robust, multi-platform workflow supporting:

- **🔍 Quality Checks**: ESLint, TypeScript, RuboCop, Flutter analysis
- **🧪 Testing**: Unit tests, integration tests, E2E tests across all platforms
- **📊 Coverage**: Code coverage reporting with automated badges
- **🔒 Security**: Dependency scanning, secrets detection, code security analysis
- **🏗️ Building**: Production builds for web, Android, and iOS
- **🚀 Deployment**: Automated deployment to staging/production environments
- **✅ Verification**: Health checks and smoke tests post-deployment

## Workflow Architecture

### 1. Main CI/CD Pipeline (`.github/workflows/ci.yml`)

**Triggers**:
- Push to `main`, `master`, `develop` branches
- Pull requests to main branches
- Manual workflow dispatch

**Jobs Flow**:
```
quality-checks → [backend-tests, frontend-tests, flutter-tests] → e2e-tests → build-verification → deploy → test-summary
```

**Key Features**:
- Parallel execution for maximum efficiency
- Comprehensive test coverage across all platforms
- Automated artifact generation and uploading
- Environment-specific deployments
- Detailed test result summaries

### 2. Security Scanning Pipeline (`.github/workflows/security.yml`)

**Triggers**:
- Push/PR to main branches
- Daily scheduled scans (3 AM UTC)
- Manual workflow dispatch

**Security Checks**:
- **Dependency Scanning**: NPM Audit, Bundle Audit, Snyk
- **Code Security**: CodeQL, Semgrep, Bandit
- **Secrets Detection**: TruffleHog, GitLeaks, detect-secrets
- **Container Security**: Trivy scanning (if Docker files present)
- **License Compliance**: License checker for all dependencies

### 3. Production Deployment Pipeline (`.github/workflows/deploy.yml`)

**Triggers**:
- GitHub releases (automatic production deployment)
- Manual deployment with environment selection

**Deployment Flow**:
```
pre-deployment → run-tests → build-production → [deploy-infrastructure, deploy-mobile] → post-deployment → summary
```

**Features**:
- Environment-specific builds and deployments
- Mobile app store deployments (Google Play, App Store)
- Health checks and smoke tests
- Deployment verification and rollback capabilities

## Environment Setup

### Required Environment Variables

Create the following secrets in your GitHub repository:

#### Backend (Rails) Secrets
```bash
RAILS_MASTER_KEY=your_rails_master_key
DATABASE_URL=postgres://username:password@host:port/database
```

#### Frontend (React) Secrets
```bash
VITE_API_BASE_URL=https://api.sleepmode.app
VITE_APP_NAME=Sleep Mode
```

#### Security Scanning Secrets
```bash
SNYK_TOKEN=your_snyk_api_token
SEMGREP_APP_TOKEN=your_semgrep_token
```

#### Mobile Deployment Secrets

**Android (Google Play Store)**:
```bash
ANDROID_KEYSTORE_BASE64=base64_encoded_keystore_file
ANDROID_STORE_PASSWORD=keystore_password
ANDROID_KEY_PASSWORD=key_password
ANDROID_KEY_ALIAS=key_alias
GOOGLE_PLAY_SERVICE_ACCOUNT=service_account_json
```

**iOS (App Store Connect)**:
```bash
IOS_P12_CERTIFICATE=base64_encoded_p12_certificate
IOS_P12_PASSWORD=certificate_password
IOS_PROVISIONING_PROFILE=base64_encoded_provisioning_profile
APPLE_ID_USERNAME=apple_id_email
APPLE_ID_APP_PASSWORD=app_specific_password
```

### Version Requirements

Ensure the following versions are available in your CI environment:

- **Node.js**: 18.19+ (for Playwright compatibility)
- **Ruby**: 3.1+ (for Rails 7 compatibility)
- **Flutter**: 3.22+ (for latest features and null safety)
- **Java**: 17+ (for Android builds)
- **Xcode**: Latest stable (for iOS builds)

## Workflow Configuration

### Quality Gates

The pipeline enforces strict quality gates:

#### Code Quality
- **ESLint**: Zero warnings allowed
- **TypeScript**: Strict type checking
- **RuboCop**: Ruby style guide compliance
- **Flutter**: Analysis with zero issues

#### Test Coverage
- **Backend**: 85% minimum coverage (SimpleCov)
- **Frontend**: 80% minimum coverage (Vitest)
- **E2E**: Critical user journeys covered

#### Security
- **Dependencies**: No critical vulnerabilities
- **Code**: No security anti-patterns
- **Secrets**: No exposed credentials

### Parallel Execution Strategy

The pipeline maximizes efficiency through parallel execution:

```yaml
# Quality checks run in parallel across platforms
quality-checks:
  - Frontend: ESLint + TypeScript
  - Backend: RuboCop
  - Flutter: Analysis + Format

# Tests run in parallel after quality checks
tests:
  - backend-tests (Rails + RSpec)
  - frontend-tests (React + Vitest)
  - flutter-tests (Dart + Coverage)

# E2E tests run after unit tests complete
e2e-tests:
  - Playwright (requires both frontend + backend)
```

### Artifact Management

The pipeline generates and stores multiple artifacts:

#### Test Results
- **Unit Test Reports**: JUnit XML for CI integration
- **Coverage Reports**: LCOV, HTML, JSON formats
- **E2E Reports**: Playwright HTML reports with screenshots

#### Build Artifacts
- **Web Build**: Optimized React production bundle
- **Android Build**: Signed APK and AAB files
- **iOS Build**: Signed IPA and dSYM files

#### Security Reports
- **Dependency Scans**: JSON reports from all platforms
- **Code Security**: SARIF files for GitHub Security tab
- **License Reports**: Compliance checking results

## Branch Strategy

### Main Branches

- **`main`**: Production-ready code, triggers production deployment on release
- **`develop`**: Integration branch, triggers staging deployment
- **`feature/*`**: Feature branches, run full CI but no deployment

### Protection Rules

Configure branch protection for `main` and `develop`:

```yaml
Protection Rules:
  - Require pull request reviews (2 reviewers)
  - Require status checks to pass
  - Require up-to-date branches
  - Include administrators
  - Restrict pushes to designated teams
```

### Required Status Checks

- ✅ Quality Checks
- ✅ Backend Tests
- ✅ Frontend Tests  
- ✅ Flutter Tests
- ✅ E2E Tests
- ✅ Security Scans

## Deployment Environments

### Staging Environment

**URL**: `https://staging.sleepmode.app`
**API**: `https://api-staging.sleepmode.app`

**Triggers**:
- Push to `develop` branch
- Manual deployment via workflow dispatch

**Features**:
- Latest feature testing
- Integration testing
- Performance monitoring
- User acceptance testing

### Production Environment

**URL**: `https://sleepmode.app`
**API**: `https://api.sleepmode.app`

**Triggers**:
- GitHub release creation
- Manual deployment (with approval)

**Features**:
- Blue-green deployment
- Automatic rollback on health check failure
- Mobile app store deployment
- Production monitoring and alerting

## Monitoring and Alerting

### Health Checks

Post-deployment health checks verify:

- **Backend API**: `/health` endpoint response
- **Frontend**: Application loading and basic functionality
- **Database**: Connection and basic queries
- **External Services**: Third-party integrations

### Failure Notifications

The pipeline notifies on failures via:

- **GitHub**: Workflow status in repository
- **Email**: Workflow failure notifications
- **Slack**: Integration for team notifications (optional)
- **PagerDuty**: Critical production failures (optional)

## Maintenance and Troubleshooting

### Common Issues

#### 1. Node.js Version Conflicts
```bash
# Verify Node.js version
node --version

# Update in workflow if needed
env:
  NODE_VERSION: '18.19'  # Update this
```

#### 2. Ruby Version Issues
```bash
# Check Ruby version
ruby --version

# Update Gemfile if needed
ruby "3.1.0"  # Specify exact version
```

#### 3. Flutter Build Failures
```bash
# Clean and rebuild
flutter clean
flutter pub get
flutter build apk --debug
```

#### 4. Mobile Signing Issues
```bash
# Verify keystore
keytool -list -v -keystore release-keystore.jks

# Check provisioning profile
security cms -D -i profile.mobileprovision
```

### Performance Optimization

#### Caching Strategy
- **Node.js**: Cache `node_modules` based on `package-lock.json`
- **Ruby**: Cache gems with `bundler-cache: true`
- **Flutter**: Cache Flutter SDK and packages
- **Browsers**: Cache Playwright browser installations

#### Parallel Execution
- Run platform tests simultaneously
- Use matrix strategies for multi-platform builds
- Minimize sequential dependencies

#### Resource Management
- Use appropriate runner sizes for different jobs
- Clean up temporary files and caches
- Optimize Docker layer caching

### Regular Maintenance

#### Weekly Tasks
- Review and update dependency versions
- Check security scan results
- Monitor build performance metrics
- Update documentation

#### Monthly Tasks
- Review and optimize workflow performance
- Update runner images and tools
- Audit security configurations
- Review artifact retention policies

#### Quarterly Tasks
- Update major dependency versions
- Review and update deployment strategies
- Conduct disaster recovery testing
- Update security and compliance documentation

## Security Best Practices

### Secrets Management
- Use GitHub Secrets for sensitive data
- Rotate secrets regularly
- Audit secret access permissions
- Use environment-specific secrets

### Access Control
- Implement principle of least privilege
- Use separate service accounts for different environments
- Regular access reviews and cleanup
- Multi-factor authentication for critical accounts

### Compliance
- Regular security scans and updates
- License compliance monitoring
- Audit trails for all deployments
- Data protection and privacy compliance

## Getting Started

### 1. Initial Setup

1. **Clone Repository**: `git clone <repository-url>`
2. **Configure Secrets**: Add required secrets to GitHub repository
3. **Update Configurations**: Modify workflow files for your environment
4. **Test Locally**: Verify all tests pass locally before pushing

### 2. First Deployment

1. **Create Feature Branch**: `git checkout -b feature/initial-setup`
2. **Push Changes**: `git push origin feature/initial-setup`
3. **Create Pull Request**: Verify CI passes on PR
4. **Merge to Develop**: Deploy to staging environment
5. **Create Release**: Deploy to production when ready

### 3. Ongoing Development

1. **Create Feature Branches**: Follow naming convention `feature/description`
2. **Run Tests Locally**: Use `npm run test:all:coverage` before pushing
3. **Monitor CI Results**: Fix any failing checks immediately
4. **Deploy Regularly**: Keep staging environment up to date

---

For additional support or questions about the CI/CD pipeline, please refer to the team documentation or create an issue in the repository. 
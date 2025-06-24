# Sleep Mode Environment Setup Guide

This guide provides step-by-step instructions for setting up a complete development environment for the Sleep Mode multi-platform application.

## Table of Contents

- [Prerequisites](#prerequisites)
- [System Requirements](#system-requirements)
- [Backend Setup (Rails API)](#backend-setup-rails-api)
- [Frontend Setup (React)](#frontend-setup-react)
- [Mobile Setup (Flutter)](#mobile-setup-flutter)
- [Database Configuration](#database-configuration)
- [IDE Configuration](#ide-configuration)
- [Environment Variables](#environment-variables)
- [Testing Setup](#testing-setup)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools

- **Git**: Version control system
- **Code Editor**: VS Code (recommended) or your preferred IDE
- **Terminal**: Command line interface
- **Browser**: Chrome, Firefox, or Safari for testing

### Version Managers (Recommended)

- **rbenv** or **RVM**: Ruby version management
- **nvm**: Node.js version management
- **Flutter**: Flutter SDK management

## System Requirements

### Minimum Hardware Requirements

- **CPU**: Dual-core processor (Quad-core recommended)
- **RAM**: 8GB (16GB recommended for Flutter development)
- **Storage**: 50GB free space
- **Internet**: Broadband connection for downloads

### Operating System Support

- **macOS**: 10.15+ (Big Sur recommended)
- **Linux**: Ubuntu 20.04+, Debian 10+, or equivalent
- **Windows**: Windows 10+ with WSL2 (Windows 11 recommended)

## Backend Setup (Rails API)

### 1. Ruby Installation

#### macOS (using rbenv)
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install rbenv
brew install rbenv ruby-build

# Add rbenv to shell profile
echo 'eval "$(rbenv init -)"' >> ~/.zshrc
source ~/.zshrc

# Install Ruby 3.3.0
rbenv install 3.3.0
rbenv global 3.3.0

# Verify installation
ruby --version
```

#### Linux (Ubuntu/Debian)
```bash
# Update package list
sudo apt update

# Install dependencies
sudo apt install -y curl gpg

# Install rbenv
curl -fsSL https://github.com/rbenv/rbenv-installer/raw/HEAD/bin/rbenv-installer | bash

# Add to shell profile
echo 'export PATH="$HOME/.rbenv/bin:$PATH"' >> ~/.bashrc
echo 'eval "$(rbenv init -)"' >> ~/.bashrc
source ~/.bashrc

# Install Ruby build dependencies
sudo apt install -y build-essential libssl-dev libreadline-dev zlib1g-dev

# Install Ruby 3.3.0
rbenv install 3.3.0
rbenv global 3.3.0
```

#### Windows (WSL2)
```bash
# Follow Linux instructions within WSL2 environment
# Ensure WSL2 is installed and configured first
```

### 2. Rails and Dependencies

```bash
# Install bundler
gem install bundler

# Install Rails 8.0.2
gem install rails -v 8.0.2

# Verify installation
rails --version
```

### 3. Database Setup

#### PostgreSQL Installation

**macOS:**
```bash
# Using Homebrew
brew install postgresql@14
brew services start postgresql@14

# Add to PATH
echo 'export PATH="/opt/homebrew/opt/postgresql@14/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt install postgresql-14 postgresql-contrib-14
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database user
sudo -u postgres createuser --interactive --pwprompt $USER
sudo -u postgres createdb -O $USER sleep_mode_development
```

#### Redis Installation

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### 4. Clone and Setup Rails Project

```bash
# Clone the repository
git clone https://github.com/your-username/sleep-mode.git
cd sleep-mode/sleep_mode_rails

# Install dependencies
bundle install

# Setup database
rails db:create
rails db:migrate
rails db:seed

# Start the server
rails server
```

**Verify Setup:**
- Open http://localhost:3000 in your browser
- You should see the Rails API response

## Frontend Setup (React)

### 1. Node.js Installation

#### Using nvm (Recommended)

**macOS/Linux:**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell profile
source ~/.bashrc  # or ~/.zshrc

# Install Node.js 18.19.0
nvm install 18.19.0
nvm use 18.19.0
nvm alias default 18.19.0

# Verify installation
node --version
npm --version
```

**Windows:**
```bash
# Download and install Node.js from nodejs.org
# Or use nvm-windows: https://github.com/coreybutler/nvm-windows
```

### 2. Setup React Project

```bash
# Navigate to frontend directory
cd ../sleep_mode_frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Verify Setup:**
- Open http://localhost:5173 in your browser
- You should see the React application

### 3. Frontend Development Tools

```bash
# Install global tools (optional)
npm install -g @typescript-eslint/cli
npm install -g prettier
npm install -g vite

# Install VS Code extensions (recommended)
# - ES7+ React/Redux/React-Native snippets
# - TypeScript Importer
# - Prettier - Code formatter
# - ESLint
```

## Mobile Setup (Flutter)

### 1. Flutter SDK Installation

#### macOS
```bash
# Download Flutter SDK
cd ~/development
git clone https://github.com/flutter/flutter.git -b stable

# Add to PATH
echo 'export PATH="$PATH:$HOME/development/flutter/bin"' >> ~/.zshrc
source ~/.zshrc

# Run Flutter doctor
flutter doctor
```

#### Linux
```bash
# Install dependencies
sudo apt update
sudo apt install -y curl git unzip xz-utils zip libglu1-mesa

# Download and extract Flutter
cd ~/development
wget https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_3.22.0-stable.tar.xz
tar xf flutter_linux_3.22.0-stable.tar.xz

# Add to PATH
echo 'export PATH="$PATH:$HOME/development/flutter/bin"' >> ~/.bashrc
source ~/.bashrc

# Run Flutter doctor
flutter doctor
```

### 2. Android Development Setup

#### Android Studio Installation

1. Download Android Studio from https://developer.android.com/studio
2. Install Android Studio
3. Open Android Studio and complete setup wizard
4. Install Android SDK and tools

#### Configure Android Environment

```bash
# Add Android SDK to PATH (adjust path as needed)
echo 'export ANDROID_HOME=$HOME/Android/Sdk' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools' >> ~/.zshrc
source ~/.zshrc

# Accept Android licenses
flutter doctor --android-licenses
```

### 3. iOS Development Setup (macOS only)

```bash
# Install Xcode from App Store
# Install Xcode command line tools
sudo xcode-select --install

# Install CocoaPods
sudo gem install cocoapods

# Configure iOS development
open -a Simulator
```

### 4. Setup Flutter Project

```bash
# Navigate to Flutter directory
cd ../sleep_mode_flutter

# Get dependencies
flutter pub get

# Check for any issues
flutter doctor

# Run on connected device or emulator
flutter run
```

## Database Configuration

### 1. Create Development Database

```bash
# PostgreSQL
createdb sleep_mode_development
createdb sleep_mode_test

# Or using Rails
cd sleep_mode_rails
rails db:create
```

### 2. Environment-Specific Configuration

Create database configuration files:

**config/database.yml**
```yaml
default: &default
  adapter: postgresql
  encoding: unicode
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>

development:
  <<: *default
  database: sleep_mode_development
  username: <%= ENV['DATABASE_USER'] || 'your_username' %>
  password: <%= ENV['DATABASE_PASSWORD'] || '' %>
  host: localhost
  port: 5432

test:
  <<: *default
  database: sleep_mode_test

production:
  <<: *default
  url: <%= ENV['DATABASE_URL'] %>
```

### 3. Database Seeding

```bash
# Run migrations
rails db:migrate

# Seed with sample data
rails db:seed

# Reset database (if needed)
rails db:reset
```

## IDE Configuration

### VS Code Setup

#### Recommended Extensions

```bash
# Install extensions via command line (optional)
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-python.python
code --install-extension rebornix.ruby
code --install-extension dart-code.dart-code
code --install-extension dart-code.flutter
code --install-extension ms-vscode.vscode-json
code --install-extension ms-vscode.vscode-eslint
code --install-extension esbenp.prettier-vscode
```

#### Workspace Settings

Create `.vscode/settings.json`:
```json
{
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.workingDirectories": ["sleep_mode_frontend"],
  "ruby.intellisense": "rubyLocate",
  "ruby.format": "rubocop",
  "dart.flutterSdkPath": "~/development/flutter",
  "files.associations": {
    "*.rb": "ruby",
    "Gemfile": "ruby",
    "Rakefile": "ruby"
  },
  "emmet.includeLanguages": {
    "javascript": "javascriptreact",
    "typescript": "typescriptreact"
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "typescript",
    "typescriptreact": "typescriptreact"
  }
}
```

#### Launch Configuration

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Rails Server",
      "type": "ruby_lsp",
      "request": "launch",
      "program": "bin/rails",
      "args": ["server"],
      "cwd": "${workspaceFolder}/sleep_mode_rails"
    },
    {
      "name": "React Dev Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/sleep_mode_frontend/node_modules/.bin/vite",
      "args": ["dev"],
      "cwd": "${workspaceFolder}/sleep_mode_frontend"
    }
  ]
}
```

## Environment Variables

### 1. Rails Backend (.env)

Create `sleep_mode_rails/.env`:
```bash
# Database
DATABASE_URL=postgresql://username:password@localhost/sleep_mode_development
REDIS_URL=redis://localhost:6379/0

# Security
JWT_SECRET=your_development_jwt_secret_here
SECRET_KEY_BASE=your_secret_key_base_here

# API Configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# External Services (if needed)
# SMTP_SERVER=smtp.example.com
# SMTP_PORT=587
# SMTP_USERNAME=your_smtp_username
# SMTP_PASSWORD=your_smtp_password
```

### 2. React Frontend (.env.development)

Create `sleep_mode_frontend/.env.development`:
```bash
# API Configuration
VITE_API_URL=http://localhost:3000
VITE_API_VERSION=v1

# Authentication
VITE_JWT_STORAGE_KEY=sleep_mode_token

# Development Settings
VITE_ENABLE_DEBUG=true
VITE_ENABLE_ANALYTICS=false
```

### 3. Flutter Mobile

Create `sleep_mode_flutter/.env`:
```bash
# API Configuration
API_BASE_URL=http://10.0.2.2:3000  # Android emulator
# API_BASE_URL=http://localhost:3000  # iOS simulator
API_VERSION=v1

# Development Settings
ENABLE_DEBUG=true
ENABLE_ANALYTICS=false
```

## Testing Setup

### 1. Rails Testing

```bash
cd sleep_mode_rails

# Install test dependencies
bundle install

# Setup test database
RAILS_ENV=test rails db:create
RAILS_ENV=test rails db:migrate

# Run tests
rspec
```

### 2. React Testing

```bash
cd sleep_mode_frontend

# Install test dependencies (already included)
npm install

# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests (requires both servers running)
npm run test:e2e
```

### 3. Flutter Testing

```bash
cd sleep_mode_flutter

# Run unit tests
flutter test

# Run integration tests (requires emulator/device)
flutter test integration_test/
```

## Development Workflow

### 1. Daily Setup Commands

Create a `start-dev.sh` script:
```bash
#!/bin/bash

# Start backend services
echo "Starting PostgreSQL and Redis..."
brew services start postgresql@14
brew services start redis

# Start Rails API
echo "Starting Rails API..."
cd sleep_mode_rails
rails server &

# Start React frontend
echo "Starting React frontend..."
cd ../sleep_mode_frontend
npm run dev &

echo "Development environment started!"
echo "API: http://localhost:3000"
echo "Frontend: http://localhost:5173"
```

### 2. Git Hooks Setup

Create `.git/hooks/pre-commit`:
```bash
#!/bin/bash

# Run linting and formatting
cd sleep_mode_frontend
npm run lint
npm run format:check

cd ../sleep_mode_rails
bundle exec rubocop

# Run quick tests
npm test -- --watchAll=false
bundle exec rspec --tag ~slow
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Find process using port
lsof -ti:3000
lsof -ti:5173

# Kill process
kill -9 <PID>
```

#### 2. Database Connection Issues
```bash
# Check PostgreSQL status
brew services list | grep postgresql  # macOS
systemctl status postgresql           # Linux

# Restart PostgreSQL
brew services restart postgresql@14   # macOS
sudo systemctl restart postgresql     # Linux
```

#### 3. Node.js Module Issues
```bash
# Clear npm cache
npm cache clean --force

# Remove and reinstall modules
rm -rf node_modules package-lock.json
npm install
```

#### 4. Ruby Gem Issues
```bash
# Clear bundle cache
rm -rf .bundle
rm Gemfile.lock
bundle install
```

#### 5. Flutter Doctor Issues
```bash
# Check status
flutter doctor -v

# Common fixes
flutter clean
flutter pub get
dart pub global activate fvm
```

### Environment Verification

Create a verification script `verify-setup.sh`:
```bash
#!/bin/bash

echo "=== Environment Verification ==="

# Check versions
echo "Ruby: $(ruby --version)"
echo "Rails: $(rails --version)"
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"
echo "Flutter: $(flutter --version | head -1)"

# Check services
echo "PostgreSQL: $(pg_isready && echo 'Running' || echo 'Not running')"
echo "Redis: $(redis-cli ping 2>/dev/null || echo 'Not running')"

# Check project setup
echo "Rails app: $(cd sleep_mode_rails && bundle check >/dev/null 2>&1 && echo 'Ready' || echo 'Dependencies missing')"
echo "React app: $(cd sleep_mode_frontend && npm list >/dev/null 2>&1 && echo 'Ready' || echo 'Dependencies missing')"
echo "Flutter app: $(cd sleep_mode_flutter && flutter pub deps check >/dev/null 2>&1 && echo 'Ready' || echo 'Dependencies missing')"

echo "=== Verification Complete ==="
```

## Next Steps

After completing the setup:

1. **Test all components** by running the verification script
2. **Read the project documentation** in the `docs/` directory
3. **Review the codebase structure** to understand the architecture
4. **Run the test suites** to ensure everything is working
5. **Start with small changes** to familiarize yourself with the workflow

For deployment and production setup, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).

For troubleshooting issues, see [TROUBLESHOOTING_GUIDE.md](./TROUBLESHOOTING_GUIDE.md).

---

*Last updated: December 2024* 
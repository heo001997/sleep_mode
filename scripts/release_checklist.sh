#!/bin/bash
# Release checklist script for SleepMode app
# This script performs pre-release checks to ensure the app is ready for distribution

set -e

# Get current directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR/.."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check status
check_item() {
    local status=$1
    local message=$2
    
    if [ $status -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $message"
    else
        echo -e "${RED}✗${NC} $message"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

# Function to print section header
print_section() {
    echo -e "\n${YELLOW}$1${NC}"
    echo "----------------------------------------"
}

FAILED_CHECKS=0

# Start checks
echo "SleepMode App Release Checklist"
echo "==============================="
echo "Running pre-release checks at $(date)"

# Check pubspec.yaml version
print_section "Version Check"
VERSION=$(grep "version:" "$PROJECT_ROOT/pubspec.yaml" | sed 's/version: //g' | tr -d ' ' | tr -d '\r')
echo "Current version: $VERSION"

VERSION_REGEX="([0-9]+)\.([0-9]+)\.([0-9]+)\+([0-9]+)"
if [[ $VERSION =~ $VERSION_REGEX ]]; then
    check_item 0 "Version format is valid (MAJOR.MINOR.PATCH+BUILD)"
else
    check_item 1 "Version format is invalid, should be MAJOR.MINOR.PATCH+BUILD"
fi

# Check for uncommitted changes
print_section "Git Status Check"
cd "$PROJECT_ROOT"
if [[ -z $(git status -s) ]]; then
    check_item 0 "No uncommitted changes"
else
    check_item 1 "There are uncommitted changes in the repository"
    echo "Run 'git status' to see the changes"
fi

# Check Flutter dependencies
print_section "Dependencies Check"
cd "$PROJECT_ROOT"
flutter pub get > /dev/null
check_item $? "Flutter dependencies can be resolved"

# Check for outdated packages
OUTDATED=$(flutter pub outdated --no-color | grep -c "Dependencies are all up-to-date")
if [ $OUTDATED -eq 1 ]; then
    check_item 0 "All dependencies are up to date"
else
    check_item 1 "There are outdated dependencies"
    echo "Run 'flutter pub outdated' to see details"
fi

# Check Flutter analyze
print_section "Code Quality Check"
cd "$PROJECT_ROOT"
ANALYZE_RESULT=$(flutter analyze)
if [[ $ANALYZE_RESULT == *"No issues found!"* ]]; then
    check_item 0 "Flutter analyze passed without issues"
else
    check_item 1 "Flutter analyze found issues"
    echo "$ANALYZE_RESULT"
fi

# Check Firebase configuration
print_section "Firebase Configuration Check"
if [ -f "$PROJECT_ROOT/android/app/google-services.json" ]; then
    check_item 0 "Android Firebase configuration found"
else
    check_item 1 "Android Firebase configuration missing"
fi

if [ -f "$PROJECT_ROOT/ios/Runner/GoogleService-Info.plist" ]; then
    check_item 0 "iOS Firebase configuration found"
else
    check_item 1 "iOS Firebase configuration missing"
fi

# Check app signing configuration
print_section "Signing Configuration Check"
if [ -f "$PROJECT_ROOT/android/key.properties" ]; then
    check_item 0 "Android signing configuration found"
else
    check_item 1 "Android signing configuration missing"
    echo "Create key.properties based on key.properties.sample"
fi

# Check iOS build settings
if [ -d "$PROJECT_ROOT/ios/Runner.xcworkspace" ]; then
    check_item 0 "iOS project configuration found"
    
    # Check if we can extract bundle identifier
    BUNDLE_ID=$(grep -A 1 "PRODUCT_BUNDLE_IDENTIFIER" "$PROJECT_ROOT/ios/Runner.xcodeproj/project.pbxproj" | grep -v "PRODUCT_BUNDLE_IDENTIFIER" | head -1 | sed 's/^[ \t]*//;s/;$//' | tr -d '\r')
    if [ -n "$BUNDLE_ID" ]; then
        echo "iOS Bundle Identifier: $BUNDLE_ID"
    else
        echo "Could not extract iOS Bundle Identifier"
    fi
else
    check_item 1 "iOS project configuration issue"
fi

# Check app assets
print_section "App Assets Check"
if [ -d "$PROJECT_ROOT/assets/app_icon" ]; then
    ICON_COUNT=$(find "$PROJECT_ROOT/assets/app_icon" -type f | wc -l)
    if [ $ICON_COUNT -gt 0 ]; then
        check_item 0 "App icons found ($ICON_COUNT files)"
    else
        check_item 1 "App icon directory exists but no files found"
    fi
else
    check_item 1 "App icon directory missing"
fi

# Summary
print_section "Summary"
if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}All checks passed! Ready for release.${NC}"
else
    echo -e "${RED}$FAILED_CHECKS check(s) failed. Please fix the issues before releasing.${NC}"
    exit 1
fi

exit 0

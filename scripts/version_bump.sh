#!/bin/bash
# Script to bump version in pubspec.yaml
# Usage: ./version_bump.sh [patch|minor|major|build]

set -e

# Get current directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PUBSPEC_PATH="$SCRIPT_DIR/../pubspec.yaml"

# Check if file exists
if [ ! -f "$PUBSPEC_PATH" ]; then
    echo "Error: pubspec.yaml not found at $PUBSPEC_PATH"
    exit 1
fi

# Extract current version
CURRENT_VERSION=$(grep "version:" "$PUBSPEC_PATH" | sed 's/version: //g' | tr -d ' ' | tr -d '\r')
echo "Current version: $CURRENT_VERSION"

# Split version into components
VERSION_REGEX="([0-9]+)\.([0-9]+)\.([0-9]+)\+([0-9]+)"
if [[ $CURRENT_VERSION =~ $VERSION_REGEX ]]; then
    MAJOR="${BASH_REMATCH[1]}"
    MINOR="${BASH_REMATCH[2]}"
    PATCH="${BASH_REMATCH[3]}"
    BUILD="${BASH_REMATCH[4]}"
else
    echo "Error: Version doesn't match pattern MAJOR.MINOR.PATCH+BUILD"
    exit 1
fi

# Process command line argument
if [ "$#" -ne 1 ]; then
    echo "Usage: $0 [patch|minor|major|build]"
    exit 1
fi

case "$1" in
    patch)
        PATCH=$((PATCH + 1))
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    major)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
    build)
        BUILD=$((BUILD + 1))
        ;;
    *)
        echo "Error: Invalid argument. Use patch, minor, major, or build."
        exit 1
        ;;
esac

# Create new version
NEW_VERSION="$MAJOR.$MINOR.$PATCH+$BUILD"
echo "New version: $NEW_VERSION"

# Update pubspec.yaml
sed -i "" "s/version: $CURRENT_VERSION/version: $NEW_VERSION/g" "$PUBSPEC_PATH"

echo "Version updated successfully in pubspec.yaml"
exit 0

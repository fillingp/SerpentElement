#!/bin/bash

# Gemini AI iOS App Build Script
# This script builds and optionally runs the iOS app

set -e

echo "🚀 Building Gemini AI iOS App..."

# Check if Swift is available
if ! command -v swift &> /dev/null; then
    echo "❌ Swift is not installed or not in PATH"
    echo "Please install Xcode and the command line tools"
    exit 1
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
swift package clean

# Resolve dependencies
echo "📦 Resolving dependencies..."
swift package resolve

# Build the project
echo "🔨 Building the project..."
swift build

# Run tests
echo "🧪 Running tests..."
swift test

echo "✅ Build completed successfully!"
echo ""
echo "To run the app:"
echo "1. Open Xcode"
echo "2. Open Package.swift in this directory"
echo "3. Select a target device or simulator"
echo "4. Press Cmd+R to run"
echo ""
echo "Or use the following command to generate an Xcode project:"
echo "swift package generate-xcodeproj"
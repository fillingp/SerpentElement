#!/bin/bash

# Generate Xcode Project Script for Gemini AI iOS App

set -e

echo "🔧 Generating Xcode project for Gemini AI iOS App..."

# Check if Swift is available
if ! command -v swift &> /dev/null; then
    echo "❌ Swift is not installed or not in PATH"
    echo "Please install Xcode and the command line tools"
    exit 1
fi

# Generate Xcode project
echo "📱 Generating Xcode project..."
swift package generate-xcodeproj

echo "✅ Xcode project generated successfully!"
echo ""
echo "You can now:"
echo "1. Open GeminiAIApp.xcodeproj in Xcode"
echo "2. Select your target device or simulator"
echo "3. Press Cmd+R to build and run the app"
echo ""
echo "Note: Make sure to:"
echo "- Set the correct bundle identifier"
echo "- Configure code signing"
echo "- Add any required permissions to Info.plist"
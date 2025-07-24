# Gemini AI iOS App - Setup Guide

## Quick Start

This is a complete iOS app that integrates with Google's Gemini AI API. Follow these steps to get it running on your iOS device or simulator.

## Prerequisites

### Required
- **macOS** (iOS development requires macOS)
- **Xcode 15.0+** (Download from Mac App Store)
- **iOS 15.0+** device or simulator
- **Internet connection** (for AI API calls)

### API Key
The app comes pre-configured with a Gemini API key: `AIzaSyBOBpBZzCZdg6ugSNHrWTWih4SQPvPMGYE`

For production use, get your own API key from [Google AI Studio](https://makersuite.google.com/app/apikey).

## Setup Methods

### Method 1: Direct Xcode (Recommended)

1. **Download/Clone this project**
2. **Open Xcode**
3. **File → Open** and select the `GeminiAIApp` folder
4. **Select Package.swift** when prompted
5. **Wait for dependencies** to resolve automatically
6. **Select target device** (iPhone simulator or physical device)
7. **Press Cmd+R** to build and run

### Method 2: Generate Xcode Project

```bash
cd GeminiAIApp
./generate-xcode-project.sh
open GeminiAIApp.xcodeproj
```

## Project Structure

```
GeminiAIApp/
├── Package.swift                 # Swift Package configuration
├── Sources/                      # Main source code
│   ├── GeminiAIApp.swift        # App entry point
│   ├── ContentView.swift        # Main chat interface
│   ├── ChatService.swift        # AI communication service
│   ├── ChatMessage.swift        # Message data model
│   ├── APIKey.swift             # API key configuration
│   ├── ImagePicker.swift        # Image selection component
│   ├── SettingsView.swift       # Settings screen
│   ├── MainTabView.swift        # Tab navigation
│   ├── Extensions.swift         # Utility extensions
│   └── LoadingView.swift        # Loading animations
├── Tests/                        # Unit tests
│   └── GeminiAIAppTests.swift   # Test cases
├── Info.plist                   # App configuration
├── README.md                    # Project documentation
├── LICENSE                      # MIT license
└── Scripts/                     # Build utilities
    ├── build.sh                 # Build script
    └── generate-xcode-project.sh # Xcode project generator
```

## Key Features

### 🤖 AI Chat
- Real-time conversation with Gemini AI
- Multi-turn context-aware conversations
- Intelligent responses powered by Gemini 1.5 Flash

### 🖼️ Image Analysis
- Upload photos from library
- Take photos with camera
- AI-powered image understanding and analysis

### 💬 Modern UI
- Beautiful SwiftUI interface
- Smooth animations and transitions
- Dark/light mode support
- Responsive design for all iPhone sizes

### ⚙️ Advanced Features
- Export conversation history
- Customizable AI parameters
- Safety content filtering
- Error handling and retry logic

## Configuration

### API Key Setup

**Option 1: Direct (Current Setup)**
The API key is already configured in `Sources/APIKey.swift`:
```swift
static let `default` = "AIzaSyBOBpBZzCZdg6ugSNHrWTWih4SQPvPMGYE"
```

**Option 2: Environment Variable**
```bash
export GEMINI_API_KEY="your_api_key_here"
```

**Option 3: Plist File (Production)**
1. Create `Config.plist` in your app bundle
2. Add `GEMINI_API_KEY` string entry
3. The app will auto-load it

### Model Parameters

Customize AI behavior in `ChatService.swift`:

```swift
GenerationConfig(
    temperature: 0.7,        // Creativity (0.0-1.0)
    topP: 0.8,              // Nucleus sampling
    topK: 20,               // Token selection
    maxOutputTokens: 2048   // Response length
)
```

### Safety Settings

Adjust content filtering:

```swift
SafetySetting(harmCategory: .harassment, threshold: .blockMediumAndAbove)
```

## Troubleshooting

### Common Issues

**Build Errors**
- Ensure Xcode 15.0+ is installed
- Clean build folder: Product → Clean Build Folder
- Reset package caches: File → Packages → Reset Package Caches

**API Key Issues**
- Verify the API key is valid
- Check internet connection
- Ensure Gemini API is enabled in Google Cloud Console

**Permission Issues**
- Allow photo library access in Settings → Privacy
- Grant camera permissions when prompted

**Simulator Issues**
- Use iOS 15.0+ simulator
- Restart simulator if needed
- Check Xcode simulator settings

### Device Requirements

**iOS Device**
- iOS 15.0 or later
- Internet connection required
- Camera/photo library for image features

**Development Machine**
- macOS 12.0 or later
- Xcode 15.0 or later
- Apple Developer account (for device deployment)

## Usage Examples

### Text Chat
1. Launch app
2. Type "Explain quantum physics"
3. Tap send button
4. View AI response

### Image Analysis
1. Tap camera icon
2. Select image from library
3. Type "What's in this image?"
4. Send for AI analysis

### Export Chat
1. Go to Settings tab
2. Tap "Export Chat History"
3. Share via Messages, Email, etc.

## Development Notes

### Architecture
- **MVVM Pattern**: Clean separation of View, ViewModel, and Model
- **SwiftUI**: Modern declarative UI framework
- **Combine**: Reactive programming for state management
- **Async/Await**: Modern concurrency for API calls

### Dependencies
- `GoogleGenerativeAI`: Official Google SDK for Gemini AI
- Native iOS frameworks: SwiftUI, PhotosUI, Foundation

### Testing
Run unit tests:
```bash
swift test  # Command line
```
Or in Xcode: Product → Test (Cmd+U)

## Support

### Documentation
- [Gemini API Docs](https://ai.google.dev/docs)
- [SwiftUI Documentation](https://developer.apple.com/xcode/swiftui/)
- [iOS Development Guide](https://developer.apple.com/ios/)

### Getting Help
1. Check this README and troubleshooting section
2. Review the official Gemini API documentation
3. Check Xcode console for error messages
4. Verify all prerequisites are met

## License

This project is licensed under the MIT License. See `LICENSE` file for details.

---

**Happy coding! 🚀**

Built with ❤️ using SwiftUI and Google Gemini AI
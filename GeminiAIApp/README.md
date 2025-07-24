# Gemini AI iOS App

A beautiful and feature-rich iOS application that integrates with Google's Gemini AI API to provide intelligent conversational AI capabilities.

## Features

🤖 **Intelligent AI Chat**: Powered by Google's Gemini 1.5 Flash model
📱 **Modern SwiftUI Interface**: Beautiful, responsive design optimized for iOS
🖼️ **Multimodal Support**: Analyze images and discuss them with AI
💬 **Multi-turn Conversations**: Maintains context across conversation
📤 **Export Conversations**: Save and share your chat history
🛡️ **Safety Filters**: Built-in content safety and filtering
⚙️ **Customizable Settings**: Configure model parameters and preferences

## Screenshots

The app features a clean, modern interface with:
- Real-time chat with Gemini AI
- Image upload and analysis capabilities
- Typing indicators and smooth animations
- Export and sharing functionality
- Comprehensive settings panel

## Requirements

- iOS 15.0+ / macOS 12.0+
- Xcode 15.0+
- Swift 5.9+
- Gemini API Key from Google AI Studio

## Installation

### Option 1: Using Xcode (Recommended)

1. **Clone or download this repository**
2. **Open the project in Xcode**:
   ```bash
   open GeminiAIApp.xcodeproj
   ```
3. **Install dependencies**: Xcode will automatically resolve the Swift Package dependencies
4. **Configure API Key**: The API key is already configured in `APIKey.swift`
5. **Build and run** the project

### Option 2: Using Swift Package Manager

```bash
# Clone the repository
git clone <repository-url>
cd GeminiAIApp

# Build the project
swift build

# Run tests
swift test
```

## API Key Configuration

The app is pre-configured with a Gemini API key. However, for production use or if you want to use your own key:

1. **Get your API key** from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **Update the API key** in `Sources/APIKey.swift`:
   ```swift
   static let `default` = "YOUR_API_KEY_HERE"
   ```

### Alternative Configuration Methods

**Environment Variable** (for development):
```bash
export GEMINI_API_KEY="your_api_key_here"
```

**Plist File** (for production):
1. Create a `Config.plist` file in your app bundle
2. Add a `GEMINI_API_KEY` string entry
3. The app will automatically load it

## Usage

### Basic Chat
1. Launch the app
2. Type your message in the text field
3. Tap the send button or press return
4. Watch as Gemini AI responds intelligently

### Image Analysis
1. Tap the image button (📷) in the chat interface
2. Select an image from your photo library
3. Add a text prompt describing what you want to know about the image
4. Send the message to get AI analysis

### Export Conversations
1. Go to the Settings tab
2. Tap "Export Chat History"
3. Share or save your conversation

## Architecture

The app follows modern iOS development practices:

- **SwiftUI**: Declarative UI framework
- **MVVM Pattern**: Clean separation of concerns
- **Combine Framework**: Reactive programming
- **Swift Concurrency**: Async/await for API calls
- **Modular Design**: Reusable components and services

### Key Components

- `ChatService`: Manages AI communication and conversation state
- `ContentView`: Main chat interface
- `MessageView`: Individual message display component
- `ImagePicker`: Image selection functionality
- `SettingsView`: App configuration and management

## Customization

### Model Configuration

You can customize the AI model behavior in `ChatService.swift`:

```swift
GenerationConfig(
    temperature: 0.7,        // Creativity (0.0-1.0)
    topP: 0.8,              // Nucleus sampling
    topK: 20,               // Token selection
    maxOutputTokens: 2048   // Response length
)
```

### Safety Settings

Adjust content filtering in `ChatService.swift`:

```swift
SafetySetting(harmCategory: .harassment, threshold: .blockMediumAndAbove)
```

## Troubleshooting

### Common Issues

**"API Key Invalid" Error**:
- Verify your API key is correctly set in `APIKey.swift`
- Ensure the API key has proper permissions
- Check that Gemini API is enabled for your Google Cloud project

**Image Upload Not Working**:
- Check photo library permissions in Settings > Privacy
- Ensure you're selecting a supported image format (JPEG, PNG)

**App Crashes on Launch**:
- Verify all dependencies are properly installed
- Clean and rebuild the project
- Check Xcode version compatibility

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google AI team for the Gemini API
- Swift community for excellent tools and libraries
- Contributors and testers

## Support

If you encounter any issues or have questions:

1. Check the troubleshooting section above
2. Review the [Gemini API documentation](https://ai.google.dev/docs)
3. Open an issue in this repository

---

**Built with ❤️ using SwiftUI and Google Gemini AI**
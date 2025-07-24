# iOS AI Assistant App

This simple SwiftUI iOS application demonstrates how to leverage the Google Generative Language (PaLM / Gemini) API to generate text from user prompts. The sample includes:

* `AIService.swift` – A lightweight networking layer that calls the REST API.
* `ContentView.swift` – A SwiftUI UI featuring a multiline text field, a **Generate** button, and a scrolling result area.
* `AIAppApp.swift` – The entry point for the application.

## Requirements

* Xcode 15 or later
* iOS 17 SDK (targets iOS 15+ if you update the project settings)
* A valid Google Cloud API key with access to the PaLM/Gemini Generative Language API.

## Getting Started

1. Open the **iOSAIApp** folder in Xcode ("Open a project or file" → select the folder).
2. Replace the placeholder API key in `AIService.swift` with your own **securely stored** key (e.g. via `Secrets.xcconfig`, Keychain, or environment variables).
3. Build & run on a simulator or physical device.

## Using the App

1. Enter any prompt into the text field (e.g. *“Write a short story about a time-travelling cat.”*).
2. Tap **Generate**.
3. The app calls the PaLM API and displays the AI-generated response.

## Security Notes

For demo purposes the API key is stored in plain-text within the source. In production you must:

* Never commit keys to version control.
* Store secrets in Keychain, encrypted files, or remote vaults.
* Rotate keys periodically.

## Customisation Ideas

* Swap to the chat‐based endpoint (`chat-bison-001:generateMessage`) for multi-turn conversations.
* Support images or code generation.
* Add speech-to-text or text-to-speech for a fully voice-driven AI assistant.
* Persist chat history locally with Core Data or CloudKit.
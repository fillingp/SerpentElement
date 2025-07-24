import Foundation
import GoogleGenerativeAI
import UIKit

@MainActor
class ChatService: ObservableObject {
    @Published var messages: [ChatMessage] = []
    
    private let model: GenerativeModel
    private var chat: Chat?
    
    init() {
        // Initialize the model with the API key
        model = GenerativeModel(
            name: "gemini-1.5-flash",
            apiKey: APIKey.default,
            generationConfig: GenerationConfig(
                temperature: 0.7,
                topP: 0.8,
                topK: 20,
                maxOutputTokens: 2048
            ),
            safetySettings: [
                SafetySetting(harmCategory: .harassment, threshold: .blockMediumAndAbove),
                SafetySetting(harmCategory: .hateSpeech, threshold: .blockMediumAndAbove),
                SafetySetting(harmCategory: .sexuallyExplicit, threshold: .blockMediumAndAbove),
                SafetySetting(harmCategory: .dangerousContent, threshold: .blockMediumAndAbove)
            ]
        )
        
        // Start a new chat session
        chat = model.startChat()
        
        // Add welcome message
        let welcomeMessage = ChatMessage(
            text: "Hello! I'm Gemini AI, your intelligent assistant. I can help you with a wide variety of tasks including:\n\n• Answering questions\n• Writing and editing\n• Problem solving\n• Creative tasks\n• Image analysis\n• And much more!\n\nWhat would you like to explore today?",
            isUser: false,
            timestamp: Date()
        )
        messages.append(welcomeMessage)
    }
    
    func sendMessage(text: String, image: UIImage? = nil) {
        // Add user message
        let userMessage = ChatMessage(
            text: text,
            isUser: true,
            timestamp: Date(),
            image: image
        )
        messages.append(userMessage)
        
        // Add loading message for AI response
        let loadingMessage = ChatMessage(
            text: "",
            isUser: false,
            timestamp: Date(),
            isLoading: true
        )
        messages.append(loadingMessage)
        
        Task {
            await generateResponse(for: text, with: image)
        }
    }
    
    private func generateResponse(for text: String, with image: UIImage? = nil) async {
        do {
            let response: GenerateContentResponse
            
            if let image = image {
                // Handle multimodal input (text + image)
                response = try await model.generateContent(text, image)
            } else {
                // Handle text-only input
                guard let chat = chat else {
                    updateLastMessage(with: "Error: Chat session not initialized")
                    return
                }
                response = try await chat.sendMessage(text)
            }
            
            guard let responseText = response.text else {
                updateLastMessage(with: "I apologize, but I couldn't generate a response. Please try again.")
                return
            }
            
            updateLastMessage(with: responseText)
            
        } catch {
            updateLastMessage(with: "I encountered an error: \(error.localizedDescription). Please try again.")
        }
    }
    
    private func updateLastMessage(with text: String) {
        if let lastIndex = messages.lastIndex(where: { !$0.isUser }) {
            messages[lastIndex] = ChatMessage(
                id: messages[lastIndex].id,
                text: text,
                isUser: false,
                timestamp: Date(),
                isLoading: false
            )
        }
    }
    
    func clearChat() {
        messages.removeAll()
        chat = model.startChat()
        
        // Add welcome message
        let welcomeMessage = ChatMessage(
            text: "Chat cleared! How can I help you today?",
            isUser: false,
            timestamp: Date()
        )
        messages.append(welcomeMessage)
    }
    
    func exportChat() -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        
        var exportText = "Gemini AI Chat Export\n"
        exportText += "Generated on: \(formatter.string(from: Date()))\n"
        exportText += String(repeating: "=", count: 50) + "\n\n"
        
        for message in messages {
            let sender = message.isUser ? "You" : "Gemini AI"
            let timestamp = formatter.string(from: message.timestamp)
            exportText += "[\(timestamp)] \(sender):\n\(message.text)\n\n"
        }
        
        return exportText
    }
}
import XCTest
@testable import GeminiAIApp

final class GeminiAIAppTests: XCTestCase {
    
    func testChatMessageCreation() {
        let message = ChatMessage(
            text: "Hello, World!",
            isUser: true,
            timestamp: Date()
        )
        
        XCTAssertEqual(message.text, "Hello, World!")
        XCTAssertTrue(message.isUser)
        XCTAssertFalse(message.isLoading)
        XCTAssertNil(message.image)
    }
    
    func testChatMessageEquality() {
        let id = UUID()
        let message1 = ChatMessage(
            id: id,
            text: "Test",
            isUser: true,
            timestamp: Date()
        )
        let message2 = ChatMessage(
            id: id,
            text: "Different text",
            isUser: false,
            timestamp: Date()
        )
        
        XCTAssertEqual(message1, message2) // Should be equal because they have the same ID
    }
    
    func testAPIKeyDefault() {
        XCTAssertFalse(APIKey.default.isEmpty)
        XCTAssertTrue(APIKey.default.hasPrefix("AIzaSy"))
    }
    
    func testChatServiceInitialization() {
        let chatService = ChatService()
        
        XCTAssertFalse(chatService.messages.isEmpty)
        XCTAssertFalse(chatService.messages.first?.isUser ?? true)
        XCTAssertTrue(chatService.messages.first?.text.contains("Hello") ?? false)
    }
    
    func testChatExport() {
        let chatService = ChatService()
        let exportText = chatService.exportChat()
        
        XCTAssertTrue(exportText.contains("Gemini AI Chat Export"))
        XCTAssertTrue(exportText.contains("Generated on:"))
    }
}
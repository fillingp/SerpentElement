import Foundation
import UIKit

struct ChatMessage: Identifiable, Equatable {
    let id: UUID
    let text: String
    let isUser: Bool
    let timestamp: Date
    let image: UIImage?
    let isLoading: Bool
    
    init(
        id: UUID = UUID(),
        text: String,
        isUser: Bool,
        timestamp: Date,
        image: UIImage? = nil,
        isLoading: Bool = false
    ) {
        self.id = id
        self.text = text
        self.isUser = isUser
        self.timestamp = timestamp
        self.image = image
        self.isLoading = isLoading
    }
    
    static func == (lhs: ChatMessage, rhs: ChatMessage) -> Bool {
        lhs.id == rhs.id
    }
}
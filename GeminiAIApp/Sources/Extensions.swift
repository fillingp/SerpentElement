import SwiftUI
import UIKit

// MARK: - Color Extensions
extension Color {
    static let geminiBlue = Color(red: 0.25, green: 0.45, blue: 0.85)
    static let geminiPurple = Color(red: 0.55, green: 0.35, blue: 0.85)
    static let chatBackground = Color(.systemGray6)
    static let messageBackground = Color(.systemGray5)
}

// MARK: - View Extensions
extension View {
    func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        clipShape(RoundedCorner(radius: radius, corners: corners))
    }
    
    func hideKeyboard() {
        UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
    }
}

// MARK: - Custom Shapes
struct RoundedCorner: Shape {
    var radius: CGFloat = .infinity
    var corners: UIRectCorner = .allCorners

    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(
            roundedRect: rect,
            byRoundingCorners: corners,
            cornerRadii: CGSize(width: radius, height: radius)
        )
        return Path(path.cgPath)
    }
}

// MARK: - String Extensions
extension String {
    var trimmed: String {
        return self.trimmingCharacters(in: .whitespacesAndNewlines)
    }
    
    var isNotEmpty: Bool {
        return !self.trimmed.isEmpty
    }
}

// MARK: - Date Extensions
extension Date {
    func timeAgoDisplay() -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: self, relativeTo: Date())
    }
}

// MARK: - UIImage Extensions
extension UIImage {
    func resized(to size: CGSize) -> UIImage? {
        UIGraphicsBeginImageContextWithOptions(size, false, scale)
        defer { UIGraphicsEndImageContext() }
        draw(in: CGRect(origin: .zero, size: size))
        return UIGraphicsGetImageFromCurrentImageContext()
    }
    
    func compressedForAI() -> UIImage? {
        // Compress image for better API performance
        let maxSize: CGFloat = 1024
        let currentSize = self.size
        
        if currentSize.width <= maxSize && currentSize.height <= maxSize {
            return self
        }
        
        let scale = min(maxSize / currentSize.width, maxSize / currentSize.height)
        let newSize = CGSize(width: currentSize.width * scale, height: currentSize.height * scale)
        
        return resized(to: newSize)
    }
}
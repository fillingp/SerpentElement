import SwiftUI

struct LoadingView: View {
    @State private var isAnimating = false
    let message: String
    
    init(message: String = "Thinking...") {
        self.message = message
    }
    
    var body: some View {
        VStack(spacing: 16) {
            // Animated dots
            HStack(spacing: 8) {
                ForEach(0..<3, id: \.self) { index in
                    Circle()
                        .fill(
                            LinearGradient(
                                gradient: Gradient(colors: [.geminiBlue, .geminiPurple]),
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 12, height: 12)
                        .scaleEffect(isAnimating ? 1.2 : 0.8)
                        .animation(
                            Animation.easeInOut(duration: 0.6)
                                .repeatForever()
                                .delay(Double(index) * 0.2),
                            value: isAnimating
                        )
                }
            }
            
            Text(message)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .onAppear {
            isAnimating = true
        }
        .onDisappear {
            isAnimating = false
        }
    }
}

struct PulsingCircle: View {
    @State private var isPulsing = false
    let color: Color
    let size: CGFloat
    
    init(color: Color = .geminiBlue, size: CGFloat = 20) {
        self.color = color
        self.size = size
    }
    
    var body: some View {
        Circle()
            .fill(color)
            .frame(width: size, height: size)
            .scaleEffect(isPulsing ? 1.2 : 0.8)
            .opacity(isPulsing ? 0.6 : 1.0)
            .animation(
                Animation.easeInOut(duration: 1.0).repeatForever(autoreverses: true),
                value: isPulsing
            )
            .onAppear {
                isPulsing = true
            }
    }
}

struct TypingIndicator: View {
    @State private var animationPhase = 0
    
    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<3, id: \.self) { index in
                Circle()
                    .fill(Color.gray)
                    .frame(width: 8, height: 8)
                    .opacity(animationPhase == index ? 1.0 : 0.4)
            }
        }
        .onAppear {
            withAnimation(Animation.linear(duration: 1.2).repeatForever(autoreverses: false)) {
                animationPhase = 2
            }
        }
    }
}

#Preview {
    VStack(spacing: 30) {
        LoadingView()
        LoadingView(message: "Analyzing image...")
        PulsingCircle()
        TypingIndicator()
    }
    .padding()
}
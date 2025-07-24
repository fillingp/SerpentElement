import SwiftUI
import GoogleGenerativeAI

struct ContentView: View {
    @StateObject private var chatService = ChatService()
    @State private var textInput = ""
    @State private var showingImagePicker = false
    @State private var selectedImage: UIImage?
    @FocusState private var isTextFieldFocused: Bool
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Chat Messages
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(chatService.messages) { message in
                                MessageView(message: message)
                                    .id(message.id)
                            }
                        }
                        .padding()
                    }
                    .onChange(of: chatService.messages.count) { _ in
                        if let lastMessage = chatService.messages.last {
                            withAnimation(.easeInOut(duration: 0.5)) {
                                proxy.scrollTo(lastMessage.id, anchor: .bottom)
                            }
                        }
                    }
                }
                
                Divider()
                
                // Input Area
                VStack(spacing: 12) {
                    if let selectedImage = selectedImage {
                        HStack {
                            Image(uiImage: selectedImage)
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(height: 80)
                                .cornerRadius(8)
                            
                            Spacer()
                            
                            Button("Remove") {
                                self.selectedImage = nil
                            }
                            .foregroundColor(.red)
                        }
                        .padding(.horizontal)
                    }
                    
                    HStack(spacing: 12) {
                        // Image picker button
                        Button(action: {
                            showingImagePicker = true
                        }) {
                            Image(systemName: "photo.on.rectangle")
                                .font(.title2)
                                .foregroundColor(.blue)
                        }
                        
                        // Text input
                        TextField("Ask me anything...", text: $textInput, axis: .vertical)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                            .focused($isTextFieldFocused)
                            .lineLimit(1...5)
                        
                        // Send button
                        Button(action: sendMessage) {
                            Image(systemName: "paperplane.fill")
                                .font(.title2)
                                .foregroundColor(.white)
                                .padding(8)
                                .background(
                                    Circle()
                                        .fill(textInput.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? 
                                              Color.gray : Color.blue)
                                )
                        }
                        .disabled(textInput.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                    }
                    .padding()
                }
                .background(Color(.systemGray6))
            }
            .navigationTitle("Gemini AI Chat")
            .navigationBarTitleDisplayMode(.inline)
            .onTapGesture {
                isTextFieldFocused = false
            }
        }
        .sheet(isPresented: $showingImagePicker) {
            ImagePicker(selectedImage: $selectedImage)
        }
    }
    
    private func sendMessage() {
        guard !textInput.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        
        let messageText = textInput
        textInput = ""
        isTextFieldFocused = false
        
        if let image = selectedImage {
            chatService.sendMessage(text: messageText, image: image)
            selectedImage = nil
        } else {
            chatService.sendMessage(text: messageText)
        }
    }
}

struct MessageView: View {
    let message: ChatMessage
    
    var body: some View {
        HStack {
            if message.isUser {
                Spacer()
                userMessageView
            } else {
                aiMessageView
                Spacer()
            }
        }
    }
    
    private var userMessageView: some View {
        VStack(alignment: .trailing, spacing: 8) {
            if let image = message.image {
                Image(uiImage: image)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(maxHeight: 200)
                    .cornerRadius(12)
            }
            
            Text(message.text)
                .padding(12)
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(16)
                .frame(maxWidth: 250, alignment: .trailing)
        }
    }
    
    private var aiMessageView: some View {
        HStack(alignment: .top, spacing: 8) {
            Circle()
                .fill(
                    LinearGradient(
                        gradient: Gradient(colors: [.purple, .blue]),
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: 32, height: 32)
                .overlay(
                    Text("AI")
                        .font(.caption)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                )
            
            VStack(alignment: .leading, spacing: 4) {
                if message.isLoading {
                    HStack(spacing: 4) {
                        ForEach(0..<3) { index in
                            Circle()
                                .fill(Color.gray)
                                .frame(width: 8, height: 8)
                                .scaleEffect(message.isLoading ? 1.0 : 0.5)
                                .animation(
                                    Animation.easeInOut(duration: 0.5)
                                        .repeatForever()
                                        .delay(Double(index) * 0.2),
                                    value: message.isLoading
                                )
                        }
                    }
                    .padding(12)
                    .background(Color(.systemGray5))
                    .cornerRadius(16)
                } else {
                    Text(message.text)
                        .padding(12)
                        .background(Color(.systemGray5))
                        .cornerRadius(16)
                        .frame(maxWidth: 250, alignment: .leading)
                }
                
                Text(formatDate(message.timestamp))
                    .font(.caption2)
                    .foregroundColor(.gray)
            }
        }
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

#Preview {
    ContentView()
}
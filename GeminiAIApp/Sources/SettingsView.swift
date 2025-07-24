import SwiftUI

struct SettingsView: View {
    @ObservedObject var chatService: ChatService
    @State private var showingExportSheet = false
    @State private var exportText = ""
    @State private var showingClearAlert = false
    
    var body: some View {
        NavigationView {
            Form {
                Section("Chat Management") {
                    Button("Export Chat History") {
                        exportText = chatService.exportChat()
                        showingExportSheet = true
                    }
                    .foregroundColor(.blue)
                    
                    Button("Clear Chat History") {
                        showingClearAlert = true
                    }
                    .foregroundColor(.red)
                }
                
                Section("About Gemini AI") {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Gemini AI Assistant")
                            .font(.headline)
                        
                        Text("Powered by Google's advanced Gemini AI model, this app provides intelligent conversational AI with support for text and image inputs.")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                Section("Features") {
                    Label("Text Conversations", systemImage: "text.bubble")
                    Label("Image Analysis", systemImage: "photo.on.rectangle")
                    Label("Multi-turn Conversations", systemImage: "arrow.triangle.2.circlepath")
                    Label("Smart Safety Filters", systemImage: "shield.checkered")
                }
                
                Section("Model Information") {
                    HStack {
                        Text("Model")
                        Spacer()
                        Text("Gemini 1.5 Flash")
                            .foregroundColor(.secondary)
                    }
                    
                    HStack {
                        Text("Temperature")
                        Spacer()
                        Text("0.7")
                            .foregroundColor(.secondary)
                    }
                    
                    HStack {
                        Text("Max Output Tokens")
                        Spacer()
                        Text("2,048")
                            .foregroundColor(.secondary)
                    }
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
        }
        .sheet(isPresented: $showingExportSheet) {
            NavigationView {
                ScrollView {
                    Text(exportText)
                        .font(.system(.body, design: .monospaced))
                        .padding()
                }
                .navigationTitle("Chat Export")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button("Done") {
                            showingExportSheet = false
                        }
                    }
                    
                    ToolbarItem(placement: .navigationBarLeading) {
                        ShareLink(
                            item: exportText,
                            subject: Text("Gemini AI Chat Export"),
                            message: Text("Here's my conversation with Gemini AI")
                        ) {
                            Image(systemName: "square.and.arrow.up")
                        }
                    }
                }
            }
        }
        .alert("Clear Chat History", isPresented: $showingClearAlert) {
            Button("Cancel", role: .cancel) {}
            Button("Clear", role: .destructive) {
                chatService.clearChat()
            }
        } message: {
            Text("Are you sure you want to clear all chat history? This action cannot be undone.")
        }
    }
}

#Preview {
    SettingsView(chatService: ChatService())
}
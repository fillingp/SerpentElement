// ContentView.swift
import SwiftUI

struct ContentView: View {
    @State private var prompt: String = ""
    @State private var isLoading: Bool = false
    @State private var result: String = ""
    @State private var errorMessage: String?

    var body: some View {
        NavigationView {
            VStack(spacing: 16) {
                TextField("Enter your prompt", text: $prompt, axis: .vertical)
                    .textFieldStyle(.roundedBorder)
                    .lineLimit(2...4)

                Button(action: generate) {
                    if isLoading {
                        ProgressView()
                    } else {
                        Text("Generate")
                            .frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(prompt.isEmpty || isLoading)

                if !result.isEmpty {
                    ScrollView {
                        Text(result)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding()
                            .background(Color(.secondarySystemBackground))
                            .cornerRadius(8)
                    }
                }

                Spacer()
            }
            .padding()
            .navigationTitle("AI Assistant")
            .alert(item: $errorMessage) { msg in
                Alert(title: Text("Error"), message: Text(msg), dismissButton: .default(Text("OK")))
            }
        }
    }

    private func generate() {
        guard !prompt.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        isLoading = true
        result = ""
        AIService.generateText(prompt: prompt) { response in
            DispatchQueue.main.async {
                isLoading = false
                switch response {
                case .success(let text):
                    self.result = text
                case .failure(let error):
                    self.errorMessage = error.localizedDescription
                }
            }
        }
    }
}

#Preview {
    ContentView()
}
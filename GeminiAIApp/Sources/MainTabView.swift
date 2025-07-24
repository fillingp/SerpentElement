import SwiftUI

struct MainTabView: View {
    @StateObject private var chatService = ChatService()
    
    var body: some View {
        TabView {
            ContentView()
                .environmentObject(chatService)
                .tabItem {
                    Image(systemName: "bubble.left.and.bubble.right")
                    Text("Chat")
                }
            
            SettingsView(chatService: chatService)
                .tabItem {
                    Image(systemName: "gearshape")
                    Text("Settings")
                }
        }
        .accentColor(.blue)
    }
}

#Preview {
    MainTabView()
}
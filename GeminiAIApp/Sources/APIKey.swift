import Foundation

enum APIKey {
    // Get an API key from https://ai.google.dev/
    static let `default` = "AIzaSyBOBpBZzCZdg6ugSNHrWTWih4SQPvPMGYE"
    
    // Alternative method to load from environment variable
    static var fromEnvironment: String? {
        return ProcessInfo.processInfo.environment["GEMINI_API_KEY"]
    }
    
    // Alternative method to load from a plist file (for production apps)
    static var fromPlist: String? {
        guard let path = Bundle.main.path(forResource: "Config", ofType: "plist"),
              let plist = NSDictionary(contentsOfFile: path),
              let apiKey = plist["GEMINI_API_KEY"] as? String else {
            return nil
        }
        return apiKey
    }
}
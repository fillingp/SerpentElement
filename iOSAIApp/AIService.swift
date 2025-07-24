// AIService.swift
import Foundation

enum AIServiceError: Error, LocalizedError {
    case invalidResponse
    case serverError(String)

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            return "The service returned an invalid response."
        case .serverError(let message):
            return message
        }
    }
}

final class AIService {

    // MARK: - Properties
    private static let apiKey: String = "AIzaSyBOBpBZzCZdg6ugSNHrWTWih4SQPvPMGYE" // TODO: Move to secure storage for production
    private static let model: String = "text-bison-001" // Change to another model if desired

    // MARK: - Networking
    /// Generates text from the given prompt using Google Generative Language API.
    /// - Parameters:
    ///   - prompt: Prompt string provided by the user.
    ///   - temperature: Controls randomness of output (0–1). Default is 0.7.
    ///   - completion: Callback with the resulting text or an error.
    static func generateText(prompt: String,
                             temperature: Double = 0.7,
                             completion: @escaping (Result<String, Error>) -> Void) {
        guard let url = URL(string: "https://generativelanguage.googleapis.com/v1beta/models/\(model):generateText?key=\(apiKey)") else {
            completion(.failure(AIServiceError.invalidResponse))
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")

        let payload: [String: Any] = [
            "prompt": ["text": prompt],
            "temperature": temperature
        ]

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: payload, options: [])
        } catch {
            completion(.failure(error))
            return
        }

        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }

            guard
                let data = data,
                let httpResponse = response as? HTTPURLResponse,
                200..<300 ~= httpResponse.statusCode
            else {
                completion(.failure(AIServiceError.invalidResponse))
                return
            }

            do {
                if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let candidates = json["candidates"] as? [[String: Any]],
                   let firstCandidate = candidates.first,
                   let output = firstCandidate["output"] as? String {
                    completion(.success(output))
                } else {
                    completion(.failure(AIServiceError.invalidResponse))
                }
            } catch {
                completion(.failure(error))
            }
        }
        task.resume()
    }
}
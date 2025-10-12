import Foundation
#if canImport(FoundationModels)
import FoundationModels
#endif

// MARK: - JSON Command Structure
struct Command: Codable {
    let action: String
    let parameters: [String: AnyCodable]?
}

struct Response: Codable {
    let success: Bool
    let data: AnyCodable?
    let error: String?
}

// Helper to handle any JSON value
struct AnyCodable: Codable {
    let value: Any
    
    init(_ value: Any) {
        self.value = value
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        
        if let bool = try? container.decode(Bool.self) {
            value = bool
        } else if let int = try? container.decode(Int.self) {
            value = int
        } else if let double = try? container.decode(Double.self) {
            value = double
        } else if let string = try? container.decode(String.self) {
            value = string
        } else if let array = try? container.decode([AnyCodable].self) {
            value = array.map { $0.value }
        } else if let dict = try? container.decode([String: AnyCodable].self) {
            value = dict.mapValues { $0.value }
        } else {
            value = NSNull()
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        
        switch value {
        case let bool as Bool:
            try container.encode(bool)
        case let int as Int:
            try container.encode(int)
        case let double as Double:
            try container.encode(double)
        case let string as String:
            try container.encode(string)
        case let array as [Any]:
            try container.encode(array.map { AnyCodable($0) })
        case let dict as [String: Any]:
            try container.encode(dict.mapValues { AnyCodable($0) })
        default:
            try container.encodeNil()
        }
    }
}

// MARK: - Foundation Models Wrapper
#if canImport(FoundationModels)
@available(macOS 15.0, *)
class FoundationModelsWrapper {
    
    func handleCommand(_ command: Command) async throws -> Response {
        switch command.action {
        case "listAvailableModels":
            return try await listAvailableModels()
        case "generateText":
            return try await generateText(parameters: command.parameters)
        case "generateStream":
            return try await generateStream(parameters: command.parameters)
        default:
            return Response(
                success: false,
                data: nil,
                error: "Unknown action: \(command.action)"
            )
        }
    }
    
    private func listAvailableModels() async throws -> Response {
        // Get available models from FoundationModels
        let models = LanguageModel.availableModels.map { model in
            [
                "id": model.id,
                "name": model.name ?? "Unknown",
                "maxTokens": model.maxTokens ?? 0
            ] as [String: Any]
        }
        
        return Response(
            success: true,
            data: AnyCodable(models),
            error: nil
        )
    }
    
    private func generateText(parameters: [String: AnyCodable]?) async throws -> Response {
        guard let params = parameters else {
            return Response(success: false, data: nil, error: "Missing parameters")
        }
        
        guard let promptValue = params["prompt"]?.value as? String else {
            return Response(success: false, data: nil, error: "Missing 'prompt' parameter")
        }
        
        let modelId = params["modelId"]?.value as? String
        let maxTokens = params["maxTokens"]?.value as? Int
        let temperature = params["temperature"]?.value as? Double
        
        // Initialize model
        var model: LanguageModel
        if let modelId = modelId {
            model = try LanguageModel(id: modelId)
        } else {
            // Use first available model
            guard let firstModel = LanguageModel.availableModels.first else {
                return Response(success: false, data: nil, error: "No models available")
            }
            model = firstModel
        }
        
        // Configure generation
        var config = LanguageModel.GenerationConfig()
        if let maxTokens = maxTokens {
            config.maxTokens = maxTokens
        }
        if let temperature = temperature {
            config.temperature = temperature
        }
        
        // Generate text
        let result = try await model.generate(prompt: promptValue, config: config)
        
        return Response(
            success: true,
            data: AnyCodable([
                "text": result.text,
                "finishReason": result.finishReason?.rawValue ?? "unknown"
            ]),
            error: nil
        )
    }
    
    private func generateStream(parameters: [String: AnyCodable]?) async throws -> Response {
        // Stream implementation would use AsyncStream
        // For now, return error as streaming needs different handling
        return Response(
            success: false,
            data: nil,
            error: "Streaming not yet implemented in CLI mode"
        )
    }
}
#endif

// MARK: - Main Entry Point
@main
struct AppleFoundationModelsWrapperMain {
    static func main() async {
        #if canImport(FoundationModels)
        if #available(macOS 15.0, *) {
            let wrapper = FoundationModelsWrapper()
            
            // Read command from stdin
            guard let line = readLine() else {
                printError("No input provided")
                exit(1)
            }
            
            do {
                let data = line.data(using: .utf8)!
                let command = try JSONDecoder().decode(Command.self, from: data)
                let response = try await wrapper.handleCommand(command)
                printResponse(response)
            } catch {
                printError("Error: \(error.localizedDescription)")
                exit(1)
            }
        } else {
            printError("Requires macOS 15.0 or later")
            exit(1)
        }
        #else
        printError("FoundationModels framework not available")
        exit(1)
        #endif
    }
    
    static func printResponse(_ response: Response) {
        do {
            let encoder = JSONEncoder()
            encoder.outputFormatting = .prettyPrinted
            let data = try encoder.encode(response)
            if let string = String(data: data, encoding: .utf8) {
                print(string)
            }
        } catch {
            printError("Failed to encode response: \(error)")
        }
    }
    
    static func printError(_ message: String) {
        let response = Response(success: false, data: nil, error: message)
        printResponse(response)
    }
}

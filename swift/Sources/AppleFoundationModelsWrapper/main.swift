import Foundation
#if canImport(FoundationModels)
import FoundationModels
#endif

// MARK: - JSON Command Structure
struct Command: Codable {
    let action: String
    let parameters: [String: AnyCodable]?
}

struct CommandResponse: Codable {
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
@available(macOS 26.0, *)
class FoundationModelsWrapper {

    func handleCommand(_ command: Command) async throws -> CommandResponse {
        switch command.action {
        case "listAvailableModels":
            return try await listAvailableModels()
        case "generateText":
            return try await generateText(parameters: command.parameters)
        case "generateStream":
            return try await generateStream(parameters: command.parameters)
        default:
            return CommandResponse(
                success: false,
                data: nil,
                error: "Unknown action: \(command.action)"
            )
        }
    }

    private func listAvailableModels() async throws -> CommandResponse {
        // The actual FoundationModels API only provides SystemLanguageModel.default
        // We'll return a single model entry representing the default model
        let models = [[
            "id": "default",
            "name": "System Language Model",
            "maxTokens": 4096  // Default max tokens
        ] as [String: Any]]

        return CommandResponse(
            success: true,
            data: AnyCodable(models),
            error: nil
        )
    }

    private func generateText(parameters: [String: AnyCodable]?) async throws -> CommandResponse {
        guard let params = parameters else {
            return CommandResponse(success: false, data: nil, error: "Missing parameters")
        }

        guard let promptValue = params["prompt"]?.value as? String else {
            return CommandResponse(success: false, data: nil, error: "Missing 'prompt' parameter")
        }

        let maxTokens = params["maxTokens"]?.value as? Int
        let temperature = params["temperature"]?.value as? Double

        // Get the default model
        let model = SystemLanguageModel.default

        // Check availability
        guard model.isAvailable else {
            return CommandResponse(
                success: false,
                data: nil,
                error: "System language model is not available on this device"
            )
        }

        // Create a session with the model
        let session = LanguageModelSession(model: model)

        // Generate text with options if provided
        let content: String
        if maxTokens != nil || temperature != nil {
            // Build generation options
            var opts = GenerationOptions()
            if let temp = temperature {
                opts.temperature = temp
            }
            if let tokens = maxTokens {
                opts.maximumResponseTokens = tokens
            }
            let modelResponse = try await session.respond(to: promptValue, options: opts)
            content = modelResponse.content
        } else {
            let modelResponse = try await session.respond(to: promptValue)
            content = modelResponse.content
        }

        return CommandResponse(
            success: true,
            data: AnyCodable([
                "text": content,
                "finishReason": "stop"  // FoundationModels doesn't expose finish reason
            ]),
            error: nil
        )
    }

    private func generateStream(parameters: [String: AnyCodable]?) async throws -> CommandResponse {
        guard let params = parameters else {
            return CommandResponse(success: false, data: nil, error: "Missing parameters")
        }

        guard let promptValue = params["prompt"]?.value as? String else {
            return CommandResponse(success: false, data: nil, error: "Missing 'prompt' parameter")
        }

        let maxTokens = params["maxTokens"]?.value as? Int
        let temperature = params["temperature"]?.value as? Double

        // Get the default model
        let model = SystemLanguageModel.default

        // Check availability
        guard model.isAvailable else {
            return CommandResponse(
                success: false,
                data: nil,
                error: "System language model is not available on this device"
            )
        }

        // Create a session with the model
        let session = LanguageModelSession(model: model)

        // Build generation options if provided
        var opts = GenerationOptions()
        if let temp = temperature {
            opts.temperature = temp
        }
        if let tokens = maxTokens {
            opts.maximumResponseTokens = tokens
        }

        // Stream the response
        let stream = session.streamResponse(to: promptValue)

        // Track previous content to send only deltas
        var previousContent = ""

        // Output each chunk as a separate JSON line
        for try await snapshot in stream {
            // Calculate the delta (new content since last snapshot)
            let currentContent = snapshot.content
            let delta: String
            if currentContent.hasPrefix(previousContent) {
                delta = String(currentContent.dropFirst(previousContent.count))
            } else {
                // Fallback if content doesn't have expected prefix
                delta = currentContent
            }

            // Only output if there's new content
            if !delta.isEmpty {
                let chunkResponse = CommandResponse(
                    success: true,
                    data: AnyCodable(["chunk": delta, "done": false]),
                    error: nil
                )
                AppleFoundationModelsWrapperMain.printCompactResponse(chunkResponse)
            }

            previousContent = currentContent
        }

        // Send final done message (also compact for consistency)
        let finalResponse = CommandResponse(
            success: true,
            data: AnyCodable(["chunk": "", "done": true]),
            error: nil
        )
        AppleFoundationModelsWrapperMain.printCompactResponse(finalResponse)

        // Return success (won't be printed since we already sent chunks)
        return finalResponse
    }
}
#endif

// MARK: - Main Entry Point
@main
struct AppleFoundationModelsWrapperMain {
    static func main() async {
        #if canImport(FoundationModels)
        if #available(macOS 26.0, *) {
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
                // Don't print response for streaming - it's already been printed
                if command.action != "generateStream" {
                    printResponse(response)
                }
            } catch {
                printError("Error: \(error.localizedDescription)")
                exit(1)
            }
        } else {
            printError("Requires macOS 26.0 or later")
            exit(1)
        }
        #else
        printError("FoundationModels framework not available")
        exit(1)
        #endif
    }
    
    static func printResponse(_ response: CommandResponse) {
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

    static func printCompactResponse(_ response: CommandResponse) {
        do {
            let encoder = JSONEncoder()
            // No pretty printing for streaming - single line JSON
            let data = try encoder.encode(response)
            if let string = String(data: data, encoding: .utf8) {
                print(string)
            }
        } catch {
            printError("Failed to encode response: \(error)")
        }
    }

    static func printError(_ message: String) {
        let response = CommandResponse(success: false, data: nil, error: message)
        printResponse(response)
    }
}

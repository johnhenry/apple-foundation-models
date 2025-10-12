import Foundation
#if canImport(FoundationModels)
import FoundationModels
import Network
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
struct AnyCodable: Codable, @unchecked Sendable {
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

// MARK: - JSON-RPC Message Structures (for Persistent Server)

struct JSONRPCRequest: Codable {
    let jsonrpc: String
    let id: String?
    let method: String
    let params: AnyCodable?
}

struct JSONRPCResponse: Codable {
    let jsonrpc: String
    let id: String?
    let result: AnyCodable?
    let error: JSONRPCError?

    init(id: String?, result: AnyCodable) {
        self.jsonrpc = "2.0"
        self.id = id
        self.result = result
        self.error = nil
    }

    init(id: String?, error: JSONRPCError) {
        self.jsonrpc = "2.0"
        self.id = id
        self.result = nil
        self.error = error
    }
}

struct JSONRPCError: Codable {
    let code: Int
    let message: String
}

struct ToolDefinition: Codable {
    let name: String
    let description: String
}

// MARK: - Foundation Models Wrapper
#if canImport(FoundationModels)
@available(macOS 26.0, *)
class FoundationModelsWrapper: @unchecked Sendable {

    func handleCommand(_ command: Command) async throws -> CommandResponse {
        switch command.action {
        case "listAvailableModels":
            return try await listAvailableModels()
        case "generateText":
            return try await generateText(parameters: command.parameters)
        case "generateStream":
            return try await generateStream(parameters: command.parameters)
        case "prewarm":
            return try await prewarm(parameters: command.parameters)
        case "prewarmWithPrefix":
            return try await prewarmWithPrefix(parameters: command.parameters)
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

    func generateText(parameters: [String: AnyCodable]?) async throws -> CommandResponse {
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

    func generateStream(parameters: [String: AnyCodable]?) async throws -> CommandResponse {
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

        // IMPLEMENTATION NOTE: Apple's streaming API returns snapshots (cumulative content),
        // not deltas. We calculate deltas here to provide incremental chunks to TypeScript.
        // This matches the expected streaming behavior where consumers receive only new content.
        var previousContent = ""

        // Output each chunk as a separate JSON line (single-line JSON for easy parsing)
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

    func prewarm(parameters: [String: AnyCodable]?) async throws -> CommandResponse {
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

        // Prewarm the session
        try await session.prewarm()

        return CommandResponse(
            success: true,
            data: AnyCodable(["message": "Session prewarmed successfully"]),
            error: nil
        )
    }

    func prewarmWithPrefix(parameters: [String: AnyCodable]?) async throws -> CommandResponse {
        guard let params = parameters else {
            return CommandResponse(success: false, data: nil, error: "Missing parameters")
        }

        guard let prefix = params["prefix"]?.value as? String else {
            return CommandResponse(success: false, data: nil, error: "Missing 'prefix' parameter")
        }

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

        // Prewarm the session with prefix
        // Note: prewarm(promptPrefix:) might need a Prompt type in newer APIs
        try await session.prewarm(promptPrefix: Prompt(prefix))

        return CommandResponse(
            success: true,
            data: AnyCodable(["message": "Session prewarmed with prefix successfully"]),
            error: nil
        )
    }
}

// MARK: - Persistent Server

@available(macOS 26.0, *)
actor PersistentServer {
    private let socketPath: String
    private var serverSocket: Int32 = -1
    private var clientSocket: Int32 = -1
    private nonisolated let wrapper: FoundationModelsWrapper
    private var tools: [ToolDefinition] = []
    private var isRunning = false

    init(socketPath: String) {
        self.socketPath = socketPath
        self.wrapper = FoundationModelsWrapper()
    }

    func start() throws {
        // Remove existing socket file if it exists
        unlink(socketPath)

        // Create Unix domain socket
        serverSocket = socket(AF_UNIX, SOCK_STREAM, 0)
        guard serverSocket != -1 else {
            throw NSError(domain: "PersistentServer", code: Int(errno), userInfo: [NSLocalizedDescriptionKey: "Failed to create socket: \(String(cString: strerror(errno)))"])
        }

        // Bind to socket path
        var addr = sockaddr_un()
        addr.sun_family = sa_family_t(AF_UNIX)

        guard socketPath.utf8.count < MemoryLayout.size(ofValue: addr.sun_path) else {
            close(serverSocket)
            throw NSError(domain: "PersistentServer", code: -1, userInfo: [NSLocalizedDescriptionKey: "Socket path too long"])
        }

        _ = withUnsafeMutablePointer(to: &addr.sun_path.0) { ptr in
            socketPath.withCString { cString in
                strcpy(ptr, cString)
            }
        }

        let bindResult = withUnsafePointer(to: &addr) { ptr in
            ptr.withMemoryRebound(to: sockaddr.self, capacity: 1) { sockaddrPtr in
                bind(serverSocket, sockaddrPtr, socklen_t(MemoryLayout<sockaddr_un>.size))
            }
        }

        guard bindResult != -1 else {
            close(serverSocket)
            throw NSError(domain: "PersistentServer", code: Int(errno), userInfo: [NSLocalizedDescriptionKey: "Failed to bind socket: \(String(cString: strerror(errno)))"])
        }

        // Listen for connections
        guard listen(serverSocket, 1) != -1 else {
            close(serverSocket)
            throw NSError(domain: "PersistentServer", code: Int(errno), userInfo: [NSLocalizedDescriptionKey: "Failed to listen: \(String(cString: strerror(errno)))"])
        }

        isRunning = true
        fputs("[Server] Listening on \(socketPath)\n", stderr)

        // Start accepting connections in background
        Task {
            await acceptConnections()
        }
    }

    private func acceptConnections() async {
        while isRunning {
            // Accept connection (blocking call)
            let client = accept(serverSocket, nil, nil)
            guard client != -1 else {
                if isRunning {
                    fputs("[Server] Accept failed: \(String(cString: strerror(errno)))\n", stderr)
                }
                continue
            }

            fputs("[Server] Client connected\n", stderr)
            clientSocket = client

            // Handle this client
            await handleClient(client)
        }
    }

    private func handleClient(_ socket: Int32) async {
        var buffer = ""
        let bufferSize = 4096
        var readBuffer = [UInt8](repeating: 0, count: bufferSize)

        while isRunning {
            let bytesRead = read(socket, &readBuffer, bufferSize)

            guard bytesRead > 0 else {
                if bytesRead == 0 {
                    fputs("[Server] Client disconnected\n", stderr)
                } else {
                    fputs("[Server] Read error: \(String(cString: strerror(errno)))\n", stderr)
                }
                close(socket)
                return
            }

            guard let chunk = String(bytes: readBuffer[0..<bytesRead], encoding: .utf8) else {
                continue
            }

            buffer += chunk

            // Process complete lines (JSON-RPC messages end with \n)
            let lines = buffer.components(separatedBy: "\n")
            buffer = lines.last ?? ""

            for line in lines.dropLast() {
                guard !line.trimmingCharacters(in: .whitespaces).isEmpty else { continue }
                await handleMessage(line, socket: socket)
            }
        }

        close(socket)
    }

    private func handleMessage(_ line: String, socket: Int32) async {
        do {
            guard let data = line.data(using: .utf8) else { return }
            let request = try JSONDecoder().decode(JSONRPCRequest.self, from: data)

            // Handle different methods
            switch request.method {
            case "registerTools":
                await handleRegisterTools(request, socket: socket)
            case "generateText":
                await handleGenerateText(request, socket: socket)
            case "generateStream", "generateStreamStream":
                await handleGenerateStream(request, socket: socket)
            case "prewarm":
                await handlePrewarm(request, socket: socket)
            case "prewarmWithPrefix":
                await handlePrewarmWithPrefix(request, socket: socket)
            default:
                sendResponse(JSONRPCResponse(
                    id: request.id,
                    error: JSONRPCError(code: -32601, message: "Method not found: \(request.method ?? "unknown")")
                ), socket: socket)
            }
        } catch {
            fputs("[Server] Failed to parse message: \(error)\n", stderr)
        }
    }

    private func handleRegisterTools(_ request: JSONRPCRequest, socket: Int32) async {
        do {
            guard let params = request.params?.value as? [String: Any],
                  let toolsData = try? JSONSerialization.data(withJSONObject: params["tools"] ?? []),
                  let tools = try? JSONDecoder().decode([ToolDefinition].self, from: toolsData) else {
                sendResponse(JSONRPCResponse(
                    id: request.id,
                    error: JSONRPCError(code: -32602, message: "Invalid tools parameter")
                ), socket: socket)
                return
            }

            self.tools = tools
            sendResponse(JSONRPCResponse(
                id: request.id,
                result: AnyCodable(["registered": tools.count])
            ), socket: socket)
        }
    }

    private func handleGenerateText(_ request: JSONRPCRequest, socket: Int32) async {
        do {
            let params = request.params?.value as? [String: Any] ?? [:]
            let response = try await wrapper.generateText(parameters: params.mapValues { AnyCodable($0) })

            sendResponse(JSONRPCResponse(
                id: request.id,
                result: response.data ?? AnyCodable([:])
            ), socket: socket)
        } catch {
            sendResponse(JSONRPCResponse(
                id: request.id,
                error: JSONRPCError(code: -32603, message: error.localizedDescription)
            ), socket: socket)
        }
    }

    private func handleGenerateStream(_ request: JSONRPCRequest, socket: Int32) async {
        // Streaming via JSON-RPC - send multiple responses with same ID
        do {
            let params = request.params?.value as? [String: Any] ?? [:]

            // Convert to parameters for generateStream
            let swiftParams: [String: AnyCodable] = params.mapValues { AnyCodable($0) }

            // Note: This is a simplified version - full streaming implementation
            // would need to properly handle the ResponseStream
            let response = try await wrapper.generateStream(parameters: swiftParams)

            // For now, send the complete response
            // TODO: Implement true streaming with chunks
            sendResponse(JSONRPCResponse(
                id: request.id,
                result: response.data ?? AnyCodable([:])
            ), socket: socket)
        } catch {
            sendResponse(JSONRPCResponse(
                id: request.id,
                error: JSONRPCError(code: -32603, message: error.localizedDescription)
            ), socket: socket)
        }
    }

    private func handlePrewarm(_ request: JSONRPCRequest, socket: Int32) async {
        do {
            let params = request.params?.value as? [String: Any] ?? [:]
            let response = try await wrapper.prewarm(parameters: params.mapValues { AnyCodable($0) })

            sendResponse(JSONRPCResponse(
                id: request.id,
                result: response.data ?? AnyCodable([:])
            ), socket: socket)
        } catch {
            sendResponse(JSONRPCResponse(
                id: request.id,
                error: JSONRPCError(code: -32603, message: error.localizedDescription)
            ), socket: socket)
        }
    }

    private func handlePrewarmWithPrefix(_ request: JSONRPCRequest, socket: Int32) async {
        do {
            let params = request.params?.value as? [String: Any] ?? [:]
            let response = try await wrapper.prewarmWithPrefix(parameters: params.mapValues { AnyCodable($0) })

            sendResponse(JSONRPCResponse(
                id: request.id,
                result: response.data ?? AnyCodable([:])
            ), socket: socket)
        } catch {
            sendResponse(JSONRPCResponse(
                id: request.id,
                error: JSONRPCError(code: -32603, message: error.localizedDescription)
            ), socket: socket)
        }
    }

    // Request tool execution from TypeScript
    func requestToolExecution(name: String, arguments: [String: Any], socket: Int32) async throws -> String {
        let id = UUID().uuidString

        let request = JSONRPCRequest(
            jsonrpc: "2.0",
            id: id,
            method: "executeTool",
            params: AnyCodable([
                "name": name,
                "arguments": arguments
            ] as [String : Any])
        )

        sendMessage(request, socket: socket)

        // Wait for response (simplified - would need proper async handling)
        // This is a placeholder - full implementation needs continuation-based waiting
        return "Tool result placeholder"
    }

    private func sendMessage<T: Encodable>(_ message: T, socket: Int32) {
        do {
            let encoder = JSONEncoder()
            var data = try encoder.encode(message)
            data.append(contentsOf: "\n".utf8)

            let bytes = [UInt8](data)
            let written = write(socket, bytes, bytes.count)

            if written < 0 {
                fputs("[Server] Write error: \(String(cString: strerror(errno)))\n", stderr)
            }
        } catch {
            fputs("[Server] Encoding error: \(error)\n", stderr)
        }
    }

    private func sendResponse(_ response: JSONRPCResponse, socket: Int32) {
        sendMessage(response, socket: socket)
    }

    func stop() {
        isRunning = false

        if clientSocket != -1 {
            close(clientSocket)
            clientSocket = -1
        }

        if serverSocket != -1 {
            close(serverSocket)
            serverSocket = -1
        }

        // Clean up socket file
        unlink(socketPath)
    }
}
#endif

// MARK: - Main Entry Point
@main
struct AppleFoundationModelsWrapperMain {
    static func main() async {
        #if canImport(FoundationModels)
        if #available(macOS 26.0, *) {
            // Check for persistent server mode
            let args = CommandLine.arguments
            if args.contains("--persistent-server") {
                // Find socket path argument
                if let socketIndex = args.firstIndex(of: "--socket"),
                   args.count > socketIndex + 1 {
                    let socketPath = args[socketIndex + 1]
                    await runPersistentServer(socketPath: socketPath)
                } else {
                    printError("--persistent-server requires --socket <path>")
                    exit(1)
                }
                return
            }

            // Default: process-per-call mode
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

    #if canImport(FoundationModels)
    @available(macOS 26.0, *)
    static func runPersistentServer(socketPath: String) async {
        do {
            let server = PersistentServer(socketPath: socketPath)
            try await server.start()

            // Keep server running
            printError("[Server] Running in persistent mode")
            try await Task.sleep(for: .seconds(3600 * 24))  // Run for 24 hours max
        } catch {
            printError("[Server] Failed to start: \(error)")
            exit(1)
        }
    }
    #endif

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

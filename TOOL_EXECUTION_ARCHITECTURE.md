# Tool Execution Architecture: Solutions and Implementation Plan

## Problem Statement

**Current Limitation**: Automatic tool execution during `respond()` and `streamResponse()` calls is not implemented.

**Why?** The current architecture uses a **process-per-call model**:
1. TypeScript spawns a new Swift process for each API operation
2. Process reads one command from stdin, executes it, outputs result, and exits
3. No mechanism for bidirectional communication during execution
4. Tools need to be called **during** a `respond()` operation, requiring the Swift process to call back to TypeScript

**What's Needed**: When the model decides to use a tool during `respond()`:
1. Swift needs to pause generation
2. Send tool call request to TypeScript
3. TypeScript executes the tool
4. Send result back to Swift
5. Swift continues generation with the tool result

This requires **bidirectional, real-time communication** during a single session.

---

## Solution Approaches

### Solution 1: Long-Lived Server Process ⭐ RECOMMENDED

**Architecture**: Replace process-per-call with a persistent Swift server process using bidirectional communication.

#### Option 1A: HTTP Server + WebSocket

```
┌─────────────────┐          HTTP/WS           ┌──────────────────┐
│   TypeScript    │◄─────────────────────────►│   Swift Server   │
│   Application   │                             │   (HTTP+WS)      │
└─────────────────┘                             └──────────────────┘
         │                                               │
         │ 1. POST /session/create                      │
         │    {tools: [...]}                             │
         │───────────────────────────────────────────────►
         │                                               │
         │ 2. {sessionId: "abc123"}                     │
         │◄───────────────────────────────────────────────
         │                                               │
         │ 3. WS connect /session/abc123               │
         │◄══════════════════════════════════════════════►
         │                                               │
         │ 4. POST /session/abc123/respond              │
         │    {prompt: "..."}                            │
         │───────────────────────────────────────────────►
         │                                               │
         │                            [Model needs tool] │
         │ 5. WS: {type:"toolCall",                     │
         │        name:"weather",                        │
         │        args:{city:"SF"}}                      │
         │◄───────────────────────────────────────────────
         │                                               │
         │ [Execute tool in TypeScript]                 │
         │                                               │
         │ 6. WS: {type:"toolResult",                   │
         │        id:"call1",                            │
         │        result:"Sunny,72F"}                    │
         │───────────────────────────────────────────────►
         │                                               │
         │                      [Model continues with result]
         │                                               │
         │ 7. {content:"The weather...",                │
         │     done:true}                                │
         │◄───────────────────────────────────────────────
```

**Implementation**:

**Swift Side** (using Vapor or Hummingbird):
```swift
import Vapor
import FoundationModels

struct ToolCallRequest: Codable {
    let id: String
    let name: String
    let arguments: [String: AnyCodable]
}

struct ToolCallResponse: Codable {
    let id: String
    let result: String
}

actor SessionManager {
    private var sessions: [String: SessionContext] = [:]

    struct SessionContext {
        let model: SystemLanguageModel
        let session: LanguageModelSession
        let tools: [ToolDefinition]
        let wsConnection: WebSocket
    }

    func createSession(
        tools: [ToolDefinition],
        ws: WebSocket
    ) -> String {
        let id = UUID().uuidString

        // Create Swift tool wrappers that communicate over WebSocket
        let swiftTools = tools.map { toolDef in
            TypeScriptToolBridge(
                name: toolDef.name,
                description: toolDef.description,
                wsConnection: ws
            )
        }

        let session = LanguageModelSession(
            tools: swiftTools
        )

        sessions[id] = SessionContext(
            model: .default,
            session: session,
            tools: tools,
            wsConnection: ws
        )

        return id
    }
}

// Bridge tool that communicates with TypeScript
final class TypeScriptToolBridge: Tool {
    let name: String
    let description: String
    private let wsConnection: WebSocket

    struct Arguments: Generable {
        // Dynamic arguments handled via AnyCodable
        let args: [String: AnyCodable]
    }

    func call(arguments: Arguments) async throws -> ToolOutput {
        let callId = UUID().uuidString

        // Send tool call request to TypeScript over WebSocket
        let request = ToolCallRequest(
            id: callId,
            name: name,
            arguments: arguments.args
        )
        try await wsConnection.send(JSONEncoder().encode(request))

        // Wait for response from TypeScript
        // This would use a continuation-based approach
        let response = try await waitForToolResponse(callId: callId)

        return ToolOutput(response.result)
    }
}

func routes(_ app: Application) throws {
    // Create session
    app.post("session", "create") { req -> String in
        let tools = try req.content.decode([ToolDefinition].self)
        // Return session ID
    }

    // WebSocket for bidirectional communication
    app.webSocket("session", ":id") { req, ws in
        let sessionId = req.parameters.get("id")!
        // Handle WebSocket connection
    }

    // Respond endpoint
    app.post("session", ":id", "respond") { req -> Response in
        let sessionId = req.parameters.get("id")!
        let prompt = try req.content.decode(String.self)

        let session = sessionManager.getSession(sessionId)
        let response = try await session.respond(to: prompt)

        return Response(response)
    }
}
```

**TypeScript Side**:
```typescript
import WebSocket from 'ws';
import fetch from 'node-fetch';

class ToolEnabledSession {
  private sessionId: string;
  private ws: WebSocket;
  private tools: Map<string, Tool>;
  private pendingToolCalls: Map<string, (result: any) => void> = new Map();

  async initialize(tools: Tool[]) {
    this.tools = new Map(tools.map(t => [t.name, t]));

    // Create session on Swift server
    const response = await fetch('http://localhost:8080/session/create', {
      method: 'POST',
      body: JSON.stringify({
        tools: tools.map(t => ({
          name: t.name,
          description: t.description
        }))
      })
    });

    this.sessionId = await response.text();

    // Connect WebSocket for tool calls
    this.ws = new WebSocket(`ws://localhost:8080/session/${this.sessionId}`);

    this.ws.on('message', async (data) => {
      const message = JSON.parse(data.toString());

      if (message.type === 'toolCall') {
        // Swift is requesting tool execution
        const tool = this.tools.get(message.name);
        if (tool) {
          try {
            const result = await tool.call(message.arguments);

            // Send result back to Swift
            this.ws.send(JSON.stringify({
              type: 'toolResult',
              id: message.id,
              result: result.value
            }));
          } catch (error) {
            this.ws.send(JSON.stringify({
              type: 'toolError',
              id: message.id,
              error: error.message
            }));
          }
        }
      }
    });

    // Wait for WebSocket to be ready
    await new Promise(resolve => this.ws.once('open', resolve));
  }

  async respond(prompt: string): Promise<Response<string>> {
    const response = await fetch(
      `http://localhost:8080/session/${this.sessionId}/respond`,
      {
        method: 'POST',
        body: JSON.stringify({ prompt })
      }
    );

    return await response.json();
  }
}
```

**Pros**:
- ✅ Clean separation of concerns
- ✅ Standard HTTP/WebSocket protocols
- ✅ Easy to debug with network tools
- ✅ Supports multiple concurrent sessions
- ✅ Can scale to remote deployments
- ✅ WebSocket provides true bidirectional communication

**Cons**:
- ❌ Requires HTTP server framework (Vapor/Hummingbird)
- ❌ More complex deployment
- ❌ Requires managing server lifecycle
- ❌ Additional dependency

**Effort**: Medium-High (2-3 days)

---

#### Option 1B: Unix Domain Socket + JSON-RPC

```
┌─────────────────┐     Unix Socket      ┌──────────────────┐
│   TypeScript    │◄────────────────────►│   Swift Server   │
│   Application   │    /tmp/afm.sock     │   (JSON-RPC)     │
└─────────────────┘                       └──────────────────┘
```

**Architecture**: Swift server listens on Unix domain socket, uses JSON-RPC for bidirectional calls.

**Swift Side**:
```swift
import Foundation
import Network
import FoundationModels

actor ToolExecutionServer {
    private let listener: NWListener
    private var connections: [UUID: NWConnection] = [:]

    init() throws {
        // Create Unix domain socket listener
        let endpoint = NWEndpoint.unix(path: "/tmp/apple-foundation-models.sock")
        listener = try NWListener(using: .tcp, on: .unassigned)
    }

    func handleToolCall(
        connection: NWConnection,
        toolName: String,
        arguments: [String: Any]
    ) async throws -> String {
        // Send JSON-RPC request to TypeScript
        let request = [
            "jsonrpc": "2.0",
            "method": "executeTool",
            "params": [
                "name": toolName,
                "arguments": arguments
            ],
            "id": UUID().uuidString
        ]

        let data = try JSONSerialization.data(withJSONObject: request)
        connection.send(content: data, completion: .contentProcessed { _ in })

        // Wait for response
        return try await waitForResponse(connection: connection, requestId: request["id"] as! String)
    }
}
```

**TypeScript Side**:
```typescript
import net from 'net';

class UnixSocketToolSession {
  private socket: net.Socket;
  private tools: Map<string, Tool>;

  async connect(tools: Tool[]) {
    this.tools = new Map(tools.map(t => [t.name, t]));

    this.socket = net.createConnection('/tmp/apple-foundation-models.sock');

    this.socket.on('data', async (data) => {
      const message = JSON.parse(data.toString());

      if (message.method === 'executeTool') {
        const tool = this.tools.get(message.params.name);
        if (tool) {
          const result = await tool.call(message.params.arguments);

          // Send JSON-RPC response
          this.socket.write(JSON.stringify({
            jsonrpc: '2.0',
            result: result.value,
            id: message.id
          }));
        }
      }
    });
  }
}
```

**Pros**:
- ✅ No external dependencies
- ✅ Faster than HTTP (local socket)
- ✅ Native to Unix systems
- ✅ Simple protocol (JSON-RPC)

**Cons**:
- ❌ Unix-only (won't work on Windows without named pipes)
- ❌ More complex error handling
- ❌ Manual connection management

**Effort**: Medium (1-2 days)

---

### Solution 2: Persistent Stdin/Stdout Communication

**Architecture**: Keep Swift process alive, use stdin/stdout with a request/response protocol.

```
┌─────────────────┐          Stdin/Stdout          ┌──────────────────┐
│   TypeScript    │◄──────────────────────────────►│  Swift Process   │
│   Application   │   Line-delimited JSON          │  (Long-lived)    │
└─────────────────┘                                 └──────────────────┘
         │                                                   │
         │ {"cmd":"createSession","tools":[...]}            │
         │──────────────────────────────────────────────────►
         │                                                   │
         │ {"type":"sessionCreated","id":"abc"}            │
         │◄──────────────────────────────────────────────────
         │                                                   │
         │ {"cmd":"respond","session":"abc","prompt":"..."} │
         │──────────────────────────────────────────────────►
         │                                                   │
         │                               [Model needs tool] │
         │ {"type":"toolCall","id":"1","name":"weather",...}│
         │◄──────────────────────────────────────────────────
         │                                                   │
         │ [Execute tool]                                   │
         │                                                   │
         │ {"type":"toolResult","id":"1","result":"..."}    │
         │──────────────────────────────────────────────────►
         │                                                   │
         │ {"type":"response","content":"...","done":true}  │
         │◄──────────────────────────────────────────────────
```

**Swift Side**:
```swift
struct Message: Codable {
    enum MessageType: String, Codable {
        case createSession
        case respond
        case toolResult
        case sessionCreated
        case toolCall
        case response
    }

    let type: MessageType
    let id: String?
    let data: AnyCodable?
}

@main
struct PersistentServer {
    static func main() async {
        // Keep reading from stdin
        while let line = readLine() {
            guard let data = line.data(using: .utf8),
                  let message = try? JSONDecoder().decode(Message.self, from: data) else {
                continue
            }

            await handleMessage(message)
        }
    }

    static func handleMessage(_ message: Message) async {
        switch message.type {
        case .createSession:
            // Create session with tools
            break
        case .respond:
            // Call session.respond() which may trigger tool calls
            break
        case .toolResult:
            // Resume waiting continuation with tool result
            break
        default:
            break
        }
    }
}

// Tool bridge using continuations
final class StdioToolBridge: Tool {
    let name: String
    let description: String

    struct Arguments: Generable {
        let args: [String: AnyCodable]
    }

    func call(arguments: Arguments) async throws -> ToolOutput {
        let callId = UUID().uuidString

        // Send tool call to stdout
        let message = Message(
            type: .toolCall,
            id: callId,
            data: AnyCodable([
                "name": name,
                "arguments": arguments.args
            ])
        )
        printMessage(message)

        // Await response using continuation
        return try await withCheckedThrowingContinuation { continuation in
            // Register continuation to be resumed when toolResult arrives
            pendingToolCalls[callId] = continuation
        }
    }
}
```

**TypeScript Side**:
```typescript
import { spawn } from 'child_process';
import readline from 'readline';

class PersistentSwiftSession {
  private process: ChildProcess;
  private rl: readline.Interface;
  private tools: Map<string, Tool>;
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  constructor(tools: Tool[]) {
    this.tools = new Map(tools.map(t => [t.name, t]));

    // Spawn Swift process in persistent mode
    this.process = spawn('./swift/.build/release/AppleFoundationModelsWrapper', ['--persistent']);

    // Line-by-line reader
    this.rl = readline.createInterface({
      input: this.process.stdout,
      crlfDelay: Infinity
    });

    this.rl.on('line', async (line) => {
      const message = JSON.parse(line);

      if (message.type === 'toolCall') {
        // Execute tool and send result back
        const tool = this.tools.get(message.data.name);
        if (tool) {
          try {
            const result = await tool.call(message.data.arguments);
            this.sendMessage({
              type: 'toolResult',
              id: message.id,
              data: { result: result.value }
            });
          } catch (error) {
            this.sendMessage({
              type: 'toolError',
              id: message.id,
              data: { error: error.message }
            });
          }
        }
      } else if (message.type === 'response') {
        // Handle response
        const handler = this.messageHandlers.get(message.id);
        if (handler) {
          handler(message.data);
          this.messageHandlers.delete(message.id);
        }
      }
    });
  }

  private sendMessage(message: any) {
    this.process.stdin.write(JSON.stringify(message) + '\n');
  }

  async respond(prompt: string): Promise<string> {
    const messageId = crypto.randomUUID();

    return new Promise((resolve) => {
      this.messageHandlers.set(messageId, (data) => {
        resolve(data.content);
      });

      this.sendMessage({
        type: 'respond',
        id: messageId,
        data: { prompt }
      });
    });
  }
}
```

**Pros**:
- ✅ Minimal dependencies
- ✅ Uses existing stdin/stdout infrastructure
- ✅ Simple protocol
- ✅ Cross-platform compatible

**Cons**:
- ❌ More complex state management
- ❌ No built-in message queuing
- ❌ Line buffering issues with large messages
- ❌ Process lifecycle management complexity

**Effort**: Medium (2-3 days)

---

### Solution 3: Session State Files + Polling (Simplest)

**Architecture**: Write tool call requests to files, poll for results, no long-lived process.

```
┌─────────────────┐                         ┌──────────────────┐
│   TypeScript    │                         │  Swift Process   │
│   Application   │                         │  (Per-call)      │
└─────────────────┘                         └──────────────────┘
         │                                           │
         │ 1. Write: /tmp/afm-session-abc/request   │
         │    {tools: [...], prompt: "..."}          │
         │                                           │
         │ 2. Spawn Swift process                   │
         │───────────────────────────────────────────►
         │                                           │
         │                         [Model needs tool]│
         │                                           │
         │           3. Write: /tmp/afm-session-abc/│
         │              tool-call-1.json             │
         │              {name:"weather",args:{...}}  │
         │◄───────────────────────────────────────────
         │                                           │
         │                         [Process waits]   │
         │                                           │
         │ 4. [TypeScript polls, finds file]        │
         │ 5. [Execute tool]                         │
         │ 6. Write: /tmp/afm-session-abc/          │
         │    tool-result-1.json                     │
         │    {result: "..."}                        │
         │───────────────────────────────────────────►
         │                                           │
         │                      [Process continues]  │
         │                                           │
         │           7. Write: /tmp/afm-session-abc/ │
         │              response.json                │
         │◄───────────────────────────────────────────
```

**Pros**:
- ✅ Simplest to implement
- ✅ No complex IPC
- ✅ Easy to debug (inspect files)
- ✅ Works with existing process-per-call model

**Cons**:
- ❌ Polling overhead and latency
- ❌ File system I/O overhead
- ❌ Cleanup complexity
- ❌ Race conditions with file watching
- ❌ Not suitable for production

**Effort**: Low (1 day)

---

## Recommendation

⚠️ **IMPORTANT: See [UNIX_SOCKET_MODAL_DESIGN.md](UNIX_SOCKET_MODAL_DESIGN.md) for detailed performance analysis and modal architecture design.**

### Updated Recommendation (After Performance Analysis)

**Option 1B: Unix Socket + JSON-RPC with Modal Design** is now the recommended solution because:

1. **Zero Additional Limitations**: Unix-only is not a constraint since this is already a macOS-only library
2. **Zero Performance Impact**: Modal executor design automatically selects:
   - Process-per-call (fast path) for operations without tools (current performance)
   - Persistent server only when tools are present (enables new functionality)
3. **No External Dependencies**: Uses pure Swift NWListener + Node.js net module
4. **Simpler Than HTTP**: No need for Vapor or web server framework
5. **Optimal for Mac**: Unix domain sockets are faster than HTTP on local machine
6. **Automatic Mode Selection**: Users get best performance automatically with zero configuration

**Performance Summary with Modal Design**:
- Simple operations (no tools): **1.0s** (unchanged, 0% impact)
- Multiple operations (no tools): **5.0s for 5 calls** (unchanged, 0% impact)
- Tool-enabled operations: **1.2s + callbacks** (new capability enabled)
- Optional persistent mode: **2.6s for 5 calls** (48% faster than current, opt-in)

### Original Recommendation (HTTP Server)

**Option 1A: HTTP Server + WebSocket** is still a good solution if you need remote deployment or multi-client support:

1. **Industry Standard**: HTTP/WebSocket are battle-tested protocols
2. **Debugging**: Easy to inspect with browser dev tools, Postman, etc.
3. **Scalability**: Can support remote deployments in the future
4. **Clean Architecture**: Clear separation between server and client
5. **Multiple Sessions**: Natural support for concurrent sessions
6. **Streaming**: WebSocket handles bidirectional streaming elegantly

## Implementation Plan

### Phase 1: Foundation (Week 1)
1. Add Vapor dependency to Swift package
2. Create basic HTTP server structure
3. Implement session management actor
4. Add WebSocket endpoint

### Phase 2: Tool Bridge (Week 1-2)
1. Create `TypeScriptToolBridge` class
2. Implement tool call serialization
3. Add continuation-based async waiting
4. Test with simple mock tools

### Phase 3: TypeScript Integration (Week 2)
1. Create `ToolEnabledSession` class
2. Implement WebSocket client
3. Add tool execution logic
4. Update `LanguageModelSession` to use new backend

### Phase 4: Migration & Testing (Week 2-3)
1. Add feature flag for tool-enabled sessions
2. Maintain backward compatibility with process-per-call
3. Comprehensive integration tests
4. Update documentation

### Phase 5: Optimization (Week 3)
1. Connection pooling
2. Error recovery
3. Graceful shutdown
4. Performance tuning

## Alternative: Hybrid Approach

For **immediate partial functionality**, implement a simpler workaround:

### Pseudo-Tools Pattern

```typescript
// User provides tool definitions but execution is manual
const session = new LanguageModelSession(
  SystemLanguageModel.default,
  undefined,
  [weatherTool, calculatorTool],
  new Instructions(`
    You have access to these tools:
    - getWeather(city: string): Get weather for a city
    - calculate(a: number, b: number, op: string): Perform calculation

    When you need to use a tool, respond with JSON:
    {"action": "toolCall", "tool": "getWeather", "args": {"city": "SF"}}

    The user will execute it and provide the result.
  `)
);

// User manually parses and executes
const response = await session.respond("What's the weather in SF?");
if (response.content.includes('"action": "toolCall"')) {
  const toolCall = JSON.parse(response.content);
  const tool = tools.find(t => t.name === toolCall.tool);
  const result = await tool.call(toolCall.args);

  // Continue with result
  const final = await session.respond(`Tool result: ${result.value}`);
}
```

**Pros**: Works today, no architecture changes
**Cons**: Requires prompt engineering, brittle, not true 1-to-1 API

---

## Conclusion

**Recommended**: Implement **Option 1A (HTTP Server + WebSocket)** for proper automatic tool execution.

**Timeline**: 2-3 weeks for full implementation
**Effort**: Medium-High
**Benefit**: True 1-to-1 API compatibility with Apple's FoundationModels

The investment is worth it for a production-ready tool execution system that matches Apple's API behavior exactly.

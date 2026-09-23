# Architecture

Technical architecture and implementation details for Apple Foundation Models for JavaScript.

## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Component Layers](#component-layers)
- [Communication Protocol](#communication-protocol)
- [Build System](#build-system)
- [Type System](#type-system)
- [Error Handling](#error-handling)
- [Performance Considerations](#performance-considerations)

---

## Overview

This package provides a TypeScript/JavaScript wrapper for Apple's native FoundationModels framework using a three-layer architecture:

1. **TypeScript API Layer** - User-facing API with types and abstractions
2. **Swift Wrapper Layer** - Executable that interfaces with Apple's framework
3. **Native Framework Layer** - Apple's FoundationModels SDK

```
┌──────────────────────────────────────────────────────────┐
│                    User Application                       │
│                  (JavaScript/TypeScript)                  │
└────────────────────────┬─────────────────────────────────┘
                         │
                         │ import & call methods
                         ▼
┌──────────────────────────────────────────────────────────┐
│               TypeScript API Layer                        │
│  ┌────────────────────────────────────────────────────┐ │
│  │  foundation-models.ts                              │ │
│  │  • SystemLanguageModel (instance-based)            │ │
│  │  • LanguageModelSession (conversation management)  │ │
│  │  • Type definitions and interfaces                 │ │
│  └────────────────────┬───────────────────────────────┘ │
│                       │                                   │
│  ┌────────────────────▼───────────────────────────────┐ │
│  │  executor.ts                                       │ │
│  │  • Spawns Swift subprocess                         │ │
│  │  • Manages stdin/stdout communication              │ │
│  │  • Serializes/deserializes JSON                    │ │
│  └────────────────────┬───────────────────────────────┘ │
└───────────────────────┼──────────────────────────────────┘
                        │
                        │ JSON over stdio
                        │ { command, params } → stdout
                        │ { result/error } ← stdin
                        ▼
┌──────────────────────────────────────────────────────────┐
│               Swift Wrapper Layer                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │  main.swift (AppleFoundationModelsWrapper)         │ │
│  │  • Reads JSON commands from stdin                  │ │
│  │  • Parses command and parameters                   │ │
│  │  • Calls native FoundationModels API               │ │
│  │  • Serializes response to JSON                     │ │
│  │  • Writes response to stdout                       │ │
│  └────────────────────┬───────────────────────────────┘ │
└───────────────────────┼──────────────────────────────────┘
                        │
                        │ Native Swift API calls
                        ▼
┌──────────────────────────────────────────────────────────┐
│            Apple FoundationModels Framework               │
│  • SystemLanguageModel                                    │
│  • LanguageModelSession                                   │
│  • On-device AI model execution                           │
│  • Privacy-preserving inference                           │
└──────────────────────────────────────────────────────────┘
```

---

## System Architecture

### Design Principles

1. **1-to-1 API Mapping**: TypeScript API mirrors Swift API as closely as possible
2. **Type Safety**: Full TypeScript support with comprehensive type definitions
3. **Process Isolation**: Each API call spawns a new Swift process (stateless)
4. **JSON Communication**: Simple, language-agnostic protocol over stdio
5. **Error Transparency**: Swift errors propagate to JavaScript with context

### Why Process-Per-Call?

Current implementation spawns a new Swift process for each API call:

**Advantages**:
- Simple, stateless design
- No process management complexity
- Clean error isolation
- Easy debugging

**Disadvantages**:
- Higher latency per call (~100-200ms overhead)
- Can't maintain session state in Swift layer
- Higher memory usage for repeated calls

**Future Optimization**: Implement persistent Swift process with command queue for better performance.

---

## Component Layers

### 1. TypeScript API Layer

**Location**: `src/`

**Files**:
- `index.ts` - Public API exports
- `foundation-models.ts` - Core classes and implementations
- `types.ts` - TypeScript type definitions
- `executor.ts` - Swift process execution

**Responsibilities**:
- Provide idiomatic JavaScript/TypeScript API
- Handle parameter validation
- Manage async/await patterns
- Convert between JS and Swift conventions
- Type checking and IntelliSense support

**Key Classes**:

```typescript
class SystemLanguageModel {
  static get default(): SystemLanguageModel

  get id(): string
  availability(): Promise<Availability>
  isAvailable(): Promise<boolean>

  constructor(useCase: UseCase)
}

class LanguageModelSession {
  constructor(
    model?: SystemLanguageModel,
    guardrails?: Guardrails,
    tools?: Tool[],
    instructions?: string | Instructions
  )

  get isResponding(): boolean
  get transcript(): readonly TranscriptEntry[]

  respond(prompt: string, options?: GenerationOptions): Promise<Response<string>>
  streamResponse(prompt: string): AsyncIterableIterator<string>
  prewarm(): Promise<void>
  prewarmWithPrefix(prefix: string): Promise<void>
}
```

### 2. Swift Wrapper Layer

**Location**: `swift/Sources/AppleFoundationModelsWrapper/`

**Files**:
- `main.swift` - Command processor and main entry point

**Responsibilities**:
- Parse JSON commands from stdin
- Call native FoundationModels APIs
- Serialize responses to JSON
- Handle Swift-specific errors
- Manage async execution

**Command Structure**:

```json
{
  "command": "commandName",
  "params": {
    "param1": "value1",
    "param2": "value2"
  }
}
```

**Response Structure**:

```json
{
  "result": { "data": "..." }
}
```

**Error Structure**:

```json
{
  "error": "Error message description"
}
```

**Supported Commands**:
- `getDefaultModel` - Get SystemLanguageModel.default
- `checkAvailability` - Check model availability
- `createSession` - Create new LanguageModelSession
- `respond` - Generate response to prompt
- `streamResponse` - Stream response (planned)
- `prewarm` - Prewarm session
- `prewarmWithPrefix` - Prewarm with prompt prefix

### 3. Native Framework Layer

**Apple's FoundationModels SDK**

- Runs on-device with privacy guarantees
- ~3B parameter model for local inference
- Adapter system for task specialization
- Built-in safety guardrails
- Multi-language support

---

## Communication Protocol

### Request Flow

```
JavaScript                Executor              Swift Wrapper          FoundationModels
    │                        │                         │                       │
    │  API call              │                         │                       │
    ├───────────────────────>│                         │                       │
    │                        │                         │                       │
    │                        │  Spawn process          │                       │
    │                        ├────────────────────────>│                       │
    │                        │                         │                       │
    │                        │  Write JSON to stdin    │                       │
    │                        ├────────────────────────>│                       │
    │                        │                         │                       │
    │                        │                         │  Native API call      │
    │                        │                         ├──────────────────────>│
    │                        │                         │                       │
    │                        │                         │  Result               │
    │                        │                         │<──────────────────────┤
    │                        │                         │                       │
    │                        │  Read JSON from stdout  │                       │
    │                        │<────────────────────────┤                       │
    │                        │                         │                       │
    │  Promise resolves      │                         │                       │
    │<───────────────────────┤                         │                       │
    │                        │                         │                       │
```

### Example: Generate Text

**1. JavaScript Call**:
```typescript
const session = new LanguageModelSession();
const response = await session.respond('Hello!');
```

**2. Executor Sends**:
```json
{
  "command": "respond",
  "params": {
    "sessionId": "session-123",
    "prompt": "Hello!"
  }
}
```

**3. Swift Processes**:
```swift
let session = LanguageModelSession()
let response = try await session.respond(to: params.prompt)
return ["content": response.content]
```

**4. Swift Returns**:
```json
{
  "result": {
    "content": "Hello! How can I help you today?",
    "transcriptEntries": [...]
  }
}
```

**5. Executor Parses and Returns**:
```typescript
{
  content: "Hello! How can I help you today?",
  transcriptEntries: [...]
}
```

---

## Build System

### NPM Lifecycle

```
npm install
    │
    ├─> preinstall: check-platform.js (disabled in dev)
    │   └─> Verify macOS 26.0+
    │
    ├─> install: npm install dependencies
    │
    └─> postinstall: build-swift.js
        └─> swift build -c release
            └─> Creates .build/release/AppleFoundationModelsWrapper
```

### Build Scripts

**1. Platform Check** (`scripts/check-platform.js`)
```javascript
// Verifies:
// - Running on Darwin (macOS)
// - macOS version >= 15.0
// - Exits with helpful error if incompatible
```

**2. Swift Build** (`scripts/build-swift.js`)
```javascript
// Steps:
// 1. Check for Swift compiler
// 2. Run: swift build -c release
// 3. Verify executable exists
// 4. Report build status
```

**3. TypeScript Build** (`rolldown.config.js`)
```javascript
// Produces:
// - dist/index.mjs (ESM)
// - dist/index.cjs (CommonJS)
// - dist/index.d.ts (TypeScript declarations)
// - Source maps for debugging
```

### File Structure

```
apple-foundation-models/
├── src/                          # TypeScript source
│   ├── index.ts                  # Public exports
│   ├── foundation-models.ts      # Core implementation
│   ├── types.ts                  # Type definitions
│   └── executor.ts               # Process execution
│
├── swift/                        # Swift wrapper
│   ├── Package.swift             # Swift package manifest
│   └── Sources/
│       └── AppleFoundationModelsWrapper/
│           └── main.swift        # Swift executable
│
├── scripts/                      # Build automation
│   ├── check-platform.js         # Platform verification
│   └── build-swift.js            # Swift build script
│
├── dist/                         # Build output (generated)
│   ├── index.mjs                 # ESM bundle
│   ├── index.cjs                 # CommonJS bundle
│   ├── index.d.ts                # TypeScript declarations
│   └── *.map                     # Source maps
│
└── .build/                       # Swift build output (generated)
    └── release/
        └── AppleFoundationModelsWrapper  # Swift executable
```

---

## Type System

### TypeScript to Swift Mapping

| TypeScript | Swift | Notes |
|------------|-------|-------|
| `string` | `String` | Direct mapping |
| `number` | `Int` or `Double` | Context-dependent |
| `boolean` | `Bool` | Direct mapping |
| `Array<T>` | `[T]` | Generic arrays |
| `Promise<T>` | `async -> T` | Async/await |
| `AsyncIterableIterator<T>` | `AsyncSequence` | Streaming |
| `undefined` | `nil` (optional) | Optional types |
| Enum | Enum | String-based enums |
| Interface | Struct/Protocol | Structural types |

### Key Type Definitions

**Availability**:
```typescript
interface Availability {
  available: boolean;
  reason?: 'deviceNotEligible' | 'appleIntelligenceNotEnabled' | 'modelNotReady';
}
```

**GenerationOptions**:
```typescript
class GenerationOptions {
  constructor(
    public sampling?: 'greedy' | 'random',
    public temperature?: number,
    public maximumResponseTokens?: number
  )
}
```

**Response**:
```typescript
interface Response<T> {
  content: T;
  transcriptEntries: TranscriptEntry[];
}
```

**TranscriptEntry**:
```typescript
type TranscriptEntry =
  | { type: 'prompt', text: string }
  | { type: 'response', text: string }
  | { type: 'instructions', instructions: Instructions }
  | { type: 'toolCalls', calls: ToolCall[] }
  | { type: 'toolOutput', output: ToolOutput };
```

---

## Error Handling

### Error Flow

```
Native Error (Swift) → Swift Wrapper → JSON Error → Executor → JavaScript Error
```

### Error Types

**1. Platform Errors**:
```typescript
// Thrown before Swift execution
throw new Error('This package requires macOS 26.0 or later');
```

**2. Swift Build Errors**:
```typescript
// Thrown if Swift wrapper not built
throw new Error('Swift wrapper not found. Run: npm run build:swift');
```

**3. Model Availability Errors**:
```typescript
const availability = await model.availability();
if (!availability.available) {
  throw new Error(`Model unavailable: ${availability.reason}`);
}
```

**4. Generation Errors**:
```typescript
try {
  const response = await session.respond('Hello');
} catch (error) {
  console.error('Generation failed:', error.message);
}
```

### Error Context

Errors include:
- Original Swift error message
- Command that failed
- Parameters used (sanitized)
- Stack trace (JavaScript side)

---

## Performance Considerations

### Current Performance

**Latency Breakdown** (typical):
- Process spawn: ~50-100ms
- Model initialization: ~200-500ms (first call)
- Generation: Varies by prompt (30 tokens/sec)
- JSON serialization: ~1-5ms
- **Total overhead**: ~250-600ms per call

### Optimization Opportunities

**1. Persistent Process** (planned):
```
Current:  [Spawn → Init → Generate → Exit] × N calls
Planned:  [Spawn → Init] → [Generate] × N calls → [Exit]
```

Estimated improvement: 10-50x faster for subsequent calls

**2. Connection Pooling**:
- Maintain pool of warm Swift processes
- Round-robin request distribution
- Reduce cold-start latency

**3. Session Caching**:
- Keep LanguageModelSession instances alive
- Share across multiple generations
- Preserve conversation context in Swift

**4. Streaming Optimization**:
- Implement true streaming from Swift layer
- Reduce time-to-first-token
- Better perceived performance

### Memory Usage

**Per Call**:
- Swift process: ~50-100MB
- Model loaded: ~3-4GB (shared across processes)
- Transcript storage: ~1-10MB (grows with conversation)

**Recommendations**:
- Reuse session instances when possible
- Clear transcript periodically for long conversations
- Consider memory limits for concurrent requests

---

## Security Considerations

### On-Device Processing

All inference happens locally:
- No data sent to external servers (unless explicitly configured)
- Privacy-first by design
- Complies with Apple's privacy guidelines

### Guardrails

Built-in safety features:
- Prompt filtering for harmful content
- Response filtering for inappropriate outputs
- Content safety checks (cannot be disabled)

### Process Isolation

Each Swift process is isolated:
- Cannot access user files outside sandbox
- Limited system permissions
- Crashes don't affect parent process

---

## Future Enhancements

### Planned Improvements

1. **Persistent Swift Process**
   - Long-running daemon
   - IPC via Unix sockets or named pipes
   - Session state preservation

2. **Structured Output**
   - Support for `@Generable` types
   - Schema-driven generation
   - Type-safe structured responses

3. **Tool Support**
   - Implement `Tool` protocol
   - Function calling from JavaScript
   - Dynamic tool registration

4. **Advanced Streaming**
   - True token-by-token streaming
   - Backpressure handling
   - Cancellation support

5. **Performance Monitoring**
   - Built-in metrics collection
   - Latency tracking
   - Token usage reporting

### Research Areas

- WebAssembly compilation for Swift wrapper
- FFI (Foreign Function Interface) via N-API
- Direct Swift Package Manager integration

---

## Development

### Building from Source

```bash
# Clone repository
git clone https://github.com/johnhenry/apple-foundation-models.git
cd apple-foundation-models

# Install dependencies
npm install

# Build TypeScript
npm run build:js

# Build Swift wrapper
npm run build:swift

# Run tests
npm test
```

### Debugging

**Enable verbose logging**:
```typescript
// Set environment variable
process.env.DEBUG = 'apple-foundation-models';
```

**Inspect Swift wrapper**:
```bash
# Run Swift wrapper directly
./.build/release/AppleFoundationModelsWrapper

# Input JSON command
{"command":"getDefaultModel","params":{}}
```

**Test Swift build**:
```bash
cd swift
swift build
swift test  # (if tests are added)
```

---

## References

- [Apple FoundationModels Documentation](https://developer.apple.com/documentation/FoundationModels)
- [Swift Package Manager](https://swift.org/package-manager/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Node.js Child Process](https://nodejs.org/api/child_process.html)

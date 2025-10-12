# API Reference

Complete API documentation with side-by-side Swift and JavaScript/TypeScript examples showing 1-to-1 translation.

## Table of Contents

- [SystemLanguageModel](#systemlanguagemodel)
- [LanguageModelSession](#languagemodelsession)
- [GenerationOptions](#generationoptions)
- [Response](#response)
- [Instructions](#instructions)
- [Supporting Types](#supporting-types)

---

## SystemLanguageModel

The primary interface to Apple's on-device language models.

### Static Properties

#### `default`

Get the default system language model.

<table>
<tr><th>Swift</th><th>JavaScript/TypeScript</th></tr>
<tr>
<td>

```swift
let model = SystemLanguageModel.default
```

</td>
<td>

```typescript
import { SystemLanguageModel }
  from 'apple-foundation-models';

const model = SystemLanguageModel.default;
```

</td>
</tr>
</table>

### Instance Properties

#### `availability`

Check if the model is available on the current device.

<table>
<tr><th>Swift</th><th>JavaScript/TypeScript</th></tr>
<tr>
<td>

```swift
let availability = model.availability

switch availability {
case .available:
    print("Ready!")
case .unavailable(let reason):
    print("Not available: \(reason)")
}
```

</td>
<td>

```typescript
import { SystemLanguageModel, Availability }
  from 'apple-foundation-models';

const model = SystemLanguageModel.default;
const availability = model.availability;

switch (availability) {
  case Availability.Available:
    console.log('Ready!');
    break;
  case Availability.DeviceNotEligible:
    console.log('Device not eligible');
    break;
  case Availability.AppleIntelligenceNotEnabled:
    console.log('Apple Intelligence not enabled');
    break;
  case Availability.ModelNotReady:
    console.log('Model not ready');
    break;
}
```

</td>
</tr>
</table>

**Returns**: `Availability` enum value

**Availability enum values**:
- `Availability.Available` - Model is available and ready to use
- `Availability.DeviceNotEligible` - Device doesn't support Foundation Models
- `Availability.AppleIntelligenceNotEnabled` - Apple Intelligence not enabled in settings
- `Availability.ModelNotReady` - Model is downloading or initializing

#### `isAvailable`

Convenience property to check availability as boolean.

<table>
<tr><th>Swift</th><th>JavaScript/TypeScript</th></tr>
<tr>
<td>

```swift
if model.isAvailable {
    // Use the model
}
```

</td>
<td>

```typescript
import { SystemLanguageModel }
  from 'apple-foundation-models';

const model = SystemLanguageModel.default;

if (model.isAvailable) {
  // Use the model
}
```

</td>
</tr>
</table>

**Returns**: `boolean`

### Initializers

#### `init(useCase:)`

Create a model specialized for a specific use case.

<table>
<tr><th>Swift</th><th>JavaScript/TypeScript</th></tr>
<tr>
<td>

```swift
let model = SystemLanguageModel(
    useCase: .contentTagging
)
```

</td>
<td>

```typescript
import { SystemLanguageModel, UseCase }
  from 'apple-foundation-models';

const model = new SystemLanguageModel(
  UseCase.ContentTagging
);
```

</td>
</tr>
</table>

**Parameters**:
- `useCase: UseCase` - The specialized use case (currently only `UseCase.ContentTagging` is documented)

---

## LanguageModelSession

Manages stateful interactions with language models, maintaining conversation context.

### Initializers

The session can be initialized in multiple ways:

<table>
<tr><th>Swift</th><th>JavaScript/TypeScript</th></tr>
<tr>
<td>

```swift
// 1. Default model
let session = LanguageModelSession()

// 2. With instructions
let session = LanguageModelSession(
    instructions: "You are helpful"
)

// 3. Custom model
let session = LanguageModelSession(
    model: SystemLanguageModel.default
)

// 4. Full configuration
let model = SystemLanguageModel.default
let tools: [any Tool] = []
let instructions = "You are helpful"

let session = LanguageModelSession(
    model: model,
    tools: tools,
    instructions: instructions
)
```

</td>
<td>

```typescript
import { SystemLanguageModel, LanguageModelSession,
         Instructions }
  from 'apple-foundation-models';

// 1. Default model
const session = new LanguageModelSession();

// 2. With instructions
const session = new LanguageModelSession(
  undefined, // model (use default)
  undefined, // guardrails
  [],        // tools
  new Instructions('You are helpful')
);

// 3. Custom model
const session = new LanguageModelSession(
  SystemLanguageModel.default
);

// 4. Full configuration
const model = SystemLanguageModel.default;
const tools = [];
const instructions = new Instructions('You are helpful');

const session = new LanguageModelSession(
  model,
  undefined, // guardrails (use default)
  tools,
  instructions
);
```

</td>
</tr>
</table>

**Parameters**:
- `model?: SystemLanguageModel` - Language model to use (defaults to `SystemLanguageModel.default`)
- `guardrails?: Guardrails` - Safety guardrails (defaults to `Guardrails.default`, currently not configurable)
- `tools?: any[]` - Array of tools the model can call
- `instructions?: Instructions` - System prompt or instructions

### Instance Properties

#### `isResponding`

Check if the model is currently generating a response.

<table>
<tr><th>Swift</th><th>JavaScript/TypeScript</th></tr>
<tr>
<td>

```swift
if session.isResponding {
    print("Generating...")
}
```

</td>
<td>

```typescript
import { LanguageModelSession }
  from 'apple-foundation-models';

const session = new LanguageModelSession();

if (session.isResponding) {
  console.log('Generating...');
}
```

</td>
</tr>
</table>

**Returns**: `boolean`

#### `transcript`

Access the conversation history.

<table>
<tr><th>Swift</th><th>JavaScript/TypeScript</th></tr>
<tr>
<td>

```swift
for entry in session.transcript {
    switch entry {
    case .prompt(let text):
        print("User: \(text)")
    case .response(let text):
        print("Assistant: \(text)")
    case .instructions(_):
        print("Instructions set")
    case .toolCalls(let calls):
        print("Tools: \(calls.count)")
    case .toolOutput(_):
        print("Tool output")
    }
}
```

</td>
<td>

```typescript
import { LanguageModelSession }
  from 'apple-foundation-models';

const session = new LanguageModelSession();

for (const entry of session.transcript) {
  switch (entry.type) {
    case 'prompt':
      console.log('User:', entry.content);
      break;
    case 'response':
      console.log('Assistant:', entry.content);
      break;
    case 'instructions':
      console.log('Instructions set');
      break;
    case 'toolCalls':
      console.log('Tools:', entry.calls.length);
      break;
    case 'toolOutput':
      console.log('Tool output');
      break;
  }
}
```

</td>
</tr>
</table>

**Returns**: `readonly TranscriptEntry[]`

### Instance Methods

#### `respond(to:)`

Send a prompt and receive a complete response.

<table>
<tr><th>Swift</th><th>JavaScript/TypeScript</th></tr>
<tr>
<td>

```swift
let response = try await session.respond(
    to: "Tell me a joke"
)
print(response.content)
```

</td>
<td>

```typescript
import { LanguageModelSession }
  from 'apple-foundation-models';

const session = new LanguageModelSession();
const response = await session.respond('Tell me a joke');
console.log(response.content);
```

</td>
</tr>
</table>

**Parameters**:
- `prompt: string` - The user's input text

**Returns**: `Promise<Response<string>>`

**Throws**: Error if generation fails

#### `respond(to:options:)`

Send a prompt with custom generation options.

<table>
<tr><th>Swift</th><th>JavaScript/TypeScript</th></tr>
<tr>
<td>

```swift
let options = GenerationOptions(
    sampling: .random,
    temperature: 0.8,
    maximumResponseTokens: 200
)

let response = try await session.respond(
    to: "Write a poem",
    options: options
)
```

</td>
<td>

```typescript
import { LanguageModelSession, SamplingMode }
  from 'apple-foundation-models';

const session = new LanguageModelSession();
const options = {
  sampling: SamplingMode.Random,
  temperature: 0.8,
  maximumResponseTokens: 200
};

const response = await session.respond(
  'Write a poem',
  options
);
```

</td>
</tr>
</table>

**Parameters**:
- `prompt: string` - The user's input text
- `options: GenerationOptions` - Generation configuration

**Returns**: `Promise<Response<string>>`

#### `streamResponse(to:)`

Stream the model's response incrementally.

<table>
<tr><th>Swift</th><th>JavaScript/TypeScript</th></tr>
<tr>
<td>

```swift
let stream = session.streamResponse(
    to: "Write a story"
)

for try await chunk in stream {
    print(chunk, terminator: "")
}
```

</td>
<td>

```typescript
import { LanguageModelSession }
  from 'apple-foundation-models';

const session = new LanguageModelSession();
const stream = session.streamResponse('Write a story');

for await (const chunk of stream) {
  process.stdout.write(chunk);
}
```

</td>
</tr>
</table>

**Parameters**:
- `prompt: string` - The user's input text

**Returns**: `AsyncIterableIterator<string>`

**Note**: Yields incremental text chunks as they are generated. The session automatically adds the complete response to its transcript after streaming completes.

#### `prewarm()`

Preload session resources for faster initial response.

<table>
<tr><th>Swift</th><th>JavaScript/TypeScript</th></tr>
<tr>
<td>

```swift
try await session.prewarm()
```

</td>
<td>

```typescript
import { LanguageModelSession }
  from 'apple-foundation-models';

const session = new LanguageModelSession();
await session.prewarm();
```

</td>
</tr>
</table>

**Returns**: `Promise<void>`

#### `prewarm(promptPrefix:)`

Preload with a prompt prefix for optimized generation.

<table>
<tr><th>Swift</th><th>JavaScript/TypeScript</th></tr>
<tr>
<td>

```swift
try await session.prewarm(
    promptPrefix: "You are a"
)
```

</td>
<td>

```typescript
import { LanguageModelSession }
  from 'apple-foundation-models';

const session = new LanguageModelSession();
await session.prewarmWithPrefix('You are a');
```

</td>
</tr>
</table>

**Parameters**:
- `prefix: string` - The prompt prefix to preload

**Returns**: `Promise<void>`

---

## GenerationOptions

Configuration for controlling text generation behavior.

### Properties

<table>
<tr><th>Swift</th><th>JavaScript/TypeScript</th></tr>
<tr>
<td>

```swift
let options = GenerationOptions(
    sampling: .random,
    temperature: 0.8,
    maximumResponseTokens: 200
)
```

</td>
<td>

```typescript
import { SamplingMode }
  from 'apple-foundation-models';

const options = {
  sampling: SamplingMode.Random,
  temperature: 0.8,
  maximumResponseTokens: 200
};
```

</td>
</tr>
</table>

#### `sampling`

Controls how tokens are selected from the probability distribution.

**Values**:
- `SamplingMode.Greedy` - Deterministic, always picks highest probability
- `SamplingMode.Random` - Samples from distribution for variety

#### `temperature`

Controls randomness and creativity.

**Range**: `0.0` to `2.0`
- Lower values (0.0-0.5): More focused and deterministic
- Medium values (0.6-1.0): Balanced
- Higher values (1.1-2.0): More creative and random

#### `maximumResponseTokens`

Maximum number of tokens to generate.

**Type**: `number | undefined`

---

## Response

Represents a response from the language model.

### Properties

#### `content`

The generated text content.

<table>
<tr><th>Swift</th><th>JavaScript/TypeScript</th></tr>
<tr>
<td>

```swift
let response = try await session.respond(
    to: "Hello"
)
print(response.content)
```

</td>
<td>

```typescript
import { LanguageModelSession }
  from 'apple-foundation-models';

const session = new LanguageModelSession();
const response = await session.respond('Hello');
console.log(response.content);
```

</td>
</tr>
</table>

**Type**: `string` (or generic `Content` type for structured generation)

#### `transcriptEntries`

The conversation entries included in this response.

<table>
<tr><th>Swift</th><th>JavaScript/TypeScript</th></tr>
<tr>
<td>

```swift
let entries = response.transcriptEntries
```

</td>
<td>

```typescript
const entries = response.transcriptEntries;
```

</td>
</tr>
</table>

**Type**: `TranscriptEntry[]`

---

## Instructions

Provides system-level context and guidance for the model.

### Constructor

<table>
<tr><th>Swift</th><th>JavaScript/TypeScript</th></tr>
<tr>
<td>

```swift
let instructions = Instructions(
    "You are a helpful assistant"
)

let session = LanguageModelSession(
    instructions: instructions
)
```

</td>
<td>

```typescript
import { LanguageModelSession, Instructions }
  from 'apple-foundation-models';

const instructions = new Instructions(
  'You are a helpful assistant'
);

const session = new LanguageModelSession(
  undefined,
  undefined,
  [],
  instructions
);
```

</td>
</tr>
</table>

**Parameters**:
- `text: string` - The instruction text

---

## Supporting Types

### TranscriptEntry

Represents an entry in the conversation history.

**TypeScript Type**:
```typescript
type TranscriptEntry =
  | { type: 'prompt', content: string }
  | { type: 'response', content: string }
  | { type: 'instructions', instructions: Instructions }
  | { type: 'toolCalls', calls: ToolCall[] }
  | { type: 'toolOutput', output: ToolOutput };
```

### Availability

**TypeScript Enum**:
```typescript
enum Availability {
  Available = 'available',
  DeviceNotEligible = 'deviceNotEligible',
  AppleIntelligenceNotEnabled = 'appleIntelligenceNotEnabled',
  ModelNotReady = 'modelNotReady'
}
```

### UseCase

**TypeScript Enum**:
```typescript
enum UseCase {
  ContentTagging = 'contentTagging'
}
```

### SamplingMode

**TypeScript Enum**:
```typescript
enum SamplingMode {
  Greedy = 'greedy',
  Random = 'random'
}
```

### Tool

The Tool interface enables the model to perform dynamic actions and fetch runtime data.

**TypeScript Interface**:
```typescript
interface Tool {
  /** Unique identifier for the tool */
  name: string;

  /** Description of what the tool does */
  description: string;

  /** Executes the tool with provided arguments */
  call(arguments: Record<string, any>): Promise<ToolOutput>;
}
```

**ToolCall Type**:
```typescript
interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}
```

**ToolOutput Class**:
```typescript
class ToolOutput {
  constructor(value: string | any);
  readonly value: string | any;
}
```

#### Implementation Status

**IMPORTANT**: The Tool interface is currently defined for type compatibility, but automatic tool execution during `respond()` or `streamResponse()` calls is not yet implemented. This requires architecture changes to support bidirectional communication between the TypeScript and Swift layers.

**Current Capabilities**:
- ✅ Tool interface and types are defined
- ✅ Tools can be passed to `LanguageModelSession` constructor
- ✅ Tool definitions are type-checked at compile time
- ❌ Automatic tool execution is not yet implemented
- ❌ Tool calls in responses need manual handling

**Workaround** - Manual Tool Execution:

<table>
<tr><th>Swift</th><th>JavaScript/TypeScript</th></tr>
<tr>
<td>

```swift
// Automatic in Swift
final class WeatherTool: Tool {
    let name = "getWeather"
    let description = "Get weather"

    func call(arguments: Arguments) async throws -> ToolOutput {
        let weather = await fetch(arguments.city)
        return ToolOutput(weather)
    }
}

let session = LanguageModelSession(
    tools: [WeatherTool()]
)

// Tools are called automatically
let response = try await session.respond(
    to: "What's the weather in SF?"
)
```

</td>
<td>

```typescript
// Manual execution required
class WeatherTool implements Tool {
  name = 'getWeather';
  description = 'Get weather';

  async call(args: { city: string }) {
    const weather = await fetch(args.city);
    return new ToolOutput(weather);
  }
}

const tools = [new WeatherTool()];
const session = new LanguageModelSession(
  SystemLanguageModel.default,
  Guardrails.default,
  tools
);

// Get response - may contain tool calls
let response = await session.respond(
  "What's the weather in SF?"
);

// Check for tool calls in transcript
const toolCalls = response.transcriptEntries
  .filter(e => e.type === 'toolCalls')
  .flatMap(e => e.calls);

// Execute tools manually
for (const call of toolCalls) {
  const tool = tools.find(t => t.name === call.name);
  if (tool) {
    const output = await tool.call(call.arguments);
    // Continue conversation with result
    response = await session.respond(
      `Tool ${call.name} returned: ${output.value}`
    );
  }
}
```

</td>
</tr>
</table>

**Note**: Automatic tool execution will be implemented in a future version when the architecture is updated to support persistent sessions.

---

## Complete Examples

### Basic Conversation

<table>
<tr><th>Swift</th><th>JavaScript/TypeScript</th></tr>
<tr>
<td>

```swift
import FoundationModels

let model = SystemLanguageModel.default
guard model.isAvailable else {
    print("Model not available")
    return
}

let session = LanguageModelSession(
    instructions: "You are helpful"
)

// First turn
let response1 = try await session.respond(
    to: "What is Swift?"
)
print(response1.content)

// Follow-up
let response2 = try await session.respond(
    to: "Give me an example"
)
print(response2.content)
```

</td>
<td>

```typescript
import { SystemLanguageModel, LanguageModelSession,
         Instructions }
  from 'apple-foundation-models';

const model = SystemLanguageModel.default;
if (!model.isAvailable) {
  console.log('Model not available');
  return;
}

const session = new LanguageModelSession(
  undefined,
  undefined,
  [],
  new Instructions('You are helpful')
);

// First turn
const response1 = await session.respond(
  'What is Swift?'
);
console.log(response1.content);

// Follow-up
const response2 = await session.respond(
  'Give me an example'
);
console.log(response2.content);
```

</td>
</tr>
</table>

### Check Availability

<table>
<tr><th>Swift</th><th>JavaScript/TypeScript</th></tr>
<tr>
<td>

```swift
let model = SystemLanguageModel.default

switch model.availability {
case .available:
    let session = LanguageModelSession()
    // Use the model
case .unavailable(let reason):
    switch reason {
    case .deviceNotEligible:
        print("Device doesn't support models")
    case .appleIntelligenceNotEnabled:
        print("Enable Apple Intelligence")
    case .modelNotReady:
        print("Model is downloading")
    }
}
```

</td>
<td>

```typescript
import { SystemLanguageModel, Availability,
         LanguageModelSession }
  from 'apple-foundation-models';

const model = SystemLanguageModel.default;

switch (model.availability) {
  case Availability.Available:
    const session = new LanguageModelSession();
    // Use the model
    break;
  case Availability.DeviceNotEligible:
    console.log("Device doesn't support models");
    break;
  case Availability.AppleIntelligenceNotEnabled:
    console.log('Enable Apple Intelligence');
    break;
  case Availability.ModelNotReady:
    console.log('Model is downloading');
    break;
}
```

</td>
</tr>
</table>

### Custom Generation Options

<table>
<tr><th>Swift</th><th>JavaScript/TypeScript</th></tr>
<tr>
<td>

```swift
let session = LanguageModelSession()

let creativeOptions = GenerationOptions(
    sampling: .random,
    temperature: 1.5,
    maximumResponseTokens: 500
)

let story = try await session.respond(
    to: "Write a sci-fi story",
    options: creativeOptions
)

let focusedOptions = GenerationOptions(
    sampling: .greedy,
    temperature: 0.2,
    maximumResponseTokens: 100
)

let summary = try await session.respond(
    to: "Summarize the story",
    options: focusedOptions
)
```

</td>
<td>

```typescript
import { LanguageModelSession, SamplingMode }
  from 'apple-foundation-models';

const session = new LanguageModelSession();

const creativeOptions = {
  sampling: SamplingMode.Random,
  temperature: 1.5,
  maximumResponseTokens: 500
};

const story = await session.respond(
  'Write a sci-fi story',
  creativeOptions
);

const focusedOptions = {
  sampling: SamplingMode.Greedy,
  temperature: 0.2,
  maximumResponseTokens: 100
};

const summary = await session.respond(
  'Summarize the story',
  focusedOptions
);
```

</td>
</tr>
</table>

### Streaming Response

<table>
<tr><th>Swift</th><th>JavaScript/TypeScript</th></tr>
<tr>
<td>

```swift
let session = LanguageModelSession()
let stream = session.streamResponse(
    to: "Write a poem"
)

print("Streaming: ", terminator: "")
for try await chunk in stream {
    print(chunk, terminator: "")
}
print()
```

</td>
<td>

```typescript
import { LanguageModelSession }
  from 'apple-foundation-models';

const session = new LanguageModelSession();
const stream = session.streamResponse('Write a poem');

process.stdout.write('Streaming: ');
for await (const chunk of stream) {
  process.stdout.write(chunk);
}
console.log();
```

</td>
</tr>
</table>

---

## Type Mapping Reference

| Swift Type | TypeScript Type |
|------------|----------------|
| `SystemLanguageModel` | `SystemLanguageModel` |
| `LanguageModelSession` | `LanguageModelSession` |
| `GenerationOptions` | `GenerationOptions` (interface) |
| `Response<String>` | `Response<string>` |
| `Instructions` | `Instructions` |
| `Guardrails` | `Guardrails` |
| `TranscriptEntry` | `TranscriptEntry` (union type) |
| `Tool` | `Tool` (interface - see Tool section below) |
| `ToolCall` | `ToolCall` |
| `ToolOutput` | `ToolOutput` |
| `UseCase` | `UseCase` (enum) |
| `SamplingMode` | `SamplingMode` (enum) |
| `Availability` | `Availability` (enum) |
| `Bool` | `boolean` |
| `String` | `string` |
| `Int` | `number` |
| `Double` | `number` |
| `[T]` | `T[]` |
| `async throws` | `Promise<T>` (may reject) |
| `AsyncSequence` | `AsyncIterableIterator<T>` |

---

## Additional Resources

- [Apple FoundationModels Documentation](https://developer.apple.com/documentation/FoundationModels)
- [WWDC 2025 Session: Meet the Foundation Models framework](https://developer.apple.com/videos/play/wwdc2025/286/)
- [Architecture Details](ARCHITECTURE.md)
- [Main README](README.md)

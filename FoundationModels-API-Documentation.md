# Apple Foundation Models Framework - Comprehensive API Documentation

## Overview

The Foundation Models framework, introduced at WWDC 2025, provides developers with direct access to Apple's on-device large language models that power Apple Intelligence. The framework enables privacy-first, offline AI capabilities with a convenient and powerful Swift API.

**Platforms:** iOS 26+, iPadOS 26+, macOS 26+, visionOS

**Import Statement:**
```swift
import FoundationModels
```

## Technical Specifications

### Model Architecture

**On-Device Model:**
- ~3 billion parameters
- Vocabulary: 49K tokens
- Quantization: Mixed 2-bit and 4-bit configuration (average 3.7 bits-per-weight)
- First token latency: ~0.6 milliseconds per prompt token (iPhone 15 Pro)
- Generation rate: 30 tokens per second

**Server Model:**
- Larger parameter count
- Vocabulary: 100K tokens
- Runs on Apple silicon servers

### Adapter System
- Small neural network modules for task specialization
- Can be dynamically loaded and swapped
- Parameters represented in 16-bit
- Typical size: tens of megabytes
- Enables fine-tuning without changing base model

## Core API Components

### SystemLanguageModel

The primary access point to Apple's on-device language model.

#### Properties

```swift
static var `default`: SystemLanguageModel
```
Returns the base version of the system language model for general-purpose use.

```swift
var availability: SystemLanguageModel.Availability
```
Indicates whether the model is available on the current device.

```swift
var isAvailable: Bool
```
Convenience property to check if the model can be used.

#### Initializers

```swift
init(useCase: SystemLanguageModel.UseCase)
```
Creates a specialized model for a specific use case.

**Parameters:**
- `useCase`: The specialized use case for the model

**Example:**
```swift
let taggingModel = SystemLanguageModel(useCase: .contentTagging)
```

#### Nested Types

**SystemLanguageModel.Availability**

Enum representing model availability status.

```swift
enum Availability {
    case available
    case unavailable(UnavailableReason)
}
```

**SystemLanguageModel.Availability.UnavailableReason**

```swift
enum UnavailableReason {
    case deviceNotEligible
    case appleIntelligenceNotEnabled
    case modelNotReady
}
```

**SystemLanguageModel.UseCase**

```swift
enum UseCase {
    case contentTagging
    // Additional use cases...
}
```

The `contentTagging` use case is specialized for:
- Generating topic tags
- Extracting entities
- Detecting topics from text
- Auto-tagging or classifying user content

### LanguageModelSession

Manages stateful interactions with the language model, orchestrating conversation flow and maintaining context.

#### Initializers

```swift
init(
    model: SystemLanguageModel = .default,
    guardrails: Guardrails = .default,
    tools: [Tool] = [],
    instructions: Instructions? = nil
)
```

**Parameters:**
- `model`: The language model to use (defaults to `.default`)
- `guardrails`: Safety guardrails for filtering (defaults to `.default`)
- `tools`: Array of tools available for the model to call
- `instructions`: Context, role, and preferences for model responses

#### Properties

```swift
var isResponding: Bool
```
Indicates whether the model is currently generating a response.

```swift
var transcript: [TranscriptEntry]
```
Contains the conversation history including prompts, responses, tool calls, and outputs.

#### Methods

**respond(to:)**

Sends a prompt to the model and returns the complete response.

```swift
func respond(to prompt: String) async throws -> Response<String>
```

**Parameters:**
- `prompt`: The text prompt to send to the model

**Returns:** `Response<String>` containing the model's reply

**Throws:** Error if generation fails

**Example:**
```swift
let session = LanguageModelSession()
let response = try await session.respond(to: "Tell me a joke")
print(response.content)
```

**respond(to:generating:)**

Generates a response conforming to a specified type.

```swift
func respond<T: Generable>(
    to prompt: String,
    generating type: T.Type
) async throws -> Response<T>
```

**Parameters:**
- `prompt`: The text prompt to send to the model
- `type`: The type to generate (must conform to `@Generable`)

**Returns:** `Response<T>` containing the generated structured content

**Example:**
```swift
let session = LanguageModelSession()
let recipe = try await session.respond(
    to: "Create a pasta recipe",
    generating: Recipe.self
)
print(recipe.content.title)
```

**respond(to:options:)**

Sends a prompt with custom generation options.

```swift
func respond(
    to prompt: String,
    options: GenerationOptions
) async throws -> Response<String>
```

**Parameters:**
- `prompt`: The text prompt to send
- `options`: Configuration for generation behavior

**streamResponse(to:)**

Streams the model's response incrementally.

```swift
func streamResponse(to prompt: String) -> ResponseStream<String>
```

**Parameters:**
- `prompt`: The text prompt to send

**Returns:** `ResponseStream<String>` conforming to `AsyncSequence`

**Example:**
```swift
let session = LanguageModelSession()
let stream = session.streamResponse(to: "Write a story")

for try await chunk in stream {
    print(chunk, terminator: "")
}
```

**streamResponse(to:generating:)**

Streams a structured response of a specified type.

```swift
func streamResponse<T: Generable>(
    to prompt: String,
    generating type: T.Type
) -> ResponseStream<T>
```

**Parameters:**
- `prompt`: The text prompt to send
- `type`: The type to generate (must conform to `@Generable`)

**Returns:** `ResponseStream<T>` emitting partial results conforming to `AsyncSequence`

**Example:**
```swift
let stream = session.streamResponse(
    to: "heart rate data",
    generating: Article.self
)

for try await partialArticle in stream {
    print(partialArticle) // Properties are optional during streaming
}

// Collect final complete result
let finalArticle = try await stream.collect()
```

**prewarm()**

Preloads session resources for faster initial responses.

```swift
func prewarm() async throws
```

**prewarm(promptPrefix:)**

Preloads session with a prompt prefix for optimized generation.

```swift
func prewarm(promptPrefix: String) async throws
```

### Response<Content>

Represents a response from the language model.

#### Properties

```swift
var content: Content
```
The generated content of the response.

```swift
var transcriptEntries: [TranscriptEntry]
```
The sequence of user and assistant messages in the conversation.

### ResponseStream<Content>

An `AsyncSequence` that emits partial or complete responses during streaming generation.

#### Methods

```swift
func collect() async throws -> Content
```
Collects the final complete result from the stream.

### TranscriptEntry

Represents an entry in the conversation history.

#### Types

```swift
enum TranscriptEntry {
    case prompt(String)
    case response(String)
    case instructions(Instructions)
    case toolCalls([ToolCall])
    case toolOutput(ToolOutput)
}
```

### Instructions

Provides context, role, and preferences for model responses. Takes precedence over prompts and guides the model toward specific goals or personas.

```swift
struct Instructions {
    init(_ text: String)
}
```

**Example:**
```swift
let instructions = Instructions("You are a helpful nutrition expert.")
let session = LanguageModelSession(instructions: instructions)
```

### Guardrails

Controls safety guardrails for prompt and response filtering.

```swift
struct Guardrails {
    static var `default`: Guardrails
}
```

**Note:** Currently, guardrails are used by default and cannot be disabled.

### GenerationOptions

Customizes generation behavior.

#### Properties

```swift
var sampling: SamplingMode
```
Controls how values are sampled from the probability distribution.
- `.greedy`: Deterministic, always picks highest probability token
- `.random`: Samples from distribution for varied outputs

```swift
var temperature: Double
```
Influences randomness/creativity of responses.
- Range: 0.0 to 2.0
- Lower values: More focused and deterministic
- Higher values: More creative and random

```swift
var maximumResponseTokens: Int?
```
The maximum number of tokens to generate.

**Example:**
```swift
let options = GenerationOptions(
    sampling: .random,
    temperature: 0.8,
    maximumResponseTokens: 500
)

let response = try await session.respond(
    to: "Write a creative story",
    options: options
)
```

## Macros

### @Generable

Marks a Swift type as capable of being generated by the language model. Automatically synthesizes necessary conformances and methods for structured output generation.

**Syntax:**
```swift
@Generable
struct TypeName {
    // properties
}

// With description
@Generable(description: "Description of what to generate")
struct TypeName {
    // properties
}
```

**Features:**
- Generates schema for the type
- Handles parsing of model output
- Creates `PartiallyGenerated` variant with optional properties for streaming
- Supports primitive types, arrays, nested structs, and enums

**Example:**
```swift
@Generable(description: "A recipe with nutritional information")
struct Recipe {
    let title: String
    let energy: Double
    let protein: Double
    let ingredients: [String]
    let steps: [String]
}
```

**Streaming Support:**

When using `streamResponse(generating:)`, the framework creates a `PartiallyGenerated` type where all properties are optional, allowing incremental generation:

```swift
for try await partialRecipe in stream {
    if let title = partialRecipe.title {
        print("Title: \(title)")
    }
    if let ingredients = partialRecipe.ingredients {
        print("Ingredients so far: \(ingredients)")
    }
}
```

### @Guide

Provides property-level instructions and constraints for language model generation. Allows fine-grained control over individual fields.

**Syntax:**
```swift
@Guide(description: "Description of this property")
var propertyName: Type

@Guide(.constraint)
var propertyName: Type
```

**Available Constraints:**

**Array Count:**
```swift
@Guide(.count(4))              // Exact count
@Guide(.minimumCount(3))       // Minimum elements
@Guide(.maximumCount(100))     // Maximum elements
```

**Value Range:**
```swift
@Guide(.range(min...max))      // Numeric range constraint
```

**Value Selection:**
```swift
@Guide(.anyOf([value1, value2, value3]))  // Choose from options
```

**Example:**
```swift
@Generable(description: "A quiz question with multiple choices")
struct Question {
    @Guide(description: "The quiz question text")
    let text: String

    @Guide(.count(4), description: "Four multiple choice options")
    let choices: [String]

    let answer: String

    @Guide(description: "A brief explanation of why the answer is correct")
    let explanation: String
}
```

**Important Notes:**
- Property order matters during generation
- Guides help ensure consistent, predictable output
- Combines well with streaming for progressive validation

## Tool Protocol

Enables the model to perform dynamic actions and fetch runtime data.

### Protocol Definition

```swift
protocol Tool {
    associatedtype Arguments: Generable

    var name: String { get }
    var description: String { get }

    func call(arguments: Arguments) async throws -> ToolOutput
}
```

### Properties

```swift
var name: String
```
Unique identifier for the tool.

```swift
var description: String
```
Description of what the tool does (helps model decide when to use it).

### Methods

```swift
func call(arguments: Arguments) async throws -> ToolOutput
```
Executes the tool with the provided arguments.

**Parameters:**
- `arguments`: Structured arguments (must be `@Generable`)

**Returns:** `ToolOutput` containing the result

### Tool Implementation Example

```swift
final class SearchMapTool: Tool {
    let name = "searchMap"
    let description = "Performs a local search using the map to find nearby places"

    @Generable
    struct Arguments {
        @Guide(description: "The search query for finding places")
        let query: String
    }

    func call(arguments: Arguments) async throws -> ToolOutput {
        // Perform search logic
        let results = await searchNearbyPlaces(query: arguments.query)
        return ToolOutput(results)
    }
}

// Using the tool
let searchTool = SearchMapTool()
let session = LanguageModelSession(
    tools: [searchTool],
    instructions: "You are a helpful assistant that can search for places."
)

let response = try await session.respond(to: "Find coffee shops nearby")
```

### ToolOutput

Represents the result of a tool call.

```swift
struct ToolOutput {
    init(_ string: String)
    init(_ content: GeneratedContent)
}
```

**Note:** Tool outputs are automatically inserted back into the session transcript so the model can continue generation with that data.

### Tool Calling Flow

1. Model determines a tool is needed
2. Framework generates appropriate `Arguments`
3. Tool's `call(arguments:)` method is executed
4. `ToolOutput` is inserted into transcript
5. Model continues generation with tool results

The framework automatically handles complex call graphs including parallel and serial tool calls.

## Type Aliases and Supporting Types

### GeneratedContent

Represents structured content generated by the model.

```swift
struct GeneratedContent {
    // Used when creating ToolOutput from structured data
}
```

### Prompt

Represents a text prompt to the language model (deprecated in favor of direct String usage).

```swift
struct Prompt {
    init(_ text: String)
}
```

**Note:** Modern API uses `String` directly in `respond(to:)` methods.

## Usage Patterns

### Basic Text Generation

```swift
import FoundationModels

// Check availability
let model = SystemLanguageModel.default
guard model.isAvailable else {
    print("Model not available")
    return
}

// Create session and generate
let session = LanguageModelSession()
let response = try await session.respond(to: "Explain quantum computing")
print(response.content)
```

### Availability Checking with Error Handling

```swift
let model = SystemLanguageModel.default

switch model.availability {
case .available:
    let session = LanguageModelSession()
    // Use the model
case .unavailable(let reason):
    switch reason {
    case .deviceNotEligible:
        print("This device doesn't support Foundation Models")
    case .appleIntelligenceNotEnabled:
        print("Please enable Apple Intelligence in Settings")
    case .modelNotReady:
        print("Model is downloading or initializing")
    }
}
```

### Structured Output Generation

```swift
@Generable(description: "A workout plan")
struct WorkoutPlan {
    @Guide(description: "Name of the workout")
    let name: String

    @Guide(.minimumCount(3), .maximumCount(10))
    let exercises: [Exercise]

    let durationMinutes: Int
}

@Generable
struct Exercise {
    let name: String
    let sets: Int
    let reps: Int
}

let session = LanguageModelSession(
    instructions: "You are a fitness expert creating personalized workouts."
)

let plan = try await session.respond(
    to: "Create a beginner upper body workout",
    generating: WorkoutPlan.self
)

print(plan.content.name)
for exercise in plan.content.exercises {
    print("\(exercise.name): \(exercise.sets) sets of \(exercise.reps) reps")
}
```

### Streaming Responses

```swift
let session = LanguageModelSession()
let stream = session.streamResponse(to: "Write a poem about the ocean")

print("Streaming response:")
for try await chunk in stream {
    print(chunk, terminator: "")
}
print() // New line at end
```

### Streaming Structured Content

```swift
@Generable
struct Article {
    let title: String
    let introduction: String
    let sections: [Section]
    let conclusion: String
}

@Generable
struct Section {
    let heading: String
    let content: String
}

let stream = session.streamResponse(
    to: "Write an article about renewable energy",
    generating: Article.self
)

for try await partialArticle in stream {
    // All properties are optional during streaming
    if let title = partialArticle.title {
        print("Title: \(title)")
    }

    if let sections = partialArticle.sections {
        print("Sections completed: \(sections.count)")
    }
}

// Get final complete result
let finalArticle = try await stream.collect()
```

### Multi-Turn Conversations

```swift
let session = LanguageModelSession(
    instructions: "You are a helpful coding assistant."
)

// First turn
let response1 = try await session.respond(
    to: "How do I sort an array in Swift?"
)
print(response1.content)

// Follow-up - session maintains context
let response2 = try await session.respond(
    to: "Can you show me a custom sorting example?"
)
print(response2.content)

// Access full conversation history
for entry in session.transcript {
    switch entry {
    case .prompt(let text):
        print("User: \(text)")
    case .response(let text):
        print("Assistant: \(text)")
    case .instructions(let inst):
        print("Instructions set")
    case .toolCalls(let calls):
        print("Tools called: \(calls.count)")
    case .toolOutput(let output):
        print("Tool output received")
    }
}
```

### Using Specialized Models

```swift
// Content tagging model
let taggingModel = SystemLanguageModel(useCase: .contentTagging)
let session = LanguageModelSession(model: taggingModel)

let tags = try await session.respond(
    to: """
    Extract topic tags from this text:
    "Apple's new AI framework enables on-device machine learning with
    privacy-first architecture and Swift integration."
    """,
    generating: TagList.self
)

@Generable
struct TagList {
    @Guide(.minimumCount(3), .maximumCount(10))
    let tags: [String]
}
```

### Custom Generation Options

```swift
let session = LanguageModelSession()

// Creative generation
let creativeOptions = GenerationOptions(
    sampling: .random,
    temperature: 1.5,
    maximumResponseTokens: 1000
)

let story = try await session.respond(
    to: "Write a creative sci-fi opening",
    options: creativeOptions
)

// Focused generation
let focusedOptions = GenerationOptions(
    sampling: .greedy,
    temperature: 0.2,
    maximumResponseTokens: 200
)

let summary = try await session.respond(
    to: "Summarize quantum entanglement in 2 sentences",
    options: focusedOptions
)
```

### Tool Integration

```swift
// Define tools
final class WeatherTool: Tool {
    let name = "getWeather"
    let description = "Gets current weather for a location"

    @Generable
    struct Arguments {
        @Guide(description: "City name")
        let city: String
    }

    func call(arguments: Arguments) async throws -> ToolOutput {
        let weather = await fetchWeather(for: arguments.city)
        return ToolOutput("The weather in \(arguments.city) is \(weather)")
    }
}

final class CalendarTool: Tool {
    let name = "checkCalendar"
    let description = "Checks calendar for appointments"

    @Generable
    struct Arguments {
        @Guide(description: "Date to check (YYYY-MM-DD)")
        let date: String
    }

    func call(arguments: Arguments) async throws -> ToolOutput {
        let events = await getEvents(on: arguments.date)
        return ToolOutput("Events on \(arguments.date): \(events)")
    }
}

// Use multiple tools
let session = LanguageModelSession(
    tools: [WeatherTool(), CalendarTool()],
    instructions: "You are a helpful assistant with access to weather and calendar."
)

let response = try await session.respond(
    to: "What's the weather today and do I have any meetings?"
)
```

### Prewarming for Performance

```swift
let session = LanguageModelSession()

// Prewarm session before user interaction
Task {
    try await session.prewarm()
}

// Later, when user asks a question
let response = try await session.respond(to: userQuestion)

// Or prewarm with expected prompt prefix
try await session.prewarm(promptPrefix: "You are a")
```

## Best Practices

### Privacy and Security

1. All processing happens on-device by default
2. No data is sent to external servers
3. Built-in guardrails provide safety filtering
4. Perfect for sensitive user data

### Performance Optimization

1. Use `prewarm()` to reduce first-response latency
2. Reuse `LanguageModelSession` instances for related conversations
3. Use streaming for long responses to improve perceived performance
4. Choose appropriate `maximumResponseTokens` limits

### Structured Output

1. Keep `@Generable` types simple and well-documented
2. Use `@Guide` to constrain outputs and improve reliability
3. Property order in structs affects generation order
4. Test edge cases with various prompts

### Error Handling

1. Always check `SystemLanguageModel.availability` before use
2. Handle async errors from `respond` and `streamResponse`
3. Provide user-friendly fallbacks when model is unavailable
4. Consider retry logic for transient failures

### Tool Design

1. Keep tool descriptions clear and specific
2. Use `@Guide` on tool arguments for better reliability
3. Handle errors gracefully in `call(arguments:)`
4. Return meaningful `ToolOutput` the model can use

## Platform Requirements

**Minimum Versions:**
- iOS 26.0+
- iPadOS 26.0+
- macOS 26.0+
- visionOS 2.0+

**Device Requirements:**
- Requires Apple Intelligence-capable devices
- Sufficient storage for model (~3GB for base model)
- Adequate RAM for model execution

**Language Support:**
- English
- French
- German
- Spanish
- Italian
- Portuguese
- Chinese
- Japanese
- Korean
- And more...

## Related Frameworks

- **Foundation**: Core Swift types and utilities
- **SwiftUI**: For building user interfaces with model integration
- **Combine**: For reactive handling of streaming responses
- **AppIntents**: For integrating model capabilities with Shortcuts

## Additional Resources

- [Official Documentation](https://developer.apple.com/documentation/foundationmodels/)
- [WWDC 2025 Session 286: Meet the Foundation Models framework](https://developer.apple.com/videos/play/wwdc2025/286/)
- [Apple Intelligence Foundation Language Models Technical Report](https://machinelearning.apple.com/research/apple-foundation-models-tech-report-2025)
- [Sample Code and Tutorials](https://developer.apple.com/documentation/foundationmodels/generating-content-and-performing-tasks-with-foundation-models)

---

*Documentation compiled from official Apple resources and developer community guides. Last updated: 2025.*

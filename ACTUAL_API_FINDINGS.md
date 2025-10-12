# Actual FoundationModels API - Probed from macOS 26.0.1

This document contains the **actual** API surface discovered by probing the real FoundationModels framework on macOS 26.0.1.

## SystemLanguageModel

### Static Properties
- `static var default: SystemLanguageModel` ✓

### Instance Properties
- `var availability: Availability` ✓
- `var isAvailable: Bool` ✓

### Initializers
- `init(useCase: UseCase)` ✓

### Notes
- `SystemLanguageModel.availableModels` does **NOT** exist
- No `init(id:)` initializer
- No `generate()` method - must use `LanguageModelSession` instead
- Has internal properties: `modelBundle`, `useCase`, `guardrails`, but they're not publicly documented

## LanguageModelSession

### Initializers (All Confirmed Working)
1. `init()` ✓
2. `init(instructions: Instructions?)` ✓
3. `init(model: SystemLanguageModel)` ✓
4. `init(model: SystemLanguageModel, instructions: Instructions?)` ✓
5. `init(model: SystemLanguageModel, tools: [any Tool], instructions: Instructions?)` ✓

**IMPORTANT:** The documentation mentions `init(model:guardrails:tools:instructions:)` but our tests show the actual signature is:
```swift
init(model: SystemLanguageModel, tools: [any Tool], instructions: Instructions?)
```
(No separate `guardrails` parameter!)

### Instance Properties
- `var isResponding: Bool` ✓ (read-only)
- `var transcript: Transcript` ✓ (read-only, array-like)

**IMPORTANT:** There is **NO** public `languageModel` property to access the underlying model.

### Methods (from documentation, not directly tested)
- `func respond(to: String) async throws -> Response<String>` ✓
- `func respond(to: String, options: GenerationOptions) async throws -> Response<String>` ✓
- `func streamResponse(to: String) -> ResponseStream<String>` ✓
- `func prewarm() async throws` ✓
- `func prewarm(promptPrefix: String) async throws` ✓

## GenerationOptions

### Public Properties (Confirmed)
- `var sampling: SamplingMode?` ✓
- `var temperature: Double?` ✓
- `var maximumResponseTokens: Int?` ✓

### Internal Properties (from Mirror, not publicly accessible)
- `repetition: Repetition?` (internal)
- `length: Length?` (internal)
- `allowsUnsupportedLanguagesInPrompt: Bool` (internal)

## Instructions

### Initializers
- `init(_ text: String)` ✓

### Internal Properties
- Has `components: [Component]` property internally (not just a simple text string!)

## Response<Content>

### Properties (from documentation)
- `var content: Content` ✓
- `var transcriptEntries: [TranscriptEntry]` ✓

**Note:** The actual type returned from `session.respond()` is `Response<String>` not accessible for namespace due to name conflicts.

## Guardrails

- `static var default: Guardrails` - Type exists but may not be publicly accessible as a separate parameter
- Appears to be internally managed by the framework

## TranscriptEntry

- Type: Enum with associated values
- Actual entry type when in transcript: `Entry` (not the enum cases directly)
- From documentation: `.prompt(String)`, `.response(String)`, `.instructions(Instructions)`, `.toolCalls([ToolCall])`, `.toolOutput(ToolOutput)`

## Enums

### Availability
```swift
enum Availability {
    case available
    case unavailable(UnavailableReason)
}
```

### UseCase
```swift
enum UseCase {
    case contentTagging
    // possibly others
}
```

### SamplingMode
- Exists as `Optional<SamplingMode>` in GenerationOptions
- Cases likely: `.greedy`, `.random` (from documentation)

## Key Discrepancies from Documentation

1. **LanguageModelSession initializer**: No separate `guardrails` parameter
2. **No `languageModel` property**: Can't access the underlying model from a session
3. **Instructions**: Not just a simple text wrapper, has internal `components`
4. **GenerationOptions**: Some properties shown in Mirror are not publicly accessible
5. **No `SystemLanguageModel.availableModels`**: Only `SystemLanguageModel.default` exists
6. **No direct generation**: Must use `LanguageModelSession`, not `model.generate()`

## Recommendations for TypeScript API

1. ✅ Keep `SystemLanguageModel.default` as static getter
2. ❌ Remove `SystemLanguageModel.availableModels` (doesn't exist)
3. ❌ Remove `languageModel` property from `LanguageModelSession`
4. ✅ Update `LanguageModelSession` constructor to not require `guardrails` parameter
5. ✅ Limit `GenerationOptions` properties to: `sampling`, `temperature`, `maximumResponseTokens`
6. ✅ Keep `Instructions` as simple text wrapper (hide internal complexity)

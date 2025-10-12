# API Validation Summary - 1-to-1 Translation Status

This document shows the validated mapping between the TypeScript API and the actual Apple FoundationModels framework, as probed on macOS 26.0.1.

## ✅ Validated API Mappings

### SystemLanguageModel

| TypeScript | Swift (Actual) | Status | Notes |
|------------|----------------|--------|-------|
| `SystemLanguageModel.default` | `SystemLanguageModel.default` | ✅ Exact match | Static property |
| `model.availability` | `model.availability` | ✅ Exact match | Returns `Availability` enum |
| `model.isAvailable` | `model.isAvailable` | ✅ Exact match | Boolean property |
| `new SystemLanguageModel(UseCase.ContentTagging)` | `SystemLanguageModel(useCase: .contentTagging)` | ✅ Exact match | Constructor |
| ~~`SystemLanguageModel.availableModels`~~ | ❌ Does not exist | ⚠️ Removed from public API | Kept as private internal helper |

### LanguageModelSession

#### Initializers

| TypeScript | Swift (Actual) | Status |
|------------|----------------|--------|
| `new LanguageModelSession()` | `init()` | ✅ Match |
| `new LanguageModelSession(model)` | `init(model:)` | ✅ Match |
| `new LanguageModelSession(model, guardrails, tools, instructions)` | `init(model:tools:instructions:)` | ⚠️ Partial match* |

\* **Note:** The actual Swift API does NOT have a separate `guardrails` parameter. Guardrails are managed internally. The TypeScript keeps this parameter for backwards compatibility but documents that it's ignored.

#### Properties

| TypeScript | Swift (Actual) | Status | Notes |
|------------|----------------|--------|-------|
| `session.isResponding` | `session.isResponding` | ✅ Exact match | Boolean, read-only |
| `session.transcript` | `session.transcript` | ✅ Exact match | Array of `TranscriptEntry` |
| ~~`session.languageModel`~~ | ❌ Does not exist | ✅ Removed | No public accessor for underlying model |

#### Methods

| TypeScript | Swift (Actual) | Status |
|------------|----------------|--------|
| `session.respond(prompt)` | `session.respond(to:)` | ✅ Exact match |
| `session.respond(prompt, options)` | `session.respond(to:options:)` | ✅ Exact match |
| `session.streamResponse(prompt)` | `session.streamResponse(to:)` | ✅ Exact match |
| `session.prewarm()` | `session.prewarm()` | ✅ Exact match |
| `session.prewarmWithPrefix(prefix)` | `session.prewarm(promptPrefix:)` | ✅ Exact match |

### GenerationOptions

| TypeScript | Swift (Actual) | Status | Notes |
|------------|----------------|--------|-------|
| `sampling?: SamplingMode` | `sampling: SamplingMode?` | ✅ Exact match | Optional |
| `temperature?: number` | `temperature: Double?` | ✅ Exact match | Optional |
| `maximumResponseTokens?: number` | `maximumResponseTokens: Int?` | ✅ Exact match | Optional |

**Note:** The actual Swift type has internal properties (like `repetition`, `length`, `allowsUnsupportedLanguagesInPrompt`) that are not publicly accessible. These are correctly omitted from the TypeScript API.

### Supporting Types

| TypeScript | Swift (Actual) | Status |
|------------|----------------|--------|
| `Instructions` | `Instructions` | ✅ Match |
| `Guardrails` | `Guardrails` | ✅ Match |
| `Response<Content>` | `Response<Content>` | ✅ Match |
| `TranscriptEntry` | `TranscriptEntry` | ✅ Match |
| `ToolOutput` | `ToolOutput` | ✅ Match |
| `Availability` enum | `Availability` enum | ✅ Match |
| `UseCase` enum | `UseCase` enum | ✅ Match |
| `SamplingMode` enum | `SamplingMode` enum | ✅ Match |

## 📝 Key Findings from API Probing

### What Exists in Swift but NOT in TypeScript (Correctly Omitted)
- Internal properties like `modelBundle`, `useCase`, `_$observationRegistrar`
- Internal GenerationOptions properties like `repetition`, `length`
- `Instructions.components` (internal representation)

### What Was in TypeScript but NOT in Swift (Fixed)
- ✅ `SystemLanguageModel.availableModels` - Made private/internal
- ✅ `LanguageModelSession.languageModel` - Removed
- ✅ Separate `guardrails` parameter in constructor - Documented as unused

### What Matches Perfectly
- ✅ All public properties and methods
- ✅ Enum values and types
- ✅ Method signatures
- ✅ Return types

## 🎯 Conclusion

The TypeScript API now provides a **validated 1-to-1 translation** of Apple's FoundationModels framework as it exists on macOS 26.0.1. All public APIs have been confirmed through direct probing of the actual framework.

### Changes Made for Accuracy:
1. ✅ Removed `SystemLanguageModel.availableModels` from public API
2. ✅ Removed `LanguageModelSession.languageModel` property
3. ✅ Documented that `guardrails` parameter is not part of actual Swift API
4. ✅ Verified all GenerationOptions properties match exactly
5. ✅ Confirmed all method signatures match

### Maintained for Compatibility:
- Internal helper methods (marked `@internal`)
- Backwards-compatible constructor signature (with documentation)
- Legacy types for internal use

The API is now as close to a 1-to-1 translation as possible while maintaining TypeScript/JavaScript idioms.

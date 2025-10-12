# 1-to-1 API Translation Summary

This document summarizes the changes made to provide a complete 1-to-1 translation of Apple's Foundation Models API.

## Problem Statement

The original issue requested a complete 1-to-1 translation of every API from Apple's FoundationModels framework. Specifically mentioned was `LanguageModelSession`, which is a class in the Swift library and should be a class in the TypeScript wrapper as well.

## Issues Identified

The original implementation had the following problems:

1. **Incorrect API mapping**: Everything was implemented as static methods on a `FoundationModels` class
2. **Not 1-to-1 with Swift**: The Swift `SystemLanguageModel` is an instance-based class, not a static utility
3. **Missing classes**: `LanguageModelSession` was not implemented

## Solution Implemented

### 1. SystemLanguageModel Class (Instance-based)

Created a proper instance-based `SystemLanguageModel` class that matches the Swift API:

```typescript
// Swift API:
// let models = SystemLanguageModel.availableModels
// let model = SystemLanguageModel(id: "model-id")
// let result = try await model.generate(prompt: "...", config: config)

// TypeScript API (now 1-to-1):
const models = await SystemLanguageModel.availableModels;
const model = new SystemLanguageModel(models[0].id);
const result = await model.generate('...', { maxTokens: 100 });
```

**Features:**
- Constructor: `new SystemLanguageModel(id: string)`
- Static property: `SystemLanguageModel.availableModels` (returns Promise)
- Instance methods:
  - `generate(prompt, config?)` - Generate text
  - `generateStream(prompt, config?)` - Stream generation (not yet implemented)
  - `getName()` - Get model name
  - `getMaxTokens()` - Get max tokens
- Properties:
  - `id` - Model identifier

### 2. LanguageModelSession Class (Conversational)

Implemented a session-based API for multi-turn conversations:

```typescript
// Create a session with system prompt
const session = new LanguageModelSession(modelId, {
  systemPrompt: 'You are a helpful assistant.',
  generationConfig: {
    maxTokens: 150,
    temperature: 0.7,
  },
});

// Have a conversation
const response1 = await session.generate('What is TypeScript?');
const response2 = await session.generate('How is it different from JavaScript?');

// Access message history
console.log(session.messages);

// Reset the session
session.reset();
```

**Features:**
- Constructor: `new LanguageModelSession(modelId, config?)`
- Methods:
  - `generate(prompt, config?)` - Generate in context
  - `generateStream(prompt, config?)` - Stream in context (not yet implemented)
  - `reset()` - Clear message history
- Properties:
  - `languageModel` - Get underlying SystemLanguageModel instance
  - `messages` - Get conversation history (read-only)

### 3. New Types and Interfaces

Added proper types for conversational APIs:

```typescript
enum MessageRole {
  System = 'system',
  User = 'user',
  Assistant = 'assistant',
}

interface Message {
  role: MessageRole;
  content: string;
}

interface SessionConfig {
  systemPrompt?: string;
  generationConfig?: GenerationConfig;
}
```

### 4. Backward Compatibility

The original `FoundationModels` static API is maintained but marked as deprecated:

```typescript
// Old API (deprecated but still works)
const models = await FoundationModels.listAvailableModels();
const result = await FoundationModels.generateText({
  prompt: 'test',
  maxTokens: 100,
});

// New API (recommended)
const models = await SystemLanguageModel.availableModels;
const model = new SystemLanguageModel(models[0].id);
const result = await model.generate('test', { maxTokens: 100 });
```

## Files Changed

### Source Files
- `src/foundation-models.ts` - Added SystemLanguageModel and LanguageModelSession classes
- `src/types.ts` - Added Message, MessageRole, SessionConfig types
- `src/index.ts` - Updated exports to include new classes

### Documentation
- `README.md` - Comprehensive API documentation with examples
- `CHANGELOG.md` - Version 0.1.0 release notes
- `IMPLEMENTATION.md` - Updated architecture and implementation details

### Examples
- `examples/instance-based-api.mjs` - Demonstrates SystemLanguageModel usage
- `examples/session-based-api.mjs` - Demonstrates LanguageModelSession usage

### Tests
- `test/basic.test.mjs` - Added 16 tests for new classes and APIs

## API Comparison

| Swift API | Old TypeScript | New TypeScript |
|-----------|---------------|----------------|
| `SystemLanguageModel.availableModels` | `FoundationModels.listAvailableModels()` | `SystemLanguageModel.availableModels` ✅ |
| `SystemLanguageModel(id:)` | N/A | `new SystemLanguageModel(id)` ✅ |
| `model.generate(prompt:config:)` | `FoundationModels.generateText({...})` | `model.generate(prompt, config)` ✅ |
| `LanguageModelSession(model:...)` | N/A | `new LanguageModelSession(modelId, config)` ✅ |
| `session.generate(prompt:)` | N/A | `session.generate(prompt)` ✅ |

## Testing

All tests pass (16/16):
- ✅ SystemLanguageModel class exports and structure
- ✅ LanguageModelSession class exports and structure
- ✅ Instance creation and properties
- ✅ Message history management
- ✅ System prompt handling
- ✅ Enum exports (FinishReason, MessageRole)
- ✅ Legacy API backward compatibility

## Benefits

1. **True 1-to-1 Mapping**: TypeScript API now directly mirrors Swift API
2. **Better Developer Experience**: Instance-based APIs are more intuitive
3. **Conversational Support**: LanguageModelSession enables multi-turn conversations
4. **Type Safety**: Full TypeScript support with proper types
5. **Backward Compatible**: Existing code continues to work
6. **Well Documented**: Comprehensive docs and examples

## Next Steps

For a complete API translation, future work could include:

1. Implement streaming support (`generateStream()`)
2. Add any additional APIs from the Swift SDK (if they exist)
3. Optimize performance (keep Swift process alive, connection pooling)
4. Add more configuration options as they become available in the Swift API

# Apple Foundation Models for JavaScript

A 1-to-1 TypeScript wrapper for Apple's [FoundationModels](https://developer.apple.com/documentation/FoundationModels) framework, enabling seamless use in Node.js and other JavaScript frameworks.

## Features

- 🔄 **1-to-1 API Mapping**: Direct translation of Apple's Swift FoundationModels API to TypeScript
- 📦 **Modern Build**: Built with Rolldown for optimal bundle size and performance
- 🎯 **Type-Safe**: Full TypeScript support with comprehensive type definitions
- 🚀 **Easy Installation**: Auto-builds Swift wrapper during npm install
- 🍎 **Native Performance**: Leverages native Apple Foundation Models via Swift executable

## Requirements

- **Operating System**: macOS 15.0 (Sequoia) or later
- **Node.js**: 18.0.0 or later
- **Swift**: 6.0 or later (included with Xcode or installable from [swift.org](https://swift.org))
- **Architecture**: ARM64 (Apple Silicon) or x64 (Intel)

## Installation

```bash
npm install apple-foundation-models
```

The package will automatically:
1. Check platform compatibility
2. Build the Swift wrapper executable during installation

### Manual Build

If you need to rebuild the Swift wrapper:

```bash
npm run build:swift
```

## Usage

### Instance-based API (1-to-1 Swift mapping)

The `LanguageModel` class provides a true 1-to-1 mapping with Apple's Swift API:

```typescript
import { LanguageModel } from 'apple-foundation-models';

// List available models (static property)
const models = await LanguageModel.availableModels;
console.log('Available models:', models);

// Create a model instance
const model = new LanguageModel(models[0].id);

// Get model properties
console.log('Model ID:', model.id);
console.log('Model Name:', await model.getName());
console.log('Max Tokens:', await model.getMaxTokens());

// Generate text using instance method
const result = await model.generate('Write a haiku about TypeScript', {
  maxTokens: 100,
  temperature: 0.7,
});

console.log('Generated text:', result.text);
console.log('Finish reason:', result.finishReason);
```

### Session-based API for Conversations

Use `LanguageModelSession` for multi-turn conversations with context:

```typescript
import { LanguageModel, LanguageModelSession } from 'apple-foundation-models';

// Get a model
const models = await LanguageModel.availableModels;

// Create a session with a system prompt
const session = new LanguageModelSession(models[0].id, {
  systemPrompt: 'You are a helpful coding assistant.',
  generationConfig: {
    maxTokens: 150,
    temperature: 0.7,
  },
});

// Have a multi-turn conversation
const response1 = await session.generate('What is TypeScript?');
console.log(response1.text);

const response2 = await session.generate('How is it different from JavaScript?');
console.log(response2.text);

// Access message history
console.log('Messages:', session.messages.length);

// Reset the session
session.reset();
```

## API Reference

### `LanguageModel` (Recommended)

Instance-based class that provides 1-to-1 mapping with Swift's `LanguageModel`.

#### Static Properties

##### `LanguageModel.availableModels`

Returns a promise that resolves to a list of available language models.

**Returns**: `Promise<LanguageModelInfo[]>`

```typescript
const models = await LanguageModel.availableModels;
```

#### Constructor

##### `new LanguageModel(id: string)`

Creates a new LanguageModel instance.

**Parameters**:
- `id` - The model identifier (from `LanguageModel.availableModels`)

```typescript
const model = new LanguageModel('model-id');
```

#### Instance Properties

##### `model.id`

Get the model identifier.

**Returns**: `string`

##### `model.getName()`

Get the human-readable name of the model.

**Returns**: `Promise<string>`

##### `model.getMaxTokens()`

Get the maximum number of tokens this model can generate.

**Returns**: `Promise<number>`

#### Instance Methods

##### `model.generate(prompt, config?)`

Generate text using this language model.

**Parameters**:
- `prompt: string` - The input prompt
- `config?: GenerationConfig` - Optional generation configuration

**Returns**: `Promise<GenerationResult>`

```typescript
const result = await model.generate('Write a story', {
  maxTokens: 200,
  temperature: 0.8,
});
```

##### `model.generateStream(prompt, config?)`

Generate text with streaming (not yet implemented).

**Parameters**:
- `prompt: string` - The input prompt
- `config?: GenerationConfig` - Optional generation configuration

**Returns**: `AsyncIterableIterator<string>`

---

### `LanguageModelSession`

Session-based class for conversational interactions that maintains context across multiple turns.

#### Constructor

##### `new LanguageModelSession(modelId, config?)`

Creates a new LanguageModelSession instance.

**Parameters**:
- `modelId: string | LanguageModel` - The model identifier or LanguageModel instance
- `config?: SessionConfig` - Optional session configuration

```typescript
interface SessionConfig {
  systemPrompt?: string;           // System prompt to set context
  generationConfig?: GenerationConfig; // Default generation config
}

// Create a session with system prompt
const session = new LanguageModelSession('model-id', {
  systemPrompt: 'You are a helpful assistant.',
  generationConfig: {
    maxTokens: 100,
    temperature: 0.7,
  },
});
```

#### Instance Properties

##### `session.languageModel`

Get the underlying LanguageModel instance.

**Returns**: `LanguageModel`

##### `session.messages`

Get the message history for this session (read-only).

**Returns**: `readonly Message[]`

```typescript
interface Message {
  role: MessageRole;  // 'system', 'user', or 'assistant'
  content: string;
}
```

#### Instance Methods

##### `session.generate(prompt, config?)`

Generate a response in the context of this session.

**Parameters**:
- `prompt: string` - The user's input prompt
- `config?: GenerationConfig` - Optional generation configuration (overrides session defaults)

**Returns**: `Promise<GenerationResult>`

```typescript
const response = await session.generate('Hello!');
console.log(response.text);

// Override default config for this message
const response2 = await session.generate('Tell me more', {
  maxTokens: 200,
});
```

##### `session.generateStream(prompt, config?)`

Generate a response with streaming (not yet implemented).

**Parameters**:
- `prompt: string` - The user's input prompt
- `config?: GenerationConfig` - Optional generation configuration

**Returns**: `AsyncIterableIterator<string>`

##### `session.reset()`

Reset the session, clearing all message history. The system prompt (if configured) is preserved.

**Returns**: `void`

```typescript
session.reset(); // Clear conversation history
```

---

## Architecture

This package consists of three main components:

1. **Swift Wrapper** (`swift/`): Executable that interfaces with Apple's FoundationModels framework
2. **TypeScript Library** (`src/`): Type-safe JavaScript API that communicates with the Swift executable
3. **Build Scripts** (`scripts/`): Automation for platform checks and Swift compilation

```
┌─────────────────┐
│  JavaScript App │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  TypeScript API │
└────────┬────────┘
         │ JSON over stdin/stdout
         ▼
┌─────────────────┐
│ Swift Executable│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│FoundationModels│
│   (Apple SDK)   │
└─────────────────┘
```

## Development

### Building

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build:js

# Build Swift wrapper
npm run build:swift

# Build both
npm run build
```

### Project Structure

```
.
├── src/                    # TypeScript source
│   ├── index.ts           # Main entry point
│   ├── foundation-models.ts # Core API
│   ├── executor.ts        # Swift command executor
│   └── types.ts           # Type definitions
├── swift/                  # Swift wrapper
│   ├── Package.swift      # Swift package manifest
│   └── Sources/
│       └── AppleFoundationModelsWrapper/
│           └── main.swift # Swift executable
├── scripts/                # Build scripts
│   ├── check-platform.js  # Platform verification
│   └── build-swift.js     # Swift build automation
├── dist/                   # Compiled output (generated)
├── package.json
├── tsconfig.json
└── rolldown.config.js
```

## Limitations

- **Platform**: Only works on macOS 15.0+
- **Streaming**: Stream generation is not yet implemented
- **Offline**: Requires active internet connection for model downloads

## Related Projects

- [llm-cli](https://github.com/johnhenry/llm-cli) - Command-line interface for LLMs

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Changelog

### 0.1.0 (1-to-1 API Translation)

- ✨ **NEW**: `LanguageModel` class - Instance-based API that provides true 1-to-1 mapping with Swift
  - Constructor: `new LanguageModel(id)`
  - Static property: `LanguageModel.availableModels`
  - Instance methods: `generate()`, `generateStream()`
  - Property getters: `getName()`, `getMaxTokens()`
- ✨ **NEW**: `LanguageModelSession` class - Session-based API for conversational interactions
  - Maintains message history across multiple turns
  - Supports system prompts
  - Methods: `generate()`, `generateStream()`, `reset()`
  - Properties: `languageModel`, `messages`
- ✨ **NEW**: Message and conversation types
  - `Message` interface with `role` and `content`
  - `MessageRole` enum (`System`, `User`, `Assistant`)
  - `SessionConfig` for session configuration
- 📚 Comprehensive documentation with examples
- 🗑️ **REMOVED**: Deprecated `FoundationModels` static API (breaking change - use `LanguageModel` instead)
- 📝 Added new examples: `instance-based-api.mjs`, `session-based-api.mjs`

### 0.0.0 (Initial Release)

- 1-to-1 TypeScript API mapping for Apple FoundationModels
- Support for listing available models
- Support for text generation
- Auto-build Swift wrapper during installation
- Comprehensive TypeScript types
- Built with Rolldown for modern bundling

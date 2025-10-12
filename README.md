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

### Instance-based API (Recommended - 1-to-1 Swift mapping)

The new `LanguageModel` class provides a true 1-to-1 mapping with Apple's Swift API:

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

### Legacy Static API (Deprecated)

The original static API is still available for backward compatibility:

```typescript
import { FoundationModels } from 'apple-foundation-models';

// List available models
const models = await FoundationModels.listAvailableModels();

// Generate text
const result = await FoundationModels.generateText({
  prompt: 'Write a haiku about TypeScript',
  maxTokens: 100,
  temperature: 0.7,
});
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

### `FoundationModels` (Deprecated)

Legacy static API wrapper for backward compatibility.

### `FoundationModels.listAvailableModels()`

Returns a list of available language models.

**Returns**: `Promise<LanguageModelInfo[]>`

```typescript
interface LanguageModelInfo {
  id: string;          // Unique identifier
  name: string;        // Human-readable name
  maxTokens: number;   // Maximum tokens
}
```

### `FoundationModels.generateText(params)`

Generates text using a language model.

**Parameters**:
```typescript
interface GenerateTextParams {
  prompt: string;       // Input prompt
  modelId?: string;     // Optional model ID
  maxTokens?: number;   // Maximum tokens to generate
  temperature?: number; // Sampling temperature (0.0-1.0)
}
```

**Returns**: `Promise<GenerationResult>`

```typescript
interface GenerationResult {
  text: string;              // Generated text
  finishReason: FinishReason; // Why generation stopped
}

enum FinishReason {
  Stop = 'stop',                    // Natural completion
  Length = 'length',                // Hit token limit
  ContentFilter = 'contentFilter',  // Content filtered
  Unknown = 'unknown',              // Unknown reason
}
```

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

### 0.0.0 (Initial Release)

- 1-to-1 TypeScript API mapping for Apple FoundationModels
- Support for listing available models
- Support for text generation
- Auto-build Swift wrapper during installation
- Comprehensive TypeScript types
- Built with Rolldown for modern bundling

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

### Basic Example

```typescript
import { FoundationModels } from 'apple-foundation-models';

// List available models
const models = await FoundationModels.listAvailableModels();
console.log('Available models:', models);

// Generate text
const result = await FoundationModels.generateText({
  prompt: 'Write a haiku about TypeScript',
  maxTokens: 100,
  temperature: 0.7,
});

console.log('Generated text:', result.text);
console.log('Finish reason:', result.finishReason);
```

### Using Specific Models

```typescript
import { FoundationModels } from 'apple-foundation-models';

// Get available models
const models = await FoundationModels.listAvailableModels();
const modelId = models[0].id;

// Generate with specific model
const result = await FoundationModels.generateText({
  prompt: 'Explain quantum computing',
  modelId: modelId,
  maxTokens: 200,
  temperature: 0.8,
});
```

## API Reference

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

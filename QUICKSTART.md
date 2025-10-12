# Quick Start Guide

Get started with Apple Foundation Models for JavaScript in minutes!

## Prerequisites

Before you begin, ensure you have:

- ✅ macOS 15.0 (Sequoia) or later
- ✅ Node.js 18.0.0 or later
- ✅ Swift 6.0 or later (comes with Xcode)
- ✅ Xcode Command Line Tools installed

### Check Your System

```bash
# Check macOS version
sw_vers

# Check Node.js version
node --version

# Check Swift version
swift --version

# Install Xcode Command Line Tools (if needed)
xcode-select --install
```

## Installation

```bash
npm install apple-foundation-models
```

The package will automatically build the Swift wrapper during installation.

## Your First Program

Create a file `hello.mjs`:

```javascript
import { FoundationModels } from 'apple-foundation-models';

// List available models
const models = await FoundationModels.listAvailableModels();
console.log('Available models:', models);

// Generate text
const result = await FoundationModels.generateText({
  prompt: 'Hello, Foundation Models!',
  maxTokens: 50,
});

console.log('Generated:', result.text);
```

Run it:

```bash
node hello.mjs
```

## Common Use Cases

### 1. Simple Text Generation

```javascript
const result = await FoundationModels.generateText({
  prompt: 'Write a haiku about coding',
  maxTokens: 100,
  temperature: 0.7,
});

console.log(result.text);
```

### 2. Using Specific Models

```javascript
const models = await FoundationModels.listAvailableModels();
const modelId = models[0].id;

const result = await FoundationModels.generateText({
  prompt: 'Explain quantum computing',
  modelId: modelId,
  maxTokens: 200,
  temperature: 0.8,
});
```

### 3. Error Handling

```javascript
try {
  const result = await FoundationModels.generateText({
    prompt: 'Your prompt here',
  });
  console.log(result.text);
} catch (error) {
  console.error('Generation failed:', error.message);
}
```

## Next Steps

- 📖 Read the [full documentation](README.md)
- 🔍 Explore [examples](examples/)
- 🐛 [Report issues](https://github.com/johnhenry/AppleFoundationModelsForJavascript/issues)
- 🤝 [Contribute](CONTRIBUTING.md)

## Troubleshooting

### "Platform not supported" error

This package only works on macOS 15.0 or later. Verify your macOS version:

```bash
sw_vers
```

### Swift build fails

Make sure Swift and Xcode Command Line Tools are installed:

```bash
swift --version
xcode-select --install
```

### Module not found

Rebuild the project:

```bash
npm run build
```

### Swift wrapper not found

Build the Swift wrapper manually:

```bash
npm run build:swift
```

## Getting Help

- 📧 [Open an issue](https://github.com/johnhenry/AppleFoundationModelsForJavascript/issues)
- 💬 Check existing [discussions](https://github.com/johnhenry/AppleFoundationModelsForJavascript/discussions)

Happy coding! 🎉

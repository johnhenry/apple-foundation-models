# Apple Foundation Models for JavaScript

[![npm version](https://img.shields.io/npm/v/%40johnhenry%2Fapple-foundation-models.svg)](https://www.npmjs.com/package/@johnhenry/apple-foundation-models)
[![CI](https://github.com/johnhenry/apple-foundation-models/actions/workflows/ci.yml/badge.svg)](https://github.com/johnhenry/apple-foundation-models/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/%40johnhenry%2Fapple-foundation-models.svg)](LICENSE)

Full documentation: [opensource.johnhenry.me/apple-foundation-models](https://opensource.johnhenry.me/apple-foundation-models/)

Previously published as `apple-foundation-models`; last unscoped version was
`0.0.1`. This package now publishes as `@johnhenry/apple-foundation-models`,
restarting its version at `0.0.0` — see [CHANGELOG.md](CHANGELOG.md) for the
full migration entry.

A TypeScript wrapper providing 1-to-1 API translation of Apple's [FoundationModels](https://developer.apple.com/documentation/FoundationModels) framework for use in Node.js and JavaScript applications.

## Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Overview](#api-overview)
- [Architecture](#architecture)
- [Tool Support](#tool-support)
- [Examples](#examples)
- [Documentation](#documentation)
- [Limitations](#limitations)
- [Security model](#security-model)
- [Family](#family)
- [Related Projects](#related-projects)
- [License](#license)
- [Contributing](#contributing)

## Features

- 🎯 **1-to-1 API Translation**: Direct mapping from Swift to TypeScript/JavaScript
- 📦 **Type-Safe**: Full TypeScript support with comprehensive type definitions
- 🔄 **Instance & Session APIs**: Both single-generation and conversational interfaces
- 🛠️ **Tool Support**: Complete tool/function calling support with automatic execution ✅
- 🚀 **Auto-Build**: Swift wrapper builds automatically during npm install
- 🍎 **Native Performance**: Leverages Apple's on-device AI models
- 🔒 **Privacy-First**: All processing happens on-device

## Requirements

- **macOS**: 26.0 (Tahoe) or later
- **Node.js**: 26.0.0+
- **Swift**: 6.0+ (included with Xcode)
- **Architecture**: Apple Silicon (ARM64)

## Installation

```bash
npm install @johnhenry/apple-foundation-models
```

The Swift wrapper builds automatically during installation. To rebuild manually:

```bash
npm run build:swift
```

## Quick Start

### SystemLanguageModel (Instance-based API)

```typescript
import { SystemLanguageModel, LanguageModelSession }
  from '@johnhenry/apple-foundation-models';

// Get default model
const model = SystemLanguageModel.default;

// Check availability
if (!model.isAvailable) {
  console.log('Model not available');
  return;
}

// Create session and generate
const session = new LanguageModelSession(model);
const response = await session.respond('Write a haiku about TypeScript');

console.log(response.content);
```

### LanguageModelSession (Conversational API)

```typescript
import { SystemLanguageModel, LanguageModelSession, Instructions }
  from '@johnhenry/apple-foundation-models';

// Create session with instructions
const model = SystemLanguageModel.default;
const session = new LanguageModelSession(
  model,
  undefined, // guardrails (use default)
  [],        // tools
  new Instructions('You are a helpful coding assistant.')
);

// Multi-turn conversation
const response1 = await session.respond('What is TypeScript?');
console.log(response1.content);

const response2 = await session.respond('How is it different from JavaScript?');
console.log(response2.content);

// Access conversation history
console.log('Transcript entries:', session.transcript.length);
```

## API Overview

### Swift vs JavaScript/TypeScript

This library provides a 1-to-1 translation of Apple's FoundationModels API:

| Swift | JavaScript/TypeScript |
|-------|----------------------|
| `SystemLanguageModel.default` | `SystemLanguageModel.default` |
| `model.availability` | `model.availability` (getter) |
| `model.isAvailable` | `model.isAvailable` (getter) |
| `LanguageModelSession(model:)` | `new LanguageModelSession(model)` |
| `session.respond(to:)` | `await session.respond(prompt)` |
| `session.streamResponse(to:)` | `session.streamResponse(prompt)` |
| `session.transcript` | `session.transcript` (getter) |
| `session.isResponding` | `session.isResponding` (getter) |

See [API_REFERENCE.md](API_REFERENCE.md) for complete API documentation with side-by-side examples.

## Architecture

```
┌─────────────────┐
│  JavaScript App │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  TypeScript API │  SystemLanguageModel, LanguageModelSession
└────────┬────────┘
         │ JSON over stdin/stdout
         ▼
┌─────────────────┐
│ Swift Executable│  AppleFoundationModelsWrapper
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│FoundationModels│  Apple's Native Framework
│   (Apple SDK)   │
└─────────────────┘
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed technical architecture.

## Tool Support

**NEW**: Complete tool/function calling support with automatic execution!

```typescript
import { LanguageModelSession, ToolOutput } from '@johnhenry/apple-foundation-models';

// Define tools the model can use
const weatherTool = {
  name: 'getWeather',
  description: 'Get current weather for a city',
  async call(args) {
    const weather = await fetchWeatherAPI(args.city);
    return new ToolOutput(weather);
  }
};

const calcTool = {
  name: 'calculate',
  description: 'Perform mathematical calculations',
  async call(args) {
    const result = eval(`${args.a} ${args.op} ${args.b}`);
    return new ToolOutput(result);
  }
};

// Create session with tools
const session = new LanguageModelSession(
  undefined,        // model (uses default)
  undefined,        // guardrails
  [weatherTool, calcTool]  // tools
);

// Model can now call tools automatically
const response = await session.respond("What's 25 * 4?");
console.log(response.content);

// Important: Close session to cleanup server
await session.close();
```

**Key Features**:
- 🔧 Zero-config automatic tool execution
- 🚀 Modal architecture - zero performance impact for sessions without tools
- 🔒 Unix domain socket for secure bidirectional communication
- 📝 Full TypeScript types for tool definitions

See [IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md) for complete documentation.

## Examples

### Check Model Availability

```typescript
import { SystemLanguageModel, Availability }
  from '@johnhenry/apple-foundation-models';

const model = SystemLanguageModel.default;
const availability = model.availability;

switch (availability) {
  case Availability.Available:
    console.log('Model is ready!');
    break;
  case Availability.DeviceNotEligible:
    console.log('Device not eligible');
    break;
  case Availability.AppleIntelligenceNotEnabled:
    console.log('Apple Intelligence not enabled');
    break;
  case Availability.ModelNotReady:
    console.log('Model is downloading');
    break;
}
```

### Use Case-Specific Models

```typescript
import { SystemLanguageModel, UseCase, LanguageModelSession }
  from '@johnhenry/apple-foundation-models';

// Create model for content tagging
const model = new SystemLanguageModel(UseCase.ContentTagging);
const session = new LanguageModelSession(model);

const response = await session.respond(
  'Extract tags from: "TypeScript is a typed superset of JavaScript"'
);
```

### Streaming Responses

```typescript
import { SystemLanguageModel, LanguageModelSession }
  from '@johnhenry/apple-foundation-models';

const session = new LanguageModelSession(SystemLanguageModel.default);
const stream = session.streamResponse('Write a story about AI');

for await (const chunk of stream) {
  process.stdout.write(chunk);
}
```

### Generation Options

```typescript
import { LanguageModelSession, SamplingMode }
  from '@johnhenry/apple-foundation-models';

const session = new LanguageModelSession();
const options = {
  sampling: SamplingMode.Random,
  temperature: 0.8,
  maximumResponseTokens: 200
};

const response = await session.respond('Write a creative poem', options);
```

## Documentation

- [API Reference](API_REFERENCE.md) - Complete API with Swift ↔ JavaScript examples
- [Architecture](ARCHITECTURE.md) - Technical implementation details
- [Tool Execution Architecture](TOOL_EXECUTION_ARCHITECTURE.md) - Solutions for automatic tool execution
- [Unix Socket Modal Design](UNIX_SOCKET_MODAL_DESIGN.md) - Recommended architecture with zero performance impact
- [Contributing](CONTRIBUTING.md) - Development and contribution guide
- [Changelog](CHANGELOG.md) - Version history

## Limitations

- **Platform**: macOS 26.0+ (Tahoe) only, Apple Silicon (ARM64) only.
- **Offline**: Requires internet for the initial on-device model download via
  Apple Intelligence; generation itself is fully on-device afterward.
- **Tool Execution**: automatic tool/function-calling execution IS
  implemented (see [IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md)
  and `test/tool-end-to-end.test.mjs`) — an earlier version of this section
  said otherwise; that was stale, not a current caveat.

## Security model

This package spawns a local Swift subprocess (`AppleFoundationModelsWrapper`)
and talks to it over stdin/stdout for single calls, or a Unix domain socket
for sessions that use tools. Everything runs on-device: no network calls are
made by this package itself (the OS-level Apple Intelligence model download
is the one exception, and that is Apple's, not this package's).

**What this package guarantees:**

- **No network I/O of its own.** Every text-generation call is a local
  process/socket round trip to the Swift wrapper, which calls Apple's
  on-device `FoundationModels` framework directly — this package never makes
  an HTTP request.
- **The Unix domain socket used for tool-enabled sessions is local-only and
  per-session.** `PersistentServerExecutor` creates one socket file per
  session (under the OS temp directory) and the Swift server shuts down and
  removes it when the session is closed or the process receives SIGTERM
  (see `SOCKET_CLEANUP_FIX.md`).

**What is still yours:**

- **Tool execution trust boundary.** When a session is created with tools,
  the model can decide to invoke any tool function the *calling application*
  registered, and that tool's `call()` implementation runs with whatever
  privileges the calling process has — this package does not sandbox tool
  code. If your tool wraps something dangerous (shelling out, writing files,
  hitting an internal API), an LLM choosing when to call it is your trust
  boundary to design, not this package's. The `weatherTool`/`calcTool`
  examples in this README are illustrative only; the `eval()` call in the
  `calculate` example above is a placeholder for demonstration, not a
  pattern to ship.
- **What the model outputs.** This package does not validate, filter, or
  sanitize generated text or tool-call arguments beyond what Apple's own
  `Guardrails` type provides; anything you do with a response (render it as
  HTML, execute it, pass it to another system) is on you.

## Family

`@johnhenry/apple-foundation-models` isn't consumed only directly -- it's
also the on-device backend that [`@johnhenry/aimatey-native-apple`](https://github.com/johnhenry/aimatey)
wraps as a `BackendAdapter` inside the [aimatey](https://github.com/johnhenry/aimatey)
ecosystem.

- **[`@johnhenry/aimatey-native-apple`](https://github.com/johnhenry/aimatey/tree/main/packages/native-apple)**
  -- dynamically `import()`s this package at runtime (an optional peer, not
  a hard `package.json` dependency: `npm install @johnhenry/aimatey-native-apple
  @johnhenry/apple-foundation-models`) and adapts `SystemLanguageModel` /
  `LanguageModelSession` to aimatey's `Bridge` interface, so any aimatey
  frontend adapter (e.g. the OpenAI-compatible one) can run against Apple's
  on-device model with no API key, no network, and no cost. As of this
  writing that dynamic import still targets the pre-scope specifier
  (`'apple-foundation-models'`); it will need its own follow-up update to
  target `'@johnhenry/apple-foundation-models'`.

## Related Projects

- [llm-cli](https://github.com/johnhenry/llm-cli) - Command-line interface for LLMs
- [Apple FoundationModels](https://developer.apple.com/documentation/FoundationModels) - Official Swift documentation

## License

MIT

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

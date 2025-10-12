# Apple Foundation Models Examples

This directory contains examples demonstrating the Apple Foundation Models JavaScript wrapper.

## Basic Examples (✅ Working)

### [basic-usage.mjs](basic-usage.mjs)
Simple text generation with the system language model.

**Run**:
```bash
node examples/basic-usage.mjs
```

### [streaming.mjs](streaming.mjs)
Real-time streaming text generation with visual progress.

**Run**:
```bash
node examples/streaming.mjs
```

### [session-based-api.mjs](session-based-api.mjs)
Multi-turn conversations with context and instructions.

**Run**:
```bash
node examples/session-based-api.mjs
```

## Advanced Examples

### [tools-manual.mjs](tools-manual.mjs) (⚠️ Manual Tool Execution)
Demonstrates the Tool type and manual tool execution pattern.

**Status**: TypeScript implementation complete. This example shows how to:
- Define tools with the Tool interface
- Create sessions with tools
- Manually handle tool calls from responses

**Run**:
```bash
node examples/tools-manual.mjs
```

**Note**: Automatic tool execution requires the persistent server, which is currently being finalized. See [TOOL_MODAL_STATUS.md](../TOOL_MODAL_STATUS.md) for details.

## Tool Support Status

### ✅ Implemented
- Tool interface types (Tool, ToolCall, ToolOutput)
- LanguageModelSession accepts tools parameter
- Modal executor architecture (automatic selection)
- ProcessPerCallExecutor (fast path, no tools)
- PersistentServerExecutor TypeScript client

### ⚠️ In Progress
- Unix socket listener in Swift server (needs POSIX sockets)
- End-to-end automatic tool execution

### 📚 Documentation
- [TOOL_MODAL_STATUS.md](../TOOL_MODAL_STATUS.md) - Current status and test results
- [TOOL_EXECUTION_ARCHITECTURE.md](../TOOL_EXECUTION_ARCHITECTURE.md) - Architecture design
- [UNIX_SOCKET_MODAL_DESIGN.md](../UNIX_SOCKET_MODAL_DESIGN.md) - Modal design rationale

## Running Examples

All examples require:
- macOS 26.0+ (Sequoia 16.0+)
- Apple Intelligence enabled
- Foundation Models available

Check model availability:
```javascript
import { SystemLanguageModel } from './dist/index.mjs';
const model = SystemLanguageModel.default;
console.log('Available:', model.isAvailable);
```

## Creating Your Own Examples

### Basic Pattern
```javascript
import { SystemLanguageModel, LanguageModelSession } from '../dist/index.mjs';

const model = SystemLanguageModel.default;
const session = new LanguageModelSession(model);

const response = await session.respond('Your prompt here');
console.log(response.content);
```

### Streaming Pattern
```javascript
const stream = session.streamResponse('Your prompt here');
for await (const chunk of stream) {
  process.stdout.write(chunk);
}
```

### With Instructions
```javascript
import { Instructions } from '../dist/index.mjs';

const session = new LanguageModelSession(
  model,
  undefined, // guardrails (optional)
  [],        // tools (optional)
  new Instructions('You are a helpful assistant.')
);
```

### With Generation Options
```javascript
import { SamplingMode } from '../dist/index.mjs';

const response = await session.respond('Your prompt', {
  sampling: SamplingMode.Random,
  temperature: 0.8,
  maximumResponseTokens: 500
});
```

## Performance

**Without Tools** (default):
- Uses ProcessPerCallExecutor
- ~1.0s per generation
- Zero overhead vs. direct Swift calls

**With Tools** (when implemented):
- Uses PersistentServerExecutor
- ~1.2s first call (includes server startup)
- ~0.7s subsequent calls
- Requires `await session.close()` for cleanup

## Troubleshooting

**Model not available**:
- Check macOS version (requires 26.0+)
- Enable Apple Intelligence in System Settings
- Verify FoundationModels framework is available

**Build errors**:
```bash
npm run build        # Build both TypeScript and Swift
npm run build:swift  # Build Swift only
npm run build:js     # Build JavaScript only
```

**Test the installation**:
```bash
npm test  # Run all tests
node try.mjs  # Quick streaming test
```

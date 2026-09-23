# apple-foundation-models examples

Runnable examples demonstrating the Apple Foundation Models JavaScript wrapper.
All of them call the real, on-device `FoundationModels` framework through the
Swift bridge -- nothing here is mocked or simulated.

| Example | Demonstrates |
| --- | --- |
| [`basic-usage.mjs`](./basic-usage.mjs) | Simple text generation with `SystemLanguageModel.default` and a single `LanguageModelSession.respond()` call. |
| [`instance-based-api.mjs`](./instance-based-api.mjs) | The instance-based API surface (`SystemLanguageModel`, availability checks, use-case-specific models). |
| [`session-based-api.mjs`](./session-based-api.mjs) | Multi-turn conversations -- context and `Instructions` persist across `session.respond()` calls within one session. |
| [`advanced-usage.mjs`](./advanced-usage.mjs) | Model discovery, retry-on-failure generation, and troubleshooting output when the platform check or Swift build fails. |
| [`tools-manual.mjs`](./tools-manual.mjs) | The `Tool`/`ToolOutput` interface and automatic tool-call execution end to end -- the model can invoke a registered tool and receive its result mid-response. |

## Tool support status

Automatic tool execution (a Unix-domain-socket persistent server so the model
can call registered tools without a new process per call) is **fully
implemented and covered by `test/tool-end-to-end.test.mjs`**, not in-progress
-- see [`IMPLEMENTATION_COMPLETE.md`](../IMPLEMENTATION_COMPLETE.md) and
[`TOOL_EXECUTION_ARCHITECTURE.md`](../TOOL_EXECUTION_ARCHITECTURE.md) for the
design. (`TOOL_MODAL_STATUS.md` in the repo root predates that completion and
describes an intermediate 90% state; treat `IMPLEMENTATION_COMPLETE.md` as the
current source of truth if the two ever disagree.)

## Running

```bash
node examples/basic-usage.mjs
node examples/instance-based-api.mjs
node examples/session-based-api.mjs
node examples/advanced-usage.mjs
node examples/tools-manual.mjs
```

## Runtime requirements (honest edition)

- **macOS 26.0+ (Tahoe)** -- the `FoundationModels` framework this package
  wraps does not exist on earlier macOS releases, regardless of Node version.
- **Apple Intelligence enabled** in System Settings -- without it,
  `SystemLanguageModel.default.isAvailable` is `false` and every example that
  doesn't check availability first will throw.
- **Apple Silicon (ARM64)** -- see the root README's Requirements section.

Check availability before running anything that generates text:

```javascript
import { SystemLanguageModel } from '../dist/index.mjs';
const model = SystemLanguageModel.default;
console.log('Available:', model.isAvailable);
```

## Creating your own examples

### Basic pattern
```javascript
import { SystemLanguageModel, LanguageModelSession } from '../dist/index.mjs';

const model = SystemLanguageModel.default;
const session = new LanguageModelSession(model);

const response = await session.respond('Your prompt here');
console.log(response.content);
```

### Streaming pattern
```javascript
const stream = session.streamResponse('Your prompt here');
for await (const chunk of stream) {
  process.stdout.write(chunk);
}
```

### With instructions
```javascript
import { Instructions } from '../dist/index.mjs';

const session = new LanguageModelSession(
  model,
  undefined, // guardrails (optional)
  [],        // tools (optional)
  new Instructions('You are a helpful assistant.')
);
```

### With generation options
```javascript
import { SamplingMode } from '../dist/index.mjs';

const response = await session.respond('Your prompt', {
  sampling: SamplingMode.Random,
  temperature: 0.8,
  maximumResponseTokens: 500
});
```

## Performance

**Without tools** (default):
- Uses `ProcessPerCallExecutor`
- ~1.0s per generation
- Zero overhead vs. direct Swift calls

**With tools**:
- Uses `PersistentServerExecutor`
- ~1.2s first call (includes server startup)
- ~0.7s subsequent calls
- Requires `await session.close()` for cleanup

## Troubleshooting

**Model not available**:
- Check macOS version (requires 26.0+)
- Enable Apple Intelligence in System Settings
- Verify the `FoundationModels` framework is available

**Build errors**:
```bash
npm run build        # Build both TypeScript and Swift
npm run build:swift  # Build Swift only
npm run build:js     # Build JavaScript only
```

**Test the installation**:
```bash
npm test        # Run all tests
node try.mjs     # Quick streaming test
```

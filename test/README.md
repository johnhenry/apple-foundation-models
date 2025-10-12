# Test Suite

This directory contains comprehensive tests for the apple-foundation-models package.

## Test Files

### `basic.test.mjs`
Core API surface tests - verifies that all expected exports exist and have the correct types.

**Tests:**
- Module exports (classes, enums, types)
- Static properties (SystemLanguageModel.default, etc.)
- Instance creation and properties
- Method existence
- Basic type validation

**Run:** Always runs by default

### `integration.test.mjs`
Real API integration tests that actually call the Swift wrapper and FoundationModels framework.

**Tests:**
- Actual text generation
- Conversation history maintenance
- Instructions and persona handling
- GenerationOptions behavior
- Multiple independent sessions
- Specialized models (ContentTagging)
- Edge cases (empty/long prompts)
- Transcript structure validation

**Requirements:**
- macOS 26.0+
- FoundationModels framework available
- Swift wrapper built

**Skip:** Set `NODE_TEST_SKIP_INTEGRATION=1` to skip

### `edge-cases.test.mjs`
Boundary conditions, error handling, and unusual inputs.

**Tests:**
- Singleton behavior
- Read-only properties
- Empty/null values
- Very long inputs
- Special characters
- Extreme but valid values
- State isolation between instances
- Enum value validation

**Run:** Always runs by default

### `swift-wrapper.test.mjs`
Node.js ↔ Swift bridge communication tests.

**Tests:**
- Swift executable existence
- Swift build artifacts
- executeSwiftCommand function
- Command/response format
- Error handling
- Parameter validation
- Special characters in data
- Performance (timeouts)
- Multiple sequential commands

**Requirements:**
- Swift wrapper built (`npm run build:swift`)

**Skip:** Set `NODE_TEST_SKIP_SWIFT=1` to skip

## Running Tests

### Run all tests
```bash
npm test
```

### Run without integration tests
```bash
NODE_TEST_SKIP_INTEGRATION=1 npm test
```

### Run without Swift wrapper tests
```bash
NODE_TEST_SKIP_SWIFT=1 npm test
```

### Run only basic tests
```bash
NODE_TEST_SKIP_INTEGRATION=1 NODE_TEST_SKIP_SWIFT=1 npm test
```

### Run specific test file
```bash
node --test test/basic.test.mjs
```

## Test Categories

### Unit Tests (always run)
- `basic.test.mjs` - API surface
- `edge-cases.test.mjs` - Edge cases

### Integration Tests (require macOS 26.0+)
- `integration.test.mjs` - Real API calls
- `swift-wrapper.test.mjs` - Swift bridge

## CI/CD Recommendations

For CI environments that don't have macOS 26.0+ or the Swift wrapper:

```bash
# Run only unit tests
NODE_TEST_SKIP_INTEGRATION=1 NODE_TEST_SKIP_SWIFT=1 npm test
```

For full test suite on macOS 26.0+:

```bash
# Build Swift wrapper first
npm run build:swift

# Run all tests
npm test
```

## Adding New Tests

When adding new tests:

1. Choose the appropriate test file based on category
2. Use descriptive test names
3. Add skip conditions if tests require specific environment
4. Document any special requirements
5. Use assert for validation
6. Add comments explaining complex test logic

## Test Output

The test runner will show:
- ✔ Passed tests
- ✖ Failed tests
- Summary: pass/fail count, duration

Example:
```
✔ module exports SystemLanguageModel class (0.5ms)
✔ SystemLanguageModel has default static property (0.1ms)
✖ Some failing test (0.3ms)
ℹ tests 21
ℹ pass 20
ℹ fail 1
```

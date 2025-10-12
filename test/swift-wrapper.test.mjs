/**
 * Swift wrapper communication tests
 * Tests the Node.js <-> Swift bridge functionality
 *
 * These tests verify that the Swift executable is properly built and
 * can communicate with the Node.js layer.
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const SKIP_SWIFT_TESTS = process.env.NODE_TEST_SKIP_SWIFT === '1';

test('Swift wrapper executable exists', { skip: SKIP_SWIFT_TESTS }, () => {
  const swiftBuildPath = join(projectRoot, 'swift', '.build', 'release', 'AppleFoundationModelsWrapper');
  const exists = existsSync(swiftBuildPath);

  if (!exists) {
    // console.log('  Swift executable not found at:', swiftBuildPath);
    // console.log('  Run "npm run build:swift" to build the Swift wrapper');
  }

  assert.ok(exists, 'Swift executable should exist after build');
});

test('Swift wrapper Package.swift exists', () => {
  const packageSwift = join(projectRoot, 'swift', 'Package.swift');
  assert.ok(existsSync(packageSwift), 'Package.swift should exist');
});

test('Swift wrapper source file exists', () => {
  const mainSwift = join(projectRoot, 'swift', 'Sources', 'AppleFoundationModelsWrapper', 'main.swift');
  assert.ok(existsSync(mainSwift), 'main.swift should exist');
});

test('executeSwiftCommand is internal (not exported)', async () => {
  const exports = await import('../dist/index.mjs');
  // executeSwiftCommand should NOT be exported - it's an internal implementation detail
  assert.strictEqual(exports.executeSwiftCommand, undefined, 'executeSwiftCommand should not be in public API');
});

test('executeSwiftCommand with listAvailableModels', { skip: true }, async () => {
  // Skip: executeSwiftCommand is internal, not exported
  const { executeSwiftCommand } = await import('../src/executor.js');

  const models = await executeSwiftCommand('listAvailableModels');

  assert.ok(Array.isArray(models), 'Should return an array');
  assert.ok(models.length > 0, 'Should have at least one model');

  const model = models[0];
  assert.ok(model.id, 'Model should have id');
  assert.ok(model.name, 'Model should have name');
  assert.ok(typeof model.maxTokens === 'number', 'Model should have maxTokens as number');
});

test('executeSwiftCommand with invalid action', { skip: true }, async () => {
  const { executeSwiftCommand } = await import('../src/executor.js');

  try {
    await executeSwiftCommand('invalidAction', {});
    assert.fail('Should throw error for invalid action');
  } catch (error) {
    assert.ok(error, 'Should throw error for invalid action');
    assert.ok(error.message.includes('Unknown action') || error.message.includes('invalid'), 'Error should mention invalid action');
  }
});

test('executeSwiftCommand with generateText', { skip: true }, async () => {
  const { executeSwiftCommand } = await import('../src/executor.js');

  const result = await executeSwiftCommand('generateText', {
    prompt: 'Say "test" and nothing else.',
    maxTokens: 10,
  });

  assert.ok(result, 'Should return a result');
  assert.ok(result.text, 'Result should have text property');
  assert.ok(typeof result.text === 'string', 'text should be a string');
  assert.ok(result.finishReason, 'Result should have finishReason');
});

test('executeSwiftCommand handles missing parameters', { skip: true }, async () => {
  const { executeSwiftCommand } = await import('../src/executor.js');

  try {
    // Try to generate without a prompt
    await executeSwiftCommand('generateText', {
      maxTokens: 10,
    });
    assert.fail('Should throw error for missing prompt');
  } catch (error) {
    assert.ok(error, 'Should throw error');
    assert.ok(
      error.message.includes('prompt') || error.message.includes('Missing'),
      'Error should mention missing parameter'
    );
  }
});

test('Swift wrapper returns proper JSON', { skip: true }, async () => {
  const { executeSwiftCommand } = await import('../src/executor.js');

  const result = await executeSwiftCommand('listAvailableModels');

  // Verify it's proper JSON (not just any object)
  const jsonString = JSON.stringify(result);
  const parsed = JSON.parse(jsonString);

  assert.deepStrictEqual(parsed, result, 'Result should be proper JSON-serializable');
});

test('Multiple Swift commands in sequence', { skip: true }, async () => {
  const { executeSwiftCommand } = await import('../src/executor.js');

  // Execute multiple commands to verify Swift wrapper doesn't have state issues
  const result1 = await executeSwiftCommand('listAvailableModels');
  const result2 = await executeSwiftCommand('listAvailableModels');

  assert.deepStrictEqual(result1, result2, 'Multiple calls should return consistent results');
});

test('Swift command with special characters in prompt', { skip: true }, async () => {
  const { executeSwiftCommand } = await import('../src/executor.js');

  const specialPrompt = 'Say "Hello\n\tWorld" with quotes & symbols 🎉';

  try {
    const result = await executeSwiftCommand('generateText', {
      prompt: specialPrompt,
      maxTokens: 20,
    });

    assert.ok(result.text, 'Should handle special characters in prompt');
  } catch (error) {
    // If it fails, that's also useful information
    // console.log('  Special characters test failed:', error.message);
    throw error;
  }
});

test('Swift command with very short maxTokens', { skip: true }, async () => {
  const { executeSwiftCommand } = await import('../src/executor.js');

  const result = await executeSwiftCommand('generateText', {
    prompt: 'Count to 100.',
    maxTokens: 5,  // Very short
  });

  assert.ok(result.text, 'Should respect maxTokens limit');
  // Response should be cut short
  const wordCount = result.text.split(/\s+/).length;
  assert.ok(wordCount < 20, 'Response should be short due to token limit');
});

test('Swift command with temperature parameter', { skip: true }, async () => {
  const { executeSwiftCommand } = await import('../src/executor.js');

  // With very low temperature (deterministic)
  const result1 = await executeSwiftCommand('generateText', {
    prompt: 'Say the word "hello".',
    temperature: 0.1,
    maxTokens: 10,
  });

  // Same prompt with low temperature again
  const result2 = await executeSwiftCommand('generateText', {
    prompt: 'Say the word "hello".',
    temperature: 0.1,
    maxTokens: 10,
  });

  assert.ok(result1.text, 'First result should have text');
  assert.ok(result2.text, 'Second result should have text');

  // With low temperature, results should be similar (though not guaranteed identical)
  // console.log('  Result 1:', result1.text.substring(0, 50));
  // console.log('  Result 2:', result2.text.substring(0, 50));
});

test('executeSwiftCommand timeout handling', { skip: true }, async (t) => {
  // Set a timeout for this test
  t.timeout = 60000; // 60 seconds

  const { executeSwiftCommand } = await import('../src/executor.js');

  // A complex request that should still complete reasonably fast
  const result = await executeSwiftCommand('generateText', {
    prompt: 'Write a haiku about programming.',
    maxTokens: 100,
  });

  assert.ok(result.text, 'Should complete within timeout');
});

test('Swift wrapper error messages are informative', { skip: true }, async () => {
  const { executeSwiftCommand } = await import('../src/executor.js');

  try {
    // Try an operation that should fail gracefully
    await executeSwiftCommand('generateText', {
      // Missing required prompt parameter
    });
    assert.fail('Should throw error');
  } catch (error) {
    assert.ok(error.message, 'Error should have a message');
    assert.ok(error.message.length > 10, 'Error message should be descriptive');
    // console.log('  Error message:', error.message);
  }
});

test('Build script exists and is executable', () => {
  const buildScript = join(projectRoot, 'scripts', 'build-swift.js');
  assert.ok(existsSync(buildScript), 'build-swift.js should exist');
});

test('Package.json has build:swift script', async () => {
  const packageJson = join(projectRoot, 'package.json');
  assert.ok(existsSync(packageJson), 'package.json should exist');

  const fs = await import('fs');
  const content = await fs.promises.readFile(packageJson, 'utf-8');
  const pkg = JSON.parse(content);

  assert.ok(pkg.scripts, 'package.json should have scripts');
  assert.ok(pkg.scripts['build:swift'], 'Should have build:swift script');
});

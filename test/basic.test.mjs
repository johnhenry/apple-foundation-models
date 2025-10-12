/**
 * Basic import test for the library
 * Tests that the module can be imported and has expected exports
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { FoundationModels } from '../dist/index.mjs';

test('module exports FoundationModels class', () => {
  assert.ok(FoundationModels, 'FoundationModels should be exported');
  assert.strictEqual(typeof FoundationModels, 'function', 'FoundationModels should be a class/constructor');
});

test('FoundationModels has expected methods', () => {
  assert.ok(typeof FoundationModels.listAvailableModels === 'function', 'listAvailableModels should be a function');
  assert.ok(typeof FoundationModels.generateText === 'function', 'generateText should be a function');
  assert.ok(typeof FoundationModels.generateStream === 'function', 'generateStream should be a function');
});

test('generateStream throws not implemented error', async () => {
  await assert.rejects(
    async () => {
      await FoundationModels.generateStream({ prompt: 'test' });
    },
    {
      message: /Streaming is not yet implemented/,
    },
    'generateStream should throw not implemented error'
  );
});

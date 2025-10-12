/**
 * Basic import test for the library
 * Tests that the module can be imported and has expected exports
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { SystemLanguageModel, LanguageModelSession, FinishReason, MessageRole } from '../dist/index.mjs';

// Test SystemLanguageModel class
test('module exports SystemLanguageModel class', () => {
  assert.ok(SystemLanguageModel, 'SystemLanguageModel should be exported');
  assert.strictEqual(typeof SystemLanguageModel, 'function', 'SystemLanguageModel should be a class/constructor');
});

test('SystemLanguageModel has default static property', () => {
  assert.ok('default' in SystemLanguageModel, 'SystemLanguageModel should have default static property');
  const defaultModel = SystemLanguageModel.default;
  assert.ok(defaultModel instanceof SystemLanguageModel, 'default should be a SystemLanguageModel instance');
});

test('SystemLanguageModel has availableModels static property', () => {
  assert.ok('availableModels' in SystemLanguageModel, 'SystemLanguageModel should have availableModels static property');
  assert.strictEqual(typeof SystemLanguageModel.availableModels, 'object', 'availableModels should return a Promise');
});

test('SystemLanguageModel can be instantiated', () => {
  const model = new SystemLanguageModel('test-model-id');
  assert.ok(model, 'SystemLanguageModel instance should be created');
  assert.strictEqual(model.id, 'test-model-id', 'Model ID should match constructor argument');
});

test('SystemLanguageModel instance has expected methods', () => {
  const model = new SystemLanguageModel('test-model-id');
  assert.ok(typeof model.generate === 'function', 'generate should be a function');
  assert.ok(typeof model.generateStream === 'function', 'generateStream should be a function');
  assert.ok(typeof model.getName === 'function', 'getName should be a function');
  assert.ok(typeof model.getMaxTokens === 'function', 'getMaxTokens should be a function');
});

test('SystemLanguageModel instance has isAvailable property', () => {
  const model = new SystemLanguageModel('test-model-id');
  assert.strictEqual(typeof model.isAvailable, 'boolean', 'isAvailable should be a boolean');
});

// Test LanguageModelSession class
test('module exports LanguageModelSession class', () => {
  assert.ok(LanguageModelSession, 'LanguageModelSession should be exported');
  assert.strictEqual(typeof LanguageModelSession, 'function', 'LanguageModelSession should be a class/constructor');
});

test('LanguageModelSession can be instantiated with model ID', () => {
  const session = new LanguageModelSession('test-model-id');
  assert.ok(session, 'LanguageModelSession instance should be created');
  assert.ok(session.languageModel, 'Session should have languageModel property');
});

test('LanguageModelSession can be instantiated with SystemLanguageModel instance', () => {
  const model = new SystemLanguageModel('test-model-id');
  const session = new LanguageModelSession(model);
  assert.ok(session, 'LanguageModelSession instance should be created with SystemLanguageModel');
  assert.strictEqual(session.languageModel, model, 'Session should use provided SystemLanguageModel instance');
});

test('LanguageModelSession has expected methods', () => {
  const session = new LanguageModelSession('test-model-id');
  assert.ok(typeof session.generate === 'function', 'generate should be a function');
  assert.ok(typeof session.generateStream === 'function', 'generateStream should be a function');
  assert.ok(typeof session.reset === 'function', 'reset should be a function');
});

test('LanguageModelSession messages property is accessible', () => {
  const session = new LanguageModelSession('test-model-id');
  assert.ok(Array.isArray(session.messages), 'messages should be an array');
  assert.strictEqual(session.messages.length, 0, 'messages should be empty initially');
});

test('LanguageModelSession with system prompt adds message to history', () => {
  const session = new LanguageModelSession('test-model-id', {
    systemPrompt: 'You are a helpful assistant.',
  });
  assert.strictEqual(session.messages.length, 1, 'messages should contain system prompt');
  assert.strictEqual(session.messages[0].role, MessageRole.System, 'first message should be system role');
  assert.strictEqual(session.messages[0].content, 'You are a helpful assistant.', 'system message content should match');
});

test('LanguageModelSession reset clears messages but preserves system prompt', () => {
  const session = new LanguageModelSession('test-model-id', {
    systemPrompt: 'Test prompt',
  });
  assert.strictEqual(session.messages.length, 1, 'should have system prompt');
  session.reset();
  assert.strictEqual(session.messages.length, 1, 'should still have system prompt after reset');
  assert.strictEqual(session.messages[0].role, MessageRole.System, 'should be system message');
});

// Test enums
test('module exports FinishReason enum', () => {
  assert.ok(FinishReason, 'FinishReason should be exported');
  assert.ok(FinishReason.Stop, 'FinishReason.Stop should exist');
  assert.ok(FinishReason.Length, 'FinishReason.Length should exist');
  assert.ok(FinishReason.ContentFilter, 'FinishReason.ContentFilter should exist');
  assert.ok(FinishReason.Unknown, 'FinishReason.Unknown should exist');
});

test('module exports MessageRole enum', () => {
  assert.ok(MessageRole, 'MessageRole should be exported');
  assert.ok(MessageRole.System, 'MessageRole.System should exist');
  assert.ok(MessageRole.User, 'MessageRole.User should exist');
  assert.ok(MessageRole.Assistant, 'MessageRole.Assistant should exist');
});

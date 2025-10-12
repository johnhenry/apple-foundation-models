/**
 * Basic import test for the library
 * Tests that the module can be imported and has expected exports
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { 
  SystemLanguageModel, 
  LanguageModelSession, 
  FinishReason, 
  MessageRole,
  Availability,
  UseCase,
  Instructions,
  Guardrails,
} from '../dist/index.mjs';

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

test('SystemLanguageModel can be instantiated with use case', () => {
  const model = new SystemLanguageModel(UseCase.ContentTagging);
  assert.ok(model, 'SystemLanguageModel instance should be created with UseCase');
  assert.ok(model.id, 'Model should have an ID');
});

test('SystemLanguageModel instance has expected methods', () => {
  const model = new SystemLanguageModel(UseCase.ContentTagging);
  assert.ok(typeof model.generate === 'function', 'generate should be a function');
  assert.ok(typeof model.generateStream === 'function', 'generateStream should be a function');
  assert.ok(typeof model.getName === 'function', 'getName should be a function');
  assert.ok(typeof model.getMaxTokens === 'function', 'getMaxTokens should be a function');
});

test('SystemLanguageModel instance has isAvailable property', () => {
  const model = SystemLanguageModel.default;
  assert.strictEqual(typeof model.isAvailable, 'boolean', 'isAvailable should be a boolean');
});

test('SystemLanguageModel instance has availability property', () => {
  const model = SystemLanguageModel.default;
  assert.ok(model.availability, 'availability property should exist');
  assert.ok(Object.values(Availability).includes(model.availability), 'availability should be a valid Availability enum value');
});

// Test LanguageModelSession class
test('module exports LanguageModelSession class', () => {
  assert.ok(LanguageModelSession, 'LanguageModelSession should be exported');
  assert.strictEqual(typeof LanguageModelSession, 'function', 'LanguageModelSession should be a class/constructor');
});

test('LanguageModelSession can be instantiated with defaults', () => {
  const session = new LanguageModelSession();
  assert.ok(session, 'LanguageModelSession instance should be created');
  // Note: languageModel property removed - doesn't exist in actual Swift API
  assert.ok(session.isResponding !== undefined, 'Session should have isResponding property');
});

test('LanguageModelSession can be instantiated with SystemLanguageModel instance', () => {
  const model = SystemLanguageModel.default;
  const session = new LanguageModelSession(model);
  assert.ok(session, 'LanguageModelSession instance should be created with SystemLanguageModel');
  // Note: languageModel property removed - doesn't exist in actual Swift API
  // The session internally uses the model, but doesn't expose it publicly
  assert.ok(session.transcript, 'Session should have transcript property');
});

test('LanguageModelSession can be instantiated with instructions', () => {
  const instructions = new Instructions('You are a helpful assistant.');
  const session = new LanguageModelSession(
    SystemLanguageModel.default,
    Guardrails.default,
    [],
    instructions
  );
  assert.ok(session, 'LanguageModelSession instance should be created with instructions');
  assert.strictEqual(session.transcript.length, 1, 'transcript should contain instructions');
});

test('LanguageModelSession has expected methods', () => {
  const session = new LanguageModelSession();
  assert.ok(typeof session.respond === 'function', 'respond should be a function');
  assert.ok(typeof session.streamResponse === 'function', 'streamResponse should be a function');
  assert.ok(typeof session.prewarm === 'function', 'prewarm should be a function');
  assert.ok(typeof session.prewarmWithPrefix === 'function', 'prewarmWithPrefix should be a function');
});

test('LanguageModelSession transcript property is accessible', () => {
  const session = new LanguageModelSession();
  assert.ok(Array.isArray(session.transcript), 'transcript should be an array');
  assert.strictEqual(session.transcript.length, 0, 'transcript should be empty initially');
});

test('LanguageModelSession has isResponding property', () => {
  const session = new LanguageModelSession();
  assert.strictEqual(typeof session.isResponding, 'boolean', 'isResponding should be a boolean');
  assert.strictEqual(session.isResponding, false, 'isResponding should be false initially');
});

test('LanguageModelSession with instructions adds to transcript', () => {
  const instructions = new Instructions('You are a helpful assistant.');
  const session = new LanguageModelSession(
    SystemLanguageModel.default,
    Guardrails.default,
    [],
    instructions
  );
  assert.strictEqual(session.transcript.length, 1, 'transcript should contain instructions entry');
  assert.strictEqual(session.transcript[0].type, 'instructions', 'entry should be instructions type');
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

test('module exports Availability enum', () => {
  assert.ok(Availability, 'Availability should be exported');
  assert.ok(Availability.Available, 'Availability.Available should exist');
  assert.ok(Availability.DeviceNotEligible, 'Availability.DeviceNotEligible should exist');
  assert.ok(Availability.AppleIntelligenceNotEnabled, 'Availability.AppleIntelligenceNotEnabled should exist');
  assert.ok(Availability.ModelNotReady, 'Availability.ModelNotReady should exist');
});

test('module exports UseCase enum', () => {
  assert.ok(UseCase, 'UseCase should be exported');
  assert.ok(UseCase.ContentTagging, 'UseCase.ContentTagging should exist');
});

test('module exports Instructions class', () => {
  assert.ok(Instructions, 'Instructions should be exported');
  const instructions = new Instructions('Test');
  assert.ok(instructions, 'Instructions instance should be created');
  assert.strictEqual(instructions.text, 'Test', 'Instructions should store text');
});

test('module exports Guardrails class', () => {
  assert.ok(Guardrails, 'Guardrails should be exported');
  assert.ok(Guardrails.default, 'Guardrails.default should exist');
  assert.ok(Guardrails.default instanceof Guardrails, 'Guardrails.default should be a Guardrails instance');
});

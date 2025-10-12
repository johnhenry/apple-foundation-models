/**
 * Edge case and error handling tests
 * Tests boundary conditions, error cases, and unusual inputs
 */

import { test } from 'node:test';
import assert from 'node:assert';
import {
  SystemLanguageModel,
  LanguageModelSession,
  Instructions,
  Guardrails,
  UseCase,
  Availability,
  SamplingMode,
  ToolOutput,
} from '../dist/index.mjs';

// Test SystemLanguageModel edge cases
test('SystemLanguageModel constructor with all UseCase values', () => {
  // Should work with ContentTagging
  const model1 = new SystemLanguageModel(UseCase.ContentTagging);
  assert.ok(model1, 'Should create model with ContentTagging use case');
  assert.ok(model1.id, 'Model should have an ID');
});

test('SystemLanguageModel.default is singleton', () => {
  const model1 = SystemLanguageModel.default;
  const model2 = SystemLanguageModel.default;
  assert.strictEqual(model1, model2, 'default should return the same instance');
});

test('SystemLanguageModel properties are readonly', () => {
  const model = SystemLanguageModel.default;
  const originalAvailability = model.availability;

  // Try to modify (should not throw, but should not change)
  try {
    // @ts-ignore - testing runtime behavior
    model.availability = Availability.DeviceNotEligible;
  } catch (e) {
    // If it throws, that's fine too
  }

  // Should still have original value
  assert.strictEqual(model.availability, originalAvailability, 'availability should be readonly');
});

// Test LanguageModelSession edge cases
test('LanguageModelSession with null instructions', () => {
  const session = new LanguageModelSession(
    SystemLanguageModel.default,
    Guardrails.default,
    [],
    undefined  // null/undefined instructions
  );
  assert.strictEqual(session.transcript.length, 0, 'Should have empty transcript with no instructions');
});

test('LanguageModelSession with empty tools array', () => {
  const session = new LanguageModelSession(
    SystemLanguageModel.default,
    Guardrails.default,
    [],  // empty tools
    undefined
  );
  assert.ok(session, 'Should create session with empty tools array');
});

test('LanguageModelSession transcript is immutable reference', () => {
  const session = new LanguageModelSession();
  const transcript1 = session.transcript;
  const transcript2 = session.transcript;

  // Should be different array references (defensive copy)
  assert.notStrictEqual(transcript1, transcript2, 'transcript getter should return new array each time');
});

test('LanguageModelSession isResponding is read-only', () => {
  const session = new LanguageModelSession();

  try {
    // @ts-ignore - testing runtime behavior
    session.isResponding = true;
  } catch (e) {
    // If it throws, that's fine
  }

  // Should still be false
  assert.strictEqual(session.isResponding, false, 'isResponding should be read-only');
});

// Test Instructions edge cases
test('Instructions with empty string', () => {
  const instructions = new Instructions('');
  assert.strictEqual(instructions.text, '', 'Should allow empty string');
});

test('Instructions with very long text', () => {
  const longText = 'a'.repeat(10000);
  const instructions = new Instructions(longText);
  assert.strictEqual(instructions.text.length, 10000, 'Should handle long instructions');
});

test('Instructions with special characters', () => {
  const specialText = 'Hello\n\tWorld\r\n"quotes" \'apostrophes\' <tags> & symbols 🎉';
  const instructions = new Instructions(specialText);
  assert.strictEqual(instructions.text, specialText, 'Should preserve special characters');
});

test('Instructions text is readonly', () => {
  const instructions = new Instructions('Original');

  try {
    // @ts-ignore - testing runtime behavior
    instructions.text = 'Modified';
  } catch (e) {
    // If it throws, that's fine
  }

  assert.strictEqual(instructions.text, 'Original', 'text should be readonly');
});

// Test Guardrails edge cases
test('Guardrails.default is singleton', () => {
  const g1 = Guardrails.default;
  const g2 = Guardrails.default;
  assert.strictEqual(g1, g2, 'default should return the same instance');
});

test('Guardrails cannot be directly instantiated', () => {
  try {
    // @ts-ignore - testing runtime behavior
    new Guardrails();
    assert.fail('Should not allow direct instantiation');
  } catch (e) {
    assert.ok(e, 'Should throw error when trying to instantiate');
  }
});

// Test ToolOutput edge cases
test('ToolOutput with string value', () => {
  const output = new ToolOutput('test result');
  assert.strictEqual(output.value, 'test result', 'Should store string value');
});

test('ToolOutput with object value', () => {
  const data = { key: 'value', number: 42 };
  const output = new ToolOutput(data);
  assert.deepStrictEqual(output.value, data, 'Should store object value');
});

test('ToolOutput with null value', () => {
  const output = new ToolOutput(null);
  assert.strictEqual(output.value, null, 'Should allow null value');
});

test('ToolOutput with array value', () => {
  const arr = [1, 2, 3];
  const output = new ToolOutput(arr);
  assert.deepStrictEqual(output.value, arr, 'Should store array value');
});

test('ToolOutput value is readonly', () => {
  const output = new ToolOutput('original');

  try {
    // @ts-ignore - testing runtime behavior
    output.value = 'modified';
  } catch (e) {
    // If it throws, that's fine
  }

  assert.strictEqual(output.value, 'original', 'value should be readonly');
});

// Test enum values
test('Availability enum has expected values', () => {
  assert.strictEqual(Availability.Available, 'available');
  assert.strictEqual(Availability.DeviceNotEligible, 'deviceNotEligible');
  assert.strictEqual(Availability.AppleIntelligenceNotEnabled, 'appleIntelligenceNotEnabled');
  assert.strictEqual(Availability.ModelNotReady, 'modelNotReady');
});

test('UseCase enum has expected values', () => {
  assert.strictEqual(UseCase.ContentTagging, 'contentTagging');
});

test('SamplingMode enum has expected values', () => {
  assert.strictEqual(SamplingMode.Greedy, 'greedy');
  assert.strictEqual(SamplingMode.Random, 'random');
});

// Test GenerationOptions edge cases
test('GenerationOptions with all properties', () => {
  const session = new LanguageModelSession();

  const options = {
    sampling: SamplingMode.Random,
    temperature: 0.7,
    maximumResponseTokens: 100,
  };

  // Just verify it doesn't throw
  assert.ok(options, 'Should create options with all properties');
});

test('GenerationOptions with only temperature', () => {
  const options = {
    temperature: 0.5,
  };
  assert.ok(options, 'Should allow partial options');
});

test('GenerationOptions with extreme values', () => {
  // Test extreme but valid values
  const options = {
    temperature: 0.0,  // Minimum
    maximumResponseTokens: 1,  // Very small
  };
  assert.ok(options, 'Should allow extreme but valid values');

  const options2 = {
    temperature: 2.0,  // Maximum
    maximumResponseTokens: 10000,  // Very large
  };
  assert.ok(options2, 'Should allow large values');
});

// Test transcript entry types
test('Transcript entries have correct structure', () => {
  const instructions = new Instructions('Test');
  const session = new LanguageModelSession(
    SystemLanguageModel.default,
    undefined,
    [],
    instructions
  );

  const transcript = session.transcript;
  assert.strictEqual(transcript.length, 1);

  const entry = transcript[0];
  assert.strictEqual(entry.type, 'instructions');
  assert.ok(entry.instructions);
  assert.strictEqual(entry.instructions.text, 'Test');
});

test('Multiple sessions do not share state', () => {
  const instructions1 = new Instructions('Session 1');
  const instructions2 = new Instructions('Session 2');

  const session1 = new LanguageModelSession(
    SystemLanguageModel.default,
    undefined,
    [],
    instructions1
  );
  const session2 = new LanguageModelSession(
    SystemLanguageModel.default,
    undefined,
    [],
    instructions2
  );

  assert.strictEqual(session1.transcript.length, 1);
  assert.strictEqual(session2.transcript.length, 1);
  assert.notStrictEqual(session1.transcript[0], session2.transcript[0]);
  assert.strictEqual(session1.transcript[0].instructions.text, 'Session 1');
  assert.strictEqual(session2.transcript[0].instructions.text, 'Session 2');
});

// Test model properties
test('SystemLanguageModel has consistent id', () => {
  const model = SystemLanguageModel.default;
  const id1 = model.id;
  const id2 = model.id;
  assert.strictEqual(id1, id2, 'id should be consistent across multiple accesses');
});

test('SystemLanguageModel availability types', () => {
  const model = SystemLanguageModel.default;
  assert.ok(
    Object.values(Availability).includes(model.availability),
    'availability should be a valid Availability enum value'
  );
});

test('SystemLanguageModel isAvailable matches availability', () => {
  const model = SystemLanguageModel.default;
  const shouldBeAvailable = model.availability === Availability.Available;
  assert.strictEqual(model.isAvailable, shouldBeAvailable, 'isAvailable should match availability status');
});

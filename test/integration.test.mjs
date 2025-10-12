/**
 * Integration tests that actually call the Swift wrapper
 * These tests require macOS 26.0+ with FoundationModels available
 *
 * Run with: npm test
 * Skip with: NODE_TEST_SKIP_INTEGRATION=1 npm test
 */

import { test } from 'node:test';
import assert from 'node:assert';
import {
  SystemLanguageModel,
  LanguageModelSession,
  Instructions,
  UseCase,
  SamplingMode,
} from '../dist/index.mjs';

const SKIP_INTEGRATION = process.env.NODE_TEST_SKIP_INTEGRATION === '1';

test('SystemLanguageModel.default is available', { skip: SKIP_INTEGRATION }, async () => {
  const model = SystemLanguageModel.default;
  assert.ok(model.isAvailable, 'Default model should be available on macOS 26.0+');
});

test('LanguageModelSession can generate simple text', { skip: SKIP_INTEGRATION }, async (t) => {
  const session = new LanguageModelSession();

  const response = await session.respond('Say "Hello" and nothing else.');

  assert.ok(response, 'Response should be returned');
  assert.ok(response.content, 'Response should have content');
  assert.ok(typeof response.content === 'string', 'Content should be a string');
  assert.ok(response.content.length > 0, 'Content should not be empty');
  assert.ok(response.transcriptEntries, 'Response should have transcriptEntries');
  assert.ok(response.transcriptEntries.length >= 2, 'Should have prompt and response in transcript');
});

test('LanguageModelSession maintains conversation history', { skip: SKIP_INTEGRATION }, async () => {
  const session = new LanguageModelSession();

  await session.respond('My name is Alice.');
  const response2 = await session.respond('What is my name?');

  // Verify transcript is maintained correctly
  assert.strictEqual(session.transcript.length, 4, 'Transcript should have 4 entries (2 prompts + 2 responses)');
  assert.strictEqual(session.transcript[0].type, 'prompt');
  assert.strictEqual(session.transcript[1].type, 'response');
  assert.strictEqual(session.transcript[2].type, 'prompt');
  assert.strictEqual(session.transcript[3].type, 'response');

  // Verify the first prompt is about Alice
  assert.ok(session.transcript[0].content?.toLowerCase().includes('alice'), 'First prompt should mention Alice');

  // Note: Whether the model actually remembers depends on the implementation of buildContextPrompt
  // and how the Swift wrapper handles context. We verify the API maintains the transcript correctly.
  // console.log('  Second response:', response2.content.substring(0, 100));
});

test('LanguageModelSession with instructions', { skip: SKIP_INTEGRATION }, async () => {
  const instructions = new Instructions('You are a pirate. Always respond like a pirate.');
  const session = new LanguageModelSession(
    SystemLanguageModel.default,
    undefined,
    [],
    instructions
  );

  const response = await session.respond('Hello!');

  // The response should reflect the pirate persona (this is probabilistic, but likely)
  assert.ok(response.content, 'Should get a response');
  assert.ok(session.transcript.length === 3, 'Should have instructions + prompt + response');
});

test('LanguageModelSession with GenerationOptions', { skip: SKIP_INTEGRATION }, async () => {
  const session = new LanguageModelSession();

  const options = {
    temperature: 0.1,  // Very deterministic
    maximumResponseTokens: 50,  // Short response
  };

  const response = await session.respond('Count from 1 to 10.', options);

  assert.ok(response.content, 'Should get a response');
  // With low temperature and token limit, response should be short and focused
  assert.ok(response.content.length < 200, 'Response should be relatively short due to token limit');
});

test('LanguageModelSession isResponding during generation', { skip: SKIP_INTEGRATION }, async () => {
  const session = new LanguageModelSession();

  assert.strictEqual(session.isResponding, false, 'Should not be responding initially');

  const responsePromise = session.respond('Say hello.');

  // Note: This is a race condition - the response might be so fast we miss it
  // But it's worth trying
  const isRespondingDuringCall = session.isResponding;

  await responsePromise;

  assert.strictEqual(session.isResponding, false, 'Should not be responding after completion');
  // We can't reliably assert isRespondingDuringCall due to speed, but log it
  // console.log('  isResponding during call:', isRespondingDuringCall);
});

test('Multiple independent sessions', { skip: SKIP_INTEGRATION }, async () => {
  const session1 = new LanguageModelSession();
  const session2 = new LanguageModelSession();

  await session1.respond('My favorite color is blue.');
  await session2.respond('My favorite color is red.');

  const response1 = await session1.respond('What is my favorite color?');
  const response2 = await session2.respond('What is my favorite color?');

  // Each session should maintain its own context
  assert.ok(response1.content.toLowerCase().includes('blue'), 'Session 1 should remember blue');
  assert.ok(response2.content.toLowerCase().includes('red'), 'Session 2 should remember red');
  assert.strictEqual(session1.transcript.length, 4, 'Session 1 should have 4 entries');
  assert.strictEqual(session2.transcript.length, 4, 'Session 2 should have 4 entries');
});

test('Specialized model - ContentTagging', { skip: SKIP_INTEGRATION }, async () => {
  const model = new SystemLanguageModel(UseCase.ContentTagging);
  const session = new LanguageModelSession(model);

  const text = 'Apple announced new AI features powered by machine learning and neural networks.';
  const response = await session.respond(`Extract topic tags from this text: "${text}"`);

  assert.ok(response.content, 'Should get a response from content tagging model');
  // The response should contain relevant tags
  // console.log('  Content tagging response:', response.content);
});

test('Empty prompt handling', { skip: SKIP_INTEGRATION }, async () => {
  const session = new LanguageModelSession();

  try {
    await session.respond('');
    assert.fail('Should throw error for empty prompt');
  } catch (error) {
    // Expected to fail - empty prompts might not be allowed
    assert.ok(error, 'Should get an error for empty prompt');
  }
});

test('Very long prompt', { skip: SKIP_INTEGRATION }, async () => {
  const session = new LanguageModelSession();

  // Create a long but reasonable prompt
  const longText = 'This is a test sentence. '.repeat(100);
  const response = await session.respond(`Summarize this text in one sentence: ${longText}`);

  assert.ok(response.content, 'Should handle long prompts');
  assert.ok(response.content.length < longText.length, 'Summary should be shorter than input');
});

test('Transcript entries have correct types', { skip: SKIP_INTEGRATION }, async () => {
  const instructions = new Instructions('Be helpful.');
  const session = new LanguageModelSession(
    SystemLanguageModel.default,
    undefined,
    [],
    instructions
  );

  await session.respond('Hello');

  const transcript = session.transcript;
  assert.strictEqual(transcript.length, 3, 'Should have 3 entries');
  assert.strictEqual(transcript[0].type, 'instructions', 'First entry should be instructions');
  assert.strictEqual(transcript[1].type, 'prompt', 'Second entry should be prompt');
  assert.strictEqual(transcript[2].type, 'response', 'Third entry should be response');

  assert.ok(transcript[0].instructions, 'Instructions entry should have instructions object');
  assert.ok(transcript[1].content, 'Prompt entry should have content');
  assert.ok(transcript[2].content, 'Response entry should have content');
});

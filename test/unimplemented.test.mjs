import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SystemLanguageModel, LanguageModelSession } from '../dist/index.mjs';

// Every test in this file calls the real Swift bridge / live model -- see
// test/integration.test.mjs for the convention this mirrors.
// Skip with: NODE_TEST_SKIP_INTEGRATION=1 npm test
const SKIP_INTEGRATION = process.env.NODE_TEST_SKIP_INTEGRATION === '1';

describe('Previously Unimplemented Methods', { skip: SKIP_INTEGRATION }, () => {
  describe('SystemLanguageModel.generateStream()', () => {
    it('should stream text generation', async () => {
      const model = SystemLanguageModel.default;
      if (!model.isAvailable) {
        console.log('  Model not available, skipping test');
        return;
      }

      const chunks = [];
      for await (const chunk of model.generateStream('Count to 3')) {
        chunks.push(chunk);
        assert.ok(typeof chunk === 'string', 'Chunk should be a string');
      }

      assert.ok(chunks.length > 0, 'Should receive at least one chunk');
      const fullText = chunks.join('');
      assert.ok(fullText.length > 0, 'Full text should be non-empty');

      console.log(`  generateStream: ${chunks.length} chunks, ${fullText.length} chars`);
    });

    it('should work with generation config', async () => {
      const model = SystemLanguageModel.default;
      if (!model.isAvailable) {
        console.log('  Model not available, skipping test');
        return;
      }

      const chunks = [];
      for await (const chunk of model.generateStream('Say hi', {
        maxTokens: 50,
        temperature: 0.7
      })) {
        chunks.push(chunk);
      }

      assert.ok(chunks.length > 0, 'Should receive chunks with config');
    });
  });

  describe('LanguageModelSession.prewarm()', () => {
    it('should prewarm session without errors', async () => {
      const session = new LanguageModelSession();

      // Should not throw
      await session.prewarm();

      // Session should still be usable after prewarming
      const response = await session.respond('Hello');
      assert.ok(response.content.length > 0, 'Should generate response after prewarm');
    });

    it('should improve first response latency (informational)', async () => {
      // Create two sessions
      const sessionWithPrewarm = new LanguageModelSession();
      const sessionWithoutPrewarm = new LanguageModelSession();

      // Prewarm one session
      await sessionWithPrewarm.prewarm();

      // Measure first response time (for information only, not asserting)
      const startPrewarmed = Date.now();
      await sessionWithPrewarm.respond('Hi');
      const prewarmTime = Date.now() - startPrewarmed;

      const startCold = Date.now();
      await sessionWithoutPrewarm.respond('Hi');
      const coldTime = Date.now() - startCold;

      console.log(`  Prewarmed: ${prewarmTime}ms, Cold: ${coldTime}ms`);
      console.log(`  Note: Prewarming may not always be faster due to model caching`);
    });
  });

  describe('LanguageModelSession.prewarmWithPrefix()', () => {
    it('should prewarm with prefix without errors', async () => {
      const session = new LanguageModelSession();

      // Should not throw
      await session.prewarmWithPrefix('You are a helpful');

      // Session should still be usable
      const response = await session.respond('assistant. Say hello');
      assert.ok(response.content.length > 0, 'Should generate response after prewarm with prefix');
    });

    it('should work with different prefixes', async () => {
      const session1 = new LanguageModelSession();
      await session1.prewarmWithPrefix('Count to');

      const session2 = new LanguageModelSession();
      await session2.prewarmWithPrefix('Write a poem about');

      // Both should work
      const response1 = await session1.respond('five');
      const response2 = await session2.respond('cats');

      assert.ok(response1.content.length > 0);
      assert.ok(response2.content.length > 0);
    });

    it('should handle empty prefix', async () => {
      const session = new LanguageModelSession();

      try {
        await session.prewarmWithPrefix('');
        // Empty prefix is allowed, just may not do anything
        assert.ok(true, 'Handled empty prefix');
      } catch (error) {
        // Or it might throw, which is also acceptable
        assert.ok(error instanceof Error);
      }
    });
  });

  describe('Integration test', () => {
    it('should work together: prewarm, stream, and generate', async () => {
      const model = SystemLanguageModel.default;
      if (!model.isAvailable) {
        console.log('  Model not available, skipping test');
        return;
      }

      const session = new LanguageModelSession();

      // 1. Prewarm the session
      await session.prewarm();

      // 2. Use streaming
      let streamText = '';
      const stream = session.streamResponse('Say hello');
      for await (const chunk of stream) {
        streamText += chunk;
      }
      assert.ok(streamText.length > 0, 'Streaming should work after prewarm');

      // 3. Use regular generation
      const response = await session.respond('Say goodbye');
      assert.ok(response.content.length > 0, 'Regular generation should work');

      // 4. Use model's generateStream directly
      const modelChunks = [];
      for await (const chunk of model.generateStream('Count to 2')) {
        modelChunks.push(chunk);
      }
      assert.ok(modelChunks.length > 0, 'Model streaming should work');

      console.log(`  All methods working together successfully`);
    });
  });
});

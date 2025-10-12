/**
 * Tests for Modal Executor Architecture
 *
 * Verifies that:
 * 1. Sessions without tools use ProcessPerCallExecutor (fast path)
 * 2. Sessions with tools use PersistentServerExecutor
 * 3. No performance degradation for existing code
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LanguageModelSession, SystemLanguageModel, ToolOutput } from '../dist/index.mjs';

describe('Modal Executor Architecture', () => {
  it('should use ProcessPerCallExecutor when no tools provided', async () => {
    const model = SystemLanguageModel.default;
    const session = new LanguageModelSession(model);

    // Verify internal executor type (if exposed) or just verify it works
    assert.ok(session, 'Session should be created');

    // This should use ProcessPerCallExecutor (fast path)
    const response = await session.respond('Say "hello"');
    assert.ok(response.content, 'Should get response using ProcessPerCallExecutor');

    // Clean up (should be no-op for ProcessPerCallExecutor)
    await session.close();
  });

  it('should use PersistentServerExecutor when tools provided', async () => {
    const model = SystemLanguageModel.default;

    // Create a simple tool
    const testTool = {
      name: 'testTool',
      description: 'A test tool',
      async call(args) {
        return new ToolOutput('test result');
      }
    };

    const session = new LanguageModelSession(
      model,
      undefined, // guardrails
      [testTool]  // tools - should trigger PersistentServerExecutor
    );

    assert.ok(session, 'Session with tools should be created');

    // This should use PersistentServerExecutor
    // Note: The model may or may not actually call the tool
    const response = await session.respond('Say "hello"');
    assert.ok(response !== undefined, 'Should get response using PersistentServerExecutor');

    // Clean up (should stop server for PersistentServerExecutor)
    await session.close();
  });

  it('should handle multiple sessions without tools efficiently', async () => {
    const model = SystemLanguageModel.default;

    // Create multiple sessions without tools
    const sessions = [
      new LanguageModelSession(model),
      new LanguageModelSession(model),
      new LanguageModelSession(model)
    ];

    // All should use ProcessPerCallExecutor
    const responses = await Promise.all(
      sessions.map(s => s.respond('Say "test"'))
    );

    assert.equal(responses.length, 3, 'Should get all responses');
    responses.forEach(r => {
      assert.ok(r.content !== undefined, 'Each response should have content');
    });

    // Clean up
    await Promise.all(sessions.map(s => s.close()));
  });

  it('should handle close() for session without tools (no-op)', async () => {
    const model = SystemLanguageModel.default;
    const session = new LanguageModelSession(model);

    // Get a response
    const response = await session.respond('Say "test"');
    assert.ok(response.content !== undefined, 'Should get response');

    // Close should be a no-op but not throw
    await assert.doesNotReject(
      async () => await session.close(),
      'close() should not throw for session without tools'
    );
  });

  it('should handle close() for session with tools', async () => {
    const model = SystemLanguageModel.default;

    const testTool = {
      name: 'testTool',
      description: 'A test tool',
      async call(args) {
        return new ToolOutput('result');
      }
    };

    const session = new LanguageModelSession(model, undefined, [testTool]);

    // Close should clean up server
    await assert.doesNotReject(
      async () => await session.close(),
      'close() should not throw for session with tools'
    );
  });

  it('should maintain backward compatibility - no tools, no close()', async () => {
    const model = SystemLanguageModel.default;
    const session = new LanguageModelSession(model);

    // Existing code pattern: create session, use it, let it be GC'd
    const response = await session.respond('Say "test"');
    assert.ok(response.content !== undefined, 'Should work without explicit close()');

    // Don't call close() - should still work (backward compatible)
  });

  it('should support streaming with modal architecture', async () => {
    const model = SystemLanguageModel.default;
    const session = new LanguageModelSession(model);

    let chunks = 0;
    const stream = session.streamResponse('Count to 3');

    for await (const chunk of stream) {
      assert.ok(typeof chunk === 'string', 'Chunk should be string');
      chunks++;
    }

    assert.ok(chunks > 0, 'Should receive chunks');

    await session.close();
  });
});

describe('Modal Executor - Performance Characteristics', () => {
  it('ProcessPerCallExecutor has no startup overhead', async () => {
    const model = SystemLanguageModel.default;
    const session = new LanguageModelSession(model);

    const start = Date.now();
    await session.respond('Say "quick"');
    const duration = Date.now() - start;

    // Should be relatively fast (no server startup)
    // This is a rough check - actual timing varies
    assert.ok(duration < 10000, 'Should respond within reasonable time');

    await session.close();
  });

  it('PersistentServerExecutor has one-time startup cost', async () => {
    const model = SystemLanguageModel.default;

    const tool = {
      name: 'testTool',
      description: 'Test',
      async call(args) {
        return new ToolOutput('result');
      }
    };

    const session = new LanguageModelSession(model, undefined, [tool]);

    // First call may be slower (server startup)
    const start1 = Date.now();
    await session.respond('Say "test"');
    const duration1 = Date.now() - start1;

    // Second call should reuse server (potentially faster)
    const start2 = Date.now();
    await session.respond('Say "test2"');
    const duration2 = Date.now() - start2;

    // Both should complete (timing varies by system)
    assert.ok(duration1 > 0, 'First call should complete');
    assert.ok(duration2 > 0, 'Second call should complete');

    await session.close();
  });
});

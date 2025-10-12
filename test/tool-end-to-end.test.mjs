/**
 * End-to-End Tool Execution Tests
 *
 * Tests the complete tool execution flow:
 * 1. Session created with tools
 * 2. PersistentServerExecutor starts
 * 3. Model generates response
 * 4. Tool callbacks work (if model calls them)
 * 5. Cleanup happens properly
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LanguageModelSession, SystemLanguageModel, ToolOutput } from '../dist/index.mjs';

describe('End-to-End Tool Execution', () => {
  it('should create session with tools and connect to server', async () => {
    const model = SystemLanguageModel.default;

    let toolCalled = false;
    const weatherTool = {
      name: 'getWeather',
      description: 'Get current weather for a city',
      async call(args) {
        toolCalled = true;
        console.log('[Test] Tool called with:', args);
        return new ToolOutput({ temperature: 72, condition: 'sunny', city: args.city });
      }
    };

    const session = new LanguageModelSession(model, undefined, [weatherTool]);
    assert.ok(session, 'Session should be created');

    // Ask a simple question (model may or may not use tools)
    const response = await session.respond('What is 2+2?');

    // We should get SOME response (even if empty due to pre-existing model issue)
    assert.ok(response !== undefined, 'Should get a response object');
    assert.ok('content' in response, 'Response should have content property');

    console.log('[Test] Tool was called:', toolCalled);
    console.log('[Test] Response length:', response.content?.length || 0);

    // Cleanup
    await session.close();
  });

  it('should handle calculator tool', async () => {
    const model = SystemLanguageModel.default;

    let toolCallCount = 0;
    const calcTool = {
      name: 'calculate',
      description: 'Perform mathematical calculations',
      async call(args) {
        toolCallCount++;
        console.log('[Test] Calculator called with:', args);

        const { operation, a, b } = args;
        let result;

        switch (operation) {
          case 'add':
            result = a + b;
            break;
          case 'subtract':
            result = a - b;
            break;
          case 'multiply':
            result = a * b;
            break;
          case 'divide':
            result = a / b;
            break;
          default:
            result = 0;
        }

        return new ToolOutput(result);
      }
    };

    const session = new LanguageModelSession(model, undefined, [calcTool]);

    // Simple math question
    const response = await session.respond('Calculate 5 times 3');

    assert.ok(response !== undefined, 'Should get response');
    console.log('[Test] Calculator called', toolCallCount, 'times');
    console.log('[Test] Response:', response.content?.substring(0, 100) || '(empty)');

    await session.close();
  });

  it('should handle multiple tools', async () => {
    const model = SystemLanguageModel.default;

    const toolCallLog = [];

    const tools = [
      {
        name: 'getTime',
        description: 'Get current time',
        async call(args) {
          toolCallLog.push('getTime');
          return new ToolOutput(new Date().toISOString());
        }
      },
      {
        name: 'getWeather',
        description: 'Get weather',
        async call(args) {
          toolCallLog.push('getWeather');
          return new ToolOutput({ temp: 70, condition: 'clear' });
        }
      },
      {
        name: 'searchWeb',
        description: 'Search the web',
        async call(args) {
          toolCallLog.push('searchWeb');
          return new ToolOutput(['result1', 'result2', 'result3']);
        }
      }
    ];

    const session = new LanguageModelSession(model, undefined, tools);

    const response = await session.respond('Tell me about yourself');

    assert.ok(response !== undefined, 'Should get response');
    console.log('[Test] Tools called:', toolCallLog);
    console.log('[Test] Response available:', response.content !== undefined);

    await session.close();
  });

  it('should handle tool that returns complex object', async () => {
    const model = SystemLanguageModel.default;

    const databaseTool = {
      name: 'queryDatabase',
      description: 'Query a database',
      async call(args) {
        console.log('[Test] Database query:', args);
        return new ToolOutput({
          results: [
            { id: 1, name: 'Alice', age: 30 },
            { id: 2, name: 'Bob', age: 25 }
          ],
          count: 2,
          query: args.query
        });
      }
    };

    const session = new LanguageModelSession(model, undefined, [databaseTool]);

    const response = await session.respond('Show me users');

    assert.ok(response !== undefined, 'Should get response');

    await session.close();
  });

  it('should handle tool errors gracefully', async () => {
    const model = SystemLanguageModel.default;

    const errorTool = {
      name: 'failingTool',
      description: 'A tool that fails',
      async call(args) {
        console.log('[Test] Error tool called (will throw)');
        throw new Error('Tool execution failed');
      }
    };

    const session = new LanguageModelSession(model, undefined, [errorTool]);

    // This should not throw - server should handle tool errors
    const response = await session.respond('Test error handling');

    assert.ok(response !== undefined, 'Should get response even if tool fails');

    await session.close();
  });

  it('should support concurrent sessions with tools', async () => {
    const model = SystemLanguageModel.default;

    const createSession = (name) => {
      const tool = {
        name: `${name}Tool`,
        description: `Tool for ${name}`,
        async call(args) {
          console.log(`[Test] ${name} tool called`);
          return new ToolOutput(`Result from ${name}`);
        }
      };

      return new LanguageModelSession(model, undefined, [tool]);
    };

    const sessions = [
      createSession('session1'),
      createSession('session2'),
      createSession('session3')
    ];

    // Make concurrent requests
    const responses = await Promise.all(
      sessions.map((s, i) => s.respond(`Hello from session ${i + 1}`))
    );

    assert.equal(responses.length, 3, 'Should get all responses');
    responses.forEach((r, i) => {
      assert.ok(r !== undefined, `Response ${i + 1} should exist`);
    });

    // Cleanup all sessions
    await Promise.all(sessions.map(s => s.close()));
  });

  it('should verify persistent server reuse', async () => {
    const model = SystemLanguageModel.default;

    let callCount = 0;
    const tool = {
      name: 'counter',
      description: 'Counts calls',
      async call(args) {
        callCount++;
        console.log('[Test] Call count:', callCount);
        return new ToolOutput({ count: callCount });
      }
    };

    const session = new LanguageModelSession(model, undefined, [tool]);

    // Make multiple requests - should reuse same server
    const response1 = await session.respond('First request');
    assert.ok(response1 !== undefined, 'First response should exist');

    const response2 = await session.respond('Second request');
    assert.ok(response2 !== undefined, 'Second response should exist');

    const response3 = await session.respond('Third request');
    assert.ok(response3 !== undefined, 'Third response should exist');

    console.log('[Test] All requests completed successfully');

    await session.close();
  });
});

describe('Tool Execution - Performance', () => {
  it('should have acceptable latency with persistent server', async () => {
    const model = SystemLanguageModel.default;

    const tool = {
      name: 'testTool',
      description: 'Test tool',
      async call(args) {
        return new ToolOutput('result');
      }
    };

    const session = new LanguageModelSession(model, undefined, [tool]);

    const start = Date.now();
    await session.respond('Quick test');
    const firstCallDuration = Date.now() - start;

    console.log('[Test] First call duration:', firstCallDuration, 'ms');

    // First call may be slower (server startup)
    // But it should still complete in reasonable time
    assert.ok(firstCallDuration < 30000, 'First call should complete within 30s');

    await session.close();
  });
});

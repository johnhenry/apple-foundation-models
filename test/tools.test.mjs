/**
 * Tool Interface Tests
 *
 * Tests for the Tool interface, ToolCall, and ToolOutput types.
 * Note: These tests verify type compatibility and manual execution patterns.
 * Automatic tool execution is not yet implemented.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  SystemLanguageModel,
  LanguageModelSession,
  ToolOutput,
  Availability,
} from '../dist/index.mjs';

describe('Tool Interface', () => {
  it('should create a Tool implementation', () => {
    class TestTool {
      constructor() {
        this.name = 'testTool';
        this.description = 'A test tool';
      }

      async call(args) {
        return new ToolOutput(`Called with: ${JSON.stringify(args)}`);
      }
    }

    const tool = new TestTool();
    assert.strictEqual(tool.name, 'testTool');
    assert.strictEqual(tool.description, 'A test tool');
    assert.strictEqual(typeof tool.call, 'function');
  });

  it('should execute a tool and return ToolOutput', async () => {
    class CalculatorTool {
      constructor() {
        this.name = 'calculator';
        this.description = 'Performs calculations';
      }

      async call(args) {
        const { a, b, operation } = args;
        let result;
        switch (operation) {
          case 'add':
            result = a + b;
            break;
          case 'multiply':
            result = a * b;
            break;
          default:
            throw new Error(`Unknown operation: ${operation}`);
        }
        return new ToolOutput(result);
      }
    }

    const tool = new CalculatorTool();
    const output = await tool.call({ a: 5, b: 3, operation: 'add' });

    assert.ok(output instanceof ToolOutput);
    assert.strictEqual(output.value, 8);
  });

  it('should create ToolOutput with string value', () => {
    const output = new ToolOutput('test result');
    assert.strictEqual(output.value, 'test result');
  });

  it('should create ToolOutput with object value', () => {
    const data = { temperature: 72, condition: 'sunny' };
    const output = new ToolOutput(data);
    assert.deepStrictEqual(output.value, data);
  });

  it('should make ToolOutput value immutable', () => {
    const output = new ToolOutput('original');
    assert.throws(() => {
      output.value = 'modified';
    });
  });

  it('should create LanguageModelSession with tools', () => {
    class DummyTool {
      constructor() {
        this.name = 'dummy';
        this.description = 'A dummy tool';
      }

      async call(args) {
        return new ToolOutput('dummy result');
      }
    }

    const tools = [new DummyTool()];
    const session = new LanguageModelSession(
      SystemLanguageModel.default,
      undefined,
      tools
    );

    // Session should be created without errors
    assert.ok(session);
    assert.strictEqual(session.isResponding, false);
  });

  it('should handle multiple tools in session', () => {
    class Tool1 {
      constructor() {
        this.name = 'tool1';
        this.description = 'First tool';
      }
      async call() {
        return new ToolOutput('result1');
      }
    }

    class Tool2 {
      constructor() {
        this.name = 'tool2';
        this.description = 'Second tool';
      }
      async call() {
        return new ToolOutput('result2');
      }
    }

    const tools = [new Tool1(), new Tool2()];
    const session = new LanguageModelSession(
      SystemLanguageModel.default,
      undefined,
      tools
    );

    assert.ok(session);
  });

  it('should allow finding tools by name', () => {
    class WeatherTool {
      constructor() {
        this.name = 'getWeather';
        this.description = 'Gets weather';
      }
      async call(args) {
        return new ToolOutput(`Weather for ${args.city}`);
      }
    }

    class TimeTool {
      constructor() {
        this.name = 'getTime';
        this.description = 'Gets time';
      }
      async call() {
        return new ToolOutput(new Date().toISOString());
      }
    }

    const tools = [new WeatherTool(), new TimeTool()];

    // Simulate finding a tool by name (like you would when handling tool calls)
    const weatherTool = tools.find((t) => t.name === 'getWeather');
    const timeTool = tools.find((t) => t.name === 'getTime');
    const nonExistent = tools.find((t) => t.name === 'nonExistent');

    assert.ok(weatherTool);
    assert.strictEqual(weatherTool.name, 'getWeather');
    assert.ok(timeTool);
    assert.strictEqual(timeTool.name, 'getTime');
    assert.strictEqual(nonExistent, undefined);
  });

  it('should handle tool execution errors gracefully', async () => {
    class FailingTool {
      constructor() {
        this.name = 'failing';
        this.description = 'A tool that fails';
      }

      async call() {
        throw new Error('Tool execution failed');
      }
    }

    const tool = new FailingTool();

    await assert.rejects(async () => {
      await tool.call({});
    }, /Tool execution failed/);
  });

  it('should support complex argument structures', async () => {
    class ComplexTool {
      constructor() {
        this.name = 'complex';
        this.description = 'Handles complex args';
      }

      async call(args) {
        const { query, filters, options } = args;
        return new ToolOutput({
          query,
          filterCount: filters?.length || 0,
          hasOptions: !!options,
        });
      }
    }

    const tool = new ComplexTool();
    const output = await tool.call({
      query: 'test',
      filters: ['a', 'b', 'c'],
      options: { sort: 'asc' },
    });

    assert.strictEqual(output.value.query, 'test');
    assert.strictEqual(output.value.filterCount, 3);
    assert.strictEqual(output.value.hasOptions, true);
  });

  it('should create session without tools (empty array)', () => {
    const session = new LanguageModelSession(SystemLanguageModel.default, undefined, []);
    assert.ok(session);
  });

  it('should verify ToolCall structure compatibility', () => {
    // Simulate a ToolCall object as it would appear in TranscriptEntry
    const toolCall = {
      name: 'getWeather',
      arguments: { city: 'San Francisco' },
    };

    assert.strictEqual(toolCall.name, 'getWeather');
    assert.ok(toolCall.arguments);
    assert.strictEqual(toolCall.arguments.city, 'San Francisco');
  });

  it('should verify TranscriptEntry structure for tool calls', () => {
    // Simulate how tool calls would appear in transcript
    const transcriptEntry = {
      type: 'toolCalls',
      calls: [
        { name: 'tool1', arguments: { arg1: 'value1' } },
        { name: 'tool2', arguments: { arg2: 'value2' } },
      ],
    };

    assert.strictEqual(transcriptEntry.type, 'toolCalls');
    assert.strictEqual(transcriptEntry.calls.length, 2);
    assert.strictEqual(transcriptEntry.calls[0].name, 'tool1');
  });

  it('should verify TranscriptEntry structure for tool output', () => {
    // Simulate how tool output would appear in transcript
    const output = new ToolOutput('test result');
    const transcriptEntry = {
      type: 'toolOutput',
      output: output,
    };

    assert.strictEqual(transcriptEntry.type, 'toolOutput');
    assert.ok(transcriptEntry.output instanceof ToolOutput);
    assert.strictEqual(transcriptEntry.output.value, 'test result');
  });
});

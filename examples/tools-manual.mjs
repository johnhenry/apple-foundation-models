/**
 * Tool Usage Example (Manual Execution Pattern)
 *
 * This example demonstrates how to use the Tool interface with manual execution.
 *
 * IMPORTANT: Automatic tool execution is not yet implemented. This shows the
 * manual workaround pattern until the architecture supports automatic execution.
 */

import {
  SystemLanguageModel,
  LanguageModelSession,
  ToolOutput,
  Availability,
} from '../dist/index.mjs';

// Example Tool Implementation: Weather
class WeatherTool {
  constructor() {
    this.name = 'getWeather';
    this.description = 'Gets the current weather for a specified city';
  }

  async call(args) {
    // Simulate fetching weather data
    const { city } = args;
    console.log(`[Tool] Fetching weather for ${city}...`);

    // In a real implementation, this would call a weather API
    const mockWeather = {
      temperature: 72,
      condition: 'Sunny',
      humidity: 45,
    };

    return new ToolOutput(
      `Weather in ${city}: ${mockWeather.temperature}°F, ${mockWeather.condition}, ${mockWeather.humidity}% humidity`
    );
  }
}

// Example Tool Implementation: Calculator
class CalculatorTool {
  constructor() {
    this.name = 'calculate';
    this.description = 'Performs basic mathematical calculations';
  }

  async call(args) {
    const { operation, a, b } = args;
    console.log(`[Tool] Calculating ${a} ${operation} ${b}...`);

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
        throw new Error(`Unknown operation: ${operation}`);
    }

    return new ToolOutput(`Result: ${result}`);
  }
}

async function main() {
  // Check model availability
  const model = SystemLanguageModel.default;
  const availability = model.availability;

  if (availability !== Availability.Available) {
    console.error('❌ Model is not available:', availability);
    return;
  }

  console.log('✅ Model is available\n');

  // Create tools
  const tools = [new WeatherTool(), new CalculatorTool()];

  // Create session with tools
  const session = new LanguageModelSession(
    model,
    undefined, // guardrails (not used)
    tools
  );

  console.log('📋 Session created with tools:', tools.map((t) => t.name).join(', '));
  console.log();

  // Example prompt that might trigger tool usage
  console.log('📝 Prompt: "What\'s the weather in San Francisco?"\n');

  try {
    let response = await session.respond("What's the weather in San Francisco?");
    console.log('🤖 Response:', response.content);
    console.log();

    // Check transcript for tool calls
    console.log('📊 Checking transcript for tool calls...');
    const transcript = session.transcript;

    // Filter for tool call entries
    const toolCallEntries = transcript.filter((entry) => entry.type === 'toolCalls');

    if (toolCallEntries.length > 0) {
      console.log(`Found ${toolCallEntries.length} tool call(s)\n`);

      // Execute each tool call manually
      for (const entry of toolCallEntries) {
        for (const call of entry.calls) {
          console.log(`🔧 Tool Call Detected: ${call.name}`);
          console.log('   Arguments:', JSON.stringify(call.arguments, null, 2));

          // Find and execute the tool
          const tool = tools.find((t) => t.name === call.name);
          if (tool) {
            const output = await tool.call(call.arguments);
            console.log('   Output:', output.value);
            console.log();

            // Continue conversation with tool result
            response = await session.respond(
              `The tool "${call.name}" returned: ${output.value}. Please use this information to answer the user's question.`
            );
            console.log('🤖 Updated Response:', response.content);
          } else {
            console.log(`   ⚠️  Tool "${call.name}" not found`);
          }
        }
      }
    } else {
      console.log('ℹ️  No tool calls detected in response');
      console.log('   (This is expected - automatic tool calling is not yet implemented)');
      console.log('   The model may have answered directly or tool support is not enabled.');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();

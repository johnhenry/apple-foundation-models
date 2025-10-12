/**
 * LanguageModelSession example for Apple Foundation Models
 *
 * This example demonstrates the session-based API for conversational interactions:
 * 1. Creating a session with instructions
 * 2. Multi-turn conversations with context
 * 3. Accessing transcript history
 * 4. Using generation options
 */

import { SystemLanguageModel, LanguageModelSession, Instructions, SamplingMode }
  from '../dist/index.mjs';

async function main() {
  try {
    console.log('🍎 Apple Foundation Models - LanguageModelSession Example\n');

    // 1. Get the default model
    const model = SystemLanguageModel.default;

    if (!model.isAvailable) {
      console.log('❌ Model not available');
      return;
    }

    console.log('✅ Model is available\n');

    // 2. Create a session with instructions
    console.log('🔧 Creating a LanguageModelSession with instructions...');
    const instructions = new Instructions(
      'You are a helpful coding assistant specialized in TypeScript and JavaScript.'
    );

    const session = new LanguageModelSession(
      model,
      undefined, // guardrails (use default)
      [],        // tools
      instructions
    );
    console.log('Session created!\n');

    // 3. Have a multi-turn conversation
    console.log('💬 Starting conversation...\n');

    console.log('User: What is TypeScript?');
    const response1 = await session.respond('What is TypeScript?');
    console.log(`Assistant: ${response1.content}\n`);

    console.log('User: How is it different from JavaScript?');
    const response2 = await session.respond('How is it different from JavaScript?');
    console.log(`Assistant: ${response2.content}\n`);

    console.log('User: Can you give me a simple example?');
    const options = {
      temperature: 0.7,
      maximumResponseTokens: 200
    };
    const response3 = await session.respond('Can you give me a simple example?', options);
    console.log(`Assistant: ${response3.content}\n`);

    // 4. Access transcript history
    console.log('📚 Transcript history:');
    const transcript = session.transcript;
    console.log(`Total entries: ${transcript.length}`);

    for (const entry of transcript) {
      switch (entry.type) {
        case 'instructions':
          console.log('  [Instructions] Set');
          break;
        case 'prompt':
          const promptPreview = entry.content.substring(0, 50);
          console.log(`  [User] ${promptPreview}...`);
          break;
        case 'response':
          const responsePreview = entry.content.substring(0, 50);
          console.log(`  [Assistant] ${responsePreview}...`);
          break;
      }
    }
    console.log();

    // 5. Check if session is responding
    console.log(`Is responding: ${session.isResponding}\n`);

    // 6. Create another session without instructions
    console.log('🔧 Creating session without instructions...');
    const session2 = new LanguageModelSession(model);

    const response4 = await session2.respond('Write a haiku about code');
    console.log(`\nGenerated haiku:`);
    console.log(response4.content);
    console.log(`\nTranscript entries: ${session2.transcript.length}\n`);

    // 7. Create session with creative options
    console.log('🎨 Creating session with creative generation...');
    const session3 = new LanguageModelSession(
      model,
      undefined,
      [],
      new Instructions('You are a creative poet.')
    );

    const creativeOptions = {
      sampling: SamplingMode.Random,
      temperature: 1.2,
      maximumResponseTokens: 150
    };

    const response5 = await session3.respond('Describe a sunset', creativeOptions);
    console.log(`\nPoetic description:`);
    console.log(response5.content);

    console.log('\n✅ Example completed successfully!');
    console.log('\n💡 LanguageModelSession maintains conversation context across multiple turns.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

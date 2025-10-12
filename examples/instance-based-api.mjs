/**
 * Instance-based API example for Apple Foundation Models
 *
 * This example demonstrates the 1-to-1 API mapping with Swift's SystemLanguageModel class:
 * 1. Using SystemLanguageModel.default (static getter)
 * 2. Checking availability with enum values
 * 3. Creating sessions for generation
 * 4. Accessing model properties
 */

import { SystemLanguageModel, LanguageModelSession, Availability, Instructions }
  from '../dist/index.mjs';

async function main() {
  try {
    console.log('🍎 Apple Foundation Models - Instance-based API Example\n');

    // 1. Access the default model
    console.log('🔧 Accessing default model...');
    const model = SystemLanguageModel.default;
    console.log(`Model ID: ${model.id}`);

    // 2. Check availability using enum
    console.log('\n📊 Checking model availability...');
    const availability = model.availability;

    switch (availability) {
      case Availability.Available:
        console.log('✅ Model is available and ready!');
        break;
      case Availability.DeviceNotEligible:
        console.log('❌ Device is not eligible for Foundation Models');
        return;
      case Availability.AppleIntelligenceNotEnabled:
        console.log('❌ Apple Intelligence is not enabled');
        return;
      case Availability.ModelNotReady:
        console.log('⏳ Model is not ready (downloading or initializing)');
        return;
    }

    // 3. Check with boolean convenience property
    console.log(`Is available (boolean): ${model.isAvailable}\n`);

    if (!model.isAvailable) {
      console.log('❌ Model not available');
      return;
    }

    // 4. Create a session and generate
    console.log('✨ Creating session and generating text...');
    const session = new LanguageModelSession(model);

    const response1 = await session.respond('Write a haiku about TypeScript');
    console.log('\nGenerated haiku:');
    console.log(response1.content);
    console.log(`\nTranscript entries: ${response1.transcriptEntries.length}`);

    // 5. Generate with custom options
    console.log('\n✨ Generating with custom options...');
    const options = {
      temperature: 0.8,
      maximumResponseTokens: 100
    };

    const response2 = await session.respond(
      'Explain Apple Foundation Models in one sentence',
      options
    );
    console.log('\nGenerated explanation:');
    console.log(response2.content);

    // 6. Create session with instructions
    console.log('\n🔧 Creating session with instructions...');
    const instructions = new Instructions('You are a helpful coding assistant.');
    const session2 = new LanguageModelSession(
      model,
      undefined, // guardrails
      [],        // tools
      instructions
    );

    const response3 = await session2.respond('What is async/await?');
    console.log('\nAssistant response:');
    console.log(response3.content);

    // 7. Check if session is responding
    console.log(`\nIs responding: ${session2.isResponding}`);
    console.log(`Transcript length: ${session2.transcript.length}`);

    console.log('\n✅ Example completed successfully!');
    console.log('\n💡 This API provides a 1-to-1 mapping with Swift\'s SystemLanguageModel.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();

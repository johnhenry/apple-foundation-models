/**
 * LanguageModelSession example for Apple Foundation Models
 * 
 * This example demonstrates the session-based API for conversational interactions:
 * 1. Creating a session with a system prompt
 * 2. Sending multiple messages in context
 * 3. Accessing message history
 * 4. Resetting the session
 */

import { LanguageModel, LanguageModelSession } from '../dist/index.mjs';

async function main() {
  try {
    console.log('🍎 Apple Foundation Models - LanguageModelSession Example\n');
    
    // 1. Get available models
    console.log('📋 Listing available models...');
    const models = await LanguageModel.availableModels;
    
    if (models.length === 0) {
      console.log('❌ No models available. Please ensure you have models installed.');
      process.exit(1);
    }
    
    console.log(`Found ${models.length} model(s). Using: ${models[0].name}\n`);
    
    // 2. Create a session with a system prompt
    console.log('🔧 Creating a LanguageModelSession with system prompt...');
    const session = new LanguageModelSession(models[0].id, {
      systemPrompt: 'You are a helpful coding assistant specialized in TypeScript and JavaScript.',
      generationConfig: {
        maxTokens: 150,
        temperature: 0.7,
      },
    });
    console.log('Session created!\n');
    
    // 3. Have a multi-turn conversation
    console.log('💬 Starting conversation...\n');
    
    console.log('User: What is TypeScript?');
    const response1 = await session.generate('What is TypeScript?');
    console.log(`Assistant: ${response1.text}`);
    console.log(`(Finish reason: ${response1.finishReason})\n`);
    
    console.log('User: How is it different from JavaScript?');
    const response2 = await session.generate('How is it different from JavaScript?');
    console.log(`Assistant: ${response2.text}`);
    console.log(`(Finish reason: ${response2.finishReason})\n`);
    
    console.log('User: Can you give me a simple example?');
    const response3 = await session.generate('Can you give me a simple example?', {
      maxTokens: 200, // Override default config for this message
    });
    console.log(`Assistant: ${response3.text}`);
    console.log(`(Finish reason: ${response3.finishReason})\n`);
    
    // 4. Access message history
    console.log('📚 Message history:');
    const messages = session.messages;
    console.log(`Total messages in history: ${messages.length}`);
    messages.forEach((msg, index) => {
      const preview = msg.content.length > 50 
        ? msg.content.substring(0, 50) + '...' 
        : msg.content;
      console.log(`  ${index + 1}. [${msg.role}] ${preview}`);
    });
    console.log();
    
    // 5. Get the underlying model
    console.log('🔍 Accessing underlying model...');
    const model = session.languageModel;
    console.log(`Model ID: ${model.id}`);
    console.log(`Model Name: ${await model.getName()}\n`);
    
    // 6. Reset the session
    console.log('🔄 Resetting session...');
    session.reset();
    console.log(`Messages after reset: ${session.messages.length}`);
    console.log('(System prompt is preserved)\n');
    
    // 7. Start a new conversation after reset
    console.log('💬 New conversation after reset:');
    console.log('User: Hello!');
    const response4 = await session.generate('Hello!');
    console.log(`Assistant: ${response4.text}\n`);
    
    // 8. Create another session without system prompt
    console.log('🔧 Creating session without system prompt...');
    const session2 = new LanguageModelSession(models[0].id);
    const response5 = await session2.generate('Write a haiku about code');
    console.log(`Assistant: ${response5.text}\n`);
    
    // 9. Create session using existing LanguageModel instance
    console.log('🔧 Creating session from LanguageModel instance...');
    const modelInstance = new LanguageModel(models[0].id);
    const session3 = new LanguageModelSession(modelInstance, {
      systemPrompt: 'You are a poet who writes only in haikus.',
    });
    const response6 = await session3.generate('Describe the morning');
    console.log(`Assistant: ${response6.text}\n`);
    
    console.log('✅ Example completed successfully!');
    console.log('\n💡 LanguageModelSession maintains conversation context across multiple turns.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

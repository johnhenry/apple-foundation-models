/**
 * Basic usage example for Apple Foundation Models
 * 
 * This example demonstrates:
 * 1. Listing available models
 * 2. Generating text with default model
 * 3. Generating text with specific model and parameters
 */

import { FoundationModels } from '../dist/index.mjs';

async function main() {
  try {
    console.log('🍎 Apple Foundation Models Example\n');
    
    // 1. List available models
    console.log('📋 Listing available models...');
    const models = await FoundationModels.listAvailableModels();
    
    console.log(`Found ${models.length} model(s):\n`);
    models.forEach((model, index) => {
      console.log(`${index + 1}. ${model.name}`);
      console.log(`   ID: ${model.id}`);
      console.log(`   Max Tokens: ${model.maxTokens}\n`);
    });
    
    // 2. Generate text with default settings
    console.log('✨ Generating text with default settings...');
    const result1 = await FoundationModels.generateText({
      prompt: 'Write a haiku about TypeScript',
    });
    
    console.log('Generated text:');
    console.log(result1.text);
    console.log(`Finish reason: ${result1.finishReason}\n`);
    
    // 3. Generate text with specific parameters
    if (models.length > 0) {
      console.log('🎯 Generating text with specific model and parameters...');
      const result2 = await FoundationModels.generateText({
        prompt: 'Explain what Apple Foundation Models are in one sentence.',
        modelId: models[0].id,
        maxTokens: 100,
        temperature: 0.7,
      });
      
      console.log('Generated text:');
      console.log(result2.text);
      console.log(`Finish reason: ${result2.finishReason}\n`);
    }
    
    console.log('✅ Example completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

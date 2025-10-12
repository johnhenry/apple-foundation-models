/**
 * Basic usage example for Apple Foundation Models
 * 
 * This example demonstrates:
 * 1. Listing available models
 * 2. Generating text with default model
 * 3. Generating text with specific model and parameters
 */

import { LanguageModel } from '../dist/index.mjs';

async function main() {
  try {
    console.log('🍎 Apple Foundation Models Example\n');
    
    // 1. List available models
    console.log('📋 Listing available models...');
    const models = await LanguageModel.availableModels;
    
    console.log(`Found ${models.length} model(s):\n`);
    models.forEach((model, index) => {
      console.log(`${index + 1}. ${model.name}`);
      console.log(`   ID: ${model.id}`);
      console.log(`   Max Tokens: ${model.maxTokens}\n`);
    });
    
    if (models.length === 0) {
      console.log('❌ No models available. Please ensure you have models installed.');
      process.exit(1);
    }
    
    // 2. Create a model instance
    console.log('🔧 Creating LanguageModel instance...');
    const model = new LanguageModel(models[0].id);
    console.log(`Using model: ${await model.getName()}\n`);
    
    // 3. Generate text with default settings
    console.log('✨ Generating text...');
    const result1 = await model.generate('Write a haiku about TypeScript');
    
    console.log('Generated text:');
    console.log(result1.text);
    console.log(`Finish reason: ${result1.finishReason}\n`);
    
    // 4. Generate text with specific parameters
    console.log('🎯 Generating text with specific parameters...');
    const result2 = await model.generate(
      'Explain what Apple Foundation Models are in one sentence.',
      {
        maxTokens: 100,
        temperature: 0.7,
      }
    );
    
    console.log('Generated text:');
    console.log(result2.text);
    console.log(`Finish reason: ${result2.finishReason}\n`);
    
    console.log('✅ Example completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

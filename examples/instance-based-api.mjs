/**
 * Instance-based API example for Apple Foundation Models
 * 
 * This example demonstrates the new 1-to-1 API mapping with the Swift SystemLanguageModel class:
 * 1. Using SystemLanguageModel.default (static property)
 * 2. Using SystemLanguageModel.availableModels (static property)
 * 3. Creating SystemLanguageModel instances
 * 4. Using instance methods for generation
 */

import { SystemLanguageModel } from '../dist/index.mjs';

async function main() {
  try {
    console.log('🍎 Apple Foundation Models - Instance-based API Example\n');
    
    // 1. Access the default model
    console.log('🔧 Accessing default model...');
    const defaultModel = SystemLanguageModel.default;
    console.log(`Default model ID: ${defaultModel.id}`);
    console.log(`Is available: ${defaultModel.isAvailable}\n`);
    
    // 2. List available models using static property
    console.log('📋 Listing available models...');
    const models = await SystemLanguageModel.availableModels;
    
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
    
    // 3. Create a SystemLanguageModel instance
    console.log('🔧 Creating SystemLanguageModel instance...');
    const model = new SystemLanguageModel(models[0].id);
    console.log(`Created model with ID: ${model.id}\n`);
    
    // 4. Get model properties
    console.log('📊 Getting model properties...');
    const name = await model.getName();
    const maxTokens = await model.getMaxTokens();
    console.log(`Model Name: ${name}`);
    console.log(`Max Tokens: ${maxTokens}`);
    console.log(`Is Available: ${model.isAvailable}\n`);
    
    // 5. Generate text using instance method
    console.log('✨ Generating text with instance method...');
    const result = await model.generate('Write a haiku about TypeScript', {
      maxTokens: 100,
      temperature: 0.7,
    });
    
    console.log('Generated text:');
    console.log(result.text);
    console.log(`Finish reason: ${result.finishReason}\n`);
    
    // 6. Generate another response with the same model instance
    console.log('✨ Generating another response...');
    const result2 = await model.generate('Explain what Apple Foundation Models are in one sentence.', {
      maxTokens: 50,
      temperature: 0.5,
    });
    
    console.log('Generated text:');
    console.log(result2.text);
    console.log(`Finish reason: ${result2.finishReason}\n`);
    
    // 7. Create multiple model instances
    if (models.length > 1) {
      console.log('🔄 Creating another model instance...');
      const model2 = new SystemLanguageModel(models[1].id);
      const name2 = await model2.getName();
      console.log(`Created second model: ${name2}\n`);
    }
    
    console.log('✅ Example completed successfully!');
    console.log('\n💡 This instance-based API provides a 1-to-1 mapping with Swift\'s SystemLanguageModel class.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();

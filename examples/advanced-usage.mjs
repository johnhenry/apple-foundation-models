/**
 * Advanced usage example with error handling
 * 
 * This example demonstrates:
 * 1. Error handling for platform checks
 * 2. Fallback behavior
 * 3. Multiple generation attempts with different parameters
 */

import { FoundationModels } from '../dist/index.mjs';

async function generateWithRetry(prompt, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`\n🔄 Attempt ${attempt}/${maxRetries}...`);
      
      const result = await FoundationModels.generateText({
        prompt,
        maxTokens: 150,
        temperature: 0.7,
      });
      
      return result;
    } catch (error) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

async function main() {
  console.log('🍎 Advanced Apple Foundation Models Example\n');
  
  try {
    // Check available models first
    console.log('📋 Checking available models...');
    const models = await FoundationModels.listAvailableModels();
    
    if (models.length === 0) {
      console.warn('⚠️  No models available. This may happen if:');
      console.warn('    - Not running on macOS 15.0+');
      console.warn('    - FoundationModels framework not available');
      console.warn('    - Swift wrapper not built correctly\n');
      process.exit(1);
    }
    
    console.log(`✓ Found ${models.length} model(s)\n`);
    
    // Generate with retry logic
    const prompts = [
      'Explain machine learning in simple terms.',
      'What are the benefits of using TypeScript?',
      'Describe how Swift and JavaScript can work together.',
    ];
    
    for (const prompt of prompts) {
      console.log(`\n📝 Prompt: "${prompt}"`);
      console.log('─'.repeat(60));
      
      try {
        const result = await generateWithRetry(prompt);
        console.log('\n✨ Generated text:');
        console.log(result.text);
        console.log(`\n📊 Finish reason: ${result.finishReason}`);
      } catch (error) {
        console.error(`\n💥 Failed after all retries: ${error.message}`);
      }
      
      console.log('─'.repeat(60));
    }
    
    console.log('\n✅ All examples completed!');
    
  } catch (error) {
    console.error('\n💥 Fatal error:', error.message);
    
    if (error.message.includes('Swift')) {
      console.error('\n💡 Troubleshooting tips:');
      console.error('   1. Make sure you are running on macOS 15.0+');
      console.error('   2. Build the Swift wrapper: npm run build:swift');
      console.error('   3. Check that Swift is installed: swift --version');
      console.error('   4. Verify FoundationModels framework is available\n');
    }
    
    process.exit(1);
  }
}

main();

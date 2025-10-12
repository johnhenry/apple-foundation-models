import { executeSwiftCommand } from './executor.js';
import {
  type LanguageModelInfo,
  type GenerationResult,
  type GenerateTextParams,
  FinishReason,
} from './types.js';

/**
 * Main class providing access to Apple's Foundation Models
 * This is a 1-to-1 mapping of the Swift FoundationModels API
 */
export class FoundationModels {
  /**
   * Get a list of available language models
   * Maps to: LanguageModel.availableModels
   */
  static async listAvailableModels(): Promise<LanguageModelInfo[]> {
    const models = await executeSwiftCommand<LanguageModelInfo[]>('listAvailableModels');
    return models;
  }

  /**
   * Generate text using a language model
   * Maps to: LanguageModel.generate(prompt:config:)
   */
  static async generateText(params: GenerateTextParams): Promise<GenerationResult> {
    const result = await executeSwiftCommand<{
      text: string;
      finishReason: string;
    }>('generateText', params);
    
    return {
      text: result.text,
      finishReason: (result.finishReason as FinishReason) || FinishReason.Unknown,
    };
  }

  /**
   * Generate text with streaming (not yet implemented)
   * This would map to: LanguageModel.generateStream(prompt:config:)
   */
  static async generateStream(params: GenerateTextParams): Promise<AsyncIterableIterator<string>> {
    throw new Error('Streaming is not yet implemented. Use generateText() instead.');
  }
}

/**
 * Legacy export for backward compatibility
 */
export default FoundationModels;

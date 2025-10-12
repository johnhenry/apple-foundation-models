/**
 * Apple Foundation Models for JavaScript
 * 
 * A 1-to-1 TypeScript wrapper for Apple's FoundationModels framework,
 * enabling use in Node.js and other JavaScript frameworks.
 * 
 * @packageDocumentation
 */

export { FoundationModels } from './foundation-models.js';
export type {
  LanguageModelInfo,
  GenerationConfig,
  FinishReason,
  GenerationResult,
  GenerateTextParams,
  GenerateStreamParams,
} from './types.js';

// Default export
export { default } from './foundation-models.js';

/**
 * Apple Foundation Models for JavaScript
 * 
 * A 1-to-1 TypeScript wrapper for Apple's FoundationModels framework,
 * enabling use in Node.js and other JavaScript frameworks.
 * 
 * @packageDocumentation
 */

export { LanguageModel, LanguageModelSession, FoundationModels } from './foundation-models.js';
export type {
  LanguageModelInfo,
  GenerationConfig,
  GenerationResult,
  SessionConfig,
  Message,
  GenerateTextParams,
  GenerateStreamParams,
} from './types.js';
export { FinishReason, MessageRole } from './types.js';

// Default export (legacy)
export { default } from './foundation-models.js';

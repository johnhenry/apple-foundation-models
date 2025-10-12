/**
 * Apple Foundation Models for JavaScript
 * 
 * A 1-to-1 TypeScript wrapper for Apple's FoundationModels framework,
 * enabling use in Node.js and other JavaScript frameworks.
 * 
 * @packageDocumentation
 */

export { SystemLanguageModel, LanguageModelSession } from './foundation-models.js';

// Export all types and enums
export {
  // SystemLanguageModel types
  Availability,
  UseCase,
  
  // LanguageModelSession types
  SamplingMode,
  Instructions,
  Guardrails,
  ToolOutput,
  
  // Legacy types (for backward compatibility)
  FinishReason,
  MessageRole,
} from './types.js';

export type {
  // SystemLanguageModel types
  LanguageModelInfo,
  
  // LanguageModelSession types
  GenerationOptions,
  TranscriptEntry,
  Response,
  
  // Legacy types (for backward compatibility)
  GenerationConfig,
  GenerationResult,
  GenerateTextParams,
  GenerateStreamParams,
  Message,
  SessionConfig,
} from './types.js';

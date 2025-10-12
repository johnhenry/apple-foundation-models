/**
 * Type definitions matching Apple's FoundationModels API
 */

// ============================================================================
// SystemLanguageModel Types
// ============================================================================

/**
 * Availability status of the system language model
 */
export enum Availability {
  /** Model is available and ready to use */
  Available = 'available',
  /** Model is unavailable - device not eligible */
  DeviceNotEligible = 'deviceNotEligible',
  /** Model is unavailable - Apple Intelligence not enabled */
  AppleIntelligenceNotEnabled = 'appleIntelligenceNotEnabled',
  /** Model is unavailable - model not ready (downloading or initializing) */
  ModelNotReady = 'modelNotReady',
}

/**
 * Use case for specialized language models
 */
export enum UseCase {
  /** Specialized for content tagging, entity extraction, and topic detection */
  ContentTagging = 'contentTagging',
}

/**
 * Represents a language model available in FoundationModels
 * (Used internally for compatibility)
 */
export interface LanguageModelInfo {
  /** Unique identifier for the model */
  id: string;
  /** Human-readable name of the model */
  name: string;
  /** Maximum number of tokens the model can generate */
  maxTokens: number;
}

// ============================================================================
// LanguageModelSession Types
// ============================================================================

/**
 * Sampling mode for text generation
 */
export enum SamplingMode {
  /** Deterministic - always picks highest probability token */
  Greedy = 'greedy',
  /** Random sampling from the probability distribution */
  Random = 'random',
}

/**
 * Options for customizing text generation
 */
export interface GenerationOptions {
  /** Sampling mode */
  sampling?: SamplingMode;
  /** Temperature for randomness/creativity (0.0 to 2.0) */
  temperature?: number;
  /** Maximum number of tokens to generate */
  maximumResponseTokens?: number;
}

/**
 * Instructions provide context, role, and preferences for model responses
 */
export class Instructions {
  readonly text!: string;

  constructor(text: string) {
    // Make text truly immutable at runtime
    Object.defineProperty(this, 'text', {
      value: text,
      writable: false,
      enumerable: true,
      configurable: false,
    });
  }
}

/**
 * Guardrails for safety filtering
 */
export class Guardrails {
  private static _default?: Guardrails;

  static get default(): Guardrails {
    if (!this._default) {
      this._default = new Guardrails();
    }
    return this._default;
  }

  private constructor() {}
}

/**
 * Entry in the conversation transcript
 */
export type TranscriptEntry =
  | { type: 'prompt'; content: string }
  | { type: 'response'; content: string }
  | { type: 'instructions'; instructions: Instructions }
  | { type: 'toolCalls'; calls: any[] }
  | { type: 'toolOutput'; output: any };

/**
 * Response from the language model
 */
export interface Response<Content> {
  /** The generated content */
  content: Content;
  /** The sequence of user and assistant messages */
  transcriptEntries: TranscriptEntry[];
}

/**
 * Tool output wrapper
 */
export class ToolOutput {
  readonly value!: string | any;

  constructor(value: string | any) {
    // Make value truly immutable at runtime
    Object.defineProperty(this, 'value', {
      value: value,
      writable: false,
      enumerable: true,
      configurable: false,
    });
  }
}

// ============================================================================
// Legacy/Compatibility Types
// ============================================================================

/**
 * Configuration for text generation (legacy)
 */
export interface GenerationConfig {
  /** Maximum number of tokens to generate */
  maxTokens?: number;
  /** Temperature for sampling (0.0 to 1.0) */
  temperature?: number;
  /** Top-p sampling parameter */
  topP?: number;
  /** Stop sequences */
  stopSequences?: string[];
}

/**
 * Finish reason for generation (legacy)
 */
export enum FinishReason {
  /** Generation completed naturally */
  Stop = 'stop',
  /** Hit maximum token limit */
  Length = 'length',
  /** Content filtered */
  ContentFilter = 'contentFilter',
  /** Unknown or other reason */
  Unknown = 'unknown',
}

/**
 * Result from text generation (legacy)
 */
export interface GenerationResult {
  /** Generated text */
  text: string;
  /** Reason why generation finished */
  finishReason: FinishReason;
}

/**
 * Role of a message in a conversation (legacy)
 */
export enum MessageRole {
  /** System message that sets the context */
  System = 'system',
  /** Message from the user */
  User = 'user',
  /** Message from the assistant */
  Assistant = 'assistant',
}

/**
 * A message in a conversation (legacy)
 */
export interface Message {
  /** Role of the message sender */
  role: MessageRole;
  /** Content of the message */
  content: string;
}

/**
 * Configuration for LanguageModelSession (legacy)
 */
export interface SessionConfig {
  /** System prompt to set the context */
  systemPrompt?: string;
  /** Default generation configuration for the session */
  generationConfig?: GenerationConfig;
}

/**
 * Parameters for generating text (internal)
 */
export interface GenerateTextParams {
  /** The input prompt */
  prompt: string;
  /** Optional model ID to use */
  modelId?: string;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Temperature for sampling */
  temperature?: number;
}

/**
 * Parameters for streaming text generation (internal)
 */
export interface GenerateStreamParams extends GenerateTextParams {
  /** Callback for each chunk of generated text */
  onChunk: (chunk: string) => void;
}

/**
 * Response wrapper from Swift executable (internal)
 */
export interface SwiftResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

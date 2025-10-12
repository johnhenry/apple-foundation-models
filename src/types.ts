/**
 * Type definitions matching Apple's FoundationModels API
 */

/**
 * Represents a language model available in FoundationModels
 */
export interface LanguageModelInfo {
  /** Unique identifier for the model */
  id: string;
  /** Human-readable name of the model */
  name: string;
  /** Maximum number of tokens the model can generate */
  maxTokens: number;
}

/**
 * Configuration for text generation
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
 * Finish reason for generation
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
 * Result from text generation
 */
export interface GenerationResult {
  /** Generated text */
  text: string;
  /** Reason why generation finished */
  finishReason: FinishReason;
}

/**
 * Role of a message in a conversation
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
 * A message in a conversation
 */
export interface Message {
  /** Role of the message sender */
  role: MessageRole;
  /** Content of the message */
  content: string;
}

/**
 * Configuration for LanguageModelSession
 */
export interface SessionConfig {
  /** System prompt to set the context */
  systemPrompt?: string;
  /** Default generation configuration for the session */
  generationConfig?: GenerationConfig;
}

/**
 * Parameters for generating text
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
 * Parameters for streaming text generation
 */
export interface GenerateStreamParams extends GenerateTextParams {
  /** Callback for each chunk of generated text */
  onChunk: (chunk: string) => void;
}

/**
 * Response wrapper from Swift executable
 */
export interface SwiftResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

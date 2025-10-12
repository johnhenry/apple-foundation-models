import { executeSwiftCommand } from './executor.js';
import {
  type LanguageModelInfo,
  type GenerationResult,
  type GenerationConfig,
  type SessionConfig,
  type Message,
  MessageRole,
  FinishReason,
} from './types.js';

/**
 * LanguageModel - Instance-based language model interface
 * This is a 1-to-1 mapping of the Swift LanguageModel class
 * 
 * Usage:
 * ```typescript
 * // List available models
 * const models = await LanguageModel.availableModels;
 * 
 * // Create a model instance
 * const model = new LanguageModel(models[0].id);
 * 
 * // Generate text
 * const result = await model.generate('Write a haiku', { maxTokens: 100 });
 * ```
 */
export class LanguageModel {
  private readonly modelId: string;
  private modelInfo?: LanguageModelInfo;

  /**
   * Get a list of available language models
   * Maps to: LanguageModel.availableModels (static property in Swift)
   */
  static get availableModels(): Promise<LanguageModelInfo[]> {
    return executeSwiftCommand<LanguageModelInfo[]>('listAvailableModels');
  }

  /**
   * Create a new LanguageModel instance
   * Maps to: LanguageModel(id:) initializer in Swift
   * 
   * @param id - The model identifier
   */
  constructor(id: string) {
    this.modelId = id;
  }

  /**
   * Get the model ID
   */
  get id(): string {
    return this.modelId;
  }

  /**
   * Get the model name (lazy loaded)
   */
  async getName(): Promise<string> {
    await this.ensureModelInfo();
    return this.modelInfo?.name ?? 'Unknown';
  }

  /**
   * Get the maximum tokens for this model (lazy loaded)
   */
  async getMaxTokens(): Promise<number> {
    await this.ensureModelInfo();
    return this.modelInfo?.maxTokens ?? 0;
  }

  /**
   * Generate text using this language model
   * Maps to: LanguageModel.generate(prompt:config:) in Swift
   * 
   * @param prompt - The input prompt
   * @param config - Optional generation configuration
   * @returns Promise resolving to the generation result
   */
  async generate(prompt: string, config?: GenerationConfig): Promise<GenerationResult> {
    const result = await executeSwiftCommand<{
      text: string;
      finishReason: string;
    }>('generateText', {
      prompt,
      modelId: this.modelId,
      ...config,
    });
    
    return {
      text: result.text,
      finishReason: (result.finishReason as FinishReason) || FinishReason.Unknown,
    };
  }

  /**
   * Generate text with streaming
   * Maps to: LanguageModel.generateStream(prompt:config:) in Swift
   * 
   * @param prompt - The input prompt
   * @param config - Optional generation configuration
   * @returns AsyncIterableIterator that yields text chunks
   */
  async *generateStream(prompt: string, config?: GenerationConfig): AsyncIterableIterator<string> {
    // TODO: Implement streaming support
    throw new Error('Streaming is not yet implemented. Use generate() instead.');
  }

  /**
   * Ensure model info is loaded
   */
  private async ensureModelInfo(): Promise<void> {
    if (this.modelInfo) {
      return;
    }

    const models = await LanguageModel.availableModels;
    this.modelInfo = models.find(m => m.id === this.modelId);
    
    if (!this.modelInfo) {
      throw new Error(`Model with id '${this.modelId}' not found`);
    }
  }
}

/**
 * LanguageModelSession - Session-based interface for conversational interactions
 * This is a 1-to-1 mapping of the Swift LanguageModelSession class
 * 
 * Usage:
 * ```typescript
 * // Create a session with a model
 * const models = await LanguageModel.availableModels;
 * const session = new LanguageModelSession(models[0].id, {
 *   systemPrompt: 'You are a helpful assistant.',
 * });
 * 
 * // Send messages and get responses
 * const response1 = await session.generate('Hello!');
 * const response2 = await session.generate('Tell me about TypeScript');
 * 
 * // Access message history
 * const history = session.messages;
 * 
 * // Reset the session
 * session.reset();
 * ```
 */
export class LanguageModelSession {
  private readonly model: LanguageModel;
  private readonly config: SessionConfig;
  private messageHistory: Message[] = [];

  /**
   * Create a new LanguageModelSession instance
   * Maps to: LanguageModelSession(model:systemPrompt:) initializer in Swift
   * 
   * @param modelId - The model identifier or LanguageModel instance
   * @param config - Optional session configuration
   */
  constructor(modelId: string | LanguageModel, config?: SessionConfig) {
    this.model = typeof modelId === 'string' ? new LanguageModel(modelId) : modelId;
    this.config = config || {};
    
    // Add system prompt to history if provided
    if (this.config.systemPrompt) {
      this.messageHistory.push({
        role: MessageRole.System,
        content: this.config.systemPrompt,
      });
    }
  }

  /**
   * Get the underlying LanguageModel
   */
  get languageModel(): LanguageModel {
    return this.model;
  }

  /**
   * Get the message history for this session
   */
  get messages(): readonly Message[] {
    return [...this.messageHistory];
  }

  /**
   * Generate a response in the context of this session
   * Maps to: LanguageModelSession.generate(prompt:) in Swift
   * 
   * @param prompt - The user's input prompt
   * @param config - Optional generation configuration (overrides session defaults)
   * @returns Promise resolving to the generation result
   */
  async generate(prompt: string, config?: GenerationConfig): Promise<GenerationResult> {
    // Add user message to history
    this.messageHistory.push({
      role: MessageRole.User,
      content: prompt,
    });

    // Build context from message history
    const contextPrompt = this.buildContextPrompt();

    // Merge configs (parameter config overrides session config)
    const mergedConfig = {
      ...this.config.generationConfig,
      ...config,
    };

    // Generate response
    const result = await this.model.generate(contextPrompt, mergedConfig);

    // Add assistant response to history
    this.messageHistory.push({
      role: MessageRole.Assistant,
      content: result.text,
    });

    return result;
  }

  /**
   * Generate a response with streaming
   * Maps to: LanguageModelSession.generateStream(prompt:) in Swift
   * 
   * @param prompt - The user's input prompt
   * @param config - Optional generation configuration
   * @returns AsyncIterableIterator that yields text chunks
   */
  async *generateStream(prompt: string, config?: GenerationConfig): AsyncIterableIterator<string> {
    // Add user message to history
    this.messageHistory.push({
      role: MessageRole.User,
      content: prompt,
    });

    // TODO: Implement streaming support with proper history management
    throw new Error('Streaming is not yet implemented for sessions. Use generate() instead.');
  }

  /**
   * Reset the session, clearing all message history
   * Maps to: LanguageModelSession.reset() in Swift
   */
  reset(): void {
    this.messageHistory = [];
    
    // Re-add system prompt if it was configured
    if (this.config.systemPrompt) {
      this.messageHistory.push({
        role: MessageRole.System,
        content: this.config.systemPrompt,
      });
    }
  }

  /**
   * Build a context prompt from message history
   * This creates a formatted prompt that includes the conversation context
   */
  private buildContextPrompt(): string {
    return this.messageHistory
      .map(msg => {
        switch (msg.role) {
          case MessageRole.System:
            return `System: ${msg.content}`;
          case MessageRole.User:
            return `User: ${msg.content}`;
          case MessageRole.Assistant:
            return `Assistant: ${msg.content}`;
          default:
            return msg.content;
        }
      })
      .join('\n\n');
  }
}

/**
 * FoundationModels - Legacy static API wrapper for backward compatibility
 * @deprecated Use LanguageModel class instead for 1-to-1 API mapping
 */
export class FoundationModels {
  /**
   * Get a list of available language models
   * @deprecated Use LanguageModel.availableModels instead
   */
  static async listAvailableModels(): Promise<LanguageModelInfo[]> {
    return LanguageModel.availableModels;
  }

  /**
   * Generate text using a language model
   * @deprecated Use LanguageModel instance methods instead
   */
  static async generateText(params: {
    prompt: string;
    modelId?: string;
    maxTokens?: number;
    temperature?: number;
  }): Promise<GenerationResult> {
    let modelId = params.modelId;
    
    if (!modelId) {
      const models = await LanguageModel.availableModels;
      modelId = models[0]?.id;
    }
    
    if (!modelId) {
      throw new Error('No models available');
    }

    const model = new LanguageModel(modelId);
    return model.generate(params.prompt, {
      maxTokens: params.maxTokens,
      temperature: params.temperature,
    });
  }

  /**
   * Generate text with streaming (not yet implemented)
   * @deprecated Use LanguageModel instance methods instead
   */
  static async generateStream(params: {
    prompt: string;
    modelId?: string;
    maxTokens?: number;
    temperature?: number;
  }): Promise<AsyncIterableIterator<string>> {
    throw new Error('Streaming is not yet implemented. Use generate() instead.');
  }
}

/**
 * Legacy default export for backward compatibility
 * @deprecated Use named exports instead
 */
export default FoundationModels;

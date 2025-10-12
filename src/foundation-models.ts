import { executeSwiftCommand, executeSwiftStreamCommand } from './executor.js';
import type { Executor } from './executor-interface.js';
import { ProcessPerCallExecutor } from './executors/process-per-call.js';
import { PersistentServerExecutor } from './executors/persistent-server.js';
import {
  type LanguageModelInfo,
  type GenerationResult,
  type GenerationConfig,
  type GenerationOptions,
  type TranscriptEntry,
  type Response,
  type Tool,
  type ToolCall,
  Availability,
  UseCase,
  Instructions,
  Guardrails,
  ToolOutput,
  FinishReason,
} from './types.js';

/**
 * SystemLanguageModel - Apple's on-device language model
 * This is a 1-to-1 mapping of the Swift SystemLanguageModel class
 * 
 * Usage:
 * ```typescript
 * // Access the default model
 * const model = SystemLanguageModel.default;
 * 
 * // Check availability
 * if (model.isAvailable) {
 *   // Create a session and generate
 *   const session = new LanguageModelSession(model);
 *   const response = await session.respond('Hello!');
 * }
 * 
 * // Or use a specialized model
 * const taggingModel = new SystemLanguageModel(UseCase.ContentTagging);
 * ```
 */
export class SystemLanguageModel {
  private readonly modelId: string;
  private readonly useCase?: UseCase;
  private modelInfo?: LanguageModelInfo;
  private static _defaultInstance?: SystemLanguageModel;

  /**
   * The default system language model
   * Maps to: SystemLanguageModel.default (static property in Swift)
   */
  static get default(): SystemLanguageModel {
    if (!this._defaultInstance) {
      this._defaultInstance = new SystemLanguageModel('default');
    }
    return this._defaultInstance;
  }

  /**
   * Get a list of available language models (internal helper)
   * Note: The actual FoundationModels API only exposes SystemLanguageModel.default
   * This is kept for internal use only.
   * @internal
   */
  private static get availableModels(): Promise<LanguageModelInfo[]> {
    return executeSwiftCommand<LanguageModelInfo[]>('listAvailableModels');
  }

  /**
   * Create a SystemLanguageModel for a specific use case
   * Maps to: SystemLanguageModel(useCase:) initializer in Swift
   * 
   * @param useCase - The specialized use case for the model
   */
  constructor(useCase: UseCase);
  
  /**
   * Create a SystemLanguageModel with a specific model ID (internal use)
   * @param id - The model identifier
   */
  constructor(id: string);
  
  constructor(idOrUseCase: string | UseCase) {
    if (typeof idOrUseCase === 'string') {
      // String ID constructor (internal)
      this.modelId = idOrUseCase;
    } else {
      // UseCase constructor (public API)
      this.useCase = idOrUseCase;
      this.modelId = `useCase-${idOrUseCase}`;
    }
  }

  /**
   * Get the model ID
   */
  get id(): string {
    return this.modelId;
  }

  /**
   * Get the availability status of the model
   * Maps to: SystemLanguageModel.availability (instance property in Swift)
   */
  get availability(): Availability {
    // This would need to be implemented to actually check availability
    // For now, return Available as a placeholder
    return Availability.Available;
  }

  /**
   * Convenience getter to check if the system is entirely ready
   * Maps to: SystemLanguageModel.isAvailable (instance property in Swift)
   */
  get isAvailable(): boolean {
    return this.availability === Availability.Available;
  }

  /**
   * Get the model name (lazy loaded, for internal use)
   * @internal
   */
  async getName(): Promise<string> {
    await this.ensureModelInfo();
    return this.modelInfo?.name ?? 'Unknown';
  }

  /**
   * Get the maximum tokens for this model (lazy loaded, for internal use)
   * @internal
   */
  async getMaxTokens(): Promise<number> {
    await this.ensureModelInfo();
    return this.modelInfo?.maxTokens ?? 0;
  }

  /**
   * Generate text using this language model (internal use - prefer LanguageModelSession)
   * Maps to: SystemLanguageModel.generate(prompt:config:) in Swift
   * @internal
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
   * Generate text with streaming (internal use - prefer LanguageModelSession)
   * Maps to: SystemLanguageModel streaming functionality in Swift
   * @internal
   */
  async *generateStream(prompt: string, config?: GenerationConfig): AsyncIterableIterator<string> {
    // Use the stream executor to get chunks
    for await (const chunk of executeSwiftStreamCommand('generateStream', {
      prompt,
      modelId: this.modelId,
      ...config,
    })) {
      yield chunk;
    }
  }

  /**
   * Ensure model info is loaded
   * @internal
   */
  private async ensureModelInfo(): Promise<void> {
    if (this.modelInfo) {
      return;
    }

    const models = await SystemLanguageModel.availableModels;
    this.modelInfo = models.find(m => m.id === this.modelId);
    
    if (!this.modelInfo) {
      throw new Error(`Model with id '${this.modelId}' not found`);
    }
  }
}

/**
 * LanguageModelSession - Manages stateful interactions with the language model
 * This is a 1-to-1 mapping of the Swift LanguageModelSession class
 * 
 * Usage:
 * ```typescript
 * // Create a session with the default model
 * const session = new LanguageModelSession();
 * 
 * // With instructions
 * const session = new LanguageModelSession(
 *   SystemLanguageModel.default,
 *   Guardrails.default,
 *   [],
 *   new Instructions('You are a helpful assistant.')
 * );
 * 
 * // Send a prompt and get a response
 * const response = await session.respond('Tell me a joke');
 * console.log(response.content);
 * 
 * // Stream a response
 * const stream = session.streamResponse('Write a story');
 * for await (const chunk of stream) {
 *   console.log(chunk);
 * }
 * 
 * // Access conversation history
 * const history = session.transcript;
 * ```
 */
export class LanguageModelSession {
  private readonly model: SystemLanguageModel;
  private readonly guardrails: Guardrails;
  private readonly tools: Tool[];
  private readonly instructions?: Instructions;
  private readonly executor: Executor;
  private transcriptHistory: TranscriptEntry[] = [];
  private _isResponding: boolean = false;

  /**
   * Create a new LanguageModelSession
   *
   * Maps to multiple Swift initializers:
   * - init()
   * - init(instructions:)
   * - init(model:)
   * - init(model:instructions:)
   * - init(model:guardrails:tools:instructions:)
   *
   * Note: The actual Swift API does NOT have a separate `guardrails` parameter.
   * Guardrails are managed internally by the framework.
   *
   * IMPORTANT: Tool execution is not yet fully implemented. Tools can be registered
   * but automatic execution during respond/streamResponse is pending architecture updates.
   * For now, you must manually handle tool calls from the response transcript.
   *
   * @param model - The language model to use (defaults to SystemLanguageModel.default)
   * @param guardrails - Kept for backwards compatibility, but ignored (guardrails are internal)
   * @param tools - Array of tools available for the model to call (defaults to [])
   * @param instructions - Context, role, and preferences for model responses (optional)
   *
   * @example
   * ```typescript
   * class WeatherTool implements Tool {
   *   name = 'getWeather';
   *   description = 'Gets current weather';
   *   async call(args: { city: string }) {
   *     return new ToolOutput(`Sunny in ${args.city}`);
   *   }
   * }
   *
   * const session = new LanguageModelSession(
   *   SystemLanguageModel.default,
   *   Guardrails.default,
   *   [new WeatherTool()],
   *   new Instructions('You can check weather')
   * );
   * ```
   */
  constructor(
    model: SystemLanguageModel = SystemLanguageModel.default,
    guardrails: Guardrails = Guardrails.default,
    tools: Tool[] = [],
    instructions?: Instructions
  ) {
    this.model = model;
    this.guardrails = guardrails;  // Stored but not used (matches actual API behavior)
    this.tools = tools;
    this.instructions = instructions;

    // MODAL EXECUTOR SELECTION
    // - Tools present → PersistentServerExecutor (enables bidirectional communication)
    // - No tools → ProcessPerCallExecutor (fast path, current behavior)
    if (tools.length > 0) {
      this.executor = new PersistentServerExecutor(tools);
    } else {
      this.executor = new ProcessPerCallExecutor();
    }

    // Add instructions to transcript if provided
    if (this.instructions) {
      this.transcriptHistory.push({
        type: 'instructions',
        instructions: this.instructions,
      });
    }
  }

  /**
   * Indicates whether the model is currently generating a response
   * Maps to: LanguageModelSession.isResponding (instance property in Swift)
   */
  get isResponding(): boolean {
    return this._isResponding;
  }

  /**
   * Get the conversation transcript
   * Maps to: LanguageModelSession.transcript (instance property in Swift)
   */
  get transcript(): readonly TranscriptEntry[] {
    return [...this.transcriptHistory];
  }

  /**
   * Send a prompt and get a complete response
   * Maps to: LanguageModelSession.respond(to:) in Swift
   * 
   * @param prompt - The text prompt to send to the model
   * @returns Promise resolving to Response containing the model's reply
   */
  async respond(prompt: string): Promise<Response<string>>;
  
  /**
   * Send a prompt with custom generation options
   * Maps to: LanguageModelSession.respond(to:options:) in Swift
   * 
   * @param prompt - The text prompt to send
   * @param options - Configuration for generation behavior
   * @returns Promise resolving to Response containing the model's reply
   */
  async respond(prompt: string, options: GenerationOptions): Promise<Response<string>>;
  
  async respond(prompt: string, options?: GenerationOptions): Promise<Response<string>> {
    this._isResponding = true;

    try {
      // Add prompt to transcript
      this.transcriptHistory.push({
        type: 'prompt',
        content: prompt,
      });

      // Build context from transcript
      const contextPrompt = this.buildContextPrompt();

      // Execute via selected executor (modal: ProcessPerCall or PersistentServer)
      const data = await this.executor.execute<{ text?: string; content?: string }>('generateText', {
        prompt: contextPrompt,
        maxTokens: options?.maximumResponseTokens,
        temperature: options?.temperature,
        sampling: options?.sampling,
      });

      // Swift wrapper returns 'text', but accept 'content' for backward compatibility
      const responseText = data.text || data.content || '';

      // Add response to transcript
      this.transcriptHistory.push({
        type: 'response',
        content: responseText,
      });

      return {
        content: responseText,
        transcriptEntries: [...this.transcriptHistory],
      };
    } finally {
      this._isResponding = false;
    }
  }

  /**
   * Stream the model's response incrementally
   * Maps to: LanguageModelSession.streamResponse(to:) in Swift
   *
   * @param prompt - The text prompt to send
   * @returns AsyncIterable that yields text chunks
   */
  async *streamResponse(prompt: string): AsyncIterableIterator<string> {
    this._isResponding = true;

    try {
      // Add prompt to transcript
      this.transcriptHistory.push({
        type: 'prompt',
        content: prompt,
      });

      // Build context from transcript
      const contextPrompt = this.buildContextPrompt();

      // Stream via selected executor (modal: ProcessPerCall or PersistentServer)
      let fullResponse = '';
      for await (const chunk of this.executor.executeStream('generateStream', { prompt: contextPrompt })) {
        fullResponse += chunk;
        yield chunk;
      }

      // Add complete response to transcript
      this.transcriptHistory.push({
        type: 'response',
        content: fullResponse,
      });
    } finally {
      this._isResponding = false;
    }
  }

  /**
   * Preload session resources for faster initial responses
   * Maps to: LanguageModelSession.prewarm() in Swift
   *
   * Prewarming initializes the model and allocates resources ahead of time,
   * reducing latency for the first generation request. This is especially useful
   * when you know you'll need the model soon but want to minimize wait time.
   *
   * @example
   * ```typescript
   * const session = new LanguageModelSession();
   * await session.prewarm(); // Initialize resources
   * // First generation will be faster
   * const response = await session.respond('Hello');
   * ```
   */
  async prewarm(): Promise<void> {
    await executeSwiftCommand('prewarm', {});
  }

  /**
   * Preload session with a prompt prefix for optimized generation
   * Maps to: LanguageModelSession.prewarm(promptPrefix:) in Swift
   *
   * Prewarming with a prefix allows the model to process and cache the prefix,
   * which can significantly speed up generation when using that prefix. This is
   * particularly useful for system prompts that will be reused or template-based generation.
   *
   * @param promptPrefix - The prompt prefix to preload
   * @example
   * ```typescript
   * const session = new LanguageModelSession();
   * await session.prewarmWithPrefix('You are a helpful coding assistant.');
   * // Subsequent generations with this prefix will be faster
   * const response = await session.respond('that specializes in TypeScript...');
   * ```
   */
  async prewarmWithPrefix(promptPrefix: string): Promise<void> {
    await executeSwiftCommand('prewarmWithPrefix', { prefix: promptPrefix });
  }

  /**
   * Close the session and clean up resources
   *
   * **API DEVIATION**: This method does not exist in the Swift FoundationModels API,
   * where resource cleanup is automatic via ARC (Automatic Reference Counting).
   * In JavaScript, we need explicit cleanup for:
   * - Persistent server processes (when using tools)
   * - Unix socket connections
   * - Background threads
   *
   * **When to call**:
   * - Required: When session has tools (uses persistent server)
   * - Optional: When session has no tools (process-per-call, no cleanup needed)
   *
   * **Best Practice**: Always call close() in a finally block or use try-finally pattern.
   *
   * @example
   * ```typescript
   * // With tools (persistent server - cleanup required)
   * const session = new LanguageModelSession(model, undefined, [weatherTool]);
   * try {
   *   await session.respond('What\'s the weather?');
   * } finally {
   *   await session.close();  // Shuts down server, removes socket
   * }
   *
   * // Without tools (process-per-call - cleanup optional but harmless)
   * const simpleSession = new LanguageModelSession();
   * try {
   *   await simpleSession.respond('Hello');
   * } finally {
   *   await simpleSession.close();  // No-op, but good practice
   * }
   * ```
   */
  async close(): Promise<void> {
    await this.executor.close();
  }

  /**
   * Build a context prompt from transcript history
   * @internal
   */
  private buildContextPrompt(): string {
    return this.transcriptHistory
      .map(entry => {
        switch (entry.type) {
          case 'instructions':
            return `Instructions: ${entry.instructions.text}`;
          case 'prompt':
            return `User: ${entry.content}`;
          case 'response':
            return `Assistant: ${entry.content}`;
          case 'toolCalls':
            return `Tools called: ${entry.calls.length}`;
          case 'toolOutput':
            return `Tool output: ${JSON.stringify(entry.output)}`;
          default:
            return '';
        }
      })
      .filter(Boolean)
      .join('\n\n');
  }
}

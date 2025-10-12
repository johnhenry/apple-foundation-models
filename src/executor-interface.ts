/**
 * Executor interface for different execution strategies
 *
 * This abstraction allows the LanguageModelSession to work with either:
 * - ProcessPerCallExecutor: Fast path for simple operations (no tools)
 * - PersistentServerExecutor: Tool-enabled path with bidirectional communication
 */

export interface Executor {
  /**
   * Execute a single command and return the result
   * @param action - The action to perform (e.g., 'generateText', 'prewarm')
   * @param parameters - Parameters for the action
   * @returns Promise resolving to the result
   */
  execute<T = any>(action: string, parameters?: Record<string, any>): Promise<T>;

  /**
   * Execute a streaming command and yield chunks
   * @param action - The streaming action to perform (e.g., 'generateStream')
   * @param parameters - Parameters for the action
   * @returns AsyncIterableIterator yielding string chunks
   */
  executeStream(action: string, parameters?: Record<string, any>): AsyncIterableIterator<string>;

  /**
   * Close the executor and clean up resources
   * For ProcessPerCallExecutor: No-op
   * For PersistentServerExecutor: Shuts down server and cleans up socket
   */
  close(): Promise<void>;
}

/**
 * Process-Per-Call Executor
 *
 * This is the original fast-path executor that spawns a new Swift process
 * for each operation. Used when tools are not needed.
 *
 * Performance characteristics:
 * - Latency: ~1.0s per call
 * - Stateless: No cleanup needed
 * - Isolated: Each call independent
 * - Simple: No connection management
 */

import { executeSwiftCommand, executeSwiftStreamCommand } from '../executor.js';
import type { Executor } from '../executor-interface.js';

export class ProcessPerCallExecutor implements Executor {
  /**
   * Execute a command via process-per-call pattern
   * Spawns a new Swift process for each call
   */
  async execute<T = any>(action: string, parameters?: Record<string, any>): Promise<T> {
    return executeSwiftCommand<T>(action, parameters);
  }

  /**
   * Execute a streaming command via process-per-call pattern
   * Spawns a new Swift process that streams results
   */
  async *executeStream(action: string, parameters?: Record<string, any>): AsyncIterableIterator<string> {
    yield* executeSwiftStreamCommand(action, parameters);
  }

  /**
   * Close the executor
   * No-op for process-per-call since there's no persistent state
   */
  async close(): Promise<void> {
    // Nothing to clean up
  }
}

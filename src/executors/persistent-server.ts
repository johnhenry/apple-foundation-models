/**
 * Persistent Server Executor
 *
 * This executor communicates with a long-lived Swift server process via
 * Unix domain socket and JSON-RPC protocol. Used when tools are needed
 * to enable bidirectional communication during generation.
 *
 * Performance characteristics:
 * - First call: ~1.2s (includes server startup)
 * - Subsequent calls: ~0.7s (no spawn overhead)
 * - Tool callbacks: Real-time bidirectional communication
 * - Cleanup required: Must call close() to shutdown server
 */

import { spawn, type ChildProcess } from 'child_process';
import net from 'net';
import { unlinkSync, existsSync } from 'fs';
import { randomUUID } from 'crypto';
import readline from 'readline';
import type { Executor } from '../executor-interface.js';
import type { Tool, ToolOutput, SwiftResponse } from '../types.js';
import { getSwiftExecutablePath } from '../executor.js';

interface Message {
  jsonrpc: '2.0';
  id?: string;
  method?: string;
  params?: any;
  result?: any;
  error?: { code: number; message: string };
}

// Counter to ensure unique socket paths even within same millisecond
let socketCounter = 0;

export class PersistentServerExecutor implements Executor {
  private socket?: net.Socket;
  private serverProcess?: ChildProcess;
  private tools: Map<string, Tool>;
  private socketPath: string;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private connected: boolean = false;
  private connecting: Promise<void> | null = null;

  constructor(tools: Tool[]) {
    this.tools = new Map(tools.map((t) => [t.name, t]));
    // Use process PID, timestamp, and counter to ensure unique socket path
    this.socketPath = `/tmp/afm-${process.pid}-${Date.now()}-${socketCounter++}.sock`;
  }

  /**
   * Ensure connection to Swift server
   * Starts server if not running and connects socket
   */
  private async ensureConnected(): Promise<void> {
    if (this.connected && this.socket?.writable) {
      return;
    }

    // Prevent multiple concurrent connection attempts
    if (this.connecting) {
      return this.connecting;
    }

    this.connecting = (async () => {
      try {
        // Start server if not running
        if (!this.serverProcess || this.serverProcess.exitCode !== null) {
          await this.startServer();
        }

        // Connect socket if not connected
        if (!this.socket || !this.socket.writable) {
          await this.connectSocket();
        }

        this.connected = true;
      } finally {
        this.connecting = null;
      }
    })();

    return this.connecting;
  }

  /**
   * Start the Swift server process
   */
  private async startServer(): Promise<void> {
    const serverPath = getSwiftExecutablePath();

    // Clean up old socket file if exists
    if (existsSync(this.socketPath)) {
      unlinkSync(this.socketPath);
    }

    // Spawn server process
    this.serverProcess = spawn(serverPath, ['--persistent-server', '--socket', this.socketPath], {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    // Log server stderr for debugging
    if (this.serverProcess.stderr) {
      const rl = readline.createInterface({ input: this.serverProcess.stderr });
      rl.on('line', (line) => {
        console.error('[Swift Server]:', line);
      });
    }

    // Handle server exit
    this.serverProcess.on('exit', (code) => {
      console.error(`[Swift Server] Exited with code ${code}`);
      this.connected = false;
      this.socket?.destroy();
      this.socket = undefined;
    });

    // Wait for socket file to be created (server is ready)
    await this.waitForSocket(5000);
  }

  /**
   * Wait for Unix socket file to exist
   */
  private async waitForSocket(timeoutMs: number): Promise<void> {
    const startTime = Date.now();

    while (!existsSync(this.socketPath)) {
      if (Date.now() - startTime > timeoutMs) {
        throw new Error(`Timeout waiting for server socket: ${this.socketPath}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // Give server a moment to start listening
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * Connect to the Unix socket
   */
  private async connectSocket(): Promise<void> {
    this.socket = net.createConnection(this.socketPath);

    // Set up message handler
    let buffer = '';
    this.socket.on('data', (data) => {
      buffer += data.toString();

      // Process complete lines (JSON-RPC messages)
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const message: Message = JSON.parse(line);
          this.handleMessage(message);
        } catch (error) {
          console.error('[Socket] Failed to parse message:', error);
        }
      }
    });

    this.socket.on('error', (error) => {
      console.error('[Socket] Error:', error);
      this.connected = false;
    });

    this.socket.on('close', () => {
      this.connected = false;
    });

    // Wait for connection
    await new Promise<void>((resolve, reject) => {
      this.socket!.once('connect', () => resolve());
      this.socket!.once('error', (err) => reject(err));
    });

    // Send tool definitions to server
    await this.sendToolDefinitions();
  }

  /**
   * Send tool definitions to Swift server
   */
  private async sendToolDefinitions(): Promise<void> {
    const toolDefs = Array.from(this.tools.values()).map((tool) => ({
      name: tool.name,
      description: tool.description,
    }));

    await this.sendRequest('registerTools', { tools: toolDefs });
  }

  /**
   * Handle incoming message from Swift server
   */
  private async handleMessage(message: Message): Promise<void> {
    // Tool call request from Swift
    if (message.method === 'executeTool') {
      await this.handleToolCall(message);
      return;
    }

    // Response to a request we sent
    if (message.id) {
      const handler = this.messageHandlers.get(message.id);
      if (handler) {
        if (message.error) {
          handler({ error: message.error.message });
        } else {
          handler({ result: message.result });
        }
        this.messageHandlers.delete(message.id);
      }
    }
  }

  /**
   * Handle tool execution request from Swift
   */
  private async handleToolCall(message: Message): Promise<void> {
    const { name, arguments: args } = message.params;
    const tool = this.tools.get(name);

    if (!tool) {
      this.sendResponse(message.id!, {
        error: { code: -32601, message: `Tool not found: ${name}` },
      });
      return;
    }

    try {
      const result = await tool.call(args);

      // Send result back to Swift
      this.sendResponse(message.id!, {
        result: result.value,
      });
    } catch (error) {
      this.sendResponse(message.id!, {
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Tool execution failed',
        },
      });
    }
  }

  /**
   * Send JSON-RPC request to Swift server
   */
  private async sendRequest<T>(method: string, params?: any): Promise<T> {
    const id = randomUUID();

    return new Promise((resolve, reject) => {
      // Register handler for response
      this.messageHandlers.set(id, (data) => {
        if (data.error) {
          reject(new Error(data.error));
        } else {
          resolve(data.result as T);
        }
      });

      // Send request
      const message: Message = {
        jsonrpc: '2.0',
        id,
        method,
        params,
      };

      this.socket!.write(JSON.stringify(message) + '\n');

      // Timeout after 30s
      setTimeout(() => {
        if (this.messageHandlers.has(id)) {
          this.messageHandlers.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  /**
   * Send JSON-RPC response to Swift server
   */
  private sendResponse(id: string, response: { result?: any; error?: any }): void {
    const message: Message = {
      jsonrpc: '2.0',
      id,
      ...response,
    };

    this.socket!.write(JSON.stringify(message) + '\n');
  }

  /**
   * Execute a command via persistent server
   */
  async execute<T = any>(action: string, parameters?: Record<string, any>): Promise<T> {
    await this.ensureConnected();
    return this.sendRequest<T>(action, parameters);
  }

  /**
   * Execute a streaming command via persistent server
   */
  async *executeStream(action: string, parameters?: Record<string, any>): AsyncIterableIterator<string> {
    await this.ensureConnected();

    const id = randomUUID();
    const chunks: string[] = [];
    let done = false;
    let error: Error | null = null;

    // Register handler for streaming responses
    this.messageHandlers.set(id, (data) => {
      if (data.error) {
        error = new Error(data.error);
        done = true;
      } else if (data.result?.done) {
        done = true;
      } else if (data.result?.chunk) {
        chunks.push(data.result.chunk);
      }
    });

    // Send streaming request
    const message: Message = {
      jsonrpc: '2.0',
      id,
      method: `${action}Stream`,
      params: parameters,
    };

    this.socket!.write(JSON.stringify(message) + '\n');

    // Yield chunks as they arrive
    while (!done) {
      if (error) {
        throw error;
      }

      if (chunks.length > 0) {
        yield chunks.shift()!;
      } else {
        // Small delay to avoid busy-waiting
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    // Yield any remaining chunks
    while (chunks.length > 0) {
      yield chunks.shift()!;
    }

    this.messageHandlers.delete(id);
  }

  /**
   * Close the executor and clean up resources
   * Shuts down Swift server and removes socket file
   */
  async close(): Promise<void> {
    // Close socket
    if (this.socket) {
      this.socket.destroy();
      this.socket = undefined;
    }

    // Terminate server process
    if (this.serverProcess && this.serverProcess.exitCode === null) {
      this.serverProcess.kill('SIGTERM');

      // Wait for graceful shutdown with timeout
      await Promise.race([
        new Promise<void>((resolve) => {
          this.serverProcess!.once('exit', () => resolve());
        }),
        new Promise<void>((resolve) => setTimeout(resolve, 2000)),
      ]);

      // Force kill if still alive
      if (this.serverProcess.exitCode === null) {
        this.serverProcess.kill('SIGKILL');
      }

      this.serverProcess = undefined;
    }

    // Clean up socket file
    try {
      if (existsSync(this.socketPath)) {
        unlinkSync(this.socketPath);
      }
    } catch (error) {
      // Ignore cleanup errors
    }

    this.connected = false;
  }
}

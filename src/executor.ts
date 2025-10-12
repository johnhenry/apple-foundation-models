import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { accessSync, constants } from 'fs';
import type { SwiftResponse } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Get the path to the Swift executable
 */
export function getSwiftExecutablePath(): string {
  // In production, the executable is in swift/.build/release
  // During development, it might be in swift/.build/debug
  const productionPath = join(__dirname, '..', 'swift', '.build', 'release', 'AppleFoundationModelsWrapper');
  const debugPath = join(__dirname, '..', 'swift', '.build', 'debug', 'AppleFoundationModelsWrapper');
  
  // Try production path first
  try {
    accessSync(productionPath, constants.X_OK);
    return productionPath;
  } catch {
    return debugPath;
  }
}

/**
 * Execute a command via the Swift wrapper
 */
export async function executeSwiftCommand<T = any>(
  action: string,
  parameters?: Record<string, any>
): Promise<T> {
  const executablePath = getSwiftExecutablePath();

  const command = {
    action,
    parameters: parameters || {},
  };

  const commandJson = JSON.stringify(command);

  return new Promise((resolve, reject) => {
    const child = spawn(executablePath, [], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (error) => {
      reject(new Error(`Failed to spawn Swift process: ${error.message}`));
    });

    child.on('close', (code) => {
      if (stderr) {
        console.error('Swift stderr:', stderr);
      }

      if (code !== 0) {
        reject(new Error(`Swift process exited with code ${code}`));
        return;
      }

      try {
        const response: SwiftResponse<T> = JSON.parse(stdout);

        if (!response.success) {
          reject(new Error(response.error || 'Unknown error from Swift wrapper'));
          return;
        }

        resolve(response.data as T);
      } catch (error) {
        reject(new Error(`Failed to parse Swift response: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });

    // Write command to stdin and close
    child.stdin.write(commandJson + '\n');
    child.stdin.end();
  });
}

/**
 * Execute a streaming command via the Swift wrapper
 * Yields chunks as they arrive
 *
 * IMPLEMENTATION NOTE: This function reads stdout line-by-line, parsing each line
 * as a separate JSON response. The Swift wrapper outputs single-line JSON for each
 * chunk (using printCompactResponse) to enable this streaming architecture.
 * Protocol: {"success":true,"data":{"chunk":"text","done":false}}
 */
export async function* executeSwiftStreamCommand(
  action: string,
  parameters?: Record<string, any>
): AsyncIterableIterator<string> {
  const executablePath = getSwiftExecutablePath();

  const command = {
    action,
    parameters: parameters || {},
  };

  const commandJson = JSON.stringify(command);

  const child = spawn(executablePath, [], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  let stderr = '';
  let buffer = '';

  child.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  // Write command to stdin and close
  child.stdin.write(commandJson + '\n');
  child.stdin.end();

  // Process stdout line by line
  for await (const data of child.stdout) {
    buffer += data.toString();

    // Split by newlines and process complete lines
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep incomplete line in buffer

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const response: SwiftResponse<{ chunk: string; done: boolean }> = JSON.parse(line);

        if (!response.success) {
          throw new Error(response.error || 'Unknown error from Swift wrapper');
        }

        if (response.data?.done) {
          // Stream is complete
          return;
        }

        if (response.data?.chunk) {
          yield response.data.chunk;
        }
      } catch (error) {
        throw new Error(`Failed to parse streaming response: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  // Handle any remaining buffer
  if (buffer.trim()) {
    try {
      const response: SwiftResponse<{ chunk: string; done: boolean }> = JSON.parse(buffer);
      if (!response.success) {
        throw new Error(response.error || 'Unknown error from Swift wrapper');
      }
    } catch (error) {
      // Ignore parse errors for the final buffer
    }
  }

  // Check for process errors
  const exitCode = await new Promise<number | null>((resolve) => {
    child.on('close', resolve);
  });

  if (stderr) {
    console.error('Swift stderr:', stderr);
  }

  if (exitCode !== 0) {
    throw new Error(`Swift process exited with code ${exitCode}`);
  }
}

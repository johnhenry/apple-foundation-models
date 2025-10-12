import { spawn } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
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
    require('fs').accessSync(productionPath, require('fs').constants.X_OK);
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

#!/usr/bin/env node

/**
 * Build the Swift wrapper executable
 * This script is run during postinstall to compile the Swift code
 */

const { execSync } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');
const os = require('os');

const swiftDir = path.join(__dirname, '..', 'swift');
const packageSwift = path.join(swiftDir, 'Package.swift');

// Only build on macOS
if (os.platform() !== 'darwin') {
  console.log('⏭️  Skipping Swift build (not on macOS)');
  process.exit(0);
}

// Check if Swift is available
try {
  execSync('swift --version', { stdio: 'ignore' });
} catch (error) {
  console.error('\n❌ Error: Swift compiler not found');
  console.error('Please install Swift from https://swift.org or via Xcode\n');
  process.exit(1);
}

// Check if Package.swift exists
if (!existsSync(packageSwift)) {
  console.error('\n❌ Error: Package.swift not found');
  console.error(`Expected at: ${packageSwift}\n`);
  process.exit(1);
}

console.log('🔨 Building Swift wrapper...');
console.log(`   Working directory: ${swiftDir}`);

try {
  // Build in release mode
  execSync('swift build -c release', {
    cwd: swiftDir,
    stdio: 'inherit',
  });
  
  console.log('✓ Swift build completed successfully');
} catch (error) {
  console.error('\n❌ Failed to build Swift wrapper');
  console.error('This may happen if:');
  console.error('  - FoundationModels framework is not available (requires macOS 15.0+)');
  console.error('  - Xcode Command Line Tools are not installed');
  console.error('  - Swift version is incompatible\n');
  
  // Don't fail installation, but warn
  console.warn('⚠️  Installation will continue, but the package may not work.\n');
  process.exit(0);
}

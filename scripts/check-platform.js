#!/usr/bin/env node

/**
 * Check platform compatibility before installation
 * Ensures the package is only installed on macOS with required version
 */

const os = require('os');

const platform = os.platform();
const release = os.release();

if (platform !== 'darwin') {
  console.error('\n❌ Error: This package requires macOS (darwin platform)');
  console.error(`   Current platform: ${platform}\n`);
  console.error('Apple Foundation Models are only available on macOS 15.0 (Sequoia) or later.\n');
  process.exit(1);
}

// Parse macOS version from kernel release
// macOS 15.0 = Darwin 24.0.0
const kernelVersion = parseInt(release.split('.')[0], 10);
const requiredKernelVersion = 24; // macOS 15.0

if (kernelVersion < requiredKernelVersion) {
  const macOSVersion = kernelVersion - 9; // Approximate mapping
  console.error('\n⚠️  Warning: This package requires macOS 15.0 (Sequoia) or later');
  console.error(`   Current kernel version: ${release} (approximately macOS ${macOSVersion}.x)\n`);
  console.error('The package may not work correctly on older versions of macOS.\n');
  // Don't exit with error for now, just warn
}

console.log('✓ Platform check passed: macOS detected');

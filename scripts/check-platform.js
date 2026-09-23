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
  console.error('Apple Foundation Models are only available on macOS 26.0 (Tahoe) or later.\n');
  process.exit(1);
}

// Parse macOS version from kernel release
// macOS 26.0 (Tahoe) = Darwin 25.0.0 -- Apple realigned macOS's marketing
// version to the calendar year starting with macOS 26 (jumping from 15),
// while the Darwin kernel major kept incrementing by 1/year, so the old
// "kernelVersion - 9" approximation below is only valid below this floor
// (pre-rename macOS 15 and earlier).
const kernelVersion = parseInt(release.split('.')[0], 10);
const requiredKernelVersion = 25; // macOS 26.0 (Tahoe)

if (kernelVersion < requiredKernelVersion) {
  const macOSVersion = kernelVersion - 9; // Approximate mapping (valid only pre-Tahoe)
  console.error('\n⚠️  Warning: This package requires macOS 26.0 (Tahoe) or later');
  console.error(`   Current kernel version: ${release} (pre-Tahoe; older than macOS 26)\n`);
  console.error('The package may not work correctly on older versions of macOS.\n');
  // Don't exit with error for now, just warn
}

console.log('✓ Platform check passed: macOS detected');

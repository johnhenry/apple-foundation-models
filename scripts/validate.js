#!/usr/bin/env node

/**
 * Validation script to check package integrity
 * Runs various checks to ensure the package is properly configured
 */

import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

let errors = 0;
let warnings = 0;

function error(msg) {
  console.error(`❌ ERROR: ${msg}`);
  errors++;
}

function warn(msg) {
  console.warn(`⚠️  WARNING: ${msg}`);
  warnings++;
}

function success(msg) {
  console.log(`✅ ${msg}`);
}

console.log('🔍 Validating package...\n');

// Check package.json
console.log('Checking package.json...');
const packagePath = join(rootDir, 'package.json');
if (!existsSync(packagePath)) {
  error('package.json not found');
} else {
  const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
  
  if (!pkg.name) error('package.json missing "name"');
  else success(`Package name: ${pkg.name}`);
  
  if (!pkg.version) error('package.json missing "version"');
  else success(`Package version: ${pkg.version}`);
  
  if (!pkg.main) error('package.json missing "main"');
  else success(`Main entry: ${pkg.main}`);
  
  if (!pkg.module) error('package.json missing "module"');
  else success(`Module entry: ${pkg.module}`);
  
  if (!pkg.types) error('package.json missing "types"');
  else success(`Types entry: ${pkg.types}`);
  
  if (!pkg.exports) warn('package.json missing "exports"');
  else success('Exports field configured');
  
  if (!pkg.files || !pkg.files.includes('dist')) {
    error('package.json files should include "dist"');
  } else {
    success('Files field includes dist');
  }
}

// Check dist directory
console.log('\nChecking dist directory...');
const distPath = join(rootDir, 'dist');
if (!existsSync(distPath)) {
  error('dist directory not found - run npm run build');
} else {
  const requiredFiles = [
    'index.mjs',
    'index.cjs',
    'index.d.ts',
    'index.mjs.map',
    'index.cjs.map',
    'index.d.ts.map',
  ];
  
  for (const file of requiredFiles) {
    const filePath = join(distPath, file);
    if (!existsSync(filePath)) {
      error(`Missing dist file: ${file}`);
    } else {
      success(`Found dist/${file}`);
    }
  }
}

// Check Swift files
console.log('\nChecking Swift files...');
const swiftPackagePath = join(rootDir, 'swift', 'Package.swift');
if (!existsSync(swiftPackagePath)) {
  error('swift/Package.swift not found');
} else {
  success('Swift package manifest found');
}

const swiftMainPath = join(rootDir, 'swift', 'Sources', 'AppleFoundationModelsWrapper', 'main.swift');
if (!existsSync(swiftMainPath)) {
  error('Swift main.swift not found');
} else {
  success('Swift main source found');
}

// Check scripts
console.log('\nChecking scripts...');
const buildSwiftPath = join(rootDir, 'scripts', 'build-swift.js');
if (!existsSync(buildSwiftPath)) {
  error('scripts/build-swift.js not found');
} else {
  success('Build Swift script found');
}

const checkPlatformPath = join(rootDir, 'scripts', 'check-platform.js');
if (!existsSync(checkPlatformPath)) {
  error('scripts/check-platform.js not found');
} else {
  success('Platform check script found');
}

// Check TypeScript config
console.log('\nChecking TypeScript configuration...');
const tsconfigPath = join(rootDir, 'tsconfig.json');
if (!existsSync(tsconfigPath)) {
  error('tsconfig.json not found');
} else {
  success('TypeScript config found');
}

const tsconfigBuildPath = join(rootDir, 'tsconfig.build.json');
if (!existsSync(tsconfigBuildPath)) {
  error('tsconfig.build.json not found');
} else {
  success('TypeScript build config found');
}

// Check documentation
console.log('\nChecking documentation...');
const docs = ['README.md', 'LICENSE', 'CHANGELOG.md', 'CONTRIBUTING.md', 'QUICKSTART.md'];
for (const doc of docs) {
  const docPath = join(rootDir, doc);
  if (!existsSync(docPath)) {
    warn(`${doc} not found`);
  } else {
    success(`${doc} found`);
  }
}

// Check examples
console.log('\nChecking examples...');
const examplesPath = join(rootDir, 'examples');
if (!existsSync(examplesPath)) {
  warn('examples directory not found');
} else {
  success('Examples directory found');
}

// Check tests
console.log('\nChecking tests...');
const testPath = join(rootDir, 'test');
if (!existsSync(testPath)) {
  warn('test directory not found');
} else {
  success('Test directory found');
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('VALIDATION SUMMARY');
console.log('='.repeat(60));

if (errors > 0) {
  console.error(`\n❌ Found ${errors} error(s)`);
}

if (warnings > 0) {
  console.warn(`⚠️  Found ${warnings} warning(s)`);
}

if (errors === 0 && warnings === 0) {
  console.log('\n🎉 All checks passed! Package is ready.');
} else if (errors === 0) {
  console.log('\n✓ Package is valid with some warnings.');
} else {
  console.log('\n❌ Package has errors that need to be fixed.');
  process.exit(1);
}

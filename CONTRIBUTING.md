# Contributing to Apple Foundation Models for JavaScript

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## Development Setup

1. **Requirements**
   - macOS 15.0 (Sequoia) or later
   - Node.js 18.0.0 or later
   - Swift 6.0 or later
   - Xcode Command Line Tools

2. **Clone and Install**
   ```bash
   git clone https://github.com/johnhenry/apple-foundation-models.git
   cd apple-foundation-models
   npm install
   ```

3. **Build**
   ```bash
   # Build Swift wrapper
   npm run build:swift
   
   # Build JavaScript/TypeScript
   npm run build
   ```

## Project Structure

```
.
├── src/                    # TypeScript source
│   ├── index.ts           # Main entry point
│   ├── foundation-models.ts # Core API
│   ├── executor.ts        # Swift command executor
│   └── types.ts           # Type definitions
├── swift/                  # Swift wrapper
│   ├── Package.swift      # Swift package manifest
│   └── Sources/
│       └── AppleFoundationModelsWrapper/
│           └── main.swift # Swift executable
├── scripts/                # Build scripts
├── test/                   # Tests
└── examples/               # Usage examples
```

## Making Changes

1. **Code Style**
   - Follow existing code style
   - Use TypeScript for all new JavaScript code
   - Follow Swift conventions for Swift code
   - Add JSDoc comments for public APIs

2. **Testing**
   - Add tests for new features
   - Ensure all tests pass: `npm test`
   - Test on actual macOS if possible

3. **Documentation**
   - Update README.md if adding new features
   - Add JSDoc comments for new APIs
   - Update examples if needed

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Build the project (`npm run build`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## Questions?

Feel free to open an issue for any questions or concerns.

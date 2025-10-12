# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-10-12

### Added
- **LanguageModel class** - Instance-based API providing true 1-to-1 mapping with Swift
  - Constructor: `new LanguageModel(id)`
  - Static property: `LanguageModel.availableModels`
  - Instance methods: `generate()`, `generateStream()`
  - Property getters: `getName()`, `getMaxTokens()`
- **LanguageModelSession class** - Session-based API for conversational interactions
  - Maintains message history across multiple turns
  - Supports system prompts for context setting
  - Methods: `generate()`, `generateStream()`, `reset()`
  - Properties: `languageModel`, `messages`
- New TypeScript types and interfaces:
  - `Message` interface for conversation messages
  - `MessageRole` enum (System, User, Assistant)
  - `SessionConfig` for session configuration
- New examples:
  - `instance-based-api.mjs` - Demonstrates LanguageModel class usage
  - `session-based-api.mjs` - Demonstrates LanguageModelSession usage
- Comprehensive API documentation in README
- Updated IMPLEMENTATION.md with architecture details

### Removed
- **FoundationModels class** - Deprecated static API removed (BREAKING CHANGE)
  - Use `LanguageModel` class instead
  - Migration: `FoundationModels.listAvailableModels()` → `LanguageModel.availableModels`
  - Migration: `FoundationModels.generateText({...})` → `new LanguageModel(id).generate(...)`
- Default export removed (use named exports instead)

### Changed
- README restructured to highlight instance-based APIs
- Export structure updated to only include new classes and types
- All examples updated to use new API

### Known Limitations
- Streaming generation not yet implemented
- Only works on macOS 15.0 (Sequoia) or later
- Requires active internet connection for model downloads
- Session history is maintained in memory (not persisted)

## [0.0.0] - 2025-10-12

### Added
- Initial release of Apple Foundation Models for JavaScript
- 1-to-1 TypeScript API mapping for Apple FoundationModels framework
- Support for listing available language models
- Support for text generation with configurable parameters
- Auto-build Swift wrapper during npm installation
- Comprehensive TypeScript type definitions
- Built with Rolldown for modern bundling
- ESM and CommonJS module formats
- Platform compatibility checks (macOS 15.0+)
- Complete documentation and examples
- Basic test suite

### Known Limitations
- Streaming generation not yet implemented
- Only works on macOS 15.0 (Sequoia) or later
- Requires active internet connection for model downloads

[Unreleased]: https://github.com/johnhenry/apple-foundation-models/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/johnhenry/apple-foundation-models/compare/v0.0.0...v0.1.0
[0.0.0]: https://github.com/johnhenry/apple-foundation-models/releases/tag/v0.0.0

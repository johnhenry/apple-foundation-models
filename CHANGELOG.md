# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-10-12

### Added
- **SystemLanguageModel** - Instance-based API with 1-to-1 Swift mapping
  - Static property: `SystemLanguageModel.default`
  - Constructor: `new SystemLanguageModel(useCase)`
  - Methods: `availability()`, `isAvailable()`
- **LanguageModelSession** - Session-based conversational API
  - Multi-turn conversation support
  - Message history tracking via `transcript` property
  - Methods: `respond()`, `streamResponse()`, `prewarm()`, `prewarmWithPrefix()`
- Complete TypeScript type definitions
- Comprehensive API documentation with side-by-side Swift/JavaScript examples
- New examples: `instance-based-api.mjs`, `session-based-api.mjs`

### Removed
- **FoundationModels** static API (BREAKING CHANGE)
  - Migrate to `SystemLanguageModel` class
  - See [API_REFERENCE.md](API_REFERENCE.md) for migration guide

### Changed
- Restructured documentation for clarity
- Updated README with quick start examples
- Export structure now includes `SystemLanguageModel` and `LanguageModelSession`

## [0.0.0] - 2025-10-12

### Added
- Initial release
- TypeScript wrapper for Apple FoundationModels framework
- Auto-build Swift wrapper during npm install
- Support for text generation
- Platform compatibility checks (macOS 15.0+)
- ESM and CommonJS module formats

[Unreleased]: https://github.com/johnhenry/apple-foundation-models/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/johnhenry/apple-foundation-models/compare/v0.0.0...v0.1.0
[0.0.0]: https://github.com/johnhenry/apple-foundation-models/releases/tag/v0.0.0

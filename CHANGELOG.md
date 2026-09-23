# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.0.0 — npm scope migration (2026-09-22)

Previously published as `apple-foundation-models`, last unscoped version
`0.0.1`. This package now publishes as `@johnhenry/apple-foundation-models`,
restarting at `0.0.0` (the family convention: a new package address is a new
era). Note this reuses the version number `0.0.0` already used by the
pre-scope `apple-foundation-models@0.0.0` release below — the two are
distinct on npm because the package *name* changed; `^0.0.0` under the new
scoped name matches only this exact version, so pin exactly until a
deliberate `0.1.0`.

This release also carries real bug fixes alongside the rename, not just
metadata changes. Fixed in f58da7f (direct commit to `main`, no PR):

- **The documented and enforced platform floor was wrong.** README,
  CONTRIBUTING.md, ARCHITECTURE.md, examples/README.md, and
  `scripts/check-platform.js` all said "macOS 15.0 (Sequoia) or later".
  Apple's `FoundationModels` framework — the one this package wraps —
  shipped with the macOS 26 SDK, not with Sequoia's on-device Apple
  Intelligence features; `swift/Package.swift` even declared
  `.macOS(.v15)` as its deployment target, a functionally wrong build
  setting, not just a doc typo. All of the above now say macOS 26 (Tahoe);
  `swift/Package.swift` now declares `.macOS(.v26)` (requiring
  `swift-tools-version: 6.2`, bumped from `6.0`) and
  `scripts/check-platform.js`'s kernel-version arithmetic now checks against
  Darwin 25.0.0 (macOS 26.0) instead of Darwin 24.0.0 (macOS 15.0).
- **The published tarball shipped 36MB of machine-local Swift build
  artifacts.** `files` listed the whole `swift/` directory, which pulled in
  `swift/.build` — a Swift Package Manager module cache and build database
  full of absolute local paths, useless on any other machine — plus three
  loose `swift/probe-*.swift` dev scripts that were never part of the
  SwiftPM target. `files` now lists `swift/Package.swift` and
  `swift/Sources` explicitly; `npm pack --dry-run` went from 116 files /
  36.1MB unpacked to 26 files / 246KB.
- **`src/executor.ts`'s `findPackageRoot()` hardcoded the pre-scope package
  name.** It checked `packageJson.name === 'apple-foundation-models'` and
  looked for `node_modules/apple-foundation-models` to locate the Swift
  binary at runtime — both would silently stop matching once the package
  installs as `@johnhenry/apple-foundation-models`, breaking path
  resolution in any bundled-consumer scenario. Now checks both the scoped
  and legacy unscoped name/path.

### Housekeeping

- `engines.node` raised from `>=18.0.0` to `>=26.0.0` (family floor,
  settled 2026-09-21) with a matching `.nvmrc`. This is a real floor raise,
  not just a metadata sync — nothing in this repo's own code requires
  Node 26, so flag this if it surprises an existing Node 18–25 install.
- Added `.github/workflows/ci.yml` and `publish.yml` — this repo previously
  had no CI at all. Both run on `macos-26`, not the family's usual
  `ubuntu-latest`/`macos-latest`, because the postinstall build needs the
  macOS 26 SDK.

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

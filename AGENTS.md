# Agent playbook

`@johnhenry/apple-foundation-models` — a 1-to-1 TypeScript wrapper around
Apple's `FoundationModels` framework, talking to a locally-compiled Swift
executable over stdin/stdout (and a Unix domain socket for tool-enabled
sessions). Single package, Node >= 26, `node --test` (`npm test`), builds to
`dist/` via rolldown + tsc (`npm run build`). This is a native-binding repo:
`npm install` runs a real Swift Package Manager build as its `postinstall`
(`scripts/build-swift.js`), so almost everything here only works on macOS
26+ (Tahoe) on Apple Silicon — there is no meaningful way to develop or test
this package on Linux or on an Intel Mac.

`CLAUDE.md` in this directory is a symlink to this file.

## The verification loop (before every push)

1. `npm run build` — builds both the TypeScript (`build:js` + `build:types`)
   and, separately, `npm run build:swift` rebuilds the Swift executable
   (`postinstall` also runs this automatically on `npm install`).
2. `npm test` — full suite includes real on-device model calls
   (`test/integration.test.mjs`, plus most of `test/tool-end-to-end.test.mjs`)
   and requires macOS 26+ with Apple Intelligence actually enabled in System
   Settings. Set `NODE_TEST_SKIP_INTEGRATION=1` to skip the real-model tests
   (this is what CI does — GitHub-hosted macOS runners have the macOS 26 SDK
   to *build* Swift but do not have Apple Intelligence *enabled*, so they
   cannot run integration.test.mjs regardless of runner). A handful of
   `test/swift-wrapper.test.mjs` cases are hardcoded `{ skip: true }` in the
   source rather than env-gated — that's intentional (early-stage manual
   tests), not a bug to "fix" by removing the skip.
3. `npm pack --dry-run` — read the file list. `swift/.build` (SwiftPM's
   module cache and build DB, tens of MB, full of absolute local paths) must
   NOT appear; if it does, `files` in `package.json` regressed to listing
   the whole `swift/` directory instead of `swift/Package.swift` +
   `swift/Sources` explicitly. This shipped for real once (fixed in f58da7f)
   — it's an easy regression to reintroduce by "helpfully" simplifying the
   `files` array back to `"swift"`.
4. A genuinely fresh clone:
   `git clone . /tmp/apple-foundation-models-verifyN && cd $_ && npm install && npm test`.
   `npm install`'s postinstall must actually run `swift build -c release`
   successfully — this is the only way to catch "works because .build was
   already sitting in my checkout" bugs.
5. Commit, push, close the issue with a comment naming the commit SHA.

CI (`.github/workflows/ci.yml`) runs build + `npm test` with
`NODE_TEST_SKIP_INTEGRATION=1` on `macos-26` (not `ubuntu-latest`, not even
`macos-latest` — see the comment at the top of `ci.yml` for why); match it
locally when you can (skip-integration is the CI-equivalent local run).

## Repo-specific gotchas

- **The platform floor is macOS 26 (Tahoe), not macOS 15 (Sequoia) — this
  drifted silently before and will drift again.** `swift/Package.swift`
  once declared `.macOS(.v15)` while the code actually required the macOS 26
  SDK (`import FoundationModels` doesn't compile against anything older).
  If you see "macOS 15" or "Sequoia" reappear anywhere (README, this file,
  `scripts/check-platform.js`, `ARCHITECTURE.md`, a new doc, a new example),
  it's wrong — re-verify the actual floor against Apple's live docs and
  against what `swift build` on this machine actually requires before
  trusting any cached claim, including this one.
- **`.macOS(.v26)` requires `swift-tools-version: 6.2`, not `6.0`.** Verified
  locally with `swift package dump-package` before landing — `.v26` is
  `@available(_PackageDescription 6.2)`. Don't drop the tools-version bump
  if you ever touch `Package.swift`'s platform list again.
- **`SamplingMode` and the rest of the exported enum surface should be
  reverified against `dist/types.d.ts` and Apple's live `FoundationModels`
  docs periodically, not trusted from memory or from this file.** This
  package is a hand-maintained 1-to-1 translation of an external framework
  that Apple can and does change out from under it; nothing here enforces
  that the TypeScript surface still matches the Swift one.
- **`node_modules/apple-foundation-models` vs
  `node_modules/@johnhenry/apple-foundation-models`.** `src/executor.ts`'s
  `findPackageRoot()` walks up the directory tree looking for its own
  package root by name; it checks both the scoped and the pre-rename
  unscoped name/path on purpose (bundled-consumer scenarios may still carry
  the old name for a while). If you ever fully retire the unscoped name,
  that fallback can be deleted — but check first, it may still be load-bearing
  for `@johnhenry/aimatey-native-apple`, which as of this writing still
  dynamically `import()`s the OLD unscoped specifier `'apple-foundation-models'`
  (a separate repo's bug to fix, not this one's, but it means the unscoped
  package name needs to stay live on npm, not be unpublished, even after
  `npm deprecate`).
- **Socket cleanup on tool-enabled sessions is easy to get wrong.** Always
  `await session.close()` after a session created with tools — see
  `SOCKET_CLEANUP_FIX.md` for the incident this fixed (leaked Unix sockets /
  hung server processes) before assuming a new code path handles it.

## Definition of done

A change is done when all of the following hold, not just when tests pass:
- A regression test exists for any bug fixed.
- Anything the feature does **not** do is stated in the README (or the
  code), not only in an issue comment.
- `CHANGELOG.md` has an entry citing the commit/PR.
- If the change touches `swift/Package.swift`, `scripts/check-platform.js`,
  or any macOS-version claim in the docs, all of them were checked together
  — this repo has a real history of these three drifting out of sync.

## Non-goals

- Sandboxing or validating tool-call code the calling application registers
  — out of scope by design; see the README's `## Security model` for where
  that responsibility actually sits.
- Supporting non-Apple-Silicon or non-macOS-26 platforms. `os: ["darwin"]`
  in `package.json` and the hard macOS-26 floor are deliberate, not gaps.

## Releases

Bump `version` in `package.json`, add the `CHANGELOG.md` entry, merge (or
commit directly on `main` for small repos without a PR flow — check
`git log` for the prevailing pattern before assuming one), then
`gh release create v<version>` — the release event triggers
`.github/workflows/publish.yml`, which is idempotent (skips if the version
is already on npm) and gated on the full non-integration test suite on
`macos-26`.

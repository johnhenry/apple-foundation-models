// swift-tools-version: 6.2
import PackageDescription

// Platform floor is macOS 26 (Tahoe), not macOS 15 -- the `FoundationModels`
// framework this package wraps was introduced with macOS 26's SDK, not with
// Sequoia's on-device Apple Intelligence features. `.v26` requires
// PackageDescription 6.2 (hence the tools-version bump above); verified
// locally with `swift package dump-package` against Xcode's PackageDescription
// API before landing this change.
let package = Package(
    name: "AppleFoundationModelsWrapper",
    platforms: [
        .macOS(.v26)
    ],
    products: [
        .executable(
            name: "AppleFoundationModelsWrapper",
            targets: ["AppleFoundationModelsWrapper"]
        )
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "AppleFoundationModelsWrapper",
            dependencies: []
        )
    ]
)

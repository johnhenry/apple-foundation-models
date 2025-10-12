// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "AppleFoundationModelsWrapper",
    platforms: [
        .macOS(.v15)
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

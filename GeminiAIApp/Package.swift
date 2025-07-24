// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "GeminiAIApp",
    platforms: [
        .iOS(.v15),
        .macOS(.v12),
        .watchOS(.v8),
        .tvOS(.v15)
    ],
    products: [
        .library(
            name: "GeminiAIApp",
            targets: ["GeminiAIApp"]
        ),
    ],
    dependencies: [
        .package(url: "https://github.com/google/generative-ai-swift", from: "0.4.4"),
    ],
    targets: [
        .target(
            name: "GeminiAIApp",
            dependencies: [
                .product(name: "GoogleGenerativeAI", package: "generative-ai-swift"),
            ],
            path: "Sources"
        ),
        .testTarget(
            name: "GeminiAIAppTests",
            dependencies: ["GeminiAIApp"],
            path: "Tests"
        ),
    ]
)
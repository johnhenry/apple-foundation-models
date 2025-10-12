#!/usr/bin/env swift

import Foundation
#if canImport(FoundationModels)
import FoundationModels

@available(macOS 26.0, *)
func probeMethodsAndTypes() {
    print("=== FoundationModels Detailed API Probe ===\n")

    // SystemLanguageModel
    print("--- SystemLanguageModel ---")
    print("Static properties:")
    print("  - default: \(type(of: SystemLanguageModel.default))")

    print("\nInstance properties:")
    print("  - availability: \(type(of: SystemLanguageModel.default.availability))")
    print("  - isAvailable: \(type(of: SystemLanguageModel.default.isAvailable))")

    print("\nInitializers:")
    print("  - init(useCase: UseCase)")
    let taggingModel = SystemLanguageModel(useCase: .contentTagging)
    print("    Created: \(type(of: taggingModel))")

    // GenerationOptions detailed
    print("\n--- GenerationOptions ---")
    var opts = GenerationOptions()
    print("Instance properties (publicly accessible):")
    print("  - sampling: \(type(of: opts.sampling)) = \(String(describing: opts.sampling))")
    print("  - temperature: \(type(of: opts.temperature)) = \(String(describing: opts.temperature))")
    print("  - maximumResponseTokens: \(type(of: opts.maximumResponseTokens)) = \(String(describing: opts.maximumResponseTokens))")
    print("  Note: Mirror showed additional internal properties")

    // Test setting values
    opts.temperature = 0.7
    opts.maximumResponseTokens = 1000
    print("\nAfter setting values:")
    print("  - temperature = \(String(describing: opts.temperature))")
    print("  - maximumResponseTokens = \(String(describing: opts.maximumResponseTokens))")

    // Probe SamplingMode if accessible
    print("\n--- SamplingMode ---")
    print("Attempting to access SamplingMode cases...")
    // The property is Optional<SamplingMode>, so SamplingMode should exist
    print("(Type exists as Optional<SamplingMode>)")

    // LanguageModelSession detailed
    print("\n--- LanguageModelSession ---")
    print("Initializers:")
    print("  - init() - default")
    let session1 = LanguageModelSession()
    print("    Created: \(type(of: session1))")

    // Try with instructions
    print("  - init(instructions: Instructions?)")
    let instructions = Instructions("Test instructions")
    let session2 = LanguageModelSession(instructions: instructions)
    print("    Created: \(type(of: session2))")

    print("\nInstance properties:")
    print("  - isResponding: \(type(of: session1.isResponding)) = \(session1.isResponding)")
    print("  - transcript: \(type(of: session1.transcript)) with \(session1.transcript.count) entries")

    print("\nMethods:")
    print("  - respond(to: String) async throws -> Response<String>")
    print("  - respond(to: String, options: GenerationOptions) async throws -> Response<String>")
    print("  - streamResponse(to: String) -> ResponseStream<String>")
    print("  - prewarm() async throws")
    print("  - prewarm(promptPrefix: String) async throws")

    // Instructions detailed
    print("\n--- Instructions ---")
    let inst = Instructions("System prompt text")
    print("Initializers:")
    print("  - init(_ text: String)")
    print("    Created: \(type(of: inst))")

    print("\nInstance properties:")
    print("  - Has 'components' property (internal representation)")

    // TranscriptEntry
    print("\n--- TranscriptEntry ---")
    print("Type: Enum with associated values")
    if session2.transcript.count > 0 {
        print("  First entry type: \(type(of: session2.transcript[0]))")
    }

    // Availability
    print("\n--- SystemLanguageModel.Availability ---")
    let availability = SystemLanguageModel.default.availability
    print("Current value: \(availability)")
    print("Type: enum Availability")

    // UseCase
    print("\n--- SystemLanguageModel.UseCase ---")
    print("Known cases:")
    print("  - .contentTagging")

    print("\n=== End of Detailed API Probe ===")
}

if #available(macOS 26.0, *) {
    probeMethodsAndTypes()
} else {
    print("Error: Requires macOS 26.0 or later")
    exit(1)
}
#else
print("Error: FoundationModels framework not available")
exit(1)
#endif

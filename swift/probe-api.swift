#!/usr/bin/env swift

import Foundation
#if canImport(FoundationModels)
import FoundationModels

@available(macOS 26.0, *)
func probeFoundationModelsAPI() {
    print("=== FoundationModels API Probe ===\n")

    // Probe SystemLanguageModel
    print("--- SystemLanguageModel ---")
    print("Type: \(type(of: SystemLanguageModel.self))")

    let model = SystemLanguageModel.default
    print("Default model type: \(type(of: model))")
    print("Availability: \(model.availability)")
    print("Is available: \(model.isAvailable)")

    // Use Mirror to introspect properties
    let modelMirror = Mirror(reflecting: model)
    print("\nSystemLanguageModel instance properties:")
    for child in modelMirror.children {
        if let label = child.label {
            print("  - \(label): \(type(of: child.value))")
        }
    }

    // Probe GenerationOptions
    print("\n--- GenerationOptions ---")
    var opts = GenerationOptions()
    let optsMirror = Mirror(reflecting: opts)
    print("GenerationOptions properties:")
    for child in optsMirror.children {
        if let label = child.label {
            print("  - \(label): \(type(of: child.value))")
        }
    }

    // Try to set values and see what's available
    print("\nTesting GenerationOptions setters:")
    print("  - Has temperature: \(optsMirror.children.contains(where: { $0.label == "temperature" }))")
    print("  - Has maximumResponseTokens: \(optsMirror.children.contains(where: { $0.label == "maximumResponseTokens" }))")
    print("  - Has sampling: \(optsMirror.children.contains(where: { $0.label == "sampling" }))")

    // Probe LanguageModelSession
    print("\n--- LanguageModelSession ---")
    let session = LanguageModelSession()
    let sessionMirror = Mirror(reflecting: session)
    print("LanguageModelSession properties:")
    for child in sessionMirror.children {
        if let label = child.label {
            print("  - \(label): \(type(of: child.value))")
        }
    }

    print("\nSession.isResponding: \(session.isResponding)")
    print("Session.transcript count: \(session.transcript.count)")

    // Probe Instructions
    print("\n--- Instructions ---")
    let instructions = Instructions("Test")
    let instructionsMirror = Mirror(reflecting: instructions)
    print("Instructions properties:")
    for child in instructionsMirror.children {
        if let label = child.label {
            print("  - \(label): \(type(of: child.value))")
        }
    }

    // Try to probe Guardrails (may not exist)
    print("\n--- Guardrails ---")
    print("Attempting to check Guardrails availability...")
    // Guardrails might not be publicly accessible
    print("(Guardrails type may not be available for introspection)")

    // Probe Availability enum
    print("\n--- SystemLanguageModel.Availability ---")
    print("Availability type: \(type(of: model.availability))")

    // Try to probe UseCase
    print("\n--- SystemLanguageModel.UseCase ---")
    print("Available use cases:")
    let contentTaggingModel = SystemLanguageModel(useCase: .contentTagging)
    print("  - .contentTagging: creates \(type(of: contentTaggingModel))")

    print("\n=== End of API Probe ===")
}

if #available(macOS 26.0, *) {
    probeFoundationModelsAPI()
} else {
    print("Error: Requires macOS 26.0 or later")
    exit(1)
}
#else
print("Error: FoundationModels framework not available")
exit(1)
#endif

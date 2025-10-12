#!/usr/bin/env swift

import Foundation
#if canImport(FoundationModels)
import FoundationModels

@available(macOS 26.0, *)
func probeSessionInitializers() {
    print("=== LanguageModelSession Initializer Tests ===\n")

    let model = SystemLanguageModel.default

    // Test 1: Default initializer
    print("Test 1: init()")
    let session1 = LanguageModelSession()
    print("  ✓ Created: \(type(of: session1))\n")

    // Test 2: With instructions
    print("Test 2: init(instructions:)")
    let instructions = Instructions("You are a helpful assistant")
    let session2 = LanguageModelSession(instructions: instructions)
    print("  ✓ Created: \(type(of: session2))\n")

    // Test 3: With model
    print("Test 3: init(model:)")
    let session3 = LanguageModelSession(model: model)
    print("  ✓ Created: \(type(of: session3))\n")

    // Test 4: With model and instructions
    print("Test 4: init(model:instructions:)")
    let session4 = LanguageModelSession(model: model, instructions: instructions)
    print("  ✓ Created: \(type(of: session4))\n")

    // Test 5: Full initializer (from documentation)
    print("Test 5: init(model:guardrails:tools:instructions:)")
    print("  Attempting with empty tools array...")
    // Note: Guardrails.default may or may not be accessible
    // Tool is a protocol, so we can't easily create instances without implementing it
    do {
        // Try the full init from the documentation
        let session5 = LanguageModelSession(
            model: model,
            // guardrails: Guardrails.default,  // May not be accessible
            tools: [],
            instructions: instructions
        )
        print("  ✓ Created: \(type(of: session5))\n")
    } catch {
        print("  ✗ Error: \(error)\n")
    }

    // Test accessing languageModel property
    print("Test 6: Accessing languageModel property")
    // Check if session has a languageModel property to access the underlying model
    let sessionMirror = Mirror(reflecting: session3)
    var hasLanguageModelProperty = false
    for child in sessionMirror.children {
        if let label = child.label, label.contains("model") || label.contains("language") {
            print("  Found property: \(label): \(type(of: child.value))")
            hasLanguageModelProperty = true
        }
    }
    if !hasLanguageModelProperty {
        print("  No public languageModel property found")
    }

    print("\n=== Available Initializer Signatures ===")
    print("Based on successful tests:")
    print("  ✓ init()")
    print("  ✓ init(instructions: Instructions?)")
    print("  ✓ init(model: SystemLanguageModel)")
    print("  ✓ init(model: SystemLanguageModel, instructions: Instructions?)")
    print("  ✓ init(model: SystemLanguageModel, tools: [any Tool], instructions: Instructions?)")
}

if #available(macOS 26.0, *) {
    probeSessionInitializers()
} else {
    print("Error: Requires macOS 26.0 or later")
    exit(1)
}
#else
print("Error: FoundationModels framework not available")
exit(1)
#endif

"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"

/**
 * Simple test page to verify Input component functionality
 * This can be imported into any page for quick testing
 */
export function InputTestPage() {
    const [email, setEmail] = React.useState("")
    const [emailError, setEmailError] = React.useState("")

    const validateEmail = (value: string) => {
        if (!value) {
            setEmailError("Email is required")
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            setEmailError("Please enter a valid email address")
        } else {
            setEmailError("")
        }
    }

    return (
        <div className="max-w-md mx-auto p-8 space-y-6">
            <h1 className="text-2xl font-bold">Input Component Test</h1>

            {/* Test 1: Basic input */}
            <div>
                <h2 className="text-lg font-semibold mb-2">1. Basic Input</h2>
                <Input placeholder="Type something..." />
            </div>

            {/* Test 2: Input with label */}
            <div>
                <h2 className="text-lg font-semibold mb-2">2. Input with Label</h2>
                <Input label="Username" placeholder="Enter username" />
            </div>

            {/* Test 3: Required field */}
            <div>
                <h2 className="text-lg font-semibold mb-2">3. Required Field</h2>
                <Input label="Full Name" placeholder="John Doe" required />
            </div>

            {/* Test 4: Input with helper text */}
            <div>
                <h2 className="text-lg font-semibold mb-2">4. Helper Text</h2>
                <Input
                    label="Password"
                    type="password"
                    helperText="Must be at least 8 characters"
                />
            </div>

            {/* Test 5: Input with error */}
            <div>
                <h2 className="text-lg font-semibold mb-2">5. Error State</h2>
                <Input
                    label="Email"
                    type="email"
                    error="Please enter a valid email address"
                />
            </div>

            {/* Test 6: Live validation */}
            <div>
                <h2 className="text-lg font-semibold mb-2">6. Live Validation</h2>
                <Input
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={(e) => validateEmail(e.target.value)}
                    error={emailError}
                    helperText={!emailError ? "We'll send you updates" : undefined}
                    required
                />
            </div>

            {/* Test 7: Success state */}
            <div>
                <h2 className="text-lg font-semibold mb-2">7. Success State</h2>
                <Input
                    label="Verified Email"
                    type="email"
                    variant="success"
                    value="user@example.com"
                    helperText="Email verified!"
                />
            </div>

            {/* Test 8: Disabled state */}
            <div>
                <h2 className="text-lg font-semibold mb-2">8. Disabled State</h2>
                <Input label="Disabled Field" disabled value="Cannot edit" />
            </div>

            {/* Test 9: Keyboard navigation */}
            <div>
                <h2 className="text-lg font-semibold mb-2">
                    9. Keyboard Navigation (Tab through these)
                </h2>
                <div className="space-y-4">
                    <Input label="Field 1" placeholder="Tab to next" />
                    <Input label="Field 2" placeholder="Tab to next" />
                    <Input label="Field 3" placeholder="Last field" />
                </div>
            </div>
        </div>
    )
}

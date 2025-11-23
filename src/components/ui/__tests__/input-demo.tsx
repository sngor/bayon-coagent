"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * Demo component showcasing the enhanced Input component features
 */
export function InputDemo() {
    const [email, setEmail] = React.useState("")
    const [emailError, setEmailError] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [passwordError, setPasswordError] = React.useState("")

    const validateEmail = (value: string) => {
        if (!value) {
            setEmailError("Email is required")
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            setEmailError("Please enter a valid email address")
        } else {
            setEmailError("")
        }
    }

    const validatePassword = (value: string) => {
        if (!value) {
            setPasswordError("Password is required")
        } else if (value.length < 8) {
            setPasswordError("Password must be at least 8 characters")
        } else {
            setPasswordError("")
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        validateEmail(email)
        validatePassword(password)

        if (!emailError && !passwordError && email && password) {
            alert("Form submitted successfully!")
        }
    }

    return (
        <div className="container mx-auto p-8 space-y-8">
            <h1 className="font-headline text-3xl font-bold">Enhanced Input Component Demo</h1>

            {/* Basic Input */}
            <Card>
                <CardHeader>
                    <CardTitle>Basic Input</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input placeholder="Basic input" />
                    <Input placeholder="With label" label="Username" />
                    <Input
                        placeholder="With helper text"
                        label="Email"
                        helperText="We'll never share your email with anyone else."
                    />
                </CardContent>
            </Card>

            {/* Required Fields */}
            <Card>
                <CardHeader>
                    <CardTitle>Required Fields</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input
                        placeholder="Enter your name"
                        label="Full Name"
                        required
                        helperText="This field is required"
                    />
                </CardContent>
            </Card>

            {/* Validation States */}
            <Card>
                <CardHeader>
                    <CardTitle>Validation States</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input
                        placeholder="Enter email"
                        label="Email with Error"
                        error="Please enter a valid email address"
                    />
                    <Input
                        placeholder="Enter email"
                        label="Email without Error Icon"
                        error="Please enter a valid email address"
                        showErrorIcon={false}
                    />
                    <Input
                        placeholder="Enter email"
                        label="Success State"
                        variant="success"
                        helperText="Email is valid!"
                    />
                </CardContent>
            </Card>

            {/* Live Validation Form */}
            <Card>
                <CardHeader>
                    <CardTitle>Live Validation Form</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            type="email"
                            placeholder="Enter your email"
                            label="Email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onBlur={(e) => validateEmail(e.target.value)}
                            error={emailError}
                            helperText={
                                !emailError ? "We'll send you a confirmation email" : undefined
                            }
                        />
                        <Input
                            type="password"
                            placeholder="Enter your password"
                            label="Password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onBlur={(e) => validatePassword(e.target.value)}
                            error={passwordError}
                            helperText={
                                !passwordError
                                    ? "Must be at least 8 characters long"
                                    : undefined
                            }
                        />
                        <Button type="submit">Submit</Button>
                    </form>
                </CardContent>
            </Card>

            {/* Disabled State */}
            <Card>
                <CardHeader>
                    <CardTitle>Disabled State</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input
                        placeholder="Disabled input"
                        label="Disabled Field"
                        disabled
                        helperText="This field is disabled"
                    />
                </CardContent>
            </Card>

            {/* Different Input Types */}
            <Card>
                <CardHeader>
                    <CardTitle>Different Input Types</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input type="text" placeholder="Text input" label="Text" />
                    <Input type="email" placeholder="Email input" label="Email" />
                    <Input type="password" placeholder="Password input" label="Password" />
                    <Input type="number" placeholder="Number input" label="Number" />
                    <Input type="tel" placeholder="Phone input" label="Phone" />
                    <Input type="url" placeholder="URL input" label="Website" />
                    <Input type="date" label="Date" />
                </CardContent>
            </Card>

            {/* Accessibility Features */}
            <Card>
                <CardHeader>
                    <CardTitle>Accessibility Features</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <h3 className="font-headline font-semibold">Keyboard Navigation</h3>
                        <p className="text-sm text-muted-foreground">
                            Try tabbing through these inputs. Notice the enhanced focus states
                            with visible rings.
                        </p>
                        <Input placeholder="First input" label="Field 1" />
                        <Input placeholder="Second input" label="Field 2" />
                        <Input placeholder="Third input" label="Field 3" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-headline font-semibold">Screen Reader Support</h3>
                        <p className="text-sm text-muted-foreground">
                            All inputs have proper ARIA labels, descriptions, and error
                            announcements for screen readers.
                        </p>
                        <Input
                            placeholder="Enter email"
                            label="Email Address"
                            required
                            error="This field is required"
                            helperText="We need this to contact you"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

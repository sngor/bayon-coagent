'use client';

import { StandardPageLayout } from '@/components/standard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import { useState } from 'react';

export default function ErrorHandlingDemoPage() {
    const [showError, setShowError] = useState(false);
    const [showWarning, setShowWarning] = useState(false);

    return (
        <StandardPageLayout
            title="Error Handling Demo"
            description="Error handling UI patterns and user feedback"
            spacing="default"
        >
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Error Alert Types</CardTitle>
                        <CardDescription>Different error severity levels</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Alert variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>
                                Failed to save your content. Please check your connection and try again.
                            </AlertDescription>
                        </Alert>

                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Warning</AlertTitle>
                            <AlertDescription>
                                Your profile is incomplete. Some features may be limited.
                            </AlertDescription>
                        </Alert>

                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Info</AlertTitle>
                            <AlertDescription>
                                This action requires a complete profile. Please update your information.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Inline Error Messages</CardTitle>
                        <CardDescription>Form validation and field-level errors</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email Address</label>
                            <input
                                type="email"
                                className="w-full px-3 py-2 border border-destructive rounded-md"
                                placeholder="email@example.com"
                            />
                            <p className="text-sm text-destructive flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                Please enter a valid email address
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Password</label>
                            <input
                                type="password"
                                className="w-full px-3 py-2 border border-destructive rounded-md"
                                placeholder="••••••••"
                            />
                            <p className="text-sm text-destructive flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                Password must be at least 8 characters
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Error States</CardTitle>
                        <CardDescription>Handling different error scenarios</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <Button onClick={() => setShowError(!showError)} variant="destructive">
                                Trigger Error
                            </Button>
                            {showError && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Operation Failed</AlertTitle>
                                    <AlertDescription>
                                        Unable to complete the request. Error code: 500
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>

                        <div className="space-y-3">
                            <Button onClick={() => setShowWarning(!showWarning)} variant="outline">
                                Trigger Warning
                            </Button>
                            {showWarning && (
                                <Alert>
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>Action Required</AlertTitle>
                                    <AlertDescription>
                                        You have unsaved changes. Save before leaving this page.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Error Recovery</CardTitle>
                        <CardDescription>Providing actionable next steps</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Connection Error</AlertTitle>
                            <AlertDescription className="space-y-3">
                                <p>Unable to connect to the server. This could be due to:</p>
                                <ul className="list-disc list-inside space-y-1 text-sm">
                                    <li>Network connectivity issues</li>
                                    <li>Server maintenance</li>
                                    <li>Firewall or security settings</li>
                                </ul>
                                <div className="flex gap-2 mt-3">
                                    <Button size="sm" variant="outline">
                                        Retry
                                    </Button>
                                    <Button size="sm" variant="outline">
                                        Check Status
                                    </Button>
                                </div>
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Usage Example</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                            <code>{`import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

// Error alert
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Failed to save. Please try again.
  </AlertDescription>
</Alert>

// Inline error
<p className="text-sm text-destructive">
  <AlertCircle className="h-4 w-4" />
  Invalid email address
</p>`}</code>
                        </pre>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Best Practices</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            <li>✓ Be specific about what went wrong</li>
                            <li>✓ Provide actionable next steps</li>
                            <li>✓ Use appropriate severity levels</li>
                            <li>✓ Include error codes for debugging</li>
                            <li>✓ Offer retry or alternative actions</li>
                            <li>✓ Log errors for monitoring</li>
                            <li>✓ Don't expose sensitive information</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </StandardPageLayout>
    );
}

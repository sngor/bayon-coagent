'use client';

/**
 * Demo page showcasing all standard components
 * This file demonstrates the usage of StandardFormField, StandardLoadingState,
 * StandardErrorDisplay, and StandardEmptyState components
 */

import { useState } from 'react';
import { FileText, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    StandardFormField,
    StandardLoadingState,
    StandardErrorDisplay,
    StandardEmptyState,
} from './index';

export function StandardComponentsDemo() {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        if (e.target.value && !e.target.value.includes('@')) {
            setEmailError('Please enter a valid email address');
        } else {
            setEmailError('');
        }
    };

    return (
        <div className="container mx-auto space-y-8 py-8">
            <div>
                <h1 className="mb-2 text-3xl font-bold">Standard Components Demo</h1>
                <p className="text-muted-foreground">
                    Showcasing the standard component library for consistent UI patterns
                </p>
            </div>

            {/* StandardFormField Demo */}
            <Card>
                <CardHeader>
                    <CardTitle>StandardFormField</CardTitle>
                    <CardDescription>
                        Consistent form field wrapper with label, error, and help text
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <StandardFormField
                        label="Email Address"
                        id="email-demo"
                        required
                        error={emailError}
                        helpText="We'll never share your email with anyone"
                    >
                        <Input
                            type="email"
                            id="email-demo"
                            value={email}
                            onChange={handleEmailChange}
                            placeholder="you@example.com"
                        />
                    </StandardFormField>

                    <StandardFormField
                        label="Username"
                        id="username-demo"
                        helpText="Choose a unique username"
                    >
                        <Input type="text" id="username-demo" placeholder="johndoe" />
                    </StandardFormField>
                </CardContent>
            </Card>

            {/* StandardLoadingState Demo */}
            <Card>
                <CardHeader>
                    <CardTitle>StandardLoadingState</CardTitle>
                    <CardDescription>
                        Unified loading indicators with multiple variants
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div>
                        <h3 className="mb-4 text-sm font-semibold">Spinner Variant</h3>
                        <div className="flex gap-8">
                            <div>
                                <p className="mb-2 text-xs text-muted-foreground">Small</p>
                                <StandardLoadingState variant="spinner" size="sm" />
                            </div>
                            <div>
                                <p className="mb-2 text-xs text-muted-foreground">Medium</p>
                                <StandardLoadingState variant="spinner" size="md" text="Loading..." />
                            </div>
                            <div>
                                <p className="mb-2 text-xs text-muted-foreground">Large</p>
                                <StandardLoadingState variant="spinner" size="lg" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="mb-4 text-sm font-semibold">Skeleton Variant</h3>
                        <StandardLoadingState variant="skeleton" size="md" />
                    </div>

                    <div>
                        <h3 className="mb-4 text-sm font-semibold">Pulse Variant</h3>
                        <StandardLoadingState variant="pulse" size="md" text="Processing..." />
                    </div>

                    <div>
                        <h3 className="mb-4 text-sm font-semibold">Shimmer Variant</h3>
                        <StandardLoadingState variant="shimmer" size="md" />
                    </div>
                </CardContent>
            </Card>

            {/* StandardErrorDisplay Demo */}
            <Card>
                <CardHeader>
                    <CardTitle>StandardErrorDisplay</CardTitle>
                    <CardDescription>
                        Consistent error messaging with appropriate severity levels
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="mb-2 text-sm font-semibold">Error Variant</h3>
                        <StandardErrorDisplay
                            title="Failed to Load Data"
                            message="Unable to fetch data from the server. Please check your connection and try again."
                            variant="error"
                            action={{
                                label: 'Retry',
                                onClick: () => alert('Retrying...'),
                            }}
                        />
                    </div>

                    <div>
                        <h3 className="mb-2 text-sm font-semibold">Warning Variant</h3>
                        <StandardErrorDisplay
                            title="Unsaved Changes"
                            message="You have unsaved changes that will be lost if you navigate away."
                            variant="warning"
                        />
                    </div>

                    <div>
                        <h3 className="mb-2 text-sm font-semibold">Info Variant</h3>
                        <StandardErrorDisplay
                            title="New Feature Available"
                            message="Check out our new AI-powered content generation feature in the Studio hub."
                            variant="info"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* StandardEmptyState Demo */}
            <Card>
                <CardHeader>
                    <CardTitle>StandardEmptyState</CardTitle>
                    <CardDescription>
                        Consistent empty state patterns with call-to-action
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <StandardEmptyState
                        icon={FileText}
                        title="No Content Yet"
                        description="Create your first piece of content to get started with AI-powered content generation."
                        action={{
                            label: 'Create Content',
                            onClick: () => alert('Creating content...'),
                            variant: 'default',
                        }}
                    />

                    <StandardEmptyState
                        icon={AlertCircle}
                        title="No Results Found"
                        description="We couldn't find any items matching your search criteria. Try adjusting your filters."
                    />
                </CardContent>
            </Card>
        </div>
    );
}

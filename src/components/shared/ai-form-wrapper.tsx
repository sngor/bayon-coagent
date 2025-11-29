'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AILoading } from '@/components/ui/ai-loading';
import { StandardErrorDisplay } from '@/components/standard/error-display';
import { Button } from '@/components/ui/button';
import { Copy, Check, Save, Download } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils/common';

interface AIFormWrapperProps {
    // Form section
    formTitle: string;
    formDescription?: string;
    formContent: ReactNode;

    // Output section
    outputTitle?: string;
    outputDescription?: string;
    output: string;
    onOutputChange?: (value: string) => void;

    // State
    isLoading: boolean;
    error?: string | null;

    // Actions
    onCopy?: () => void;
    onSave?: () => void;
    onDownload?: () => void;
    copied?: boolean;

    // Customization
    emptyStateIcon?: ReactNode;
    emptyStateTitle?: string;
    emptyStateDescription?: string;
    loadingMessage?: string;
    outputEditable?: boolean;
    outputRows?: number;
    className?: string;
}

/**
 * Standardized wrapper for AI generation forms
 * Provides consistent layout with form input on left and output on right
 */
export function AIFormWrapper({
    formTitle,
    formDescription,
    formContent,
    outputTitle = 'Generated Output',
    outputDescription = 'AI-generated content',
    output,
    onOutputChange,
    isLoading,
    error,
    onCopy,
    onSave,
    onDownload,
    copied = false,
    emptyStateIcon,
    emptyStateTitle = 'Your generated content will appear here',
    emptyStateDescription = 'Fill out the form and click Generate to create content',
    loadingMessage = 'Generating content...',
    outputEditable = true,
    outputRows = 15,
    className,
}: AIFormWrapperProps) {
    const hasActions = onCopy || onSave || onDownload;

    return (
        <div className={cn('grid gap-6 lg:grid-cols-2', className)}>
            {/* Left Column: Input Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">{formTitle}</CardTitle>
                    {formDescription && <CardDescription>{formDescription}</CardDescription>}
                </CardHeader>
                <CardContent>{formContent}</CardContent>
            </Card>

            {/* Right Column: Generated Output */}
            <Card className="min-h-[400px]">
                <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                        <CardTitle className="font-headline">{outputTitle}</CardTitle>
                        {outputDescription && <CardDescription>{outputDescription}</CardDescription>}
                    </div>
                    {output && hasActions && (
                        <div className="flex gap-2">
                            {onCopy && (
                                <Button
                                    variant={copied ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={onCopy}
                                >
                                    {copied ? (
                                        <>
                                            <Check className="mr-2 h-4 w-4" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="mr-2 h-4 w-4" />
                                            Copy
                                        </>
                                    )}
                                </Button>
                            )}
                            {onSave && (
                                <Button variant="outline" size="sm" onClick={onSave}>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save
                                </Button>
                            )}
                            {onDownload && (
                                <Button variant="outline" size="sm" onClick={onDownload}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download
                                </Button>
                            )}
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <AILoading message={loadingMessage} showSubtext />
                    ) : output ? (
                        <div className="space-y-4">
                            {outputEditable ? (
                                <Textarea
                                    value={output}
                                    onChange={(e) => onOutputChange?.(e.target.value)}
                                    rows={outputRows}
                                    className="w-full h-full font-mono text-sm resize-none"
                                />
                            ) : (
                                <div className="prose prose-sm max-w-none dark:prose-invert">
                                    <pre className="whitespace-pre-wrap">{output}</pre>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            {emptyStateIcon && (
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                    {emptyStateIcon}
                                </div>
                            )}
                            <p className="text-muted-foreground text-lg">{emptyStateTitle}</p>
                            <p className="text-sm text-muted-foreground mt-2">{emptyStateDescription}</p>
                        </div>
                    )}
                    {error && (
                        <StandardErrorDisplay
                            title="Generation Failed"
                            message={error}
                            variant="error"
                            className="mt-4"
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

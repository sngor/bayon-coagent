'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

interface StreamingContentProps {
    content: string;
    isGenerating: boolean;
    title?: string;
    showProgress?: boolean;
}

/**
 * StreamingContent Component
 * 
 * Displays content with a typewriter effect while it's being generated.
 * Provides visual feedback during content generation.
 */
export function StreamingContent({
    content,
    isGenerating,
    title = 'Generated Content',
    showProgress = true,
}: StreamingContentProps) {
    const [displayedContent, setDisplayedContent] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    // Typewriter effect
    useEffect(() => {
        if (!content) {
            setDisplayedContent('');
            setCurrentIndex(0);
            return;
        }

        // If not generating, show all content immediately
        if (!isGenerating) {
            setDisplayedContent(content);
            setCurrentIndex(content.length);
            return;
        }

        // Typewriter effect while generating
        if (currentIndex < content.length) {
            const timeout = setTimeout(() => {
                setDisplayedContent(content.slice(0, currentIndex + 1));
                setCurrentIndex(currentIndex + 1);
            }, 10); // 10ms per character for smooth animation

            return () => clearTimeout(timeout);
        }
    }, [content, currentIndex, isGenerating]);

    // Calculate progress
    const progress = content.length > 0
        ? Math.round((displayedContent.length / content.length) * 100)
        : 0;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>{title}</CardTitle>
                    {isGenerating && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Generating...</span>
                            {showProgress && <span>{progress}%</span>}
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {displayedContent ? (
                    <div
                        className="prose prose-sm max-w-none dark:prose-invert"
                        dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(marked(displayedContent))
                        }}
                    />
                ) : (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Waiting for content...</span>
                    </div>
                )}

                {isGenerating && displayedContent && (
                    <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                )}
            </CardContent>
        </Card>
    );
}

/**
 * GenerationProgress Component
 * 
 * Shows step-by-step progress during content generation
 */
interface GenerationStep {
    label: string;
    status: 'pending' | 'active' | 'complete';
}

interface GenerationProgressProps {
    steps: GenerationStep[];
}

export function GenerationProgress({ steps }: GenerationProgressProps) {
    return (
        <div className="space-y-2">
            {steps.map((step, index) => (
                <div key={index} className="flex items-center gap-3">
                    <div className={`
            w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium
            ${step.status === 'complete' ? 'bg-green-500 text-white' : ''}
            ${step.status === 'active' ? 'bg-primary text-white' : ''}
            ${step.status === 'pending' ? 'bg-muted text-muted-foreground' : ''}
          `}>
                        {step.status === 'complete' ? '✓' : index + 1}
                    </div>
                    <span className={`
            text-sm
            ${step.status === 'active' ? 'text-foreground font-medium' : ''}
            ${step.status === 'complete' ? 'text-muted-foreground' : ''}
            ${step.status === 'pending' ? 'text-muted-foreground' : ''}
          `}>
                        {step.label}
                    </span>
                    {step.status === 'active' && (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}
                </div>
            ))}
        </div>
    );
}

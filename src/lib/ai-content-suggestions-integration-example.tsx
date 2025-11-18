'use client';

/**
 * AI Content Suggestions Integration Example
 * 
 * This example shows how to integrate AI content suggestions
 * into the Content Engine page.
 */

import { useState } from 'react';
import { useUser } from '@/aws/auth';
import { AIContentSuggestions } from '@/components/ai-content-suggestions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, X } from 'lucide-react';
import { trackContentCreationAction } from '@/app/actions';
import type { ContentIdea } from '@/lib/ai-content-suggestions';

export function ContentEngineWithSuggestions() {
    const { user } = useUser();
    const [showSuggestions, setShowSuggestions] = useState(true);
    const [activeTab, setActiveTab] = useState('market-update');
    const [formData, setFormData] = useState<Record<string, string>>({});

    // Handle content type selection from suggestions
    const handleSelectContentType = (contentType: string) => {
        // Map content type names to tab IDs
        const typeMap: Record<string, string> = {
            'Market Updates': 'market-update',
            'Blog Posts': 'blog-post',
            'Video Scripts': 'video-script',
            'Neighborhood Guides': 'guide',
            'Social Media Posts': 'social',
            'Listing Descriptions': 'listing',
        };

        const tabId = typeMap[contentType] || contentType.toLowerCase().replace(/\s+/g, '-');
        setActiveTab(tabId);
        setShowSuggestions(false);
    };

    // Handle content idea selection from suggestions
    const handleSelectIdea = (idea: ContentIdea) => {
        // Map content type to tab and pre-fill form
        const typeMap: Record<string, string> = {
            'Market Update': 'market-update',
            'Blog Post': 'blog-post',
            'Video Script': 'video-script',
            'Neighborhood Guide': 'guide',
            'Social Media Post': 'social',
        };

        const tabId = typeMap[idea.contentType] || 'market-update';
        setActiveTab(tabId);

        // Pre-fill form with idea details
        setFormData({
            topic: idea.title,
            description: idea.description,
            keywords: idea.keywords.join(', '),
            audience: idea.targetAudience,
        });

        setShowSuggestions(false);
    };

    // Track content creation after generation
    const handleContentGenerated = async (contentType: string, success: boolean) => {
        await trackContentCreationAction(contentType, success);
    };

    if (!user) {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Suggestions Toggle Button */}
            {!showSuggestions && (
                <Button
                    variant="outline"
                    onClick={() => setShowSuggestions(true)}
                    className="gap-2"
                >
                    <Sparkles className="w-4 h-4" />
                    Show AI Suggestions
                </Button>
            )}

            {/* AI Suggestions Panel */}
            {showSuggestions && (
                <div className="relative">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSuggestions(false)}
                        className="absolute top-4 right-4 z-10"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                    <AIContentSuggestions
                        userId={user.id}
                        marketFocus={user.marketFocus}
                        onSelectContentType={handleSelectContentType}
                        onSelectIdea={handleSelectIdea}
                    />
                </div>
            )}

            {/* Content Engine Tabs */}
            <Card>
                <CardHeader>
                    <CardTitle>Content Engine</CardTitle>
                </CardHeader>
                <CardContent>
                    {/* Your existing content engine tabs */}
                    <p className="text-muted-foreground">
                        Active tab: {activeTab}
                    </p>
                    {formData.topic && (
                        <div className="mt-4 p-4 bg-primary/5 rounded-lg">
                            <p className="text-sm font-semibold mb-2">Pre-filled from AI suggestion:</p>
                            <p className="text-sm">Topic: {formData.topic}</p>
                            {formData.description && (
                                <p className="text-sm">Description: {formData.description}</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

/**
 * Example: Tracking content creation in form submission
 */
export function ExampleContentForm() {
    const handleSubmit = async (formData: FormData) => {
        try {
            // Generate content (your existing logic)
            const result = await generateContent(formData);

            // Track successful creation
            await trackContentCreationAction('Blog Post', true);

            return { success: true, data: result };
        } catch (error) {
            // Track failed creation
            await trackContentCreationAction('Blog Post', false);

            return { success: false, error: 'Failed to generate content' };
        }
    };

    return (
        <form action={handleSubmit}>
            {/* Your form fields */}
        </form>
    );
}

// Placeholder function
async function generateContent(formData: FormData) {
    return { content: 'Generated content' };
}

/**
 * Example: Using suggestions in a sidebar
 */
export function ContentSuggestionsSidebar() {
    const { user } = useUser();

    if (!user) return null;

    return (
        <aside className="w-80 space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <CardTitle className="text-lg">Quick Suggestions</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <AIContentSuggestions
                        userId={user.id}
                        marketFocus={user.marketFocus}
                        onSelectContentType={(type) => {
                            console.log('Selected content type:', type);
                        }}
                        onSelectIdea={(idea) => {
                            console.log('Selected idea:', idea);
                        }}
                    />
                </CardContent>
            </Card>
        </aside>
    );
}

/**
 * Example: Minimal suggestions widget
 */
export function QuickSuggestionsWidget() {
    const { user } = useUser();
    const [suggestions, setSuggestions] = useState<any>(null);

    const loadSuggestions = async () => {
        if (!user) return;

        const response = await fetch('/api/content-suggestions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: user.id,
                marketFocus: user.marketFocus,
            }),
        });

        const data = await response.json();
        setSuggestions(data);
    };

    return (
        <Card className="border-primary/20">
            <CardHeader>
                <CardTitle className="text-sm">AI Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
                {!suggestions ? (
                    <Button onClick={loadSuggestions} size="sm" variant="outline">
                        <Sparkles className="w-4 h-4 mr-2" />
                        Get Suggestions
                    </Button>
                ) : (
                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                            {suggestions.contentIdeas?.length || 0} ideas available
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {suggestions.postingTimes?.length || 0} optimal times
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

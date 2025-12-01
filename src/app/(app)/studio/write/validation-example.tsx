'use client';

/**
 * Validation Score Example Component
 * 
 * Demonstrates how to display validation scores in the Studio Write interface.
 * Shows goal alignment, social media, and SEO scores for generated content.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ValidationScoreDisplay } from '@/components/validation-score-display';
import { Loader2, Sparkles } from 'lucide-react';
import { generateBlogPostWithScores } from '@/app/actions-with-validation';
import type { ValidationResult } from '@/aws/bedrock/validation-agent-enhanced';

export function ValidationExample() {
    const [topic, setTopic] = useState('');
    const [generatedContent, setGeneratedContent] = useState('');
    const [validation, setValidation] = useState<ValidationResult | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        if (!topic.trim()) return;

        setIsGenerating(true);
        try {
            const result = await generateBlogPostWithScores({
                topic: topic.trim(),
                includeWebSearch: true,
                searchDepth: 'basic',
            });

            setGeneratedContent(result.content.blogPost);
            setValidation(result.validation);
        } catch (error) {
            console.error('Generation failed:', error);
            alert('Failed to generate content. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="container max-w-7xl mx-auto p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">Content Validation Demo</h1>
                <p className="text-muted-foreground">
                    Generate content and see detailed validation scores for goal alignment, social media optimization, and SEO.
                </p>
            </div>

            {/* Input Section */}
            <Card>
                <CardHeader>
                    <CardTitle>Generate Content</CardTitle>
                    <CardDescription>Enter a topic to generate a blog post with validation scores</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="topic">Blog Post Topic</Label>
                        <Input
                            id="topic"
                            placeholder="e.g., Top 10 Home Staging Tips for 2024"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !isGenerating) {
                                    handleGenerate();
                                }
                            }}
                        />
                    </div>
                    <Button
                        onClick={handleGenerate}
                        disabled={!topic.trim() || isGenerating}
                        className="w-full"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating & Validating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Generate with Validation
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Validation Scores */}
            {validation && (
                <div>
                    <h2 className="text-2xl font-bold mb-4">Validation Scores</h2>
                    <ValidationScoreDisplay validation={validation} showDetails={true} />
                </div>
            )}

            {/* Generated Content */}
            {generatedContent && (
                <Card>
                    <CardHeader>
                        <CardTitle>Generated Content</CardTitle>
                        <CardDescription>
                            {validation?.passed
                                ? '✅ Content passed validation and is ready to use'
                                : '⚠️ Content has validation issues that should be addressed'
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea
                            value={generatedContent}
                            onChange={(e) => setGeneratedContent(e.target.value)}
                            className="min-h-[400px] font-mono text-sm"
                            placeholder="Generated content will appear here..."
                        />
                    </CardContent>
                </Card>
            )}

            {/* Score Interpretation Guide */}
            <Card>
                <CardHeader>
                    <CardTitle>Understanding Validation Scores</CardTitle>
                    <CardDescription>How to interpret the validation metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="font-semibold mb-2">Goal Alignment Score (0-100)</h4>
                        <p className="text-sm text-muted-foreground">
                            Measures how well the content achieves your stated objective. A score above 80 indicates the content
                            directly addresses your goal with relevant information and appropriate structure.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-2">Social Media Score (0-100)</h4>
                        <p className="text-sm text-muted-foreground">
                            Evaluates engagement potential and shareability across platforms. Includes:
                        </p>
                        <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
                            <li><strong>Engagement:</strong> Likelihood to generate likes, comments, and interactions</li>
                            <li><strong>Shareability:</strong> Likelihood to be shared by readers</li>
                            <li><strong>Platform Fit:</strong> How well content suits each social platform's style and audience</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-2">SEO Score (0-100)</h4>
                        <p className="text-sm text-muted-foreground">
                            Assesses search engine optimization effectiveness. Includes:
                        </p>
                        <ul className="text-sm text-muted-foreground list-disc list-inside mt-2 space-y-1">
                            <li><strong>Keyword Optimization:</strong> Proper use and placement of target keywords</li>
                            <li><strong>Readability:</strong> Content structure and scannability for readers and search engines</li>
                            <li><strong>Structure:</strong> Heading hierarchy, formatting, and organization</li>
                            <li><strong>Meta Optimization:</strong> Title, description, and meta elements quality</li>
                        </ul>
                    </div>

                    <div className="pt-4 border-t">
                        <h4 className="font-semibold mb-2">Score Ranges</h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="font-semibold text-green-700">80-100: Excellent</div>
                                <div className="text-muted-foreground">Ready to publish</div>
                            </div>
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <div className="font-semibold text-yellow-700">60-79: Good</div>
                                <div className="text-muted-foreground">Minor improvements suggested</div>
                            </div>
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <div className="font-semibold text-red-700">0-59: Needs Work</div>
                                <div className="text-muted-foreground">Significant revisions needed</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

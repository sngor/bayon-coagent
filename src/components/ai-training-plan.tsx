'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CardGradientMesh } from '@/components/ui/gradient-mesh';
import { Sparkles, Save, Download, Lightbulb, Target, TrendingUp, Users, ChevronRight } from 'lucide-react';
import { LoadingDots } from '@/components/ui/loading-dots';
import { generateTrainingPlanAction, saveTrainingPlanAction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/aws/auth';
import { cn } from '@/lib/utils';
import { FavoritesButton } from '@/components/favorites-button';
import { getPageConfig } from '@/components/dashboard-quick-actions';

export interface AITrainingPlanProps {
    className?: string;
}

const EXAMPLE_CHALLENGES = [
    {
        icon: Users,
        title: 'Lead Follow-Up',
        description: 'I struggle with following up with leads consistently and often let opportunities slip through the cracks.',
        gradient: 'from-blue-500 to-cyan-500'
    },
    {
        icon: TrendingUp,
        title: 'Social Media Presence',
        description: 'I want to improve my social media presence but don\'t know where to start or what content to post.',
        gradient: 'from-purple-500 to-pink-500'
    },
    {
        icon: Target,
        title: 'Time Management',
        description: 'I need help managing my time better between prospecting, client meetings, and administrative tasks.',
        gradient: 'from-orange-500 to-red-500'
    },
    {
        icon: Lightbulb,
        title: 'Listing Presentations',
        description: 'I want to create more compelling and professional listing presentations that win me more business.',
        gradient: 'from-green-500 to-emerald-500'
    }
];

export function AITrainingPlan({ className }: AITrainingPlanProps = {}) {
    const [challenge, setChallenge] = useState('');
    const [plan, setPlan] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    const { user } = useUser();

    const handleGenerate = async () => {
        if (!challenge.trim()) {
            toast({
                title: 'Input Required',
                description: 'Please describe your challenge or growth area.',
                variant: 'destructive',
            });
            return;
        }

        setIsGenerating(true);
        setPlan('');

        try {
            const result = await generateTrainingPlanAction(challenge);

            if (result.errors) {
                console.error('Training plan errors:', result.errors);
                toast({
                    title: 'Generation Failed',
                    description: result.errors.join(', '),
                    variant: 'destructive',
                });
            } else if (result.data?.plan) {
                setPlan(result.data.plan);
                toast({
                    title: 'Training Plan Generated',
                    description: 'Your personalized plan is ready!',
                });
            } else {
                console.error('No plan data returned:', result);
                toast({
                    title: 'Generation Failed',
                    description: 'No training plan was generated. Please try again.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Training plan generation error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            toast({
                title: 'Error',
                description: `Failed: ${errorMessage}`,
                variant: 'destructive',
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!plan || !challenge) return;

        if (!user) {
            toast({
                title: 'Authentication Required',
                description: 'You must be logged in to save training plans.',
                variant: 'destructive',
            });
            return;
        }

        setIsSaving(true);
        try {
            const result = await saveTrainingPlanAction(challenge, plan, user.id);

            if (result.errors) {
                toast({
                    title: 'Save Failed',
                    description: result.errors.join(', '),
                    variant: 'destructive',
                });
            } else {
                toast({
                    title: 'Training Plan Saved',
                    description: 'Your plan has been saved to your knowledge base.',
                });
            }
        } catch (error) {
            console.error('Save error:', error);
            toast({
                title: 'Error',
                description: 'Failed to save training plan.',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDownload = () => {
        if (!plan) return;

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Training Plan - ${challenge.substring(0, 50)}</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
        h3 { color: #1a1a1a; margin-top: 24px; margin-bottom: 12px; font-size: 1.25rem; font-weight: 600; }
        h4 { color: #333; margin-top: 16px; margin-bottom: 8px; font-weight: 600; }
        p { margin-top: 8px; color: #4a4a4a; }
        ul, ol { margin-left: 24px; margin-top: 8px; }
        li { margin-top: 8px; }
        strong { font-weight: 600; color: #1a1a1a; }
        .header { border-bottom: 2px solid #e5e5e5; padding-bottom: 16px; margin-bottom: 24px; }
        .challenge { background: #f5f5f5; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Your Personalized Training Plan</h1>
        <p>Generated by Bayon Coagent</p>
    </div>
    <div class="challenge">
        <strong>Challenge:</strong> ${challenge}
    </div>
    ${plan}
</body>
</html>
        `;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `training-plan-${Date.now()}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
            title: 'Downloaded',
            description: 'Training plan downloaded as HTML file.',
        });
    };

    const handleExampleClick = (description: string) => {
        setChallenge(description);
        // Scroll to textarea
        setTimeout(() => {
            document.getElementById('challenge')?.focus();
        }, 100);
    };

    return (
        <div className={cn('space-y-6', className)}>
            {/* Main Card with Header */}
            <CardGradientMesh>
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                                    <Sparkles className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="font-headline text-2xl">AI Training Plan Generator</CardTitle>
                                    <CardDescription>
                                        Describe your challenge or growth area, and get a personalized, actionable training plan powered by AI
                                    </CardDescription>
                                </div>
                            </div>
                            {(() => {
                                const pageConfig = getPageConfig('/learning/ai-plan');
                                return pageConfig ? <FavoritesButton item={pageConfig} /> : null;
                            })()}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Input Section */}
                        <div className="space-y-2">
                            <label htmlFor="challenge" className="text-sm font-semibold flex items-center gap-2">
                                What's your growth area?
                                <span className="text-xs font-normal text-muted-foreground">
                                    💡 Tip: Be specific for a more tailored plan
                                </span>
                            </label>
                            <Textarea
                                id="challenge"
                                placeholder="Example: I struggle with following up with leads consistently, or I want to improve my social media presence but don't know where to start..."
                                value={challenge}
                                onChange={(e) => setChallenge(e.target.value)}
                                rows={5}
                                className="resize-none text-base"
                            />
                        </div>

                        {/* Generate Button */}
                        <Button
                            onClick={handleGenerate}
                            disabled={isGenerating || !challenge.trim()}
                            className="w-full h-14 text-base font-semibold bg-gradient-to-r from-primary via-primary/90 to-primary/80 hover:from-primary/95 hover:via-primary/85 hover:to-primary/75 shadow-lg hover:shadow-xl transition-all duration-300"
                            size="lg"
                        >
                            {isGenerating ? (
                                <>
                                    <LoadingDots className="mr-2" />
                                    Generating Your Personalized Plan...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-5 w-5" />
                                    Generate Training Plan
                                    <ChevronRight className="ml-2 h-5 w-5" />
                                </>
                            )}
                        </Button>

                        {/* Generated Plan */}
                        {plan && (
                            <div className="space-y-4 animate-fade-in-up">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        variant="outline"
                                        className="flex-1 h-11"
                                    >
                                        {isSaving ? (
                                            <>
                                                <LoadingDots size="sm" className="mr-2" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Save to Knowledge Base
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        onClick={handleDownload}
                                        variant="outline"
                                        className="flex-1 h-11"
                                    >
                                        <Download className="mr-2 h-4 w-4" />
                                        Download as HTML
                                    </Button>
                                </div>
                                <div className="relative overflow-hidden rounded-xl border-2 border-primary/20 bg-gradient-to-br from-secondary/50 via-secondary/30 to-background p-8">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                                    <div className="relative">
                                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-primary/10">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                                                <Sparkles className="h-5 w-5 text-primary" />
                                            </div>
                                            <h3 className="font-headline font-semibold text-xl">Your Personalized Training Plan</h3>
                                        </div>
                                        <div
                                            className="prose prose-sm md:prose-base lg:prose-lg max-w-none text-foreground/90 dark:prose-invert prose-headings:text-foreground prose-headings:font-headline prose-a:text-primary prose-strong:text-foreground prose-strong:font-semibold prose-ul:list-disc prose-ol:list-decimal"
                                            dangerouslySetInnerHTML={{ __html: plan }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </CardGradientMesh>

            {/* Example Challenges - Only show when no plan is generated */}
            {!plan && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-primary" />
                        <h3 className="font-headline font-semibold text-lg">Need inspiration? Try one of these:</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {EXAMPLE_CHALLENGES.map((example, index) => {
                            const Icon = example.icon;
                            return (
                                <button
                                    key={index}
                                    onClick={() => handleExampleClick(example.description)}
                                    className="group relative overflow-hidden rounded-xl border bg-card hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer text-left p-6"
                                >
                                    <div className={cn(
                                        'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300',
                                        example.gradient
                                    )} />
                                    <div className="relative space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                'h-10 w-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white shadow-md',
                                                example.gradient
                                            )}>
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <h4 className="font-semibold text-base group-hover:text-primary transition-colors">
                                                {example.title}
                                            </h4>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2 pl-13">
                                            {example.description}
                                        </p>
                                    </div>
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ChevronRight className="h-5 w-5 text-primary" />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

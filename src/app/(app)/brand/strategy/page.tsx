
'use client';

import { useMemo, useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { StandardPageLayout, StandardErrorDisplay } from '@/components/standard';
import { StandardFormActions } from '@/components/standard/form-actions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent,
} from '@/components/ui/glass-card';
import {
  EnhancedCard,
  EnhancedCardContent,
  EnhancedCardDescription,
  EnhancedCardHeader,
  EnhancedCardTitle,
} from '@/components/ui/enhanced-card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Target,
  ArrowRight,
  BookText,
  ShieldCheck,
  Users,
  TrendingUp,
  PartyPopper,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  AISparkleIcon,
  SuccessIcon,
  ContentIcon,
} from '@/components/ui/real-estate-icons';
import { AILoader, StepLoader } from '@/components/ui/loading-states';
import { StandardLoadingSpinner, StandardEmptyState } from '@/components/standard';
import { AIOperationProgress, useAIOperation } from '@/components/ui/ai-operation-progress';
import { useUser } from '@/aws/auth';
import { useItem, useQuery } from '@/aws/dynamodb/hooks';
import type { BrandAudit, Competitor, MarketingPlan as MarketingPlanType } from '@/lib/types';
import { generateMarketingPlanAction, saveMarketingPlanAction } from '@/app/actions';
import { showSuccessToast, showErrorToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Celebration } from '@/components/ui/celebration';

type GeneratePlanState = {
  message: string;
  data: { id: string; steps: any[]; createdAt: string } | null;
  errors: any;
};

const initialPlanState: GeneratePlanState = {
  message: '',
  data: null,
  errors: {},
};

function GeneratePlanButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <StandardFormActions
      primaryAction={{
        label: 'Generate My Marketing Plan',
        type: 'submit',
        variant: 'ai',
        loading: pending,
        disabled: disabled,
      }}
      alignment="left"
      className="min-w-[280px]"
    />
  );
}

const toolIcons: { [key: string]: React.ReactNode } = {
  'Content Engine': <BookText className="mr-2 h-4 w-4" />,
  'Brand Audit': <ShieldCheck className="mr-2 h-4 w-4" />,
  'Competitive Analysis': <Users className="mr-2 h-4 w-4" />,
};

export default function MarketingPlanPage() {
  const { user, isUserLoading } = useUser();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPlan, setShowPlan] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [state, formAction] = useActionState(generateMarketingPlanAction, initialPlanState);

  // AI Operation Progress tracking
  const marketingPlanOperation = useAIOperation();

  // Generation steps for progress indicator
  const generationSteps = [
    'Analyzing your brand audit data...',
    'Evaluating competitor landscape...',
    'Identifying key opportunities...',
    'Crafting personalized strategies...',
    'Finalizing your action plan...',
  ];

  // Memoize DynamoDB keys
  const auditPK = useMemo(() => user ? `USER#${user.id}` : null, [user]);
  const auditSK = useMemo(() => 'AUDIT#main', []);
  const competitorsPK = useMemo(() => user ? `USER#${user.id}` : null, [user]);
  const competitorsSKPrefix = useMemo(() => 'COMPETITOR#', []);
  const plansPK = useMemo(() => user ? `USER#${user.id}` : null, [user]);
  const plansSKPrefix = useMemo(() => 'PLAN#', []);

  const { data: brandAuditData, isLoading: isAuditLoading } = useItem<BrandAudit>(auditPK, auditSK);
  const { data: competitorsData, isLoading: areCompetitorsLoading } = useQuery<Competitor>(competitorsPK, competitorsSKPrefix);
  const { data: latestPlanData, isLoading: isPlanLoading } = useQuery<MarketingPlanType>(plansPK, plansSKPrefix, {
    limit: 1,
    scanIndexForward: false,
  });

  const isDataReady = !isAuditLoading && !areCompetitorsLoading && !!brandAuditData && !!competitorsData;
  const displayPlan = state.data ?? (latestPlanData && latestPlanData[0]);

  // Simulate step progression during generation
  useEffect(() => {
    if (isGenerating) {
      // Start AI operation tracking
      marketingPlanOperation.start('generate-marketing-plan', {
        totalSteps: generationSteps.length,
        estimatedDuration: generationSteps.length * 2000,
      });

      const stepInterval = setInterval(() => {
        setGenerationStep((prev) => {
          if (prev < generationSteps.length - 1) {
            const nextStep = prev + 1;
            // Update operation progress
            marketingPlanOperation.updateStep(nextStep, generationSteps[nextStep]);
            return nextStep;
          }
          return prev;
        });
      }, 2000); // Progress through steps every 2 seconds

      return () => clearInterval(stepInterval);
    } else {
      setGenerationStep(0);
      if (marketingPlanOperation.isRunning) {
        marketingPlanOperation.complete();
      }
    }
  }, [isGenerating, generationSteps.length, marketingPlanOperation]);

  useEffect(() => {
    if (state.message === 'success' && state.data) {
      if (user?.id) {
        const savePlan = async () => {
          try {
            await saveMarketingPlanAction(
              JSON.stringify(state.data),
              'Marketing Plan'
            );
          } catch (error) {
            console.error('Failed to save marketing plan:', error);
          }
        };
        savePlan();

        // Show celebratory animation
        setShowCelebration(true);

        // Show success toast
        showSuccessToast(
          '🎉 Plan Generated!',
          'Your personalized marketing plan is ready to help you grow your business.'
        );

        setIsGenerating(false);
        setGenerationError(null);

        // Trigger reveal animation after celebration
        setTimeout(() => {
          setShowCelebration(false);
          setShowPlan(true);
        }, 2000);
      }
    } else if (state.message && state.message !== 'success') {
      setGenerationError(state.message);
      showErrorToast(
        'Failed to Generate Plan',
        state.message || 'An unexpected error occurred. Please try again.'
      );
      setIsGenerating(false);
    }
  }, [state, user?.id]);

  // Show plan when it loads from Firestore
  useEffect(() => {
    if (displayPlan && !isGenerating) {
      setShowPlan(true);
    }
  }, [displayPlan, isGenerating]);

  const handleFormSubmit = async (formData: FormData) => {
    setIsGenerating(true);
    setShowPlan(false);
    setGenerationError(null);
    setGenerationStep(0);
    formAction(formData);
  };

  const handleRetry = () => {
    setGenerationError(null);
    const form = document.querySelector('form') as HTMLFormElement;
    if (form) {
      setIsGenerating(true);
      setShowPlan(false);
      setGenerationStep(0);
      form.requestSubmit();
    }
  };

  return (
    <StandardPageLayout
      spacing="default"
    >

      <Card className="text-center">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Ready to Grow Your Brand?</CardTitle>
          <CardDescription>
            Click the button below to have our AI analyze your Brand Audit and Competitive Analysis data. It will create a tailored 3-step plan to address your biggest marketing opportunities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleFormSubmit}>
            <input type="hidden" name="userId" value={user?.id || ''} />
            <input type="hidden" name="brandAudit" value={JSON.stringify(brandAuditData || { results: [] })} />
            <input type="hidden" name="competitors" value={JSON.stringify(competitorsData || [])} />
            <GeneratePlanButton disabled={!isDataReady} />
            {!isDataReady && (
              <p className="text-sm text-muted-foreground mt-2">
                Waiting for Brand Audit and Competitor data to load...
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {isPlanLoading && !displayPlan && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Your Action Plan</CardTitle>
            <CardDescription>Here are your personalized next steps.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-48">
            <StandardLoadingSpinner
              size="lg"
              message="Loading your latest plan..."
            />
          </CardContent>
        </Card>
      )}

      {displayPlan && showPlan && (
        <Card className="animate-fade-in-up">
          <CardHeader>
            <CardTitle className="font-headline">Your Action Plan</CardTitle>
            <CardDescription>
              Here are your personalized next steps, generated on {new Date(displayPlan.createdAt).toLocaleDateString()}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-6">
              {(displayPlan as any).steps?.map((item: any, index: number) => (
                <li
                  key={index}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-lg border bg-secondary/30 transition-all duration-300 hover:shadow-md hover:border-primary/20",
                    "animate-fade-in-up",
                    index === 0 && "animate-delay-100",
                    index === 1 && "animate-delay-200",
                    index === 2 && "animate-delay-300"
                  )}
                >
                  <div className="flex-shrink-0 font-bold text-primary text-3xl font-headline">
                    {index + 1}
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-semibold text-lg">{item.task}</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-3">{item.rationale}</p>
                    <Link href={item.toolLink}>
                      <Button size="sm" className="transition-all hover:scale-105">
                        {toolIcons[item.tool] || <Target className="mr-2 h-4 w-4" />}
                        Use {item.tool}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {!isPlanLoading && !displayPlan && !isGenerating && (
        <div className="space-y-6">
          <StandardEmptyState
            icon={<AISparkleIcon animated={true} className="h-16 w-16 text-primary" />}
            title="Your Marketing Success Starts Here"
            description="Let AI analyze your brand presence and competitive landscape to create a personalized, actionable marketing plan. Get strategic recommendations tailored to your unique position in the market."
            action={{
              label: isDataReady ? "Generate My Marketing Plan" : "Complete Prerequisites First",
              onClick: () => {
                if (isDataReady) {
                  const form = document.querySelector('form') as HTMLFormElement;
                  if (form) {
                    setIsGenerating(true);
                    setShowPlan(false);
                    form.requestSubmit();
                  }
                }
              },
              variant: isDataReady ? "ai" : "outline",
            }}
            className="border-2 border-dashed border-primary/20"
          />

          {/* Prerequisites guidance */}
          {!isDataReady && (
            <Card className="border-warning/50 bg-warning/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-warning" />
                  Prerequisites Required
                </CardTitle>
                <CardDescription>
                  To generate your personalized marketing plan, we need some data about your brand and competitors.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold",
                      brandAuditData ? "bg-success text-white" : "bg-muted text-muted-foreground"
                    )}>
                      {brandAuditData ? "✓" : "1"}
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-medium text-sm">Complete Your Brand Audit</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Run a brand audit to analyze your online presence, NAP consistency, and review sentiment.
                      </p>
                      {!brandAuditData && (
                        <Link href="/brand/audit">
                          <Button variant="outline" size="sm" className="mt-2">
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Go to Brand Audit
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold",
                      competitorsData && competitorsData.length > 0 ? "bg-success text-white" : "bg-muted text-muted-foreground"
                    )}>
                      {competitorsData && competitorsData.length > 0 ? "✓" : "2"}
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-medium text-sm">Add Your Competitors</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Add at least one competitor to understand your competitive landscape and identify opportunities.
                      </p>
                      {(!competitorsData || competitorsData.length === 0) && (
                        <Link href="/competitive-analysis">
                          <Button variant="outline" size="sm" className="mt-2">
                            <Users className="mr-2 h-4 w-4" />
                            Go to Competitive Analysis
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Step-by-step progress indicator during generation */}
      {isGenerating && !displayPlan && !generationError && marketingPlanOperation.tracker && (
        <AIOperationProgress
          operationName="generate-marketing-plan"
          tracker={marketingPlanOperation.tracker}
          title="Creating Your Marketing Plan"
          description="Our AI is analyzing your data to create a personalized strategy..."
        />
      )}

      {/* Celebratory animation on successful generation */}
      {showCelebration && (
        <Card className="border-success bg-gradient-to-br from-success/10 to-success/5 animate-scale-in">
          <CardContent className="py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <PartyPopper className="h-16 w-16 text-success animate-bounce" />
                <div className="absolute inset-0 animate-ping">
                  <PartyPopper className="h-16 w-16 text-success opacity-75" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold font-headline text-success">
                  Success!
                </h3>
                <p className="text-muted-foreground">
                  Your personalized marketing plan is ready
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error handling with recovery options */}
      {generationError && !isGenerating && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="font-headline">Generation Failed</CardTitle>
            <CardDescription>
              We encountered an issue while creating your marketing plan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <StandardErrorDisplay
              title="Generation Failed"
              message={generationError}
              variant="error"
              action={{
                label: "Try Again",
                onClick: handleRetry
              }}
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/brand/audit" className="flex-1">
                <Button variant="outline" className="w-full">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Check Brand Audit
                </Button>
              </Link>
              <Link href="/competitive-analysis" className="flex-1">
                <Button variant="outline" className="w-full">
                  <Users className="mr-2 h-4 w-4" />
                  Check Competitors
                </Button>
              </Link>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                <strong>Common issues:</strong> Make sure you have completed your Brand Audit and added at least one competitor.
                If the problem persists, please contact support.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Celebration animation for successful plan generation */}
      <Celebration
        show={showCelebration}
        type="confetti"
        message="🎉 Marketing Plan Generated!"
        onComplete={() => setShowCelebration(false)}
      />
    </StandardPageLayout>
  );
}

/**
 * AI Operation Progress Integration Examples
 * 
 * This file demonstrates how to integrate the AI operation progress system
 * with your existing server actions and components.
 * 
 * NOTE: This is a documentation file with code examples.
 * Copy the relevant examples to your actual component files.
 * 
 * @ts-nocheck - This file contains example code snippets, not executable code
 */

// ============================================================================
// Example 1: Client Component with Server Action
// ============================================================================

// 'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AIOperationProgress, useAIOperation } from '@/components/ui/ai-operation-progress';
import { generateMarketingPlanAction } from '@/app/actions';

export function MarketingPlanGenerator() {
  const operation = useAIOperation('generate-marketing-plan');
  const [result, setResult] = useState(null);
  
  const handleGenerate = async () => {
    const tracker = operation.start();
    
    try {
      // Simulate progress updates (optional - auto progress will work too)
      setTimeout(() => tracker.updateProgress(25, 'Analyzing your profile...'), 2000);
      setTimeout(() => tracker.updateProgress(50, 'Researching competitors...'), 5000);
      setTimeout(() => tracker.updateProgress(75, 'Crafting action items...'), 10000);
      
      // Call server action
      const response = await generateMarketingPlanAction({
        userId: 'user-123',
        // ... other data
      });
      
      if (response.error) {
        operation.fail(response.error);
      } else {
        operation.complete();
        setResult(response.data);
      }
    } catch (error) {
      operation.fail(error instanceof Error ? error.message : 'Unknown error');
    }
  };
  
  return (
    <div className="space-y-4">
      <Button onClick={handleGenerate} disabled={operation.isRunning}>
        Generate Marketing Plan
      </Button>
      
      {operation.isRunning && operation.tracker && (
        <AIOperationProgress
          operationName="generate-marketing-plan"
          tracker={operation.tracker}
          onCancel={operation.cancel}
        />
      )}
      
      {operation.error && (
        <div className="text-destructive">Error: {operation.error}</div>
      )}
      
      {result && (
        <div className="space-y-2">
          <h3 className="font-semibold">Your Marketing Plan</h3>
          {/* Display result */}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 2: Server Action with Cancellation Support
// ============================================================================

// 'use server';

import { AIOperationTracker } from '@/lib/ai-operation-tracker';
import { generateMarketingPlan } from '@/aws/bedrock/flows/generate-marketing-plan';

export async function generateMarketingPlanWithTracking(
  data: any,
  abortSignal?: AbortSignal
) {
  const tracker = new AIOperationTracker('generate-marketing-plan');
  tracker.start();
  
  try {
    // Check if already cancelled
    if (abortSignal?.aborted) {
      tracker.cancel();
      return { error: 'Operation cancelled' };
    }
    
    // Call Bedrock with abort signal
    const result = await generateMarketingPlan({
      ...data,
      // Pass abort signal to Bedrock if supported
    });
    
    // Check again after async operation
    if (abortSignal?.aborted) {
      tracker.cancel();
      return { error: 'Operation cancelled' };
    }
    
    tracker.complete();
    return { data: result };
  } catch (error) {
    if (error.name === 'AbortError') {
      tracker.cancel();
      return { error: 'Operation cancelled' };
    }
    
    tracker.fail(error instanceof Error ? error.message : 'Unknown error');
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ============================================================================
// Example 3: Multiple Operations in Sequence
// ============================================================================

export function MultiStepProcess() {
  const napAudit = useAIOperation('run-nap-audit');
  const competitors = useAIOperation('find-competitors');
  const marketingPlan = useAIOperation('generate-marketing-plan');
  
  const [currentStep, setCurrentStep] = useState<'audit' | 'competitors' | 'plan' | 'done'>('audit');
  
  const runFullProcess = async () => {
    try {
      // Step 1: NAP Audit
      setCurrentStep('audit');
      const auditTracker = napAudit.start();
      const auditResult = await runNapAuditAction();
      napAudit.complete();
      
      // Step 2: Find Competitors
      setCurrentStep('competitors');
      const competitorTracker = competitors.start();
      const competitorResult = await findCompetitorsAction();
      competitors.complete();
      
      // Step 3: Generate Marketing Plan
      setCurrentStep('plan');
      const planTracker = marketingPlan.start();
      const planResult = await generateMarketingPlanAction({
        auditData: auditResult,
        competitorData: competitorResult,
      });
      marketingPlan.complete();
      
      setCurrentStep('done');
    } catch (error) {
      // Handle errors for current step
      if (currentStep === 'audit') napAudit.fail(error.message);
      if (currentStep === 'competitors') competitors.fail(error.message);
      if (currentStep === 'plan') marketingPlan.fail(error.message);
    }
  };
  
  return (
    <div className="space-y-4">
      <Button onClick={runFullProcess}>Run Full Process</Button>
      
      {currentStep === 'audit' && napAudit.isRunning && napAudit.tracker && (
        <AIOperationProgress
          operationName="run-nap-audit"
          tracker={napAudit.tracker}
          onCancel={() => {
            napAudit.cancel();
            setCurrentStep('done');
          }}
        />
      )}
      
      {currentStep === 'competitors' && competitors.isRunning && competitors.tracker && (
        <AIOperationProgress
          operationName="find-competitors"
          tracker={competitors.tracker}
          onCancel={() => {
            competitors.cancel();
            setCurrentStep('done');
          }}
        />
      )}
      
      {currentStep === 'plan' && marketingPlan.isRunning && marketingPlan.tracker && (
        <AIOperationProgress
          operationName="generate-marketing-plan"
          tracker={marketingPlan.tracker}
          onCancel={() => {
            marketingPlan.cancel();
            setCurrentStep('done');
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// Example 4: Compact Progress in a List
// ============================================================================

import { AIOperationProgressCompact } from '@/components/ui/ai-operation-progress';

export function ContentGenerationList() {
  const [operations, setOperations] = useState<Map<string, ReturnType<typeof useAIOperation>>>(
    new Map()
  );
  
  const generateContent = (contentId: string, type: string) => {
    const operation = useAIOperation(type);
    setOperations(prev => new Map(prev).set(contentId, operation));
    
    const tracker = operation.start();
    
    // Call your generation function
    generateContentAction(contentId, type)
      .then(() => operation.complete())
      .catch(error => operation.fail(error.message));
  };
  
  return (
    <div className="space-y-2">
      {Array.from(operations.entries()).map(([contentId, operation]) => (
        operation.isRunning && operation.tracker && (
          <AIOperationProgressCompact
            key={contentId}
            operationName={operation.tracker.getMetrics().operationName}
            tracker={operation.tracker}
            onCancel={() => {
              operation.cancel();
              setOperations(prev => {
                const next = new Map(prev);
                next.delete(contentId);
                return next;
              });
            }}
          />
        )
      ))}
    </div>
  );
}

// ============================================================================
// Example 5: Custom Progress Updates
// ============================================================================

export function CustomProgressExample() {
  const operation = useAIOperation('run-research-agent');
  
  const runResearch = async () => {
    const tracker = operation.start();
    
    try {
      // Phase 1: Search
      tracker.updateProgress(10, 'Searching for relevant sources...');
      const sources = await searchSources();
      
      // Phase 2: Gather
      tracker.updateProgress(30, 'Gathering information from sources...');
      const data = await gatherData(sources);
      
      // Phase 3: Analyze
      tracker.updateProgress(60, 'Analyzing and synthesizing data...');
      const analysis = await analyzeData(data);
      
      // Phase 4: Generate
      tracker.updateProgress(90, 'Generating comprehensive report...');
      const report = await generateReport(analysis);
      
      tracker.updateProgress(100, 'Complete!');
      operation.complete();
      
      return report;
    } catch (error) {
      operation.fail(error.message);
    }
  };
  
  return (
    <div className="space-y-4">
      <Button onClick={runResearch}>Run Research</Button>
      
      {operation.isRunning && operation.tracker && (
        <AIOperationProgress
          operationName="run-research-agent"
          tracker={operation.tracker}
          onCancel={operation.cancel}
        />
      )}
    </div>
  );
}

// ============================================================================
// Example 6: Toast Notifications on Completion
// ============================================================================

import { useToast } from '@/hooks/use-toast';

export function OperationWithToast() {
  const operation = useAIOperation('generate-blog-post');
  const { toast } = useToast();
  
  const generate = async () => {
    const tracker = operation.start();
    
    try {
      const result = await generateBlogPostAction();
      operation.complete();
      
      toast({
        title: 'Blog post generated!',
        description: 'Your content is ready to review.',
      });
    } catch (error) {
      operation.fail(error.message);
      
      toast({
        variant: 'destructive',
        title: 'Generation failed',
        description: error.message,
      });
    }
  };
  
  return (
    <div className="space-y-4">
      <Button onClick={generate}>Generate Blog Post</Button>
      
      {operation.isRunning && operation.tracker && (
        <AIOperationProgress
          operationName="generate-blog-post"
          tracker={operation.tracker}
          onCancel={() => {
            operation.cancel();
            toast({
              title: 'Operation cancelled',
              description: 'Blog post generation was cancelled.',
            });
          }}
        />
      )}
    </div>
  );
}

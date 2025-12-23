/**
 * Research Agent Hook
 * 
 * Custom hook for managing research operations with proper state management,
 * error handling, and feature gate integration.
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';
import { useUser } from '@/aws/auth';
import { useFeatureGates } from '@/hooks/use-feature-gates';
import { saveResearchReportAction } from '@/app/actions';
import type { RunResearchAgentOutput } from '@/aws/bedrock/flows';

interface ResearchState {
  message: string;
  data: (RunResearchAgentOutput & { reportId?: string }) | null;
  errors: Record<string, string[]>;
  isLoading: boolean;
}

interface UseResearchAgentReturn {
  state: ResearchState;
  submitResearch: (topic: string) => Promise<void>;
  isSubmitting: boolean;
}

export function useResearchAgent(): UseResearchAgentReturn {
  const router = useRouter();
  const { user } = useUser();
  const { canUseFeature, incrementUsage, getUpgradeMessage } = useFeatureGates();
  
  const [state, setState] = useState<ResearchState>({
    message: '',
    data: null,
    errors: {},
    isLoading: false,
  });
  
  const [isSaving, setIsSaving] = useState(false);

  const submitResearch = useCallback(async (topic: string) => {
    // Validate input
    if (!topic?.trim()) {
      setState(prev => ({
        ...prev,
        errors: { topic: ['Please enter a research topic'] }
      }));
      return;
    }

    // Check feature gate
    if (!canUseFeature('researchReports')) {
      toast({
        variant: 'destructive',
        title: 'Limit Reached',
        description: getUpgradeMessage('researchReports'),
      });
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      message: '', 
      errors: {} 
    }));

    try {
      // TODO: Replace with actual API call to research agent
      const mockResult = {
        success: true,
        data: {
          summary: `Comprehensive research report on: ${topic}`,
          keyFindings: [
            'Market conditions are favorable for investment',
            'Interest rates are expected to stabilize',
            'Regional growth patterns show positive trends'
          ],
          marketData: { 
            trend: 'positive', 
            confidence: 0.85,
            marketScore: 7.2 
          },
          trends: [
            'Increasing demand in suburban markets',
            'Technology adoption in real estate transactions'
          ],
          implications: 'Current market conditions present opportunities for strategic positioning and client acquisition.',
          recommendations: [
            'Focus on suburban market segments',
            'Leverage technology for competitive advantage',
            'Develop expertise in emerging market trends'
          ],
          sources: [
            'National Association of Realtors Market Report',
            'Federal Reserve Economic Data',
            'Local MLS Market Statistics'
          ]
        }
      };

      if (mockResult.success) {
        const data = mockResult.data;
        const formattedReport = [
          data.summary,
          '',
          '## Key Findings',
          ...data.keyFindings.map(finding => `- ${finding}`),
          '',
          '## Market Data',
          JSON.stringify(data.marketData, null, 2),
          '',
          '## Trends',
          ...data.trends.map(trend => `- ${trend}`),
          '',
          '## Implications',
          data.implications,
          '',
          '## Recommendations',
          ...data.recommendations.map(rec => `- ${rec}`),
          '',
          '## Sources',
          ...data.sources.map(source => `- ${source}`)
        ].join('\n');

        setState(prev => ({
          ...prev,
          message: 'success',
          data: { report: formattedReport },
          isLoading: false,
        }));

        // Auto-save the report
        await saveReport(topic, formattedReport);
        
        // Increment usage counter
        await incrementUsage('researchReports');
      } else {
        throw new Error('Research failed');
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        message: error instanceof Error ? error.message : 'Research failed',
        data: null,
        errors: { general: [error instanceof Error ? error.message : 'Unknown error'] },
        isLoading: false,
      }));
    }
  }, [canUseFeature, getUpgradeMessage, incrementUsage]);

  const saveReport = useCallback(async (topic: string, report: string) => {
    if (!user?.id || isSaving) return;

    setIsSaving(true);
    try {
      const result = await saveResearchReportAction(
        topic || "Untitled Report",
        report
      );

      if (result.message === 'Report saved successfully') {
        toast({ 
          title: 'Report Saved!', 
          description: 'Your research report has been saved to your Knowledge Base.' 
        });
        
        // Navigate to the saved report
        if (result.data?.id) {
          router.push(`/research/reports/${result.data.id}`);
        }
      } else {
        throw new Error(result.errors?.[0] || 'Save failed');
      }
    } catch (error) {
      console.error('Failed to save report:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Save Failed', 
        description: 'Could not save report to Knowledge Base.' 
      });
    } finally {
      setIsSaving(false);
    }
  }, [user?.id, router, isSaving]);

  return {
    state,
    submitResearch,
    isSubmitting: state.isLoading || isSaving,
  };
}
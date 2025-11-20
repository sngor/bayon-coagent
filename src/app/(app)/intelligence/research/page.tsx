
'use client';

import { useActionState, useEffect, useTransition, useState, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';

import { StandardPageLayout } from '@/components/standard';
import { StandardFormActions } from '@/components/standard/form-actions';
import { StandardFormField } from '@/components/standard/form-field';
import { StandardCard } from '@/components/standard/card';
import { StandardSkeleton } from '@/components/standard/skeleton';
import { AIOperationProgress, useAIOperation } from '@/components/ui/ai-operation-progress';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { NoResultsEmptyState } from '@/components/ui/empty-states';
import { StandardEmptyState } from '@/components/standard/empty-state';
import { filterBySearch, highlightMatches } from '@/lib/search-utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { runResearchAgentAction } from '@/app/actions';
import { BrainCircuit, Library, Calendar, Search } from 'lucide-react';
import { type RunResearchAgentOutput } from '@/aws/bedrock/flows';
import { toast } from '@/hooks/use-toast';
import { useUser } from '@/aws/auth';
import { getRepository } from '@/aws/dynamodb';
import { getResearchReportKeys } from '@/aws/dynamodb/keys';
import type { ResearchReport } from '@/lib/types';
import Link from 'next/link';

type ResearchInitialState = {
  message: string;
  data: (RunResearchAgentOutput & { reportId?: string }) | null;
  errors: any;
};

const researchInitialState: ResearchInitialState = {
  message: '',
  data: null,
  errors: {},
};

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <StandardFormActions
      primaryAction={{
        label: 'Start Research',
        type: 'submit',
        variant: 'ai',
        loading: pending,
        disabled: disabled,
      }}
      alignment="left"
      className="w-full md:w-auto"
    />
  );
}




export default function ResearchAgentPage() {
  const [state, formAction, isPending] = useActionState(
    runResearchAgentAction,
    researchInitialState
  );
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const { user, isUserLoading } = useUser();
  const [savedReports, setSavedReports] = useState<ResearchReport[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);

  // AI Operation Progress tracking
  const researchOperation = useAIOperation();

  // Fetch reports from API
  useEffect(() => {
    async function fetchReports() {
      if (!user) {
        setIsLoadingReports(false);
        return;
      }

      try {
        const response = await fetch(`/api/research-reports?userId=${user.id}&limit=3`);
        const data = await response.json();

        if (data.success) {
          setSavedReports(data.reports);
        } else {
          console.error('Failed to fetch reports:', data.error);
          setSavedReports([]);
        }
      } catch (error) {
        console.error('Failed to fetch reports:', error);
        setSavedReports([]);
      } finally {
        setIsLoadingReports(false);
      }
    }

    fetchReports();
  }, [user]);

  // Filter reports based on search query
  const filteredReports = useMemo(() => {
    if (!savedReports) return [];
    return filterBySearch(savedReports, searchQuery, (report) => [
      report.topic || '',
    ]);
  }, [savedReports, searchQuery]);

  // Store the topic from the form
  const [lastTopic, setLastTopic] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Track operation progress
  useEffect(() => {
    if (isPending) {
      researchOperation.start('run-research-agent', {
        totalSteps: 4,
        estimatedDuration: 20000,
      });
      researchOperation.updateStep(0, 'Analyzing your research topic...');
      setTimeout(() => researchOperation.updateStep(1, 'Searching for relevant information...'), 5000);
      setTimeout(() => researchOperation.updateStep(2, 'Synthesizing findings...'), 10000);
      setTimeout(() => researchOperation.updateStep(3, 'Generating comprehensive report...'), 15000);
    } else if (researchOperation.isRunning) {
      researchOperation.complete();
    }
  }, [isPending, researchOperation]);

  useEffect(() => {
    if (state.message === 'success' && state.data && user?.id && !isSaving) {
      const saveReport = async () => {
        setIsSaving(true);
        try {
          const repository = getRepository();
          const reportId = Date.now().toString();
          const keys = getResearchReportKeys(user.id, reportId);
          const dataToSave = {
            id: reportId,
            report: state.data?.report || '',
            citations: state.data?.citations || [],
            topic: lastTopic || "Untitled Report",
            createdAt: new Date().toISOString(),
          };
          await repository.put({
            ...keys,
            EntityType: 'ResearchReport',
            Data: dataToSave,
            CreatedAt: Date.now(),
            UpdatedAt: Date.now()
          });
          toast({ title: 'Report Saved!', description: 'Your new research report has been saved to your Knowledge Base.' });
          router.push(`/intelligence/research/${reportId}`);
        } catch (error) {
          console.error('Failed to save report:', error);
          toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save report.' });
          setIsSaving(false);
        }
      };
      saveReport();
    } else if (state.message && state.message !== 'success') {
      toast({
        variant: 'destructive',
        title: 'Research Failed',
        description: state.message,
      })
    }
  }, [state, user?.id, router, lastTopic, isSaving]);


  const displayData = state.data;
  const displayTopic = (state as any).topic; // a bit of a hack to get topic from action state

  const handleDownload = () => {
    if (!displayData?.report) return;

    const blob = new Blob([displayData.report], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const topic = displayTopic || 'research';
    const fileName = `${topic.toLowerCase().replace(/\s+/g, '-')}-report.md`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: 'Report Downloaded', description: `Saved as ${fileName}` });
  };

  const handleShare = async () => {
    if (!displayData?.report) return;

    const shareData = {
      title: 'AI Research Report',
      text: displayData.report,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Sharing failed', error);
        toast({
          variant: 'destructive',
          title: 'Sharing Failed',
          description: 'Could not share the report.',
        });
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(displayData.report);
      toast({
        title: 'Sharing Not Available',
        description: 'Report content has been copied to your clipboard.',
      });
    }
  };

  const handleCreateContent = (path: string) => {
    if (displayData?.report) {
      sessionStorage.setItem('genkit-topic', `Summarize the following report:\n\n${displayData.report}`);
      router.push(path);
    }
  };

  return (
    <StandardPageLayout
      title="Research Agent"
      description="AI-powered deep-dive research with comprehensive reports and citations"
      spacing="default"
    >
      <StandardCard
        title={<span className="font-headline">New Research Task</span>}
        description="Enter a topic, and the AI agent will perform iterative web searches to compile a comprehensive report with citations."
      >
        <form
          action={(formData) => {
            const topic = formData.get('topic') as string;
            setLastTopic(topic);
            formAction(formData);
          }}
          className="space-y-4"
        >
          <StandardFormField
            label="Research Topic"
            id="topic"
            error={state.errors?.topic?.[0]}
            hint="Enter a topic for the AI agent to research. It will perform iterative web searches and compile a comprehensive report."
          >
            <Textarea
              id="topic"
              name="topic"
              placeholder="e.g., 'The impact of rising interest rates on the commercial real estate market in New York City'"
              rows={3}
            />
          </StandardFormField>
          <SubmitButton disabled={isUserLoading} />
          {state.message && state.message !== 'success' && (
            <p className="text-destructive mt-4">{state.message}</p>
          )}
        </form>
      </StandardCard>

      {/* AI Operation Progress */}
      {isPending && researchOperation.tracker && (
        <AIOperationProgress
          operationName="run-research-agent"
          tracker={researchOperation.tracker}
          title="Researching Your Topic"
          description="Our AI agent is conducting comprehensive research..."
        />
      )}

      <div className="space-y-6 pt-8">
        <div className="flex justify-between items-center">
          <h2 className="font-headline text-2xl font-bold">Recent Reports</h2>
          <Link href="/intelligence/research?tab=saved">
            <Button variant="ghost">View All</Button>
          </Link>
        </div>

        {/* Search Input */}
        {!isLoadingReports && savedReports && savedReports.length > 0 && (
          <div className="max-w-md">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              onClear={() => setSearchQuery('')}
              placeholder="Search recent reports..."
              aria-label="Search recent reports"
            />
          </div>
        )}

        {isLoadingReports && <StandardSkeleton variant="card" count={3} />}

        {/* No search results */}
        {!isLoadingReports && savedReports && savedReports.length > 0 && searchQuery && filteredReports.length === 0 && (
          <NoResultsEmptyState
            searchTerm={searchQuery}
            onClearSearch={() => setSearchQuery('')}
            icon={<Search className="w-8 h-8 text-muted-foreground" />}
          />
        )}

        {!isLoadingReports && filteredReports && filteredReports.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredReports.map(report => (
              <Link key={report.id} href={`/intelligence/research/${report.id}`} passHref>
                <Card className="h-full flex flex-col card-interactive">
                  <CardHeader>
                    <CardTitle
                      className="font-headline text-xl line-clamp-2"
                      dangerouslySetInnerHTML={{
                        __html: searchQuery
                          ? highlightMatches(report.topic || '', searchQuery)
                          : report.topic || ''
                      }}
                    />
                  </CardHeader>
                  <CardContent className="flex-grow" />
                  <CardFooter>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {!isLoadingReports && (!savedReports || savedReports.length === 0) && (
          <StandardEmptyState
            icon={<Library className="h-16 w-16 text-muted-foreground" />}
            title="Your Knowledge Base is Empty"
            description="You haven't saved any research reports yet. Use the form above to create your first one."
          />
        )}
      </div>

    </StandardPageLayout>
  );
}


'use client';

import { useActionState, useEffect, useTransition, useState, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { NoResultsEmptyState } from '@/components/ui/empty-states';
import { StandardEmptyState } from '@/components/standard/empty-state';
import { filterBySearch, highlightMatches } from '@/lib/utils/search-utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { runResearchAgentAction } from '@/app/actions';
import { Loader2, BrainCircuit, Library, Calendar, Search } from 'lucide-react';
import { type RunResearchAgentOutput } from '@/aws/bedrock/flows';
import { toast } from '@/hooks/use-toast';
import { useUser } from '@/aws/auth';
import { saveResearchReportAction } from '@/app/actions';
import type { ResearchReport } from '@/lib/types/common/common';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';


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
    <Button type="submit" variant={pending ? 'shimmer' : 'ai'} disabled={pending || disabled} className="w-full md:w-auto">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Researching...
        </>
      ) : (
        <>
          <BrainCircuit className="mr-2 h-4 w-4" />
          Start Research
        </>
      )}
    </Button>
  );
}

function ReportListSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardFooter>
            <Skeleton className="h-4 w-1/4" />
          </CardFooter>
        </Card>
      ))}
    </div>
  )
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

  useEffect(() => {
    if (state.message === 'success' && state.data && user?.id && !isSaving) {
      const reportData = state.data;
      const saveReport = async () => {
        setIsSaving(true);
        try {
          const result = await saveResearchReportAction(
            lastTopic || "Untitled Report",
            reportData.report
          );

          if (result.message === 'Report saved successfully') {
            toast({ title: 'Report Saved!', description: 'Your new research report has been saved to your Knowledge Base.' });
            router.push(`/knowledge-base/${result.data?.id}`);
          } else {
            throw new Error(result.errors?.[0] || 'Save failed');
          }
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
    <div className="animate-fade-in-up space-y-8">
      <Card>
        <CardHeader>
          <div className="mb-6">
            <h1 className="text-2xl font-bold font-headline">AI Research Agent</h1>
            <p className="text-muted-foreground">Delegate deep-dive research. Your AI agent will compile a comprehensive report that you can save to your knowledge base.</p>
          </div>
          <CardTitle className="font-headline">New Research Task</CardTitle>
          <CardDescription>
            Enter a topic, and the AI agent will perform iterative web searches to compile a comprehensive report with citations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={(formData) => {
              const topic = formData.get('topic') as string;
              setLastTopic(topic);
              formAction(formData);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="topic">Research Topic</Label>
              <Textarea
                id="topic"
                name="topic"
                placeholder="e.g., 'The impact of rising interest rates on the commercial real estate market in Seattle'"
                rows={3}
              />
              {state.errors?.topic && (
                <p className="text-sm text-destructive">{state.errors.topic[0]}</p>
              )}
            </div>
            <SubmitButton disabled={isUserLoading} />
            {state.message && state.message !== 'success' && (
              <p className="text-destructive mt-4">{state.message}</p>
            )}
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4 pt-8">
        <div className="flex justify-between items-center">
          <h2 className="font-headline text-2xl font-bold">Recent Reports</h2>
          <Link href="/knowledge-base">
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

        {isLoadingReports && <ReportListSkeleton />}

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
              <Link key={report.id} href={`/knowledge-base/${report.id}`} passHref>
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

    </div>
  );
}

'use client';

import { useActionState, useEffect, useState, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  ContentSection,
  DataGrid,
  ActionBar,
  LoadingSection,
  EmptySection,
  FeatureBanner
} from '@/components/ui';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Label } from '@/components/ui/label';
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
import { saveResearchReportAction } from '@/app/actions';
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
    <Button
      type="submit"
      variant="default"
      disabled={disabled || pending}
      className="w-full md:w-auto"
    >
      {pending ? 'Researching...' : 'Research This Topic'}
    </Button>
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
  const [lastTopic, setLastTopic] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch reports from API
  useEffect(() => {
    async function fetchReports() {
      if (!user) {
        setIsLoadingReports(false);
        return;
      }

      try {
        // TODO: Implement research-reports API route
        // For now, just set empty reports to prevent hanging
        setSavedReports([]);
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

  useEffect(() => {
    if (state.message === 'success' && state.data && user?.id && !isSaving) {
      const saveReport = async () => {
        setIsSaving(true);
        try {
          const result = await saveResearchReportAction(
            lastTopic || "Untitled Report",
            state.data?.report || ''
          );

          if (result.message === 'Report saved successfully') {
            toast({ title: 'Report Saved!', description: 'Your new research report has been saved to your Knowledge Base.' });
            router.push(`/research/reports/${result.data?.id}`);
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

  return (
    <div className="space-y-6">
      {/* Feature Banner with Tips */}
      <FeatureBanner
        title="💡 Research Agent Tips"
        description="Get the most out of your AI research assistant with these proven strategies"
        variant="tip"
        dismissible={true}
        tips={[
          "Ask specific questions like 'How are rising interest rates affecting Seattle condos?'",
          "Include location and property type for more targeted insights",
          "Use follow-up questions to dive deeper into trends and opportunities",
          "Save important reports to reference later in client conversations"
        ]}
        actions={
          <Button variant="outline" size="sm">
            View Examples
          </Button>
        }
      />

      <DataGrid columns={2}>
        {/* Research Form */}
        <ContentSection
          title="New Research Task"
          description="Enter your research topic and our AI agent will compile a comprehensive report"
          icon={Search}
          variant="card"
        >
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
                placeholder="e.g., How are rising interest rates affecting commercial real estate in NYC?"
                rows={3}
              />
              {state.errors?.topic?.[0] && (
                <p className="text-sm text-destructive">{state.errors.topic[0]}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Our AI agent will perform iterative web searches and compile findings into a detailed report.
              </p>
            </div>
            <ActionBar alignment="left">
              <SubmitButton disabled={isUserLoading} />
            </ActionBar>
            {state.message && state.message !== 'success' && (
              <p className="text-sm text-destructive mt-4">{state.message}</p>
            )}
          </form>
        </ContentSection>

        {/* Research Results / Recent Reports */}
        <ContentSection
          title="Recent Reports"
          description="Your saved research reports and findings"
          icon={Library}
          variant="card"
          actions={
            <ActionBar>
              <Link href="/research/reports">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </ActionBar>
          }
        >

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

          {/* Loading State */}
          {isLoadingReports && (
            <LoadingSection
              title="Loading your research reports..."
              description="Fetching your saved research and analysis"
              variant="default"
            />
          )}

          {/* Progress indicator for active research */}
          {isPending && (
            <LoadingSection
              title="Researching Your Topic"
              description="Our AI agent is conducting comprehensive research and compiling findings..."
              variant="default"
            />
          )}

          {/* No search results */}
          {!isLoadingReports && savedReports && savedReports.length > 0 && searchQuery && filteredReports.length === 0 && (
            <EmptySection
              title={`No reports found for "${searchQuery}"`}
              description="Try adjusting your search terms or browse all reports"
              icon={Search}
              action={{
                label: "Clear search",
                onClick: () => setSearchQuery(''),
                variant: "outline"
              }}
              variant="minimal"
            />
          )}

          {/* Reports Grid */}
          {!isLoadingReports && filteredReports && filteredReports.length > 0 && (
            <DataGrid columns={3}>
              {filteredReports.map(report => (
                <Link key={report.id} href={`/research/reports/${report.id}`} passHref>
                  <Card className="h-full flex flex-col hover:shadow-md transition-shadow cursor-pointer">
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
            </DataGrid>
          )}

          {/* Empty State */}
          {!isLoadingReports && (!savedReports || savedReports.length === 0) && (
            <EmptySection
              title="No Research Reports Yet"
              description="Ask your first question and get insights backed by real data"
              icon={Library}
              action={{
                label: "Start Research",
                onClick: () => {
                  const topicInput = document.getElementById('topic') as HTMLTextAreaElement;
                  if (topicInput) topicInput.focus();
                },
                variant: "ai"
              }}
              variant="minimal"
            />
          )}
        </ContentSection>
      </DataGrid>
    </div>
  );
}
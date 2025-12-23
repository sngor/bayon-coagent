'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
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
import { Loader2, BrainCircuit, Library, Calendar, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUser } from '@/aws/auth';
import type { ResearchReport } from '@/lib/types/common';
import type { RunResearchAgentOutput } from '@/aws/bedrock/flows';
import Link from 'next/link';
import { CardListSkeleton } from '@/components/ui/skeletons';
import { FeatureGate, UsageBadge } from '@/components/feature-gate';
import { useResearchAgent } from '@/hooks/use-research-agent';


interface ResearchFormData {
  topic: string;
}

interface ResearchState {
  message: string;
  data: (RunResearchAgentOutput & { reportId?: string }) | null;
  errors: Record<string, string[]>;
  isLoading: boolean;
}

function SubmitButton({ isLoading }: { isLoading: boolean }) {
  return (
    <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
      {isLoading ? (
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


export default function ResearchAgentPage() {
  const { state, submitResearch, isSubmitting } = useResearchAgent();
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

  // Form submission handler
  const handleResearchSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const topic = formData.get('topic') as string;
    await submitResearch(topic);
  };


  const displayData = state.data;

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold font-headline">AI Research Agent</h1>
              <UsageBadge feature="researchReports" />
            </div>
            <p className="text-muted-foreground">Delegate deep-dive research. Your AI agent will compile a comprehensive report that you can save to your knowledge base.</p>
          </div>
          <CardTitle className="font-headline">New Research Task</CardTitle>
          <CardDescription>
            Enter a topic, and the AI agent will perform iterative web searches to compile a comprehensive report with citations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FeatureGate feature="researchReports">
            <form onSubmit={handleResearchSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Research Topic</Label>
                <Textarea
                  id="topic"
                  name="topic"
                  placeholder="e.g., 'The impact of rising interest rates on the commercial real estate market in Seattle'"
                  rows={3}
                  required
                />
                {state.errors?.topic && (
                  <p className="text-sm text-destructive">{state.errors.topic[0]}</p>
                )}
              </div>
              <SubmitButton isLoading={isSubmitting || isUserLoading} />
              {state.message && state.message !== 'success' && (
                <p className="text-destructive mt-4">{state.message}</p>
              )}
            </form>
          </FeatureGate>
        </CardContent>
      </Card>

      <div className="space-y-4 pt-8">
        <div className="flex justify-between items-center">
          <h2 className="font-headline text-2xl font-bold">Recent Reports</h2>
          <Link href="/research/reports">
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

        {isLoadingReports && <CardListSkeleton count={3} />}

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
              <Link key={report.id} href={`/research/reports/${report.id}`} passHref>
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
            icon={Library}
            title="Your Knowledge Base is Empty"
            description="You haven't saved any research reports yet. Use the form above to create your first one."
          />
        )}
      </div>

    </div>
  );
}
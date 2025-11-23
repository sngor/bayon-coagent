'use client';

import { useActionState, useEffect, useState, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
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
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">New Research Task</CardTitle>
          <CardDescription>Ask any question about your market and get a research-backed answer in minutes.</CardDescription>
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
                placeholder="e.g., How are rising interest rates affecting commercial real estate in NYC?"
                rows={3}
              />
              {state.errors?.topic?.[0] && (
                <p className="text-sm text-destructive">{state.errors.topic[0]}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Enter a topic for the AI agent to research. It will perform iterative web searches and compile a comprehensive report.
              </p>
            </div>
            <SubmitButton disabled={isUserLoading} />
            {state.message && state.message !== 'success' && (
              <p className="text-sm text-destructive mt-4">{state.message}</p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Progress indicator */}
      {isPending && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <div>
                <p className="font-medium">Researching Your Topic</p>
                <p className="text-sm text-muted-foreground">Our AI agent is conducting comprehensive research...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
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

        {isLoadingReports && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No search results */}
        {!isLoadingReports && savedReports && savedReports.length > 0 && searchQuery && filteredReports.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Search className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No reports found for "{searchQuery}"</p>
                <Button variant="ghost" onClick={() => setSearchQuery('')} className="mt-2">
                  Clear search
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoadingReports && filteredReports && filteredReports.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
          </div>
        )}

        {!isLoadingReports && (!savedReports || savedReports.length === 0) && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Library className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-headline text-lg font-semibold mb-2">No Research Reports Yet</h3>
                <p className="text-muted-foreground">Ask your first question and get insights backed by real data.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
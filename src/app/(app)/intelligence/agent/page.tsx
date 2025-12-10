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
import { filterBySearch, highlightMatches } from '@/lib/utils/search-utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { runResearchAgentAction } from '@/app/actions';
import { Library, Calendar, Search, Sparkles, Save, RotateCcw, ExternalLink, FileText, Download, Database, BookOpen } from 'lucide-react';
import { type RunResearchAgentOutput } from '@/aws/bedrock/flows';
import { toast } from '@/hooks/use-toast';
import { useUser } from '@/aws/auth';
import { saveResearchReportAction } from '@/app/actions';
import { researchWithKnowledgeBaseAction } from '@/app/research-rag-actions';


interface ResearchReport {
  id: string;
  topic: string;
  createdAt: string;
}
import Link from 'next/link';
import { marked } from 'marked';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
      variant="ai"
      size="lg"
      disabled={disabled || pending}
      className="w-full md:w-auto"
    >
      {pending ? (
        <>
          <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
          Researching...
        </>
      ) : (
        <>
          <Search className="mr-2 h-4 w-4" />
          Start Research
        </>
      )}
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
  const [topicInput, setTopicInput] = useState<string>('');
  const [renderedReport, setRenderedReport] = useState<string>('');

  // RAG settings
  const [useKnowledgeBase, setUseKnowledgeBase] = useState(true);
  const [researchDepth, setResearchDepth] = useState<'quick' | 'standard' | 'comprehensive'>('standard');
  const [isResearchingWithRAG, setIsResearchingWithRAG] = useState(false);
  const [ragResult, setRagResult] = useState<any>(null);

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
    // Show toast for research completion or failure
    if (state.message === 'success' && state.data) {
      toast({
        title: 'Research Complete!',
        description: 'Your research report is ready.',
      });

      // Render markdown
      if (state.data?.report) {
        const renderMarkdown = async () => {
          const html = await marked.parse(state.data!.report);
          setRenderedReport(html);
        };
        renderMarkdown();
      }
    } else if (state.message && state.message !== 'success') {
      toast({
        variant: 'destructive',
        title: 'Research Failed',
        description: state.message,
      });
    }
  }, [state.message, state.data]);

  const handleSaveReport = async () => {
    console.log('Save attempt - User:', user?.id, 'Loading:', isUserLoading);

    if (!user?.id || isUserLoading) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please refresh the page and try again, or download the report instead.',
      });
      return;
    }

    if (!state.data?.report) {
      toast({
        variant: 'destructive',
        title: 'No Report',
        description: 'There is no report to save.',
      });
      return;
    }

    setIsSaving(true);
    try {
      console.log('Calling saveResearchReportAction...');
      const result = await saveResearchReportAction(
        lastTopic || "Untitled Report",
        state.data.report
      );
      console.log('Save result:', result);

      if (result.message === 'Report saved successfully') {
        toast({
          title: 'Report Saved!',
          description: 'Redirecting to your saved report...',
        });
        router.push(`/research/reports/${result.data?.id}`);
      } else {
        const errorMsg = result.errors?.[0] || result.message || 'Save failed';
        console.error('Save failed:', errorMsg);
        toast({
          variant: 'destructive',
          title: 'Save Failed',
          description: errorMsg + ' - Try downloading instead.',
        });
        setIsSaving(false);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Could not save report.';
      console.error('Save error:', error);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: errorMsg + ' - Try downloading instead.',
      });
      setIsSaving(false);
    }
  };

  const handleDownloadReport = () => {
    if (!state.data?.report) return;

    const blob = new Blob([state.data.report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lastTopic || 'research-report'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Report Downloaded',
      description: 'Your research report has been saved to your downloads.',
    });
  };

  const handleResearchWithRAG = async (topic: string) => {
    if (!topic.trim()) {
      toast({
        variant: 'destructive',
        title: 'Topic Required',
        description: 'Please enter a research topic.',
      });
      return;
    }

    setIsResearchingWithRAG(true);
    setLastTopic(topic);
    setRagResult(null);

    try {
      const result = await researchWithKnowledgeBaseAction(topic, {
        researchDepth,
        outputFormat: 'report',
        useKnowledgeBase,
        topK: researchDepth === 'comprehensive' ? 10 : researchDepth === 'standard' ? 5 : 3,
      });

      if (result.success && result.data) {
        setRagResult(result.data);

        // Render markdown
        const html = await marked.parse(result.data.answer);
        setRenderedReport(html);

        toast({
          title: 'Research Complete!',
          description: useKnowledgeBase && result.data.documentsRetrieved > 0
            ? `Used ${result.data.documentsRetrieved} documents from your knowledge base`
            : 'Research completed successfully',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Research Failed',
          description: result.error || 'Failed to complete research',
        });
      }
    } catch (error) {
      console.error('Research error:', error);
      toast({
        variant: 'destructive',
        title: 'Research Failed',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsResearchingWithRAG(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feature Banner with Tips */}
      <FeatureBanner
        title="Research Agent Tips"
        description="Get the most out of your AI research assistant with these proven strategies"
        variant="tip"
        dismissible={true}
        tips={[
          "Ask specific questions like 'How are rising interest rates affecting Seattle condos?'",
          "Include location and property type for more targeted insights",
          "Use follow-up questions to dive deeper into trends and opportunities",
          "Save important reports to reference later in client conversations"
        ]}
      />

      {/* Research Results Display */}
      {(ragResult || (state.message === 'success' && state.data?.report)) && (
        <div className="space-y-4">
          {/* Report Header */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1">
                      <Sparkles className="h-3 w-3" />
                      AI Research
                    </Badge>
                    {ragResult && (
                      <>
                        <Badge variant="outline">
                          {ragResult.sources?.length || 0} Sources
                        </Badge>
                        {ragResult.knowledgeBaseUsed && (
                          <Badge variant="default" className="gap-1">
                            <Database className="h-3 w-3" />
                            {ragResult.documentsRetrieved} KB Docs
                          </Badge>
                        )}
                      </>
                    )}
                    {!ragResult && state.data?.citations && (
                      <Badge variant="outline">
                        {state.data.citations.length} Sources
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-2xl font-headline font-bold">{lastTopic || "Research Report"}</h2>
                  <p className="text-sm text-muted-foreground">
                    Generated {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveReport} disabled={isSaving} size="sm">
                    <Save className="mr-2 h-4 w-4" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownloadReport}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    setTopicInput('');
                    setRagResult(null);
                    window.location.reload();
                  }}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    New
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Report Content */}
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-headline prose-headings:font-bold prose-a:text-primary">
                <div dangerouslySetInnerHTML={{ __html: renderedReport }} />
              </div>
            </CardContent>
          </Card>

          {/* Sources Section */}
          {ragResult?.sources && ragResult.sources.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Sources & References
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {ragResult.sources.map((source: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-3 rounded-lg border"
                    >
                      {source.type === 'knowledge-base' ? (
                        <BookOpen className="h-4 w-4 text-primary" />
                      ) : (
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{source.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {source.type === 'knowledge-base' ? 'Your KB' : 'Web'}
                          </Badge>
                          {source.relevance && (
                            <Badge variant={source.relevance === 'high' ? 'default' : 'secondary'} className="text-xs">
                              {source.relevance}
                            </Badge>
                          )}
                        </div>
                        {source.url && (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground hover:text-primary truncate block"
                          >
                            {source.url}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!ragResult && state.data?.citations && state.data.citations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Sources & References
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {state.data.citations.map((citation: string, idx: number) => (
                    <a
                      key={idx}
                      href={citation}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors group"
                    >
                      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                      <span className="text-sm flex-1 truncate group-hover:text-primary">{citation}</span>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <DataGrid columns={(ragResult || (state.message === 'success' && state.data?.report)) ? 1 : 2}>
        {/* Research Form */}
        {!ragResult && (!state.message || state.message !== 'success' || !state.data?.report) && (
          <ContentSection
            title="Research Topic"
            description="Ask any question and get comprehensive, source-backed insights"
            icon={Search}
            variant="card"

          >
            <div className="space-y-6">
              {/* RAG Settings */}
              <div className="space-y-4 p-4 rounded-lg border bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="use-kb" className="text-sm font-medium flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Use Knowledge Base
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Include your uploaded documents in research
                    </p>
                  </div>
                  <Switch
                    id="use-kb"
                    checked={useKnowledgeBase}
                    onCheckedChange={setUseKnowledgeBase}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="depth" className="text-sm font-medium">
                    Research Depth
                  </Label>
                  <Select value={researchDepth} onValueChange={(v: any) => setResearchDepth(v)}>
                    <SelectTrigger id="depth">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quick">Quick (3 docs, ~30s)</SelectItem>
                      <SelectItem value="standard">Standard (5 docs, ~1min)</SelectItem>
                      <SelectItem value="comprehensive">Comprehensive (10 docs, ~2min)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Research Form */}
              <div className="space-y-3">
                <Label htmlFor="topic" className="text-base font-semibold">
                  What would you like to research?
                </Label>
                <Textarea
                  id="topic"
                  name="topic"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  placeholder="e.g., How are rising interest rates affecting commercial real estate in NYC?"
                  rows={4}
                  disabled={isResearchingWithRAG}
                  className="resize-none text-base"
                />
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>
                    {useKnowledgeBase
                      ? 'AI will search your knowledge base and the web, then compile a comprehensive report with citations.'
                      : 'AI will search the web, analyze multiple sources, and compile a comprehensive report with citations.'}
                  </p>
                </div>
              </div>

              <ActionBar alignment="left">
                <Button
                  onClick={() => handleResearchWithRAG(topicInput)}
                  disabled={isUserLoading || isResearchingWithRAG || !topicInput.trim()}
                  variant="ai"
                  size="lg"
                  className="w-full md:w-auto"
                >
                  {isResearchingWithRAG ? (
                    <>
                      <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                      Researching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Start Research
                    </>
                  )}
                </Button>
              </ActionBar>
            </div>
          </ContentSection>
        )}

        {/* Research Results / Recent Reports */}
        {!ragResult && (!state.message || state.message !== 'success' || !state.data?.report) && (
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
            {(isPending || isResearchingWithRAG) && (
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <div className="relative">
                      <Sparkles className="h-12 w-12 text-primary animate-pulse" />
                      <div className="absolute inset-0 animate-ping">
                        <Sparkles className="h-12 w-12 text-primary opacity-20" />
                      </div>
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-lg font-semibold">Researching Your Topic</h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        Searching the web, analyzing sources, and compiling your comprehensive report...
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 max-w-md">
                      {useKnowledgeBase && (
                        <Badge variant="outline" className="animate-pulse">
                          <Database className="h-3 w-3 mr-1" />
                          Searching KB
                        </Badge>
                      )}
                      <Badge variant="outline" className="animate-pulse animation-delay-200">Analyzing data</Badge>
                      <Badge variant="outline" className="animate-pulse animation-delay-400">Compiling report</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                variant="minimal"
              />
            )}
          </ContentSection>
        )}
      </DataGrid>
    </div>
  );
}
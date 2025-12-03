
'use client';

import { useMemo, useState, useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  LabelList,
} from 'recharts';
import { StandardPageLayout, StandardErrorDisplay } from '@/components/standard';
import { StandardFormActions } from '@/components/standard/form-actions';
import { StandardLoadingSpinner } from '@/components/standard/loading-spinner';
import { StandardCard } from '@/components/standard/card';
import { StandardFormField } from '@/components/standard/form-field';
import { StandardEmptyState } from '@/components/standard/empty-state';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ResponsiveTableWrapper } from '@/components/ui/responsive-table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/common';
import { Star, PlusCircle, Search } from 'lucide-react';
import type { Competitor, KeywordRanking, Profile, Review, AIVisibilityScore, AIMention } from '@/lib/types/common/common';
import { useUser } from '@/aws/auth';
import { useItem, useQuery } from '@/aws/dynamodb/hooks';
import { CompetitorForm } from '@/components/competitor-form';
import { findCompetitorsAction, getKeywordRankingsAction, saveCompetitorAction } from '@/app/actions';
import { toast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { FavoritesButton } from '@/components/favorites-button';
import { getPageConfig } from '@/components/dashboard-quick-actions';
import {
  AnimatedTabs as Tabs,
  AnimatedTabsContent as TabsContent,
  AnimatedTabsList as TabsList,
  AnimatedTabsTrigger as TabsTrigger,
} from '@/components/ui/animated-tabs';
import { AIVisibilityDashboard } from '@/components/ai-visibility-dashboard';
import { AIMentionsList } from '@/components/ai-mentions-list';
import { AIVisibilityTrends } from '@/components/ai-visibility-trends';
import { CompetitorAIComparison } from '@/components/competitor-ai-comparison';
import { AIContextAnalysis } from '@/components/ai-context-analysis';

// Chart configuration for review volume visualization
const chartConfig = {
  reviewCount: {
    label: 'Reviews',
  },
  you: {
    label: 'You',
    color: 'hsl(var(--chart-1))',
  },
  competitor: {
    label: 'Competitor',
    color: 'hsl(var(--muted))',
  },
};

type CompetitorSuggestion = {
  name: string;
  agency: string;
  reviewCount: number;
  avgRating: number;
  socialFollowers: number;
  domainAuthority: number;
}

type FindCompetitorsState = {
  message: string;
  data: CompetitorSuggestion[];
  errors: any;
};

const initialFindCompetitorsState: FindCompetitorsState = {
  message: '',
  data: [],
  errors: {},
};


type KeywordRankingsState = {
  message: string;
  data: KeywordRanking[] | null;
  errors: any;
}

const initialKeywordRankingsState: KeywordRankingsState = {
  message: '',
  data: null,
  errors: {}
}


function FindButton({ disabled, children }: React.ComponentProps<typeof Button> & { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <StandardFormActions
      primaryAction={{
        label: children as string || 'Auto-Find Competitors',
        type: 'submit',
        variant: 'ai',
        loading: pending,
        disabled: disabled,
      }}
      alignment="left"
    />
  )
}

function TrackRankingsButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <StandardFormActions
      primaryAction={{
        label: 'Analyze Keyword',
        type: 'submit',
        variant: 'ai',
        loading: pending,
        disabled: disabled,
      }}
      alignment="left"
    />
  )
}


export default function CompetitiveAnalysisPage() {
  const { user, isUserLoading } = useUser();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);

  const [findState, findFormAction] = useActionState(findCompetitorsAction, initialFindCompetitorsState);
  const [rankingState, rankingFormAction] = useActionState(getKeywordRankingsAction, initialKeywordRankingsState);

  // Memoize DynamoDB keys
  const profilePK = useMemo(() => user ? `USER#${user.id}` : null, [user]);
  const profileSK = useMemo(() => 'PROFILE', []);
  const competitorsPK = useMemo(() => user ? `USER#${user.id}` : null, [user]);
  const competitorsSKPrefix = useMemo(() => 'COMPETITOR#', []);

  const { data: agentProfileData, isLoading: isProfileLoading } = useItem<Profile>(profilePK, profileSK);
  const { data: competitorsData, isLoading: areCompetitorsLoading } = useQuery<Competitor>(competitorsPK, competitorsSKPrefix);


  const yourData = useMemo(() => {
    if (!agentProfileData || !user) return null;

    return {
      id: user.id,
      name: agentProfileData.name || 'You',
      agency: agentProfileData.agencyName || 'Your Agency',
      reviewCount: (agentProfileData as any).reviewCount || 0,
      avgRating: (agentProfileData as any).avgRating || 0,
      socialFollowers: (agentProfileData as any).socialFollowers || 0,
      domainAuthority: (agentProfileData as any).domainAuthority || 0,
      isYou: true,
    };
  }, [agentProfileData, user]);

  const allCompetitors = useMemo(() => {
    const others = competitorsData || [];
    return yourData ? [yourData, ...others] : others;
  }, [yourData, competitorsData]);


  const topCompetitor = useMemo(() => {
    const filtered = allCompetitors.filter(c => !c.isYou);
    return filtered.length > 0 ? filtered.sort((a, b) => b.reviewCount - a.reviewCount)[0] : null;
  }, [allCompetitors]);

  const chartData = useMemo(() => {
    return allCompetitors.map(c => ({
      name: c.name.split(' ')[0],
      reviewCount: c.reviewCount,
      fill: c.isYou ? 'hsl(var(--chart-1))' : 'hsl(var(--muted))',
    })).sort((a, b) => b.reviewCount - a.reviewCount);
  }, [allCompetitors]);

  const handleEdit = (competitor: Competitor) => {
    setSelectedCompetitor(competitor);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedCompetitor(null);
    setIsFormOpen(true);
  };

  const handleAddSuggestion = async (suggestion: CompetitorSuggestion) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please log in to add competitors.'
      });
      return;
    }

    try {
      const result = await saveCompetitorAction(
        suggestion.name,
        '', // website - not provided in suggestion
        `${suggestion.agency} - ${suggestion.reviewCount} reviews, ${suggestion.avgRating.toFixed(1)} avg rating` // description
      );

      if (result.message === 'Competitor saved successfully') {
        toast({
          title: "Competitor Added",
          description: `${suggestion.name} is now being tracked.`
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to Add',
          description: result.message || result.errors?.[0] || 'Could not add competitor.'
        });
      }
    } catch (error) {
      console.error('Failed to add competitor:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Add',
        description: error instanceof Error ? error.message : 'Could not add competitor.'
      });
    }
  }

  useEffect(() => {
    if (findState.message && findState.message !== 'success') {
      toast({
        variant: 'destructive',
        title: 'Search Failed',
        description: findState.message,
      });
    }
  }, [findState]);

  useEffect(() => {
    if (rankingState.message && rankingState.message !== 'success') {
      toast({
        variant: 'destructive',
        title: 'Ranking Failed',
        description: rankingState.message,
      });
    }
  }, [rankingState]);

  const isRankingDisabled = isUserLoading || isProfileLoading || !agentProfileData?.address;
  const isLoadingTable = areCompetitorsLoading || isProfileLoading;

  // Mock data for AI Visibility - in production, this would come from server actions
  const [aiVisibilityScore, setAiVisibilityScore] = useState<AIVisibilityScore | null>(null);
  const [aiMentions, setAiMentions] = useState<AIMention[]>([]);
  const [aiScores, setAiScores] = useState<AIVisibilityScore[]>([]);
  const [competitorAiScores, setCompetitorAiScores] = useState<Array<{
    userId: string;
    name: string;
    score: AIVisibilityScore;
  }>>([]);
  const [isLoadingAiData, setIsLoadingAiData] = useState(false);

  // Load AI visibility data
  useEffect(() => {
    // TODO: Replace with actual server action calls
    // For now, we'll show empty states
    setIsLoadingAiData(false);
  }, [user]);

  const handleRefreshAiData = async () => {
    if (!user) return;
    setIsLoadingAiData(true);
    try {
      // TODO: Call triggerManualMonitoring server action
      toast({
        title: 'Refresh Started',
        description: 'AI visibility data is being updated. This may take a few minutes.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Refresh Failed',
        description: error instanceof Error ? error.message : 'Failed to refresh AI visibility data',
      });
    } finally {
      setIsLoadingAiData(false);
    }
  };

  const handleExportAiData = async () => {
    if (!user) return;
    try {
      // TODO: Call exportAIVisibilityReport server action
      toast({
        title: 'Export Started',
        description: 'Your AI visibility report is being generated.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to export AI visibility data',
      });
    }
  };

  return (
    <div className="space-y-8">
      <Tabs defaultValue="competitors" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="competitors">Competitor Analysis</TabsTrigger>
          <TabsTrigger value="ai-visibility">AI Visibility</TabsTrigger>
        </TabsList>

        <TabsContent value="competitors" className="space-y-8 mt-6">
          <div className="space-y-8">
            <StandardCard
              title={
                <div className="flex items-center justify-between w-full">
                  <span className="font-headline">AI Competitor Discovery</span>
                  {(() => {
                    const pageConfig = getPageConfig('/brand/competitors');
                    return pageConfig ? <FavoritesButton item={pageConfig} /> : null;
                  })()}
                </div>
              }
              description="Use AI to automatically discover top competitors in your market based on your profile."
            >
              <form action={findFormAction} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <StandardFormField
                    label="Your Agent Name"
                    id="name"
                    hint="Enter your full name"
                    error={(findState.errors as any)?.name?.[0]}
                  >
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g., John Smith"
                      defaultValue={agentProfileData?.name || ''}
                      required
                    />
                  </StandardFormField>
                  <StandardFormField
                    label="Your Agency Name"
                    id="agencyName"
                    hint="Enter your agency or brokerage name"
                    error={(findState.errors as any)?.agencyName?.[0]}
                  >
                    <Input
                      type="text"
                      id="agencyName"
                      name="agencyName"
                      placeholder="e.g., Seattle Homes Realty"
                      defaultValue={agentProfileData?.agencyName || ''}
                      required
                    />
                  </StandardFormField>
                </div>
                <StandardFormField
                  label="Your Location"
                  id="address"
                  hint="Enter your city and state (e.g., Seattle, WA)"
                  error={(findState.errors as any)?.address?.[0]}
                >
                  <Input
                    id="address"
                    name="address"
                    placeholder="e.g., Seattle, WA"
                    defaultValue={agentProfileData?.address || ''}
                    required
                  />
                </StandardFormField>
                <FindButton disabled={isUserLoading}>Auto-Find Competitors</FindButton>
              </form>
              {findState.data && findState.data.length > 0 && (
                <div className="mt-6">
                  <Separator />
                  <h3 className="text-lg font-medium font-headline my-4">AI Suggestions</h3>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {findState.data.map((suggestion, index) => (
                      <Card key={index} className="card-interactive">
                        <CardHeader>
                          <CardTitle className="text-base">{suggestion.name}</CardTitle>
                          <CardDescription>{suggestion.agency}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm"><strong>Reviews:</strong> {suggestion.reviewCount}</p>
                          <p className="text-sm"><strong>Avg. Rating:</strong> {suggestion.avgRating.toFixed(1)}</p>
                          <p className="text-sm"><strong>Followers:</strong> {(suggestion.socialFollowers / 1000).toFixed(1)}k</p>
                          <p className="text-sm"><strong>Domain Authority:</strong> {suggestion.domainAuthority}</p>
                          <Button size="sm" variant="outline" onClick={() => handleAddSuggestion(suggestion)} className="mt-2">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add to Tracker
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              {findState.message && findState.message !== 'success' && (
                <StandardErrorDisplay
                  title="Discovery Failed"
                  message={findState.message}
                  variant="error"
                  className="mt-4"
                />
              )}
            </StandardCard>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-3">
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="font-headline">
                      Market Snapshot: At a Glance
                    </CardTitle>
                    <CardDescription>
                      Direct comparison of key performance indicators. Click a competitor to edit.
                    </CardDescription>
                  </div>
                  <Button onClick={handleAddNew} className="w-full sm:w-auto flex-shrink-0">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Competitor
                  </Button>
                </CardHeader>
                <CardContent>
                  <ResponsiveTableWrapper mobileLayout="scroll" showScrollIndicator={true}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[150px]">Agent</TableHead>
                          <TableHead className="text-center whitespace-nowrap">Reviews</TableHead>
                          <TableHead className="text-center whitespace-nowrap">Avg. Rating</TableHead>
                          <TableHead className="text-center whitespace-nowrap">Social Followers</TableHead>
                          <TableHead className="text-center whitespace-nowrap">Domain Authority</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingTable ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                              <StandardLoadingSpinner size="md" message="Loading competitors..." />
                            </TableCell>
                          </TableRow>
                        ) : allCompetitors.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                              <StandardEmptyState
                                icon={<Search className="h-16 w-16 text-muted-foreground" />}
                                title="No Competitors Yet"
                                description="Add competitors manually or use AI discovery to find top agents in your market."
                                action={{
                                  label: "Add Competitor",
                                  onClick: handleAddNew,
                                  variant: "default"
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ) : (
                          allCompetitors.map((competitor) => (
                            <TableRow
                              key={competitor.id}
                              onClick={() => !competitor.isYou && handleEdit(competitor)}
                              className={cn(
                                competitor.isYou ? 'bg-secondary/70' : 'cursor-pointer hover:bg-secondary transition-colors'
                              )}
                            >
                              <TableCell>
                                <div className="font-medium whitespace-nowrap">{competitor.name}</div>
                                <div className="text-sm text-muted-foreground whitespace-nowrap">
                                  {competitor.agency}
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-semibold">
                                {competitor.reviewCount}
                              </TableCell>
                              <TableCell className="text-center font-semibold">
                                <div className="flex items-center justify-center gap-1">
                                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                  {competitor.avgRating.toFixed(1)}
                                </div>
                              </TableCell>
                              <TableCell className="text-center font-semibold">
                                {(competitor.socialFollowers / 1000).toFixed(1)}k
                              </TableCell>
                              <TableCell className="text-center font-semibold">
                                {competitor.domainAuthority}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ResponsiveTableWrapper>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="font-headline">Review Volume</CardTitle>
                  <CardDescription>
                    Total number of reviews across major platforms.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="max-h-[300px]">
                    <BarChart
                      accessibilityLayer
                      data={chartData}
                      layout="vertical"
                      margin={{ left: 10, right: 30 }}
                    >
                      <CartesianGrid horizontal={false} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        className="text-xs"
                      />
                      <XAxis dataKey="reviewCount" type="number" hide />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Bar
                        dataKey="reviewCount"
                        radius={5}
                        background={{ fill: 'hsl(var(--border))', radius: 5 }}
                      >
                        <LabelList
                          position="right"
                          offset={10}
                          className="fill-foreground"
                          fontSize={12}
                        />
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="font-headline">Local Keyword Rankings</CardTitle>
                  <CardDescription>
                    Discover the top 5 agents for a specific local search term.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" action={rankingFormAction}>
                    <StandardFormField
                      label="Keyword to Analyze"
                      id="keyword"
                      error={(rankingState.errors as any)?.keyword?.[0]}
                      hint="Enter a local search term to analyze"
                    >
                      <Input id="keyword" name="keyword" placeholder="e.g., best real estate agent Seattle" />
                    </StandardFormField>
                    <input type="hidden" name="location" value={agentProfileData?.address || ''} />
                    <TrackRankingsButton disabled={isRankingDisabled} />
                    {rankingState.message && rankingState.message !== 'success' && (
                      <StandardErrorDisplay
                        title="Ranking Analysis Failed"
                        message={rankingState.message}
                        variant="error"
                        className="mt-2"
                      />
                    )}
                  </form>

                  {rankingState.data && rankingState.data.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-headline font-medium mb-2">Top 5 Results for "{rankingState.data[0].keyword || 'your keyword'}"</h3>
                      <ResponsiveTableWrapper mobileLayout="scroll" showScrollIndicator={true}>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-center whitespace-nowrap">Rank</TableHead>
                              <TableHead className="min-w-[120px]">Agent</TableHead>
                              <TableHead className="min-w-[120px]">Agency</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rankingState.data.map((ranking) => (
                              <TableRow key={ranking.rank}>
                                <TableCell className="text-center font-bold">#{ranking.rank}</TableCell>
                                <TableCell className="font-medium whitespace-nowrap">{ranking.agentName}</TableCell>
                                <TableCell className="text-muted-foreground whitespace-nowrap">{ranking.agencyName}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ResponsiveTableWrapper>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ai-visibility" className="space-y-8 mt-6">
          {isLoadingAiData ? (
            <div className="flex items-center justify-center py-12">
              <StandardLoadingSpinner size="lg" message="Loading AI visibility data..." />
            </div>
          ) : (
            <div className="space-y-8">
              {/* AI Visibility Dashboard */}
              <AIVisibilityDashboard
                userId={user?.id || ''}
                score={aiVisibilityScore}
                recentMentions={aiMentions.slice(0, 5)}
                onRefresh={handleRefreshAiData}
                onExport={handleExportAiData}
              />

              {/* AI Mentions List */}
              <AIMentionsList
                userId={user?.id || ''}
                mentions={aiMentions}
              />

              {/* AI Visibility Trends */}
              <AIVisibilityTrends
                userId={user?.id || ''}
                scores={aiScores}
                mentions={aiMentions}
                timeRange="30d"
              />

              {/* Competitor AI Comparison */}
              <CompetitorAIComparison
                userId={user?.id || ''}
                userScore={aiVisibilityScore}
                competitorScores={competitorAiScores}
              />

              {/* AI Context Analysis */}
              <AIContextAnalysis
                userId={user?.id || ''}
                mentions={aiMentions}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CompetitorForm
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
        competitor={selectedCompetitor}
      />
    </div>
  );
}

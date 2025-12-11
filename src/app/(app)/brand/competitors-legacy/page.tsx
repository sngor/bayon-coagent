
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
import { ArrowUp, ArrowDown, Minus, Star, PlusCircle, Sparkles, Loader2, Search } from 'lucide-react';
import type { Review } from '@/lib/types/common/common';
import type { KeywordRanking, Profile, Competitor } from '@/lib/types/common';
import { useUser } from '@/aws/auth';
import { useItem, useQuery } from '@/aws/dynamodb/hooks';
import { getProfileKeys } from '@/aws/dynamodb/keys';
import { CompetitorForm } from '@/components/competitor-form';
import { findCompetitorsAction, getKeywordRankingsAction, saveCompetitorAction } from '@/app/actions';
import { toast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Type for competitor suggestions from AI flow
type CompetitorSuggestion = {
  name: string;
  agency: string;
  reviewCount: number;
  avgRating: number;
  socialFollowers: number;
  domainAuthority: number;
};

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


function FindButton({ disabled, children, ...props }: React.ComponentProps<typeof Button> & { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={pending ? 'shimmer' : 'ai'} disabled={pending || disabled} {...props}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
      {pending ? 'Searching...' : children}
    </Button>
  )
}

function TrackRankingsButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={pending ? 'shimmer' : 'ai'} disabled={pending || disabled}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
      {pending ? 'Analyzing...' : 'Analyze Keyword'}
    </Button>
  )
}


export default function CompetitiveAnalysisPage() {
  const { user, isUserLoading } = useUser();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);

  const [findState, findFormAction] = useActionState(findCompetitorsAction, initialFindCompetitorsState);
  const [rankingState, rankingFormAction] = useActionState(
    (state: any, payload: FormData) => getKeywordRankingsAction(state, payload),
    initialKeywordRankingsState
  );

  // Memoize DynamoDB keys
  const profilePK = useMemo(() => user ? `USER#${user.id}` : null, [user]);
  const profileSK = useMemo(() => 'PROFILE', []);
  const competitorsPK = useMemo(() => user ? `USER#${user.id}` : null, [user]);
  const competitorsSKPrefix = useMemo(() => 'COMPETITOR#', []);

  const { data: agentProfileData, isLoading: isProfileLoading } = useItem<Profile>(profilePK, profileSK);
  const { data: competitorsData, isLoading: areCompetitorsLoading } = useQuery<Competitor>(competitorsPK, competitorsSKPrefix);

  // For now, we'll use empty reviews array since reviews are stored per competitor
  const allReviews: Review[] = [];
  const areReviewsLoading = false;


  const yourData = useMemo(() => {
    if (!agentProfileData || !user) return null;

    return {
      id: user.id,
      name: agentProfileData.name || 'You',
      agency: agentProfileData.agencyName || 'Your Agency',
      reviewCount: 0, // Profile doesn't have reviewCount, would need to be fetched separately
      avgRating: 0, // Profile doesn't have avgRating, would need to be calculated
      socialFollowers: 0, // Profile doesn't have socialFollowers, would need to be fetched
      domainAuthority: 0, // Profile doesn't have domainAuthority, would need to be calculated
      isYou: true,
    };
  }, [agentProfileData, user]);

  const allCompetitors = useMemo(() => {
    const others = competitorsData || [];
    return yourData ? [yourData, ...others] : others;
  }, [yourData, competitorsData]);


  const topCompetitor = useMemo(() => {
    return allCompetitors
      .filter(c => !c.isYou)
      .sort((a, b) => b.reviewCount - a.reviewCount)[0];
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
    if (!user) return;
    try {
      const result = await saveCompetitorAction(
        suggestion.name,
        '', // website not provided by AI flow
        suggestion.agency // use agency as description
      );

      if (result.message === 'Competitor saved successfully') {
        toast({
          title: "Competitor Added",
          description: `${suggestion.name} is now being tracked.`
        });
      } else {
        throw new Error(result.errors?.[0] || 'Save failed');
      }
    } catch (error) {
      console.error('Failed to add competitor:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Add',
        description: 'Could not add competitor.'
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

  const isFindDisabled = isUserLoading || isProfileLoading || !agentProfileData?.name || !agentProfileData?.agencyName || !agentProfileData?.address;
  const isRankingDisabled = isUserLoading || isProfileLoading || !agentProfileData?.address;
  const isLoadingTable = areCompetitorsLoading || isProfileLoading || areReviewsLoading;

  return (
    <div className="space-y-8 fade-in">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-headline">Competitive Analysis</h1>
              <p className="text-muted-foreground">Track and compare your market position against your top competitors.</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">AI Competitor Discovery</CardTitle>
          <CardDescription>
            Use AI to automatically discover top competitors in your market based on your profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={findFormAction} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Agent Name</Label>
                <Input id="name" name="name" placeholder="e.g., John Smith" value={agentProfileData?.name || ''} readOnly className="bg-secondary" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agencyName">Your Agency Name</Label>
                <Input id="agencyName" name="agencyName" placeholder="e.g., Seattle Homes Realty" value={agentProfileData?.agencyName || ''} readOnly className="bg-secondary" />
              </div>
            </div>
            <input type="hidden" name="address" value={agentProfileData?.address || ''} />
            <FindButton disabled={isFindDisabled}>Auto-Find Competitors</FindButton>
          </form>
          {findState.data && findState.data.length > 0 && (
            <div className="mt-6">
              <Separator />
              <h3 className="text-lg font-medium font-headline my-4">AI Suggestions</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {findState.data.map((suggestion, index) => (
                  <Card key={index} className="card-interactive">
                    <CardHeader>
                      <CardTitle className="text-base">{suggestion.name}</CardTitle>
                      <CardDescription>{suggestion.agency}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
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
            <p className="text-sm text-destructive mt-4">{findState.message}</p>
          )}
        </CardContent>
      </Card>


      <div className="grid gap-8 lg:grid-cols-3">
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
                      <TableCell colSpan={5} className="text-center">Loading competitors...</TableCell>
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
                animationDuration={500}
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
              <div className="space-y-2">
                <Label htmlFor="keyword">Keyword to Analyze</Label>
                <Input id="keyword" name="keyword" placeholder="e.g., best real estate agent Seattle" />
                {(rankingState.errors as any)?.keyword && <p className="text-sm text-destructive">{(rankingState.errors as any).keyword[0]}</p>}
              </div>
              <input type="hidden" name="location" value={agentProfileData?.address || ''} />
              <TrackRankingsButton disabled={isRankingDisabled} />
              {rankingState.message && rankingState.message !== 'success' && <p className="text-sm text-destructive mt-2">{rankingState.message}</p>}
            </form>

            {rankingState.data && (
              <div className="mt-6">
                <h3 className="font-headline font-medium mb-2">Top 5 Results for "{rankingState.data[0]?.keyword || 'your keyword'}"</h3>
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
      <CompetitorForm
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
        competitor={selectedCompetitor}
      />
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  Target,
  Users,
  Eye,
  Zap,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  Minus,
  Download,
  RefreshCw,
} from 'lucide-react';

import type {
  AIVisibilityTrends,
  AnalyticsTimeRange,
  PlatformPerformance,
  AutomatedInsight,
  PerformanceCorrelation,
  BusinessOutcomeMetrics,
} from '@/lib/ai-visibility/services/analytics-service';

/**
 * Props for the Analytics Dashboard component
 */
interface AnalyticsDashboardProps {
  userId: string;
  onExportReport?: () => void;
  onRefreshData?: () => void;
}

/**
 * Time range selector component
 */
function TimeRangeSelector({ 
  value, 
  onChange 
}: { 
  value: AnalyticsTimeRange; 
  onChange: (value: AnalyticsTimeRange) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="7d">Last 7 days</SelectItem>
        <SelectItem value="30d">Last 30 days</SelectItem>
        <SelectItem value="90d">Last 90 days</SelectItem>
        <SelectItem value="180d">Last 6 months</SelectItem>
        <SelectItem value="1y">Last year</SelectItem>
      </SelectContent>
    </Select>
  );
}

/**
 * Trend indicator component
 */
function TrendIndicator({ 
  direction, 
  percentage, 
  significance 
}: { 
  direction: 'up' | 'down' | 'stable';
  percentage: number;
  significance: 'high' | 'medium' | 'low';
}) {
  const getIcon = () => {
    switch (direction) {
      case 'up':
        return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <ArrowDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getColor = () => {
    switch (direction) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getBadgeVariant = () => {
    switch (significance) {
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="flex items-center gap-2">
      {getIcon()}
      <span className={`text-sm font-medium ${getColor()}`}>
        {percentage.toFixed(1)}%
      </span>
      <Badge variant={getBadgeVariant()} className="text-xs">
        {significance}
      </Badge>
    </div>
  );
}

/**
 * Overall score trend card
 */
function OverallScoreTrendCard({ trends }: { trends: AIVisibilityTrends }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          AI Visibility Score Trend
        </CardTitle>
        <CardDescription>
          Overall performance over time
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold">{trends.overallScore.current}</div>
            <div className="text-sm text-muted-foreground">Current Score</div>
          </div>
          <TrendIndicator 
            direction={trends.overallScore.trend.direction}
            percentage={trends.overallScore.trend.percentage}
            significance={trends.overallScore.trend.significance}
          />
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends.overallScore.dataPoints}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
                formatter={(value) => [`${value}`, 'Score']}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ fill: '#8884d8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Category trends breakdown card
 */
function CategoryTrendsCard({ trends }: { trends: AIVisibilityTrends }) {
  const categories = [
    { key: 'schemaMarkup', label: 'Schema Markup', color: '#8884d8' },
    { key: 'contentOptimization', label: 'Content Optimization', color: '#82ca9d' },
    { key: 'aiSearchPresence', label: 'AI Search Presence', color: '#ffc658' },
    { key: 'knowledgeGraphIntegration', label: 'Knowledge Graph', color: '#ff7300' },
    { key: 'socialSignals', label: 'Social Signals', color: '#00ff88' },
    { key: 'technicalSEO', label: 'Technical SEO', color: '#ff0088' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Category Performance Trends
        </CardTitle>
        <CardDescription>
          Breakdown by optimization category
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((category) => {
            const trend = trends.categoryTrends[category.key as keyof typeof trends.categoryTrends];
            const latestValue = trend.dataPoints[trend.dataPoints.length - 1]?.value || 0;
            
            return (
              <div key={category.key} className="p-3 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{category.label}</span>
                  <TrendIndicator 
                    direction={trend.direction}
                    percentage={trend.percentage}
                    significance={trend.significance}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={latestValue} className="flex-1" />
                  <span className="text-sm font-medium w-8">{latestValue}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date"
                type="category"
                tickFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              {categories.map((category) => {
                const trend = trends.categoryTrends[category.key as keyof typeof trends.categoryTrends];
                return (
                  <Line
                    key={category.key}
                    type="monotone"
                    dataKey="value"
                    data={trend.dataPoints}
                    stroke={category.color}
                    strokeWidth={2}
                    name={category.label}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Platform performance breakdown card
 */
function PlatformPerformanceCard({ platformData }: { platformData: PlatformPerformance[] }) {
  const platformColors = {
    chatgpt: '#10a37f',
    claude: '#ff6b35',
    perplexity: '#1fb6ff',
    gemini: '#4285f4',
    'bing-chat': '#0078d4',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Platform Performance Breakdown
        </CardTitle>
        <CardDescription>
          Performance across different AI platforms
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {platformData.map((platform) => (
            <div key={platform.platform} className="p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium capitalize">{platform.platform.replace('-', ' ')}</span>
                <TrendIndicator 
                  direction={platform.trendDirection}
                  percentage={platform.changePercentage}
                  significance={platform.changePercentage > 20 ? 'high' : platform.changePercentage > 10 ? 'medium' : 'low'}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Mentions</span>
                  <span className="font-medium">{platform.mentionCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Avg Position</span>
                  <span className="font-medium">{platform.averagePosition.toFixed(1)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Sentiment</span>
                  <span className="font-medium">{(platform.sentimentScore * 100).toFixed(0)}%</span>
                </div>
                {platform.lastMention && (
                  <div className="flex justify-between text-sm">
                    <span>Last Mention</span>
                    <span className="text-muted-foreground">
                      {platform.lastMention.toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={platformData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="platform" 
                tickFormatter={(platform) => platform.replace('-', ' ')}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [value, name === 'mentionCount' ? 'Mentions' : 'Sentiment Score']}
              />
              <Bar dataKey="mentionCount" fill="#8884d8" name="Mentions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Mention frequency trends card
 */
function MentionFrequencyCard({ trends }: { trends: AIVisibilityTrends }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Mention Frequency Trends
        </CardTitle>
        <CardDescription>
          AI platform mentions over time
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">
              {trends.mentionFrequency.dataPoints.reduce((sum, dp) => sum + dp.value, 0)}
            </div>
            <div className="text-sm text-muted-foreground">Total Mentions</div>
          </div>
          <TrendIndicator 
            direction={trends.mentionFrequency.trend.direction}
            percentage={trends.mentionFrequency.trend.percentage}
            significance={trends.mentionFrequency.trend.significance}
          />
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trends.mentionFrequency.dataPoints}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
                formatter={(value) => [`${value}`, 'Mentions']}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Competitive positioning card
 */
function CompetitivePositioningCard({ trends }: { trends: AIVisibilityTrends }) {
  const { competitivePosition } = trends;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Competitive Positioning
        </CardTitle>
        <CardDescription>
          Your position in the market
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 rounded-lg border bg-card">
            <div className="text-2xl font-bold">#{competitivePosition.currentRank}</div>
            <div className="text-sm text-muted-foreground">Current Rank</div>
            {competitivePosition.currentRank !== competitivePosition.previousRank && (
              <div className="flex items-center justify-center gap-1 mt-1">
                {competitivePosition.currentRank < competitivePosition.previousRank ? (
                  <ArrowUp className="h-3 w-3 text-green-600" />
                ) : (
                  <ArrowDown className="h-3 w-3 text-red-600" />
                )}
                <span className="text-xs">
                  from #{competitivePosition.previousRank}
                </span>
              </div>
            )}
          </div>

          <div className="text-center p-4 rounded-lg border bg-card">
            <div className="text-2xl font-bold">{competitivePosition.marketShare.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Market Share</div>
          </div>
        </div>

        <div className="p-4 rounded-lg border bg-card">
          <h4 className="font-semibold mb-2">Gap Analysis</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Leader</span>
              <span className="font-medium">{competitivePosition.gapAnalysis.leader}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Score Gap</span>
              <span className="font-medium">{competitivePosition.gapAnalysis.gap} points</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Est. Catch-up Time</span>
              <span className="font-medium">{competitivePosition.gapAnalysis.catchUpTime} days</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Automated insights card
 */
function AutomatedInsightsCard({ insights }: { insights: AutomatedInsight[] }) {
  const getPriorityIcon = (priority: AutomatedInsight['priority']) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  const getPriorityColor = (priority: AutomatedInsight['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-green-200 bg-green-50';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Automated Insights
        </CardTitle>
        <CardDescription>
          AI-generated insights from your performance data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No insights available yet. Check back after more data is collected.
          </div>
        ) : (
          insights.map((insight) => (
            <div 
              key={insight.id} 
              className={`p-4 rounded-lg border ${getPriorityColor(insight.priority)}`}
            >
              <div className="flex items-start gap-3">
                {getPriorityIcon(insight.priority)}
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{insight.title}</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {insight.description}
                  </p>
                  
                  {insight.recommendations.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs font-medium mb-1">Recommendations:</div>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {insight.recommendations.slice(0, 2).map((rec, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <span>•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="outline" className="text-xs">
                      {(insight.confidence * 100).toFixed(0)}% confidence
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {insight.generatedAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Main Analytics Dashboard Component
 */
export function AnalyticsDashboard({ 
  userId, 
  onExportReport, 
  onRefreshData 
}: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [trends, setTrends] = useState<AIVisibilityTrends | null>(null);
  const [insights, setInsights] = useState<AutomatedInsight[]>([]);
  const [correlations, setCorrelations] = useState<PerformanceCorrelation[]>([]);
  const [businessOutcomes, setBusinessOutcomes] = useState<BusinessOutcomeMetrics | null>(null);

  // Load analytics data
  useEffect(() => {
    async function loadAnalyticsData() {
      setIsLoading(true);
      try {
        // TODO: Replace with actual service calls
        // const analyticsService = getAIVisibilityAnalyticsService();
        // const trendsData = await analyticsService.getAIVisibilityTrends(userId, timeRange);
        // const insightsData = await analyticsService.generateAutomatedInsights(userId, timeRange);
        // const correlationsData = await analyticsService.analyzePerformanceCorrelations(userId, timeRange);

        // Mock data for demonstration
        const mockTrends: AIVisibilityTrends = {
          timeRange,
          overallScore: {
            current: 72,
            trend: {
              direction: 'up',
              percentage: 8.5,
              significance: 'medium',
              description: 'Performance has moderately increased by 8.5%',
            },
            dataPoints: Array.from({ length: 30 }, (_, i) => ({
              date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
              value: 65 + Math.random() * 15 + (i * 0.3),
            })),
          },
          categoryTrends: {
            schemaMarkup: {
              direction: 'up',
              percentage: 12.3,
              significance: 'high',
              description: 'Schema markup has significantly improved',
              dataPoints: Array.from({ length: 30 }, (_, i) => ({
                date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
                value: 70 + Math.random() * 20 + (i * 0.4),
              })),
            },
            contentOptimization: {
              direction: 'up',
              percentage: 6.2,
              significance: 'low',
              description: 'Content optimization has slightly improved',
              dataPoints: Array.from({ length: 30 }, (_, i) => ({
                date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
                value: 60 + Math.random() * 15 + (i * 0.2),
              })),
            },
            aiSearchPresence: {
              direction: 'stable',
              percentage: 2.1,
              significance: 'low',
              description: 'AI search presence has remained stable',
              dataPoints: Array.from({ length: 30 }, (_, i) => ({
                date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
                value: 75 + Math.random() * 10,
              })),
            },
            knowledgeGraphIntegration: {
              direction: 'down',
              percentage: 4.8,
              significance: 'medium',
              description: 'Knowledge graph integration has moderately declined',
              dataPoints: Array.from({ length: 30 }, (_, i) => ({
                date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
                value: 65 - (i * 0.2) + Math.random() * 10,
              })),
            },
            socialSignals: {
              direction: 'up',
              percentage: 15.7,
              significance: 'high',
              description: 'Social signals have significantly improved',
              dataPoints: Array.from({ length: 30 }, (_, i) => ({
                date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
                value: 50 + Math.random() * 20 + (i * 0.5),
              })),
            },
            technicalSEO: {
              direction: 'stable',
              percentage: 1.2,
              significance: 'low',
              description: 'Technical SEO has remained stable',
              dataPoints: Array.from({ length: 30 }, (_, i) => ({
                date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
                value: 80 + Math.random() * 10,
              })),
            },
          },
          mentionFrequency: {
            trend: {
              direction: 'up',
              percentage: 22.4,
              significance: 'high',
              description: 'Mention frequency has significantly increased',
            },
            dataPoints: Array.from({ length: 30 }, (_, i) => ({
              date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
              value: Math.floor(Math.random() * 5) + (i > 20 ? 2 : 0),
            })),
            platformBreakdown: [
              {
                platform: 'chatgpt',
                mentionCount: 12,
                averagePosition: 1.8,
                sentimentScore: 0.85,
                trendDirection: 'up',
                changePercentage: 25.0,
                lastMention: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
              },
              {
                platform: 'claude',
                mentionCount: 8,
                averagePosition: 2.1,
                sentimentScore: 0.78,
                trendDirection: 'stable',
                changePercentage: 5.2,
                lastMention: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
              },
              {
                platform: 'perplexity',
                mentionCount: 6,
                averagePosition: 1.5,
                sentimentScore: 0.92,
                trendDirection: 'up',
                changePercentage: 50.0,
                lastMention: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
              },
              {
                platform: 'gemini',
                mentionCount: 4,
                averagePosition: 2.8,
                sentimentScore: 0.65,
                trendDirection: 'down',
                changePercentage: 20.0,
                lastMention: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              },
              {
                platform: 'bing-chat',
                mentionCount: 2,
                averagePosition: 3.0,
                sentimentScore: 0.70,
                trendDirection: 'stable',
                changePercentage: 0.0,
                lastMention: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
              },
            ],
          },
          competitivePosition: {
            currentRank: 3,
            previousRank: 4,
            marketShare: 18.5,
            gapAnalysis: {
              leader: 'Jane Doe Real Estate',
              gap: 15,
              catchUpTime: 45,
            },
          },
        };

        const mockInsights: AutomatedInsight[] = [
          {
            id: 'insight_1',
            type: 'score_improvement',
            priority: 'medium',
            title: 'Strong Schema Markup Performance',
            description: 'Your schema markup score has improved by 12.3% this month, significantly boosting your AI visibility.',
            dataSupport: ['Schema markup score increased from 78 to 88', 'Improvement shows high significance'],
            recommendations: [
              'Continue expanding schema markup to additional pages',
              'Focus on Review and AggregateRating schemas next',
            ],
            confidence: 0.85,
            generatedAt: new Date(),
          },
          {
            id: 'insight_2',
            type: 'platform_opportunity',
            priority: 'high',
            title: 'Untapped Potential on Bing Chat',
            description: 'Low visibility on Bing Chat presents a significant opportunity for growth with minimal competition.',
            dataSupport: ['Only 2 mentions on Bing Chat vs 12 on ChatGPT', 'Average position 3.0 indicates room for improvement'],
            recommendations: [
              'Create Bing-optimized content strategies',
              'Research Bing Chat ranking factors',
            ],
            confidence: 0.75,
            generatedAt: new Date(),
          },
        ];

        setTrends(mockTrends);
        setInsights(mockInsights);
        setCorrelations([]);
        setBusinessOutcomes(null);
      } catch (error) {
        console.error('Failed to load analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadAnalyticsData();
  }, [userId, timeRange]);

  const handleRefresh = () => {
    if (onRefreshData) {
      onRefreshData();
    }
    // Reload data
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000); // Simulate refresh
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-96 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!trends) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Analytics Data Available</h3>
        <p className="text-muted-foreground mb-4">
          Run an AI visibility analysis to start collecting analytics data.
        </p>
        <Button onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Visibility Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive performance analysis and trends
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {onExportReport && (
            <Button onClick={onExportReport}>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          )}
        </div>
      </div>

      {/* Main analytics grid */}
      <div className="grid gap-6">
        {/* Overall score trend - full width */}
        <OverallScoreTrendCard trends={trends} />

        {/* Two column layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          <MentionFrequencyCard trends={trends} />
          <CompetitivePositioningCard trends={trends} />
        </div>

        {/* Category trends - full width */}
        <CategoryTrendsCard trends={trends} />

        {/* Platform performance - full width */}
        <PlatformPerformanceCard platformData={trends.mentionFrequency.platformBreakdown} />

        {/* Insights - full width */}
        <AutomatedInsightsCard insights={insights} />
      </div>
    </div>
  );
}
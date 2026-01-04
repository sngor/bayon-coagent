'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  LineChart,
  Line,
  ScatterPlot,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Lightbulb,
  Download,
  FileText,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';

import type {
  PerformanceCorrelation,
  BusinessOutcomeMetrics,
  AutomatedInsight,
  AnalyticsTimeRange,
} from '@/lib/ai-visibility/services/analytics-service';

/**
 * Props for the Performance Report component
 */
interface PerformanceReportProps {
  userId: string;
  timeRange?: AnalyticsTimeRange;
  onExportReport?: (format: 'pdf' | 'csv' | 'json') => void;
}

/**
 * Correlation strength indicator
 */
function CorrelationStrengthIndicator({ correlation }: { correlation: number }) {
  const getStrength = (corr: number) => {
    const abs = Math.abs(corr);
    if (abs >= 0.7) return { label: 'Strong', color: 'bg-green-500' };
    if (abs >= 0.5) return { label: 'Moderate', color: 'bg-yellow-500' };
    if (abs >= 0.3) return { label: 'Weak', color: 'bg-orange-500' };
    return { label: 'Very Weak', color: 'bg-red-500' };
  };

  const strength = getStrength(correlation);
  const direction = correlation > 0 ? 'Positive' : 'Negative';

  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${strength.color}`} />
      <span className="text-sm font-medium">
        {direction} {strength.label}
      </span>
      <Badge variant="outline" className="text-xs">
        {correlation.toFixed(3)}
      </Badge>
    </div>
  );
}

/**
 * Business outcome metrics card
 */
function BusinessOutcomesCard({ businessOutcomes }: { businessOutcomes: BusinessOutcomeMetrics }) {
  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <BarChart3 className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Business Outcome Metrics
        </CardTitle>
        <CardDescription>
          Impact of AI visibility improvements on business results
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Lead Generation */}
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">Lead Generation</h4>
            <div className="flex items-center gap-2">
              {getTrendIcon(businessOutcomes.leadGeneration.trend.direction)}
              <span className={`text-sm font-medium ${getTrendColor(businessOutcomes.leadGeneration.trend.direction)}`}>
                {businessOutcomes.leadGeneration.trend.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-2xl font-bold">{businessOutcomes.leadGeneration.total}</div>
              <div className="text-muted-foreground">Total Leads</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{businessOutcomes.leadGeneration.aiAttributed}</div>
              <div className="text-muted-foreground">AI-Attributed</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{businessOutcomes.leadGeneration.conversionRate.toFixed(1)}%</div>
              <div className="text-muted-foreground">Conversion Rate</div>
            </div>
          </div>
        </div>

        {/* Website Traffic */}
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">Website Traffic</h4>
            <div className="flex items-center gap-2">
              {getTrendIcon(businessOutcomes.websiteTraffic.trend.direction)}
              <span className={`text-sm font-medium ${getTrendColor(businessOutcomes.websiteTraffic.trend.direction)}`}>
                {businessOutcomes.websiteTraffic.trend.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-2xl font-bold">{businessOutcomes.websiteTraffic.total.toLocaleString()}</div>
              <div className="text-muted-foreground">Total Visits</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{businessOutcomes.websiteTraffic.aiReferrals}</div>
              <div className="text-muted-foreground">AI Referrals</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{businessOutcomes.websiteTraffic.organicGrowth.toFixed(1)}%</div>
              <div className="text-muted-foreground">Organic Growth</div>
            </div>
          </div>
        </div>

        {/* Brand Awareness */}
        <div className="p-4 rounded-lg border bg-card">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">Brand Awareness</h4>
            <div className="flex items-center gap-2">
              {getTrendIcon(businessOutcomes.brandAwareness.trend.direction)}
              <span className={`text-sm font-medium ${getTrendColor(businessOutcomes.brandAwareness.trend.direction)}`}>
                {businessOutcomes.brandAwareness.trend.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-2xl font-bold">{businessOutcomes.brandAwareness.mentionVolume}</div>
              <div className="text-muted-foreground">Mention Volume</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{(businessOutcomes.brandAwareness.sentimentScore * 100).toFixed(0)}%</div>
              <div className="text-muted-foreground">Sentiment Score</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{businessOutcomes.brandAwareness.shareOfVoice.toFixed(1)}%</div>
              <div className="text-muted-foreground">Share of Voice</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Performance correlations card
 */
function PerformanceCorrelationsCard({ correlations }: { correlations: PerformanceCorrelation[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Performance Correlations
        </CardTitle>
        <CardDescription>
          Statistical relationships between AI visibility and business outcomes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {correlations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No significant correlations found yet.</p>
            <p className="text-sm">More data is needed to identify meaningful relationships.</p>
          </div>
        ) : (
          correlations.map((correlation, index) => (
            <div key={index} className="p-4 rounded-lg border bg-card">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold">{correlation.metric}</h4>
                <Badge variant={
                  correlation.significance === 'high' ? 'default' : 
                  correlation.significance === 'medium' ? 'secondary' : 'outline'
                }>
                  {correlation.significance} significance
                </Badge>
              </div>
              
              <CorrelationStrengthIndicator correlation={correlation.correlation} />
              
              <p className="text-sm text-muted-foreground mt-2 mb-3">
                {correlation.description}
              </p>
              
              {correlation.recommendations.length > 0 && (
                <div>
                  <div className="text-xs font-medium mb-1">Recommendations:</div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {correlation.recommendations.map((rec, recIndex) => (
                      <li key={recIndex} className="flex items-start gap-1">
                        <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Actionable insights card
 */
function ActionableInsightsCard({ insights }: { insights: AutomatedInsight[] }) {
  const getPriorityIcon = (priority: AutomatedInsight['priority']) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'medium':
        return <Info className="h-4 w-4 text-yellow-600" />;
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
          <Lightbulb className="h-5 w-5" />
          Actionable Insights
        </CardTitle>
        <CardDescription>
          AI-generated insights with specific recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No actionable insights available yet.</p>
            <p className="text-sm">Insights will appear as more performance data is collected.</p>
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
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold">{insight.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {(insight.confidence * 100).toFixed(0)}% confidence
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {insight.description}
                  </p>
                  
                  {insight.dataSupport.length > 0 && (
                    <div className="mb-3">
                      <div className="text-xs font-medium mb-1">Supporting Data:</div>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {insight.dataSupport.map((data, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <span>•</span>
                            <span>{data}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {insight.recommendations.length > 0 && (
                    <div>
                      <div className="text-xs font-medium mb-1">Recommended Actions:</div>
                      <ul className="text-xs space-y-1">
                        {insight.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0 text-primary" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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
 * Recommendations summary card
 */
function RecommendationsSummaryCard({ 
  recommendations 
}: { 
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Strategic Recommendations
        </CardTitle>
        <CardDescription>
          Prioritized action plan based on performance analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Immediate Actions */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <h4 className="font-semibold">Immediate Actions (Next 7 days)</h4>
          </div>
          {recommendations.immediate.length === 0 ? (
            <p className="text-sm text-muted-foreground">No immediate actions required.</p>
          ) : (
            <ul className="space-y-2">
              {recommendations.immediate.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Separator />

        {/* Short-term Actions */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-yellow-600" />
            <h4 className="font-semibold">Short-term Actions (Next 30 days)</h4>
          </div>
          {recommendations.shortTerm.length === 0 ? (
            <p className="text-sm text-muted-foreground">No short-term actions identified.</p>
          ) : (
            <ul className="space-y-2">
              {recommendations.shortTerm.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Separator />

        {/* Long-term Actions */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <h4 className="font-semibold">Long-term Strategy (Next 90 days)</h4>
          </div>
          {recommendations.longTerm.length === 0 ? (
            <p className="text-sm text-muted-foreground">No long-term strategy items identified.</p>
          ) : (
            <ul className="space-y-2">
              {recommendations.longTerm.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Main Performance Report Component
 */
export function PerformanceReport({ 
  userId, 
  timeRange = '90d', 
  onExportReport 
}: PerformanceReportProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [correlations, setCorrelations] = useState<PerformanceCorrelation[]>([]);
  const [insights, setInsights] = useState<AutomatedInsight[]>([]);
  const [businessOutcomes, setBusinessOutcomes] = useState<BusinessOutcomeMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<{
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  }>({
    immediate: [],
    shortTerm: [],
    longTerm: [],
  });

  // Load performance report data
  useEffect(() => {
    async function loadReportData() {
      setIsLoading(true);
      try {
        // TODO: Replace with actual service calls
        // const correlationService = getPerformanceCorrelationService();
        // const reportData = await correlationService.generatePerformanceReport(userId, timeRange);

        // Mock data for demonstration
        const mockCorrelations: PerformanceCorrelation[] = [
          {
            metric: 'AI Visibility Score vs Lead Generation',
            correlation: 0.78,
            significance: 'high',
            description: 'Strong positive correlation between AI visibility improvements and lead generation increases.',
            recommendations: [
              'Continue focusing on AI optimization to drive more leads',
              'Track lead sources to identify AI-attributed conversions',
              'Optimize content for high-converting AI queries'
            ]
          },
          {
            metric: 'Schema Markup Score vs Website Traffic',
            correlation: 0.65,
            significance: 'medium',
            description: 'Moderate correlation between schema markup implementation and organic website traffic growth.',
            recommendations: [
              'Prioritize schema markup improvements for maximum SEO impact',
              'Implement structured data for all key pages',
              'Monitor search console for schema markup performance'
            ]
          },
          {
            metric: 'Mention Frequency vs Brand Awareness',
            correlation: 0.82,
            significance: 'high',
            description: 'Very strong correlation between AI platform mentions and overall brand awareness metrics.',
            recommendations: [
              'Create content that encourages AI systems to mention your brand',
              'Monitor mention sentiment and context quality',
              'Engage with AI platform training data sources'
            ]
          }
        ];

        const mockInsights: AutomatedInsight[] = [
          {
            id: 'insight_correlation_1',
            type: 'content_performance',
            priority: 'high',
            title: 'Strong ROI from Schema Markup Investment',
            description: 'Analysis shows that every 10-point improvement in schema markup score correlates with a 15% increase in lead generation.',
            dataSupport: [
              'Correlation coefficient: 0.78 (statistically significant)',
              'Sample size: 45 data points over 90 days',
              'P-value: 0.003 (highly significant)'
            ],
            recommendations: [
              'Allocate additional resources to schema markup implementation',
              'Prioritize Review and AggregateRating schemas for immediate impact',
              'Track schema markup performance as a leading indicator for leads'
            ],
            confidence: 0.92,
            generatedAt: new Date(),
          },
          {
            id: 'insight_correlation_2',
            type: 'platform_opportunity',
            priority: 'medium',
            title: 'AI Platform Diversification Opportunity',
            description: 'Current performance is heavily dependent on ChatGPT mentions. Diversifying across platforms could reduce risk and increase reach.',
            dataSupport: [
              '75% of mentions come from ChatGPT alone',
              'Perplexity and Claude show higher conversion rates per mention',
              'Competitive analysis shows untapped potential on Gemini'
            ],
            recommendations: [
              'Develop platform-specific content strategies',
              'Research ranking factors for underutilized platforms',
              'Create A/B tests for different platform optimization approaches'
            ],
            confidence: 0.85,
            generatedAt: new Date(),
          }
        ];

        const mockBusinessOutcomes: BusinessOutcomeMetrics = {
          leadGeneration: {
            total: 67,
            aiAttributed: 18,
            conversionRate: 26.9,
            trend: {
              direction: 'up',
              percentage: 22.4,
              significance: 'high',
              description: 'Lead generation has significantly increased by 22.4%',
            },
          },
          websiteTraffic: {
            total: 3240,
            aiReferrals: 284,
            organicGrowth: 15.2,
            trend: {
              direction: 'up',
              percentage: 15.2,
              significance: 'medium',
              description: 'Website traffic has moderately increased by 15.2%',
            },
          },
          brandAwareness: {
            mentionVolume: 42,
            sentimentScore: 0.84,
            shareOfVoice: 18.7,
            trend: {
              direction: 'up',
              percentage: 31.5,
              significance: 'high',
              description: 'Brand awareness has significantly increased by 31.5%',
            },
          },
        };

        const mockRecommendations = {
          immediate: [
            'Implement Review schema markup for existing testimonials',
            'Optimize FAQ content for AI platform queries',
            'Fix technical SEO issues affecting AI crawler access'
          ],
          shortTerm: [
            'Develop content strategy for underperforming AI platforms',
            'Create location-specific landing pages with geographic schema',
            'Establish regular AI mention monitoring and response protocols'
          ],
          longTerm: [
            'Build comprehensive knowledge graph integration',
            'Develop AI-first content creation workflows',
            'Establish competitive AI visibility monitoring system'
          ],
        };

        setCorrelations(mockCorrelations);
        setInsights(mockInsights);
        setBusinessOutcomes(mockBusinessOutcomes);
        setRecommendations(mockRecommendations);
      } catch (error) {
        console.error('Failed to load performance report data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadReportData();
  }, [userId, timeRange]);

  const handleExport = (format: 'pdf' | 'csv' | 'json') => {
    if (onExportReport) {
      onExportReport(format);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-64 bg-muted animate-pulse rounded" />
          <div className="h-10 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Correlation Report</h2>
          <p className="text-muted-foreground">
            Analysis of AI visibility impact on business outcomes ({timeRange})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => handleExport('pdf')}>
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Report Content */}
      <div className="grid gap-6">
        {/* Business Outcomes - Full Width */}
        {businessOutcomes && (
          <BusinessOutcomesCard businessOutcomes={businessOutcomes} />
        )}

        {/* Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          <PerformanceCorrelationsCard correlations={correlations} />
          <ActionableInsightsCard insights={insights} />
        </div>

        {/* Recommendations - Full Width */}
        <RecommendationsSummaryCard recommendations={recommendations} />
      </div>
    </div>
  );
}
/**
 * Analysis Strategy Pattern
 * Implements different analysis strategies for market intelligence
 */

import type { MarketIntelligenceInput } from './market-intelligence-service';

export interface AnalysisStrategy {
    generateAnalysis(data: {
        location: string;
        marketData: string;
        metrics: any;
        trends: any[];
        opportunities: any[];
        recommendations: string[];
        input: MarketIntelligenceInput;
    }): string;
}

export class MarketUpdateStrategy implements AnalysisStrategy {
    generateAnalysis(data: any): string {
        return `# ${data.location} Market Update - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}

## Executive Summary

The ${data.location} real estate market demonstrates ${this.getMarketCondition(data.trends)} conditions with strategic opportunities for ${data.input.targetAudience}. Current data indicates balanced fundamentals with positive momentum in key market segments.

## Current Market Metrics

📊 **Key Performance Indicators:**
• **Median Home Price:** ${data.metrics.medianPrice} (${data.metrics.priceChange})
• **Days on Market:** ${data.metrics.daysOnMarket}
• **Inventory Level:** ${data.metrics.inventory}
• **Market Absorption:** ${data.metrics.absorption}
• **Price Forecast:** ${data.metrics.forecast}

## Market Intelligence

${data.marketData}

## Key Market Trends

${data.trends.map((trend: any) =>
            `🔹 **${trend.trend}**\n   Impact: ${trend.impact.toUpperCase()} | Confidence: ${trend.confidence}% | Timeframe: ${trend.timeframe}`
        ).join('\n\n')}

## Strategic Recommendations for ${data.input.targetAudience.charAt(0).toUpperCase() + data.input.targetAudience.slice(1)}

${data.recommendations.map((rec: any, index: number) => `${index + 1}. ${rec}`).join('\n')}

## Market Outlook

Based on current trends and economic indicators, the ${data.location} market is positioned for continued moderate growth. Key factors supporting this outlook include employment stability, infrastructure development, and demographic trends favoring sustained housing demand.

---

*This market update is based on current data and analysis. Market conditions can change rapidly, and individual results may vary. Consult with local market professionals for personalized advice.*`;
    }

    private getMarketCondition(trends: any[]): string {
        const positiveCount = trends.filter(t => t.impact === 'positive').length;
        const totalCount = trends.length;
        const ratio = positiveCount / totalCount;

        if (ratio >= 0.7) return 'favorable';
        if (ratio >= 0.4) return 'balanced';
        return 'challenging';
    }
}

export class TrendAnalysisStrategy implements AnalysisStrategy {
    generateAnalysis(data: any): string {
        return `# Market Trend Analysis: ${data.location}
## Analysis Period: ${data.input.timePeriod.toUpperCase()}

## Trend Overview

Our comprehensive analysis of the ${data.location} market reveals ${data.trends.length} significant trends shaping the current and future market landscape.

## Market Intelligence Research

${data.marketData}

## Identified Trends

${data.trends.map((trend: any, index: number) => `
### ${index + 1}. ${trend.trend}

**Impact Assessment:** ${trend.impact.toUpperCase()}  
**Confidence Level:** ${trend.confidence}%  
**Expected Duration:** ${trend.timeframe}

${this.getTrendDescription(trend.trend, trend.impact)}
`).join('\n')}

## Market Opportunities

${data.opportunities.map((opp: any, index: number) => `
### ${opp.title} (${opp.priority.toUpperCase()} Priority)

${opp.description}

**Timeline:** ${opp.timeframe}  
${opp.investmentLevel ? `**Investment Level:** ${opp.investmentLevel}` : ''}
`).join('\n')}

## Strategic Recommendations

${data.recommendations.map((rec: any, index: number) => `${index + 1}. ${rec}`).join('\n')}

## Conclusion

The trend analysis indicates a ${this.getOverallTrendDirection(data.trends)} market trajectory for ${data.location}. Strategic positioning around identified opportunities will be key to maximizing success in this evolving market environment.

---

*Trend analysis based on current market data and predictive modeling. Trends may evolve based on economic conditions and external factors.*`;
    }

    private getTrendDescription(trend: string, impact: string): string {
        const descriptions = {
            'positive': 'This trend creates favorable conditions for market participants and is expected to support continued growth and opportunity development.',
            'negative': 'This trend presents challenges that require strategic adaptation and careful market positioning to navigate successfully.',
            'neutral': 'This trend represents a market shift that creates both opportunities and challenges depending on strategic positioning.'
        };
        return descriptions[impact as keyof typeof descriptions] || descriptions.neutral;
    }

    private getOverallTrendDirection(trends: any[]): string {
        const positiveCount = trends.filter(t => t.impact === 'positive').length;
        const negativeCount = trends.filter(t => t.impact === 'negative').length;

        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'cautious';
        return 'stable';
    }
}

export class OpportunityAnalysisStrategy implements AnalysisStrategy {
    generateAnalysis(data: any): string {
        return `# Market Opportunity Analysis: ${data.location}
## Target Audience: ${data.input.targetAudience.charAt(0).toUpperCase() + data.input.targetAudience.slice(1)}

## Opportunity Overview

Our analysis has identified ${data.opportunities.length} strategic opportunities in the ${data.location} market, prioritized by potential impact and implementation feasibility.

## Market Research Foundation

${data.marketData}

## Priority Opportunities

${data.opportunities.map((opp: any, index: number) => `
## ${index + 1}. ${opp.title}

**Priority Level:** ${opp.priority.toUpperCase()}  
**Implementation Timeline:** ${opp.timeframe}  
${opp.investmentLevel ? `**Investment Required:** ${opp.investmentLevel}` : ''}

### Opportunity Description
${opp.description}

### Market Conditions Supporting This Opportunity
${this.getOpportunitySupport(opp.title, data.trends)}

### Implementation Strategy
${this.getImplementationStrategy(opp.title, data.input.targetAudience)}
`).join('\n')}

## Supporting Market Trends

${data.trends.filter((t: any) => t.impact === 'positive').map((trend: any) =>
            `• **${trend.trend}** (${trend.confidence}% confidence)`
        ).join('\n')}

## Action Plan

${data.recommendations.map((rec: any, index: number) => `${index + 1}. ${rec}`).join('\n')}

## Risk Considerations

• Market conditions can change rapidly - monitor key indicators regularly
• Competition may increase as opportunities become more apparent
• Economic factors may impact timeline and success rates
• Local regulations and zoning changes could affect implementation

---

*Opportunity analysis based on current market conditions and trend projections. Success depends on execution quality and market timing.*`;
    }

    private getOpportunitySupport(title: string, trends: any[]): string {
        const supportingTrends = trends.filter(t => t.impact === 'positive').slice(0, 2);
        return supportingTrends.map(t => `• ${t.trend}`).join('\n') || '• Current market fundamentals support this opportunity';
    }

    private getImplementationStrategy(title: string, audience: string): string {
        const strategies = {
            'First-Time Buyer Specialization': 'Develop educational content, partner with lenders, create buyer guides, and build referral networks.',
            'Emerging Neighborhood Focus': 'Conduct market research, build local connections, create area expertise content, and establish market presence.',
            'Technology Integration Services': 'Invest in technology platforms, train on new tools, develop service packages, and market digital capabilities.',
        };

        return strategies[title as keyof typeof strategies] || 'Develop expertise, build relationships, create marketing strategy, and monitor market conditions.';
    }
}

export class AnalysisStrategyFactory {
    static createStrategy(analysisType: string): AnalysisStrategy {
        switch (analysisType) {
            case 'market-update':
                return new MarketUpdateStrategy();
            case 'trend-analysis':
                return new TrendAnalysisStrategy();
            case 'opportunity-identification':
                return new OpportunityAnalysisStrategy();
            default:
                return new MarketUpdateStrategy(); // Default fallback
        }
    }
}
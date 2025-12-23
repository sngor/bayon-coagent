# Enhanced Agent Integration Quick Reference

Quick reference for implementing and using the Enhanced Agent Integration system across hubs.

## Implementation Pattern

### Basic Hub Integration

```typescript
import { FeatureGuard } from '@/components/feature-guard';
import { EnhancedAgentIntegration } from '@/components/enhanced-agents';

export default function HubLayout({ children }: { children: React.ReactNode }) {
    return (
        <FeatureGuard featureId="hub-name">
            <HubLayoutWithFavorites
                title="Hub Title"
                description="Hub description"
                icon={HubIcon}
                tabs={hubTabs}
            >
                {children}
                <EnhancedAgentIntegration
                    hubContext="hub-name"
                    position="bottom-right"
                    showNotifications={true}
                />
            </HubLayoutWithFavorites>
        </FeatureGuard>
    );
}
```

## Available Hub Agents

### Research Hub - Dr. Sarah
- **Role**: Market Research Analyst
- **Expertise**: Market research, data analysis, trend identification
- **Personality**: Analytical, thorough, and insightful
- **Proactive Features**: Market trend alerts, research updates, insight discovery

### Studio Hub - Maya
- **Role**: Creative Content Specialist
- **Expertise**: Content creation, copywriting, social media, brand storytelling
- **Personality**: Creative, enthusiastic, and detail-oriented
- **Proactive Features**: Content calendar suggestions, trending topics, performance analysis

### Brand Hub - Alex
- **Role**: Brand & Marketing Strategist
- **Expertise**: Brand strategy, competitive analysis, SEO optimization
- **Personality**: Strategic, analytical, and results-driven
- **Proactive Features**: Competitor monitoring, brand mentions, SEO opportunities

### Market Hub - Marcus
- **Role**: Market Intelligence Specialist
- **Expertise**: Market trends, investment analysis, opportunity identification
- **Personality**: Sharp, intuitive, and opportunity-focused
- **Proactive Features**: Opportunity alerts, market shifts, investment timing

### Tools Hub - David
- **Role**: Financial Analysis Expert
- **Expertise**: Financial analysis, ROI calculation, property valuation
- **Personality**: Precise, methodical, and numbers-focused
- **Proactive Features**: Deal opportunities, market value changes, financing updates

### Library Hub - Emma
- **Role**: Content & Knowledge Curator
- **Expertise**: Content organization, knowledge management, search optimization
- **Personality**: Organized, helpful, and knowledge-focused
- **Proactive Features**: Content organization, duplicate detection, usage insights

### Assistant Hub - Riley
- **Role**: General AI Assistant
- **Expertise**: General assistance, task coordination, problem-solving
- **Personality**: Friendly, adaptable, and supportive
- **Proactive Features**: Workflow optimization, cross-hub insights, productivity tips

### Dashboard Hub - Jordan
- **Role**: Performance & Analytics Specialist
- **Expertise**: Performance analytics, goal tracking, business intelligence
- **Personality**: Data-driven, insightful, and motivational
- **Proactive Features**: Performance alerts, goal progress, optimization suggestions

## Component Props

### EnhancedAgentIntegration

```typescript
interface EnhancedAgentIntegrationProps {
    hubContext: string;           // Hub identifier (e.g., "research", "studio")
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    showNotifications?: boolean;  // Show proactive notifications
    className?: string;           // Additional CSS classes
    defaultExpanded?: boolean;    // Start with chat expanded
    maxHeight?: string;          // Maximum chat height
}
```

### FeatureGuard

```typescript
interface FeatureGuardProps {
    featureId: string;           // Feature identifier for subscription check
    children: React.ReactNode;   // Content to guard
    fallback?: React.ReactNode;  // Content to show when access denied
}
```

## Usage Examples

### Research Hub with Agent

```typescript
<EnhancedAgentIntegration
    hubContext="research"
    position="bottom-right"
    showNotifications={true}
    defaultExpanded={false}
    maxHeight="500px"
/>
```

### Custom Feature Gate

```typescript
<FeatureGuard 
    featureId="advanced-research"
    fallback={<UpgradePrompt feature="Advanced Research" />}
>
    <AdvancedResearchFeatures />
</FeatureGuard>
```

## Agent Configuration

### Adding New Hub Agent

1. **Define Agent Config** in `src/aws/bedrock/hub-agents/agent-configs.ts`:

```typescript
'new-hub-agent': {
    id: 'new-hub-agent-id',
    name: 'Agent Name - Role Title',
    hub: 'hub-name',
    personality: 'Personality description',
    expertise: ['skill-1', 'skill-2', 'skill-3'],
    systemPrompt: `Detailed system prompt...`,
    capabilities: {
        expertise: ['primary-skills'],
        taskTypes: ['task-1', 'task-2'],
        qualityScore: 0.95,
        speedScore: 0.85,
        reliabilityScore: 0.92,
        maxConcurrentTasks: 3,
        preferredModel: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0'
    },
    proactiveFeatures: [
        'feature-1-alerts',
        'feature-2-notifications'
    ]
}
```

2. **Register Agent** in `src/aws/bedrock/hub-agents/hub-agent-registry.ts`

3. **Add to Hub Layout** following the implementation pattern above

## Feature Gates

### Available Feature IDs

- `research` - Research Hub access
- `aiContentGeneration` - AI content creation
- `advancedAnalytics` - Advanced analytics features
- `competitorTracking` - Competitor analysis
- `rolePlaySessions` - AI role-play scenarios
- `learningPlans` - AI learning plan generation

### Subscription Tiers

- **Free Tier**: Limited access to basic features
- **Professional Trial**: 7-day full access trial
- **Professional**: Full access to all premium features
- **Omnia**: All features plus white-label options

## Troubleshooting

### Agent Not Loading

1. Check hub context matches agent configuration
2. Verify agent is registered in hub registry
3. Check console for JavaScript errors
4. Ensure user has required subscription access

### Feature Gate Not Working

1. Verify feature ID exists in subscription constants
2. Check user subscription status
3. Ensure FeatureGuard wrapper is properly implemented
4. Check for authentication issues

### Chat Interface Issues

1. Verify EnhancedAgentIntegration props are correct
2. Check if agent configuration is valid
3. Ensure Bedrock model access is configured
4. Check network connectivity for API calls

## Related Documentation

- [Architecture Guide](../guides/architecture.md) - System architecture overview
- [Hub Development](../guides/development.md) - Hub development patterns
- [Subscription System](../features/subscription-system.md) - Feature gating details
- [Agent Orchestration](../features/agent-orchestration.md) - Multi-agent workflows
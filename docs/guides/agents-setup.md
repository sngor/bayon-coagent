# Enhanced AI Agents - Setup & Activation Guide

This guide will help you activate and configure the enhanced AI agent features in your Bayon Coagent application.

## 🚀 Quick Start

### 1. Verify Installation

All enhanced agent files have been created and integrated. Verify the following files exist:

```bash
# Core agent system
src/aws/bedrock/hub-agents/hub-agent-registry.ts
src/aws/bedrock/proactive/proactive-agent-manager.ts
src/aws/bedrock/intelligence/cross-hub-coordinator.ts
src/aws/bedrock/orchestration/enhanced-orchestrator.ts

# Server actions
src/app/enhanced-agent-actions.ts

# UI components
src/components/enhanced-agents/proactive-suggestions-panel.tsx
src/components/enhanced-agents/hub-agent-chat.tsx
src/components/enhanced-agents/enhanced-agent-integration.tsx

# React hooks
src/hooks/use-enhanced-agents.ts
```

### 2. Install Dependencies

Ensure all required dependencies are installed:

```bash
npm install
```

### 3. Test the Implementation

Start your development server:

```bash
npm run dev
```

## 🎯 Features Now Active

### Dashboard Enhancements

- **Proactive Suggestions Panel** - Right sidebar with AI-generated suggestions
- **Auto-initialization** - Proactive monitoring starts automatically for users with complete profiles

### Hub-Specific AI Agents

Each hub now has a specialized AI assistant:

| Hub          | Agent                        | Personality                | Access                  |
| ------------ | ---------------------------- | -------------------------- | ----------------------- |
| Studio       | Maya - Creative Specialist   | Creative, enthusiastic     | Floating chat button    |
| Brand        | Alex - Brand Strategist      | Strategic, analytical      | Floating chat button    |
| Intelligence | Marcus - Market Intelligence | Sharp, opportunity-focused | Floating chat button    |
| Tools        | David - Financial Expert     | Precise, methodical        | Floating chat button    |
| Library      | Emma - Content Curator       | Organized, helpful         | Floating chat button    |
| Assistant    | Riley - General Assistant    | Friendly, adaptable        | Enhanced chat interface |

### Proactive Features

- **Content Calendar Suggestions** - AI suggests timely content opportunities
- **Market Trend Alerts** - Notifications for significant market changes
- **Competitor Monitoring** - Alerts about competitor activity
- **SEO Optimization** - Suggestions for improving search rankings
- **Seasonal Content** - Timely content recommendations

### Cross-Hub Intelligence

- **Research → Studio** - Research findings become content ideas
- **Market → Brand** - Market trends inform brand strategy
- **Tools → Market** - Financial analysis reveals opportunities
- **Brand → Studio** - Brand insights guide content creation

## 🔧 Configuration Options

### Enable Proactive Monitoring

Users can enable proactive monitoring in two ways:

1. **Automatic** - Activates automatically when profile is complete
2. **Manual** - Click "Enable AI Suggestions" in any suggestions panel

### Customize Notification Preferences

```typescript
// In your user settings or profile page
await initProactiveMonitoringAction({
  preferences: {
    notificationFrequency: "daily", // 'immediate', 'hourly', 'daily', 'weekly'
    priorityThreshold: "medium", // 'low', 'medium', 'high'
    hubPreferences: {
      studio: true,
      brand: true,
      intelligence: true,
      tools: true,
      library: true,
    },
  },
});
```

## 🎨 UI Integration Points

### Floating Agent Buttons

Each hub now has a floating AI agent button in the bottom-right corner:

- **Chat Icon** - Opens hub-specific agent chat
- **Suggestions Icon** - Shows proactive suggestions (when available)

### Dashboard Suggestions Panel

The dashboard now includes a proactive suggestions panel that:

- Shows AI-generated opportunities
- Filters by priority and type
- Provides actionable recommendations
- Auto-refreshes every 5 minutes

### Hub Agent Chat

Each hub has a specialized chat interface that:

- Uses hub-specific agent personalities
- Provides contextual assistance
- Remembers conversation history
- Offers quick suggestion buttons

## 📊 Data Flow

### Proactive Suggestions

```
User Activity → Data Analysis → AI Insights → Suggestions → User Actions
```

### Cross-Hub Intelligence

```
Hub A Data → Analysis → Insights → Hub B Recommendations → User Benefits
```

### Agent Conversations

```
User Query → Hub Context → Specialized Agent → Personalized Response
```

## 🔍 Testing Your Implementation

### 1. Test Dashboard Integration

1. Navigate to `/dashboard`
2. Verify the proactive suggestions panel appears in the right sidebar
3. Check that suggestions load (may be empty initially)

### 2. Test Hub Agents

1. Visit any hub (Studio, Brand, Intelligence, Tools, Library)
2. Look for the floating chat button in bottom-right corner
3. Click to open the agent chat interface
4. Send a test message to verify the agent responds

### 3. Test Proactive Monitoring

1. Complete your agent profile if not already done
2. Wait for auto-initialization or manually enable in suggestions panel
3. Check for suggestions appearing over time

### 4. Test Cross-Hub Intelligence

1. Create content in one hub (e.g., research in Intelligence)
2. Check other hubs for related suggestions (e.g., content ideas in Studio)

## 🐛 Troubleshooting

### Common Issues

**1. Agents Not Responding**

- Check that `enhanced-agent-actions.ts` is properly imported
- Verify AWS Bedrock configuration is correct
- Check browser console for errors

**2. Suggestions Not Appearing**

- Ensure proactive monitoring is enabled
- Check that user has sufficient profile data
- Verify DynamoDB permissions for suggestions storage

**3. Hub Context Not Working**

- Verify hub names match exactly in `hub-agent-registry.ts`
- Check that `EnhancedAgentIntegration` has correct `hubContext` prop

**4. UI Components Not Loading**

- Ensure all imports are correct in layout files
- Check that enhanced-agents components are properly exported
- Verify Tailwind CSS classes are available

### Debug Mode

Enable debug logging by adding to your environment:

```bash
# .env.local
NEXT_PUBLIC_DEBUG_ENHANCED_AGENTS=true
```

### Check Agent Registry

Verify agents are properly registered:

```typescript
import { HubAgentRegistry } from "@/aws/bedrock/hub-agents/hub-agent-registry";

// In browser console or test file
console.log(HubAgentRegistry.getAllAgents());
```

## 📈 Performance Optimization

### Caching Strategy

- Agent responses cached for 5 minutes
- Suggestions cached for 1 hour
- Cross-hub insights cached for 30 minutes

### Rate Limiting

- Proactive checks: Every hour (configurable)
- Agent chats: No limit (uses Bedrock quotas)
- Cross-hub analysis: Triggered by data changes

### Memory Management

- Chat history limited to 50 messages per conversation
- Suggestions auto-expire after 7 days
- Old orchestration plans archived after 30 days

## 🔄 Monitoring & Analytics

### Key Metrics to Track

- Agent response times
- Suggestion click-through rates
- Cross-hub insight generation
- User engagement with proactive features

### Health Checks

- Monitor Bedrock API response times
- Track DynamoDB read/write operations
- Check suggestion generation success rates

## 🚀 Next Steps

### Immediate Actions

1. Test all features in development
2. Monitor error logs for any issues
3. Gather user feedback on agent personalities
4. Adjust suggestion frequency based on usage

### Future Enhancements

1. **Learning Agents** - Agents that improve based on user feedback
2. **Voice Interactions** - Voice-enabled agent conversations
3. **Mobile Optimization** - Mobile-specific agent behaviors
4. **Advanced Analytics** - Detailed agent performance metrics

## 📞 Support

If you encounter any issues:

1. Check the browser console for errors
2. Review the implementation files for any missing imports
3. Verify your AWS Bedrock configuration
4. Test with a simple agent interaction first

The enhanced AI agents are now fully integrated and ready to provide intelligent, proactive assistance to your real estate agent users!

---

**Implementation Status: ✅ Complete**

- Hub-specific agents: ✅ Active
- Proactive monitoring: ✅ Active
- Cross-hub intelligence: ✅ Active
- Enhanced orchestration: ✅ Active
- UI integration: ✅ Complete
- Dashboard integration: ✅ Complete

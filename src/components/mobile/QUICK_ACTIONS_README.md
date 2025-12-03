# Quick Actions Menu System

A mobile-optimized quick actions menu system that provides one-tap access to common agent workflows with intelligent prioritization based on usage patterns.

## Overview

The Quick Actions system consists of:

1. **Action Registry** - Manages available actions and user preferences
2. **Action Executor** - Handles action execution with offline support
3. **Quick Actions Menu** - Mobile-optimized UI component
4. **React Hook** - Easy integration in React components

## Features

- ✅ **Customizable shortcuts** - Pin your most-used actions
- ✅ **Usage tracking** - Automatically prioritizes frequently used actions
- ✅ **Offline support** - Actions queue when offline and sync when connected
- ✅ **Mobile-optimized** - Touch-friendly UI with large tap targets
- ✅ **Analytics** - Track usage patterns and optimize workflow
- ✅ **Flexible display** - Grid or list view options

## Requirements

Implements requirements:

- **2.1**: Display quick actions menu with one-tap shortcuts
- **2.2**: Launch corresponding workflow with mobile-optimized UI
- **2.3**: Remember recently used actions and prioritize them

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Quick Actions Menu                      │
│                    (React Component)                     │
└─────────────────────────────────────────────────────────┘
                           │
                           ├─────────────────────────────┐
                           │                             │
                           ▼                             ▼
┌──────────────────────────────────┐   ┌──────────────────────────────┐
│      Action Registry             │   │     Action Executor          │
│  - Manage actions                │   │  - Execute actions           │
│  - Track usage                   │   │  - Handle offline queue      │
│  - Store preferences             │   │  - Integrate with router     │
└──────────────────────────────────┘   └──────────────────────────────┘
                           │                             │
                           └─────────────┬───────────────┘
                                         │
                                         ▼
                           ┌──────────────────────────┐
                           │    localStorage          │
                           │  - User preferences      │
                           │  - Usage analytics       │
                           └──────────────────────────┘
```

## Usage

### Basic Usage

```tsx
import { QuickActionsMenu } from "@/components/mobile/quick-actions-menu";

export function MobileDashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <QuickActionsMenu
        userId={user.id}
        maxVisible={8}
        variant="grid"
        showCustomize={true}
      />
    </div>
  );
}
```

### Using the Hook

```tsx
import { useQuickActions } from "@/hooks/use-quick-actions";

export function CustomQuickActions() {
  const { actions, executeAction, togglePin, isPinned, analytics } =
    useQuickActions({
      userId: user.id,
      maxActions: 8,
    });

  return (
    <div>
      {actions.map((action) => (
        <button key={action.id} onClick={() => executeAction(action.id)}>
          {action.label}
          {isPinned(action.id) && <PinIcon />}
        </button>
      ))}
    </div>
  );
}
```

### Programmatic Action Execution

```tsx
import { quickActionsExecutor } from "@/lib/mobile/quick-actions-executor";

// Execute an action
const result = await quickActionsExecutor.executeAction("quick-capture", {
  mode: "camera",
});

if (result.success) {
  console.log("Action completed:", result.message);
} else {
  console.error("Action failed:", result.error);
}
```

### Custom Actions

```tsx
import { quickActionsRegistry } from "@/lib/mobile/quick-actions-registry";

// Add a custom action
quickActionsRegistry.addCustomAction({
  id: "custom-report",
  label: "Generate Report",
  description: "Create a custom market report",
  icon: "FileText",
  route: "/reports/custom",
  category: "content",
  requiresOnline: true,
});

// Remove a custom action
quickActionsRegistry.removeCustomAction("custom-report");
```

## Default Actions

The system includes these default actions:

| Action          | Description                                   | Category | Offline |
| --------------- | --------------------------------------------- | -------- | ------- |
| Quick Capture   | Capture property details with camera or voice | Capture  | ✅      |
| Create Content  | Generate marketing content                    | Content  | ❌      |
| Voice Note      | Record a quick voice note                     | Capture  | ✅      |
| Quick Share     | Share property via QR or SMS                  | Client   | ❌      |
| Market Data     | Check market insights                         | Market   | ❌      |
| Calculator      | Mortgage calculator                           | Tools    | ✅      |
| Calendar        | View your schedule                            | Client   | ❌      |
| Property Search | Search MLS listings                           | Market   | ❌      |
| Clients         | View client list                              | Client   | ❌      |
| Library         | Access saved content                          | Content  | ❌      |

## Action Prioritization

Actions are prioritized based on:

1. **Pinned actions** - Always appear first
2. **Usage frequency** - More frequently used actions rank higher
3. **Recency** - Recently used actions are prioritized
4. **Default order** - Fallback for unused actions

The algorithm combines these factors to create an optimal quick actions menu for each user.

## Offline Support

When offline:

- Actions marked as `requiresOnline: false` execute immediately
- Online-only actions are queued for later execution
- Visual indicators show which actions are available offline
- Queued actions sync automatically when connection returns

## Usage Analytics

Track action usage with built-in analytics:

```tsx
const analytics = quickActionsRegistry.getUsageAnalytics();

console.log("Total actions executed:", analytics.totalActions);
console.log("Most used action:", analytics.mostUsedAction);
console.log("Recent actions:", analytics.recentActions);
```

Analytics include:

- Total action count
- Most frequently used action
- Recent action history with timestamps
- Usage count per action

## Customization

### Pin/Unpin Actions

```tsx
// Pin an action
quickActionsRegistry.pinAction("quick-capture");

// Unpin an action
quickActionsRegistry.unpinAction("quick-capture");

// Toggle pin status
const isPinned = quickActionsRegistry.togglePin("quick-capture");
```

### Get Actions by Category

```tsx
const captureActions = quickActionsRegistry.getActionsByCategory("capture");
const contentActions = quickActionsRegistry.getActionsByCategory("content");
```

### Reset Analytics

```tsx
// Clear all usage data
quickActionsRegistry.resetAnalytics();
```

## Component Props

### QuickActionsMenu

| Prop          | Type             | Default   | Description                          |
| ------------- | ---------------- | --------- | ------------------------------------ |
| userId        | string           | undefined | User ID for personalized actions     |
| maxVisible    | number           | 8         | Maximum number of actions to display |
| variant       | 'grid' \| 'list' | 'grid'    | Display variant                      |
| showCustomize | boolean          | true      | Show customize button                |

### useQuickActions Hook

| Option     | Type   | Default   | Description                         |
| ---------- | ------ | --------- | ----------------------------------- |
| userId     | string | undefined | User ID for personalized actions    |
| maxActions | number | 8         | Maximum number of actions to return |

Returns:

- `actions` - Prioritized actions array
- `recentActions` - Recently used actions
- `pinnedActions` - Pinned actions
- `executeAction` - Function to execute an action
- `togglePin` - Function to toggle pin status
- `isPinned` - Function to check pin status
- `canExecute` - Function to check if action can execute
- `analytics` - Usage analytics object
- `refresh` - Function to refresh actions

## Events

The system dispatches custom events:

```tsx
// Action usage tracked
window.addEventListener("quick-actions:usage", (e) => {
  console.log("Action used:", e.detail.actionId);
});

// Config updated (pin/unpin)
window.addEventListener("quick-actions:config-updated", (e) => {
  console.log("Config updated:", e.detail.config);
});

// Navigation requested
window.addEventListener("quick-actions:navigate", (e) => {
  console.log("Navigate to:", e.detail.route);
});

// Server action requested
window.addEventListener("quick-actions:server-action", (e) => {
  console.log("Server action:", e.detail.actionName);
});
```

## Storage

User preferences are stored in localStorage:

```
quick_actions_{userId}
{
  userId: string;
  pinnedActions: string[];
  recentActions: QuickActionUsage[];
  customActions: QuickActionDefinition[];
}
```

## Best Practices

1. **Initialize early** - Call `quickActionsRegistry.initialize(userId)` when user logs in
2. **Track usage** - Usage tracking is automatic, but ensure actions are properly executed
3. **Provide feedback** - Show toast notifications for action results
4. **Handle offline** - Design actions to work offline when possible
5. **Keep it simple** - Limit to 6-8 visible actions for best UX
6. **Use categories** - Group related actions for better organization
7. **Test on mobile** - Ensure touch targets are at least 44px

## Testing

Test the quick actions system:

```tsx
import { quickActionsRegistry } from "@/lib/mobile/quick-actions-registry";
import { quickActionsExecutor } from "@/lib/mobile/quick-actions-executor";

// Test action execution
const result = await quickActionsExecutor.executeAction("quick-capture");
expect(result.success).toBe(true);

// Test usage tracking
quickActionsRegistry.trackActionUsage("quick-capture");
const analytics = quickActionsRegistry.getUsageAnalytics();
expect(analytics.totalActions).toBeGreaterThan(0);

// Test pinning
quickActionsRegistry.pinAction("quick-capture");
expect(quickActionsRegistry.isPinned("quick-capture")).toBe(true);
```

## Demo

See the demo component for a complete example:

```tsx
import { QuickActionsDemo } from "@/components/mobile/quick-actions-demo";

<QuickActionsDemo userId={user.id} />;
```

## Future Enhancements

Potential improvements:

- [ ] Action shortcuts (keyboard shortcuts on desktop)
- [ ] Action groups/folders
- [ ] Contextual actions based on current page
- [ ] Action search
- [ ] Action recommendations based on time of day
- [ ] Sync preferences across devices
- [ ] Action templates for common workflows
- [ ] Voice-activated actions

## Related Components

- [Quick Capture Interface](./QUICK_CAPTURE_INTERFACE_README.md) - Capture property details
- [Offline Queue](../../lib/mobile/offline-queue.ts) - Offline operation management
- [Device APIs](../../lib/mobile/device-apis.ts) - Device capability access

## Support

For issues or questions:

1. Check the demo component for examples
2. Review the usage analytics for insights
3. Test with different network conditions
4. Verify localStorage permissions

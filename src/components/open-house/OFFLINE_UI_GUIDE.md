# Offline UI Components Guide

This guide provides comprehensive documentation for the offline status and sync UI components in the Open House Enhancement feature.

## Overview

The offline UI system provides users with clear, consistent feedback about their connectivity status and sync operations. It consists of several components that work together to create a seamless offline experience.

## Components

### 1. OfflineStatusIndicator

**Purpose**: Primary component for displaying offline status and sync information prominently.

**Location**: `src/components/open-house/offline-status-indicator.tsx`

**Features**:

- Shows offline/online status with clear visual indicators
- Displays pending operations count
- Shows sync progress
- Provides quick actions (sync now, retry failed)
- Supports multiple positioning modes

**Usage**:

```tsx
import { OfflineStatusIndicator } from '@/components/open-house/offline-status-indicator';

// Fixed at top of page
<OfflineStatusIndicator position="fixed-top" />

// Fixed at bottom of page
<OfflineStatusIndicator position="fixed-bottom" />

// Inline within content
<OfflineStatusIndicator position="inline" />

// Show even when online (for testing/debugging)
<OfflineStatusIndicator showWhenOnline />
```

**States**:

- **Offline**: Red alert with offline icon and pending count
- **Syncing**: Blue alert with spinning icon and progress
- **Failed**: Red alert with retry button
- **Pending**: Yellow alert with sync now button
- **Synced**: Green alert (only shown if `showWhenOnline` is true)

**Requirements**: Validates Requirements 8.1, 8.5

---

### 2. OfflineBadge

**Purpose**: Compact badge for showing offline status inline.

**Location**: `src/components/open-house/offline-status-indicator.tsx` (exported)

**Features**:

- Minimal space usage
- Shows offline icon or pending count
- Auto-hides when online with no pending operations

**Usage**:

```tsx
import { OfflineBadge } from "@/components/open-house/offline-status-indicator";

// In navigation or headers
<div className="flex items-center gap-2">
  <h1>Open House</h1>
  <OfflineBadge />
</div>;
```

---

### 3. OfflineMessage

**Purpose**: Simple text message for inline offline notifications.

**Location**: `src/components/open-house/offline-status-indicator.tsx` (exported)

**Features**:

- Plain text with icon
- Minimal visual impact
- Contextual messaging

**Usage**:

```tsx
import { OfflineMessage } from "@/components/open-house/offline-status-indicator";

// In forms or action areas
<form>
  <OfflineMessage />
  {/* Form fields */}
</form>;
```

---

### 4. SyncStatusIndicator

**Purpose**: Compact popover-based sync status for navigation bars.

**Location**: `src/components/open-house/sync-status-indicator.tsx`

**Features**:

- Minimal space usage (single button)
- Detailed information in popover
- Shows badge with pending count
- Animated sync indicator
- Quick sync action

**Usage**:

```tsx
import { SyncStatusIndicator } from "@/components/open-house/sync-status-indicator";

// In navigation bar
<nav className="flex items-center justify-between">
  <div>Navigation items</div>
  <SyncStatusIndicator />
</nav>;
```

**Requirements**: Validates Requirements 8.5

---

### 5. SyncStatusDisplay

**Purpose**: Detailed sync status card for dashboards and settings.

**Location**: `src/components/open-house/sync-status-display.tsx`

**Features**:

- Full card layout with detailed information
- Shows all sync metrics (pending, failed, conflicts, last sync)
- Manual sync and retry actions
- Toast notifications for actions

**Usage**:

```tsx
import { SyncStatusDisplay } from "@/components/open-house/sync-status-display";

// In dashboard or settings
<div className="grid gap-6 md:grid-cols-2">
  <Card>Statistics</Card>
  <SyncStatusDisplay />
</div>;
```

**Requirements**: Validates Requirements 8.5

---

### 6. SyncProgressIndicator

**Purpose**: Detailed sync progress with visual feedback.

**Location**: `src/components/open-house/sync-progress-indicator.tsx`

**Features**:

- Progress bar with percentage
- Estimated time remaining
- Success/failure counts
- Optional detailed operation list
- Summary statistics

**Usage**:

```tsx
import { SyncProgressIndicator } from '@/components/open-house/sync-progress-indicator';

// Basic usage
<SyncProgressIndicator />

// With detailed operation list
<SyncProgressIndicator showDetails />
```

**Requirements**: Validates Requirements 8.1, 8.5

---

### 7. SyncProgressBar

**Purpose**: Minimal inline progress bar for sync operations.

**Location**: `src/components/open-house/sync-progress-indicator.tsx` (exported)

**Features**:

- Compact single-line display
- Progress percentage
- Auto-hides when not syncing

**Usage**:

```tsx
import { SyncProgressBar } from "@/components/open-house/sync-progress-indicator";

// Above lists or content areas
<div>
  <h2>Visitors</h2>
  <SyncProgressBar />
  {/* List content */}
</div>;
```

---

## Integration Patterns

### Pattern 1: Critical Action Pages

For pages where users perform critical actions (check-in, forms):

```tsx
function CheckInPage() {
  return (
    <div>
      <OfflineStatusIndicator position="fixed-top" />
      <div className="pt-16">{/* Page content */}</div>
    </div>
  );
}
```

### Pattern 2: Navigation Bars

For persistent navigation:

```tsx
function Navigation() {
  return (
    <nav className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Logo />
        <OfflineBadge />
      </div>
      <SyncStatusIndicator />
    </nav>
  );
}
```

### Pattern 3: Forms and Actions

For forms that queue operations:

```tsx
function VisitorForm() {
  return (
    <form>
      <OfflineMessage />
      {/* Form fields */}
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

### Pattern 4: Dashboards

For overview and monitoring pages:

```tsx
function Dashboard() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>Statistics</Card>
      <SyncStatusDisplay />
      <SyncProgressIndicator showDetails />
    </div>
  );
}
```

### Pattern 5: Lists with Sync

For lists that might have pending operations:

```tsx
function VisitorList() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2>Visitors</h2>
        <OfflineBadge />
      </div>
      <SyncProgressBar />
      {/* List items */}
    </div>
  );
}
```

## Best Practices

### 1. Visibility Hierarchy

Use components based on importance and context:

- **Critical**: `OfflineStatusIndicator` (fixed position)
- **Important**: `SyncStatusDisplay` (card in main content)
- **Contextual**: `OfflineBadge`, `OfflineMessage` (inline)
- **On-demand**: `SyncStatusIndicator` (popover)

### 2. Positioning

- **Fixed Top**: Use for pages where offline awareness is critical (check-in, forms)
- **Fixed Bottom**: Use when top space is constrained
- **Inline**: Use in modals, dialogs, or specific sections
- **Navigation**: Use badges and popovers for persistent but subtle indicators

### 3. Progressive Disclosure

Start subtle and provide details on demand:

1. Badge in navigation (always visible, minimal)
2. Popover on click (more details)
3. Full card in settings/dashboard (comprehensive)

### 4. Contextual Messaging

Tailor messages to the context:

- **Forms**: "Changes will sync when connection is restored"
- **Lists**: "X operations pending sync"
- **Actions**: "This action will be queued for sync"

### 5. Visual Consistency

Use consistent colors across components:

- **Offline**: Red/Orange (`destructive` variant)
- **Syncing**: Blue (`primary` variant)
- **Pending**: Yellow (`secondary` variant)
- **Success**: Green (`default` variant)
- **Failed**: Red (`destructive` variant)

### 6. Accessibility

All components include:

- Semantic HTML with proper ARIA labels
- Keyboard navigation support
- Screen reader friendly text
- High contrast colors
- Clear visual indicators

### 7. Performance

Components are optimized for:

- Minimal re-renders (using React hooks efficiently)
- Lazy loading (only render when needed)
- Efficient polling (5-second intervals)
- Auto-cleanup on unmount

## Testing

### Manual Testing Checklist

- [ ] Offline indicator appears when going offline
- [ ] Pending count updates when operations are queued
- [ ] Sync progress shows during sync operations
- [ ] Success/failure states display correctly
- [ ] Manual sync button works
- [ ] Retry failed button works
- [ ] Last sync timestamp updates
- [ ] Components auto-hide when appropriate
- [ ] Popover opens and closes correctly
- [ ] Toast notifications appear for actions

### Testing Offline Mode

To test offline functionality:

1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Perform actions (check-in, updates)
4. Verify operations are queued
5. Set throttling back to "Online"
6. Verify automatic sync occurs

### Testing Sync Progress

To test sync progress:

1. Go offline
2. Perform multiple operations (5-10)
3. Go back online
4. Watch sync progress indicator
5. Verify progress bar updates
6. Verify success/failure counts

## Troubleshooting

### Component Not Showing

**Issue**: Offline indicator doesn't appear when offline

**Solutions**:

- Check if `useOfflineSync` hook is initialized
- Verify connectivity monitor is working
- Check browser console for errors
- Ensure component is not hidden by CSS

### Sync Not Triggering

**Issue**: Manual sync button doesn't work

**Solutions**:

- Verify online status
- Check if sync is already in progress
- Verify pending operations exist
- Check browser console for errors

### Progress Not Updating

**Issue**: Sync progress bar doesn't update

**Solutions**:

- Verify `lastSyncResults` is being updated
- Check polling interval (5 seconds)
- Ensure component is mounted during sync
- Check for React rendering issues

## Requirements Validation

These components validate the following requirements:

- **Requirement 8.1**: Offline indicator displays when device loses connectivity
- **Requirement 8.5**: Sync status displays pending operations count and last sync timestamp

## Related Documentation

- [Offline Storage Guide](../../lib/offline/README.md)
- [Sync Service Documentation](../../lib/offline/INTEGRATION_GUIDE.md)
- [Conflict Resolution Guide](../../lib/offline/CONFLICT_RESOLUTION.md)
- [Integration Examples](./offline-ui-integration-example.tsx)

## Future Enhancements

Potential improvements for future iterations:

1. **Customizable Themes**: Allow users to customize indicator colors
2. **Sound Notifications**: Optional audio feedback for sync events
3. **Detailed Logs**: Expandable log viewer for sync history
4. **Bandwidth Indicators**: Show network speed/quality
5. **Sync Scheduling**: Allow users to control when sync occurs
6. **Conflict Resolution UI**: Interactive conflict resolution interface
7. **Analytics**: Track offline usage patterns
8. **Notifications**: Browser notifications for sync completion

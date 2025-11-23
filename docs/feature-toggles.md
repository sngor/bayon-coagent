# Feature Toggle System

The feature toggle system allows users to enable/disable specific hubs and features in the Bayon Coagent application. This provides a customizable experience where users can hide features they don't use.

## Overview

- **Client-side storage**: Feature preferences are stored in localStorage
- **Real-time updates**: Changes take effect immediately without page refresh
- **Navigation filtering**: Disabled hubs are hidden from the sidebar navigation
- **Route protection**: Accessing disabled features shows a helpful message with re-enable option

## Components

### 1. Feature Toggle Manager (`src/lib/feature-toggles.ts`)

Core system that manages feature states:

```typescript
import { featureToggleManager } from "@/lib/feature-toggles";

// Check if a feature is enabled
const isEnabled = featureToggleManager.isEnabled("studio");

// Toggle a feature
featureToggleManager.toggleFeature("studio");

// Get all enabled hubs
const enabledHubs = featureToggleManager.getEnabledHubs();
```

### 2. Feature Toggles UI (`src/components/feature-toggles.tsx`)

Settings page component for managing toggles:

- Visual switches for each feature
- Hub categorization
- Reset to defaults option
- Usage warnings

### 3. Feature Guard (`src/components/feature-guard.tsx`)

Route protection component:

```typescript
import { FeatureGuard } from "@/components/feature-guard";

export default function StudioLayout({ children }) {
  return <FeatureGuard featureId="studio">{children}</FeatureGuard>;
}
```

### 4. React Hooks

```typescript
import { useFeatureToggle, useFeatureToggles } from "@/lib/feature-toggles";

// Single feature hook
const { enabled, toggle } = useFeatureToggle("studio");

// All features hook
const { features, toggleFeature, resetToDefaults } = useFeatureToggles();
```

## Available Features

### Hubs

- **studio**: Content creation (Write, Describe, Reimagine)
- **brand**: Brand identity and strategy
- **market**: Market intelligence and research
- **tools**: Deal analysis and calculations
- **library**: Content and knowledge management
- **training**: Learning and development

### Other Features

- **assistant**: AI chat assistant

## Implementation Guide

### 1. Add Feature Guard to Hub Layouts

Wrap hub layouts with `FeatureGuard`:

```typescript
// src/app/(app)/studio/layout.tsx
import { FeatureGuard } from "@/components/feature-guard";

export default function StudioLayout({ children }) {
  return (
    <FeatureGuard featureId="studio">
      <HubLayout {...props}>{children}</HubLayout>
    </FeatureGuard>
  );
}
```

### 2. Update Navigation

The main app layout automatically filters navigation items based on enabled features.

### 3. Add New Features

To add a new toggleable feature:

1. Add to `DEFAULT_FEATURES` in `src/lib/feature-toggles.ts`
2. Update navigation items in `src/app/(app)/layout.tsx`
3. Add FeatureGuard to the feature's layout

## User Experience

### Settings Page

- Navigate to Settings → Features tab
- Toggle features on/off with visual switches
- See immediate feedback with hub count badge
- Reset all features to defaults

### Disabled Feature Access

When users try to access a disabled feature:

- Friendly message explaining the feature is disabled
- Direct link to enable in settings
- Option to go back to dashboard
- Feature description for context

### Navigation

- Disabled hubs are hidden from sidebar
- Real-time updates when toggles change
- Dashboard always remains accessible

## Technical Details

### Storage

- Uses localStorage with key `bayon-feature-toggles`
- Graceful fallback to defaults if storage fails
- Merges with defaults when new features are added

### Events

- `featureToggleChanged`: Fired when individual features change
- `featureToggleReset`: Fired when all features reset to defaults
- Components automatically listen and update

### Performance

- Minimal overhead with singleton pattern
- Event-driven updates prevent unnecessary re-renders
- Client-side only (no server requests)

## Best Practices

1. **Always provide fallbacks**: Handle cases where features are disabled
2. **Clear messaging**: Explain why features are unavailable
3. **Easy re-enabling**: Provide direct links to settings
4. **Preserve core functionality**: Keep essential features always enabled
5. **Test thoroughly**: Verify all combinations of enabled/disabled features

## Future Enhancements

- Server-side feature flags for admin control
- User role-based feature access
- Feature usage analytics
- Gradual feature rollouts
- Feature dependencies and conflicts

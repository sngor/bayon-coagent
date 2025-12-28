# Hub Components Documentation

## Overview

The hub components provide a consistent navigation and layout system for the Bayon Coagent application. They implement the hub-based architecture where each major feature area (Brand, Studio, Market, etc.) has its own dedicated hub with tabbed navigation.

## Components

### HubTabs

The main tab navigation component used across all hubs for consistent user experience.

#### Props

```typescript
interface HubTabsProps {
  tabs: HubTab[];
  activeTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  isSticky?: boolean;
}

interface HubTab {
  id: string;
  label: string;
  href: string;
  icon?: LucideIcon;
  badge?: number | string;
}
```

#### Features

- **Responsive Design**: Automatically handles overflow with horizontal scrolling
- **Mobile-First Margins**: Progressive margin system (0 → 4 → 6) for optimal mobile experience
- **Keyboard Navigation**: Arrow key navigation with proper focus management
- **Visual Indicators**: Gradient scroll indicators show when content is scrollable
- **Auto-centering**: Active tab automatically scrolls into view
- **Multiple Variants**: Support for default, pills, and underline styles
- **Badge Support**: Optional badges for tab items (numbers or strings)
- **Icon Support**: Optional Lucide icons for visual enhancement

#### Usage

```tsx
import { HubTabs } from '@/components/hub/hub-tabs';
import { Home, Users, Settings } from 'lucide-react';

const tabs = [
  { id: 'overview', label: 'Overview', href: '/dashboard', icon: Home },
  { id: 'clients', label: 'Clients', href: '/clients', icon: Users, badge: 5 },
  { id: 'settings', label: 'Settings', href: '/settings', icon: Settings }
];

<HubTabs 
  tabs={tabs}
  activeTab="overview"
  variant="default"
  isSticky={false}
/>
```

#### Variants

1. **Default**: Rounded pill-style tabs with background highlighting and subtle borders
   - Active: Blue background with matching border (`bg-blue-50 border-blue-200`)
   - Inactive: Transparent background with subtle hover effects
2. **Pills**: Similar to default with subtle styling differences
3. **Underline**: Bottom-border style tabs with underline highlighting
   - Active: Blue underline border (`border-blue-600`)
   - Inactive: Transparent border with hover effects

**Note**: The AnimatedTabs component (used in tech stack guidelines) features fully rounded pill styling with `rounded-full` borders for a modern, polished appearance.

#### Recent Updates

- **Enhanced Active State Styling**: Added border styling to active tabs in default variant for better visual distinction
- **ARIA Compliance Improvements**: 
  - Fixed `aria-selected` attribute to use boolean values instead of strings for better accessibility compliance
  - Maintained proper `tablist` and `tab` role hierarchy for screen reader compatibility
  - Enhanced keyboard navigation with proper focus management
- **Performance Optimizations**: Removed unused refs and improved memoization for better rendering performance

### HubLayout

Provides consistent layout structure for all hub pages.

#### Props

```typescript
interface HubLayoutProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  tabs?: HubTab[];
  children: React.ReactNode;
  actions?: React.ReactNode;
  tabsVariant?: 'default' | 'pills' | 'underline';
}
```

#### Usage

```tsx
import { HubLayout } from '@/components/hub/hub-layout';
import { Palette } from 'lucide-react';

<HubLayout
  title="Brand Hub"
  description="Build your professional brand and market presence"
  icon={Palette}
  tabs={brandTabs}
  tabsVariant="default"
  actions={<Button>New Campaign</Button>}
>
  {children}
</HubLayout>
```

### HubHeader

Displays hub title, description, icon, and optional actions.

#### Props

```typescript
interface HubHeaderProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  actions?: React.ReactNode;
}
```

### HubBreadcrumbs

Navigation breadcrumbs for showing current location within hub hierarchy.

#### Props

```typescript
interface HubBreadcrumbsProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
}

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: LucideIcon;
}
```

## Hub Architecture

### Navigation Hierarchy

```
Level 1: Main Navigation (Sidebar) - 11 primary hubs
├─ Dashboard (Overview hub)
├─ Assistant (AI chat hub)  
├─ Brand (7 tabs: Profile, Audit, Competitors, Strategy, Calendar, Integrations, Testimonials)
├─ Studio (5 tabs: Write, Describe, Reimagine, Open House, Post Cards)
├─ Research (Unified research capabilities)
├─ Market (5 tabs: Insights, News, Analytics, Opportunities, Alerts)
├─ Tools (4 tabs: Calculator, ROI, Valuation, Document Scanner)
├─ Library (4 tabs: Content, Reports, Media, Templates)
├─ Clients (Client management hub)
├─ Open House (Event management hub)
└─ Learning (8 tabs: Lessons, Tutorials, Role-Play, AI Plan, Best Practices, Certification, Community, Courses)

Level 2: Hub Tabs (Horizontal) - 4-8 tabs per hub
└─ Level 3: Section Content (Page-specific)
    └─ Level 4: Feature Details (Modal/Drawer)
```

### File Structure

```
/src/app/(app)/
├─ /dashboard/          # Dashboard hub
├─ /assistant/          # AI Assistant hub
├─ /brand/              # Brand hub with 7 tabs
│  ├─ /profile/
│  ├─ /audit/
│  ├─ /competitors/
│  ├─ /strategy/
│  ├─ /calendar/
│  ├─ /integrations/
│  └─ /testimonials/
├─ /studio/             # Content creation hub with 5 tabs
│  ├─ /write/
│  ├─ /describe/
│  ├─ /reimagine/
│  ├─ /open-house/
│  └─ /post-cards/
└─ ... (other hubs)
```

## Styling System

### Responsive Margins

All hub components use consistent responsive margins for optimal mobile experience:
- Mobile (< 640px): `mx-0` (0px) - Full width utilization
- Small screens (≥ 640px): `mx-4` (16px)  
- Medium+ screens (≥ 768px): `mx-6` (24px)

This progressive margin system ensures maximum screen real estate usage on mobile devices while maintaining appropriate spacing on larger screens.

### Theme Integration

Components integrate with the application's design system:
- Uses CSS custom properties for colors
- Supports light/dark mode automatically
- Consistent with shadcn/ui component library

### Performance Optimizations

- **Memoized Styles**: Style calculations are memoized to prevent re-renders
- **Efficient Scrolling**: Scroll detection uses optimized event handlers
- **Lazy Loading**: Tab content can be lazy-loaded for better performance

## Accessibility

### ARIA Support

- Proper `role="tablist"` and `role="tab"` attributes with correct hierarchy
- `aria-controls` and `aria-selected` for screen readers (using boolean values for compliance)
- `tabindex` management for keyboard navigation
- Descriptive `aria-label` attributes for context

### Keyboard Navigation

- Arrow keys for tab navigation
- Enter/Space for tab activation
- Focus management with visual indicators

### Screen Reader Support

- Descriptive labels for all interactive elements
- Badge announcements (e.g., "5 items")
- Status updates for active tab changes

## Best Practices

### Tab Organization

1. **Logical Grouping**: Group related functionality within hubs
2. **Consistent Ordering**: Maintain consistent tab order across similar hubs
3. **Clear Labels**: Use concise, descriptive tab labels
4. **Icon Usage**: Use icons consistently to aid recognition

### Performance

1. **Lazy Loading**: Implement lazy loading for tab content when appropriate
2. **Memoization**: Use React.memo for tab components that don't change frequently
3. **Efficient Updates**: Minimize re-renders with proper dependency arrays

### UX Guidelines

1. **Active State**: Always show clear active tab indication
2. **Loading States**: Provide loading feedback for tab content
3. **Error Handling**: Handle navigation errors gracefully
4. **Mobile Experience**: Ensure touch-friendly interactions on mobile devices

## Migration Guide

### From Legacy Navigation

When migrating from legacy navigation patterns:

1. **Identify Hub Structure**: Group related features into logical hubs
2. **Map URLs**: Update routing to match new hub-based structure
3. **Update Components**: Replace old navigation with HubTabs
4. **Test Accessibility**: Verify keyboard navigation and screen reader support

### URL Redirects

The application includes automatic redirects for legacy URLs:

```typescript
// Example redirects in middleware
'/content-engine' → '/studio/write'
'/brand-center' → '/brand/profile'
'/market/calculator' → '/tools/calculator'
```

See `/src/lib/redirects.ts` for complete mapping.

## Testing

### Unit Tests

Test hub components with:
- Tab navigation functionality
- Keyboard accessibility
- Responsive behavior
- Active state management

### Integration Tests

Verify:
- Hub-to-hub navigation
- URL routing accuracy
- State persistence across tabs
- Mobile responsiveness

### Accessibility Tests

Use tools like:
- axe-core for automated accessibility testing
- Screen reader testing (NVDA, JAWS, VoiceOver)
- Keyboard-only navigation testing
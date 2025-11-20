# Feature Consolidation - Design Document

## Architecture Overview

### Hub-Based Architecture

Each hub follows a consistent pattern:

```
/[hub-name]
  ├── layout.tsx          # Hub-specific layout with tabs
  ├── page.tsx            # Hub landing/overview page
  └── /[section]          # Individual sections
      ├── page.tsx        # Section page
      └── /[feature]      # Nested features
          └── page.tsx
```

### Navigation Hierarchy

```
Level 1: Main Navigation (Sidebar)
  └─ Level 2: Hub Tabs (Horizontal tabs)
      └─ Level 3: Section Content (Page-specific)
          └─ Level 4: Feature Details (Modal/Drawer)
```

## Component Design

### 1. HubLayout Component

**Purpose**: Consistent layout wrapper for all hubs

**Props**:

```typescript
interface HubLayoutProps {
  title: string;
  description?: string;
  icon: React.ComponentType;
  tabs: HubTab[];
  children: React.ReactNode;
  actions?: React.ReactNode;
}

interface HubTab {
  id: string;
  label: string;
  href: string;
  icon?: React.ComponentType;
  badge?: number | string;
}
```

**Features**:

- Sticky header with hub title and icon
- Horizontal tab navigation
- Breadcrumb navigation
- Optional action buttons
- Responsive design (tabs → dropdown on mobile)

**Example Usage**:

```tsx
<HubLayout
  title="Studio"
  description="Create and edit all your marketing content"
  icon={Wand2}
  tabs={[
    { id: "write", label: "Write", href: "/studio/write", icon: FileText },
    { id: "describe", label: "Describe", href: "/studio/describe", icon: Home },
    {
      id: "reimagine",
      label: "Reimagine",
      href: "/studio/reimagine",
      icon: Wand2,
    },
  ]}
  actions={<Button>New Content</Button>}
>
  {children}
</HubLayout>
```

---

### 2. HubTabs Component

**Purpose**: Tab navigation within hubs

**Props**:

```typescript
interface HubTabsProps {
  tabs: HubTab[];
  activeTab: string;
  onChange?: (tabId: string) => void;
  variant?: "default" | "pills" | "underline";
}
```

**Features**:

- Active state indication
- Keyboard navigation (arrow keys)
- Badge support for notifications
- Responsive (horizontal scroll on mobile)
- Smooth transitions

**Variants**:

- `default`: Standard tabs with border
- `pills`: Rounded pill-style tabs
- `underline`: Minimal underline style

---

### 3. HubBreadcrumbs Component

**Purpose**: Show navigation path within hubs

**Props**:

```typescript
interface HubBreadcrumbsProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
}

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType;
}
```

**Example**:

```
Dashboard > Studio > Write > Blog Posts
```

---

### 4. ContentLibrary Component

**Purpose**: Shared content library across Studio tabs

**Props**:

```typescript
interface ContentLibraryProps {
  contentType?: "all" | "write" | "describe" | "reimagine";
  onSelect?: (content: SavedContent) => void;
  showFilters?: boolean;
}
```

**Features**:

- Filter by content type
- Search functionality
- Sort options (date, name, type)
- Grid/list view toggle
- Bulk actions (delete, export)
- Preview on hover

---

### 5. SavedReports Component

**Purpose**: Shared reports library in Intelligence hub

**Props**:

```typescript
interface SavedReportsProps {
  reportType?: "all" | "research" | "competitor" | "market";
  onSelect?: (report: Report) => void;
  showFilters?: boolean;
}
```

**Features**:

- Filter by report type
- Search functionality
- Sort options
- Tags and categories
- Export options
- Share functionality (future)

---

## Hub-Specific Designs

### Studio Hub

#### Layout Structure

```
┌─────────────────────────────────────────────────────┐
│ 🎨 Studio                                    [New] │
│ Create and edit all your marketing content         │
├─────────────────────────────────────────────────────┤
│ [Write] [Describe] [Reimagine]                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Tab Content Area                                   │
│                                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### Write Tab (/studio/write)

**Content Types**:

- Neighborhood Guides
- Social Media Posts
- Market Updates
- Video Scripts
- Blog Posts

**Layout**:

```
┌─────────────────────────────────────────────────────┐
│ Content Type Cards (Grid)                           │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│ │ Blog     │ │ Social   │ │ Market   │            │
│ │ Posts    │ │ Media    │ │ Updates  │            │
│ └──────────┘ └──────────┘ └──────────┘            │
│                                                     │
│ Recent Content                                      │
│ ┌─────────────────────────────────────────────┐   │
│ │ Blog Post Title                    [Edit]   │   │
│ │ Created 2 days ago                          │   │
│ └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

#### Describe Tab (/studio/describe)

**Features**:

- Persona-driven listing descriptions
- Property details form
- AI generation
- Multiple variations

**Layout**:

```
┌─────────────────────────────────────────────────────┐
│ Property Details Form                               │
│ ┌─────────────────────────────────────────────┐   │
│ │ Address: [________________]                 │   │
│ │ Bedrooms: [__] Bathrooms: [__]             │   │
│ │ Target Persona: [Dropdown]                  │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ Generated Descriptions                              │
│ ┌─────────────────────────────────────────────┐   │
│ │ Variation 1                        [Copy]   │   │
│ │ [Description text...]                       │   │
│ └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

#### Reimagine Tab (/studio/reimagine)

**Features**:

- Image upload
- Edit type selection
- Before/after comparison
- Edit history

**Layout**: Keep existing Reimagine layout (already well-designed)

---

### Intelligence Hub

#### Layout Structure

```
┌─────────────────────────────────────────────────────┐
│ 🧠 Intelligence                          [New]     │
│ AI-powered research and market insights             │
├─────────────────────────────────────────────────────┤
│ [Research] [Competitors] [Market Insights]         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Tab Content Area                                   │
│                                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### Research Tab (/intelligence/research)

**Sub-tabs**:

- New Research
- Saved Reports

**New Research Layout**:

```
┌─────────────────────────────────────────────────────┐
│ Research Topic                                      │
│ ┌─────────────────────────────────────────────┐   │
│ │ What would you like to research?            │   │
│ │ [_____________________________________]     │   │
│ │                                             │   │
│ │ [Start Research]                            │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ Recent Research                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Market Trends in Austin                     │   │
│ │ Completed 1 hour ago              [View]    │   │
│ └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**Saved Reports Layout**:

```
┌─────────────────────────────────────────────────────┐
│ [Search] [Filter: All ▼] [Sort: Recent ▼]         │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ 📄 Market Analysis - Austin                 │   │
│ │ Research • Nov 15, 2025 • 12 pages          │   │
│ │ [View] [Export] [Delete]                    │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ 📊 Competitor Deep Dive                     │   │
│ │ Competitor • Nov 14, 2025 • 8 pages         │   │
│ │ [View] [Export] [Delete]                    │   │
│ └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

#### Competitors Tab (/intelligence/competitors)

**Features**:

- Competitor discovery
- Ranking tracking
- Performance comparison

**Layout**: Keep existing Competitive Analysis layout

#### Market Insights Tab (/intelligence/market-insights)

**Tool Cards**:

```
┌─────────────────────────────────────────────────────┐
│ Market Intelligence Tools                           │
│                                                     │
│ ┌──────────────────────┐ ┌──────────────────────┐ │
│ │ 💰 Investment        │ │ 💝 Life Event        │ │
│ │ Opportunities        │ │ Predictor            │ │
│ │                      │ │                      │ │
│ │ Identify properties  │ │ Predict life events  │ │
│ │ with high ROI        │ │ that trigger moves   │ │
│ │                      │ │                      │ │
│ │ [Launch Tool]        │ │ [Launch Tool]        │ │
│ └──────────────────────┘ └──────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

### Brand Center Hub

#### Layout Structure

```
┌─────────────────────────────────────────────────────┐
│ 🎯 Brand Center                                     │
│ Your brand identity and marketing strategy          │
├─────────────────────────────────────────────────────┤
│ [Profile] [Audit] [Strategy]                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Tab Content Area                                   │
│                                                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### Profile Tab (/brand-center/profile)

**Sections**:

- Basic Information
- Professional Details
- Service Areas
- Integrations

**Layout**: Keep existing Profile layout with better organization

#### Audit Tab (/brand-center/audit)

**Features**:

- NAP consistency check
- Review import
- Online presence scan

**Layout**: Keep existing Brand Audit layout

#### Strategy Tab (/brand-center/strategy)

**Features**:

- Brand audit summary
- Competitor analysis summary
- AI-generated 3-step plan

**Layout**: Keep existing Marketing Plan layout

**Progress Indicator**:

```
┌─────────────────────────────────────────────────────┐
│ Your Marketing Strategy Progress                    │
│                                                     │
│ ① Profile Complete ✓                                │
│ ② Brand Audit Complete ✓                            │
│ ③ Strategy Generated ✓                              │
│                                                     │
│ [View Full Plan]                                    │
└─────────────────────────────────────────────────────┘
```

---

## Navigation Components

### Main Sidebar Navigation

**Updated Items**:

```typescript
const navItems = [
  { href: "/dashboard", icon: HouseIcon, label: "Dashboard" },
  { href: "/studio", icon: Wand2, label: "Studio" },
  { href: "/intelligence", icon: Brain, label: "Intelligence" },
  { href: "/brand-center", icon: Target, label: "Brand Center" },
  { href: "/projects", icon: Folder, label: "Projects" },
  { href: "/training", icon: GraduationCap, label: "Training" },
];
```

**Active State Logic**:

- Highlight hub when any sub-route is active
- Show subtle indicator for active tab within hub

---

## Responsive Design

### Desktop (≥1024px)

- Full sidebar navigation
- Horizontal tabs
- Multi-column layouts
- Side-by-side comparisons

### Tablet (768px - 1023px)

- Collapsible sidebar
- Horizontal tabs (scrollable)
- Single column layouts
- Stacked comparisons

### Mobile (<768px)

- Bottom navigation bar for main hubs
- Tabs become dropdown menu
- Single column layouts
- Full-screen modals

---

## State Management

### URL State

**Hub Navigation**:

```
/studio/write
/studio/describe
/studio/reimagine
```

**Tab State**:

```
/intelligence/research?tab=saved
/intelligence/market-insights?tool=investment
```

**Filters & Search**:

```
/studio/write?type=blog&sort=recent&search=austin
```

### Local Storage

**User Preferences**:

```typescript
interface HubPreferences {
  studio: {
    defaultTab: "write" | "describe" | "reimagine";
    viewMode: "grid" | "list";
    sortBy: "recent" | "name" | "type";
  };
  intelligence: {
    defaultTab: "research" | "competitors" | "market-insights";
    viewMode: "grid" | "list";
  };
  brandCenter: {
    defaultTab: "profile" | "audit" | "strategy";
  };
}
```

### Context Providers

**HubContext**:

```typescript
interface HubContextValue {
  currentHub: string;
  currentTab: string;
  setTab: (tab: string) => void;
  breadcrumbs: BreadcrumbItem[];
}
```

---

## Transitions & Animations

### Tab Switching

**Animation**:

- Fade out current content (150ms)
- Fade in new content (150ms)
- Total transition: 300ms

**Implementation**:

```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={activeTab}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.15 }}
  >
    {tabContent}
  </motion.div>
</AnimatePresence>
```

### Navigation

**Sidebar Collapse**:

- Smooth width transition (200ms)
- Icon-only mode on collapse
- Tooltip on hover

**Mobile Bottom Nav**:

- Slide up on scroll down
- Slide down on scroll up
- Always visible on tap

---

## Accessibility

### Keyboard Navigation

**Tab Navigation**:

- `Tab`: Move between tabs
- `Arrow Left/Right`: Switch tabs
- `Enter/Space`: Activate tab
- `Escape`: Close modals/drawers

**Hub Navigation**:

- `Cmd/Ctrl + K`: Open command palette (future)
- `Cmd/Ctrl + 1-6`: Jump to hub
- `Cmd/Ctrl + [/]`: Previous/next tab

### Screen Readers

**Announcements**:

- "Navigated to Studio hub, Write tab"
- "Loading content..."
- "Content loaded, 12 items"

**ARIA Labels**:

```tsx
<nav aria-label="Hub navigation">
  <button role="tab" aria-selected={isActive} aria-controls="tab-panel">
    Write
  </button>
</nav>
```

### Focus Management

- Preserve focus on tab switch
- Focus first interactive element on page load
- Trap focus in modals
- Skip links for keyboard users

---

## Performance Optimization

### Code Splitting

**Hub-Level Splitting**:

```typescript
const StudioHub = lazy(() => import("@/app/(app)/studio/layout"));
const IntelligenceHub = lazy(() => import("@/app/(app)/intelligence/layout"));
const BrandCenterHub = lazy(() => import("@/app/(app)/brand-center/layout"));
```

**Tab-Level Splitting**:

```typescript
const WriteTab = lazy(() => import("@/app/(app)/studio/write/page"));
const DescribeTab = lazy(() => import("@/app/(app)/studio/describe/page"));
const ReimagineTab = lazy(() => import("@/app/(app)/studio/reimagine/page"));
```

### Prefetching

**On Hub Load**:

- Prefetch all tab components
- Prefetch common data

**On Tab Hover**:

- Prefetch tab data
- Warm up API connections

### Caching

**React Query**:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});
```

---

## Error Handling

### Hub-Level Errors

**Error Boundary**:

```tsx
<HubErrorBoundary fallback={<HubErrorFallback />} onError={logError}>
  <HubContent />
</HubErrorBoundary>
```

**Fallback UI**:

- Show error message
- Offer retry button
- Link to support
- Preserve navigation

### Tab-Level Errors

**Graceful Degradation**:

- Show error in tab content area
- Keep other tabs functional
- Log error for debugging
- Offer alternative actions

---

## Analytics Tracking

### Events to Track

**Navigation**:

- `hub_viewed`: User enters hub
- `tab_switched`: User switches tabs
- `feature_accessed`: User accesses specific feature

**Engagement**:

- `content_created`: User creates content
- `report_generated`: User generates report
- `tool_used`: User uses specific tool

**Performance**:

- `hub_load_time`: Time to load hub
- `tab_switch_time`: Time to switch tabs
- `feature_load_time`: Time to load feature

### Implementation

```typescript
// Track hub view
trackEvent("hub_viewed", {
  hub: "studio",
  timestamp: Date.now(),
  userId: user.id,
});

// Track tab switch
trackEvent("tab_switched", {
  hub: "studio",
  fromTab: "write",
  toTab: "describe",
  timestamp: Date.now(),
});
```

---

## Testing Strategy

### Unit Tests

**Components**:

- HubLayout rendering
- HubTabs interaction
- HubBreadcrumbs navigation
- ContentLibrary filtering

### Integration Tests

**Hub Navigation**:

- Navigate between hubs
- Switch tabs within hub
- Deep link to specific tab
- Redirect from old URLs

### E2E Tests

**User Flows**:

- Complete onboarding flow
- Create content in Studio
- Generate research report
- Run brand audit

### Visual Regression Tests

**Screenshots**:

- Hub layouts (all hubs)
- Tab navigation states
- Responsive breakpoints
- Dark mode variants

---

## Migration Checklist

### Pre-Migration

- [ ] Audit all existing routes
- [ ] Document all internal links
- [ ] Identify external links
- [ ] Create redirect mapping
- [ ] Set up analytics tracking

### During Migration

- [ ] Create new hub structure
- [ ] Move features to hubs
- [ ] Implement redirects
- [ ] Update internal links
- [ ] Test all workflows

### Post-Migration

- [ ] Monitor error rates
- [ ] Track user feedback
- [ ] Analyze usage patterns
- [ ] Optimize performance
- [ ] Update documentation

---

## Design Tokens

### Colors

**Hub Colors** (for visual distinction):

```css
--studio-primary: hsl(280, 70%, 60%); /* Purple */
--intelligence-primary: hsl(210, 70%, 60%); /* Blue */
--brand-center-primary: hsl(25, 70%, 60%); /* Orange */
```

### Spacing

**Hub Layout**:

```css
--hub-header-height: 120px;
--hub-tabs-height: 48px;
--hub-content-padding: 24px;
```

### Typography

**Hub Titles**:

```css
--hub-title-size: 2rem;
--hub-title-weight: 700;
--hub-description-size: 1rem;
--hub-description-weight: 400;
```

---

## Future Enhancements

### Phase 2 (Post-Launch)

1. **Command Palette**: Quick navigation with Cmd+K
2. **Favorites**: Pin frequently used features
3. **Recent Items**: Quick access to recent work
4. **Workspace Switcher**: Multiple workspaces
5. **Collaboration**: Share and collaborate
6. **Templates**: Pre-built workflows
7. **Automation**: Automated workflows between hubs
8. **Mobile App**: Native mobile experience

### Phase 3 (Long-term)

1. **AI Assistant**: Contextual help and suggestions
2. **Custom Dashboards**: Personalized hub layouts
3. **Advanced Analytics**: Usage insights and recommendations
4. **Integration Marketplace**: Third-party integrations
5. **White Label**: Custom branding for agencies
6. **API Access**: Programmatic access to features

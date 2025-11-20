# Feature Consolidation - Implementation Tasks

## Phase 1: Foundation (Week 1)

### Task 1.1: Create Hub Layout Components

**Priority**: High  
**Estimated Time**: 1 day

**Subtasks**:

- [ ] Create `src/components/hub/hub-layout.tsx`
- [ ] Create `src/components/hub/hub-tabs.tsx`
- [ ] Create `src/components/hub/hub-breadcrumbs.tsx`
- [ ] Create `src/components/hub/hub-header.tsx`
- [ ] Add TypeScript interfaces for all components
- [ ] Add Storybook stories (optional)
- [ ] Write unit tests

**Files to Create**:

```
src/components/hub/
  ├── hub-layout.tsx
  ├── hub-tabs.tsx
  ├── hub-breadcrumbs.tsx
  ├── hub-header.tsx
  └── index.ts
```

**Acceptance Criteria**:

- [ ] Components render correctly
- [ ] Props are properly typed
- [ ] Responsive design works
- [ ] Accessibility features implemented
- [ ] Tests pass

---

### Task 1.2: Set Up New Route Structure

**Priority**: High  
**Estimated Time**: 0.5 days

**Subtasks**:

- [ ] Create `/studio` route structure
- [ ] Create `/intelligence` route structure
- [ ] Create `/brand-center` route structure
- [ ] Create placeholder pages for all routes
- [ ] Add route metadata (titles, descriptions)

**Files to Create**:

```
src/app/(app)/
  ├── studio/
  │   ├── layout.tsx
  │   ├── page.tsx
  │   ├── write/
  │   │   └── page.tsx
  │   ├── describe/
  │   │   └── page.tsx
  │   └── reimagine/
  │       └── page.tsx
  ├── intelligence/
  │   ├── layout.tsx
  │   ├── page.tsx
  │   ├── research/
  │   │   └── page.tsx
  │   ├── competitors/
  │   │   └── page.tsx
  │   └── market-insights/
  │       └── page.tsx
  └── brand-center/
      ├── layout.tsx
      ├── page.tsx
      ├── profile/
      │   └── page.tsx
      ├── audit/
      │   └── page.tsx
      └── strategy/
          └── page.tsx
```

**Acceptance Criteria**:

- [ ] All routes accessible
- [ ] Layouts render correctly
- [ ] Metadata is correct
- [ ] No console errors

---

### Task 1.3: Implement URL Redirects

**Priority**: High  
**Estimated Time**: 0.5 days

**Subtasks**:

- [ ] Create redirect middleware
- [ ] Add redirects for all old URLs
- [ ] Test all redirect paths
- [ ] Add redirect logging for analytics

**Files to Create/Modify**:

```
src/middleware.ts (modify)
src/lib/redirects.ts (create)
```

**Redirect Mapping**:

```typescript
const redirects = {
  "/content-engine": "/studio/write",
  "/listing-description-generator": "/studio/describe",
  "/reimagine": "/studio/reimagine",
  "/research-agent": "/intelligence/research",
  "/knowledge-base": "/intelligence/research?tab=saved",
  "/competitive-analysis": "/intelligence/competitors",
  "/investment-opportunity-identification":
    "/intelligence/market-insights?tool=investment",
  "/life-event-predictor": "/intelligence/market-insights?tool=life-events",
  "/profile": "/brand-center/profile",
  "/brand-audit": "/brand-center/audit",
  "/marketing-plan": "/brand-center/strategy",
  "/training-hub": "/training",
};
```

**Acceptance Criteria**:

- [ ] All old URLs redirect correctly
- [ ] Query params preserved
- [ ] Redirects are logged
- [ ] No redirect loops

---

### Task 1.4: Update Main Navigation

**Priority**: High  
**Estimated Time**: 0.5 days

**Subtasks**:

- [ ] Update `navItems` in `src/app/(app)/layout.tsx`
- [ ] Add new icons for hubs
- [ ] Update active state logic
- [ ] Test navigation on all screen sizes
- [ ] Update mobile navigation

**Files to Modify**:

```
src/app/(app)/layout.tsx
```

**New Navigation Items**:

```typescript
const navItems = [
  { href: "/dashboard", icon: HouseIcon, label: "Dashboard", customIcon: true },
  { href: "/studio", icon: Wand2, label: "Studio" },
  { href: "/intelligence", icon: Brain, label: "Intelligence" },
  { href: "/brand-center", icon: Target, label: "Brand Center" },
  { href: "/projects", icon: Folder, label: "Projects" },
  { href: "/training", icon: GraduationCap, label: "Training" },
];
```

**Acceptance Criteria**:

- [ ] Navigation shows 6 items (7 including Settings in dropdown)
- [ ] Active states work correctly
- [ ] Icons display properly
- [ ] Mobile navigation works
- [ ] Tooltips show on hover

---

### Task 1.5: Create Hub Context Provider

**Priority**: Medium  
**Estimated Time**: 0.5 days

**Subtasks**:

- [ ] Create `src/contexts/hub-context.tsx`
- [ ] Implement context provider
- [ ] Add custom hook `useHub()`
- [ ] Add state management for tabs
- [ ] Add breadcrumb management

**Files to Create**:

```
src/contexts/hub-context.tsx
```

**Context Interface**:

```typescript
interface HubContextValue {
  currentHub: string;
  currentTab: string;
  setTab: (tab: string) => void;
  breadcrumbs: BreadcrumbItem[];
  setBreadcrumbs: (items: BreadcrumbItem[]) => void;
}
```

**Acceptance Criteria**:

- [ ] Context provides hub state
- [ ] Tab switching works
- [ ] Breadcrumbs update correctly
- [ ] State persists on navigation

---

## Phase 2: Studio Hub (Week 2)

### Task 2.1: Create Studio Hub Layout

**Priority**: High  
**Estimated Time**: 1 day

**Subtasks**:

- [ ] Implement Studio hub layout
- [ ] Add tab navigation (Write, Describe, Reimagine)
- [ ] Add hub header with title and actions
- [ ] Implement responsive design
- [ ] Add loading states

**Files to Create/Modify**:

```
src/app/(app)/studio/layout.tsx
src/app/(app)/studio/page.tsx
```

**Acceptance Criteria**:

- [ ] Layout renders correctly
- [ ] Tabs switch smoothly
- [ ] Header shows correct info
- [ ] Responsive on all devices
- [ ] Loading states work

---

### Task 2.2: Move Content Engine to Studio/Write

**Priority**: High  
**Estimated Time**: 1 day

**Subtasks**:

- [ ] Copy Content Engine to `/studio/write`
- [ ] Update all imports and paths
- [ ] Update internal navigation
- [ ] Test all content types
- [ ] Update saved content references

**Files to Move/Modify**:

```
src/app/(app)/content-engine/* → src/app/(app)/studio/write/*
```

**Acceptance Criteria**:

- [ ] All content types work
- [ ] Forms submit correctly
- [ ] AI generation works
- [ ] Saved content accessible
- [ ] No broken links

---

### Task 2.3: Move Listing Description Generator to Studio/Describe

**Priority**: High  
**Estimated Time**: 0.5 days

**Subtasks**:

- [ ] Copy Listing Description Generator to `/studio/describe`
- [ ] Update all imports and paths
- [ ] Update internal navigation
- [ ] Test persona-driven generation
- [ ] Update saved content references

**Files to Move/Modify**:

```
src/app/(app)/listing-description-generator/* → src/app/(app)/studio/describe/*
```

**Acceptance Criteria**:

- [ ] Form works correctly
- [ ] Persona selection works
- [ ] AI generation works
- [ ] Multiple variations generated
- [ ] Saved content accessible

---

### Task 2.4: Move Reimagine to Studio/Reimagine

**Priority**: High  
**Estimated Time**: 1 day

**Subtasks**:

- [ ] Copy Reimagine to `/studio/reimagine`
- [ ] Update all imports and paths
- [ ] Update internal navigation
- [ ] Test all edit types
- [ ] Update S3 paths if needed

**Files to Move/Modify**:

```
src/app/(app)/reimagine/* → src/app/(app)/studio/reimagine/*
```

**Acceptance Criteria**:

- [ ] Image upload works
- [ ] All edit types work
- [ ] Before/after comparison works
- [ ] Edit history accessible
- [ ] S3 integration works

---

### Task 2.5: Create Shared Content Library

**Priority**: Medium  
**Estimated Time**: 1 day

**Subtasks**:

- [ ] Create `ContentLibrary` component
- [ ] Implement filtering by content type
- [ ] Add search functionality
- [ ] Add sort options
- [ ] Implement grid/list view toggle
- [ ] Add bulk actions

**Files to Create**:

```
src/components/content-library.tsx
```

**Acceptance Criteria**:

- [ ] Library shows all content
- [ ] Filtering works
- [ ] Search works
- [ ] Sorting works
- [ ] View toggle works
- [ ] Bulk actions work

---

### Task 2.6: Test Studio Hub End-to-End

**Priority**: High  
**Estimated Time**: 0.5 days

**Subtasks**:

- [ ] Test navigation between tabs
- [ ] Test content creation in each tab
- [ ] Test content library access
- [ ] Test responsive design
- [ ] Test error handling
- [ ] Fix any bugs found

**Acceptance Criteria**:

- [ ] All tabs accessible
- [ ] All features work
- [ ] No console errors
- [ ] Responsive design works
- [ ] Error handling works

---

## Phase 3: Intelligence Hub (Week 3)

### Task 3.1: Create Intelligence Hub Layout

**Priority**: High  
**Estimated Time**: 1 day

**Subtasks**:

- [ ] Implement Intelligence hub layout
- [ ] Add tab navigation (Research, Competitors, Market Insights)
- [ ] Add hub header with title and actions
- [ ] Implement responsive design
- [ ] Add loading states

**Files to Create/Modify**:

```
src/app/(app)/intelligence/layout.tsx
src/app/(app)/intelligence/page.tsx
```

**Acceptance Criteria**:

- [ ] Layout renders correctly
- [ ] Tabs switch smoothly
- [ ] Header shows correct info
- [ ] Responsive on all devices
- [ ] Loading states work

---

### Task 3.2: Move Research Agent to Intelligence/Research

**Priority**: High  
**Estimated Time**: 1 day

**Subtasks**:

- [ ] Copy Research Agent to `/intelligence/research`
- [ ] Update all imports and paths
- [ ] Update internal navigation
- [ ] Test research generation
- [ ] Update report references

**Files to Move/Modify**:

```
src/app/(app)/research-agent/* → src/app/(app)/intelligence/research/*
```

**Acceptance Criteria**:

- [ ] Research form works
- [ ] AI research generation works
- [ ] Report viewing works
- [ ] Report saving works
- [ ] No broken links

---

### Task 3.3: Integrate Knowledge Base as Saved Reports

**Priority**: High  
**Estimated Time**: 1 day

**Subtasks**:

- [ ] Create "Saved Reports" sub-tab in Research
- [ ] Move Knowledge Base functionality
- [ ] Implement report filtering
- [ ] Add search functionality
- [ ] Add export options
- [ ] Update all references

**Files to Move/Modify**:

```
src/app/(app)/knowledge-base/* → src/app/(app)/intelligence/research/* (integrated)
```

**Acceptance Criteria**:

- [ ] Saved Reports tab works
- [ ] All reports accessible
- [ ] Filtering works
- [ ] Search works
- [ ] Export works
- [ ] No data loss

---

### Task 3.4: Move Competitive Analysis to Intelligence/Competitors

**Priority**: High  
**Estimated Time**: 0.5 days

**Subtasks**:

- [ ] Copy Competitive Analysis to `/intelligence/competitors`
- [ ] Update all imports and paths
- [ ] Update internal navigation
- [ ] Test competitor discovery
- [ ] Test ranking tracking

**Files to Move/Modify**:

```
src/app/(app)/competitive-analysis/* → src/app/(app)/intelligence/competitors/*
```

**Acceptance Criteria**:

- [ ] Competitor discovery works
- [ ] Ranking tracking works
- [ ] Performance comparison works
- [ ] Data visualization works
- [ ] No broken links

---

### Task 3.5: Create Market Insights Section

**Priority**: Medium  
**Estimated Time**: 1 day

**Subtasks**:

- [ ] Create Market Insights landing page
- [ ] Move Investment Opportunity tool
- [ ] Move Life Event Predictor tool
- [ ] Create tool selection interface
- [ ] Add tool descriptions
- [ ] Test both tools

**Files to Move/Modify**:

```
src/app/(app)/investment-opportunity-identification/* → src/app/(app)/intelligence/market-insights/*
src/app/(app)/life-event-predictor/* → src/app/(app)/intelligence/market-insights/*
```

**Acceptance Criteria**:

- [ ] Landing page shows both tools
- [ ] Tool selection works
- [ ] Investment tool works
- [ ] Life Event tool works
- [ ] Navigation between tools works

---

### Task 3.6: Create Saved Reports Component

**Priority**: Medium  
**Estimated Time**: 1 day

**Subtasks**:

- [ ] Create `SavedReports` component
- [ ] Implement filtering by report type
- [ ] Add search functionality
- [ ] Add sort options
- [ ] Add tags and categories
- [ ] Add export options

**Files to Create**:

```
src/components/saved-reports.tsx
```

**Acceptance Criteria**:

- [ ] Component shows all reports
- [ ] Filtering works
- [ ] Search works
- [ ] Sorting works
- [ ] Tags work
- [ ] Export works

---

### Task 3.7: Test Intelligence Hub End-to-End

**Priority**: High  
**Estimated Time**: 0.5 days

**Subtasks**:

- [ ] Test navigation between tabs
- [ ] Test research generation
- [ ] Test competitor analysis
- [ ] Test market insights tools
- [ ] Test responsive design
- [ ] Fix any bugs found

**Acceptance Criteria**:

- [ ] All tabs accessible
- [ ] All features work
- [ ] No console errors
- [ ] Responsive design works
- [ ] Error handling works

---

## Phase 4: Brand Center Hub (Week 4)

### Task 4.1: Create Brand Center Hub Layout

**Priority**: High  
**Estimated Time**: 1 day

**Subtasks**:

- [ ] Implement Brand Center hub layout
- [ ] Add tab navigation (Profile, Audit, Strategy)
- [ ] Add hub header with title and actions
- [ ] Add progress indicator
- [ ] Implement responsive design
- [ ] Add loading states

**Files to Create/Modify**:

```
src/app/(app)/brand-center/layout.tsx
src/app/(app)/brand-center/page.tsx
```

**Acceptance Criteria**:

- [ ] Layout renders correctly
- [ ] Tabs switch smoothly
- [ ] Progress indicator works
- [ ] Header shows correct info
- [ ] Responsive on all devices

---

### Task 4.2: Move Profile to Brand Center/Profile

**Priority**: High  
**Estimated Time**: 0.5 days

**Subtasks**:

- [ ] Copy Profile to `/brand-center/profile`
- [ ] Update all imports and paths
- [ ] Update internal navigation
- [ ] Test profile editing
- [ ] Test integrations

**Files to Move/Modify**:

```
src/app/(app)/profile/* → src/app/(app)/brand-center/profile/*
```

**Acceptance Criteria**:

- [ ] Profile form works
- [ ] Profile saving works
- [ ] Integrations work
- [ ] Photo upload works
- [ ] No broken links

---

### Task 4.3: Move Brand Audit to Brand Center/Audit

**Priority**: High  
**Estimated Time**: 0.5 days

**Subtasks**:

- [ ] Copy Brand Audit to `/brand-center/audit`
- [ ] Update all imports and paths
- [ ] Update internal navigation
- [ ] Test NAP consistency check
- [ ] Test review import

**Files to Move/Modify**:

```
src/app/(app)/brand-audit/* → src/app/(app)/brand-center/audit/*
```

**Acceptance Criteria**:

- [ ] NAP check works
- [ ] Review import works
- [ ] Results display correctly
- [ ] Recommendations show
- [ ] No broken links

---

### Task 4.4: Move Marketing Plan to Brand Center/Strategy

**Priority**: High  
**Estimated Time**: 0.5 days

**Subtasks**:

- [ ] Copy Marketing Plan to `/brand-center/strategy`
- [ ] Update all imports and paths
- [ ] Update internal navigation
- [ ] Test plan generation
- [ ] Test plan display

**Files to Move/Modify**:

```
src/app/(app)/marketing-plan/* → src/app/(app)/brand-center/strategy/*
```

**Acceptance Criteria**:

- [ ] Plan generation works
- [ ] Plan displays correctly
- [ ] Steps are actionable
- [ ] Progress tracking works
- [ ] No broken links

---

### Task 4.5: Create Onboarding Wizard

**Priority**: Medium  
**Estimated Time**: 1 day

**Subtasks**:

- [ ] Create wizard component
- [ ] Implement step navigation
- [ ] Add progress indicator
- [ ] Connect to Profile, Audit, Strategy
- [ ] Add completion celebration
- [ ] Test full flow

**Files to Create**:

```
src/components/brand-center/onboarding-wizard.tsx
```

**Acceptance Criteria**:

- [ ] Wizard shows all steps
- [ ] Navigation works
- [ ] Progress saves
- [ ] Completion triggers celebration
- [ ] Can resume later

---

### Task 4.6: Implement Progress Tracking

**Priority**: Medium  
**Estimated Time**: 0.5 days

**Subtasks**:

- [ ] Create progress tracking component
- [ ] Track profile completion
- [ ] Track audit completion
- [ ] Track strategy generation
- [ ] Display progress in hub
- [ ] Add progress to dashboard

**Files to Create**:

```
src/components/brand-center/progress-tracker.tsx
```

**Acceptance Criteria**:

- [ ] Progress tracked correctly
- [ ] Progress displays in hub
- [ ] Progress shows on dashboard
- [ ] Progress updates in real-time
- [ ] Completion triggers celebration

---

### Task 4.7: Test Brand Center Hub End-to-End

**Priority**: High  
**Estimated Time**: 0.5 days

**Subtasks**:

- [ ] Test navigation between tabs
- [ ] Test onboarding wizard
- [ ] Test progress tracking
- [ ] Test all features
- [ ] Test responsive design
- [ ] Fix any bugs found

**Acceptance Criteria**:

- [ ] All tabs accessible
- [ ] Wizard works correctly
- [ ] Progress tracking works
- [ ] All features work
- [ ] No console errors

---

## Phase 5: Polish & Launch (Week 5)

### Task 5.1: Update All Internal Links

**Priority**: High  
**Estimated Time**: 1 day

**Subtasks**:

- [ ] Audit all internal links
- [ ] Update links in components
- [ ] Update links in documentation
- [ ] Update links in emails (if any)
- [ ] Test all links
- [ ] Fix broken links

**Files to Audit**:

```
src/components/**/*
src/app/**/*
docs/**/*
```

**Acceptance Criteria**:

- [ ] All internal links updated
- [ ] No broken links
- [ ] Links use new URLs
- [ ] Deep links work
- [ ] Query params preserved

---

### Task 5.2: Update Documentation

**Priority**: High  
**Estimated Time**: 1 day

**Subtasks**:

- [ ] Update README.md
- [ ] Update product.md steering file
- [ ] Update structure.md steering file
- [ ] Create migration guide for users
- [ ] Update feature documentation
- [ ] Create video tutorials (optional)

**Files to Update**:

```
README.md
.kiro/steering/product.md
.kiro/steering/structure.md
docs/MIGRATION_GUIDE.md (create)
```

**Acceptance Criteria**:

- [ ] Documentation reflects new structure
- [ ] Migration guide is clear
- [ ] Screenshots updated
- [ ] Examples updated
- [ ] Links work

---

### Task 5.3: Add Onboarding Tooltips

**Priority**: Medium  
**Estimated Time**: 1 day

**Subtasks**:

- [ ] Create tooltip system
- [ ] Add tooltips for new navigation
- [ ] Add tooltips for hub features
- [ ] Add "What's New" modal
- [ ] Add dismissible announcements
- [ ] Test tooltip flow

**Files to Create**:

```
src/components/onboarding/tooltip-system.tsx
src/components/onboarding/whats-new-modal.tsx
```

**Acceptance Criteria**:

- [ ] Tooltips show on first visit
- [ ] Tooltips are dismissible
- [ ] Tooltips don't repeat
- [ ] "What's New" modal shows
- [ ] Announcements work

---

### Task 5.4: Implement Analytics Tracking

**Priority**: High  
**Estimated Time**: 0.5 days

**Subtasks**:

- [ ] Add hub view tracking
- [ ] Add tab switch tracking
- [ ] Add feature usage tracking
- [ ] Add performance tracking
- [ ] Set up analytics dashboard
- [ ] Test tracking events

**Files to Modify**:

```
src/lib/analytics.ts
src/components/hub/hub-layout.tsx
```

**Acceptance Criteria**:

- [ ] Hub views tracked
- [ ] Tab switches tracked
- [ ] Feature usage tracked
- [ ] Performance tracked
- [ ] Dashboard shows data

---

### Task 5.5: Conduct User Testing

**Priority**: High  
**Estimated Time**: 2 days

**Subtasks**:

- [ ] Recruit test users
- [ ] Create test scenarios
- [ ] Conduct testing sessions
- [ ] Collect feedback
- [ ] Analyze results
- [ ] Prioritize fixes

**Test Scenarios**:

1. New user onboarding
2. Create content in Studio
3. Generate research report
4. Complete brand audit
5. Navigate between hubs
6. Find specific feature

**Acceptance Criteria**:

- [ ] 5+ users tested
- [ ] Feedback collected
- [ ] Issues documented
- [ ] Fixes prioritized
- [ ] Critical issues fixed

---

### Task 5.6: Performance Optimization

**Priority**: Medium  
**Estimated Time**: 1 day

**Subtasks**:

- [ ] Audit bundle sizes
- [ ] Implement code splitting
- [ ] Add lazy loading
- [ ] Optimize images
- [ ] Add prefetching
- [ ] Test performance

**Tools**:

- Lighthouse
- Bundle Analyzer
- React DevTools Profiler

**Acceptance Criteria**:

- [ ] Bundle size reduced
- [ ] Load times improved
- [ ] Lighthouse score >90
- [ ] No performance regressions
- [ ] Smooth animations

---

### Task 5.7: Final Testing & Bug Fixes

**Priority**: High  
**Estimated Time**: 1 day

**Subtasks**:

- [ ] Test all hubs
- [ ] Test all features
- [ ] Test responsive design
- [ ] Test accessibility
- [ ] Fix all critical bugs
- [ ] Fix high-priority bugs

**Testing Checklist**:

- [ ] Desktop (Chrome, Firefox, Safari)
- [ ] Tablet (iPad, Android)
- [ ] Mobile (iPhone, Android)
- [ ] Keyboard navigation
- [ ] Screen reader
- [ ] Dark mode

**Acceptance Criteria**:

- [ ] All critical bugs fixed
- [ ] All high-priority bugs fixed
- [ ] No console errors
- [ ] Accessibility compliant
- [ ] Ready for launch

---

### Task 5.8: Deploy to Production

**Priority**: High  
**Estimated Time**: 0.5 days

**Subtasks**:

- [ ] Create deployment checklist
- [ ] Deploy to staging
- [ ] Test on staging
- [ ] Deploy to production
- [ ] Monitor for errors
- [ ] Announce launch

**Deployment Checklist**:

- [ ] All tests passing
- [ ] Documentation updated
- [ ] Analytics configured
- [ ] Redirects working
- [ ] Monitoring active
- [ ] Rollback plan ready

**Acceptance Criteria**:

- [ ] Deployed successfully
- [ ] No errors in production
- [ ] Monitoring active
- [ ] Users notified
- [ ] Support ready

---

## Post-Launch Tasks

### Task 6.1: Monitor & Respond

**Priority**: High  
**Estimated Time**: Ongoing

**Subtasks**:

- [ ] Monitor error rates
- [ ] Monitor user feedback
- [ ] Respond to support tickets
- [ ] Track analytics
- [ ] Identify issues
- [ ] Plan fixes

**Acceptance Criteria**:

- [ ] Error rate <1%
- [ ] Response time <24h
- [ ] Issues documented
- [ ] Fixes planned
- [ ] Users satisfied

---

### Task 6.2: Iterate & Improve

**Priority**: Medium  
**Estimated Time**: Ongoing

**Subtasks**:

- [ ] Analyze usage patterns
- [ ] Identify pain points
- [ ] Gather feature requests
- [ ] Prioritize improvements
- [ ] Implement improvements
- [ ] Deploy updates

**Acceptance Criteria**:

- [ ] Usage patterns analyzed
- [ ] Pain points identified
- [ ] Improvements prioritized
- [ ] Updates deployed
- [ ] Metrics improved

---

## Summary

**Total Estimated Time**: 5 weeks (25 days)

**Phase Breakdown**:

- Phase 1 (Foundation): 3.5 days
- Phase 2 (Studio Hub): 5.5 days
- Phase 3 (Intelligence Hub): 6 days
- Phase 4 (Brand Center Hub): 4 days
- Phase 5 (Polish & Launch): 6 days

**Key Milestones**:

- Week 1: Foundation complete
- Week 2: Studio Hub live
- Week 3: Intelligence Hub live
- Week 4: Brand Center Hub live
- Week 5: Production launch

**Success Criteria**:

- [ ] All features migrated
- [ ] No broken functionality
- [ ] User satisfaction >4.5/5
- [ ] Navigation efficiency +30%
- [ ] Feature discovery +40%

# UI/UX Consistency Design

## Design System Components

### 1. Page Layout System

#### StandardPageLayout Component

```typescript
interface StandardPageLayoutProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: "default" | "wide" | "full";
  spacing?: "default" | "compact" | "spacious";
}
```

**Properties:**

- Consistent page-level spacing (space-y-6 default, space-y-4 compact, space-y-8 spacious)
- Standardized max-width containers
- Uniform fade-in animation
- Consistent header structure

### 2. Card System

#### StandardCard Component

```typescript
interface StandardCardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  variant?: "default" | "interactive" | "elevated" | "flat";
  padding?: "default" | "compact" | "spacious";
}
```

**Variants:**

- `default`: Standard card with border
- `interactive`: Hover effects (scale, shadow)
- `elevated`: Permanent shadow
- `flat`: No border or shadow

**Padding Scale:**

- `compact`: p-4
- `default`: p-6
- `spacious`: p-8

### 3. Form System

#### StandardFormField Component

```typescript
interface StandardFormFieldProps {
  label: string;
  id: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}
```

**Properties:**

- Consistent label styling
- Uniform error message display
- Standardized hint text
- Required field indicator

#### StandardFormActions Component

```typescript
interface StandardFormActionsProps {
  primaryAction: {
    label: string;
    onClick?: () => void;
    loading?: boolean;
    disabled?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  alignment?: "left" | "right" | "between";
}
```

### 4. Loading States

#### StandardSkeleton Component

- Card skeleton: Full card structure with animated placeholders
- List skeleton: Repeated item placeholders
- Form skeleton: Input field placeholders
- Content skeleton: Text block placeholders

#### StandardLoadingSpinner Component

```typescript
interface StandardLoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "overlay";
  message?: string;
}
```

### 5. Empty States

#### StandardEmptyState Component

```typescript
interface StandardEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: ButtonVariant;
  };
  variant?: "default" | "compact";
}
```

### 6. Typography System

#### Heading Hierarchy

- **Display Large**: Hero sections, landing pages (text-display-large)
- **Heading 1**: Page titles (text-heading-1, text-3xl md:text-4xl)
- **Heading 2**: Section titles (text-heading-2, text-2xl)
- **Heading 3**: Subsection titles (text-heading-3, text-xl)
- **Body**: Default content (text-base)
- **Small**: Secondary content (text-sm)
- **Tiny**: Captions, labels (text-xs)

#### Text Colors

- **Primary**: text-foreground (main content)
- **Secondary**: text-muted-foreground (supporting content)
- **Accent**: text-primary (highlights, links)
- **Success**: text-success
- **Warning**: text-warning
- **Error**: text-destructive

### 7. Spacing System

#### Consistent Spacing Scale

- **xs**: 4px (gap-1, space-y-1)
- **sm**: 8px (gap-2, space-y-2)
- **md**: 16px (gap-4, space-y-4)
- **lg**: 24px (gap-6, space-y-6)
- **xl**: 32px (gap-8, space-y-8)
- **2xl**: 48px (gap-12, space-y-12)

#### Container Padding

- **Mobile**: px-4
- **Tablet**: px-6 md:px-8
- **Desktop**: px-8 lg:px-10

### 8. Button System

#### Button Variants

- **default**: Primary actions
- **ai**: AI-powered actions (gradient)
- **outline**: Secondary actions
- **ghost**: Tertiary actions
- **destructive**: Delete/remove actions

#### Button Sizes

- **sm**: Small buttons (h-9, px-3, text-sm)
- **default**: Standard buttons (h-10, px-4, text-sm)
- **lg**: Large buttons (h-11, px-8, text-base)

#### Button States

- **Loading**: Spinner + "Loading..." text
- **Disabled**: Reduced opacity, no hover
- **Success**: Check icon + "Success!" (temporary)

### 9. Grid System

#### Responsive Grid Patterns

```typescript
// Standard 3-column grid
className = "grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

// 2-column grid
className = "grid gap-6 grid-cols-1 md:grid-cols-2";

// Sidebar layout
className = "grid gap-6 lg:grid-cols-3";
// Main content: lg:col-span-2
// Sidebar: lg:col-span-1
```

### 10. Animation System

#### Page Transitions

- Entry: `animate-fade-in-up` (opacity + translateY)
- Stagger: `animate-delay-100`, `animate-delay-200`, `animate-delay-300`

#### Hover States

- Cards: `hover:shadow-lg hover:scale-[1.02] transition-all duration-300`
- Buttons: `hover:opacity-90 transition-opacity duration-200`
- Links: `hover:text-primary transition-colors duration-200`

#### Loading Animations

- Spinner: `animate-spin`
- Pulse: `animate-pulse`
- Skeleton: `animate-pulse bg-muted`

## Design Patterns

### Pattern 1: List with Actions

```
┌─────────────────────────────────────┐
│ Title                    [+ New]    │
├─────────────────────────────────────┤
│ [Search input]                      │
├─────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│ │ Card 1  │ │ Card 2  │ │ Card 3  ││
│ └─────────┘ └─────────┘ └─────────┘│
└─────────────────────────────────────┘
```

### Pattern 2: Form with Sections

```
┌─────────────────────────────────────┐
│ SECTION 1                           │
│ ┌─────────────────────────────────┐ │
│ │ Field 1                         │ │
│ │ Field 2                         │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ SECTION 2                           │
│ ┌─────────────────────────────────┐ │
│ │ Field 3                         │ │
│ │ Field 4                         │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│                    [Cancel] [Save]  │
└─────────────────────────────────────┘
```

### Pattern 3: Dashboard Layout

```
┌─────────────────────────────────────┐
│ Title & Description                 │
├─────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│ │ Metric  │ │ Metric  │ │ Metric  ││
│ └─────────┘ └─────────┘ └─────────┘│
├─────────────────────────────────────┤
│ ┌───────────────────┐ ┌───────────┐│
│ │ Main Content      │ │ Sidebar   ││
│ │                   │ │           ││
│ └───────────────────┘ └───────────┘│
└─────────────────────────────────────┘
```

## Implementation Strategy

### Phase 1: Core Components (Week 1)

1. Create StandardPageLayout component
2. Create StandardCard component
3. Create StandardFormField component
4. Create StandardFormActions component

### Phase 2: State Components (Week 1)

1. Create StandardSkeleton component
2. Create StandardLoadingSpinner component
3. Create StandardEmptyState component
4. Create StandardErrorDisplay component

### Phase 3: Page Updates (Week 2-3)

1. Update Dashboard page
2. Update Studio pages (Write, Describe, Reimagine)
3. Update Intelligence pages (Research, Competitors, Market Insights)
4. Update Brand Center pages (Profile, Audit, Strategy)
5. Update Projects page
6. Update Training pages

### Phase 4: Polish & Testing (Week 3)

1. Verify consistency across all pages
2. Test responsive behavior
3. Validate accessibility
4. Performance optimization
5. Documentation updates

## Correctness Properties

### CP1: Visual Consistency

**Property**: All pages within the same hub use identical spacing, typography, and layout patterns
**Verification**: Visual regression testing, manual inspection

### CP2: Component Reusability

**Property**: Common UI patterns are implemented as reusable components
**Verification**: Code analysis, component usage tracking

### CP3: Responsive Behavior

**Property**: All pages maintain consistent layout behavior across breakpoints
**Verification**: Responsive testing at 375px, 768px, 1024px, 1440px

### CP4: Accessibility

**Property**: All interactive elements meet WCAG 2.1 AA standards
**Verification**: Automated accessibility testing, keyboard navigation testing

### CP5: Performance

**Property**: Page transitions and animations maintain 60fps
**Verification**: Performance profiling, Lighthouse scores

## Dependencies

- Existing shadcn/ui components
- Tailwind CSS design tokens
- Framer Motion for animations
- Next.js App Router
- TypeScript for type safety

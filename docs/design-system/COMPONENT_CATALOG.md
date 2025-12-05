# Component Catalog

A comprehensive catalog of all components in the Bayon Coagent design system with prop tables, examples, and accessibility notes.

## Table of Contents

- [Standard Components](#standard-components)
- [Layout Components](#layout-components)
- [Performance Components](#performance-components)
- [Transition Components](#transition-components)
- [UI Components](#ui-components)

---

## Standard Components

### StandardFormField

Consistent form field wrapper with label, error handling, and help text.

**Props:**

| Prop        | Type        | Default | Description                    |
| ----------- | ----------- | ------- | ------------------------------ |
| `label`     | `string`    | -       | Field label text (required)    |
| `id`        | `string`    | -       | Field ID for label association |
| `error`     | `string`    | -       | Error message to display       |
| `helpText`  | `string`    | -       | Help text below the field      |
| `required`  | `boolean`   | `false` | Whether field is required      |
| `children`  | `ReactNode` | -       | Input element (required)       |
| `className` | `string`    | -       | Additional CSS classes         |

**Accessibility:**

- Associates label with input via `htmlFor`
- Announces errors to screen readers via `aria-describedby`
- Indicates required fields with `aria-required`
- Displays required indicator visually

**Example:**

```tsx
<StandardFormField
  label="Email Address"
  id="email"
  error={errors.email}
  helpText="We'll never share your email"
  required
>
  <Input type="email" id="email" />
</StandardFormField>
```

---

### StandardLoadingState

Unified loading indicators with consistent styling and behavior.

**Props:**

| Prop         | Type                                              | Default     | Description                   |
| ------------ | ------------------------------------------------- | ----------- | ----------------------------- |
| `variant`    | `'spinner' \| 'skeleton' \| 'pulse' \| 'shimmer'` | `'spinner'` | Loading indicator style       |
| `size`       | `'sm' \| 'md' \| 'lg'`                            | `'md'`      | Size of the loading indicator |
| `text`       | `string`                                          | -           | Optional loading text         |
| `fullScreen` | `boolean`                                         | `false`     | Whether to fill entire screen |
| `className`  | `string`                                          | -           | Additional CSS classes        |

**Variants:**

- `spinner`: Rotating spinner icon
- `skeleton`: Skeleton placeholder (for content)
- `pulse`: Pulsing animation
- `shimmer`: Shimmer effect (for cards/images)

**Example:**

```tsx
<StandardLoadingState variant="spinner" size="md" text="Loading content..." />
```

---

### StandardErrorDisplay

Consistent error messaging with appropriate severity levels.

**Props:**

| Prop        | Type                                   | Default   | Description              |
| ----------- | -------------------------------------- | --------- | ------------------------ |
| `title`     | `string`                               | -         | Error title (required)   |
| `message`   | `string`                               | -         | Error message (required) |
| `variant`   | `'error' \| 'warning' \| 'info'`       | `'error'` | Severity level           |
| `action`    | `{label: string, onClick: () => void}` | -         | Optional action button   |
| `className` | `string`                               | -         | Additional CSS classes   |

**Variants:**

- `error`: Red color scheme for errors
- `warning`: Yellow color scheme for warnings
- `info`: Blue color scheme for informational messages

**Example:**

```tsx
<StandardErrorDisplay
  title="Failed to Load"
  message="Unable to fetch data. Please try again."
  variant="error"
  action={{ label: "Retry", onClick: handleRetry }}
/>
```

---

### StandardEmptyState

Consistent empty state patterns with call-to-action.

**Props:**

| Prop          | Type                                                     | Default | Description                  |
| ------------- | -------------------------------------------------------- | ------- | ---------------------------- |
| `icon`        | `LucideIcon`                                             | -       | Icon to display (required)   |
| `title`       | `string`                                                 | -       | Empty state title (required) |
| `description` | `string`                                                 | -       | Description text (required)  |
| `action`      | `{label: string, onClick: () => void, variant?: string}` | -       | Optional action button       |
| `className`   | `string`                                                 | -       | Additional CSS classes       |

**Example:**

```tsx
<StandardEmptyState
  icon={FileText}
  title="No Content Yet"
  description="Create your first piece of content to get started"
  action={{ label: "Create Content", onClick: handleCreate }}
/>
```

---

### FormActions

Standardized form action buttons with consistent spacing and alignment.

**Props:**

| Prop                | Type                                         | Default           | Description                |
| ------------------- | -------------------------------------------- | ----------------- | -------------------------- |
| `onCancel`          | `() => void`                                 | -                 | Cancel button handler      |
| `onSubmit`          | `() => void`                                 | -                 | Submit button handler      |
| `submitText`        | `string`                                     | `'Submit'`        | Submit button text         |
| `cancelText`        | `string`                                     | `'Cancel'`        | Cancel button text         |
| `isSubmitting`      | `boolean`                                    | `false`           | Loading state              |
| `submitLoadingText` | `string`                                     | `'Submitting...'` | Loading text               |
| `submitVariant`     | `ButtonProps['variant']`                     | `'default'`       | Submit button variant      |
| `alignment`         | `'left' \| 'right' \| 'between' \| 'center'` | `'right'`         | Button alignment           |
| `children`          | `ReactNode`                                  | -                 | Custom buttons (overrides) |

**Alignment Options:**

- `left`: Buttons aligned to the left
- `right`: Buttons aligned to the right (default)
- `between`: Space between buttons
- `center`: Buttons centered

**Example:**

```tsx
<FormActions
  onCancel={handleCancel}
  onSubmit={handleSubmit}
  submitText="Save Changes"
  isSubmitting={isSubmitting}
  alignment="right"
/>
```

---

## Layout Components

### PageHeader

Standardized page header with title, description, icon, and actions.

**Props:**

| Prop          | Type                                    | Default     | Description                |
| ------------- | --------------------------------------- | ----------- | -------------------------- |
| `title`       | `string`                                | -           | Page title (required)      |
| `description` | `string`                                | -           | Page description           |
| `icon`        | `LucideIcon`                            | -           | Icon to display            |
| `actions`     | `ReactNode`                             | -           | Action buttons or elements |
| `variant`     | `'default' \| 'hub' \| 'compact'`       | `'default'` | Visual variant             |
| `breadcrumbs` | `Array<{label: string, href?: string}>` | -           | Breadcrumb navigation      |
| `className`   | `string`                                | -           | Additional CSS classes     |

**Variants:**

- `default`: Standard page header (text-3xl title)
- `hub`: Larger header for hub pages (text-4xl title, bottom border)
- `compact`: Smaller header for nested pages (text-2xl title)

**Accessibility:**

- Uses semantic `<header>` element
- Proper heading hierarchy (h1 for title)
- Breadcrumb navigation with proper ARIA labels

**Example:**

```tsx
<PageHeader
  title="Content Studio"
  description="Create AI-powered content"
  icon={Wand2}
  actions={<Button>New Content</Button>}
  variant="hub"
  breadcrumbs={[
    { label: "Home", href: "/" },
    { label: "Studio", href: "/studio" },
    { label: "Write" },
  ]}
/>
```

---

### SectionContainer

Consistent section wrapper with optional header and footer.

**Props:**

| Prop           | Type                                    | Default     | Description                |
| -------------- | --------------------------------------- | ----------- | -------------------------- |
| `title`        | `string`                                | -           | Section title              |
| `description`  | `string`                                | -           | Section description        |
| `headerAction` | `ReactNode`                             | -           | Action element in header   |
| `footer`       | `ReactNode`                             | -           | Footer content             |
| `variant`      | `'default' \| 'elevated' \| 'bordered'` | `'default'` | Visual variant             |
| `children`     | `ReactNode`                             | -           | Section content (required) |
| `className`    | `string`                                | -           | Additional CSS classes     |

**Variants:**

- `default`: Basic card background
- `elevated`: Card with shadow for elevation
- `bordered`: Card with border

**Example:**

```tsx
<SectionContainer
  title="Recent Activity"
  description="Your latest actions"
  headerAction={<Button variant="ghost">View All</Button>}
  variant="elevated"
  footer={
    <p className="text-sm text-muted-foreground">Last updated 5 minutes ago</p>
  }
>
  {/* Content */}
</SectionContainer>
```

---

### GridLayout

Responsive grid layout with consistent spacing.

**Props:**

| Prop        | Type                   | Default | Description            |
| ----------- | ---------------------- | ------- | ---------------------- |
| `columns`   | `1 \| 2 \| 3 \| 4`     | `3`     | Number of columns      |
| `gap`       | `'sm' \| 'md' \| 'lg'` | `'md'`  | Gap size               |
| `children`  | `ReactNode`            | -       | Grid items (required)  |
| `className` | `string`               | -       | Additional CSS classes |

**Responsive Behavior:**

- 1 column: Always 1 column
- 2 columns: 1 on mobile, 2 on sm+
- 3 columns: 1 on mobile, 2 on sm+, 3 on lg+
- 4 columns: 1 on mobile, 2 on sm+, 3 on lg+, 4 on xl+

**Gap Sizes:**

- `sm`: 1rem (gap-4)
- `md`: 1.5rem (gap-6)
- `lg`: 2rem (gap-8)

**Example:**

```tsx
<GridLayout columns={3} gap="lg">
  <Card>Card 1</Card>
  <Card>Card 2</Card>
  <Card>Card 3</Card>
</GridLayout>
```

---

### ContentWrapper

Consistent content container with max-width and padding.

**Props:**

| Prop        | Type                                        | Default     | Description                |
| ----------- | ------------------------------------------- | ----------- | -------------------------- |
| `children`  | `ReactNode`                                 | -           | Content to wrap (required) |
| `maxWidth`  | `'default' \| 'wide' \| 'narrow' \| 'full'` | `'default'` | Maximum width              |
| `fullWidth` | `boolean`                                   | `false`     | Remove horizontal padding  |
| `className` | `string`                                    | -           | Additional CSS classes     |

**Max Width Options:**

- `narrow`: max-w-3xl (768px) - ideal for reading content
- `default`: max-w-7xl (1280px) - standard page width
- `wide`: max-w-[1600px] - for dashboards and data-heavy pages
- `full`: no max-width constraint

**Example:**

```tsx
<ContentWrapper maxWidth="default">{/* Page content */}</ContentWrapper>
```

---

## Performance Components

### LazyComponent

Dynamic import wrapper with loading fallback and error boundary.

**Props:**

| Prop           | Type                                           | Default | Description                        |
| -------------- | ---------------------------------------------- | ------- | ---------------------------------- |
| `loader`       | `() => Promise<{default: ComponentType<any>}>` | -       | Dynamic import function (required) |
| `fallback`     | `ReactNode`                                    | -       | Loading fallback                   |
| `errorMessage` | `string`                                       | -       | Custom error message               |
| `props`        | `Record<string, any>`                          | -       | Props to pass to lazy component    |
| `onLoad`       | `() => void`                                   | -       | Callback when loaded               |
| `onError`      | `(error: Error) => void`                       | -       | Callback on error                  |

**Example:**

```tsx
<LazyComponent
  loader={() => import("./HeavyChart")}
  fallback={<StandardLoadingState variant="skeleton" />}
  props={{ data: chartData }}
  onLoad={() => console.log("Loaded")}
  onError={(error) => console.error("Error:", error)}
/>
```

**When to use:**

- Heavy components (>50KB)
- Below-the-fold content
- Modal/dialog content
- Charts and visualizations
- Third-party integrations

---

### VirtualList

Virtualized list component for efficiently rendering large datasets.

**Props:**

| Prop         | Type                                    | Default  | Description                                |
| ------------ | --------------------------------------- | -------- | ------------------------------------------ |
| `items`      | `T[]`                                   | -        | Array of items (required)                  |
| `itemHeight` | `number \| ((item: T) => number)`       | -        | Height of each item (required)             |
| `renderItem` | `(item: T, index: number) => ReactNode` | -        | Render function (required)                 |
| `height`     | `number \| string`                      | `'100%'` | Container height                           |
| `overscan`   | `number`                                | `3`      | Number of items to render outside viewport |
| `emptyState` | `ReactNode`                             | -        | Empty state component                      |
| `getItemKey` | `(item: T, index: number) => string`    | -        | Key function for stable keys               |
| `className`  | `string`                                | -        | Additional CSS classes                     |

**Example:**

```tsx
<VirtualList
  items={largeDataset}
  itemHeight={80}
  renderItem={(item, index) => (
    <div className="p-4 border-b">
      <h3>{item.title}</h3>
      <p>{item.description}</p>
    </div>
  )}
  height={600}
  overscan={3}
  emptyState={<StandardEmptyState icon={FileText} title="No items" />}
  getItemKey={(item) => item.id}
/>
```

**When to use:**

- Lists with 100+ items
- Infinite scroll implementations
- Chat message lists
- Activity feeds
- Search results

**Performance impact:**

- Renders only ~10-20 items instead of 1000+
- Reduces DOM nodes by 98%+
- Maintains 60fps scrolling

---

### OptimizedImage

Next.js Image wrapper with consistent sizing patterns and loading states.

**Props:**

| Prop          | Type                     | Default | Description                   |
| ------------- | ------------------------ | ------- | ----------------------------- |
| `src`         | `string`                 | -       | Image source (required)       |
| `alt`         | `string`                 | -       | Alt text (required)           |
| `width`       | `number`                 | -       | Image width (required)        |
| `height`      | `number`                 | -       | Image height (required)       |
| `priority`    | `boolean`                | `false` | Priority loading (above fold) |
| `aspectRatio` | `string`                 | -       | Aspect ratio (e.g., "16/9")   |
| `sizes`       | `string`                 | -       | Responsive sizes              |
| `fallback`    | `ReactNode`              | -       | Error fallback component      |
| `onLoad`      | `() => void`             | -       | Callback when loaded          |
| `onError`     | `(error: Error) => void` | -       | Callback on error             |
| `className`   | `string`                 | -       | Additional CSS classes        |

**Example:**

```tsx
<OptimizedImage
  src="/hero.jpg"
  alt="Hero image"
  width={1200}
  height={600}
  priority
  aspectRatio="16/9"
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

**Preset Components:**

- `HeroImage`: Full-width, 16:9, priority loading
- `CardImage`: 4:3 aspect ratio, responsive sizes
- `AvatarImage`: 1:1 aspect ratio, circular
- `PropertyImage`: 16:9 for property listings
- `LogoImage`: Contain mode, no crop

---

## Transition Components

### PageTransition

Smooth page transitions with fade effect.

**Props:**

| Prop        | Type        | Default | Description             |
| ----------- | ----------- | ------- | ----------------------- |
| `children`  | `ReactNode` | -       | Page content (required) |
| `className` | `string`    | -       | Additional CSS classes  |

**Example:**

```tsx
<PageTransition>
  <MyPageContent />
</PageTransition>
```

---

### ContentTransition

Content fade-in animations for smooth loading.

**Props:**

| Prop        | Type        | Default | Description                   |
| ----------- | ----------- | ------- | ----------------------------- |
| `children`  | `ReactNode` | -       | Content to animate (required) |
| `delay`     | `number`    | `0`     | Delay before animation (ms)   |
| `className` | `string`    | -       | Additional CSS classes        |

**Example:**

```tsx
<ContentTransition delay={100}>
  <MyContent />
</ContentTransition>
```

---

## UI Components

### Button

Base button component with multiple variants and sizes.

**Props:**

| Prop        | Type                                                                                               | Default     | Description            |
| ----------- | -------------------------------------------------------------------------------------------------- | ----------- | ---------------------- |
| `variant`   | `'default' \| 'destructive' \| 'outline' \| 'secondary' \| 'ghost' \| 'link' \| 'ai' \| 'shimmer'` | `'default'` | Button style variant   |
| `size`      | `'default' \| 'sm' \| 'lg' \| 'xl' \| 'icon'`                                                      | `'default'` | Button size            |
| `disabled`  | `boolean`                                                                                          | `false`     | Disabled state         |
| `onClick`   | `() => void`                                                                                       | -           | Click handler          |
| `children`  | `ReactNode`                                                                                        | -           | Button content         |
| `className` | `string`                                                                                           | -           | Additional CSS classes |

**Variants:**

- `default`: Primary action (blue)
- `destructive`: Dangerous actions (red)
- `outline`: Secondary actions (bordered)
- `secondary`: Alternative actions (gray)
- `ghost`: Minimal styling
- `link`: Link-style button
- `ai`: AI-powered actions (gradient)
- `shimmer`: Loading state with shimmer effect

**Sizes:**

- `default`: Standard size (44px min-height)
- `sm`: Small (40px min-height)
- `lg`: Large (48px min-height)
- `xl`: Extra large (52px min-height)
- `icon`: Icon-only (44x44px)

**Example:**

```tsx
<Button variant="default" size="lg" onClick={handleClick}>
  Click Me
</Button>
```

---

### Card

Card container component with variants.

**Props:**

| Prop        | Type                                                                                  | Default  | Description            |
| ----------- | ------------------------------------------------------------------------------------- | -------- | ---------------------- |
| `variant`   | `'base' \| 'elevated' \| 'floating' \| 'modal' \| 'premium' \| 'bordered' \| 'glass'` | `'base'` | Card style variant     |
| `children`  | `ReactNode`                                                                           | -        | Card content           |
| `className` | `string`                                                                              | -        | Additional CSS classes |

**Example:**

```tsx
<Card variant="elevated">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>Card content</CardContent>
</Card>
```

---

### AnimatedTabs

Animated tab navigation component (preferred over standard Tabs).

**Props:**

| Prop            | Type                      | Default | Description            |
| --------------- | ------------------------- | ------- | ---------------------- |
| `defaultValue`  | `string`                  | -       | Default active tab     |
| `value`         | `string`                  | -       | Controlled active tab  |
| `onValueChange` | `(value: string) => void` | -       | Tab change handler     |
| `children`      | `ReactNode`               | -       | Tab content            |
| `className`     | `string`                  | -       | Additional CSS classes |

**Example:**

```tsx
<AnimatedTabs defaultValue="tab1">
  <AnimatedTabsList>
    <AnimatedTabsTrigger value="tab1">Tab 1</AnimatedTabsTrigger>
    <AnimatedTabsTrigger value="tab2">Tab 2</AnimatedTabsTrigger>
  </AnimatedTabsList>
  <AnimatedTabsContent value="tab1">Content 1</AnimatedTabsContent>
  <AnimatedTabsContent value="tab2">Content 2</AnimatedTabsContent>
</AnimatedTabs>
```

---

## Accessibility Notes

### General Guidelines

All components follow these accessibility principles:

1. **Semantic HTML**: Use proper HTML elements (`<button>`, `<header>`, `<nav>`, etc.)
2. **ARIA Attributes**: Include appropriate ARIA labels and roles
3. **Keyboard Navigation**: Support Tab, Enter, Escape, Arrow keys
4. **Focus Management**: Visible focus indicators and logical focus order
5. **Screen Reader Support**: Announce state changes and errors
6. **Color Contrast**: Meet WCAG AA standards (4.5:1 for text)
7. **Touch Targets**: Minimum 44x44px for interactive elements

### Component-Specific Notes

**StandardFormField:**

- Associates label with input via `htmlFor`
- Announces errors via `aria-describedby`
- Indicates required fields with `aria-required`

**StandardLoadingState:**

- Uses `role="status"` for screen reader announcements
- Includes `aria-live="polite"` for loading text

**StandardErrorDisplay:**

- Uses `role="alert"` for immediate announcements
- Color is not the only indicator (includes icons)

**PageHeader:**

- Uses semantic `<header>` element
- Proper heading hierarchy (h1 for title)
- Breadcrumbs with `aria-label="Breadcrumb"`

**Button:**

- Minimum 44x44px touch target
- Disabled state announced to screen readers
- Loading state with `aria-busy="true"`

**AnimatedTabs:**

- Keyboard navigation with Arrow keys
- `role="tablist"`, `role="tab"`, `role="tabpanel"`
- `aria-selected` for active tab

---

## Performance Notes

### Bundle Size Impact

| Component Category     | Bundle Size | Impact |
| ---------------------- | ----------- | ------ |
| Standard Components    | ~15KB       | Low    |
| Layout Components      | ~10KB       | Low    |
| Performance Components | ~20KB       | Medium |
| Transition Components  | ~5KB        | Low    |
| UI Components (all)    | ~150KB      | High   |

### Optimization Tips

1. **Use LazyComponent** for heavy components (>50KB)
2. **Use VirtualList** for lists with 100+ items
3. **Use OptimizedImage** for all images
4. **Import only needed UI components** (tree-shaking)
5. **Use Server Components** by default

### Performance Metrics

**Target Metrics:**

- Initial Bundle (JS): < 200KB
- Time to Interactive: < 3s
- First Contentful Paint: < 1.5s
- Cumulative Layout Shift: < 0.1

**Component Impact:**

- LazyComponent: Reduces initial bundle by 30-50%
- VirtualList: Reduces DOM nodes by 98%+
- OptimizedImage: Prevents layout shift (CLS < 0.1)

---

## Related Documentation

- [Component Documentation System](./COMPONENT_DOCUMENTATION.md)
- [Design Tokens](./design-tokens.md)
- [Animation System](./animation-system.md)
- [Mobile Optimizations](./mobile-optimizations-summary.md)
- [Migration Guide](./COMPONENT_DOCUMENTATION.md#migration-guide)

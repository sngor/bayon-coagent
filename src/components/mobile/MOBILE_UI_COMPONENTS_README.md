# Mobile UI Components

This directory contains mobile-optimized UI components designed specifically for touch interfaces and mobile devices.

## Components

### 1. BottomSheet

A mobile-optimized bottom sheet component with swipe-to-dismiss and snap points.

**Features:**

- Swipe to dismiss
- Multiple snap points for different heights
- Touch-optimized drag handle
- Haptic feedback on interactions
- One-handed operation friendly

**Usage:**

```tsx
import {
  BottomSheet,
  BottomSheetTrigger,
} from "@/components/mobile/ui-components";

function MyComponent() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <BottomSheetTrigger onClick={() => setOpen(true)}>
        Open Sheet
      </BottomSheetTrigger>

      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        title="Property Details"
        description="View property information"
        snapPoints={[90, 50, 25]}
        defaultSnapPoint={1}
      >
        <div>Content goes here</div>
      </BottomSheet>
    </>
  );
}
```

**Requirements:** 4.1, 5.1, 8.3

---

### 2. SwipeableCard

A card component that supports swipe gestures in all directions.

**Features:**

- Swipe gestures (left, right, up, down)
- Visual feedback during swipe
- Haptic feedback on swipe actions
- Smooth animations
- Touch-optimized

**Usage:**

```tsx
import { SwipeableCard } from "@/components/mobile/ui-components";

function MyComponent() {
  return (
    <SwipeableCard
      onSwipeLeft={() => console.log("Swiped left")}
      onSwipeRight={() => console.log("Swiped right")}
      swipeThreshold={100}
      enableHaptics={true}
    >
      <Card>Card content</Card>
    </SwipeableCard>
  );
}
```

**Requirements:** 5.2

---

### 3. SwipeableCardStack

A stack of swipeable cards with Tinder-like behavior.

**Usage:**

```tsx
import { SwipeableCardStack } from "@/components/mobile/ui-components";

function MyComponent() {
  const cards = [
    <Card key={1}>Card 1</Card>,
    <Card key={2}>Card 2</Card>,
    <Card key={3}>Card 3</Card>,
  ];

  return (
    <SwipeableCardStack
      cards={cards}
      onCardSwiped={(index, direction) => {
        console.log(`Card ${index} swiped ${direction}`);
      }}
    />
  );
}
```

**Requirements:** 5.2

---

### 4. SwipeableGallery

A swipeable image gallery for property photos.

**Features:**

- Swipe to navigate between images
- Visual indicators for current image
- Image counter
- Touch-optimized

**Usage:**

```tsx
import { SwipeableGallery } from "@/components/mobile/ui-components";

function MyComponent() {
  const images = ["/property1.jpg", "/property2.jpg", "/property3.jpg"];

  return (
    <SwipeableGallery
      images={images}
      onImageChange={(index) => console.log(`Image ${index}`)}
    />
  );
}
```

**Requirements:** 5.2

---

### 5. TouchButton

A touch-optimized button component with haptic feedback.

**Features:**

- Minimum 44x44px touch target (WCAG compliant)
- Haptic feedback on tap
- Loading state with spinner
- Active state animation
- Icon support

**Usage:**

```tsx
import { TouchButton } from "@/components/mobile/ui-components";

function MyComponent() {
  return (
    <TouchButton
      variant="primary"
      size="default"
      fullWidth
      loading={false}
      hapticFeedback={true}
      icon={<Icon />}
      iconPosition="left"
      onClick={() => console.log("Clicked")}
    >
      Submit
    </TouchButton>
  );
}
```

**Variants:**

- `primary` - Primary action button
- `secondary` - Secondary action button
- `outline` - Outlined button
- `ghost` - Ghost button (no background)
- `destructive` - Destructive action button
- `success` - Success action button

**Sizes:**

- `sm` - 40px min height
- `default` - 44px min height (recommended)
- `lg` - 52px min height
- `xl` - 60px min height
- `icon` - 44x44px square

**Requirements:** 8.3

---

### 6. TouchButtonGroup

A group of touch buttons with proper spacing.

**Usage:**

```tsx
import {
  TouchButtonGroup,
  TouchButton,
} from "@/components/mobile/ui-components";

function MyComponent() {
  return (
    <TouchButtonGroup orientation="horizontal">
      <TouchButton>Button 1</TouchButton>
      <TouchButton>Button 2</TouchButton>
      <TouchButton>Button 3</TouchButton>
    </TouchButtonGroup>
  );
}
```

**Requirements:** 8.3

---

### 7. FloatingActionButton

A floating action button for primary mobile actions.

**Usage:**

```tsx
import { FloatingActionButton } from "@/components/mobile/ui-components";
import { Plus } from "lucide-react";

function MyComponent() {
  return (
    <FloatingActionButton
      position="bottom-right"
      icon={<Plus />}
      onClick={() => console.log("FAB clicked")}
    >
      Add
    </FloatingActionButton>
  );
}
```

**Requirements:** 4.1, 8.3

---

### 8. SegmentedControl

A segmented control for mobile option selection.

**Usage:**

```tsx
import { SegmentedControl } from "@/components/mobile/ui-components";
import { Grid, List } from "lucide-react";

function MyComponent() {
  const [view, setView] = useState("grid");

  return (
    <SegmentedControl
      options={[
        { value: "grid", label: "Grid", icon: <Grid /> },
        { value: "list", label: "List", icon: <List /> },
      ]}
      value={view}
      onChange={setView}
    />
  );
}
```

**Requirements:** 8.3

---

### 9. MobileNav

A mobile bottom navigation bar.

**Features:**

- Fixed bottom position
- Touch-optimized targets (44px min)
- Active state indication
- Badge support for notifications
- Haptic feedback

**Usage:**

```tsx
import { MobileNav } from "@/components/mobile/ui-components";
import { Home, Search, User } from "lucide-react";

function MyComponent() {
  return (
    <MobileNav
      items={[
        { label: "Home", href: "/", icon: Home },
        { label: "Search", href: "/search", icon: Search, badge: 3 },
        { label: "Profile", href: "/profile", icon: User },
      ]}
    />
  );
}
```

**Requirements:** 4.1, 8.3

---

### 10. MobileNavDrawer

A mobile navigation drawer (hamburger menu).

**Usage:**

```tsx
import {
  MobileNavDrawer,
  MobileNavItem,
} from "@/components/mobile/ui-components";
import { Home, Settings } from "lucide-react";

function MyComponent() {
  const [open, setOpen] = useState(false);

  return (
    <MobileNavDrawer open={open} onOpenChange={setOpen}>
      <div className="p-4 space-y-2">
        <MobileNavItem
          href="/"
          icon={Home}
          label="Home"
          onClick={() => setOpen(false)}
        />
        <MobileNavItem
          href="/settings"
          icon={Settings}
          label="Settings"
          badge={2}
          onClick={() => setOpen(false)}
        />
      </div>
    </MobileNavDrawer>
  );
}
```

**Requirements:** 4.1, 8.3

---

### 11. MobileTabBar

A mobile tab bar for section navigation.

**Usage:**

```tsx
import { MobileTabBar } from "@/components/mobile/ui-components";
import { Home, Search, User } from "lucide-react";

function MyComponent() {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <MobileTabBar
      tabs={[
        { id: "home", label: "Home", icon: Home },
        { id: "search", label: "Search", icon: Search },
        { id: "profile", label: "Profile", icon: User },
      ]}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  );
}
```

**Requirements:** 8.3

---

## Haptic Feedback

The haptic feedback utilities provide a comprehensive API for haptic feedback on mobile devices.

### Basic Usage

```tsx
import { HapticFeedback } from "@/components/mobile/ui-components";

// Light tap for button presses
HapticFeedback.tap();

// Success feedback
HapticFeedback.success();

// Error feedback
HapticFeedback.error();
```

### Haptic Patterns

```tsx
import { HapticPatterns, haptic } from "@/components/mobile/ui-components";

// Use predefined patterns
haptic(HapticPatterns.light);
haptic(HapticPatterns.success);
haptic(HapticPatterns.error);

// Custom pattern (array of durations in ms)
haptic([10, 50, 10]);
```

### React Hook

```tsx
import { useHaptics } from "@/components/mobile/ui-components";

function MyComponent() {
  const { supported, trigger, feedback } = useHaptics();

  const handleClick = () => {
    if (supported) {
      feedback.tap();
    }
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

### Gesture Haptics

```tsx
import { GestureHaptics } from "@/components/mobile/ui-components";

// Swipe gestures
GestureHaptics.swipeStart();
GestureHaptics.swipeEnd();

// Drag gestures
GestureHaptics.dragStart();
GestureHaptics.dragEnd();

// Snap to position
GestureHaptics.snap();
```

### Form Haptics

```tsx
import { FormHaptics } from "@/components/mobile/ui-components";

// Input interactions
FormHaptics.focus();
FormHaptics.blur();

// Validation
FormHaptics.validationError();
FormHaptics.validationSuccess();

// Form controls
FormHaptics.toggle();
FormHaptics.check();
FormHaptics.sliderChange();
```

### Navigation Haptics

```tsx
import { NavigationHaptics } from "@/components/mobile/ui-components";

// Page transitions
NavigationHaptics.pageTransition();
NavigationHaptics.tabChange();

// Modals and drawers
NavigationHaptics.modalOpen();
NavigationHaptics.modalClose();
NavigationHaptics.drawerOpen();
NavigationHaptics.drawerClose();
```

---

## Best Practices

### Touch Targets

All interactive elements should meet the minimum touch target size of 44x44px (WCAG 2.1 Level AAA).

```tsx
// Good - meets minimum size
<TouchButton size="default">Click me</TouchButton>

// Bad - too small
<button className="h-8 w-8">Click me</button>
```

### Haptic Feedback

Use haptic feedback to provide tactile confirmation of user actions:

- **Light tap** - Button presses, selections
- **Medium tap** - Important actions, confirmations
- **Heavy tap** - Critical actions, warnings
- **Success pattern** - Successful operations
- **Error pattern** - Failed operations

### Swipe Gestures

When implementing swipe gestures:

1. Provide visual feedback during the swipe
2. Use haptic feedback on swipe completion
3. Set appropriate swipe thresholds (100px recommended)
4. Consider the direction of the swipe (natural for the action)

### Bottom Sheets

Use bottom sheets for:

- Quick actions
- Form inputs
- Property details
- Filters and options

Avoid using bottom sheets for:

- Long-form content (use full page instead)
- Critical information that must be seen

### Mobile Navigation

- Use bottom navigation for 3-5 primary destinations
- Use drawer navigation for secondary destinations
- Keep labels short (1-2 words)
- Use clear, recognizable icons

---

## Accessibility

All components are built with accessibility in mind:

- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Sufficient color contrast
- Touch target sizes meet WCAG guidelines

---

## Requirements Mapping

- **Requirement 4.1**: Voice notes quick button - BottomSheet, TouchButton, FloatingActionButton
- **Requirement 5.1**: Mobile-optimized card layout - SwipeableCard, BottomSheet
- **Requirement 5.2**: Swipeable photo galleries - SwipeableGallery, SwipeableCard
- **Requirement 8.3**: Touch-optimized editing controls - TouchButton, SegmentedControl, all components

---

## Testing

All components include:

- Touch target size validation (minimum 44x44px)
- Haptic feedback testing
- Swipe gesture testing
- Accessibility testing
- Responsive design testing

See `src/components/mobile/__tests__/` for test files.

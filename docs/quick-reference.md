# Quick Reference

Common patterns, code snippets, and quick lookups for daily development.

## Spacing Scale

```
gap-1, space-y-1, p-1    → 4px
gap-2, space-y-2, p-2    → 8px
gap-4, space-y-4, p-4    → 16px
gap-6, space-y-6, p-6    → 24px
gap-8, space-y-8, p-8    → 32px
gap-12, space-y-12, p-12 → 48px
```

## Typography

```
text-display-large  → 56px (Hero)
text-display-medium → 40px (Section hero)
text-heading-1      → 32px (Page title)
text-heading-2      → 24px (Section title)
text-heading-3      → 20px (Subsection)
text-base           → 16px (Body)
text-sm             → 14px (Secondary)
text-xs             → 12px (Caption)
```

## Grid Layouts

```tsx
// 3-column responsive
<div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// 2-column responsive
<div className="grid gap-6 grid-cols-1 md:grid-cols-2">

// Sidebar layout (2:1)
<div className="grid gap-6 lg:grid-cols-3">
  <div className="lg:col-span-2">{/* Main */}</div>
  <div className="lg:col-span-1">{/* Sidebar */}</div>
</div>
```

## Colors

```tsx
// Text
text - foreground; // Primary text
text - muted - foreground; // Secondary text
text - primary; // Accent text
text - success; // Success text
text - destructive; // Error text

// Background
bg - background; // Page background
bg - card; // Card background
bg - muted; // Subtle background
bg - primary; // Primary background
```

## Animations

```tsx
// Page entry
className = "animate-fade-in-up";

// Staggered
className = "animate-fade-in-up animate-delay-100";
className = "animate-fade-in-up animate-delay-200";

// Hover
className = "hover:shadow-lg hover:scale-[1.02] transition-all duration-300";
```

## Common Imports

```tsx
// Standard components
import {
  StandardPageLayout,
  StandardCard,
  StandardFormField,
  StandardFormActions,
  StandardLoadingSpinner,
  StandardSkeleton,
  StandardEmptyState,
  StandardErrorDisplay,
} from "@/components/standard";

// UI components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

// Utilities
import { cn } from "@/lib/utils";

// Icons
import { Inbox, Search, Plus } from "lucide-react";
```

## Server Actions

```tsx
// Define action
export async function createItem(formData: FormData) {
  const data = {
    name: formData.get("name") as string,
    description: formData.get("description") as string,
  };

  // Validate
  const schema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
  });

  const result = schema.safeParse(data);
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  // Save to database
  await repository.create("ITEM", result.data);

  return { message: "Item created successfully" };
}

// Use in component
("use client");

import { useFormState } from "react-dom";
import { createItem } from "./actions";

const [state, formAction] = useFormState(createItem, null);
```

## Data Fetching

```tsx
// Server Component
async function getData() {
  const repository = getRepository();
  const items = await repository.query("USER#123", "ITEM#");
  return items;
}

export default async function Page() {
  const items = await getData();
  return <ItemList items={items} />;
}

// Client Component with API
("use client");

const [items, setItems] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetch("/api/items")
    .then((res) => res.json())
    .then((data) => {
      setItems(data.items);
      setLoading(false);
    });
}, []);
```

## DynamoDB Patterns

```tsx
import { getRepository } from "@/aws/dynamodb/repository";

const repository = getRepository();

// Create
await repository.create("ITEM", {
  id: "item-123",
  name: "Item Name",
  createdAt: new Date().toISOString(),
});

// Get
const item = await repository.get("USER#123", "ITEM#item-123");

// Query
const items = await repository.query("USER#123", "ITEM#");

// Update
await repository.update("USER#123", "ITEM#item-123", {
  name: "Updated Name",
});

// Delete
await repository.delete("USER#123", "ITEM#item-123");
```

## S3 Upload

```tsx
"use client";

import { useS3Upload } from "@/hooks/use-s3-upload";

const { upload, uploading, progress } = useS3Upload();

const handleUpload = async (file: File) => {
  const result = await upload(file, "folder/");
  if (result.success) {
    console.log("Uploaded:", result.url);
  }
};
```

## Bedrock AI Flow

```tsx
// Define schema
import { z } from "zod";

export const inputSchema = z.object({
  topic: z.string().min(10),
  style: z.enum(["professional", "casual"]),
});

export const outputSchema = z.object({
  content: z.string(),
  title: z.string(),
});

// Create flow
import { BedrockFlowBase } from "./flow-base";

export async function generateContent(input: z.infer<typeof inputSchema>) {
  const flow = new BedrockFlowBase(inputSchema, outputSchema);

  const prompt = `Generate content about: ${input.topic}
Style: ${input.style}

Return JSON with: { "title": "...", "content": "..." }`;

  return await flow.execute(input, prompt);
}

// Use in server action
export async function createContent(formData: FormData) {
  const input = {
    topic: formData.get("topic") as string,
    style: formData.get("style") as string,
  };

  const result = await generateContent(input);
  return { data: result };
}
```

## Responsive Hooks

```tsx
import { useMobile } from "@/hooks/use-mobile";
import { useTablet } from "@/hooks/use-tablet";

const isMobile = useMobile();
const isTablet = useTablet();

// Conditional rendering
{
  isMobile ? <MobileView /> : <DesktopView />;
}

// Conditional props
<Table variant={isMobile ? "card" : "table"} />;
```

## Toast Notifications

```tsx
import { useToast } from "@/hooks/use-toast";

const { toast } = useToast();

// Success
toast({
  title: "Success",
  description: "Item created successfully",
});

// Error
toast({
  title: "Error",
  description: "Failed to create item",
  variant: "destructive",
});

// With action
toast({
  title: "Item deleted",
  description: "Item has been removed",
  action: <Button onClick={undo}>Undo</Button>,
});
```

## Accessibility Checklist

- [ ] All buttons have `type="button"` or `type="submit"`
- [ ] All form inputs have associated labels
- [ ] All interactive elements have focus states
- [ ] All images have alt text
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Touch targets are at least 44x44px
- [ ] Keyboard navigation works
- [ ] ARIA labels are correct

## Testing Checklist

- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)
- [ ] Dark mode
- [ ] Loading states
- [ ] Empty states
- [ ] Error states
- [ ] Form validation
- [ ] Keyboard navigation
- [ ] Screen reader

## See Also

- [Component Reference](./component-reference.md) - Complete component API
- [Design System](./design-system/design-system.md) - Design guidelines
- [Best Practices](./best-practices.md) - Development guidelines

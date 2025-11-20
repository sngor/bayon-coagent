# Development Best Practices

Comprehensive guide for developing with Bayon Coagent.

## Code Organization

### File Structure

```
src/
├── app/              # Next.js App Router
│   ├── (app)/       # Authenticated routes (hub-based)
│   ├── api/         # API routes
│   └── actions.ts   # Server actions
├── aws/             # AWS service integrations
│   ├── auth/        # Cognito
│   ├── dynamodb/    # Database
│   ├── s3/          # Storage
│   └── bedrock/     # AI flows
├── components/      # React components
│   ├── ui/          # shadcn/ui primitives
│   ├── hub/         # Hub layout components
│   └── standard/    # Standard components
├── hooks/           # Custom React hooks
├── lib/             # Utilities
└── ai/schemas/      # Zod schemas for AI
```

### Import Patterns

Use absolute imports with `@/` prefix:

```tsx
// Good
import { getRepository } from "@/aws/dynamodb/repository";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Avoid
import { getRepository } from "../../../aws/dynamodb/repository";
```

## Component Patterns

### Server vs Client Components

Default to Server Components, use Client Components only when needed:

```tsx
// Server Component (default)
export default async function Page() {
  const data = await getData();
  return <div>{data}</div>;
}

// Client Component (when needed)
"use client";

export default function InteractiveComponent() {
  const [state, setState] = useState();
  return <button onClick={() => setState(...)}>Click</button>;
}
```

**Use Client Components for:**

- State management (`useState`, `useReducer`)
- Effects (`useEffect`)
- Event handlers
- Browser APIs
- Third-party libraries requiring browser context

### Standard Components

Always use standard components for consistency:

```tsx
// Good
import { StandardPageLayout, StandardCard } from "@/components/standard";

<StandardPageLayout title="Page">
  <StandardCard title="Card">{content}</StandardCard>
</StandardPageLayout>

// Avoid
<div className="container">
  <h1>Page</h1>
  <div className="card">{content}</div>
</div>
```

### Component Composition

Build complex UIs by composing simple components:

```tsx
// Good - Composable
function UserCard({ user }) {
  return (
    <StandardCard title={user.name}>
      <UserAvatar user={user} />
      <UserStats user={user} />
      <UserActions user={user} />
    </StandardCard>
  );
}

// Avoid - Monolithic
function UserCard({ user }) {
  return (
    <StandardCard title={user.name}>
      <div className="flex items-center gap-4">
        <img src={user.avatar} />
        <div>
          <p>{user.name}</p>
          <p>{user.email}</p>
        </div>
      </div>
      {/* 100+ lines of mixed concerns */}
    </StandardCard>
  );
}
```

## TypeScript

### Strict Mode

Always use strict TypeScript:

```tsx
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User> {
  return fetch(`/api/users/${id}`).then((res) => res.json());
}

// Avoid
function getUser(id: any): any {
  return fetch(`/api/users/${id}`).then((res) => res.json());
}
```

### Type Inference

Let TypeScript infer types when obvious:

```tsx
// Good
const items = ["a", "b", "c"]; // string[]
const count = items.length; // number

// Unnecessary
const items: string[] = ["a", "b", "c"];
const count: number = items.length;
```

### Zod for Runtime Validation

Use Zod for data validation:

```tsx
import { z } from "zod";

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  age: z.number().min(18).optional(),
});

type User = z.infer<typeof userSchema>;

// Validate
const result = userSchema.safeParse(data);
if (!result.success) {
  console.error(result.error);
}
```

## Data Fetching

### Server Components

Fetch data directly in Server Components:

```tsx
async function getData() {
  const repository = getRepository();
  return await repository.query("USER#123", "ITEM#");
}

export default async function Page() {
  const items = await getData();
  return <ItemList items={items} />;
}
```

### Client Components

Use API routes for client-side data fetching:

```tsx
// API route: app/api/items/route.ts
export async function GET() {
  const repository = getRepository();
  const items = await repository.query("USER#123", "ITEM#");
  return Response.json({ items });
}

// Client component
("use client");

const [items, setItems] = useState([]);

useEffect(() => {
  fetch("/api/items")
    .then((res) => res.json())
    .then((data) => setItems(data.items));
}, []);
```

### Server Actions

Use Server Actions for mutations:

```tsx
// app/actions.ts
"use server";

export async function createItem(formData: FormData) {
  const data = {
    name: formData.get("name") as string,
  };

  // Validate
  const schema = z.object({ name: z.string().min(1) });
  const result = schema.safeParse(data);

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  // Save
  const repository = getRepository();
  await repository.create("ITEM", result.data);

  return { message: "Created successfully" };
}

// Component
("use client");

import { useFormState } from "react-dom";
import { createItem } from "./actions";

const [state, formAction] = useFormState(createItem, null);

<form action={formAction}>
  <Input name="name" />
  <Button type="submit">Create</Button>
</form>;
```

## AWS Integration

### DynamoDB

Use single-table design with composite keys:

```tsx
import { getRepository } from "@/aws/dynamodb/repository";

const repository = getRepository();

// Keys: PK: USER#<userId>, SK: ITEM#<itemId>
await repository.create("ITEM", {
  id: "item-123",
  name: "Item Name",
  createdAt: new Date().toISOString(),
});

// Query all items for user
const items = await repository.query("USER#123", "ITEM#");
```

### S3

Use presigned URLs for uploads:

```tsx
import { useS3Upload } from "@/hooks/use-s3-upload";

const { upload, uploading, progress } = useS3Upload();

const handleUpload = async (file: File) => {
  const result = await upload(file, "folder/");
  if (result.success) {
    console.log("URL:", result.url);
  }
};
```

### Bedrock AI

Create flows with Zod schemas:

```tsx
// Define schemas
const inputSchema = z.object({
  topic: z.string().min(10),
});

const outputSchema = z.object({
  content: z.string(),
  title: z.string(),
});

// Create flow
export async function generateContent(input: z.infer<typeof inputSchema>) {
  const flow = new BedrockFlowBase(inputSchema, outputSchema);

  const prompt = `Generate content about: ${input.topic}
  
Return JSON: { "title": "...", "content": "..." }`;

  return await flow.execute(input, prompt);
}
```

## Styling

### Tailwind CSS

Use utility-first approach:

```tsx
// Good
<div className="flex items-center gap-4 p-6 rounded-lg bg-card">

// Avoid custom CSS
<div className="custom-card">
```

### Conditional Classes

Use `cn()` utility:

```tsx
import { cn } from "@/lib/utils";

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  variant === "primary" && "primary-classes"
)}>
```

### Responsive Design

Mobile-first with breakpoints:

```tsx
<div className="
  grid gap-4
  grid-cols-1
  md:grid-cols-2
  lg:grid-cols-3
">
```

## Performance

### Code Splitting

Use dynamic imports for heavy components:

```tsx
import dynamic from "next/dynamic";

const HeavyComponent = dynamic(() => import("./heavy-component"), {
  loading: () => <StandardLoadingSpinner />,
});
```

### Image Optimization

Use Next.js Image component:

```tsx
import Image from "next/image";

<Image
  src="/image.jpg"
  alt="Description"
  width={800}
  height={600}
  priority // for above-the-fold images
/>;
```

### Virtual Scrolling

Use for large lists (>100 items):

```tsx
import { useVirtualScroll } from "@/hooks/use-virtual-scroll";

const { visibleItems, containerRef, scrollerRef } = useVirtualScroll({
  items,
  itemHeight: 80,
  overscan: 5,
});
```

## Error Handling

### Try-Catch

Always handle errors:

```tsx
try {
  const result = await riskyOperation();
  return { data: result };
} catch (error) {
  console.error("Operation failed:", error);
  return { error: "Operation failed" };
}
```

### User Feedback

Show errors to users:

```tsx
import { useToast } from "@/hooks/use-toast";

const { toast } = useToast();

try {
  await saveData();
  toast({ title: "Success", description: "Data saved" });
} catch (error) {
  toast({
    title: "Error",
    description: "Failed to save data",
    variant: "destructive",
  });
}
```

## Accessibility

### Semantic HTML

Use proper HTML elements:

```tsx
// Good
<button onClick={handleClick}>Click</button>
<nav><a href="/page">Link</a></nav>

// Avoid
<div onClick={handleClick}>Click</div>
<div><span onClick={navigate}>Link</span></div>
```

### ARIA Labels

Add labels for screen readers:

```tsx
<button aria-label="Close dialog" onClick={onClose}>
  <X className="h-4 w-4" />
</button>
```

### Keyboard Navigation

Support keyboard interactions:

```tsx
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      handleClick();
    }
  }}
>
```

## Testing

### Manual Testing Checklist

- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)
- [ ] Dark mode
- [ ] Loading states
- [ ] Empty states
- [ ] Error states
- [ ] Form validation
- [ ] Keyboard navigation

### LocalStack Testing

Test AWS integrations locally:

```bash
npm run localstack:start
npm run localstack:init
npm run dev
```

## Git Workflow

### Commit Messages

Use clear, descriptive messages:

```bash
# Good
git commit -m "Add virtual staging feature to Reimagine"
git commit -m "Fix DynamoDB query pagination"
git commit -m "Update StandardCard component API"

# Avoid
git commit -m "fix"
git commit -m "updates"
git commit -m "wip"
```

### Branch Naming

Use descriptive branch names:

```bash
# Good
feature/virtual-staging
fix/dynamodb-pagination
refactor/standard-components

# Avoid
my-branch
test
updates
```

## See Also

- [Component Reference](./component-reference.md) - Component API
- [Quick Reference](./quick-reference.md) - Common patterns
- [Architecture](./guides/architecture.md) - System design

# Development Guide

Complete guide for developing features in the Bayon CoAgent platform.

## 🚀 Development Workflow

### Daily Development Process

```bash
# 1. Start development environment
npm run localstack:start    # Start local AWS services
npm run dev                 # Start Next.js dev server

# 2. Make changes and test
npm run typecheck          # Check TypeScript types
npm run lint              # Check code quality
npm test                  # Run tests

# 3. Commit changes
git add .
git commit -m "feat: add new feature"
git push origin feature-branch

# 4. End of day (optional)
npm run localstack:stop   # Stop LocalStack
```

### Development Environment Setup

Ensure you have the complete development environment:

```bash
# Verify all tools are installed
node --version    # v18+
npm --version     # 8+
docker --version  # 20+
git --version     # 2.30+

# Verify LocalStack is working
npm run verify:setup
```

## 🏗️ Project Architecture

### Hub-Based Development

The application is organized into hubs. When adding new features:

1. **Identify the correct hub** for your feature
2. **Follow the hub structure** for consistency
3. **Use hub components** for layout and navigation
4. **Update hub navigation** if adding new sections

### File Organization

```
src/
├── app/(app)/[hub]/        # Hub-specific pages
├── components/[hub]/       # Hub-specific components
├── components/ui/          # Reusable UI components
├── aws/                   # AWS service integrations
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and helpers
└── types/                 # TypeScript definitions
```

## 🎯 Feature Development

### Adding a New Feature

#### 1. Plan the Feature

- **Identify the hub** where the feature belongs
- **Define the user flow** and interactions
- **Plan the data model** and API requirements
- **Design the UI components** needed

#### 2. Create the Backend

**Server Actions** (for form submissions and mutations):

```typescript
// src/app/actions.ts
export async function createContent(formData: FormData) {
  // 1. Validate input with Zod
  const input = contentSchema.parse({
    title: formData.get("title"),
    content: formData.get("content"),
  });

  // 2. Get authenticated user
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  // 3. Call AWS service
  try {
    const result = await generateContent(input);

    // 4. Save to database
    await saveContent(user.id, result);

    // 5. Return success response
    return {
      success: true,
      data: result,
      message: "Content created successfully",
    };
  } catch (error) {
    return {
      error: "Failed to create content",
      details: error.message,
    };
  }
}
```

**API Routes** (for external integrations):

```typescript
// src/app/api/webhook/route.ts
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Process webhook
    await processWebhook(body);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
```

#### 3. Create AWS Service Integration

```typescript
// src/aws/[service]/client.ts
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { getAWSConfig } from "../config";

const client = new BedrockRuntimeClient(getAWSConfig());

export async function generateContent(input: ContentInput) {
  const command = new InvokeModelCommand({
    modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
    body: JSON.stringify({
      messages: [{ role: "user", content: input.prompt }],
      max_tokens: 1000,
    }),
  });

  const response = await client.send(command);
  const result = JSON.parse(new TextDecoder().decode(response.body));

  return result.content[0].text;
}
```

#### 4. Create Database Operations

```typescript
// src/aws/dynamodb/operations.ts
import { getRepository } from "./repository";

export async function saveContent(userId: string, content: ContentData) {
  const repository = getRepository();

  const item = {
    PK: `USER#${userId}`,
    SK: `CONTENT#${content.id}`,
    type: "content",
    title: content.title,
    content: content.content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await repository.put(item);
  return item;
}

export async function getContent(userId: string, contentId: string) {
  const repository = getRepository();

  return await repository.get({
    PK: `USER#${userId}`,
    SK: `CONTENT#${contentId}`,
  });
}
```

#### 5. Create Frontend Components

**Page Component** (Server Component):

```typescript
// src/app/(app)/studio/write/page.tsx
import { getCurrentUser } from "@/aws/auth/cognito-client";
import { getContent } from "@/aws/dynamodb/operations";
import { ContentForm } from "./content-form";

export default async function WritePage() {
  const user = await getCurrentUser();
  const recentContent = await getContent(user.id);

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Create Content</h1>
      <ContentForm />

      {recentContent.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Recent Content</h2>
          {/* Display recent content */}
        </div>
      )}
    </div>
  );
}
```

**Form Component** (Client Component):

```typescript
// src/app/(app)/studio/write/content-form.tsx
"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createContent } from "@/app/actions";

export function ContentForm() {
  const [result, setResult] = useState<string>("");

  async function handleSubmit(formData: FormData) {
    const response = await createContent(formData);

    if (response.success) {
      setResult(response.data.content);
    } else {
      console.error(response.error);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <Input name="title" placeholder="Content title" required />

      <Textarea
        name="prompt"
        placeholder="Describe what you want to create..."
        rows={4}
        required
      />

      <SubmitButton />

      {result && (
        <div className="mt-6 p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Generated Content:</h3>
          <div className="prose">{result}</div>
        </div>
      )}
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Generating..." : "Generate Content"}
    </Button>
  );
}
```

#### 6. Add Navigation

Update the hub navigation to include your new feature:

```typescript
// src/app/(app)/studio/layout.tsx
const tabs = [
  { id: "write", label: "Write", href: "/studio/write" },
  { id: "describe", label: "Describe", href: "/studio/describe" },
  { id: "reimagine", label: "Reimagine", href: "/studio/reimagine" },
  { id: "new-feature", label: "New Feature", href: "/studio/new-feature" }, // Add this
];
```

## 🧪 Testing Strategy

### Unit Testing

```typescript
// __tests__/content-generation.test.ts
import { generateContent } from "@/aws/bedrock/client";

describe("Content Generation", () => {
  test("generates content from prompt", async () => {
    const input = { prompt: "Write about real estate trends" };
    const result = await generateContent(input);

    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });
});
```

### Integration Testing

```typescript
// __tests__/content-workflow.test.ts
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ContentForm } from "@/app/(app)/studio/write/content-form";

test("content creation workflow", async () => {
  render(<ContentForm />);

  // Fill form
  fireEvent.change(screen.getByPlaceholderText("Content title"), {
    target: { value: "Test Title" },
  });

  fireEvent.change(
    screen.getByPlaceholderText("Describe what you want to create..."),
    {
      target: { value: "Test prompt" },
    }
  );

  // Submit form
  fireEvent.click(screen.getByText("Generate Content"));

  // Wait for result
  await waitFor(() => {
    expect(screen.getByText("Generated Content:")).toBeInTheDocument();
  });
});
```

### End-to-End Testing

```typescript
// e2e/content-creation.spec.ts
import { test, expect } from "@playwright/test";

test("user can create content", async ({ page }) => {
  await page.goto("/studio/write");

  await page.fill('[placeholder="Content title"]', "Test Blog Post");
  await page.fill(
    '[placeholder="Describe what you want to create..."]',
    "Write about Seattle real estate"
  );

  await page.click("text=Generate Content");

  await expect(page.locator("text=Generated Content:")).toBeVisible();
});
```

## 🎨 UI Development

### Component Development

Follow these patterns for consistent UI:

```typescript
// Use TypeScript interfaces
interface ComponentProps {
  title: string;
  description?: string;
  onAction?: () => void;
}

// Use forwardRef for components that need refs
const Component = forwardRef<HTMLDivElement, ComponentProps>(
  ({ title, description, onAction }, ref) => {
    return (
      <div ref={ref} className="component-styles">
        <h3>{title}</h3>
        {description && <p>{description}</p>}
        {onAction && <Button onClick={onAction}>Action</Button>}
      </div>
    );
  }
);

Component.displayName = "Component";
```

### Styling Guidelines

```typescript
// Use cn() utility for conditional classes
import { cn } from '@/lib/utils';

<div className={cn(
  'base-styles',
  variant === 'primary' && 'primary-styles',
  disabled && 'disabled-styles'
)}>
  Content
</div>

// Use CSS variables for theming
<div className="bg-background text-foreground border-border">
  Themed content
</div>

// Use responsive classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  Responsive grid
</div>
```

### Animation Guidelines

```typescript
// Use Framer Motion for complex animations
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Animated content
</motion.div>

// Use CSS classes for simple animations
<div className="animate-fade-in">
  Simple fade in
</div>
```

## 🔧 Development Tools

### TypeScript Error Analysis Tools

The project includes specialized scripts for TypeScript error management:

#### Error Analysis Script

```bash
node scripts/analyze-typescript-errors.js
```

**Features**:

- **Intelligent categorization** of TypeScript errors by type
- **Priority-based recommendations** (High → Medium → Low)
- **Quick wins identification** for maximum impact fixes
- **File-based error distribution** showing problem areas
- **Actionable suggestions** for each error category

**Error Categories**:

- **Missing Modules**: Import path issues, missing dependencies
- **Type Mismatches**: Incompatible type assignments
- **Missing Properties**: Required object properties not provided
- **Parameter Issues**: Function parameter type problems
- **Any Type Issues**: Implicit any types reducing type safety
- **Import/Export Issues**: Module resolution problems

#### Auto-Fix Scripts

```bash
# Fix common TypeScript patterns
node scripts/fix-typescript-errors.js

# Replace console.log with proper logging
node scripts/fix-console-logging.js
```

### VS Code Extensions

Recommended extensions for development:

- **TypeScript Hero** - TypeScript support
- **ES7+ React/Redux/React-Native snippets** - React snippets
- **Tailwind CSS IntelliSense** - Tailwind autocomplete
- **Auto Rename Tag** - HTML tag renaming
- **Bracket Pair Colorizer** - Bracket highlighting
- **GitLens** - Git integration
- **Prettier** - Code formatting
- **ESLint** - Code linting

### VS Code Settings

```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "'([^']*)'"],
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

### Logging Standards

The codebase follows standardized logging practices for consistency and better monitoring:

```typescript
import { createLogger } from "@/aws/logging/logger";
const logger = createLogger({ service: "your-service-name" });

// ✅ Use explicit log levels
logger.info("Operation started", { userId, operation: "data-processing" });
logger.warn("Rate limit approaching", { current: 95, limit: 100 });
logger.error("Operation failed", error, { context: "additional-info" });

// ❌ Don't use logger.log() - deprecated for consistency
// logger.log('Some message'); // Use logger.info() instead
```

**Key Points**:

- Always use explicit log levels (`info`, `warn`, `error`, `debug`)
- Include relevant context in log messages
- Use service-specific loggers for better organization
- Follow the patterns in `/src/aws/logging/README.md`

### Debugging

#### TypeScript Error Analysis

Use the built-in error analysis tool for intelligent TypeScript debugging:

```bash
# Analyze and categorize TypeScript errors
node scripts/analyze-typescript-errors.js
```

This tool provides:

- **Error categorization** by type (Missing Modules, Type Mismatches, etc.)
- **Priority recommendations** (High, Medium, Low priority fixes)
- **Quick wins identification** (simple fixes for maximum impact)
- **File-based error distribution** (which files have the most errors)
- **Actionable suggestions** for each error category

#### Browser Debugging

1. **Chrome DevTools**: Use for frontend debugging
2. **React DevTools**: Install browser extension
3. **Network Tab**: Monitor API requests
4. **Console**: Check for JavaScript errors

#### VS Code Debugging

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

## 📊 Performance Optimization

### Code Splitting

```typescript
// Dynamic imports for heavy components
import dynamic from "next/dynamic";

const HeavyComponent = dynamic(() => import("./heavy-component"), {
  loading: () => <div>Loading...</div>,
  ssr: false, // Disable SSR if needed
});
```

### Image Optimization

```typescript
// Use Next.js Image component
import Image from "next/image";

<Image
  src="/image.jpg"
  alt="Description"
  width={500}
  height={300}
  priority // For above-the-fold images
/>;
```

### Bundle Analysis

```bash
# Analyze bundle size
npm run build:analyze

# Check bundle size limits
npm run bundle:check

# Track bundle size changes
npm run bundle:track
```

## 🔐 Security Best Practices

### Input Validation

```typescript
// Always validate inputs with Zod
import { z } from "zod";

const schema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1).max(5000),
});

// In server actions
const input = schema.parse(formData);
```

### Authentication

```typescript
// Always check authentication in server actions
const user = await getCurrentUser();
if (!user) {
  return { error: "Unauthorized" };
}
```

### Data Sanitization

```typescript
// Sanitize HTML content
import DOMPurify from "dompurify";

const sanitizedContent = DOMPurify.sanitize(userContent);
```

## 🚀 Deployment

### Pre-deployment Checklist

```bash
# 1. Analyze TypeScript errors (if any)
node scripts/analyze-typescript-errors.js

# 2. Run all checks
npm run lint
npm run typecheck
npm test
npm run build

# 3. Test locally
npm run start

# 4. Check bundle size
npm run bundle:check

# 5. Run security checks
npm run security:check
```

### Environment Configuration

Ensure all environment variables are properly configured:

```bash
# Development
USE_LOCAL_AWS=true
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test

# Production
USE_LOCAL_AWS=false
# Real AWS credentials via IAM roles
```

## 📚 Learning Resources

### Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [AWS SDK Documentation](https://docs.aws.amazon.com/sdk-for-javascript/)

### Internal Resources

- [Architecture Guide](./architecture.md) - System design
- [Component Reference](../quick-reference/components.md) - UI components
- [Best Practices](../best-practices.md) - Development guidelines
- [Troubleshooting](../troubleshooting/common-issues.md) - Common problems

This development guide provides a comprehensive foundation for building features in the Bayon CoAgent platform.

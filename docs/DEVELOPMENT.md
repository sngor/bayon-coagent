# Development Guide

## Development Workflow

This guide covers the day-to-day development workflow, patterns, and best practices for Bayon CoAgent.

## Getting Started

### Prerequisites Setup

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local

# Start local services
npm run localstack:start
npm run localstack:init

# Start development server
npm run dev
```

## Development Patterns

### Hub-Based Development

Each feature belongs to a specific hub. When adding new features:

1. **Identify the Hub** - Determine which hub the feature belongs to
2. **Follow Hub Structure** - Use existing patterns within that hub
3. **Update Navigation** - Add to hub tabs if needed
4. **Maintain Consistency** - Follow established UI patterns

```typescript
// Hub Structure Example
src/app/(app)/studio/
├── layout.tsx          # Hub layout with tabs
├── page.tsx           # Hub overview (usually redirects)
├── write/
│   └── page.tsx       # Write feature
├── describe/
│   └── page.tsx       # Describe feature
└── reimagine/
    └── page.tsx       # Reimagine feature
```

### Component Development

#### Server Components (Default)

Use Server Components by default for better performance:

```typescript
// Server Component (default)
export default async function ProfilePage() {
  const user = await getCurrentUser();
  const profile = await getUserProfile(user.id);
  
  return (
    <div>
      <ProfileHeader profile={profile} />
      <ProfileForm profile={profile} />
    </div>
  );
}
```

#### Client Components (When Needed)

Use Client Components only when you need:
- Event handlers
- State management
- Browser APIs
- Third-party libraries that require client-side execution

```typescript
'use client';

import { useState } from 'react';

export function InteractiveForm() {
  const [formData, setFormData] = useState({});
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Handle form submission
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form content */}
    </form>
  );
}
```

### Server Actions Pattern

All API interactions use Server Actions for type safety and better UX:

```typescript
// Define Server Action
export async function createContentAction(
  formData: FormData
): Promise<ActionResponse<Content>> {
  try {
    // 1. Validate input
    const validatedFields = createContentSchema.safeParse({
      title: formData.get('title'),
      content: formData.get('content'),
      type: formData.get('type'),
    });

    if (!validatedFields.success) {
      return {
        message: 'Validation failed',
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    // 2. Get current user
    const user = await getCurrentUser();
    if (!user) {
      return { message: 'Unauthorized' };
    }

    // 3. Business logic
    const content = await generateContent(validatedFields.data);
    const contentId = await saveContent(user.id, content);

    // 4. Return success response
    return {
      message: 'Content created successfully',
      data: { ...content, id: contentId },
    };
  } catch (error) {
    console.error('Create content error:', error);
    return { message: 'Failed to create content' };
  }
}

// Use in component
export function ContentForm() {
  const [state, formAction] = useFormState(createContentAction, null);
  
  return (
    <form action={formAction}>
      <input name="title" placeholder="Title" />
      <textarea name="content" placeholder="Content" />
      <select name="type">
        <option value="blog">Blog Post</option>
        <option value="social">Social Media</option>
      </select>
      <button type="submit">Create Content</button>
      
      {state?.message && (
        <div className={state.data ? 'text-green-600' : 'text-red-600'}>
          {state.message}
        </div>
      )}
    </form>
  );
}
```

### Type Safety Patterns

#### Zod Schemas for Validation

```typescript
// Define schemas
export const createContentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  type: z.enum(['blog', 'social', 'listing']),
  tags: z.array(z.string()).optional(),
});

export type CreateContentInput = z.infer<typeof createContentSchema>;

// Use in Server Actions
const validatedFields = createContentSchema.safeParse(rawData);
if (!validatedFields.success) {
  return { errors: validatedFields.error.flatten().fieldErrors };
}
```

#### TypeScript Interfaces

```typescript
// Shared types
export interface User {
  id: string;
  email: string;
  name: string;
  roles: UserRole[];
  subscription: SubscriptionTier;
  createdAt: string;
  updatedAt: string;
}

export interface Content {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: ContentType;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
}

// Action response pattern
export interface ActionResponse<T = any> {
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}
```

### Database Patterns

#### Repository Pattern

```typescript
// Repository interface
interface Repository {
  // User operations
  getUserProfile(userId: string): Promise<UserProfile | null>;
  updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<void>;
  
  // Content operations
  saveContent(userId: string, content: Content): Promise<string>;
  getUserContent(userId: string, type?: ContentType): Promise<Content[]>;
  getContent(userId: string, contentId: string): Promise<Content | null>;
  
  // Analytics operations
  trackEvent(userId: string, event: AnalyticsEvent): Promise<void>;
  getAnalytics(userId: string, timeframe: string): Promise<Analytics>;
}

// Usage in Server Actions
export async function getUserContentAction(type?: ContentType) {
  const user = await getCurrentUser();
  if (!user) return { message: 'Unauthorized' };
  
  const content = await repository.getUserContent(user.id, type);
  return { data: content };
}
```

#### DynamoDB Key Patterns

```typescript
// Key generation utilities
export const keys = {
  user: (userId: string) => ({
    PK: `USER#${userId}`,
    SK: 'PROFILE'
  }),
  
  content: (userId: string, contentId: string) => ({
    PK: `USER#${userId}`,
    SK: `CONTENT#${contentId}`
  }),
  
  analytics: (userId: string, date: string) => ({
    PK: `USER#${userId}`,
    SK: `ANALYTICS#${date}`
  })
};

// Query patterns
const getUserContent = async (userId: string, type?: ContentType) => {
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `USER#${userId}`,
      ':sk': 'CONTENT#'
    }
  };
  
  if (type) {
    params.FilterExpression = 'contentType = :type';
    params.ExpressionAttributeValues[':type'] = type;
  }
  
  const result = await dynamodb.query(params).promise();
  return result.Items?.map(item => unmarshall(item)) || [];
};
```

### AI Integration Patterns

#### AI Flow Development

```typescript
// Define AI flow
export interface AIFlow<TInput, TOutput> {
  name: string;
  modelId: string;
  systemPrompt: string;
  inputSchema: ZodSchema<TInput>;
  outputSchema: ZodSchema<TOutput>;
  
  execute(input: TInput): Promise<TOutput>;
}

// Implement specific flow
export const blogPostFlow: AIFlow<BlogPostInput, BlogPostOutput> = {
  name: 'blog-post-generation',
  modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  systemPrompt: `You are an expert real estate content writer...`,
  inputSchema: blogPostInputSchema,
  outputSchema: blogPostOutputSchema,
  
  async execute(input: BlogPostInput): Promise<BlogPostOutput> {
    const prompt = `Write a blog post about ${input.topic}...`;
    
    const response = await bedrockClient.invokeModel({
      modelId: this.modelId,
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 4000,
        system: this.systemPrompt,
        messages: [{ role: 'user', content: prompt }]
      })
    }).promise();
    
    const result = JSON.parse(response.body.toString());
    return this.outputSchema.parse(result);
  }
};

// Use in Server Action
export async function generateBlogPostAction(input: BlogPostInput) {
  try {
    const result = await blogPostFlow.execute(input);
    return { data: result };
  } catch (error) {
    return { message: 'Failed to generate blog post' };
  }
}
```

### UI Component Patterns

#### Compound Components

```typescript
// Compound component pattern
export function Card({ children, className, ...props }: CardProps) {
  return (
    <div className={cn('rounded-lg border bg-card', className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }: CardHeaderProps) {
  return (
    <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ children, className, ...props }: CardContentProps) {
  return (
    <div className={cn('p-6 pt-0', className)} {...props}>
      {children}
    </div>
  );
}

// Usage
<Card>
  <CardHeader>
    <CardTitle>Content Generation</CardTitle>
    <CardDescription>Create AI-powered content</CardDescription>
  </CardHeader>
  <CardContent>
    <ContentForm />
  </CardContent>
</Card>
```

#### Custom Hooks

```typescript
// Custom hook for data fetching
export function useUserContent(type?: ContentType) {
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchContent() {
      try {
        setLoading(true);
        const response = await getUserContentAction(type);
        if (response.data) {
          setContent(response.data);
        } else {
          setError(response.message);
        }
      } catch (err) {
        setError('Failed to fetch content');
      } finally {
        setLoading(false);
      }
    }
    
    fetchContent();
  }, [type]);
  
  return { content, loading, error, refetch: fetchContent };
}

// Usage in component
export function ContentList({ type }: { type?: ContentType }) {
  const { content, loading, error } = useUserContent(type);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  
  return (
    <div className="space-y-4">
      {content.map(item => (
        <ContentCard key={item.id} content={item} />
      ))}
    </div>
  );
}
```

## Testing Patterns

### Unit Testing

```typescript
// Component testing
import { render, screen } from '@testing-library/react';
import { ContentCard } from './content-card';

describe('ContentCard', () => {
  const mockContent = {
    id: '1',
    title: 'Test Content',
    content: 'Test content body',
    type: 'blog' as const,
    createdAt: '2024-01-01T00:00:00Z'
  };
  
  it('renders content correctly', () => {
    render(<ContentCard content={mockContent} />);
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.getByText('Test content body')).toBeInTheDocument();
  });
});

// Server Action testing
import { createContentAction } from './actions';

describe('createContentAction', () => {
  it('creates content successfully', async () => {
    const formData = new FormData();
    formData.append('title', 'Test Title');
    formData.append('content', 'Test content');
    formData.append('type', 'blog');
    
    const result = await createContentAction(formData);
    
    expect(result.data).toBeDefined();
    expect(result.message).toBe('Content created successfully');
  });
});
```

### Integration Testing

```typescript
// API testing
describe('Content API Integration', () => {
  beforeEach(async () => {
    // Set up test data
    await setupTestUser();
  });
  
  afterEach(async () => {
    // Clean up test data
    await cleanupTestData();
  });
  
  it('creates and retrieves content', async () => {
    // Create content
    const createResult = await createContentAction(testFormData);
    expect(createResult.data).toBeDefined();
    
    // Retrieve content
    const getResult = await getUserContentAction();
    expect(getResult.data).toContain(
      expect.objectContaining({ id: createResult.data.id })
    );
  });
});
```

## Performance Optimization

### React Optimization

```typescript
// Memoization
const ExpensiveComponent = memo(({ data }: Props) => {
  const expensiveValue = useMemo(() => {
    return data.reduce((acc, item) => acc + item.value, 0);
  }, [data]);
  
  return <div>{expensiveValue}</div>;
});

// Debounced search
export function SearchInput({ onSearch }: { onSearch: (term: string) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  
  useEffect(() => {
    onSearch(debouncedSearch);
  }, [debouncedSearch, onSearch]);
  
  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

### Bundle Optimization

```typescript
// Dynamic imports for code splitting
const HeavyComponent = lazy(() => import('./heavy-component'));

export function ConditionalComponent({ showHeavy }: Props) {
  return (
    <div>
      {showHeavy && (
        <Suspense fallback={<LoadingSpinner />}>
          <HeavyComponent />
        </Suspense>
      )}
    </div>
  );
}

// Optimize imports
// ❌ Don't import entire library
import * as icons from 'lucide-react';

// ✅ Import only what you need
import { Search, User, Settings } from 'lucide-react';
```

## Error Handling

### Error Boundaries

```typescript
// Error boundary component
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught error:', error, errorInfo);
    // Log to monitoring service
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-200 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800">
            Something went wrong
          </h2>
          <p className="text-red-600">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded"
          >
            Try Again
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

### Server Action Error Handling

```typescript
// Centralized error handling
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string
): Promise<ActionResponse<T>> {
  try {
    const result = await operation();
    return { message: 'Success', data: result };
  } catch (error) {
    console.error(`${context} error:`, error);
    
    if (error instanceof ValidationError) {
      return { message: 'Validation failed', errors: error.errors };
    }
    
    if (error instanceof AuthenticationError) {
      return { message: 'Authentication required' };
    }
    
    if (error instanceof AuthorizationError) {
      return { message: 'Insufficient permissions' };
    }
    
    return { message: 'An unexpected error occurred' };
  }
}

// Usage
export async function createContentAction(formData: FormData) {
  return withErrorHandling(async () => {
    const validatedFields = validateInput(formData);
    const user = await requireAuth();
    const content = await generateContent(validatedFields);
    return await saveContent(user.id, content);
  }, 'Create content');
}
```

## Development Tools

### Useful Commands

```bash
# Development
npm run dev                 # Start dev server
npm run typecheck          # Type checking
npm run lint               # Linting
npm run lint:fix           # Fix linting issues

# Testing
npm test                   # Run tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report

# LocalStack
npm run localstack:start   # Start LocalStack
npm run localstack:init    # Initialize resources
npm run localstack:logs    # View logs

# Build & Deploy
npm run build              # Production build
npm run sam:deploy:dev     # Deploy to dev
npm run sam:deploy:prod    # Deploy to prod
```

### VS Code Extensions

Recommended extensions for development:

- **TypeScript** - Language support
- **Tailwind CSS IntelliSense** - CSS class completion
- **ES7+ React/Redux/React-Native snippets** - Code snippets
- **Auto Rename Tag** - HTML/JSX tag renaming
- **Bracket Pair Colorizer** - Bracket matching
- **GitLens** - Git integration
- **Thunder Client** - API testing

### Development Environment

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

## Best Practices Summary

### Code Quality
1. **Use TypeScript strictly** - No `any` types
2. **Validate all inputs** - Use Zod schemas
3. **Handle errors gracefully** - Comprehensive error handling
4. **Write tests** - Unit and integration tests
5. **Follow conventions** - Consistent naming and structure

### Performance
1. **Server Components first** - Use Client Components sparingly
2. **Optimize bundles** - Dynamic imports and tree shaking
3. **Implement caching** - Multiple caching layers
4. **Monitor performance** - Track Core Web Vitals
5. **Optimize images** - Use Next.js Image component

### Security
1. **Validate inputs** - Server-side validation
2. **Sanitize data** - Prevent XSS attacks
3. **Use HTTPS** - Secure communication
4. **Implement CSRF protection** - Form security
5. **Follow least privilege** - Minimal permissions

### Maintainability
1. **Organize by feature** - Hub-based structure
2. **Use consistent patterns** - Established conventions
3. **Document decisions** - Clear documentation
4. **Refactor regularly** - Keep code clean
5. **Review code** - Peer reviews and quality checks

This development guide provides the foundation for building high-quality, maintainable features in Bayon CoAgent. Follow these patterns and practices to ensure consistency and reliability across the platform.
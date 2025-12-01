# Testimonials Developer Guide

## Overview

This guide provides technical documentation for the Testimonials feature, including API endpoints, data models, integration patterns, and implementation details.

## Table of Contents

1. [Architecture](#architecture)
2. [Data Models](#data-models)
3. [API Reference](#api-reference)
4. [Repository Layer](#repository-layer)
5. [Service Layer](#service-layer)
6. [UI Components](#ui-components)
7. [Integration Guide](#integration-guide)
8. [Testing](#testing)

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                         UI Layer                             │
│  TestimonialList, TestimonialForm, TestimonialRequestForm   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Server Actions                          │
│  createTestimonialAction, sendTestimonialRequestAction, etc. │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                           │
│  TestimonialService, TestimonialRequestService               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Repository Layer                         │
│  TestimonialRepository, TestimonialRequestRepository         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                              │
│           DynamoDB (entities) + S3 (photos)                  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Creating a Testimonial**:

1. User submits form → UI Component
2. Component calls Server Action
3. Server Action validates input
4. Calls TestimonialService
5. Service calls Repository
6. Repository writes to DynamoDB
7. If photo included, uploads to S3
8. Returns success/error to UI

**Requesting a Testimonial**:

1. Agent submits request → UI Component
2. Component calls Server Action
3. Server Action creates request with unique token
4. Stores in DynamoDB
5. Sends email with submission link
6. Returns success/error to UI

---

## Data Models

### Testimonial Entity

```typescript
interface Testimonial {
  id: string; // UUID
  userId: string; // Agent's user ID
  clientName: string; // Client's full name
  testimonialText: string; // The testimonial content
  dateReceived: string; // ISO 8601 timestamp
  clientPhotoUrl?: string; // S3 URL for client photo
  isFeatured: boolean; // Display on profile page
  displayOrder?: number; // Order for featured testimonials (1-6)
  tags: string[]; // Categories (e.g., ["buyer", "luxury"])
  requestId?: string; // Link to testimonial request if applicable
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
}
```

**DynamoDB Keys**:

```typescript
PK: USER#<userId>
SK: TESTIMONIAL#<testimonialId>
EntityType: Testimonial
```

**Indexes**:

- GSI1: Featured testimonials by displayOrder
- GSI2: Testimonials by dateReceived (for sorting)

### TestimonialRequest Entity

```typescript
interface TestimonialRequest {
  id: string; // UUID
  userId: string; // Agent's user ID
  clientName: string; // Client's full name
  clientEmail: string; // Client's email address
  status: "pending" | "submitted" | "expired";
  submissionLink: string; // Unique URL for client submission
  sentAt: string; // ISO 8601 timestamp
  reminderSentAt?: string; // ISO 8601 timestamp for reminder
  submittedAt?: string; // ISO 8601 timestamp when submitted
  expiresAt: string; // ISO 8601 timestamp (30 days from sent)
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
}
```

**DynamoDB Keys**:

```typescript
PK: USER#<userId>
SK: REQUEST#<requestId>
EntityType: TestimonialRequest
```

**Indexes**:

- GSI1: Requests by status
- GSI2: Requests by sentAt (for reminder processing)

### S3 Storage Structure

```
bayon-coagent-<env>/
  users/
    <userId>/
      testimonials/
        <testimonialId>/
          client-photo.jpg
```

---

## API Reference

### Server Actions

All server actions are located in `src/app/testimonial-actions.ts`.

#### createTestimonialAction

Creates a new testimonial.

```typescript
async function createTestimonialAction(
  testimonial: Omit<Testimonial, "id" | "createdAt" | "updatedAt">
): Promise<ActionResult<Testimonial>>;
```

**Parameters**:

- `testimonial`: Testimonial data without system-generated fields

**Returns**:

```typescript
{
  message: string;
  data?: Testimonial;
  errors?: string[];
}
```

**Example**:

```typescript
const result = await createTestimonialAction({
  userId: "user-123",
  clientName: "John Doe",
  testimonialText: "Great service!",
  dateReceived: new Date().toISOString(),
  isFeatured: false,
  tags: ["buyer"],
});

if (result.data) {
  console.log("Created:", result.data.id);
}
```

#### updateTestimonialAction

Updates an existing testimonial.

```typescript
async function updateTestimonialAction(
  testimonialId: string,
  updates: Partial<Testimonial>
): Promise<ActionResult<Testimonial>>;
```

**Parameters**:

- `testimonialId`: ID of testimonial to update
- `updates`: Fields to update (partial)

**Returns**: Same as createTestimonialAction

**Note**: `dateReceived` cannot be updated (immutable).

#### deleteTestimonialAction

Deletes a testimonial and associated S3 assets.

```typescript
async function deleteTestimonialAction(
  testimonialId: string
): Promise<ActionResult<void>>;
```

**Parameters**:

- `testimonialId`: ID of testimonial to delete

**Returns**:

```typescript
{
  message: string;
  errors?: string[];
}
```

#### uploadClientPhotoAction

Uploads a client photo to S3.

```typescript
async function uploadClientPhotoAction(
  testimonialId: string,
  photoData: string // base64 encoded
): Promise<ActionResult<{ url: string }>>;
```

**Parameters**:

- `testimonialId`: ID of testimonial
- `photoData`: Base64 encoded image data

**Returns**:

```typescript
{
  message: string;
  data?: { url: string };
  errors?: string[];
}
```

**Example**:

```typescript
const result = await uploadClientPhotoAction(
  "testimonial-123",
  "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
);

if (result.data) {
  console.log("Photo URL:", result.data.url);
}
```

#### sendTestimonialRequestAction

Sends a testimonial request email to a client.

```typescript
async function sendTestimonialRequestAction(
  clientName: string,
  clientEmail: string
): Promise<ActionResult<TestimonialRequest>>;
```

**Parameters**:

- `clientName`: Client's full name
- `clientEmail`: Client's email address

**Returns**:

```typescript
{
  message: string;
  data?: TestimonialRequest;
  errors?: string[];
}
```

**Process**:

1. Generates unique submission token
2. Creates request record in DynamoDB
3. Sends email with submission link
4. Sets expiration to 30 days

#### submitTestimonialAction

Handles client testimonial submission (public endpoint).

```typescript
async function submitTestimonialAction(
  requestId: string,
  testimonialText: string
): Promise<ActionResult<Testimonial>>;
```

**Parameters**:

- `requestId`: ID from submission link
- `testimonialText`: Client's testimonial

**Returns**: Same as createTestimonialAction

**Validation**:

- Request must exist
- Request must be 'pending' status
- Request must not be expired

---

## Repository Layer

### TestimonialRepository

Located in `src/aws/dynamodb/testimonial-repository.ts`.

#### Methods

**createTestimonial**:

```typescript
async createTestimonial(
  testimonial: Omit<Testimonial, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Testimonial>
```

**getTestimonial**:

```typescript
async getTestimonial(
  userId: string,
  testimonialId: string
): Promise<Testimonial | null>
```

**queryTestimonials**:

```typescript
async queryTestimonials(
  userId: string,
  options?: {
    limit?: number;
    sortBy?: 'dateReceived' | 'createdAt';
    order?: 'asc' | 'desc';
  }
): Promise<Testimonial[]>
```

**updateTestimonial**:

```typescript
async updateTestimonial(
  userId: string,
  testimonialId: string,
  updates: Partial<Testimonial>
): Promise<Testimonial>
```

**deleteTestimonial**:

```typescript
async deleteTestimonial(
  userId: string,
  testimonialId: string
): Promise<void>
```

**queryFeaturedTestimonials**:

```typescript
async queryFeaturedTestimonials(
  userId: string
): Promise<Testimonial[]>
```

Returns up to 6 featured testimonials sorted by displayOrder.

### TestimonialRequestRepository

Located in `src/aws/dynamodb/testimonial-request-repository.ts`.

#### Methods

**createRequest**:

```typescript
async createRequest(
  request: Omit<TestimonialRequest, 'id' | 'createdAt' | 'updatedAt'>
): Promise<TestimonialRequest>
```

**getRequest**:

```typescript
async getRequest(
  userId: string,
  requestId: string
): Promise<TestimonialRequest | null>
```

**getRequestByToken**:

```typescript
async getRequestByToken(
  token: string
): Promise<TestimonialRequest | null>
```

**queryRequests**:

```typescript
async queryRequests(
  userId: string,
  status?: 'pending' | 'submitted' | 'expired'
): Promise<TestimonialRequest[]>
```

**updateRequestStatus**:

```typescript
async updateRequestStatus(
  userId: string,
  requestId: string,
  status: 'pending' | 'submitted' | 'expired'
): Promise<TestimonialRequest>
```

**queryPendingRequests**:

```typescript
async queryPendingRequests(): Promise<TestimonialRequest[]>
```

Used by reminder Lambda to find requests needing reminders.

---

## Service Layer

### TestimonialService

Located in `src/services/testimonial-service.ts`.

Provides business logic layer above repository:

```typescript
class TestimonialService {
  // Create testimonial with validation
  async createTestimonial(data: CreateTestimonialInput): Promise<Testimonial>;

  // Upload photo to S3 and update testimonial
  async uploadClientPhoto(
    testimonialId: string,
    photoData: string
  ): Promise<string>;

  // Delete testimonial and cleanup S3
  async deleteTestimonial(userId: string, testimonialId: string): Promise<void>;

  // Manage featured testimonials (max 6)
  async setFeatured(
    userId: string,
    testimonialId: string,
    featured: boolean
  ): Promise<Testimonial>;

  // Reorder featured testimonials
  async reorderFeatured(
    userId: string,
    testimonialIds: string[]
  ): Promise<void>;
}
```

### TestimonialRequestService

Located in `src/services/testimonial-request-service.ts`.

```typescript
class TestimonialRequestService {
  // Send testimonial request email
  async sendRequest(
    userId: string,
    clientName: string,
    clientEmail: string
  ): Promise<TestimonialRequest>;

  // Process client submission
  async submitTestimonial(
    token: string,
    testimonialText: string
  ): Promise<Testimonial>;

  // Send reminder for pending requests
  async sendReminder(requestId: string): Promise<void>;

  // Mark expired requests
  async expireOldRequests(): Promise<number>;
}
```

---

## UI Components

### TestimonialList

Displays all testimonials with filtering and search.

**Location**: `src/components/testimonial-list.tsx`

**Props**:

```typescript
interface TestimonialListProps {
  userId: string;
  initialTestimonials?: Testimonial[];
}
```

**Features**:

- Filter by date range, featured status, has photo, tags
- Search by client name or testimonial text
- Pagination
- Sort by date received or created date
- Click to view details

### TestimonialForm

Create/edit testimonial form.

**Location**: `src/components/testimonial-form.tsx`

**Props**:

```typescript
interface TestimonialFormProps {
  testimonial?: Testimonial; // For editing
  onSuccess?: (testimonial: Testimonial) => void;
  onCancel?: () => void;
}
```

**Features**:

- Client name input
- Testimonial text textarea
- Date picker for dateReceived
- Photo upload with preview
- Tags input (comma-separated)
- Featured toggle
- Form validation

### TestimonialRequestForm

Send testimonial request form.

**Location**: `src/components/testimonial-request-form.tsx`

**Props**:

```typescript
interface TestimonialRequestFormProps {
  onSuccess?: (request: TestimonialRequest) => void;
  onCancel?: () => void;
}
```

**Features**:

- Client name input
- Client email input with validation
- Preview of email that will be sent
- Success message with tracking info

### FeaturedTestimonialSelector

Manage featured testimonials with drag-and-drop.

**Location**: `src/components/featured-testimonial-selector.tsx`

**Props**:

```typescript
interface FeaturedTestimonialSelectorProps {
  userId: string;
  testimonials: Testimonial[];
  onUpdate?: () => void;
}
```

**Features**:

- Display up to 6 featured testimonials
- Drag-and-drop reordering
- Toggle featured status
- Visual indicator of display order

### ProfileTestimonialsDisplay

Display testimonials on public profile.

**Location**: `src/components/profile-testimonials-display.tsx`

**Props**:

```typescript
interface ProfileTestimonialsDisplayProps {
  userId: string;
  testimonials: Testimonial[];
}
```

**Features**:

- Grid layout (2 columns on desktop, 1 on mobile)
- Client photo display
- Testimonial text with read more
- Date display
- Schema markup included

---

## Integration Guide

### Adding Testimonials to a New Page

1. **Import components**:

```typescript
import { TestimonialList } from "@/components/testimonial-list";
import { TestimonialForm } from "@/components/testimonial-form";
```

2. **Fetch testimonials** (Server Component):

```typescript
import { getRepository } from "@/aws/dynamodb/repository";

export default async function TestimonialsPage() {
  const repo = getRepository();
  const testimonials = await repo.queryTestimonials(userId);

  return <TestimonialList userId={userId} initialTestimonials={testimonials} />;
}
```

3. **Add create button**:

```typescript
<Button onClick={() => setShowForm(true)}>New Testimonial</Button>;

{
  showForm && (
    <TestimonialForm
      onSuccess={(testimonial) => {
        setShowForm(false);
        // Refresh list
      }}
      onCancel={() => setShowForm(false)}
    />
  );
}
```

### Displaying Featured Testimonials on Profile

```typescript
import { ProfileTestimonialsDisplay } from "@/components/profile-testimonials-display";
import { getRepository } from "@/aws/dynamodb/repository";

export default async function ProfilePage({
  params,
}: {
  params: { userId: string };
}) {
  const repo = getRepository();
  const testimonials = await repo.queryFeaturedTestimonials(params.userId);

  return (
    <div>
      {/* Other profile content */}

      <ProfileTestimonialsDisplay
        userId={params.userId}
        testimonials={testimonials}
      />
    </div>
  );
}
```

### Sending Testimonial Requests

```typescript
"use client";

import { sendTestimonialRequestAction } from "@/app/testimonial-actions";
import { useState } from "react";

export function SendRequestButton() {
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    const result = await sendTestimonialRequestAction(
      "John Doe",
      "john@example.com"
    );
    setLoading(false);

    if (result.data) {
      toast.success("Request sent!");
    } else {
      toast.error(result.errors?.[0] || "Failed to send");
    }
  };

  return (
    <Button onClick={handleSend} disabled={loading}>
      {loading ? "Sending..." : "Send Request"}
    </Button>
  );
}
```

### Handling Client Submissions

The public submission page is at:

```
/testimonial/submit/[token]/page.tsx
```

Implementation:

```typescript
import { submitTestimonialAction } from "@/app/testimonial-actions";

export default function SubmitTestimonialPage({
  params,
}: {
  params: { token: string };
}) {
  const handleSubmit = async (text: string) => {
    const result = await submitTestimonialAction(params.token, text);

    if (result.data) {
      // Show success message
    } else {
      // Show error (expired, invalid, etc.)
    }
  };

  return <TestimonialSubmissionForm onSubmit={handleSubmit} />;
}
```

---

## Testing

### Unit Tests

**Testing Repository**:

```typescript
import { TestimonialRepository } from "@/aws/dynamodb/testimonial-repository";

describe("TestimonialRepository", () => {
  it("creates testimonial with all fields", async () => {
    const repo = new TestimonialRepository();
    const testimonial = await repo.createTestimonial({
      userId: "user-123",
      clientName: "John Doe",
      testimonialText: "Great service!",
      dateReceived: new Date().toISOString(),
      isFeatured: false,
      tags: ["buyer"],
    });

    expect(testimonial.id).toBeDefined();
    expect(testimonial.clientName).toBe("John Doe");
  });
});
```

**Testing Server Actions**:

```typescript
import { createTestimonialAction } from "@/app/testimonial-actions";

describe("createTestimonialAction", () => {
  it("creates testimonial successfully", async () => {
    const result = await createTestimonialAction({
      userId: "user-123",
      clientName: "John Doe",
      testimonialText: "Great service!",
      dateReceived: new Date().toISOString(),
      isFeatured: false,
      tags: [],
    });

    expect(result.data).toBeDefined();
    expect(result.errors).toBeUndefined();
  });
});
```

### Integration Tests

**Testing Full Workflow**:

```typescript
describe("Testimonial Request Workflow", () => {
  it("completes full request-submit-notify flow", async () => {
    // 1. Send request
    const request = await sendTestimonialRequestAction(
      "John Doe",
      "john@example.com"
    );
    expect(request.data?.status).toBe("pending");

    // 2. Client submits
    const testimonial = await submitTestimonialAction(
      request.data!.id,
      "Great experience!"
    );
    expect(testimonial.data).toBeDefined();

    // 3. Verify request updated
    const updatedRequest = await getRequest(request.data!.id);
    expect(updatedRequest.status).toBe("submitted");
  });
});
```

### Property-Based Tests

See `src/__tests__/testimonial-*.test.ts` for property-based tests using fast-check.

---

## Error Handling

### Common Errors

**TestimonialNotFoundError**:

```typescript
class TestimonialNotFoundError extends Error {
  constructor(testimonialId: string) {
    super(`Testimonial ${testimonialId} not found`);
    this.name = "TestimonialNotFoundError";
  }
}
```

**RequestExpiredError**:

```typescript
class RequestExpiredError extends Error {
  constructor(requestId: string) {
    super(`Request ${requestId} has expired`);
    this.name = "RequestExpiredError";
  }
}
```

**PhotoUploadError**:

```typescript
class PhotoUploadError extends Error {
  constructor(message: string) {
    super(`Photo upload failed: ${message}`);
    this.name = "PhotoUploadError";
  }
}
```

### Error Handling Pattern

```typescript
try {
  const testimonial = await createTestimonialAction(data);
  return { success: true, data: testimonial };
} catch (error) {
  if (error instanceof TestimonialNotFoundError) {
    return { success: false, error: "Testimonial not found" };
  } else if (error instanceof RequestExpiredError) {
    return { success: false, error: "Request has expired" };
  } else {
    console.error("Unexpected error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
```

---

## Performance Considerations

### Caching

**Featured Testimonials**:

- Cache featured testimonials for profile pages
- Invalidate on update/delete/reorder
- TTL: 5 minutes

**Testimonial Lists**:

- Use pagination for large lists
- Implement virtual scrolling for 100+ items
- Cache query results client-side

### S3 Optimization

**Photo Upload**:

- Resize images client-side before upload
- Use WebP format for better compression
- Generate thumbnails for list views

**Photo Delivery**:

- Use CloudFront CDN for photo delivery
- Implement lazy loading for images
- Use responsive images with srcset

### DynamoDB Optimization

**Query Patterns**:

- Use GSI for featured testimonials query
- Batch get operations when possible
- Implement pagination for large result sets

**Write Patterns**:

- Use conditional writes to prevent conflicts
- Batch write operations when creating multiple items
- Implement optimistic locking for updates

---

## Security

### Authentication

All testimonial operations require authentication:

```typescript
const session = await getServerSession();
if (!session?.user?.id) {
  throw new UnauthorizedError();
}
```

### Authorization

Users can only access their own testimonials:

```typescript
const testimonial = await repo.getTestimonial(userId, testimonialId);
if (testimonial.userId !== session.user.id) {
  throw new ForbiddenError();
}
```

### Input Validation

All inputs are validated using Zod schemas:

```typescript
const CreateTestimonialSchema = z.object({
  clientName: z.string().min(1).max(100),
  testimonialText: z.string().min(10).max(2000),
  dateReceived: z.string().datetime(),
  tags: z.array(z.string()).max(10),
});
```

### Photo Upload Security

- Validate file type (JPEG, PNG, WebP only)
- Limit file size (5MB max)
- Scan for malware (if available)
- Generate unique S3 keys to prevent overwrites

---

## Migration Guide

### From Legacy System

If migrating from an existing testimonial system:

1. **Export existing data** to JSON
2. **Transform to new schema**:

```typescript
const transformed = legacyTestimonials.map((old) => ({
  userId: old.agentId,
  clientName: old.client,
  testimonialText: old.text,
  dateReceived: old.date,
  isFeatured: old.featured || false,
  tags: old.categories || [],
}));
```

3. **Import using batch write**:

```typescript
for (const testimonial of transformed) {
  await repo.createTestimonial(testimonial);
}
```

4. **Migrate photos to S3**:

```typescript
for (const testimonial of transformed) {
  if (testimonial.photoUrl) {
    const photo = await fetch(testimonial.photoUrl);
    const buffer = await photo.arrayBuffer();
    await uploadToS3(testimonial.id, buffer);
  }
}
```

---

## Related Documentation

- [Testimonials User Guide](../guides/TESTIMONIALS_USER_GUIDE.md)
- [SEO Developer Guide](./SEO_DEVELOPER_GUIDE.md)
- [Schema Markup Documentation](../../src/lib/schema/README.md)
- [DynamoDB Repository Pattern](../../src/aws/dynamodb/README.md)

---

## Support

For questions or issues:

- Check existing tests for usage examples
- Review implementation summaries in `.kiro/specs/testimonial-seo-features/`
- Consult the design document for architectural decisions

# Kiro AI Assistant Components

This directory contains UI components for the Kiro AI Assistant feature, specifically for agent profile management.

## Components

### AgentProfileForm

A form component for creating and updating agent profiles with validation and error handling.

**Features:**

- All required profile fields (agent name, primary market, specialization, preferred tone, core principle)
- Client-side and server-side validation
- Error display for field-level and form-level errors
- Loading states during submission
- Success/error feedback via toast notifications
- Support for both create and update modes

**Usage:**

```tsx
import { AgentProfileForm } from '@/components/kiro-assistant';

// Create new profile
<AgentProfileForm
  onSuccess={(profile) => console.log('Profile created:', profile)}
  onCancel={() => console.log('Cancelled')}
/>

// Edit existing profile
<AgentProfileForm
  profile={existingProfile}
  onSuccess={(profile) => console.log('Profile updated:', profile)}
  onCancel={() => console.log('Cancelled')}
/>
```

**Props:**

- `profile?: AgentProfile` - Existing profile data for editing (undefined for creation)
- `onSuccess?: (profile: AgentProfile) => void` - Callback when profile is successfully saved
- `onCancel?: () => void` - Callback when form is cancelled

**Requirements:** 8.1, 8.4

### AgentProfilePreview

A display component for viewing agent profile information with edit mode toggle.

**Features:**

- Read-only display of all profile fields
- Visual hierarchy with icons and badges
- Edit mode toggle
- Formatted dates (created/updated)
- Seamless transition to edit mode

**Usage:**

```tsx
import { AgentProfilePreview } from "@/components/kiro-assistant";

<AgentProfilePreview
  profile={profile}
  onUpdate={(updatedProfile) => console.log("Profile updated:", updatedProfile)}
  showEditButton={true}
/>;
```

**Props:**

- `profile: AgentProfile` - Agent profile data to display
- `onUpdate?: (profile: AgentProfile) => void` - Callback when profile is updated
- `showEditButton?: boolean` - Whether to show edit button (default: true)

**Requirements:** 8.3

## Data Model

### AgentProfile

```typescript
interface AgentProfile {
  userId: string;
  agentName: string;
  primaryMarket: string;
  specialization:
    | "luxury"
    | "first-time-buyers"
    | "investment"
    | "commercial"
    | "general";
  preferredTone:
    | "warm-consultative"
    | "direct-data-driven"
    | "professional"
    | "casual";
  corePrinciple: string;
  createdAt: string;
  updatedAt: string;
}
```

## Server Actions

The components use server actions from `@/app/profile-actions.ts`:

- `createAgentProfile(prevState, formData)` - Creates a new agent profile
- `updateAgentProfile(prevState, formData)` - Updates an existing agent profile
- `getAgentProfile()` - Retrieves the current user's agent profile

## Validation Rules

### Agent Name

- Required
- Max 100 characters
- Trimmed

### Primary Market

- Required
- Max 200 characters
- Trimmed

### Specialization

- Required
- Must be one of: luxury, first-time-buyers, investment, commercial, general

### Preferred Tone

- Required
- Must be one of: warm-consultative, direct-data-driven, professional, casual

### Core Principle

- Required
- Min 10 characters
- Max 500 characters
- Trimmed

## Demo Page

A demo page is available at `/kiro-assistant-demo` that showcases both components:

- Loads existing profile if available
- Shows create form if no profile exists
- Tabs for switching between preview and edit modes
- Information card explaining the feature

## Integration Example

```tsx
"use client";

import { useState, useEffect } from "react";
import {
  AgentProfileForm,
  AgentProfilePreview,
} from "@/components/kiro-assistant";
import { getAgentProfile } from "@/app/profile-actions";
import type { AgentProfile } from "@/aws/dynamodb/agent-profile-repository";

export default function ProfileManagementPage() {
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const result = await getAgentProfile();
      if (result.success && result.data) {
        setProfile(result.data);
      }
      setIsLoading(false);
    }
    loadProfile();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {profile ? (
        <AgentProfilePreview profile={profile} onUpdate={setProfile} />
      ) : (
        <AgentProfileForm onSuccess={setProfile} />
      )}
    </div>
  );
}
```

## Styling

Components use the shadcn/ui design system with:

- Tailwind CSS for styling
- Consistent spacing and typography
- Responsive design
- Dark mode support
- Accessible form controls

## Accessibility

- Proper label associations
- Required field indicators
- Error messages linked to fields
- Keyboard navigation support
- Screen reader friendly
- Focus management

## Performance

- Client-side form validation
- Optimistic UI updates
- Loading states during async operations
- Minimal re-renders
- Efficient state management

## Testing

Unit tests should cover:

- Form validation (all fields)
- Error display
- Success/cancel callbacks
- Edit mode toggle
- Date formatting
- Field value display

Property-based tests should verify:

- Profile creation with random valid data
- Profile updates preserve unchanged fields
- Validation rejects invalid inputs
- Round-trip consistency (create → retrieve → update → retrieve)

## Related Files

- `src/app/profile-actions.ts` - Server actions for profile CRUD
- `src/aws/dynamodb/agent-profile-repository.ts` - Repository for profile storage
- `src/aws/dynamodb/keys.ts` - DynamoDB key patterns
- `.kiro/specs/kiro-ai-assistant/requirements.md` - Feature requirements
- `.kiro/specs/kiro-ai-assistant/design.md` - Feature design
- `.kiro/specs/kiro-ai-assistant/tasks.md` - Implementation tasks

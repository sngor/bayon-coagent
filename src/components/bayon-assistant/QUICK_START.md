# Kiro AI Assistant - Quick Start Guide

## Installation

Components are already installed. Just import and use:

```tsx
import {
  AgentProfileForm,
  AgentProfilePreview,
} from "@/components/kiro-assistant";
```

## 5-Minute Integration

### Step 1: Create a Profile Page

```tsx
"use client";

import { useState, useEffect } from "react";
import {
  AgentProfileForm,
  AgentProfilePreview,
} from "@/components/kiro-assistant";
import { getAgentProfile } from "@/app/profile-actions";
import type { AgentProfile } from "@/aws/dynamodb/agent-profile-repository";

export default function ProfilePage() {
  const [profile, setProfile] = useState<AgentProfile | null>(null);

  useEffect(() => {
    async function load() {
      const result = await getAgentProfile();
      if (result.success && result.data) {
        setProfile(result.data);
      }
    }
    load();
  }, []);

  return profile ? (
    <AgentProfilePreview profile={profile} onUpdate={setProfile} />
  ) : (
    <AgentProfileForm onSuccess={setProfile} />
  );
}
```

### Step 2: Test It

Visit `/kiro-assistant-demo` to see the components in action.

## Common Use Cases

### Create Profile

```tsx
<AgentProfileForm
  onSuccess={(profile) => {
    console.log("Created:", profile);
    // Navigate or update state
  }}
/>
```

### Edit Profile

```tsx
<AgentProfileForm
  profile={existingProfile}
  onSuccess={(updated) => {
    console.log("Updated:", updated);
  }}
  onCancel={() => {
    console.log("Cancelled");
  }}
/>
```

### View Profile

```tsx
<AgentProfilePreview
  profile={profile}
  onUpdate={(updated) => {
    console.log("Updated:", updated);
  }}
/>
```

## Data Model

```typescript
interface AgentProfile {
  userId: string;
  agentName: string; // Max 100 chars
  primaryMarket: string; // Max 200 chars
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
  corePrinciple: string; // 10-500 chars
  createdAt: string;
  updatedAt: string;
}
```

## Server Actions

```tsx
// Get profile
const result = await getAgentProfile();
if (result.success) {
  console.log(result.data); // AgentProfile
}

// Create/update handled automatically by form
```

## Validation

All fields are validated:

- ✅ Required fields checked
- ✅ Length limits enforced
- ✅ Enum values validated
- ✅ Errors displayed inline

## Styling

Components use Tailwind CSS and shadcn/ui:

- Responsive by default
- Dark mode supported
- Accessible
- Customizable via className

## Tips

1. **Always check auth** before rendering
2. **Handle loading states** while fetching
3. **Provide feedback** via toast or alerts
4. **Update local state** on success
5. **Test error scenarios**

## Need Help?

- 📖 Full docs: `src/components/kiro-assistant/README.md`
- 🔧 Integration guide: `.kiro/specs/kiro-ai-assistant/PROFILE_UI_INTEGRATION_GUIDE.md`
- 🎯 Demo page: `/kiro-assistant-demo`
- 📋 Requirements: `.kiro/specs/kiro-ai-assistant/requirements.md`
- 🎨 Design: `.kiro/specs/kiro-ai-assistant/design.md`

## Example: Complete Flow

```tsx
"use client";

import { useState, useEffect } from "react";
import {
  AgentProfileForm,
  AgentProfilePreview,
} from "@/components/kiro-assistant";
import { getAgentProfile } from "@/app/profile-actions";
import { useUser } from "@/aws/auth";
import { Loader2 } from "lucide-react";

export default function MyProfilePage() {
  const { user } = useUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    async function load() {
      if (!user) {
        setLoading(false);
        return;
      }
      const result = await getAgentProfile();
      if (result.success && result.data) {
        setProfile(result.data);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  if (loading) {
    return <Loader2 className="animate-spin" />;
  }

  if (!user) {
    return <div>Please sign in</div>;
  }

  if (editing) {
    return (
      <AgentProfileForm
        profile={profile}
        onSuccess={(updated) => {
          setProfile(updated);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  if (profile) {
    return (
      <div>
        <AgentProfilePreview
          profile={profile}
          onUpdate={setProfile}
          showEditButton={false}
        />
        <button onClick={() => setEditing(true)}>Edit Profile</button>
      </div>
    );
  }

  return <AgentProfileForm onSuccess={setProfile} />;
}
```

That's it! You're ready to use the Kiro AI Assistant profile management UI. 🚀

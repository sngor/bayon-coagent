# Notification Settings Integration Guide

This guide shows how to integrate the NotificationSettings component into your application.

## Quick Start

### 1. Import the Component

```tsx
import { NotificationSettings } from "@/lib/notifications/components";
```

### 2. Add to Your Settings Page

```tsx
// src/app/(app)/settings/notifications/page.tsx
"use client";

import { NotificationSettings } from "@/lib/notifications/components";
import { useUser } from "@/aws/auth/use-user";

export default function NotificationSettingsPage() {
  const { user } = useUser();

  if (!user) {
    return <div>Please log in to manage notification settings</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Notification Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage how and when you receive notifications
          </p>
        </div>

        <NotificationSettings userId={user.id} />
      </div>
    </div>
  );
}
```

## API Endpoints Required

The NotificationSettings component requires two API endpoints to function:

### 1. GET Preferences Endpoint

Create an API route to fetch user preferences:

```typescript
// src/app/api/notifications/preferences/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getNotificationPreferences } from "@/lib/notifications/service";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  try {
    const preferences = await getNotificationPreferences(userId);
    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Failed to fetch preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}
```

### 2. POST Preferences Endpoint

Create an API route to save user preferences:

```typescript
// src/app/api/notifications/preferences/route.ts (continued)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, preferences } = body;

    if (!userId || !preferences) {
      return NextResponse.json(
        { error: "User ID and preferences are required" },
        { status: 400 }
      );
    }

    const updatedPreferences = await updateNotificationPreferences(
      userId,
      preferences
    );

    return NextResponse.json({ preferences: updatedPreferences });
  } catch (error) {
    console.error("Failed to save preferences:", error);
    return NextResponse.json(
      { error: "Failed to save preferences" },
      { status: 500 }
    );
  }
}
```

## Integration with Existing Settings Page

If you already have a settings page, you can add the notification settings as a new section:

```tsx
// src/app/(app)/settings/page.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationSettings } from "@/lib/notifications/components";
import { useUser } from "@/aws/auth/use-user";

export default function SettingsPage() {
  const { user } = useUser();

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">{/* Your profile settings */}</TabsContent>

        <TabsContent value="notifications">
          {user && <NotificationSettings userId={user.id} />}
        </TabsContent>

        <TabsContent value="security">
          {/* Your security settings */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

## Handling Preference Updates

You can add custom logic when preferences are updated:

```tsx
import { NotificationSettings } from "@/lib/notifications/components";
import { NotificationPreferences } from "@/lib/notifications/types";
import { useToast } from "@/hooks/use-toast";

function MySettingsPage({ userId }: { userId: string }) {
  const { toast } = useToast();

  const handlePreferencesUpdate = (preferences: NotificationPreferences) => {
    // Log to analytics
    console.log("User updated preferences:", preferences);

    // Show custom success message
    toast({
      title: "Preferences Saved",
      description: "Your notification settings have been updated successfully",
    });

    // Sync with other systems if needed
    // syncPreferencesWithExternalService(preferences);
  };

  return (
    <NotificationSettings userId={userId} onUpdate={handlePreferencesUpdate} />
  );
}
```

## Styling and Customization

### Custom Container Styling

```tsx
<NotificationSettings
  userId={userId}
  className="bg-gradient-to-br from-background to-accent/5 rounded-xl p-8"
/>
```

### Responsive Layout

The component is fully responsive and works on all screen sizes. On mobile devices:

- Cards stack vertically
- Form controls adapt to smaller screens
- Touch-friendly interaction areas

## Testing

### Manual Testing Checklist

1. **Load Preferences**

   - [ ] Preferences load correctly on page mount
   - [ ] Loading state is displayed while fetching
   - [ ] Error state is shown if fetch fails

2. **Global Settings**

   - [ ] Do Not Disturb toggle works
   - [ ] Setting persists after save

3. **In-App Notifications**

   - [ ] Enable/disable toggle works
   - [ ] Notification type checkboxes work
   - [ ] Selected types persist after save

4. **Email Notifications**

   - [ ] Enable/disable toggle works
   - [ ] Email address input works
   - [ ] Notification type checkboxes work
   - [ ] Frequency radio buttons work
   - [ ] Digest time picker works (for daily/weekly)
   - [ ] Quiet hours toggle works
   - [ ] Quiet hours time pickers work
   - [ ] Timezone selector works

5. **Push Notifications**

   - [ ] Enable/disable toggle works
   - [ ] Notification type checkboxes work
   - [ ] Selected types persist after save

6. **Save Functionality**
   - [ ] Save button shows loading state
   - [ ] Success toast appears after save
   - [ ] Error toast appears if save fails
   - [ ] Preferences persist after page reload

## Troubleshooting

### Preferences Not Loading

**Problem**: Component shows loading state indefinitely

**Solution**: Check that:

1. API endpoint `/api/notifications/preferences` exists
2. Endpoint returns correct data structure
3. User ID is valid
4. Network requests are not blocked

### Preferences Not Saving

**Problem**: Changes don't persist after clicking save

**Solution**: Check that:

1. API endpoint `/api/notifications/preferences` POST method exists
2. Request body is correctly formatted
3. Server successfully saves to database
4. No validation errors on server

### TypeScript Errors

**Problem**: Type errors when importing component

**Solution**: Ensure you're importing from the correct path:

```tsx
import { NotificationSettings } from "@/lib/notifications/components";
import type { NotificationPreferences } from "@/lib/notifications/types";
```

## Next Steps

After integrating the NotificationSettings component:

1. **Test thoroughly** with different user scenarios
2. **Add analytics** to track preference changes
3. **Monitor usage** to understand user preferences
4. **Iterate** based on user feedback
5. **Document** any custom modifications for your team

## Support

For issues or questions:

- Check the component README: `src/lib/notifications/components/README.md`
- Review examples: `src/lib/notifications/components/notification-settings-example.tsx`
- Check the design document: `.kiro/specs/notification-system/design.md`

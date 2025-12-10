# User Preferences System

This directory contains the schema definitions and type definitions for the user preferences system.

## Files

- `schemas.ts` - Zod schemas for all preference categories with validation rules
- `schemas.test.ts` - Unit tests for schema validation

## Usage

### Importing Schemas and Types

```typescript
import {
  UserPreferencesSchema,
  ContentPreferencesSchema,
  BrandPreferencesSchema,
  NotificationPreferencesSchema,
  WorkflowPreferencesSchema,
  IntegrationPreferencesSchema,
  DisplayPreferencesSchema,
  PrivacyPreferencesSchema,
  type UserPreferences,
  type ContentPreferences,
  type BrandPreferences,
  type NotificationPreferences,
  type WorkflowPreferences,
  type IntegrationPreferences,
  type DisplayPreferences,
  type PrivacyPreferences,
} from "@/lib/preferences/schemas";
```

### Validating Preferences

```typescript
// Parse with defaults
const contentPrefs = ContentPreferencesSchema.parse({});
// Result: { aiTone: "professional", contentLength: "medium", ... }

// Parse with custom values
const customPrefs = ContentPreferencesSchema.parse({
  aiTone: "casual",
  contentLength: "long",
  targetAudience: ["buyers", "sellers"],
});

// Safe parse (returns { success: boolean, data?: T, error?: ZodError })
const result = ContentPreferencesSchema.safeParse(userInput);
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

### Validation Rules

#### Content Preferences

- `aiTone`: Must be one of "professional", "casual", "authoritative", "friendly"
- `contentLength`: Must be one of "short", "medium", "long"
- `autoSaveInterval`: Must be between 30 and 600 seconds

#### Brand Preferences

- `phone` (in NAP): Must be in E.164 format (e.g., +12345678901)
- `propertyTypes`: Array of valid property types

#### Notification Preferences

- `priceChangePercent`: Must be between 0 and 100
- `newListingsCount`: Must be at least 1

#### Workflow Preferences

- `pinnedTools`: Maximum of 6 items
- `autoArchive.daysOld`: Must be between 30 and 365 days

#### Display Preferences

- `colorScheme.primary` and `colorScheme.accent`: Must be valid hex color codes (e.g., #FF5733)

#### Privacy Preferences

- `contentRetention.daysToKeep`: Must be between 30 and 730 days
- `autoDeleteDrafts.daysOld`: Must be between 7 and 90 days

### Error Messages

All schemas include custom error messages for validation failures:

```typescript
try {
  BrandPreferencesSchema.parse({
    nap: {
      name: "John Doe",
      address: "123 Main St",
      phone: "invalid",
    },
  });
} catch (error) {
  // Error: Phone number must be in E.164 format
}
```

## Default Values

All preference categories have sensible defaults:

- **Content**: Professional tone, medium length, auto-save enabled (60s)
- **Brand**: Residential property type, weekly competitor tracking
- **Notifications**: Email enabled (daily), push disabled
- **Workflow**: Dashboard as default hub, no pinned tools
- **Integrations**: Analytics allowed, third-party sharing disabled, PDF export
- **Display**: Auto theme, medium font size, English language
- **Privacy**: No retention policies, analytics opt-in

## Type Safety

All TypeScript types are automatically inferred from Zod schemas, ensuring runtime validation matches compile-time types:

```typescript
// Type is automatically inferred
const prefs: ContentPreferences = ContentPreferencesSchema.parse({});

// TypeScript will catch invalid values at compile time
const invalid: ContentPreferences = {
  aiTone: "invalid", // ❌ Type error
  contentLength: "medium", // ✓
};
```

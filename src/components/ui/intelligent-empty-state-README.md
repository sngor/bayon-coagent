# Intelligent Empty State Component

Smart empty state designs with contextual actions to guide users when content is missing.

## Features

- **Contextual Messaging**: Clear title and description explaining why content is empty
- **Action Buttons**: Primary and secondary actions to help users get started
- **Icon Support**: Visual icons to reinforce the message
- **Multiple Variants**: Default, card, and minimal layouts
- **Flexible Actions**: Support for multiple action buttons with icons

## Usage

```tsx
import { IntelligentEmptyState } from "@/components/ui/intelligent-empty-state";
import { FileText, Plus } from "lucide-react";

<IntelligentEmptyState
  icon={FileText}
  title="No content yet"
  description="Get started by creating your first piece of content."
  actions={[
    {
      label: "Create Content",
      onClick: () => handleCreate(),
      icon: Plus,
    },
    {
      label: "Browse Templates",
      onClick: () => handleBrowse(),
      variant: "outline",
    },
  ]}
  variant="default"
/>;
```

## Props

- `icon`: Lucide icon component
- `title`: Main heading text
- `description`: Explanatory text
- `actions`: Array of action button configurations
- `variant`: 'default' | 'minimal' | 'card'
- `className`: Additional CSS classes

## Variants

- **default**: Standard padding and spacing
- **minimal**: Compact with less padding
- **card**: Wrapped in a card component

## Integration

Used in:

- Projects page (empty projects state)
- Content lists (no saved content)
- Search results (no matches found)

# Edit Parameter Forms

This directory contains form components for each edit type in the Reimagine Image Toolkit. Each form handles user input, validation, and submission for its respective edit operation.

## Forms

### VirtualStagingForm

Form for virtual staging parameters.

**Props:**

- `onSubmit: (params: VirtualStagingParams) => void` - Called when form is submitted with valid params
- `onCancel: () => void` - Called when user cancels
- `defaultValues?: Partial<VirtualStagingParams>` - Pre-populate form fields
- `isProcessing?: boolean` - Disable form during processing

**Parameters:**

- `roomType`: Type of room (living-room, bedroom, kitchen, dining-room, office, bathroom)
- `style`: Furniture style (modern, traditional, minimalist, luxury, rustic, contemporary)

**Usage:**

```tsx
<VirtualStagingForm
  onSubmit={(params) => processEdit("virtual-staging", params)}
  onCancel={() => setShowForm(false)}
  defaultValues={{ roomType: "living-room", style: "modern" }}
/>
```

### DayToDuskForm

Form for day-to-dusk conversion parameters.

**Props:**

- `onSubmit: (params: DayToDuskParams) => void`
- `onCancel: () => void`
- `defaultValues?: Partial<DayToDuskParams>`
- `isProcessing?: boolean`

**Parameters:**

- `intensity`: Lighting intensity (subtle, moderate, dramatic)

**Usage:**

```tsx
<DayToDuskForm
  onSubmit={(params) => processEdit("day-to-dusk", params)}
  onCancel={() => setShowForm(false)}
  defaultValues={{ intensity: "moderate" }}
/>
```

### EnhanceForm

Form for image enhancement parameters.

**Props:**

- `onSubmit: (params: EnhanceParams) => void`
- `onCancel: () => void`
- `defaultValues?: Partial<EnhanceParams>`
- `isProcessing?: boolean`

**Parameters:**

- `autoAdjust`: Enable automatic adjustments (boolean)
- `brightness`: Brightness adjustment (-100 to 100, optional)
- `contrast`: Contrast adjustment (-100 to 100, optional)
- `saturation`: Saturation adjustment (-100 to 100, optional)

**Usage:**

```tsx
<EnhanceForm
  onSubmit={(params) => processEdit("enhance", params)}
  onCancel={() => setShowForm(false)}
  defaultValues={{ autoAdjust: true }}
/>
```

### ItemRemovalForm

Form for item removal parameters with interactive canvas for marking objects.

**Props:**

- `onSubmit: (params: ItemRemovalParams) => void`
- `onCancel: () => void`
- `defaultValues?: Partial<ItemRemovalParams>`
- `isProcessing?: boolean`
- `imageUrl?: string` - URL of image to display on canvas

**Parameters:**

- `maskData`: Base64 encoded mask image (drawn on canvas)
- `objects`: Array of object descriptions to remove

**Usage:**

```tsx
<ItemRemovalForm
  onSubmit={(params) => processEdit("item-removal", params)}
  onCancel={() => setShowForm(false)}
  imageUrl={currentImageUrl}
/>
```

### VirtualRenovationForm

Form for virtual renovation parameters.

**Props:**

- `onSubmit: (params: VirtualRenovationParams) => void`
- `onCancel: () => void`
- `defaultValues?: Partial<VirtualRenovationParams>`
- `isProcessing?: boolean`

**Parameters:**

- `description`: Natural language description of renovations (10-1000 characters)
- `style`: Optional style guidance

**Usage:**

```tsx
<VirtualRenovationForm
  onSubmit={(params) => processEdit("virtual-renovation", params)}
  onCancel={() => setShowForm(false)}
  defaultValues={{
    description: "Replace old cabinets with modern white ones",
    style: "modern farmhouse",
  }}
/>
```

## Validation

All forms use Zod schemas from `/src/ai/schemas/reimagine-schemas.ts` for validation. Invalid parameters will not trigger the `onSubmit` callback.

## Features

- **Zod Schema Validation**: All forms validate input using Zod schemas before submission
- **Default Values**: Forms can be pre-populated with suggested parameters from AI analysis
- **Processing State**: Forms disable inputs and show loading state during processing
- **Helpful Tips**: Each form includes contextual tips and examples
- **Responsive Design**: Forms work on mobile, tablet, and desktop
- **Accessibility**: Proper labels, ARIA attributes, and keyboard navigation

## Integration Example

```tsx
import { useState } from "react";
import {
  VirtualStagingForm,
  DayToDuskForm,
} from "@/components/reimagine/edit-forms";
import type { EditType, EditParams } from "@/ai/schemas/reimagine-schemas";

function EditPanel({
  imageId,
  editType,
}: {
  imageId: string;
  editType: EditType;
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (params: EditParams) => {
    setIsProcessing(true);
    try {
      await processEditAction(imageId, editType, params);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    // Handle cancel
  };

  switch (editType) {
    case "virtual-staging":
      return (
        <VirtualStagingForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isProcessing={isProcessing}
        />
      );
    case "day-to-dusk":
      return (
        <DayToDuskForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isProcessing={isProcessing}
        />
      );
    // ... other cases
  }
}
```

## Requirements Validation

These forms satisfy the following requirements:

- **Requirement 2.1**: Virtual staging option prompts for room type and style
- **Requirement 3.1**: Day-to-dusk option accepts source image and initiates transformation
- **Requirement 4.1**: Enhancement option analyzes source image
- **Requirement 5.1**: Item removal provides interface for marking objects
- **Requirement 6.1**: Virtual renovation prompts for description

All forms implement proper validation with Zod schemas as specified in the design document.

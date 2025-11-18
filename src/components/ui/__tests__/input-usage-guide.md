# Enhanced Input Component - Usage Guide

## Overview

The enhanced Input component provides a fully accessible, feature-rich form input with built-in validation support, proper ARIA attributes, and enhanced focus states.

## Basic Usage

### Simple Input

```tsx
import { Input } from "@/components/ui/input";

<Input placeholder="Enter text" />;
```

### Input with Label

```tsx
<Input label="Email Address" placeholder="you@example.com" />
```

### Required Field

```tsx
<Input label="Full Name" placeholder="John Doe" required />
```

## Validation

### Inline Error Messages

```tsx
<Input label="Email" type="email" error="Please enter a valid email address" />
```

### Helper Text

```tsx
<Input
  label="Password"
  type="password"
  helperText="Must be at least 8 characters long"
/>
```

### Live Validation Example

```tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

export function EmailInput() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const validateEmail = (value: string) => {
    if (!value) {
      setError("Email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError("Please enter a valid email address");
    } else {
      setError("");
    }
  };

  return (
    <Input
      label="Email"
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      onBlur={(e) => validateEmail(e.target.value)}
      error={error}
      helperText={!error ? "We'll never share your email" : undefined}
    />
  );
}
```

## Visual Variants

### Success State

```tsx
<Input label="Email" variant="success" helperText="Email is valid!" />
```

### Error State (Manual)

```tsx
<Input label="Email" variant="error" error="This email is already taken" />
```

Note: The error variant is automatically applied when the `error` prop is provided.

## Customization

### Hide Error Icon

```tsx
<Input label="Email" error="Invalid email" showErrorIcon={false} />
```

### Custom Styling

```tsx
<Input label="Email" className="bg-gray-50 border-2" />
```

## Integration with React Hook Form

The enhanced Input component works seamlessly with React Hook Form:

```tsx
"use client";

import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FormData {
  email: string;
  password: string;
}

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Email"
        type="email"
        {...register("email", {
          required: "Email is required",
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: "Invalid email address",
          },
        })}
        error={errors.email?.message}
        required
      />

      <Input
        label="Password"
        type="password"
        {...register("password", {
          required: "Password is required",
          minLength: {
            value: 8,
            message: "Password must be at least 8 characters",
          },
        })}
        error={errors.password?.message}
        required
      />

      <Button type="submit">Sign In</Button>
    </form>
  );
}
```

## Integration with Existing Form Component

The enhanced Input also works with the existing shadcn Form components:

```tsx
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export function ProfileForm() {
  const form = useForm();

  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="username"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Username</FormLabel>
            <FormControl>
              <Input placeholder="johndoe" {...field} />
            </FormControl>
            <FormDescription>This is your public display name.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </Form>
  );
}
```

## Accessibility Features

### Keyboard Navigation

- **Tab**: Move to next input
- **Shift + Tab**: Move to previous input
- **Enter**: Submit form (when in a form)

### Screen Reader Support

The component provides comprehensive screen reader support:

- Labels are properly associated with inputs
- Required fields are announced
- Error messages are announced when they appear
- Helper text is read to provide context
- Error icons are hidden from screen readers (decorative)

### ARIA Attributes

The component automatically manages:

- `aria-invalid`: Set to true when error exists
- `aria-describedby`: Links to helper text and error messages
- `aria-required`: Set to true for required fields
- `aria-label`: Used for required asterisk
- `aria-hidden`: Used for decorative icons

## Best Practices

### 1. Always Provide Labels

```tsx
// ✅ Good
<Input label="Email" />

// ❌ Avoid (unless in a FormItem with FormLabel)
<Input placeholder="Email" />
```

### 2. Use Helper Text for Guidance

```tsx
<Input
  label="Password"
  type="password"
  helperText="Must contain at least 8 characters, one uppercase, and one number"
/>
```

### 3. Validate on Blur, Not on Change

```tsx
// ✅ Good - validates when user leaves field
<Input
  onBlur={(e) => validate(e.target.value)}
/>

// ❌ Avoid - validates on every keystroke (annoying)
<Input
  onChange={(e) => validate(e.target.value)}
/>
```

### 4. Clear Error Messages

```tsx
// ✅ Good - specific and actionable
error = "Email must be in format: user@example.com";

// ❌ Avoid - vague
error = "Invalid input";
```

### 5. Use Appropriate Input Types

```tsx
<Input type="email" label="Email" />
<Input type="tel" label="Phone" />
<Input type="url" label="Website" />
<Input type="number" label="Age" />
```

This helps with:

- Mobile keyboard optimization
- Browser validation
- Accessibility

## Common Patterns

### Password with Show/Hide Toggle

```tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

export function PasswordInput() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative">
      <Input type={showPassword ? "text" : "password"} label="Password" />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-2 top-8"
        onClick={() => setShowPassword(!showPassword)}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
```

### Search Input with Clear Button

```tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export function SearchInput() {
  const [search, setSearch] = useState("");

  return (
    <div className="relative">
      <Input
        type="search"
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {search && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2"
          onClick={() => setSearch("")}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
```

## Props Reference

| Prop                           | Type                                | Default     | Description                         |
| ------------------------------ | ----------------------------------- | ----------- | ----------------------------------- |
| `label`                        | `string`                            | -           | Label text displayed above input    |
| `error`                        | `string`                            | -           | Error message displayed below input |
| `helperText`                   | `string`                            | -           | Helper text displayed below input   |
| `required`                     | `boolean`                           | `false`     | Marks field as required             |
| `showErrorIcon`                | `boolean`                           | `true`      | Shows error icon in input           |
| `variant`                      | `"default" \| "error" \| "success"` | `"default"` | Visual variant                      |
| `type`                         | `string`                            | `"text"`    | HTML input type                     |
| `placeholder`                  | `string`                            | -           | Placeholder text                    |
| `disabled`                     | `boolean`                           | `false`     | Disables the input                  |
| `className`                    | `string`                            | -           | Additional CSS classes              |
| All other standard input props | -                                   | -           | Passed through to input element     |

## Migration from Old Input

If you're migrating from the old Input component:

### Before

```tsx
<Input placeholder="Email" />
```

### After (with enhancements)

```tsx
<Input
  label="Email"
  placeholder="you@example.com"
  helperText="We'll never share your email"
/>
```

The old usage still works! The component is backward compatible.

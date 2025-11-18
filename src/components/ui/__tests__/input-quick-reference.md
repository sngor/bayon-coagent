# Enhanced Input Component - Quick Reference

## Import

```tsx
import { Input } from "@/components/ui/input";
```

## Basic Usage

```tsx
<Input label="Email" placeholder="you@example.com" />
```

## Common Patterns

### Required Field

```tsx
<Input label="Name" required />
```

### With Helper Text

```tsx
<Input
  label="Password"
  type="password"
  helperText="Must be at least 8 characters"
/>
```

### With Error

```tsx
<Input label="Email" error="Invalid email address" />
```

### Live Validation

```tsx
const [value, setValue] = useState("")
const [error, setError] = useState("")

<Input
  label="Email"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  onBlur={(e) => validate(e.target.value)}
  error={error}
/>
```

### Success State

```tsx
<Input label="Email" variant="success" helperText="Email verified!" />
```

## Props

| Prop            | Type                                | Description                     |
| --------------- | ----------------------------------- | ------------------------------- |
| `label`         | `string`                            | Label text                      |
| `error`         | `string`                            | Error message                   |
| `helperText`    | `string`                            | Helper text                     |
| `required`      | `boolean`                           | Mark as required                |
| `showErrorIcon` | `boolean`                           | Show error icon (default: true) |
| `variant`       | `"default" \| "error" \| "success"` | Visual variant                  |

## Features

✅ Enhanced focus states with smooth transitions  
✅ Inline validation messages  
✅ Proper ARIA labels and descriptions  
✅ Keyboard navigation support  
✅ Error icons  
✅ Helper text  
✅ Required field indicators  
✅ Screen reader support  
✅ Backward compatible

## Accessibility

- Proper label associations
- ARIA attributes (aria-invalid, aria-describedby, aria-required)
- Visible focus indicators
- Screen reader announcements
- Keyboard accessible

## Validation Best Practices

1. **Validate on blur**, not on change
2. **Clear error messages** - be specific
3. **Use helper text** for guidance
4. **Mark required fields** with asterisk
5. **Use appropriate input types** (email, tel, url, etc.)

## React Hook Form Integration

```tsx
import { useForm } from "react-hook-form"

const { register, formState: { errors } } = useForm()

<Input
  label="Email"
  {...register("email", {
    required: "Email is required",
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Invalid email",
    },
  })}
  error={errors.email?.message}
  required
/>
```

## Examples

See detailed examples in:

- `input-demo.tsx` - Comprehensive demo
- `input-test-page.tsx` - Simple test page
- `input-usage-guide.md` - Complete usage guide

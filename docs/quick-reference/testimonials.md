# Testimonials Quick Reference

## Schema

### Testimonial Interface

```typescript
interface Testimonial {
  id: string;
  userId: string;
  clientName: string;
  clientEmail?: string;
  rating: number;
  content: string; // ⚠️ Use 'content', not 'testimonialText'
  propertyAddress?: string;
  transactionType?: "buy" | "sell" | "rent";
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Key Points

- **Content Field**: Always use `content` for testimonial text, not `testimonialText`
- **Required Fields**: `id`, `userId`, `clientName`, `rating`, `content`, `isPublic`, `createdAt`, `updatedAt`
- **Optional Fields**: `clientEmail`, `propertyAddress`, `transactionType`

## Common Operations

### Create Testimonial

```typescript
const testimonial = await createTestimonial({
  userId: "user-123",
  clientName: "John Doe",
  content: "Great service!", // ✅ Correct field name
  rating: 5,
  isPublic: true,
  dateReceived: new Date().toISOString(),
});
```

### Update Testimonial

```typescript
const updated = await updateTestimonial(testimonialId, {
  content: "Updated testimonial text", // ✅ Correct field name
  isPublic: false,
});
```

### Query Testimonials

```typescript
// Get all testimonials for a user
const testimonials = await queryTestimonials(userId);

// Get featured testimonials only
const featured = await queryFeaturedTestimonials(userId);
```

## Validation Schema

```typescript
const CreateTestimonialSchema = z.object({
  clientName: z.string().min(1).max(100),
  content: z.string().min(10).max(2000), // ✅ Correct field name
  rating: z.number().int().min(1).max(5),
  dateReceived: z.string().datetime(),
  tags: z.array(z.string()).max(10),
});
```

## Migration Notes

If you have existing code using `testimonialText`, update it to use `content`:

```typescript
// ❌ Old (deprecated)
testimonial.testimonialText = "Great service!";

// ✅ New (correct)
testimonial.content = "Great service!";
```

## Related Files

- **Types**: `/src/lib/types.ts` - Main Testimonial interface
- **Repository**: `/src/aws/dynamodb/testimonial.ts` - Database operations
- **Actions**: `/src/app/testimonial-actions.ts` - Server actions
- **Components**: `/src/components/testimonials/` - UI components

## Testing

```typescript
// Test data should use 'content' field
const mockTestimonial: Testimonial = {
  id: "test-123",
  userId: "user-456",
  clientName: "John Doe",
  content: "Great service!", // ✅ Correct field name
  rating: 5,
  isPublic: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
```

## Common Errors

### Field Name Mismatch

```typescript
// ❌ This will cause TypeScript errors
const testimonial = {
  testimonialText: "Great service!", // Property doesn't exist
};

// ✅ Correct approach
const testimonial = {
  content: "Great service!", // Matches interface
};
```

### Missing Required Fields

```typescript
// ❌ Missing required fields
const testimonial = {
  content: "Great service!",
};

// ✅ Include all required fields
const testimonial = {
  id: generateId(),
  userId: currentUser.id,
  clientName: "John Doe",
  content: "Great service!",
  rating: 5,
  isPublic: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
```

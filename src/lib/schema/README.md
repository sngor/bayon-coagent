# Schema Markup System

A comprehensive system for generating, validating, and displaying Schema.org structured data for SEO optimization.

## Overview

This system provides three main capabilities:

1. **Schema Generation** - Create Schema.org markup for profiles, blog posts, and testimonials
2. **Schema Validation** - Validate schema against Schema.org specifications
3. **Comprehensive Validation** - Scan multiple pages and generate validation reports

## Files

- `generators.ts` - Schema markup generators for different content types
- `validator.ts` - Schema validation against Schema.org specifications
- `comprehensive-validator.ts` - Multi-page validation and reporting
- `testimonial-schema.ts` - Legacy testimonial-specific schema functions

## Usage

### 1. Generating Schema Markup

#### Profile Schema

```typescript
import { generateRealEstateAgentWithReviewsSchema } from "@/lib/schema/generators";

const profile = {
  name: "John Smith",
  bio: "Experienced real estate agent",
  phone: "555-0123",
  address: "123 Main St, Seattle, WA",
  licenseNumber: "RE-12345",
  agencyName: "Smith Realty Group",
};

const testimonials = [
  {
    clientName: "Jane Doe",
    testimonialText: "Excellent service!",
    dateReceived: "2024-01-15",
    // ... other fields
  },
];

const schema = generateRealEstateAgentWithReviewsSchema(profile, testimonials);
```

#### Blog Post Schema

```typescript
import { generateArticleSchema } from "@/lib/schema/generators";

const schema = generateArticleSchema({
  title: "Seattle Real Estate Market Trends 2024",
  description: "Latest market insights",
  content: "Full article content...",
  author: "John Smith",
  datePublished: "2024-01-20",
  imageUrl: "https://example.com/image.jpg",
});
```

#### Testimonial Schema

```typescript
import { generateReviewSchemaWithContext } from "@/lib/schema/generators";

const schema = generateReviewSchemaWithContext(testimonial, agentName);
```

### 2. Validating Schema

```typescript
import { validateSchema } from "@/lib/schema/validator";

const validation = validateSchema(schema);

if (!validation.isValid) {
  console.log("Errors:", validation.errors);
  console.log("Warnings:", validation.warnings);
}
```

### 3. Comprehensive Validation

```typescript
import { performComprehensiveValidation } from "@/lib/schema/comprehensive-validator";

const report = performComprehensiveValidation({
  profile: myProfile,
  testimonials: myTestimonials,
  blogPosts: myBlogPosts,
});

console.log(`Total pages: ${report.totalPages}`);
console.log(`Pages with errors: ${report.pagesWithErrors}`);
console.log(`Total errors: ${report.totalErrors}`);
```

### 4. Using the UI Component

```typescript
import { SchemaMarkupValidator } from "@/components/schema-markup-validator";

function MyPage() {
  const [report, setReport] = useState(null);

  const handleValidate = async () => {
    const validationReport = performComprehensiveValidation({
      profile,
      testimonials,
      blogPosts,
    });
    setReport(validationReport);
  };

  return (
    <div>
      <Button onClick={handleValidate}>Validate Schema</Button>
      {report && <SchemaMarkupValidator report={report} />}
    </div>
  );
}
```

## Schema Types Supported

### Person

Basic person information:

- name (required)
- url
- telephone
- address

### RealEstateAgent

Real estate agent profile:

- name (required)
- description
- telephone
- address
- license
- worksFor (organization)
- sameAs (social profiles)
- knowsAbout (certifications)
- aggregateRating (from testimonials)
- review (individual testimonials)

### Article

Blog post or article:

- headline (required)
- author (required)
- datePublished (required)
- description
- image
- url
- articleBody
- publisher

### Review

Client testimonial:

- author (required)
- datePublished (required)
- reviewBody (required)
- reviewRating
- itemReviewed

## Validation Rules

### Required Fields

Each schema type has required fields that must be present:

- **Person**: @type, name
- **RealEstateAgent**: @type, name
- **Article**: @type, headline, author.name, datePublished
- **Review**: @type, author.name, datePublished, reviewBody

### Recommended Fields

Warnings are generated for missing recommended fields:

- **RealEstateAgent**: description, telephone, address, license
- **Article**: description, image, publisher
- **Review**: reviewRating, itemReviewed

### Data Validation

- Dates must be in ISO 8601 format
- Rating values must be between 1 and 5
- Review counts must be positive integers
- Nested objects must have correct @type

## Embedding Schema in HTML

### Next.js App Router

```typescript
import { generateArticleSchema } from "@/lib/schema/generators";

export default function BlogPost({ post }) {
  const schema = generateArticleSchema({
    title: post.title,
    content: post.content,
    author: post.author,
    datePublished: post.publishedAt,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <article>{/* Post content */}</article>
    </>
  );
}
```

### Multiple Schemas

```typescript
import { generateMultipleSchemas } from "@/lib/schema/generators";

const schemas = [personSchema, agentSchema, reviewSchema];
const jsonLdScripts = generateMultipleSchemas(schemas);

// Render each script tag
jsonLdScripts.forEach((script) => {
  // Add to page
});
```

## Testing Schema Markup

### Google Rich Results Test

1. Generate your schema markup
2. Visit: https://search.google.com/test/rich-results
3. Paste your HTML with schema markup
4. Review results and fix any issues

### Schema.org Validator

1. Visit: https://validator.schema.org/
2. Paste your JSON-LD
3. Review validation results

## Best Practices

1. **Always include @context**: Set to "https://schema.org"
2. **Use specific types**: Use RealEstateAgent instead of just Person
3. **Include all required fields**: Avoid validation errors
4. **Add recommended fields**: Improve SEO value
5. **Validate before deploying**: Use the validation tools
6. **Keep data accurate**: Schema should match visible content
7. **Update regularly**: Keep schema in sync with content changes

## Error Handling

```typescript
import { validateSchema, formatValidationErrors } from "@/lib/schema/validator";

const validation = validateSchema(schema);

if (!validation.isValid) {
  const errorMessages = formatValidationErrors(validation);
  console.error("Schema validation failed:", errorMessages);

  // Handle errors appropriately
  // - Log for debugging
  // - Show user-friendly message
  // - Use fallback schema
}
```

## Performance Considerations

- Schema generation is synchronous and fast
- Validation is also synchronous
- For large numbers of pages, consider:
  - Validating in batches
  - Caching validation results
  - Running validation in background

## Requirements Mapping

This system implements the following requirements:

- **8.1**: Person and RealEstateAgent schema for profile
- **8.2**: Article schema for blog posts
- **8.3**: Review schema for testimonials
- **8.4**: Schema validation with specific error messages
- **8.5**: Comprehensive validation across all public pages

## Examples

See `src/components/schema-markup-example.tsx` for complete working examples.

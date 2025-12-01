# Validation Agent Integration Guide

## Current Status

❌ **Not in Production** - The validation system has been created but not yet integrated into your existing content generation flows.

## What Was Created

1. **Enhanced Validation Agent** (`src/aws/bedrock/validation-agent-enhanced.ts`)
   - Comprehensive scoring system
   - Social media and SEO analysis
2. **UI Component** (`src/components/validation-score-display.tsx`)
   - Visual score display
   - Detailed breakdowns
3. **Example Integrations** (`src/app/actions-with-validation.ts`)

   - Reference implementations
   - Not connected to production

4. **Demo Page** (`src/app/(app)/studio/write/validation-example.tsx`)
   - Standalone demo
   - Not part of main Studio Write interface

## To Integrate into Production

### Option 1: Quick Integration (Show Scores After Generation)

Add validation display to existing content generation without changing the generation flow:

**Step 1:** Update `src/app/actions.ts` to include validation

```typescript
// Add import
import { getValidationAgent } from "@/aws/bedrock/validation-agent-enhanced";

// Modify generateBlogPostAction to return validation
export async function generateBlogPostAction(
  prevState: any,
  formData: FormData
) {
  // ... existing generation code ...

  // Add validation after generation
  const validator = getValidationAgent();
  const validation = await validator.validate(result.blogPost, {
    validateGoalAlignment: true,
    userGoal: `Generate blog post about: ${topic}`,
    validateSocialMedia: true,
    validateSEO: true,
    contentType: "blog",
    targetKeywords: [topic],
  });

  return {
    message: "success",
    data: {
      blogPost: result.blogPost,
      headerImage: result.headerImage,
      validation, // Add validation to response
    },
    errors: {},
  };
}
```

**Step 2:** Update `src/app/(app)/studio/write/page.tsx` to display scores

```typescript
// Add import
import { ValidationScoreDisplay } from "@/components/validation-score-display";

// Add state for validation
const [blogValidation, setBlogValidation] = useState<ValidationResult | null>(
  null
);

// Update useEffect to capture validation
useEffect(() => {
  if (blogPostState.message === "success") {
    if (blogPostState.data?.blogPost) {
      setBlogPostContent(blogPostState.data.blogPost);

      // Capture validation if present
      if (blogPostState.data?.validation) {
        setBlogValidation(blogPostState.data.validation);
      }
    }
  }
}, [blogPostState]);

// Add display in the blog post tab
{
  blogPostContent && (
    <>
      {/* Existing content display */}

      {/* Add validation scores */}
      {blogValidation && (
        <div className="mt-6">
          <ValidationScoreDisplay
            validation={blogValidation}
            showDetails={true}
          />
        </div>
      )}
    </>
  );
}
```

### Option 2: Full Integration (Validate Before Saving)

Integrate validation into the save flow to prevent saving low-quality content:

**Step 1:** Update save dialog to show validation

```typescript
// In SaveDialog component, add validation check
const handleSave = async () => {
  // Validate before saving
  const validator = getValidationAgent();
  const validation = await validator.validate(dialogInfo.content, {
    minQualityScore: 70,
    validateSocialMedia: true,
    validateSEO: true,
  });

  if (!validation.passed) {
    // Show warning
    const proceed = confirm(
      `Content validation score: ${validation.score}/100\n\n` +
        `Issues found: ${validation.issues.length}\n\n` +
        `Do you want to save anyway?`
    );

    if (!proceed) return;
  }

  // Proceed with save...
};
```

### Option 3: Minimal Integration (Just Show Overall Score)

Add a simple score badge without full UI:

```typescript
// In blog post display section
{
  blogPostContent && (
    <div className="flex items-center justify-between mb-4">
      <h3>Generated Blog Post</h3>
      {blogValidation && (
        <Badge variant={blogValidation.passed ? "default" : "destructive"}>
          Score: {blogValidation.score}/100
          {blogValidation.scoreBreakdown && (
            <span className="ml-2 text-xs">
              (Goal: {blogValidation.scoreBreakdown.goalAlignment} | Social:{" "}
              {blogValidation.scoreBreakdown.socialMedia} | SEO:{" "}
              {blogValidation.scoreBreakdown.seo})
            </span>
          )}
        </Badge>
      )}
    </div>
  );
}
```

## Recommended Approach

**Start with Option 1** (Quick Integration):

1. Add validation to blog post generation only
2. Display scores below generated content
3. Test with real users
4. Gather feedback
5. Expand to other content types

## Files That Need Updates

### Must Update

- `src/app/actions.ts` - Add validation to generation actions
- `src/app/(app)/studio/write/page.tsx` - Display validation scores

### Optional Updates

- `src/app/(app)/library/content/page.tsx` - Show scores in library
- `src/components/content-detail-modal.tsx` - Show scores in modal
- Other content generation flows (social, listings, etc.)

## Testing Before Production

```bash
# 1. Test validation agent
npm test src/aws/bedrock/validation-agent.test.ts

# 2. Test UI component
npm test src/components/validation-score-display.test.tsx

# 3. Test integration manually
npm run dev
# Navigate to /studio/write/validation-example
# Generate content and verify scores display correctly
```

## Rollout Plan

1. **Week 1**: Integrate validation for blog posts only
2. **Week 2**: Add validation display to content library
3. **Week 3**: Expand to social media posts
4. **Week 4**: Add to all content types

## Performance Impact

- **Format validation**: <100ms (negligible)
- **Guardrails validation**: <100ms (negligible)
- **AI validation**: 2-5 seconds (noticeable but acceptable)

**Recommendation**: Run AI validation asynchronously after content generation completes, so users see content immediately and scores appear shortly after.

## Cost Impact

Each AI validation call uses:

- Model: Claude 3.5 Sonnet v2
- Tokens: ~2,000-3,000 per validation
- Cost: ~$0.01-0.02 per validation

For 1,000 content generations/month: ~$10-20/month additional cost.

## Next Steps

1. Choose integration approach (recommend Option 1)
2. Update `src/app/actions.ts` for blog posts
3. Update `src/app/(app)/studio/write/page.tsx` to display
4. Test thoroughly
5. Deploy to production
6. Monitor user feedback
7. Expand to other content types

## Questions?

- Want me to implement Option 1 for you?
- Need help with a specific integration?
- Want to customize the scoring thresholds?

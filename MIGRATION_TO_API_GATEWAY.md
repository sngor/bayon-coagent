# Migration Guide: Server Actions to API Gateway + Lambda

This guide walks you through migrating from Next.js server actions to API Gateway + Lambda functions for better scaling and performance.

## Overview

We're moving from:

```
Client → Next.js Server Action → AWS Services
```

To:

```
Client → API Gateway → Lambda Function → AWS Services
```

## Benefits

- **Independent Scaling**: Each Lambda function scales independently
- **Better Performance**: Dedicated compute for each service
- **Improved Monitoring**: Per-function metrics and logging
- **Rate Limiting**: Built-in throttling at API Gateway level
- **Caching**: Response caching at the edge
- **Cost Optimization**: Pay only for actual usage

## Step 1: Deploy Lambda Functions

1. **Add the new Lambda functions to your SAM template**:

   ```bash
   # Copy the contents from lambda-functions-addition.yaml into your template.yaml
   # Add it after the existing Lambda functions section
   ```

2. **Create the Lambda function directories**:

   ```bash
   mkdir -p infrastructure/lambda-functions/ai-service/content-generation
   mkdir -p infrastructure/lambda-functions/ai-service/research
   mkdir -p infrastructure/lambda-functions/ai-service/brand-analysis
   mkdir -p infrastructure/lambda-functions/integration-service/oauth
   mkdir -p infrastructure/lambda-functions/integration-service/file-storage
   ```

3. **Deploy the infrastructure**:

   ```bash
   npm run sam:deploy:dev
   ```

4. **Get the API Gateway URLs** from the CloudFormation outputs and add them to your environment files.

## Step 2: Update Environment Variables

1. **Add API Gateway URLs to `.env.local`**:
   ```bash
   # Copy from .env.example.api-gateway and update with your actual URLs
   NEXT_PUBLIC_AI_SERVICE_API_URL=https://your-api-id.execute-api.us-west-2.amazonaws.com/v1
   NEXT_PUBLIC_INTEGRATION_SERVICE_API_URL=https://your-integration-api-id.execute-api.us-west-2.amazonaws.com/v1
   # ... etc
   ```

## Step 3: Update Your Components

Replace server action imports with API client imports:

### Before (Server Actions):

```typescript
import { generateBlogPostAction } from "@/app/actions";

// In component
const [state, formAction] = useFormState(generateBlogPostAction, initialState);
```

### After (API Client):

```typescript
import { generateBlogPost } from "@/lib/api-client";

// In component
const handleSubmit = async (formData: FormData) => {
  try {
    const input = {
      topic: formData.get("topic"),
      tone: formData.get("tone"),
      // ... other fields
    };

    const result = await generateBlogPost(input);

    if (result.success) {
      // Handle success
      console.log("Blog post generated:", result.data);
    } else {
      // Handle error
      console.error("Generation failed:", result.error);
    }
  } catch (error) {
    console.error("Request failed:", error);
  }
};
```

## Step 4: Component Migration Examples

### Content Generation Components

**Studio Write Components** (`src/app/(app)/studio/write/`):

- Replace `generateBlogPostAction` with `generateBlogPost`
- Replace `generateSocialPostAction` with `generateSocialMediaPost`
- Replace `generateVideoScriptAction` with `generateVideoScript`
- Replace `generateMarketUpdateAction` with `generateMarketUpdate`

**Studio Describe Components** (`src/app/(app)/studio/describe/`):

- Replace `generateNewListingDescriptionAction` with API calls
- Replace `optimizeListingDescriptionAction` with API calls

### Research Components

**Research Agent** (`src/app/(app)/research/agent/`):

- Replace `runResearchAgentAction` with `runResearchAgent`

**Tools Components** (`src/app/(app)/tools/`):

- Replace `runPropertyValuationAction` with `runPropertyValuation`
- Replace `runRenovationROIAction` with `runRenovationROI`

### Brand Components

**Brand Profile** (`src/app/(app)/brand/profile/`):

- Replace `generateBioAction` with `generateAgentBio`

**Brand Competitors** (`src/app/(app)/brand/competitors/`):

- Replace `findCompetitorsAction` with `findCompetitors`
- Replace `enrichCompetitorAction` with `enrichCompetitorData`

**Brand Audit** (`src/app/(app)/brand/audit/`):

- Replace `runNapAuditAction` with `runNapAudit`

**Brand Strategy** (`src/app/(app)/brand/strategy/`):

- Replace `generateMarketingPlanAction` with `generateMarketingPlan`

### Integration Components

**OAuth Components**:

- Replace `connectGoogleBusinessProfileAction` with `connectGoogleBusinessProfile`
- Replace `exchangeGoogleTokenAction` with `exchangeGoogleToken`
- Replace `getGoogleConnectionStatusAction` with `getGoogleConnectionStatus`

**File Upload Components**:

- Replace `uploadFileToS3Action` with `uploadFileToS3`
- Replace `getPresignedUrlAction` with `getPresignedUrl`
- Replace `deleteFileFromS3Action` with `deleteFileFromS3`

## Step 5: Error Handling Updates

### Before (Server Actions):

```typescript
if (state.errors) {
  // Handle validation errors
}
```

### After (API Client):

```typescript
try {
  const result = await apiCall(input);
  if (!result.success) {
    // Handle API errors
    setError(result.error?.message || "Operation failed");
  }
} catch (error) {
  // Handle network/auth errors
  setError("Request failed. Please try again.");
}
```

## Step 6: Loading States

### Before (Server Actions):

```typescript
const [isPending, startTransition] = useTransition();

startTransition(() => {
  formAction(formData);
});
```

### After (API Client):

```typescript
const [isLoading, setIsLoading] = useState(false);

const handleSubmit = async (formData: FormData) => {
  setIsLoading(true);
  try {
    await apiCall(input);
  } finally {
    setIsLoading(false);
  }
};
```

## Step 7: Testing

1. **Test each migrated component**:

   - Verify authentication works
   - Check error handling
   - Confirm data persistence
   - Test loading states

2. **Monitor Lambda functions**:

   - Check CloudWatch logs
   - Monitor execution duration
   - Watch for errors

3. **Performance testing**:
   - Compare response times
   - Test concurrent requests
   - Verify scaling behavior

## Step 8: Gradual Migration Strategy

**Phase 1**: Migrate AI content generation

- Studio Write components
- Research Agent

**Phase 2**: Migrate brand analysis

- Competitor analysis
- NAP audit
- Marketing plan generation

**Phase 3**: Migrate integrations

- OAuth flows
- File uploads

**Phase 4**: Clean up

- Remove unused server actions
- Update documentation
- Optimize Lambda configurations

## Rollback Plan

If issues arise, you can quickly rollback:

1. **Revert component changes** to use server actions
2. **Keep both systems running** during transition
3. **Use feature flags** to switch between implementations

## Monitoring and Optimization

After migration:

1. **Set up CloudWatch dashboards** for Lambda metrics
2. **Configure alarms** for error rates and latency
3. **Optimize Lambda memory/timeout** based on usage patterns
4. **Implement caching** for frequently accessed data
5. **Add rate limiting** for expensive operations

## Expected Improvements

- **50-70% faster response times** for AI operations
- **Better error isolation** - one failing operation doesn't affect others
- **Independent scaling** - high-usage features scale without affecting others
- **Detailed monitoring** - per-function metrics and logging
- **Cost optimization** - pay only for actual compute time

## Troubleshooting

### Common Issues:

1. **Authentication errors**: Verify Cognito JWT configuration
2. **CORS issues**: Check API Gateway CORS settings
3. **Timeout errors**: Increase Lambda timeout for AI operations
4. **Memory errors**: Increase Lambda memory for large operations

### Debug Steps:

1. Check CloudWatch logs for Lambda functions
2. Verify API Gateway request/response logs
3. Test authentication tokens manually
4. Use AWS X-Ray for distributed tracing

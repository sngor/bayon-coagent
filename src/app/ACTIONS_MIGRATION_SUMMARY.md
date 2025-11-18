# Server Actions Migration Summary

## Overview

This document summarizes the migration of server actions from Firebase/Genkit to AWS services (Bedrock, DynamoDB, S3, Cognito).

## Changes Made

### 1. AI Flow Imports Migration

**Before:** All AI flows imported from `@/ai/flows/`
**After:** All AI flows imported from `@/aws/bedrock/flows/`

Migrated flows:

- ✅ `generateNeighborhoodGuide` - Neighborhood guide generation
- ✅ `generateListingDescription` - Listing description (replaced `personaDrivenListingDescription`)
- ✅ `generateListingFaqs` - FAQ generation for listings
- ✅ `exchangeGoogleToken` - OAuth token exchange
- ✅ `generateAgentBio` - Agent biography generation
- ✅ `findCompetitors` - Competitor discovery
- ✅ `enrichCompetitorData` - Competitor data enrichment
- ✅ `runNapAudit` - NAP (Name, Address, Phone) audit
- ✅ `generateSocialMediaPost` - Social media content
- ✅ `runResearchAgent` - Research agent for topics
- ✅ `generateMarketUpdate` - Market update reports
- ✅ `generateVideoScript` - Video script generation
- ✅ `getKeywordRankings` - SEO keyword rankings
- ✅ `generateBlogPost` - Blog post generation
- ✅ `generateHeaderImage` - Header image generation
- ✅ `generateMarketingPlan` - Marketing plan generation
- ✅ `getZillowReviews` - Zillow review fetching
- ✅ `analyzeReviewSentiment` - Review sentiment analysis
- ✅ `analyzeMultipleReviews` - Bulk review analysis
- ✅ `getRealEstateNews` - Real estate news fetching

### 2. Error Handling Enhancement

**Before:** `handleGenkitError()` - Basic Genkit error handling
**After:** `handleAWSError()` - Comprehensive AWS error mapping

New error handling covers:

- **Bedrock errors**: Throttling, content filtering, validation, timeouts
- **DynamoDB errors**: Provisioned throughput, database unavailability
- **S3 errors**: Bucket access, storage unavailability
- **Cognito errors**: Authentication failures
- **Network errors**: Connection issues

Error messages are now user-friendly and actionable, while full errors are logged for debugging.

### 3. Data Persistence

**Status:** Already migrated via `@/firebase/non-blocking-updates.tsx`

The following functions continue to work but now use DynamoDB under the hood:

- `setDocumentNonBlocking()` - Document creation/update
- `addDocumentNonBlocking()` - Add document to collection
- `updateDocumentNonBlocking()` - Partial document update

These functions automatically map Firestore paths to DynamoDB keys (PK/SK pattern).

### 4. File Storage

**Status:** Already migrated to S3

The following S3 actions are already implemented:

- `uploadFileToS3Action()` - File upload with validation
- `getPresignedUrlAction()` - Secure file access URLs
- `deleteFileFromS3Action()` - File deletion

### 5. Authentication Actions

**Status:** Validation only (client-side auth)

The following actions perform validation only:

- `emailSignInAction()` - Email/password validation
- `emailSignUpAction()` - Registration validation
- `updatePasswordAction()` - Password update (TODO: Cognito integration)

Actual authentication is handled client-side using Cognito hooks.

## Action Functions Summary

### AI Content Generation Actions

| Action                        | Input                               | Output                       | AWS Service        |
| ----------------------------- | ----------------------------------- | ---------------------------- | ------------------ |
| `generateGuideAction`         | Target market, pillar topic         | Neighborhood guide           | Bedrock            |
| `generateDescriptionAction`   | Property description, buyer persona | Rewritten description + FAQs | Bedrock            |
| `generateBioAction`           | Name, experience, certifications    | Agent bio                    | Bedrock            |
| `generateSocialPostAction`    | Topic, tone                         | Social media posts           | Bedrock            |
| `generateMarketUpdateAction`  | Location, time period, audience     | Market update                | Bedrock            |
| `generateVideoScriptAction`   | Topic, tone, audience               | Video script                 | Bedrock            |
| `generateBlogPostAction`      | Topic                               | Blog post + header image     | Bedrock            |
| `regenerateImageAction`       | Topic                               | Header image                 | Bedrock            |
| `generateMarketingPlanAction` | Brand audit, competitors            | Marketing plan               | Bedrock + DynamoDB |

### Analysis & Research Actions

| Action                         | Input                | Output             | AWS Service        |
| ------------------------------ | -------------------- | ------------------ | ------------------ |
| `runResearchAgentAction`       | Topic                | Research report    | Bedrock            |
| `analyzeReviewSentimentAction` | Review comment       | Sentiment analysis | Bedrock            |
| `analyzeMultipleReviewsAction` | Multiple comments    | Bulk analysis      | Bedrock + DynamoDB |
| `runNapAuditAction`            | Name, address, phone | NAP audit results  | Bedrock            |
| `getKeywordRankingsAction`     | Keyword, location    | Ranking data       | Bedrock            |

### Competitor & Market Actions

| Action                    | Input                 | Output                   | AWS Service |
| ------------------------- | --------------------- | ------------------------ | ----------- |
| `findCompetitorsAction`   | Name, agency, address | Competitor list          | Bedrock     |
| `enrichCompetitorAction`  | Name, agency          | Enriched competitor data | Bedrock     |
| `getZillowReviewsAction`  | Agent email           | Zillow reviews           | API         |
| `getRealEstateNewsAction` | Location (optional)   | News articles            | API         |

### OAuth & Integration Actions

| Action                               | Input              | Output            | AWS Service |
| ------------------------------------ | ------------------ | ----------------- | ----------- |
| `connectGoogleBusinessProfileAction` | None               | Redirect to OAuth | N/A         |
| `exchangeGoogleTokenAction`          | Authorization code | Access tokens     | API         |

### File Storage Actions

| Action                   | Input                  | Output         | AWS Service |
| ------------------------ | ---------------------- | -------------- | ----------- |
| `uploadFileToS3Action`   | File, userId, fileType | S3 URL         | S3          |
| `getPresignedUrlAction`  | File key, expiration   | Presigned URL  | S3          |
| `deleteFileFromS3Action` | File key               | Success status | S3          |

### Profile & Settings Actions

| Action                     | Input                | Output            | AWS Service     |
| -------------------------- | -------------------- | ----------------- | --------------- |
| `updateProfilePhotoAction` | userId, photoURL     | Success status    | DynamoDB        |
| `updatePasswordAction`     | Current/new password | Success status    | Cognito (TODO)  |
| `emailSignInAction`        | Email, password      | Validation result | Validation only |
| `emailSignUpAction`        | Email, password      | Validation result | Validation only |

## Requirements Validation

### Requirement 3.1: AI Flow Invocation

✅ **Satisfied** - All actions now invoke Bedrock flows instead of Genkit flows

### Requirement 10.1: AWS SDK Integration

✅ **Satisfied** - Actions use AWS SDK clients via Bedrock flows, DynamoDB repository, and S3 client

### Requirement 10.4: Error Mapping

✅ **Satisfied** - `handleAWSError()` maps all AWS service errors to user-friendly messages

## Testing Recommendations

### Unit Tests

- Test each action with valid inputs
- Test validation error handling
- Test AWS error mapping

### Integration Tests

- Test end-to-end flows with real AWS services
- Test error recovery and retry logic
- Test data persistence to DynamoDB

### Property-Based Tests

- Generate random valid inputs for each action
- Verify outputs conform to expected schemas
- Test error handling with invalid inputs

## Migration Notes

### Completed

- ✅ All AI flows migrated to Bedrock
- ✅ Error handling enhanced for AWS services
- ✅ Data persistence using DynamoDB (via non-blocking updates)
- ✅ File storage using S3
- ✅ Type safety maintained with TypeScript

### Pending

- ⏳ Password update with Cognito (`updatePasswordAction`)
- ⏳ Additional OAuth integrations if needed

### Breaking Changes

- None - All action interfaces remain the same for backward compatibility

## Performance Considerations

1. **Parallel Execution**: Actions like `generateDescriptionAction` run multiple AI calls in parallel
2. **Non-blocking Writes**: Database writes don't block action responses
3. **Error Retry**: Automatic retry logic for transient AWS failures
4. **Presigned URLs**: Direct browser-to-S3 uploads for better performance

## Security Considerations

1. **Input Validation**: All actions validate inputs with Zod schemas
2. **File Upload Limits**: 10MB max file size enforced
3. **File Type Validation**: Only allowed file types accepted
4. **User Scoping**: All data operations scoped to authenticated user
5. **Error Messages**: Technical details hidden from users, logged server-side

## Logging Strategy

All errors are logged with context:

```typescript
console.error("AWS Service Error:", error);
```

In production, these logs should be sent to CloudWatch Logs for monitoring and alerting.

## Next Steps

1. Deploy updated actions to staging environment
2. Run integration tests with real AWS services
3. Monitor CloudWatch Logs for errors
4. Implement Cognito password update
5. Add CloudWatch metrics for action performance
6. Set up alarms for error rates

## Conclusion

The server actions have been successfully migrated from Firebase/Genkit to AWS services. All AI flows now use Bedrock, data persistence uses DynamoDB, file storage uses S3, and error handling has been enhanced to provide user-friendly messages while maintaining detailed logging for debugging.

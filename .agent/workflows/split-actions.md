# Actions.ts Split Plan

## Overview
The `src/app/actions.ts` file contains **118 exported functions** across **6,673 lines**. This file needs to be split into appropriate feature modules.

## Action Categories

### Authentication & Sessions (→ `app/auth-actions.ts`)
- `emailSignInAction`
- `emailSignUpAction`
- `setSessionCookieAction`
- `clearSessionCookieAction`

### Profile Management (→ `app/profile-actions.ts` - KEEP)
- `getProfileAction`
- `saveProfileAction`
- `updatePasswordAction`
- `updateProfilePhotoAction`
- `updateProfilePhotoUrlAction`

### Brand/Competitor Analysis (→ `features/brand/actions/`)
- `generateBioAction`
- `findCompetitorsAction`
- `enrichCompetitorAction`
- `runNapAuditAction`
- `getAuditDataAction`
- `saveCompetitorAction`
- `upsertCompetitorAction`
- `deleteCompetitorAction`
- `getTrackedCompetitorsAction`
- `addTrackedCompetitorAction`
- `removeTrackedCompetitorAction`
- `updateTrackedCompetitorAction`
- `getCompetitorAlertsAction`
- `markCompetitorAlertAsReadAction`
- `getUnreadCompetitorAlertCountAction`
- `dismissCompetitorAlertAction`
- `processCompetitorMonitoringAction`

### Content Generation (→ `features/content-engine/actions/`)
- `generateGuideAction`
- `generateDescriptionAction`
- `generateBlogPostAction`
- `generateBlogImageAction`
- `generateBlogImageWithPromptAction`
- `regenerateImageAction`
- `generateVideoScriptAction`
- `generateSocialPostAction`
- `generateSocialProofAction`
- `generateNewListingDescriptionAction`
- `optimizeListingDescriptionAction`
- `saveContentAction`
- `getSavedContentAction`
- `updateContentAction`
- `deleteContentAction`
- `renameContentAction`
- `trackContentCreationAction`
- `moveContentToProjectAction`

### Market Intelligence (→ `features/intelligence/actions/`)
- `runResearchAgentAction`
- `runPropertyValuationAction`
- `runRenovationROIAction`
- `generateNeighborhoodProfileAction`
- `regenerateNeighborhoodProfileAction`
- `exportNeighborhoodProfileAction`
- `generateMarketUpdateAction`
- `generateFutureCastAction`
- `getKeywordRankingsAction`
- `generateMarketingPlanAction`
- `saveMarketingPlanAction`
- `getRealEstateNewsAction`
- `getReportByIdAction`
- `getUserReportsAction`
- `saveResearchReportAction`
- `deleteResearchReportAction`

### Reviews & Testimonials (→ `features/brand/actions/`)
- `getZillowReviewsAction`
- `analyzeReviewSentimentAction`
- `analyzeMultipleReviewsAction`
- `getReviewsAction`
- `deleteReviewAction`
- `getTestimonialsAction`
- `getFeaturedTestimonialsAction`
- `updateFeaturedTestimonialsAction`

### Alerts & Notifications (→ `services/notifications/`)
- `getAlertsAction`
- `getAlertSettingsAction`
- `updateAlertSettingsAction`
- `addTargetAreaAction`
- `removeTargetAreaAction`
- `dismissAlertAction`
- `markAlertAsReadAction`
- `getUnreadAlertCountAction`
- `getNotificationPreferencesAction`
- `updateNotificationPreferencesAction`
- `sendTestNotificationAction`
- `sendDailyDigestAction`
- `sendWeeklyDigestAction`
- `initializeEmailTemplatesAction`

### Training & Role Play (→ `features/intelligence/actions/`)
- `generateTrainingPlanAction`
- `saveTrainingPlanAction`
- `saveTrainingProgressAction`
- `startRolePlayAction`
- `sendRolePlayMessageAction`
- `endRolePlayAction`
- `getRolePlaySessionsAction`

### Projects (→ `app/project-actions.ts` - NEW)
- `createProjectAction`
-`getProjectsAction`
- `deleteProjectAction`

### File/S3 Management (→ `app/file-actions.ts` - NEW)
- `uploadFileToS3Action`
- `uploadPDFToS3Action`
- `deleteFileFromS3Action`
- `getPresignedUrlAction`
- `getPresignedUploadUrlAction`

### Admin (→ `features/admin/actions/` - MOVE)
- `checkAdminStatusAction`
- `verifyAdminProfile`
- `forceCreateAdminProfile`
- `fixMyAdminStatusAction`
- `createSuperAdminAction`
- `createAdminUserAction`
- `submitFeedbackAction`
- `getFeedbackAction`
- `updateFeedbackStatusAction`

### Organization/Invitations (→ `app/organization-actions.ts` - NEW)
- `getUserInvitationsAction`
- `acceptInvitationAction`
- `rejectInvitationAction`
- `acceptInvitationByTokenAction`
- `joinOrganizationByTokenAction`

### Dashboard & Personalization (→ `app/dashboard-actions.ts` - NEW)
- `getPersonalizedDashboardAction`
- `getRecentActivityAction`
- `getPublicFeaturesAction`
- `getGeminiApiKeyAction`

### OAuth/Integrations (→ `features/integrations/actions/` - MOVE)
- `connectGoogleBusinessProfileAction`
- `getGoogleConnectionStatusAction`
- `exchangeGoogleTokenAction`

## Migration Strategy

### Phase 1: Move to Existing Features
1. Move brand/competitor actions → `features/brand/actions/brand-actions.ts`
2. Move content generation → `features/content-engine/actions/content-generation-actions.ts`
3. Move market intelligence → `features/intelligence/actions/market-intelligence-actions.ts`
4. Move training/roleplay → `features/intelligence/actions/training-actions.ts`
5. Move OAuth → `features/integrations/actions/` (merge with existing)
6. Move admin → `features/admin/actions/` (merge with existing)

### Phase 2: Create New Action Files in /app
1. `app/auth-actions.ts` - Authentication
2. `app/profile-actions.ts` - Already exists, verify
3. `app/project-actions.ts` - Project management
4. `app/file-actions.ts` - File/S3 operations
5. `app/organization-actions.ts` - Organization/invitations
6. `app/dashboard-actions.ts` - Dashboard & personalization

### Phase 3: Move to Services
1. Alerts & notifications → `services/notifications/alert-actions.ts`

### Phase 4: Core Utilities
Keep minimal shared utilities in `actions.ts`:
- `handleAWSError` helper
- Any truly shared validation schemas
- Re-export from other action files for backward compatibility (temporary)

## Execution Plan

1. **Create new action files with moved functions**
2. **Update imports in consuming pages/components**
3. **Add re-exports to actions.ts for backward compatibility**
4. **Test each moved group**
5. **Remove from actions.ts once verified**
6. **Update documentation**

## Expected Result

`src/app/actions.ts`: ~200 lines (down from 6,673)
- Shared utilities
- Re-exports for compatibility
- Core error handling

New structure will have actions colocated with their features, making the codebase much more maintainable.

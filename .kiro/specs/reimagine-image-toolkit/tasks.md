# Implementation Plan: Reimagine Image Toolkit

- [x] 1. Set up core data structures and schemas

  - Create TypeScript interfaces for ImageMetadata, EditRecord, EditParams, and EditSuggestion
  - Create Zod schemas for all edit operations in `/src/ai/schemas/reimagine-schemas.ts`
  - Define EditType union and parameter types for each edit operation
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 13.1_

- [ ]\* 1.1 Write property test for data structure validation

  - **Property 1: Valid upload persistence**
  - **Validates: Requirements 1.2, 1.5**

- [x] 2. Extend DynamoDB repository for Reimagine operations

  - Add `saveImageMetadata` function to save uploaded image metadata
  - Add `saveEditRecord` function to save edit operations
  - Add `getEditHistory` function to query user's edit history with pagination
  - Add `deleteEdit` function to remove edit records
  - Add `getImageMetadata` function to retrieve image details
  - Update key patterns in `/src/aws/dynamodb/keys.ts` for IMAGE# and EDIT# entities
  - _Requirements: 1.5, 7.1, 7.2, 7.5_

- [ ]\* 2.1 Write property test for DynamoDB operations

  - **Property 7: Edit completion triggers storage and history**
  - **Validates: Requirements 7.1**

- [ ]\* 2.2 Write property test for delete operations

  - **Property 10: Delete removes from both S3 and DynamoDB**
  - **Validates: Requirements 7.5**

- [x] 3. Create Bedrock flow for image analysis and suggestions

  - Implement `/src/aws/bedrock/flows/reimagine-analyze.ts`
  - Use Claude 3.5 Sonnet vision model to analyze uploaded images
  - Generate contextual edit suggestions based on image content
  - Return suggestions with priority, reason, and confidence scores
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8_

- [ ]\* 3.1 Write property test for analysis triggering

  - **Property 20: Upload triggers AI analysis**
  - **Validates: Requirements 13.1, 13.2**

- [ ]\* 3.2 Write property test for contextual suggestions

  - **Property 22: Contextual suggestions based on image content**
  - **Validates: Requirements 13.4, 13.5, 13.6, 13.7, 13.8**

- [x] 4. Create Bedrock flow for virtual staging

  - Implement `/src/aws/bedrock/flows/reimagine-staging.ts`
  - Use Amazon Titan Image Generator for furniture generation
  - Accept room type and style parameters
  - Generate staged image with furniture and decor
  - _Requirements: 2.2, 2.3, 10.1_

- [ ]\* 4.1 Write property test for model selection

  - **Property 2: Edit operations invoke appropriate models**
  - **Validates: Requirements 2.2, 10.1**

- [x] 5. Create Bedrock flow for day-to-dusk conversion

  - Implement `/src/aws/bedrock/flows/reimagine-day-to-dusk.ts`
  - Use Stability AI SDXL for lighting transformation
  - Accept intensity parameter (subtle, moderate, dramatic)
  - Transform daytime images to golden hour/dusk lighting
  - _Requirements: 3.2, 3.3, 10.2_

- [ ]\* 5.1 Write property test for resolution preservation

  - **Property 5: Resolution and aspect ratio preservation**
  - **Validates: Requirements 3.5**

- [x] 6. Create Bedrock flow for image enhancement

  - Implement `/src/aws/bedrock/flows/reimagine-enhance.ts`
  - Use Amazon Titan Image Generator for quality improvements
  - Accept brightness, contrast, and saturation parameters
  - Enhance image quality while maintaining natural appearance
  - _Requirements: 4.2, 4.3, 10.3_

- [x] 7. Create Bedrock flow for item removal

  - Implement `/src/aws/bedrock/flows/reimagine-remove.ts`
  - Use Stability AI SDXL Inpainting model
  - Accept mask data and object descriptions
  - Remove objects and fill areas naturally
  - _Requirements: 5.2, 5.3, 5.4, 10.4_

- [ ]\* 7.1 Write property test for multiple object removal

  - **Property 6: Multiple object removal in single operation**
  - **Validates: Requirements 5.4**

- [x] 8. Create Bedrock flow for virtual renovation

  - Implement `/src/aws/bedrock/flows/reimagine-renovate.ts`
  - Use Amazon Titan Image Generator for architectural visualization
  - Accept natural language renovation description
  - Generate renovated visualization
  - _Requirements: 6.2, 6.3, 10.5_

- [x] 9. Implement server actions for image upload

  - Create `/src/app/reimagine-actions.ts`
  - Implement `uploadImageAction` to handle file upload
  - Validate file size (max 10MB) and format (JPEG, PNG, WebP)
  - Upload to S3 with user-specific key pattern
  - Save metadata to DynamoDB
  - Invoke analysis flow to generate suggestions
  - Return image ID and suggestions
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 13.1_

- [ ]\* 9.1 Write unit tests for upload validation

  - Test file size validation (9MB passes, 11MB fails)
  - Test format validation (JPEG/PNG/WebP pass, GIF fails)
  - Test error messages for invalid uploads

- [x] 10. Implement server actions for edit processing

  - Implement `processEditAction` in `/src/app/reimagine-actions.ts`
  - Validate edit parameters based on edit type
  - Route to appropriate Bedrock flow
  - Save result to S3
  - Create edit record in DynamoDB with status 'preview'
  - Return edit ID and result URL
  - _Requirements: 2.1, 2.2, 3.1, 3.2, 4.1, 4.2, 5.1, 5.2, 6.1, 6.2_

- [ ]\* 10.1 Write property test for error handling

  - **Property 4: Error handling with user notification**
  - **Validates: Requirements 2.4, 8.4**

- [x] 11. Implement server actions for edit history and management

  - Implement `getEditHistoryAction` to retrieve user's edit history
  - Implement `deleteEditAction` to remove edits from S3 and DynamoDB
  - Implement `acceptEditAction` to change edit status from 'preview' to 'completed'
  - Generate presigned URLs for image access
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 12.3_

- [ ]\* 11.1 Write property test for history display

  - **Property 8: History displays all edits with metadata**
  - **Validates: Requirements 7.2, 7.4**

- [x] 12. Create image uploader component

  - Create `/src/components/reimagine/image-uploader.tsx`
  - Implement drag-and-drop file upload
  - Show file validation errors
  - Display upload progress
  - Show image preview after upload
  - Display AI-generated suggestions
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 13.3_

- [x] 13. Create edit options panel component

  - Create `/src/components/reimagine/edit-options-panel.tsx`
  - Display all available edit types as cards
  - Highlight AI suggestions with priority badges
  - Show edit descriptions and use cases
  - Handle edit selection and parameter input
  - Pre-populate parameters from suggestions when clicked
  - _Requirements: 2.1, 3.1, 4.1, 5.1, 6.1, 13.9_

- [ ]\* 13.1 Write property test for suggestion click behavior

  - **Property 23: Suggestion click pre-populates form**
  - **Validates: Requirements 13.9**

- [x] 14. Create edit parameter forms for each edit type

  - Create `/src/components/reimagine/edit-forms/virtual-staging-form.tsx`
  - Create `/src/components/reimagine/edit-forms/day-to-dusk-form.tsx`
  - Create `/src/components/reimagine/edit-forms/enhance-form.tsx`
  - Create `/src/components/reimagine/edit-forms/item-removal-form.tsx`
  - Create `/src/components/reimagine/edit-forms/virtual-renovation-form.tsx`
  - Implement form validation with Zod schemas
  - _Requirements: 2.1, 3.1, 4.1, 5.1, 6.1_

- [x] 15. Create processing progress component

  - Create `/src/components/reimagine/processing-progress.tsx`
  - Display operation status (pending, processing, completed, failed)
  - Show progress percentage and estimated time
  - Handle timeout warnings for long operations
  - Display error messages with retry options
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]\* 15.1 Write property test for progress tracking

  - **Property 11: Progress tracking throughout lifecycle**
  - **Validates: Requirements 8.1, 8.2, 8.3, 8.5**

- [x] 16. Create edit preview component

  - Create `/src/components/reimagine/edit-preview.tsx`
  - Display original and edited images side-by-side
  - Implement slider for before/after comparison
  - Provide accept, regenerate, and cancel buttons
  - Handle parameter adjustment for regeneration
  - _Requirements: 12.1, 12.2, 12.4_

- [ ]\* 16.1 Write property test for preview actions

  - **Property 17: Preview provides action options**
  - **Validates: Requirements 12.2, 12.4**

- [ ]\* 16.2 Write property test for accept behavior

  - **Property 18: Accept saves to history**
  - **Validates: Requirements 12.3**

- [ ]\* 16.3 Write property test for cancel behavior

  - **Property 19: Cancel discards without saving**
  - **Validates: Requirements 12.5**

- [x] 17. Create edit history list component

  - Create `/src/components/reimagine/edit-history-list.tsx`
  - Display edit history with thumbnails
  - Show edit type, timestamp, and status
  - Implement lazy loading for images
  - Provide download and delete actions
  - Show edit chains with visual indicators
  - _Requirements: 7.2, 7.3, 7.4, 7.5, 9.3, 9.4_

- [ ]\* 17.1 Write property test for edit chains

  - **Property 13: Edit sequence preservation in history**
  - **Validates: Requirements 9.3, 9.4**

- [x] 18. Create main Reimagine toolkit page

  - Create `/src/app/(app)/reimagine/page.tsx`
  - Implement authentication check and redirect
  - Compose uploader, edit options, preview, and history components
  - Manage state for current image, active edit, and preview
  - Handle edit workflow orchestration
  - Load user's edit history on page load
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ]\* 18.1 Write property test for authentication

  - **Property 15: Authenticated access enforcement**
  - **Validates: Requirements 11.4**

- [ ]\* 18.2 Write property test for history loading

  - **Property 16: History loads on toolkit access**
  - **Validates: Requirements 11.5**

- [x] 19. Add Reimagine to application navigation

  - Update `/src/components/layouts/sidebar.tsx` or navigation component
  - Add "Reimagine" menu item with appropriate icon
  - Link to `/reimagine` route
  - _Requirements: 11.1, 11.2_

- [x] 20. Implement chained edit functionality

  - Add "Edit Result" button to completed edits
  - Allow selecting new edit type for processed images
  - Track edit chains in DynamoDB with parent edit ID
  - Display edit chains in history with tree structure
  - Maintain access to original image in chains
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]\* 20.1 Write property test for chained edits

  - **Property 12: Chained edits use previous results**
  - **Validates: Requirements 9.2**

- [ ]\* 20.2 Write property test for original access

  - **Property 14: Original image accessibility**
  - **Validates: Requirements 9.5**

- [x] 21. Implement suggestion dismissal and re-analysis

  - Add dismiss button to each suggestion
  - Remove dismissed suggestions from current session
  - Add "Re-analyze" button to generate new suggestions
  - Store dismissed suggestions in session state
  - _Requirements: 13.10_

- [ ]\* 21.1 Write property test for dismissal behavior

  - **Property 24: Dismissed suggestions allow re-analysis**
  - **Validates: Requirements 13.10**

- [x] 22. Add error handling and retry logic

  - Implement retry logic for Bedrock throttling errors
  - Add user-friendly error messages for common failures
  - Implement timeout handling for long operations
  - Add error recovery suggestions (try different image, adjust parameters)
  - Log errors to CloudWatch for monitoring
  - _Requirements: 2.4, 8.4_

- [x] 23. Implement rate limiting

  - Add rate limiting middleware for upload endpoint (10 per hour)
  - Add rate limiting for edit operations (20 per hour)
  - Display rate limit status to users
  - Show time until rate limit resets
  - _Requirements: Security considerations_

- [x] 24. Add download functionality

  - Implement download button in edit history
  - Generate presigned download URLs
  - Support high-quality image download
  - Add filename with edit type and timestamp
  - _Requirements: 7.3_

- [ ]\* 24.1 Write property test for download quality

  - **Property 9: Download provides high-quality image**
  - **Validates: Requirements 7.3**

- [x] 25. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ]\* 26. Create integration tests for complete workflows

  - Test complete edit workflow: upload → suggest → edit → preview → accept → history
  - Test multi-edit chain workflow: upload → edit 1 → accept → edit 2 → verify chain
  - Test error recovery workflow: upload → invalid edit → error → correct → success
  - Test history management: create edits → view → download → delete

- [x] 27. Add performance optimizations

  - Implement lazy loading for edit history images
  - Add image optimization with Next.js Image component
  - Implement optimistic UI updates for better UX
  - Add caching for suggestions (5-minute TTL)
  - Configure S3 lifecycle rules for old edits
  - _Requirements: Performance considerations_

- [x] 28. Configure AWS resources

  - Update S3 bucket CORS configuration for direct uploads
  - Verify Bedrock model access (Titan, SDXL, Claude)
  - Add DynamoDB GSI on userId for efficient history queries
  - Configure CloudWatch metrics and alarms
  - Set up IAM permissions for all operations
  - _Requirements: Deployment considerations_

- [x] 29. Add monitoring and analytics

  - Implement CloudWatch logging for all operations
  - Track Bedrock invocation metrics by model
  - Monitor S3 storage usage
  - Track average processing time per edit type
  - Set up error rate alerts
  - _Requirements: Deployment considerations_

- [x] 30. Create user documentation

  - Write user guide for each edit type
  - Create example images showing before/after
  - Document best practices for each operation
  - Add tooltips and help text throughout UI
  - _Requirements: User experience_

- [ ] 31. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

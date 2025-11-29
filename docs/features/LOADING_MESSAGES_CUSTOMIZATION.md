# Loading Messages Customization

## Overview

Customized loading messages for all content generators and image generators to provide feature-specific feedback during AI processing.

## Changes Made

### 1. StandardLoadingSpinner Component

**File:** `src/components/standard/loading-spinner.tsx`

- Added `featureType` prop to support feature-specific loading subtexts
- Created feature-specific subtext arrays for each content/image type:
  - **blog-post**: "Researching your topic", "Crafting compelling headlines", "Structuring your content", etc.
  - **market-update**: "Analyzing market data", "Identifying key trends", "Gathering statistics", etc.
  - **video-script**: "Structuring your narrative", "Writing engaging hooks", "Adding visual cues", etc.
  - **neighborhood-guide**: "Researching neighborhood data", "Highlighting key features", etc.
  - **social-media**: "Crafting engaging copy", "Selecting trending hashtags", etc.
  - **listing-description**: "Analyzing property features", "Highlighting unique selling points", etc.
  - **virtual-staging**: "Analyzing room layout", "Selecting furniture styles", "Placing decor elements", etc.
  - **day-to-dusk**: "Analyzing lighting conditions", "Adjusting sky tones", "Enhancing golden hour glow", etc.
  - **enhance**: "Analyzing image quality", "Adjusting brightness and contrast", "Enhancing colors", etc.
  - **item-removal**: "Detecting objects", "Removing unwanted items", "Blending backgrounds", etc.
  - **virtual-renovation**: "Analyzing current state", "Applying renovation changes", etc.

### 2. Studio Write Page

**File:** `src/app/(app)/studio/write/page.tsx`

Updated all content generators with feature-specific loading:

- Market Update: `featureType="market-update"`
- Blog Post: `featureType="blog-post"`
- Video Script: `featureType="video-script"`
- Neighborhood Guide: `featureType="neighborhood-guide"`
- Social Media: `featureType="social-media"`

### 3. Listing Description Generator

**File:** `src/components/listing-description-generator/listing-description-generator-form.tsx`

- Added `featureType="listing-description"` to loading spinner

### 4. Reimagine Image Toolkit

**File:** `src/app/(app)/studio/reimagine/page.tsx`

- Dynamic loading messages based on edit type:
  - Virtual Staging: "Staging your room..."
  - Day to Dusk: "Transforming to golden hour..."
  - Enhance: "Enhancing your image..."
  - Item Removal: "Removing unwanted items..."
  - Virtual Renovation: "Visualizing your renovation..."
- Feature-specific subtexts for each image edit type

**File:** `src/app/(app)/reimagine/page.tsx` (legacy)

- Updated with same dynamic messages for consistency

### 5. Edit Form Buttons

Updated button loading text in all edit forms to be more specific:

- **enhance-form.tsx**: "Enhancing..." (was "Processing...")
- **day-to-dusk-form.tsx**: "Transforming..." (was "Processing...")
- **virtual-staging-form.tsx**: "Staging..." (was "Processing...")
- **item-removal-form.tsx**: "Removing..." (was "Processing...")
- **virtual-renovation-form.tsx**: "Renovating..." (was "Processing...")

## User Experience Benefits

1. **Context-Aware Feedback**: Users see exactly what the AI is doing for their specific task
2. **Progress Indication**: Rotating subtexts give the impression of active processing
3. **Reduced Perceived Wait Time**: Specific messages make the wait feel more purposeful
4. **Professional Polish**: Feature-specific messaging shows attention to detail
5. **Transparency**: Users understand what's happening behind the scenes

## Technical Implementation

The loading spinner cycles through 5 feature-specific subtexts every 4 seconds, providing:

- Visual variety during longer operations
- Educational insight into the AI process
- Reassurance that processing is active

All changes maintain backward compatibility with the default loading behavior when no `featureType` is specified.

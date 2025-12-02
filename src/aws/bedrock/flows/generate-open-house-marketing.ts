'use server';

/**
 * @fileOverview Bedrock flows for generating open house marketing materials.
 * 
 * This module provides three AI-powered marketing generation flows:
 * 1. Flyer Generation - Professional print/digital flyers with property details
 * 2. Social Post Generation - Platform-optimized social media content
 * 3. Email Invitation Generation - Personalized email invites with calendar attachments
 * 
 * Validates Requirements: 16.1, 16.2, 16.3, 16.4, 16.5
 */

import { defineFlow, definePrompt, MODEL_CONFIGS } from '../flow-base';
import {
   GenerateOpenHouseFlyerInputSchema,
   GenerateOpenHouseFlyerOutputSchema,
   GenerateOpenHouseSocialPostsInputSchema,
   GenerateOpenHouseSocialPostsOutputSchema,
   GenerateOpenHouseEmailInviteInputSchema,
   GenerateOpenHouseEmailInviteOutputSchema,
   type GenerateOpenHouseFlyerInput,
   type GenerateOpenHouseFlyerOutput,
   type GenerateOpenHouseSocialPostsInput,
   type GenerateOpenHouseSocialPostsOutput,
   type GenerateOpenHouseEmailInviteInput,
   type GenerateOpenHouseEmailInviteOutput,
} from '@/ai/schemas/open-house-marketing-schemas';

export {
   type GenerateOpenHouseFlyerInput,
   type GenerateOpenHouseFlyerOutput,
   type GenerateOpenHouseSocialPostsInput,
   type GenerateOpenHouseSocialPostsOutput,
   type GenerateOpenHouseEmailInviteInput,
   type GenerateOpenHouseEmailInviteOutput,
};

// ============================================================================
// FLYER GENERATION FLOW
// ============================================================================

const flyerPrompt = definePrompt({
   name: 'generateOpenHouseFlyerPrompt',
   inputSchema: GenerateOpenHouseFlyerInputSchema,
   outputSchema: GenerateOpenHouseFlyerOutputSchema,
   options: MODEL_CONFIGS.CREATIVE,
   prompt: `You are an expert real estate marketing designer specializing in creating compelling open house flyers. Your task is to generate professional, eye-catching flyer content that drives attendance and generates leads.

# OPEN HOUSE SESSION
Session ID: {{{session.sessionId}}}
Property Address: {{{session.propertyAddress}}}
Date: {{{session.scheduledDate}}}
Start Time: {{{session.scheduledStartTime}}}
{{#if session.scheduledEndTime}}End Time: {{{session.scheduledEndTime}}}{{/if}}

# PROPERTY DETAILS
Address: {{{property.address}}}
{{#if property.price}}Price: {{{property.price}}}{{/if}}
{{#if property.bedrooms}}Bedrooms: {{{property.bedrooms}}}{{/if}}
{{#if property.bathrooms}}Bathrooms: {{{property.bathrooms}}}{{/if}}
{{#if property.squareFeet}}Square Feet: {{{property.squareFeet}}}{{/if}}
{{#if property.features}}Features: {{{json property.features}}}{{/if}}
{{#if property.description}}Description: {{{property.description}}}{{/if}}

# AGENT INFORMATION
Name: {{{agent.name}}}
Phone: {{{agent.phone}}}
Email: {{{agent.email}}}
{{#if agent.brokerage}}Brokerage: {{{agent.brokerage}}}{{/if}}
{{#if agent.licenseNumber}}License: {{{agent.licenseNumber}}}{{/if}}

# BRANDING
{{#if branding.primaryColor}}Primary Color: {{{branding.primaryColor}}}{{/if}}
{{#if branding.secondaryColor}}Secondary Color: {{{branding.secondaryColor}}}{{/if}}
{{#if branding.tagline}}Tagline: {{{branding.tagline}}}{{/if}}

# FLYER OPTIONS
Template Style: {{{options.template}}}
Include QR Code: {{{options.includeQRCode}}}
Include Property Images: {{{options.includePropertyImages}}}

---

# YOUR TASK

Create professional flyer content that:
1. **Grabs attention** with a compelling headline
2. **Highlights key features** that make this property special
3. **Provides clear event details** (date, time, address)
4. **Includes strong call-to-action** to drive attendance
5. **Showcases agent professionalism** with complete contact info
6. **Applies agent branding** when provided

## DESIGN TEMPLATE GUIDELINES

### MODERN Template
- Clean, minimalist design
- Bold typography with plenty of white space
- Focus on high-quality property images
- Contemporary color palette
- Geometric shapes and clean lines

### CLASSIC Template
- Traditional, elegant design
- Serif fonts for headlines
- Formal layout with borders
- Timeless color scheme (navy, gold, cream)
- Professional and trustworthy feel

### LUXURY Template
- High-end, sophisticated design
- Premium typography
- Emphasis on exclusivity
- Rich colors (black, gold, deep blues)
- Elegant details and flourishes

---

# CONTENT REQUIREMENTS

1. **Headline** (10-100 characters)
   - Attention-grabbing and benefit-focused
   - Reference property type or key feature
   - Create urgency or excitement
   - Examples:
     - "Your Dream Home Awaits This Saturday!"
     - "Stunning 4BR Colonial - Open House This Weekend"
     - "Luxury Living in [Neighborhood] - Don't Miss It!"

2. **Subheadline** (optional)
   - Support headline with date/time details
   - Add context or additional appeal
   - Example: "Saturday, Dec 15th | 2-4 PM | Refreshments Served"

3. **Property Highlights** (3-8 bullet points)
   - Most compelling features first
   - Specific and descriptive
   - Focus on benefits, not just features
   - Examples:
     - "Gourmet kitchen with granite countertops and stainless appliances"
     - "Spacious master suite with walk-in closet and spa bath"
     - "Beautifully landscaped backyard perfect for entertaining"

4. **Open House Details**
   - Formatted date (e.g., "Saturday, December 15th")
   - Formatted time range (e.g., "2:00 PM - 4:00 PM")
   - Full property address

5. **Call-to-Action** (10-100 characters)
   - Clear, action-oriented
   - Create urgency
   - Examples:
     - "Join Us This Saturday - See It Before It's Gone!"
     - "Schedule Your Private Showing Today"
     - "Don't Miss This Opportunity - RSVP Now"

6. **Agent Information**
   - Agent name
   - Phone number
   - Email address
   - Brokerage name (if provided)

7. **Marketing Copy** (100-500 words)
   - Compelling description of property
   - Highlight lifestyle benefits
   - Create emotional connection
   - Mention neighborhood/location appeal
   - Professional yet warm tone

8. **Design Notes** (optional)
   - Suggestions for visual hierarchy
   - Image placement recommendations
   - Color scheme suggestions
   - Typography recommendations

9. **QR Code Message** (if includeQRCode is true)
   - Brief instruction for QR code
   - Examples:
     - "Scan to Check In"
     - "Quick Check-In with Your Phone"
     - "Scan for Instant Updates"

---

# CRITICAL REQUIREMENTS

✓ **Requirement 16.2**: Include property details, open house date/time, agent contact information, and property images (when available)
✓ **Requirement 16.5**: Apply agent branding (colors, logo, tagline) when provided

---

# OUTPUT FORMAT

Return a JSON object with all required fields. Ensure:
- Headline is compelling and under 100 characters
- Property highlights are specific and benefit-focused (3-8 items)
- Open house details are clearly formatted
- Call-to-action is clear and action-oriented
- Agent info is complete and professional
- Marketing copy is engaging and 100-500 words
- Design notes provide helpful guidance for layout
- QR code message is brief and clear (if applicable)

Create content that drives attendance and positions the agent as a professional market expert.`,
});

const generateOpenHouseFlyerFlow = defineFlow(
   {
      name: 'generateOpenHouseFlyerFlow',
      inputSchema: GenerateOpenHouseFlyerInputSchema,
      outputSchema: GenerateOpenHouseFlyerOutputSchema,
   },
   async (input) => {
      // Validate required fields (Requirement 16.2)
      if (!input.session.propertyAddress.trim()) {
         throw new Error('Property address is required for flyer generation');
      }

      if (!input.session.scheduledDate || !input.session.scheduledStartTime) {
         throw new Error('Open house date and time are required for flyer generation');
      }

      if (!input.agent.name.trim() || !input.agent.email.trim() || !input.agent.phone.trim()) {
         throw new Error('Complete agent information (name, email, phone) is required');
      }

      // Execute the AI prompt
      const output = await flyerPrompt(input);

      // Validate output completeness
      if (!output?.headline || !output?.propertyHighlights || !output?.openHouseDetails || !output?.callToAction) {
         throw new Error('The AI failed to generate complete flyer content. Please try again.');
      }

      // Validate headline length
      if (output.headline.length < 10 || output.headline.length > 100) {
         throw new Error('Headline must be between 10 and 100 characters');
      }

      // Validate property highlights
      if (output.propertyHighlights.length < 3 || output.propertyHighlights.length > 8) {
         throw new Error('Property highlights must contain 3-8 items');
      }

      // Validate marketing copy length
      if (output.marketingCopy.length < 100 || output.marketingCopy.length > 500) {
         console.warn('Marketing copy should be between 100-500 characters for optimal flyer design');
      }

      return output;
   }
);

/**
 * Generate professional open house flyer content
 * 
 * Creates AI-powered flyer content including headline, property highlights,
 * event details, and marketing copy. Applies agent branding when provided.
 * 
 * @param input - Session, property, agent, and branding information
 * @returns Flyer content ready for design and printing
 * 
 * @example
 * ```typescript
 * const flyer = await generateOpenHouseFlyer({
 *   session: {
 *     sessionId: 'sess_123',
 *     propertyAddress: '123 Main St',
 *     scheduledDate: '2024-12-15',
 *     scheduledStartTime: '2024-12-15T14:00:00Z',
 *     scheduledEndTime: '2024-12-15T16:00:00Z',
 *   },
 *   property: {
 *     address: '123 Main St',
 *     price: '$500,000',
 *     bedrooms: 4,
 *     bathrooms: 2.5,
 *     squareFeet: 2400,
 *     features: ['Gourmet kitchen', 'Master suite', 'Landscaped yard'],
 *   },
 *   agent: {
 *     name: 'Sarah Smith',
 *     email: 'sarah@realty.com',
 *     phone: '555-1234',
 *     brokerage: 'Premier Realty',
 *   },
 *   branding: {
 *     primaryColor: '#1E40AF',
 *     secondaryColor: '#F59E0B',
 *     tagline: 'Your Trusted Real Estate Partner',
 *   },
 *   options: {
 *     includeQRCode: true,
 *     includePropertyImages: true,
 *     template: 'modern',
 *   },
 *   userId: 'user_789',
 * });
 * ```
 */
export async function generateOpenHouseFlyer(
   input: GenerateOpenHouseFlyerInput
): Promise<GenerateOpenHouseFlyerOutput> {
   return generateOpenHouseFlyerFlow.execute(input);
}

// ============================================================================
// SOCIAL POST GENERATION FLOW
// ============================================================================

const socialPostsPrompt = definePrompt({
   name: 'generateOpenHouseSocialPostsPrompt',
   inputSchema: GenerateOpenHouseSocialPostsInputSchema,
   outputSchema: GenerateOpenHouseSocialPostsOutputSchema,
   options: MODEL_CONFIGS.CREATIVE,
   prompt: `You are an expert social media marketing strategist specializing in real estate. Your task is to create platform-optimized social media posts that drive open house attendance and engagement.

# OPEN HOUSE SESSION
Session ID: {{{session.sessionId}}}
Property Address: {{{session.propertyAddress}}}
Date: {{{session.scheduledDate}}}
Start Time: {{{session.scheduledStartTime}}}
{{#if session.scheduledEndTime}}End Time: {{{session.scheduledEndTime}}}{{/if}}

# PROPERTY DETAILS
Address: {{{property.address}}}
{{#if property.price}}Price: {{{property.price}}}{{/if}}
{{#if property.bedrooms}}Bedrooms: {{{property.bedrooms}}}{{/if}}
{{#if property.bathrooms}}Bathrooms: {{{property.bathrooms}}}{{/if}}
{{#if property.squareFeet}}Square Feet: {{{property.squareFeet}}}{{/if}}
{{#if property.features}}Features: {{{json property.features}}}{{/if}}
{{#if property.description}}Description: {{{property.description}}}{{/if}}
{{#if property.neighborhood}}Neighborhood: {{{property.neighborhood}}}{{/if}}

# AGENT INFORMATION
Name: {{{agent.name}}}
Phone: {{{agent.phone}}}
Email: {{{agent.email}}}
{{#if agent.brokerage}}Brokerage: {{{agent.brokerage}}}{{/if}}

# PLATFORMS TO GENERATE
Platforms: {{{json platforms}}}

---

# YOUR TASK

Create platform-optimized social media posts for each requested platform. Each post must:
1. **Match platform best practices** (character limits, tone, format)
2. **Include appropriate hashtags** for discoverability
3. **Have clear call-to-action** to drive attendance
4. **Be engaging and shareable** to maximize reach
5. **Highlight key property features** that create interest

## PLATFORM-SPECIFIC GUIDELINES

### FACEBOOK
- **Length**: 50-2000 characters (optimal: 100-250)
- **Tone**: Friendly, conversational, community-focused
- **Format**: Paragraph style with emojis
- **Hashtags**: 1-3 relevant hashtags (not overused on Facebook)
- **CTA**: Clear invitation with event details
- **Best Practices**:
  - Ask questions to encourage comments
  - Tag location for local reach
  - Mention community features
  - Use storytelling approach

### INSTAGRAM
- **Length**: 50-2200 characters (optimal: 138-150)
- **Tone**: Visual, aspirational, lifestyle-focused
- **Format**: Short paragraphs with line breaks and emojis
- **Hashtags**: 5-30 hashtags (optimal: 11-20)
- **CTA**: Strong call-to-action in caption
- **Story Text**: Brief overlay text for stories (5-10 words)
- **Best Practices**:
  - Lead with hook in first line
  - Use emojis strategically
  - Mix popular and niche hashtags
  - Create FOMO (fear of missing out)

### LINKEDIN
- **Length**: 100-3000 characters (optimal: 150-300)
- **Tone**: Professional, informative, market-focused
- **Format**: Professional paragraphs, minimal emojis
- **Hashtags**: 3-5 professional hashtags
- **CTA**: Professional invitation
- **Best Practices**:
  - Focus on investment value
  - Mention market trends
  - Professional language
  - Network-building approach

### TWITTER/X
- **Length**: 50-280 characters (must fit in one tweet)
- **Tone**: Concise, punchy, urgent
- **Format**: Single sentence or short phrases
- **Hashtags**: 1-2 hashtags (space is limited)
- **CTA**: Brief and direct
- **Best Practices**:
  - Front-load key information
  - Use abbreviations if needed
  - Create urgency
  - Make every word count

---

# CONTENT REQUIREMENTS

For each requested platform, generate:

1. **Post Content**
   - Platform-appropriate length
   - Engaging opening hook
   - Key property highlights
   - Event details (date, time, address)
   - Clear call-to-action

2. **Hashtags**
   - Mix of popular and niche tags
   - Location-based hashtags
   - Property-type hashtags
   - Real estate industry hashtags
   - Platform-appropriate quantity

3. **Call-to-Action**
   - Clear next step for audience
   - Create urgency
   - Easy to follow
   - Examples:
     - "Join us this Saturday!"
     - "DM for details"
     - "Link in bio for more info"
     - "Save the date!"

4. **Platform-Specific Elements**
   - Instagram: Story text overlay
   - All platforms: Emoji usage
   - All platforms: Tone matching

5. **General Hashtags** (cross-platform)
   - 5-15 hashtags that work across platforms
   - Include:
     - #OpenHouse
     - #RealEstate
     - Location tags (#[City]RealEstate)
     - Property type (#[Type]ForSale)
     - Lifestyle tags (#DreamHome, #HouseHunting)

6. **Image Recommendations** (2-5 suggestions)
   - Which property images to use
   - Suggested image order
   - Image composition tips
   - Examples:
     - "Lead with exterior curb appeal shot"
     - "Showcase gourmet kitchen as second image"
     - "Include lifestyle shot of backyard"

---

# HASHTAG STRATEGY

**Popular Real Estate Hashtags** (high volume):
- #RealEstate #OpenHouse #HouseHunting #DreamHome #HomeSweetHome
- #RealEstateAgent #Realtor #ForSale #JustListed #NewListing

**Niche Hashtags** (targeted):
- Property type: #SingleFamilyHome #Condo #TownHouse #LuxuryHome
- Features: #GourmetKitchen #MasterSuite #BackyardOasis
- Location: #[City]Homes #[Neighborhood]RealEstate #[State]Properties

**Engagement Hashtags**:
- #HomeGoals #InteriorDesign #HomeInspiration #PropertyTour

---

# CRITICAL REQUIREMENTS

✓ **Requirement 16.3**: Generate platform-optimized content for Facebook, Instagram, LinkedIn, and/or Twitter with appropriate hashtags and calls-to-action

---

# OUTPUT FORMAT

Return a JSON object with posts for each requested platform. Ensure:
- Each post matches platform character limits
- Hashtags are relevant and platform-appropriate
- Call-to-action is clear and compelling
- Tone matches platform expectations
- Content is engaging and shareable
- Image recommendations are specific and helpful

Create posts that maximize engagement and drive open house attendance.`,
});

const generateOpenHouseSocialPostsFlow = defineFlow(
   {
      name: 'generateOpenHouseSocialPostsFlow',
      inputSchema: GenerateOpenHouseSocialPostsInputSchema,
      outputSchema: GenerateOpenHouseSocialPostsOutputSchema,
   },
   async (input) => {
      // Validate required fields (Requirement 16.3)
      if (!input.session.propertyAddress.trim()) {
         throw new Error('Property address is required for social post generation');
      }

      if (!input.session.scheduledDate || !input.session.scheduledStartTime) {
         throw new Error('Open house date and time are required for social post generation');
      }

      if (!input.platforms || input.platforms.length === 0) {
         throw new Error('At least one platform must be specified');
      }

      if (!input.agent.name.trim()) {
         throw new Error('Agent name is required for social post generation');
      }

      // Execute the AI prompt
      const output = await socialPostsPrompt(input);

      // Validate that requested platforms have content
      for (const platform of input.platforms) {
         if (!output[platform]) {
            throw new Error(`Failed to generate content for ${platform}. Please try again.`);
         }

         // Validate platform-specific requirements
         if (platform === 'facebook' && output.facebook) {
            if (output.facebook.post.length < 50 || output.facebook.post.length > 2000) {
               console.warn('Facebook post should be between 50-2000 characters');
            }
         }

         if (platform === 'instagram' && output.instagram) {
            if (output.instagram.caption.length < 50 || output.instagram.caption.length > 2200) {
               console.warn('Instagram caption should be between 50-2200 characters');
            }
            if (output.instagram.hashtags.length < 5) {
               console.warn('Instagram posts should have at least 5 hashtags for optimal reach');
            }
         }

         if (platform === 'linkedin' && output.linkedin) {
            if (output.linkedin.post.length < 100 || output.linkedin.post.length > 3000) {
               console.warn('LinkedIn post should be between 100-3000 characters');
            }
         }

         if (platform === 'twitter' && output.twitter) {
            if (output.twitter.tweet.length > 280) {
               throw new Error('Twitter post exceeds 280 character limit');
            }
         }
      }

      // Validate general hashtags
      if (!output.generalHashtags || output.generalHashtags.length < 5) {
         console.warn('At least 5 general hashtags recommended for cross-platform use');
      }

      // Validate image recommendations
      if (!output.imageRecommendations || output.imageRecommendations.length < 2) {
         console.warn('At least 2 image recommendations should be provided');
      }

      return output;
   }
);

/**
 * Generate platform-optimized social media posts for open house
 * 
 * Creates AI-powered social media content tailored to each platform's
 * best practices, character limits, and audience expectations.
 * 
 * @param input - Session, property, agent info, and target platforms
 * @returns Platform-specific posts with hashtags and CTAs
 * 
 * @example
 * ```typescript
 * const posts = await generateOpenHouseSocialPosts({
 *   session: {
 *     sessionId: 'sess_123',
 *     propertyAddress: '123 Main St',
 *     scheduledDate: '2024-12-15',
 *     scheduledStartTime: '2024-12-15T14:00:00Z',
 *   },
 *   property: {
 *     address: '123 Main St',
 *     price: '$500,000',
 *     bedrooms: 4,
 *     bathrooms: 2.5,
 *     features: ['Gourmet kitchen', 'Master suite'],
 *     neighborhood: 'Downtown',
 *   },
 *   agent: {
 *     name: 'Sarah Smith',
 *     email: 'sarah@realty.com',
 *     phone: '555-1234',
 *   },
 *   platforms: ['facebook', 'instagram', 'linkedin'],
 *   userId: 'user_789',
 * });
 * ```
 */
export async function generateOpenHouseSocialPosts(
   input: GenerateOpenHouseSocialPostsInput
): Promise<GenerateOpenHouseSocialPostsOutput> {
   return generateOpenHouseSocialPostsFlow.execute(input);
}

// ============================================================================
// EMAIL INVITATION GENERATION FLOW
// ============================================================================

const emailInvitePrompt = definePrompt({
   name: 'generateOpenHouseEmailInvitePrompt',
   inputSchema: GenerateOpenHouseEmailInviteInputSchema,
   outputSchema: GenerateOpenHouseEmailInviteOutputSchema,
   options: MODEL_CONFIGS.BALANCED,
   prompt: `You are an expert email marketing specialist for real estate. Your task is to create compelling, personalized email invitations that drive open house attendance and build relationships.

# OPEN HOUSE SESSION
Session ID: {{{session.sessionId}}}
Property Address: {{{session.propertyAddress}}}
Date: {{{session.scheduledDate}}}
Start Time: {{{session.scheduledStartTime}}}
{{#if session.scheduledEndTime}}End Time: {{{session.scheduledEndTime}}}{{/if}}

# PROPERTY DETAILS
Address: {{{property.address}}}
{{#if property.price}}Price: {{{property.price}}}{{/if}}
{{#if property.bedrooms}}Bedrooms: {{{property.bedrooms}}}{{/if}}
{{#if property.bathrooms}}Bathrooms: {{{property.bathrooms}}}{{/if}}
{{#if property.squareFeet}}Square Feet: {{{property.squareFeet}}}{{/if}}
{{#if property.features}}Features: {{{json property.features}}}{{/if}}
{{#if property.description}}Description: {{{property.description}}}{{/if}}

# AGENT INFORMATION
Name: {{{agent.name}}}
Phone: {{{agent.phone}}}
Email: {{{agent.email}}}
{{#if agent.brokerage}}Brokerage: {{{agent.brokerage}}}{{/if}}

# EMAIL OPTIONS
Include Calendar Attachment: {{{options.includeCalendarAttachment}}}
Include RSVP Link: {{{options.includeRSVPLink}}}
Recipient Type: {{{options.recipientType}}}
{{#if options.personalMessage}}Personal Message: {{{options.personalMessage}}}{{/if}}

---

# YOUR TASK

Create a professional, engaging email invitation that:
1. **Captures attention** with compelling subject line
2. **Builds interest** with property highlights
3. **Provides clear details** about the open house event
4. **Includes strong CTA** to encourage attendance or RSVP
5. **Maintains professional tone** appropriate for recipient type
6. **Facilitates easy attendance** with calendar attachment details

## RECIPIENT TYPE GUIDELINES

### GENERAL (broad audience)
- Professional but warm tone
- Focus on property features and value
- Educational about the property and area
- Welcoming and inclusive language

### PAST CLIENT (previous customers)
- Friendly, familiar tone
- Reference past relationship
- Emphasize staying in touch
- Mention referral opportunities
- More personal and conversational

### SPHERE OF INFLUENCE (network, friends, family)
- Warm, personal tone
- Ask for help spreading the word
- Mention referral opportunities
- More casual and friendly
- Emphasize relationship

---

# EMAIL BEST PRACTICES

**Subject Line**:
- 20-100 characters
- Create curiosity or urgency
- Include property address or key feature
- Personalize when possible
- Examples:
  - "You're Invited: Open House at 123 Main St This Saturday"
  - "Don't Miss This Stunning 4BR Home - Open House Dec 15th"
  - "Join Me for an Exclusive Open House Preview"

**Preheader Text**:
- 20-150 characters
- Complements subject line
- Provides additional context
- Visible in email preview
- Examples:
  - "Saturday, 2-4 PM | Refreshments served | RSVP for priority access"
  - "Beautiful property in [Neighborhood] - Perfect for your clients"

**Email Structure**:
1. Personalized greeting
2. Introduction paragraph (why they're receiving this)
3. Property highlights (3-8 bullet points)
4. Event details (date, time, address, parking)
5. Body content (property description and invitation)
6. Clear call-to-action
7. Closing message
8. Professional signature

**Formatting**:
- Short paragraphs (2-3 sentences)
- Bullet points for features
- Bold for important details
- White space for readability
- Mobile-friendly layout

---

# CONTENT REQUIREMENTS

1. **Subject Line** (20-100 characters)
   - Compelling and clear
   - Include property address or key feature
   - Create urgency or curiosity

2. **Preheader Text** (20-150 characters)
   - Complements subject line
   - Provides additional context
   - Encourages email open

3. **Greeting** (10-100 characters)
   - Personalized when possible
   - Warm and professional
   - Examples:
     - "Hello [Name],"
     - "Dear Friends and Colleagues,"
     - "Hi there,"

4. **Introduction** (100-500 words)
   - Explain why they're receiving email
   - Build excitement about property
   - Set context for invitation
   - Match tone to recipient type

5. **Property Highlights** (3-8 bullet points)
   - Most compelling features
   - Specific and descriptive
   - Benefits-focused
   - Easy to scan

6. **Event Details**
   - Formatted date (e.g., "Saturday, December 15th")
   - Formatted time (e.g., "2:00 PM - 4:00 PM")
   - Full property address
   - Parking information (if relevant)

7. **Body Content** (200-1000 words)
   - Detailed property description
   - Neighborhood highlights
   - Lifestyle benefits
   - Invitation to attend
   - Professional yet warm tone

8. **Call-to-Action** (10-100 characters)
   - Clear next step
   - Create urgency
   - Easy to execute
   - Examples:
     - "RSVP Today to Reserve Your Spot"
     - "Add to Your Calendar Now"
     - "I Look Forward to Seeing You There"

9. **Closing Message** (50-200 words)
   - Thank recipient
   - Offer to answer questions
   - Provide contact information
   - Professional sign-off

10. **Signature**
    - Agent name
    - Title (if applicable)
    - Phone number
    - Email address
    - Brokerage name (if applicable)

11. **Calendar Event Details**
    - Event title (e.g., "Open House: 123 Main St")
    - Description (property details and agent contact)
    - Location (full property address)
    - Start time (ISO 8601 format)
    - End time (ISO 8601 format)

12. **RSVP Message** (optional)
    - Encourage RSVP for planning
    - Mention benefits (priority access, refreshments)
    - Make RSVP easy

13. **Additional Notes** (optional, 0-5 items)
    - Parking instructions
    - What to bring
    - Refreshments information
    - COVID protocols (if applicable)
    - Other helpful details

---

# CRITICAL REQUIREMENTS

✓ **Requirement 16.4**: Generate email invitation with calendar attachment details and RSVP tracking capability

---

# OUTPUT FORMAT

Return a JSON object with all required fields. Ensure:
- Subject line is compelling and 20-100 characters
- Preheader text complements subject (20-150 characters)
- Introduction is engaging and 100-500 words
- Property highlights are specific (3-8 items)
- Body content is professional and 200-1000 words
- Call-to-action is clear and compelling
- Closing message is warm and professional (50-200 words)
- Calendar event details are complete and properly formatted
- All content matches recipient type tone

Create an email that drives attendance and strengthens the agent-client relationship.`,
});

const generateOpenHouseEmailInviteFlow = defineFlow(
   {
      name: 'generateOpenHouseEmailInviteFlow',
      inputSchema: GenerateOpenHouseEmailInviteInputSchema,
      outputSchema: GenerateOpenHouseEmailInviteOutputSchema,
   },
   async (input) => {
      // Validate required fields (Requirement 16.4)
      if (!input.session.propertyAddress.trim()) {
         throw new Error('Property address is required for email invitation generation');
      }

      if (!input.session.scheduledDate || !input.session.scheduledStartTime) {
         throw new Error('Open house date and time are required for email invitation generation');
      }

      if (!input.agent.name.trim() || !input.agent.email.trim() || !input.agent.phone.trim()) {
         throw new Error('Complete agent information (name, email, phone) is required');
      }

      // Execute the AI prompt
      const output = await emailInvitePrompt(input);

      // Validate output completeness
      if (!output?.subject || !output?.bodyContent || !output?.callToAction || !output?.calendarEvent) {
         throw new Error('The AI failed to generate complete email invitation. Please try again.');
      }

      // Validate subject line length
      if (output.subject.length < 20 || output.subject.length > 100) {
         console.warn('Email subject should be between 20-100 characters for optimal open rates');
      }

      // Validate preheader length
      if (output.preheader && (output.preheader.length < 20 || output.preheader.length > 150)) {
         console.warn('Preheader text should be between 20-150 characters');
      }

      // Validate introduction length
      if (output.introduction.length < 100 || output.introduction.length > 500) {
         console.warn('Introduction should be between 100-500 words for optimal engagement');
      }

      // Validate property highlights
      if (output.propertyHighlights.length < 3 || output.propertyHighlights.length > 8) {
         throw new Error('Property highlights must contain 3-8 items');
      }

      // Validate body content length
      if (output.bodyContent.length < 200 || output.bodyContent.length > 1000) {
         console.warn('Body content should be between 200-1000 words for optimal readability');
      }

      // Validate closing message length
      if (output.closingMessage.length < 50 || output.closingMessage.length > 200) {
         console.warn('Closing message should be between 50-200 words');
      }

      // Validate calendar event details (Requirement 16.4)
      if (!output.calendarEvent.title || !output.calendarEvent.description || !output.calendarEvent.location) {
         throw new Error('Calendar event must include title, description, and location');
      }

      if (!output.calendarEvent.startTime || !output.calendarEvent.endTime) {
         throw new Error('Calendar event must include start and end times');
      }

      // Validate event details
      if (!output.eventDetails.date || !output.eventDetails.time || !output.eventDetails.address) {
         throw new Error('Event details must include date, time, and address');
      }

      return output;
   }
);

/**
 * Generate personalized email invitation for open house
 * 
 * Creates AI-powered email invitation with complete event details,
 * property highlights, and calendar attachment information. Tone
 * is adjusted based on recipient type (general, past client, sphere).
 * 
 * @param input - Session, property, agent info, and email options
 * @returns Complete email invitation with calendar details
 * 
 * @example
 * ```typescript
 * const invitation = await generateOpenHouseEmailInvite({
 *   session: {
 *     sessionId: 'sess_123',
 *     propertyAddress: '123 Main St',
 *     scheduledDate: '2024-12-15',
 *     scheduledStartTime: '2024-12-15T14:00:00Z',
 *     scheduledEndTime: '2024-12-15T16:00:00Z',
 *   },
 *   property: {
 *     address: '123 Main St',
 *     price: '$500,000',
 *     bedrooms: 4,
 *     bathrooms: 2.5,
 *     squareFeet: 2400,
 *     features: ['Gourmet kitchen', 'Master suite', 'Landscaped yard'],
 *     description: 'Beautiful colonial in prime location',
 *   },
 *   agent: {
 *     name: 'Sarah Smith',
 *     email: 'sarah@realty.com',
 *     phone: '555-1234',
 *     brokerage: 'Premier Realty',
 *   },
 *   options: {
 *     includeCalendarAttachment: true,
 *     includeRSVPLink: true,
 *     recipientType: 'general',
 *     personalMessage: 'I think you\'ll love this property!',
 *   },
 *   userId: 'user_789',
 * });
 * ```
 */
export async function generateOpenHouseEmailInvite(
   input: GenerateOpenHouseEmailInviteInput
): Promise<GenerateOpenHouseEmailInviteOutput> {
   return generateOpenHouseEmailInviteFlow.execute(input);
}

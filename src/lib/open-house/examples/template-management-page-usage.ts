/**
 * Template Management Page Usage Examples
 * 
 * This file demonstrates how to use the template management page
 * and its components.
 */

import type { SessionTemplate } from '@/lib/open-house/types';

/**
 * Example 1: Template Management Page Structure
 * 
 * The page is located at /open-house/templates and consists of:
 * - Server component that fetches templates
 * - Client component that handles interactions
 * - Template list with cards
 * - Template form for create/edit
 */

// Server Component (page.tsx)
async function TemplatesPageExample() {
    // Fetches all templates for the current user
    const { templates, error } = await listSessionTemplates();

    // Displays:
    // - Page header with title and description
    // - Error message if fetch failed
    // - Empty state if no templates
    // - TemplatesContent component with templates
}

/**
 * Example 2: Creating a New Template
 * 
 * User flow:
 * 1. Click "Create Template" button
 * 2. Fill in form fields
 * 3. Submit form
 * 4. Template saved and page refreshes
 */

const newTemplateData = {
    name: 'Luxury Home Open House',
    description: 'For high-end properties over $1M',
    propertyType: 'Single Family',
    typicalDuration: 180, // 3 hours
};

// Form submission calls:
// await createSessionTemplate(newTemplateData);

/**
 * Example 3: Editing an Existing Template
 * 
 * User flow:
 * 1. Click edit icon on template card
 * 2. Form opens with pre-filled data
 * 3. Modify fields
 * 4. Submit form
 * 5. Template updated and page refreshes
 */

const templateUpdates = {
    name: 'Premium Home Open House',
    description: 'Updated description',
    typicalDuration: 240, // 4 hours
};

// Form submission calls:
// await updateSessionTemplate(templateId, templateUpdates);

/**
 * Example 4: Deleting a Template
 * 
 * User flow:
 * 1. Click delete icon on template card
 * 2. Confirmation dialog appears
 * 3. User confirms deletion
 * 4. Template deleted and page refreshes
 */

// Confirmation dialog shows:
// "Are you sure you want to delete this template?"
// "Sessions created from this template will not be affected."

// On confirmation:
// await deleteSessionTemplate(templateId);

/**
 * Example 5: Using a Template
 * 
 * User flow:
 * 1. Click "Use Template" button on template card
 * 2. Redirected to /open-house/sessions?templateId=<id>
 * 3. Session form opens with template data pre-populated
 * 4. User completes remaining fields
 * 5. Session created with template reference
 */

// Navigation:
// router.push(`/open-house/sessions?templateId=${template.templateId}`);

// Session form detects templateId and pre-populates:
// - Property type
// - Duration (calculates end time)
// - Custom fields

/**
 * Example 6: Template Card Display
 * 
 * Each template card shows:
 * - Template name and description
 * - Property type badge
 * - Duration badge
 * - Usage statistics
 * - Action buttons
 */

const exampleTemplate: SessionTemplate = {
    templateId: 'template-123',
    userId: 'user-456',
    name: 'Luxury Home Open House',
    description: 'For high-end properties over $1M',
    propertyType: 'Single Family',
    typicalDuration: 180,
    customFields: {},
    usageCount: 12,
    averageVisitors: 15.5,
    averageInterestLevel: 2.7,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
};

// Card displays:
// - Name: "Luxury Home Open House"
// - Description: "For high-end properties over $1M"
// - Badges: [Single Family] [⏰ 180 min]
// - Stats:
//   - 12 Times Used
//   - 👥 15.5 Avg Visitors
//   - 📈 2.7 Avg Interest
// - Buttons: [Edit] [Delete] [Use Template]

/**
 * Example 7: Empty State
 * 
 * When no templates exist, displays:
 * - File icon
 * - Message: "No templates yet. Create your first template to streamline session creation."
 */

const emptyTemplates: SessionTemplate[] = [];

// Shows empty state with:
// - FileText icon (centered)
// - Helpful message
// - Encourages creating first template

/**
 * Example 8: Template Usage Statistics
 * 
 * Templates track three key metrics:
 * 1. Usage count - incremented when session created
 * 2. Average visitors - updated when session ends
 * 3. Average interest level - updated when session ends
 */

// When session is created with template:
// await incrementTemplateUsage(templateId);

// When session ends:
// await updateTemplateMetrics(templateId);
// Recalculates:
// - averageVisitors = sum(visitors) / usageCount
// - averageInterestLevel = sum(interestLevels) / usageCount

/**
 * Example 9: Responsive Layout
 * 
 * Template cards adapt to screen size:
 * - Mobile (< 768px): 1 column
 * - Tablet (768px - 1024px): 2 columns
 * - Desktop (> 1024px): 3 columns
 */

// CSS classes:
// "grid gap-4 md:grid-cols-2 lg:grid-cols-3"

/**
 * Example 10: Integration with Session Creation
 * 
 * Complete flow from template to session:
 */

async function completeTemplateToSessionFlow() {
    // 1. User views templates page
    const { templates } = await listSessionTemplates();

    // 2. User clicks "Use Template" on a template
    const selectedTemplate = templates[0];

    // 3. Navigate to sessions page with template ID
    // router.push(`/open-house/sessions?templateId=${selectedTemplate.templateId}`);

    // 4. Session form loads template data
    const template = await getSessionTemplate(selectedTemplate.templateId);

    // 5. Form pre-populates with template values
    const formData = {
        propertyAddress: '', // User fills this
        scheduledDate: '', // User fills this
        scheduledStartTime: '', // User fills this
        scheduledEndTime: '', // Calculated from typicalDuration
        propertyType: template.propertyType,
        templateId: template.templateId,
    };

    // 6. User completes form and creates session
    // await createOpenHouseSession(formData);

    // 7. Template usage count increments automatically
    // (handled in createOpenHouseSession action)
}

/**
 * Example 11: Error Handling
 * 
 * The page handles various error scenarios:
 */

// Fetch error
const fetchError = {
    success: false,
    error: 'Failed to load templates',
};
// Displays error card with message

// Validation error
const validationError = {
    success: false,
    error: 'Validation failed',
    errors: {
        name: ['Template name is required'],
        typicalDuration: ['Duration must be greater than 0'],
    },
};
// Displays inline error messages on form fields

// Delete error
const deleteError = {
    success: false,
    error: 'Cannot delete template while sessions are in progress',
};
// Shows alert with error message

/**
 * Example 12: Accessibility Features
 * 
 * The page includes:
 * - Proper ARIA labels
 * - Keyboard navigation
 * - Focus management
 * - Screen reader support
 */

// Button labels:
// <Button title="Edit template">
// <Button title="Delete template">

// Form labels:
// <Label htmlFor="name">Template Name *</Label>

// Dialog focus management:
// - Focus moves to dialog when opened
// - Focus returns to trigger when closed
// - Escape key closes dialog

export {
    newTemplateData,
    templateUpdates,
    exampleTemplate,
    emptyTemplates,
};

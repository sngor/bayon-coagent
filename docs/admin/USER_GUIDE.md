# Admin Platform User Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Analytics Dashboard](#analytics-dashboard)
4. [User Management](#user-management)
5. [Content Moderation](#content-moderation)
6. [Support Tickets](#support-tickets)
7. [System Health](#system-health)
8. [Platform Configuration](#platform-configuration)
9. [Billing Management](#billing-management)
10. [Bulk Operations](#bulk-operations)
11. [Audit Logs](#audit-logs)
12. [Engagement Reports](#engagement-reports)
13. [API Integrations](#api-integrations)
14. [Announcements](#announcements)
15. [User Feedback](#user-feedback)
16. [Maintenance Mode](#maintenance-mode)
17. [Common Workflows](#common-workflows)
18. [Troubleshooting](#troubleshooting)
19. [Keyboard Shortcuts](#keyboard-shortcuts)

---

## Introduction

Welcome to the Bayon Coagent Admin Platform! This comprehensive management system provides Admins and SuperAdmins with powerful tools to monitor, manage, and optimize the platform.

### User Roles

- **Admin**: Access to analytics, user support, content moderation, and basic platform management
- **SuperAdmin**: Full system access including billing, configuration, audit logs, and advanced features

### Accessing the Admin Platform

1. Sign in to your Bayon Coagent account
2. Look for the "Admin Hub" option in the main navigation (visible only to Admin/SuperAdmin users)
3. Click to access the admin dashboard

### Related Documentation

- For API integration details, see [API Reference](./API_REFERENCE.md)
- For technical implementation, see [Developer Guide](./DEVELOPER_GUIDE.md)
- For testing procedures, see [Testing Guide](./TESTING_GUIDE.md)

### See Also

- [Platform Configuration](#platform-configuration) - Feature flags and settings
- [System Health Monitoring](#system-health) - Health dashboard and alerts
- [Billing Management](#billing-management) - Revenue and subscriptions

---

## Getting Started

### Admin Dashboard Overview

The main admin dashboard (`/admin`) provides a quick overview of:

- **Key Metrics**: Active users, total content, open tickets, system health
- **Quick Actions**: Common tasks like creating announcements, viewing tickets
- **Recent Activity**: Latest admin actions and user events
- **Active Alerts**: System warnings and notifications

### Navigation

The admin platform is organized into sections accessible via tabs:

- **Analytics**: Platform usage metrics and insights
- **Users**: User activity tracking and management
- **Content**: Content moderation queue
- **Support**: Support ticket management
- **System**: Health monitoring and maintenance
- **Config**: Feature flags and platform settings
- **Billing**: Revenue and subscription management (SuperAdmin only)
- **Audit**: Comprehensive action logs (SuperAdmin only)
- **Reports**: Engagement and analytics reports
- **Integrations**: API keys and third-party integrations (SuperAdmin only)
- **Announcements**: User communication tools
- **Feedback**: User feedback management

---

## Analytics Dashboard

**Path**: `/admin/analytics`  
**Access**: Admin, SuperAdmin

### Overview

The analytics dashboard provides real-time insights into platform usage, user engagement, and feature adoption.

### Key Metrics

1. **Active Users**

   - Current active users (online now)
   - Daily Active Users (DAU)
   - Weekly Active Users (WAU)
   - Monthly Active Users (MAU)

2. **User Growth**

   - Total registered users
   - New signups (last 24 hours)
   - Signup trends over time

3. **Feature Usage**

   - Most popular hubs and tools
   - Feature adoption rates
   - Usage trends by feature

4. **Engagement Metrics**
   - Average session duration
   - Content created per user
   - AI requests and token usage

### Using the Dashboard

#### Viewing Analytics

1. Navigate to `/admin/analytics`
2. The dashboard loads with default date range (last 30 days)
3. Scroll to view different metric categories

#### Filtering by Date Range

1. Click the date range selector at the top
2. Choose from presets:
   - Last 7 days
   - Last 30 days
   - Last 90 days
   - Custom range
3. For custom range, select start and end dates
4. Click "Apply" to update all metrics

#### Interpreting Charts

- **Line Charts**: Show trends over time (hover for exact values)
- **Bar Charts**: Compare feature usage or categories
- **Pie Charts**: Show distribution (e.g., content types)
- **Number Cards**: Display key metrics with change indicators

### Common Tasks

**Task: Identify Most Popular Features**

1. Scroll to "Feature Usage" section
2. Review the bar chart showing usage by hub
3. Click on a bar to see detailed breakdown
4. Use this data to prioritize development

**Task: Monitor User Growth**

1. View "New Signups" metric
2. Check the trend line for growth patterns
3. Compare to previous periods
4. Identify spikes or drops for investigation

---

## User Management

**Path**: `/admin/users`  
**Access**: Admin, SuperAdmin

### User Activity Tracking

**Path**: `/admin/users/activity`

#### Overview

Track detailed user activity including logins, feature usage, content creation, and AI consumption.

#### Activity Levels

Users are automatically categorized:

- **Active**: Logged in within last 7 days (green badge)
- **Inactive**: Logged in 7-30 days ago (yellow badge)
- **Dormant**: No login for 30+ days (red badge)

#### Viewing User Activity

1. Navigate to `/admin/users/activity`
2. View the sortable table of all users
3. Click column headers to sort:
   - Last Login
   - Total Sessions
   - Content Created
   - AI Usage

#### Filtering Users

1. Use the activity level filter dropdown
2. Select: All, Active, Inactive, or Dormant
3. Table updates automatically

#### Viewing User Details

1. Click on any user row
2. Modal opens with detailed timeline
3. View all actions, content created, features used
4. See AI usage statistics (requests, tokens, cost)

> **See Also**: For API details on user activity tracking, see [API Reference - User Activity API](./API_REFERENCE.md#user-activity-api)

#### Exporting User Data

1. Select users using checkboxes (or "Select All")
2. Click "Export" button
3. Choose fields to include
4. CSV file downloads automatically

### Common Tasks

**Task: Identify Power Users**

1. Sort by "Total Sessions" (descending)
2. Review top users
3. Consider featuring their success stories

**Task: Re-engage Dormant Users**

1. Filter by "Dormant" activity level
2. Select users for bulk email
3. Send re-engagement campaign

---

## Content Moderation

**Path**: `/admin/content/moderation`  
**Access**: Admin, SuperAdmin

### Overview

Review and moderate user-generated content to ensure quality and compliance with platform guidelines.

### Content Queue

The moderation queue displays all user content sorted by creation date (newest first).

#### Content Types

- Blog posts
- Social media posts
- Property descriptions
- AI-generated images

#### Content Status

- **Pending**: Awaiting review (default for new content)
- **Approved**: Reviewed and approved
- **Flagged**: Marked for attention
- **Hidden**: Removed from user's library

### Moderating Content

#### Reviewing Content

1. Navigate to `/admin/content/moderation`
2. Browse the content queue
3. Click on any item to view full details
4. Review content, user information, and metadata

#### Taking Action

**Approve Content**

1. Click "Approve" button
2. Content status changes to "Approved"
3. No notification sent to user

**Flag Content**

1. Click "Flag" button
2. Enter reason for flagging
3. User receives email notification
4. Content remains visible but marked

**Hide Content**

1. Click "Hide" button
2. Enter reason for hiding
3. User receives email notification
4. Content removed from user's library (data preserved)

#### Filtering Content

1. Use filter dropdowns:
   - Status (Pending, Approved, Flagged, Hidden)
   - Content Type
   - Date Range
2. Use search to find specific users or content
3. Filters combine for precise results

#### Bulk Moderation

1. Select multiple items using checkboxes
2. Click "Bulk Actions" dropdown
3. Choose action (Approve, Flag, Hide)
4. Confirm action
5. View results summary

> **See Also**: For bulk operations across other features, see [Bulk Operations](./USER_GUIDE.md#bulk-operations)

### Common Tasks

**Task: Review New Content Daily**

1. Filter by "Pending" status
2. Review items from newest to oldest
3. Approve quality content quickly
4. Flag or hide problematic content

**Task: Follow Up on Flagged Content**

1. Filter by "Flagged" status
2. Review flagged items
3. Decide to approve or hide
4. Contact user if needed

---

## Support Tickets

**Path**: `/admin/support`  
**Access**: Admin, SuperAdmin

### Overview

Manage user support tickets, respond to inquiries, and track issue resolution.

### Ticket Dashboard

The support dashboard shows all tickets with:

- Ticket count by status
- Priority indicators
- Assignment status
- Recent activity

### Ticket Properties

#### Status

- **Open**: New ticket, not yet addressed
- **In Progress**: Admin is working on it
- **Waiting User**: Awaiting user response
- **Resolved**: Issue resolved, awaiting closure
- **Closed**: Ticket closed with resolution

#### Priority

- **Low**: General questions, minor issues
- **Medium**: Standard support requests
- **High**: Important issues affecting user experience
- **Urgent**: Critical issues requiring immediate attention

#### Category

- Bug report
- Feature request
- Help/How-to
- Billing
- Other

### Managing Tickets

#### Viewing Tickets

1. Navigate to `/admin/support`
2. View ticket list sorted by priority and date
3. Use filters to find specific tickets:
   - Status
   - Priority
   - Assigned Admin
   - Date Range

#### Responding to Tickets

1. Click on a ticket to open details
2. Review ticket information and conversation history
3. Type your response in the message box
4. Click "Send Response"
5. User receives email notification automatically
6. Ticket status updates to "In Progress"

#### Assigning Tickets

1. Open ticket details
2. Click "Assign" dropdown
3. Select admin user
4. Ticket assigned and admin notified

#### Updating Status

1. Open ticket details
2. Click "Update Status" dropdown
3. Select new status
4. Add notes if needed
5. Status updates immediately

#### Closing Tickets

1. Open ticket details
2. Click "Close Ticket" button
3. **Required**: Enter resolution note
4. Click "Confirm"
5. Ticket archived and user notified

### Common Tasks

**Task: Respond to New Tickets**

1. Filter by "Open" status
2. Sort by priority (Urgent first)
3. Review and respond to each ticket
4. Assign to appropriate admin if needed

**Task: Follow Up on Waiting Tickets**

1. Filter by "Waiting User" status
2. Check if user has responded
3. Send reminder if no response after 3 days
4. Close if no response after 7 days

---

## System Health

**Path**: `/admin/system/health`  
**Access**: SuperAdmin only

### Overview

Monitor real-time system health, performance metrics, and error logs to proactively identify and resolve issues.

> **Note**: For technical implementation details, see [Developer Guide - Performance Optimization](./DEVELOPER_GUIDE.md#performance-optimization).

### Health Dashboard

#### API Metrics

- Average response time (ms)
- Error rate (%)
- Requests per minute
- Slowest endpoints

#### AWS Services Status

- **DynamoDB**: Read/write capacity, throttled requests
- **Bedrock**: Requests per minute, tokens, cost per hour
- **S3**: Storage used, requests per minute

#### Active Alerts

- Critical: Immediate attention required (red)
- Warning: Monitor closely (yellow)
- Info: Informational only (blue)

### Monitoring System Health

#### Viewing Metrics

1. Navigate to `/admin/system/health`
2. Dashboard loads with real-time data
3. Metrics auto-refresh every 30 seconds
4. Click "Refresh" for immediate update

#### Reviewing Error Logs

1. Scroll to "Error Logs" section
2. Errors grouped by type
3. Click on error group to expand
4. View:
   - Error message
   - Stack trace
   - Affected users
   - Timestamp
   - Frequency

#### Filtering Errors

1. Use date range selector
2. Filter by error type
3. Search for specific errors
4. Export logs for analysis

#### Alert Management

**Viewing Alerts**

1. Active alerts displayed at top of dashboard
2. Severity indicated by color
3. Click alert for details

**Email Alerts**

- SuperAdmins receive email when:
  - Error rate exceeds 5%
  - Response time exceeds 2 seconds
  - AWS service issues detected
  - Critical system errors occur

**Alert Preferences**

1. Navigate to `/admin/system/alerts`
2. Configure alert thresholds
3. Set email preferences
4. Choose alert digest frequency

### Common Tasks

**Task: Investigate High Error Rate**

1. Check error rate metric
2. Review error logs for patterns
3. Identify affected endpoints
4. Check AWS service status
5. Escalate to development team if needed

**Task: Monitor AI Costs**

1. View Bedrock metrics
2. Check tokens per minute
3. Review cost per hour
4. Compare to budget
5. Adjust usage if needed

---

## Platform Configuration

**Path**: `/admin/config`  
**Access**: SuperAdmin only

### Feature Flags

**Path**: `/admin/config/features`

#### Overview

Control feature availability across the platform with granular rollout options.

> **Note**: For technical implementation of feature flags, see [Developer Guide - Feature Flags](./DEVELOPER_GUIDE.md#feature-flags).

#### Managing Feature Flags

**Viewing Flags**

1. Navigate to `/admin/config/features`
2. View all feature flags with status
3. See rollout percentage and targeting

**Enabling/Disabling Features**

1. Find the feature flag
2. Toggle the switch
3. Confirm action
4. Feature updates immediately

**Gradual Rollout**

1. Click "Edit" on feature flag
2. Set rollout percentage (0-100%)
3. Approximately that % of users will see feature
4. Monitor metrics and adjust

**Targeted Rollout**

1. Click "Edit" on feature flag
2. Choose targeting option:
   - All users
   - Specific roles (Admin, SuperAdmin)
   - Specific users (enter user IDs)
3. Save changes
4. Only targeted users see feature

#### Best Practices

- Start with 10% rollout for new features
- Monitor metrics and error rates
- Increase gradually: 10% → 25% → 50% → 100%
- Keep feature flags for easy rollback
- Remove flags after full rollout (30 days)

### Platform Settings

**Path**: `/admin/config/settings`

#### Settings Categories

- **General**: Platform name, description, contact info
- **AI**: Model selection, token limits, cost controls
- **Billing**: Pricing, trial duration, payment settings
- **Email**: SMTP configuration, templates, sender info
- **Security**: Session timeout, password requirements, 2FA

#### Updating Settings

1. Navigate to `/admin/config/settings`
2. Select category
3. Click "Edit" on setting
4. Enter new value
5. System validates input
6. Confirm changes
7. Setting updates immediately

### Common Tasks

**Task: Enable Beta Feature for Testing**

1. Go to Feature Flags
2. Find beta feature
3. Set rollout to 0%
4. Add your user ID to target users
5. Test feature
6. Gradually increase rollout

**Task: Adjust AI Token Limits**

1. Go to Platform Settings
2. Select "AI" category
3. Edit "Max Tokens Per Request"
4. Enter new limit
5. Save changes
6. Monitor usage and costs

---

## Billing Management

**Path**: `/admin/billing`  
**Access**: SuperAdmin only

### Overview

Track revenue, manage subscriptions, handle payment failures, and grant trial extensions.

> **Note**: For billing API integration, see [API Reference - Billing API](./API_REFERENCE.md#billing-api).

### Billing Dashboard

#### Key Metrics

- Total revenue (monthly, yearly)
- Active subscriptions
- Payment failures
- Churn rate
- Average revenue per user (ARPU)

### Managing Subscriptions

#### Viewing User Billing

1. Navigate to `/admin/billing`
2. Use search to find user by email or name
3. View:
   - Subscription status
   - Plan type
   - Payment history
   - Next billing date
   - Lifetime value

#### Handling Payment Failures

**Viewing Failures**

1. Scroll to "Payment Failures" section
2. View list of failed payments
3. See failure reason and date

**Retry Payment**

1. Click "Retry" on failed payment
2. System attempts to charge card again
3. User notified of result

**Cancel Subscription**

1. Click "Cancel" on failed payment
2. Confirm cancellation
3. User notified
4. Access continues until period end

#### Granting Trial Extensions

1. Search for user
2. Click "Extend Trial"
3. Enter number of days
4. Add reason (required for audit)
5. Confirm extension
6. User notified via email

#### Exporting Billing Data

1. Click "Export" button
2. Select date range
3. Choose format (CSV or PDF)
4. File downloads with:
   - All transactions
   - Revenue summary
   - Subscription changes
   - Refunds and credits

### Common Tasks

**Task: Review Monthly Revenue**

1. View billing dashboard
2. Check total revenue metric
3. Compare to previous month
4. Review subscription trends
5. Identify growth opportunities

**Task: Handle Payment Failure**

1. Review payment failure list
2. Check failure reason
3. Retry payment if temporary issue
4. Contact user if card expired
5. Cancel if multiple failures

---

## Bulk Operations

**Path**: `/admin/users`  
**Access**: Admin, SuperAdmin

### Overview

Perform actions on multiple users simultaneously for efficient management.

### Available Operations

- Send bulk email
- Export user data
- Update user settings
- Change user roles (SuperAdmin only)

### Performing Bulk Operations

#### Selecting Users

1. Navigate to `/admin/users`
2. Use checkboxes to select users
3. Or click "Select All" for all visible users
4. Selected count displays at top

#### Sending Bulk Email

1. Select users
2. Click "Bulk Actions" → "Send Email"
3. Choose template or compose custom
4. Preview email
5. Click "Send"
6. View results summary (sent/failed)

#### Exporting User Data

1. Select users
2. Click "Bulk Actions" → "Export Data"
3. Choose fields to include:
   - Basic info (name, email)
   - Activity metrics
   - Content statistics
   - AI usage
4. Click "Export"
5. CSV file downloads

#### Bulk Role Changes (SuperAdmin Only)

1. Select users
2. Click "Bulk Actions" → "Change Role"
3. Select new role
4. Review affected users
5. Confirm changes
6. View results summary

### Best Practices

- Test bulk emails with small group first
- Review selection before bulk actions
- Use filters to target specific user segments
- Export data before making bulk changes
- Monitor results and handle failures

---

## Audit Logs

**Path**: `/admin/audit`  
**Access**: SuperAdmin only

### Overview

Comprehensive logging of all administrative actions for security, compliance, and troubleshooting.

> **Note**: For technical details on audit logging implementation, see [Developer Guide - Database Schema](./DEVELOPER_GUIDE.md#database-schema).

### Audit Log Entries

Each entry includes:

- Timestamp
- Acting admin (name and ID)
- Action type
- Affected resource
- Before/after values
- IP address
- User agent

### Viewing Audit Logs

1. Navigate to `/admin/audit`
2. View chronological list of all actions
3. Most recent actions appear first

### Filtering Logs

**By Action Type**

- User management
- Content moderation
- Configuration changes
- Billing operations
- Feature flag updates
- Support ticket actions

**By Admin User**

- Select admin from dropdown
- View all actions by that admin

**By Date Range**

- Select start and end dates
- View actions in that period

**By Resource**

- Search for specific user, content, or ticket
- View all actions affecting that resource

### Exporting Audit Logs

1. Apply desired filters
2. Click "Export" button
3. Choose format (JSON or CSV)
4. File downloads with all matching entries

### Common Tasks

**Task: Review Admin Actions**

1. Filter by specific admin
2. Review their recent actions
3. Verify actions are appropriate
4. Investigate any suspicious activity

**Task: Audit Configuration Changes**

1. Filter by "Configuration Changes"
2. Review all feature flag and setting updates
3. Verify changes align with policies
4. Document major changes

---

## Engagement Reports

**Path**: `/admin/reports/engagement`  
**Access**: Admin, SuperAdmin

### Overview

Generate comprehensive reports on user engagement, feature adoption, and content creation.

### Report Sections

#### Feature Adoption

- Usage trends for each hub over time
- Adoption rate by feature
- Most/least used features
- Growth patterns

#### User Retention

- Cohort analysis by signup date
- Retention rates (Day 1, 7, 30, 90)
- Churn analysis
- Reactivation rates

#### Content Statistics

- Total content created
- Average content per user
- Most popular content types
- Content creation trends

### Generating Reports

1. Navigate to `/admin/reports/engagement`
2. Select date range
3. Click "Generate Report"
4. Report loads with charts and tables
5. Review insights and recommendations

### Exporting Reports

1. Click "Export PDF" button
2. PDF generates with:
   - All charts and tables
   - Key insights
   - Recommendations
   - Executive summary
3. File downloads automatically

### Common Tasks

**Task: Monthly Engagement Review**

1. Generate report for previous month
2. Review feature adoption trends
3. Identify underutilized features
4. Plan improvements or marketing
5. Export PDF for stakeholders

**Task: Analyze User Retention**

1. View cohort analysis
2. Identify cohorts with low retention
3. Investigate common characteristics
4. Plan retention campaigns

---

## API Integrations

**Path**: `/admin/integrations`  
**Access**: SuperAdmin only

### Overview

Manage API keys, monitor API usage, and configure third-party integrations.

> **Note**: For complete API documentation, see [API Reference](./API_REFERENCE.md).

### API Key Management

#### Creating API Keys

1. Navigate to `/admin/integrations`
2. Click "Create API Key"
3. Enter key name and description
4. Set permissions and rate limits
5. Click "Generate"
6. **Important**: Copy key immediately (shown only once)
7. Store key securely

#### Viewing API Usage

1. View list of all API keys
2. See for each key:
   - Request count
   - Rate limit status
   - Last used date
   - Endpoints accessed

#### Revoking API Keys

1. Find key in list
2. Click "Revoke"
3. Confirm action
4. Key invalidated immediately
5. Action logged in audit trail

### Monitoring Integrations

#### Integration Status

View status of all third-party integrations:

- Google Business Profile
- Stripe (billing)
- Tavily (search)
- NewsAPI
- Bridge API (reviews)

#### Rate Limits

Monitor rate limit usage:

- Current usage vs. limit
- Reset time
- Alerts when approaching limit

### Common Tasks

**Task: Create API Key for Integration**

1. Create new API key
2. Set appropriate permissions
3. Configure rate limits
4. Copy key securely
5. Provide to integration partner
6. Monitor usage

**Task: Investigate Rate Limit Issues**

1. View API usage metrics
2. Identify keys approaching limits
3. Review usage patterns
4. Increase limits if legitimate
5. Revoke if suspicious

---

## Announcements

**Path**: `/admin/announcements`  
**Access**: Admin, SuperAdmin

### Overview

Communicate important updates, new features, and platform news to users.

### Creating Announcements

#### Composing

1. Navigate to `/admin/announcements`
2. Click "Create Announcement"
3. Enter title and content
4. Use rich text editor for formatting:
   - Bold, italic, underline
   - Headings and lists
   - Links and images
   - Call-to-action buttons

#### Targeting

Choose who receives the announcement:

- **All Users**: Everyone on the platform
- **By Role**: Specific roles (Admin, SuperAdmin, User)
- **Custom Segment**: Specific user IDs or criteria

#### Delivery Method

- **Email**: Sent to user's email address
- **In-App**: Displayed in platform notifications
- **Both**: Email and in-app notification

#### Scheduling

- **Send Now**: Immediate delivery
- **Schedule**: Choose date and time for delivery

### Managing Announcements

#### Viewing History

1. View list of all announcements
2. See status: Draft, Scheduled, Sent
3. Click to view details

#### Tracking Performance

View metrics for each announcement:

- Delivery status (sent, failed)
- Open rate (email)
- Click-through rate (links)
- Engagement time

#### Editing Scheduled Announcements

1. Find scheduled announcement
2. Click "Edit"
3. Update content or settings
4. Save changes
5. Schedule remains intact

#### Canceling Announcements

1. Find scheduled announcement
2. Click "Cancel"
3. Confirm cancellation
4. Users notified if already sent

### Best Practices

- Keep announcements concise and actionable
- Use clear subject lines
- Include call-to-action buttons
- Test with small group first
- Schedule for optimal times (Tuesday-Thursday, 10am-2pm)
- Track metrics and iterate

---

## User Feedback

**Path**: `/admin/feedback`  
**Access**: Admin, SuperAdmin

### Overview

View, categorize, and respond to user feedback to improve the platform.

### Feedback Dashboard

#### Viewing Feedback

1. Navigate to `/admin/feedback`
2. View all feedback sorted by date
3. See for each item:
   - Feedback text
   - User information
   - Sentiment (positive, neutral, negative)
   - Category
   - Status (new, addressed)

#### Filtering Feedback

- By sentiment (positive, neutral, negative)
- By category (bug, feature request, general)
- By status (new, addressed)
- By date range

### Managing Feedback

#### Categorizing Feedback

1. Click on feedback item
2. Select category:
   - Bug Report
   - Feature Request
   - General Feedback
3. Category updates automatically

#### Responding to Feedback

1. Click on feedback item
2. Type response in message box
3. Click "Send Response"
4. User receives email notification
5. Feedback marked as "Addressed"

#### Generating Reports

1. Click "Generate Report"
2. Select date range
3. Report includes:
   - Common themes
   - Sentiment trends
   - Top feature requests
   - Bug report summary
4. Export as PDF

### Common Tasks

**Task: Review Weekly Feedback**

1. Filter by last 7 days
2. Review all new feedback
3. Categorize each item
4. Respond to questions
5. Forward bugs to development
6. Add feature requests to backlog

**Task: Identify Feature Requests**

1. Filter by "Feature Request" category
2. Review all requests
3. Group similar requests
4. Prioritize by frequency
5. Share with product team

---

## Maintenance Mode

**Path**: `/admin/system/maintenance`  
**Access**: SuperAdmin only

### Overview

Schedule and manage system maintenance windows with minimal user disruption.

### Scheduling Maintenance

1. Navigate to `/admin/system/maintenance`
2. Click "Schedule Maintenance"
3. Enter details:
   - Start date and time
   - Estimated duration
   - Reason for maintenance
   - Custom message for users
4. Click "Schedule"
5. Banner displays to all users

### Maintenance Banner

Users see banner with:

- Maintenance window details
- Estimated duration
- What to expect
- Contact information

### Enabling Maintenance Mode

**Manual Activation**

1. Click "Enable Maintenance Mode"
2. Confirm action
3. All users (except SuperAdmins) see maintenance page
4. SuperAdmins can still access platform

**Automatic Activation**

- Maintenance mode enables automatically at scheduled time
- Users redirected to maintenance page
- SuperAdmins bypass maintenance page

### During Maintenance

- SuperAdmins have full access
- Regular users see maintenance page
- No data loss or interruption
- Monitor system health dashboard

### Completing Maintenance

**Manual Completion**

1. Click "Disable Maintenance Mode"
2. Confirm action
3. Users regain access immediately
4. Notification sent to all users

**Automatic Completion**

- Maintenance mode disables at scheduled end time
- Users regain access automatically
- Notification sent to all users

### Canceling Maintenance

1. Find scheduled maintenance
2. Click "Cancel"
3. Confirm cancellation
4. Banner removed
5. Users notified of cancellation

### Best Practices

- Schedule during low-usage hours (2am-6am)
- Provide 24-48 hours notice
- Keep maintenance windows short (< 2 hours)
- Communicate clearly with users
- Test in staging environment first
- Have rollback plan ready

---

## Common Workflows

This section describes common day-to-day workflows for admins and super-admins.

### Daily Admin Tasks

**Morning Routine (15 minutes)**

1. Check system health dashboard for alerts
2. Review new support tickets (respond to urgent)
3. Check content moderation queue (approve/flag new content)
4. Review analytics for any unusual activity

**Throughout the Day**

1. Respond to support tickets as they arrive
2. Monitor user feedback
3. Address any system alerts
4. Moderate flagged content

**End of Day (10 minutes)**

1. Close resolved support tickets
2. Review open tickets for follow-up
3. Check for any pending admin actions
4. Review daily metrics summary

### Weekly Admin Tasks

**Monday Morning (30 minutes)**

1. Generate engagement report for previous week
2. Review user activity trends
3. Identify dormant users for re-engagement
4. Plan content moderation priorities

**Mid-Week Check (20 minutes)**

1. Review feature adoption metrics
2. Check billing dashboard for payment failures
3. Follow up on waiting support tickets
4. Review user feedback themes

**Friday Wrap-Up (30 minutes)**

1. Export weekly analytics
2. Close completed support tickets
3. Review and respond to user feedback
4. Prepare summary for stakeholders

### Monthly SuperAdmin Tasks

**First Week of Month**

1. Generate monthly engagement report
2. Review billing metrics and revenue
3. Audit configuration changes from previous month
4. Review feature flag rollouts

**Mid-Month**

1. Review audit logs for security
2. Check API usage and rate limits
3. Review system health trends
4. Plan feature rollouts for next month

**End of Month**

1. Export monthly billing data
2. Generate executive summary report
3. Review user retention cohorts
4. Plan improvements based on feedback

### Onboarding New Admin

**Setup (Day 1)**

1. Create admin account with appropriate role
2. Send welcome email with credentials
3. Schedule onboarding call
4. Provide access to documentation

**Training (Week 1)**

1. Walk through admin dashboard
2. Demonstrate support ticket workflow
3. Show content moderation process
4. Review analytics dashboard

**Ongoing Support**

1. Assign mentor for first month
2. Weekly check-ins for questions
3. Review common tasks together
4. Gradually increase responsibilities

### Handling User Escalations

**When User Requests Escalation**

1. Review ticket history thoroughly
2. Check user's account status and history
3. Verify issue hasn't been resolved
4. Respond with detailed investigation

**If Issue Requires Technical Team**

1. Document all troubleshooting steps taken
2. Gather relevant logs and error messages
3. Create detailed technical ticket
4. Keep user informed of progress

**If Issue Requires Refund/Credit**

1. Verify issue and impact
2. Check billing history
3. Escalate to SuperAdmin if needed
4. Process refund/credit once approved
5. Follow up with user

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: Analytics Not Loading

**Symptoms**: Dashboard shows loading spinner indefinitely

**Solutions**:

1. Check internet connection
2. Refresh the page (Cmd/Ctrl + R)
3. Clear browser cache
4. Try different browser
5. Check system health dashboard for AWS issues
6. Contact support if persists

#### Issue: User Export Fails

**Symptoms**: Export button doesn't download file

**Solutions**:

1. Check if too many users selected (limit: 10,000)
2. Try smaller batch
3. Check browser download settings
4. Disable popup blockers
5. Try different browser

#### Issue: Email Notifications Not Sending

**Symptoms**: Users not receiving ticket responses or announcements

**Solutions**:

1. Check system health for SES status
2. Verify user email addresses are valid
3. Check spam folders
4. Review email logs in CloudWatch
5. Verify SES sending limits not exceeded
6. Contact AWS support if SES issues

> **Note**: For technical troubleshooting, see [Developer Guide - Troubleshooting](./DEVELOPER_GUIDE.md#troubleshooting).

#### Issue: Feature Flag Not Applying

**Symptoms**: Users not seeing enabled feature

**Solutions**:

1. Verify flag is enabled (not just saved)
2. Check rollout percentage
3. Verify user targeting rules
4. Clear user's browser cache
5. Check for conflicting flags
6. Review audit logs for recent changes

#### Issue: Slow Dashboard Performance

**Symptoms**: Pages load slowly or timeout

**Solutions**:

1. Check system health metrics
2. Verify DynamoDB capacity
3. Clear cached data
4. Reduce date range for queries
5. Check for high error rates
6. Review CloudWatch logs

#### Issue: Cannot Access Admin Features

**Symptoms**: Admin menu not visible or access denied

**Solutions**:

1. Verify user has Admin or SuperAdmin role
2. Sign out and sign back in
3. Clear browser cache and cookies
4. Check audit logs for role changes
5. Contact SuperAdmin to verify role
6. Use the Super Admin Test Page (see [Testing Admin Access](#testing-admin-access))

### Testing Admin Access

**Path**: `/super-admin/test-page`  
**Access**: All users (displays different content based on role)

The Super Admin Test Page is a diagnostic tool that helps troubleshoot authentication and authorization issues. It displays:

**User Information**:
- User ID and email
- Authentication loading state

**Admin Information**:
- Admin role status (Admin/SuperAdmin)
- Authorization loading state
- Current role assignment

**Access Status**:
- **Access Granted**: Green card shown for users with SuperAdmin access
- **Access Denied**: Red card shown for users without SuperAdmin access, with link to grant access page

**When to Use**:
- Troubleshooting role assignment issues
- Verifying authentication state
- Debugging authorization problems
- Testing after role changes

**Common Scenarios**:
- User reports they can't access admin features → Direct them to test page to verify role
- After granting admin access → Use test page to confirm changes took effect
- Authentication issues → Check if user data is loading properly
- Role synchronization problems → Compare displayed role with expected role

### Getting Help

**Documentation**

- User Guide (this document)
- [API Reference](./API_REFERENCE.md) - Complete API documentation
- [Developer Guide](./DEVELOPER_GUIDE.md) - Technical implementation details
- [Testing Guide](./TESTING_GUIDE.md) - Testing procedures and best practices
- [README](./README.md) - Documentation overview and navigation

**Support Channels**

- Email: admin-support@bayoncoagent.com
- Slack: #admin-support channel
- Emergency: Call SuperAdmin on-call

**Reporting Bugs**

1. Create support ticket with:
   - Detailed description
   - Steps to reproduce
   - Screenshots
   - Browser and OS info
   - Error messages
2. Tag as "Bug Report"
3. Set priority appropriately

---

## Keyboard Shortcuts

### Global Shortcuts

| Shortcut       | Action                  |
| -------------- | ----------------------- |
| `Cmd/Ctrl + K` | Open command palette    |
| `Cmd/Ctrl + /` | Show keyboard shortcuts |
| `Esc`          | Close modal or dialog   |
| `Cmd/Ctrl + R` | Refresh current page    |

### Navigation Shortcuts

| Shortcut   | Action                   |
| ---------- | ------------------------ |
| `G then A` | Go to Analytics          |
| `G then U` | Go to Users              |
| `G then C` | Go to Content Moderation |
| `G then S` | Go to Support Tickets    |
| `G then H` | Go to System Health      |
| `G then F` | Go to Feature Flags      |
| `G then B` | Go to Billing            |

### Action Shortcuts

| Shortcut           | Action                         |
| ------------------ | ------------------------------ |
| `N`                | Create new (context-dependent) |
| `E`                | Edit selected item             |
| `D`                | Delete selected item           |
| `Cmd/Ctrl + S`     | Save changes                   |
| `Cmd/Ctrl + Enter` | Submit form                    |
| `Cmd/Ctrl + E`     | Export data                    |

### Table Shortcuts

| Shortcut       | Action              |
| -------------- | ------------------- |
| `↑` / `↓`      | Navigate rows       |
| `Space`        | Select/deselect row |
| `Cmd/Ctrl + A` | Select all rows     |
| `Cmd/Ctrl + D` | Deselect all rows   |
| `/`            | Focus search box    |

### Modal Shortcuts

| Shortcut      | Action         |
| ------------- | -------------- |
| `Esc`         | Close modal    |
| `Tab`         | Next field     |
| `Shift + Tab` | Previous field |
| `Enter`       | Confirm action |

### Customizing Shortcuts

1. Navigate to `/admin/settings`
2. Click "Keyboard Shortcuts"
3. Click on shortcut to change
4. Press new key combination
5. Save changes

---

## Appendix

### Admin Role Permissions

#### Admin Role Can:

- View analytics and reports
- Track user activity
- Moderate content
- Manage support tickets
- Send announcements
- Perform bulk operations
- View user feedback
- Export data

#### Admin Role Cannot:

- Access billing information
- View audit logs
- Manage feature flags
- Update platform settings
- Manage API keys
- Enable maintenance mode
- Change user roles

#### SuperAdmin Role Can:

- Everything Admin can do, plus:
- Access billing information
- View and export audit logs
- Manage feature flags and A/B tests
- Update platform settings
- Manage API keys and integrations
- Enable/disable maintenance mode
- Change user roles
- Grant trial extensions
- Access system configuration

### Data Retention Policies

| Data Type          | Retention Period     | Notes                  |
| ------------------ | -------------------- | ---------------------- |
| Analytics Events   | 90 days              | Auto-deleted via TTL   |
| Aggregated Metrics | Indefinite           | Summarized data        |
| Support Tickets    | 1 year after closure | Archived               |
| Audit Logs         | 90 days minimum      | Compliance requirement |
| Error Logs         | 30 days              | CloudWatch retention   |
| User Activity      | While account active | Deleted with account   |
| Content            | While account active | Deleted with account   |

### Security Best Practices

1. **Password Management**

   - Use strong, unique passwords
   - Enable 2FA for admin accounts
   - Rotate passwords every 90 days
   - Never share credentials

2. **Access Control**

   - Grant minimum necessary permissions
   - Review admin access quarterly
   - Revoke access immediately when no longer needed
   - Monitor audit logs for suspicious activity

3. **Data Protection**

   - Never export sensitive data to personal devices
   - Use encrypted connections only
   - Follow data handling policies
   - Report security incidents immediately

4. **Session Management**
   - Sign out when finished
   - Don't leave admin sessions unattended
   - Use private browsing for shared computers
   - Clear browser cache regularly

### Compliance Guidelines

#### GDPR Compliance

- User data export includes all admin-visible data
- Support data deletion requests within 30 days
- Maintain audit trail of data access
- Anonymize analytics after retention period

#### SOC 2 Compliance

- All admin actions are logged
- Audit logs are immutable
- Access is role-based and monitored
- Security reviews conducted quarterly

---

## Glossary

**Active User**: User who logged in within last 7 days

**Audit Log**: Immutable record of all administrative actions

**Bulk Operation**: Action performed on multiple users simultaneously

**Cohort**: Group of users who signed up in the same time period

**DAU**: Daily Active Users - unique users who logged in today

**Dormant User**: User who hasn't logged in for 30+ days

**Feature Flag**: Toggle to enable/disable features for specific users

**GSI**: Global Secondary Index - DynamoDB query optimization

**Inactive User**: User who logged in 7-30 days ago

**MAU**: Monthly Active Users - unique users who logged in this month

**Moderation**: Review and approval of user-generated content

**Rollout Percentage**: Percentage of users who see a feature

**SuperAdmin**: Highest privilege level with full system access

**TTL**: Time To Live - automatic deletion of old data

**WAU**: Weekly Active Users - unique users who logged in this week

---

## Feedback

Have suggestions for improving this guide? Contact us:

- Email: docs@bayoncoagent.com
- Slack: #admin-docs channel
- Submit feedback via `/admin/feedback`

---

_Last Updated: December 2024_  
_Document Version: 2.0_  
_Platform Version: 2.0_

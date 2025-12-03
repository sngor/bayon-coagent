# Quick Share Testing Guide

## Pre-Testing Setup

### Environment Variables

Ensure the following environment variables are set:

```bash
NEXT_PUBLIC_APP_URL=https://app.bayoncoagent.com  # or your local URL
```

### Database Setup

Verify DynamoDB table exists with proper schema:

- Table name configured in environment
- PropertyShare entity type supported
- Proper key structure (PK: USER#, SK: SHARE#)

### Authentication

- User must be logged in to create shares
- Test with valid Cognito session

## Testing Checklist

### 1. QR Code Generation ✓

**Test Steps:**

1. Navigate to `/mobile/quick-share-demo`
2. Select "QR Code" method
3. Click "Create Share"
4. Verify QR code displays
5. Click "Download" button
6. Verify PNG file downloads

**Expected Results:**

- QR code generates within 2 seconds
- QR code is 400x400 pixels
- Download saves as `property-qr-{propertyId}.png`
- QR code is scannable with mobile device

**Test Cases:**

- [ ] QR code generates successfully
- [ ] QR code contains valid tracking URL
- [ ] QR code can be scanned with phone camera
- [ ] Download button works
- [ ] Downloaded file is valid PNG

### 2. SMS Sharing ✓

**Test Steps:**

1. Navigate to `/mobile/quick-share-demo`
2. Select "SMS" method
3. Enter phone number (optional)
4. Add custom message (optional)
5. Click "Create Share"
6. Verify SMS message displays
7. Click "Copy Message"

**Expected Results:**

- SMS message includes property highlights
- Message includes tracking URL
- Message is under 160 characters (or split appropriately)
- Copy to clipboard works

**Test Cases:**

- [ ] SMS message formats correctly
- [ ] Property details included (address, price, beds, baths, sqft)
- [ ] Tracking URL included
- [ ] Copy to clipboard works
- [ ] Message is mobile-friendly

### 3. Email Sharing ✓

**Test Steps:**

1. Navigate to `/mobile/quick-share-demo`
2. Select "Email" method
3. Enter email address (optional)
4. Add custom message (optional)
5. Click "Create Share"
6. Verify email subject and body display
7. Click "Copy Email"

**Expected Results:**

- Email subject is descriptive
- Email body is well-formatted
- Property details included
- Tracking URL included
- Copy to clipboard works

**Test Cases:**

- [ ] Email subject formats correctly
- [ ] Email body includes all property details
- [ ] Tracking URL included
- [ ] Agent name included (if available)
- [ ] Copy to clipboard works
- [ ] Email is professional and readable

### 4. Social Media Sharing ✓

**Test Steps:**

1. Navigate to `/mobile/quick-share-demo` on mobile device
2. Select "Social" method
3. Add custom message (optional)
4. Click "Create Share"
5. Verify native share sheet appears
6. Select a platform (Messages, WhatsApp, etc.)
7. Verify content is shared

**Expected Results:**

- Native share sheet appears on mobile
- Property title and URL included
- Custom message included
- Share completes successfully

**Test Cases:**

- [ ] Web Share API detected on mobile
- [ ] Native share sheet appears
- [ ] Content includes title, text, and URL
- [ ] Share to Messages works
- [ ] Share to WhatsApp works
- [ ] Share to other apps works
- [ ] Fallback works on desktop (button disabled or copy URL)

### 5. Mobile-Optimized Share View ✓

**Test Steps:**

1. Create a share using any method
2. Copy the tracking URL
3. Open URL in mobile browser
4. Verify page displays correctly
5. Test all interactive elements

**Expected Results:**

- Page loads within 2 seconds
- Layout is single-column
- Touch targets are 44px minimum
- Images load and display correctly
- CTAs are prominent and functional

**Test Cases:**

- [ ] Page loads successfully
- [ ] Property image displays
- [ ] Property details display correctly
- [ ] Price, beds, baths, sqft visible
- [ ] Description displays
- [ ] Location displays
- [ ] Call button works (opens phone dialer)
- [ ] Email button works (opens email client)
- [ ] Schedule button works
- [ ] Layout is responsive
- [ ] Touch targets are large enough
- [ ] No horizontal scrolling

### 6. Engagement Tracking ✓

**Test Steps:**

1. Create a share
2. Note the share ID
3. Open the tracking URL
4. Verify view is tracked
5. Click a CTA button
6. Verify click is tracked
7. Check metrics display

**Expected Results:**

- View count increments on page load
- Click count increments on CTA click
- Metrics display in real-time
- Data persists in DynamoDB

**Test Cases:**

- [ ] View tracking works on page load
- [ ] Click tracking works on CTA click
- [ ] Metrics display correctly
- [ ] View count increments
- [ ] Click count increments
- [ ] Last viewed timestamp updates
- [ ] Data persists across sessions

### 7. Authentication & Security ✓

**Test Steps:**

1. Log out of application
2. Try to access `/mobile/quick-share-demo`
3. Try to create a share
4. Verify authentication required
5. Log back in
6. Verify share creation works

**Expected Results:**

- Unauthenticated users redirected to login
- Share creation requires authentication
- Share data is user-scoped
- Tracking URLs are unique

**Test Cases:**

- [ ] Authentication required for share creation
- [ ] Unauthenticated users cannot create shares
- [ ] Share data is user-scoped (PK: USER#)
- [ ] Tracking URLs are unique per share
- [ ] Share links work without authentication (public view)
- [ ] Expired shares return 404 (after 90 days)

### 8. Error Handling ✓

**Test Steps:**

1. Try to create share without property ID
2. Try to create share with invalid data
3. Try to access non-existent share
4. Test with network errors
5. Test with DynamoDB errors

**Expected Results:**

- Validation errors display clearly
- User-friendly error messages
- Graceful degradation
- No crashes or blank screens

**Test Cases:**

- [ ] Validation errors display
- [ ] Invalid property ID handled
- [ ] Non-existent share returns 404
- [ ] Network errors handled gracefully
- [ ] DynamoDB errors handled gracefully
- [ ] Error messages are user-friendly
- [ ] No sensitive data in error messages

## Performance Testing

### Load Time

- [ ] QR code generation < 2 seconds
- [ ] Share creation < 1 second
- [ ] Share view page load < 2 seconds on 4G
- [ ] Metrics load < 500ms

### Mobile Performance

- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] No layout shifts
- [ ] Smooth scrolling
- [ ] No janky animations

## Browser Compatibility

### Desktop

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile

- [ ] iOS Safari (iOS 14+)
- [ ] Android Chrome (latest)
- [ ] Samsung Internet
- [ ] Firefox Mobile

## Accessibility Testing

### Keyboard Navigation

- [ ] All buttons accessible via keyboard
- [ ] Tab order is logical
- [ ] Focus indicators visible
- [ ] No keyboard traps

### Screen Reader

- [ ] All images have alt text
- [ ] Form labels properly associated
- [ ] Buttons have descriptive labels
- [ ] Error messages announced

### Touch Targets

- [ ] All buttons ≥ 44px
- [ ] Adequate spacing between targets
- [ ] No accidental taps

## Integration Testing

### With Existing Features

- [ ] Works with property listings
- [ ] Works with saved content
- [ ] Works with offline queue (if applicable)
- [ ] Works with notification system

### Data Consistency

- [ ] Share data persists correctly
- [ ] Metrics update consistently
- [ ] No data loss on errors
- [ ] Proper cleanup on deletion

## Regression Testing

After any changes, verify:

- [ ] All existing shares still work
- [ ] Tracking URLs still valid
- [ ] Metrics still accurate
- [ ] No breaking changes to API

## Known Issues

Document any issues found during testing:

1. **Issue**: [Description]
   - **Severity**: [Low/Medium/High/Critical]
   - **Steps to Reproduce**: [Steps]
   - **Expected**: [Expected behavior]
   - **Actual**: [Actual behavior]
   - **Workaround**: [If any]

## Test Results

### Test Date: [Date]

### Tester: [Name]

### Environment: [Production/Staging/Local]

| Test Category         | Pass | Fail | Notes |
| --------------------- | ---- | ---- | ----- |
| QR Code Generation    | ☐    | ☐    |       |
| SMS Sharing           | ☐    | ☐    |       |
| Email Sharing         | ☐    | ☐    |       |
| Social Sharing        | ☐    | ☐    |       |
| Share View            | ☐    | ☐    |       |
| Engagement Tracking   | ☐    | ☐    |       |
| Authentication        | ☐    | ☐    |       |
| Error Handling        | ☐    | ☐    |       |
| Performance           | ☐    | ☐    |       |
| Browser Compatibility | ☐    | ☐    |       |
| Accessibility         | ☐    | ☐    |       |

### Overall Result: [Pass/Fail]

### Notes:

[Additional notes, observations, or recommendations]

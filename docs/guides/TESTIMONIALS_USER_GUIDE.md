# Testimonials User Guide

## Overview

The Testimonials feature helps you collect, organize, and showcase client feedback to build social proof and credibility. This guide covers everything you need to know about managing testimonials in Bayon Coagent.

## Table of Contents

1. [Collecting Testimonials](#collecting-testimonials)
2. [Requesting Testimonials](#requesting-testimonials)
3. [Organizing Testimonials](#organizing-testimonials)
4. [Displaying Testimonials on Your Profile](#displaying-testimonials-on-your-profile)
5. [Generating Social Proof Content](#generating-social-proof-content)

---

## Collecting Testimonials

### Adding a Testimonial Manually

1. Navigate to **Brand → Testimonials**
2. Click the **"New Testimonial"** button
3. Fill in the testimonial details:
   - **Client Name**: Full name of the client
   - **Testimonial Text**: The client's feedback
   - **Date Received**: When you received the testimonial
   - **Client Photo** (optional): Upload a photo of your client
   - **Tags** (optional): Add categories like "buyer", "seller", "luxury"
4. Click **"Save"** to store the testimonial

### Uploading Client Photos

Client photos add authenticity to testimonials:

- **Supported formats**: JPG, PNG, WebP
- **Recommended size**: 400x400 pixels
- **Maximum file size**: 5MB
- Photos are securely stored in AWS S3

**Tip**: Always get written permission from clients before using their photos.

### Editing Testimonials

1. Go to **Brand → Testimonials**
2. Click on a testimonial card to open the detail view
3. Click **"Edit"**
4. Make your changes
5. Click **"Save"**

**Note**: The original date received is preserved when editing.

### Deleting Testimonials

1. Open the testimonial detail view
2. Click **"Delete"**
3. Confirm the deletion

**Warning**: This action cannot be undone. The testimonial and any associated photos will be permanently removed.

---

## Requesting Testimonials

### Sending a Testimonial Request

The automated request system makes it easy to gather feedback:

1. Navigate to **Brand → Testimonials**
2. Click **"Request Testimonial"**
3. Enter the client's information:
   - **Client Name**: Full name
   - **Client Email**: Valid email address
4. Click **"Send Request"**

### What Happens Next

1. **Email Sent**: Your client receives an email with a unique submission link
2. **Client Submits**: They click the link and fill out a simple form
3. **You're Notified**: You receive an email when they submit
4. **Auto-Reminder**: If they haven't submitted after 14 days, they get one reminder
5. **Expiration**: The link expires after 30 days

### Tracking Requests

View all your testimonial requests and their status:

1. Go to **Brand → Testimonials**
2. Click the **"Requests"** tab
3. See requests organized by status:
   - **Pending**: Waiting for client submission
   - **Submitted**: Client has provided feedback
   - **Expired**: Link expired after 30 days

### Request Status Meanings

- **Pending**: Client hasn't submitted yet
- **Submitted**: Testimonial received and saved
- **Expired**: 30 days passed without submission

### Resending Requests

If a request expires or the client didn't receive it:

1. Find the expired request
2. Click **"Resend"**
3. A new email with a fresh link will be sent

---

## Organizing Testimonials

### Filtering Testimonials

Use filters to find specific testimonials:

1. **Date Range**: Filter by when you received them
2. **Featured Status**: Show only featured testimonials
3. **Has Photo**: Filter testimonials with client photos
4. **Tags**: Filter by categories you've assigned

### Searching Testimonials

Use the search bar to find testimonials by:

- Client name
- Testimonial text content

### Tagging Testimonials

Tags help you organize testimonials by category:

**Common tags**:

- `buyer` - For buyer clients
- `seller` - For seller clients
- `luxury` - For luxury property transactions
- `first-time` - For first-time home buyers
- `investment` - For investment property clients

**To add tags**:

1. Edit a testimonial
2. Add tags in the Tags field (comma-separated)
3. Save

---

## Displaying Testimonials on Your Profile

### Marking Testimonials as Featured

Featured testimonials appear on your public agent profile:

1. Go to **Brand → Testimonials**
2. Click on a testimonial
3. Toggle **"Featured"** on
4. The testimonial will appear on your profile

### Managing Featured Testimonials

- **Maximum**: Up to 6 testimonials can be featured
- **Reordering**: Drag and drop to change the display order
- **Best Practice**: Feature your most compelling testimonials

### What Visitors See

When someone views your agent profile, they'll see:

- Client name
- Testimonial text
- Date received
- Client photo (if available)
- Proper schema markup for search engines

**SEO Benefit**: Featured testimonials include Review schema markup, which can display star ratings in Google search results.

---

## Generating Social Proof Content

### Creating Social Media Posts from Testimonials

Turn testimonials into ready-to-post social media content:

1. Navigate to **Brand → Testimonials**
2. Select one or more testimonials (use checkboxes)
3. Click **"Generate Social Proof"**
4. Choose your format:
   - **Instagram Post**: Square format with hashtags
   - **Facebook Post**: Longer format with context
   - **LinkedIn Post**: Professional tone
5. Click **"Generate"**

### What Gets Generated

The AI creates:

- **Formatted text**: Optimized for the platform
- **Client attribution**: Properly credited
- **Hashtags**: Relevant real estate hashtags
- **Image suggestions**: If testimonials include photos
- **Call-to-action**: Encouraging engagement

### Saving Generated Content

Generated content is automatically saved to:

- **Library → Content**

From there you can:

- Copy to clipboard
- Edit the content
- Schedule for posting
- Export to your social media tools

### Best Practices for Social Proof

1. **Mix it up**: Use different testimonials regularly
2. **Add context**: Mention the property type or neighborhood
3. **Include photos**: Posts with client photos perform better
4. **Tag clients**: If they're comfortable being tagged
5. **Respond to comments**: Engage with people who comment

### Example Generated Content

**Instagram Post**:

```
🏡 "Working with [Agent Name] was the best decision we made!
They found us our dream home in [Neighborhood]." - Sarah M.

Ready to find your dream home? Let's make it happen!
DM me to get started.

#RealEstate #DreamHome #[City]RealEstate #HomeBuyer
#RealEstateAgent #NewHome #HouseHunting
```

---

## Tips for Success

### Getting More Testimonials

1. **Ask at the right time**: Right after closing or a successful showing
2. **Make it easy**: Use the automated request system
3. **Follow up**: The reminder system helps, but personal follow-up works too
4. **Show appreciation**: Thank clients who provide testimonials

### Writing Effective Requests

When sending requests, consider:

- Timing: Send within a week of closing
- Personal touch: Add a personal note if possible
- Specific questions: Ask about specific aspects of your service

### Maximizing Impact

1. **Feature your best**: Choose testimonials that highlight different strengths
2. **Keep them current**: Update featured testimonials regularly
3. **Use everywhere**: Share on social media, website, marketing materials
4. **Track results**: Monitor which testimonials resonate most

---

## Troubleshooting

### Client Didn't Receive Request Email

**Check**:

1. Verify the email address is correct
2. Ask client to check spam/junk folder
3. Resend the request if needed

### Submission Link Not Working

**Possible causes**:

- Link expired (30 days)
- Link already used
- Technical issue

**Solution**: Send a new request

### Photo Upload Failed

**Common issues**:

- File too large (max 5MB)
- Unsupported format (use JPG, PNG, or WebP)
- Network connection issue

**Solution**: Resize the image or try a different format

### Can't Mark More as Featured

**Reason**: Maximum of 6 featured testimonials

**Solution**: Unfeature one testimonial before featuring another

---

## Privacy and Permissions

### Client Consent

Always ensure you have permission to:

- Use client testimonials publicly
- Display client photos
- Share their name and feedback

### Data Storage

- Testimonials are stored securely in AWS DynamoDB
- Photos are stored in AWS S3 with encryption
- Only you can access your testimonials
- Clients can request removal at any time

### Removing Testimonials

If a client requests removal:

1. Delete the testimonial from your account
2. Remove from any external marketing materials
3. Confirm removal with the client

---

## Next Steps

Now that you know how to manage testimonials:

1. **Add your existing testimonials** to the system
2. **Send requests** to recent clients
3. **Feature your best** testimonials on your profile
4. **Generate social proof** content for your next post

Need help? Check out the [SEO User Guide](./SEO_USER_GUIDE.md) to optimize your content for search engines.

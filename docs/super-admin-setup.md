# Super Admin Setup Guide

This guide explains how to create and manage super admin accounts for Bayon Coagent.

## Overview

Super admins have full access to:

- **Feedback Management**: View and manage all user feedback
- **User Management**: View and manage user accounts
- **System Analytics**: Access to app usage and performance metrics
- **System Settings**: Configure app-wide settings and features
- **Brokerage Management**: Manage multiple brokerages and their agents

## Methods to Create Super Admin

### Method 1: CLI Script (Recommended)

The fastest way to create a super admin account:

```bash
# Create super admin for an existing user
npm run admin:create admin@yourcompany.com

# Or with explicit admin key
npm run admin:create admin@yourcompany.com your-secret-admin-key
```

**Prerequisites:**

- User must already be registered in the app
- Set `SUPER_ADMIN_KEY` in your environment variables
- Have AWS credentials configured

### Method 2: Web Interface

Visit `/admin/setup` in your app:

1. Navigate to `https://yourapp.com/admin/setup`
2. Enter the email of an existing user
3. Enter the super admin key
4. Click "Create Super Admin"

### Method 3: Direct Database Update

For emergency access, update DynamoDB directly:

```javascript
// Add to user's profile record
{
  PK: "USER#<userId>",
  SK: "PROFILE",
  Data: {
    ...existingData,
    role: "super_admin",
    adminSince: "2024-01-01T00:00:00.000Z",
    permissions: [
      "view_feedback",
      "manage_feedback",
      "view_users",
      "manage_users",
      "view_analytics",
      "system_settings"
    ]
  }
}
```

## Security Configuration

### Environment Variables

Add to your `.env.local` and production environment:

```bash
# Super Admin Configuration
SUPER_ADMIN_KEY=your-very-secure-random-key-here
```

**Important:**

- Use a strong, random key (32+ characters)
- Never commit this key to version control
- Rotate the key periodically
- Share only with trusted administrators

### Production Deployment

For AWS Amplify or other platforms:

1. **Set Environment Variable:**

   ```bash
   SUPER_ADMIN_KEY=your-production-super-admin-key
   ```

2. **Create Super Admin:**
   ```bash
   # SSH into your server or use AWS CLI
   node scripts/create-super-admin.js admin@yourcompany.com
   ```

## Role Hierarchy

```
super_admin (Full Access)
├── view_feedback
├── manage_feedback
├── view_users
├── manage_users
├── view_analytics
└── system_settings

admin (Limited Access)
├── view_feedback
├── manage_feedback
└── view_analytics

user (No Admin Access)
└── (regular app features only)
```

## Managing Multiple Brokerages

Super admins can:

1. **View All Users**: See agents from all brokerages
2. **Manage Permissions**: Assign admin roles to brokerage managers
3. **System-wide Settings**: Configure features across all brokerages
4. **Analytics**: View usage metrics across the entire platform

## Admin Panel Access

Once created, super admins can access:

- **Feedback Management**: `/admin/feedback`
- **User Management**: `/admin/users` (coming soon)
- **Analytics Dashboard**: `/admin/analytics` (coming soon)
- **System Settings**: `/admin/settings` (coming soon)

## Troubleshooting

### "User not found" Error

- Ensure the user has registered and confirmed their account
- Check the email spelling
- Verify the user exists in AWS Cognito

### "Invalid admin key" Error

- Check the `SUPER_ADMIN_KEY` environment variable
- Ensure the key matches exactly (case-sensitive)
- Verify environment variables are loaded

### Permission Issues

- Clear browser cache and cookies
- Sign out and sign back in
- Check DynamoDB for the user's role field

## Best Practices

1. **Limit Super Admins**: Only create what you need
2. **Regular Audits**: Review admin accounts quarterly
3. **Key Rotation**: Change the admin key periodically
4. **Monitoring**: Track admin actions in CloudWatch
5. **Backup Access**: Always have at least 2 super admins

## Next Steps

After creating your first super admin:

1. Sign in to the app with the admin account
2. Visit `/admin/feedback` to see the admin panel
3. Create additional admin accounts as needed
4. Set up monitoring and alerting for admin actions
5. Configure system-wide settings for your organization

## Support

If you need help with super admin setup:

- Check the troubleshooting section above
- Review AWS CloudWatch logs for errors
- Contact your development team
- Create a support ticket with error details

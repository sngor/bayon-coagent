# Admin Dashboard User Guide

## Overview

The Admin Dashboard provides administrative tools for managing users, roles, and monitoring platform activity. Access is restricted to users with Admin or SuperAdmin roles.

## Accessing the Admin Dashboard

### Navigation

1. **From Sidebar**: Click the "Admin" menu item in the main navigation (visible only to Admin and SuperAdmin users)
2. **Direct URL**: Navigate to `/admin` in your browser
3. **Role Indicator**: Your role badge appears in the user profile dropdown

### Access Requirements

- **Admin Role**: Access to user management and basic admin features
- **SuperAdmin Role**: Full access including role management and audit logs

## Dashboard Sections

### 1. Users Directory

**Path**: `/admin/users`

**Available to**: Admin and SuperAdmin

**Features**:

- View all platform users in a paginated table
- Search users by name or email
- Filter users by role
- View user details (name, email, role, signup date, last active)
- Manage user roles (SuperAdmin only)

**Columns**:

- **Name**: User's full name
- **Email**: User's email address
- **Role**: Visual badge showing user's role (User, Admin, SuperAdmin)
- **Signup Date**: When the user created their account
- **Last Active**: Last time the user was active on the platform
- **Actions**: Available actions based on your role

**Actions**:

- **View Profile**: View detailed user information
- **Manage Role** (SuperAdmin only): Assign or revoke admin privileges

### 2. Role Management

**Path**: `/admin/roles`

**Available to**: SuperAdmin only

**Features**:

- Assign Admin or SuperAdmin roles to users
- Revoke admin privileges from users
- View current role assignments
- Confirmation dialogs for all role changes

**Role Assignment Process**:

1. Navigate to Users directory
2. Click "Manage Role" next to a user
3. Select the desired role (Admin or SuperAdmin)
4. Review the role description and privileges
5. Confirm the assignment
6. User receives email notification

**Role Revocation Process**:

1. Navigate to Users directory
2. Click "Manage Role" next to an Admin or SuperAdmin user
3. Click "Revoke Role"
4. Confirm the revocation
5. User's role is reset to standard User
6. User receives email notification

**Important Notes**:

- You cannot revoke your own SuperAdmin role
- Role changes are immediate and reflected in the user's next session
- All role changes are logged in the audit log

### 3. Audit Log

**Path**: `/admin/audit`

**Available to**: SuperAdmin only

**Features**:

- View complete history of role changes
- Filter by date range, acting admin, or affected user
- Export audit logs for compliance
- Pagination for large datasets

**Audit Log Columns**:

- **Timestamp**: When the role change occurred
- **Acting Admin**: Who made the change
- **Affected User**: Who was affected by the change
- **Old Role**: User's previous role
- **New Role**: User's new role
- **IP Address**: IP address of the acting admin
- **Action**: Type of change (assign or revoke)

**Filtering Options**:

- **Date Range**: Filter by specific date range
- **Acting Admin**: Filter by who made the changes
- **Affected User**: Filter by who was affected
- **Action Type**: Filter by assignment or revocation

## Role Descriptions

### User (Standard)

**Privileges**:

- Access to all standard platform features
- Create and manage own content
- Use AI tools and features
- Manage personal profile and settings

**Restrictions**:

- No access to admin dashboard
- Cannot view other users' information
- Cannot manage roles or access audit logs

### Admin

**Privileges**:

- All User privileges
- Access to admin dashboard
- View all users and their information
- Monitor platform usage and activity
- Access to user management tools

**Restrictions**:

- Cannot assign or revoke roles
- Cannot access audit logs
- Cannot access SuperAdmin-only features

### SuperAdmin

**Privileges**:

- All Admin privileges
- Assign Admin and SuperAdmin roles to users
- Revoke admin privileges from users
- Access complete audit log of role changes
- Full platform administration capabilities

**Restrictions**:

- Cannot revoke own SuperAdmin role (security measure)

## Email Notifications

### Role Assignment Notification

When you assign a role to a user, they receive an email containing:

- Congratulatory message
- Their new role (Admin or SuperAdmin)
- List of new privileges
- Information about who assigned the role
- Link to the admin dashboard

### Role Revocation Notification

When you revoke a role from a user, they receive an email containing:

- Notification of role change
- Their previous role
- Explanation of what changed
- Information about who made the change
- Link to the main dashboard

## Best Practices

### Role Assignment

1. **Verify User Identity**: Ensure you're assigning roles to the correct user
2. **Use Appropriate Role**: Assign the minimum role needed for the user's responsibilities
3. **Document Decisions**: Keep internal records of why roles were assigned
4. **Review Regularly**: Periodically review role assignments and revoke unnecessary privileges

### Security

1. **Protect Your Credentials**: Never share your SuperAdmin credentials
2. **Use Strong Passwords**: Ensure your account has a strong, unique password
3. **Monitor Audit Logs**: Regularly review the audit log for suspicious activity
4. **Report Issues**: Report any unauthorized role changes immediately

### User Management

1. **Communicate Changes**: Inform users before assigning or revoking roles
2. **Provide Training**: Ensure new admins understand their responsibilities
3. **Set Expectations**: Clearly communicate what admins can and cannot do
4. **Be Responsive**: Address user questions about role changes promptly

## Troubleshooting

### Cannot Access Admin Dashboard

**Problem**: Admin menu item not visible or access denied

**Solutions**:

- Verify you have Admin or SuperAdmin role (check profile dropdown)
- Sign out and sign in again to refresh your session
- Contact a SuperAdmin if you believe you should have access

### Cannot Manage Roles

**Problem**: "Manage Role" button is disabled or not visible

**Solutions**:

- Only SuperAdmins can manage roles
- If you're an Admin, you need to be promoted to SuperAdmin
- Contact another SuperAdmin for role management

### Role Change Not Taking Effect

**Problem**: User's role changed but they still see old permissions

**Solutions**:

- User needs to sign out and sign in again
- Role changes are reflected in new sessions only
- Check audit log to verify the change was successful

### Email Notification Not Received

**Problem**: User didn't receive role change email

**Solutions**:

- Check spam/junk folder
- Verify email address is correct in user profile
- Email delivery may be delayed (check again in a few minutes)
- Contact support if emails consistently fail

## Keyboard Shortcuts

- **`/`**: Focus search input (in Users directory)
- **`Esc`**: Close dialogs and modals
- **`Tab`**: Navigate between form fields
- **`Enter`**: Submit forms and confirm actions

## Mobile Access

The admin dashboard is optimized for desktop use but accessible on mobile devices:

- **Responsive Tables**: Tables adapt to smaller screens with card view
- **Touch-Friendly**: Buttons and controls are touch-optimized
- **Simplified Layout**: Mobile view prioritizes essential information

**Recommendation**: For best experience, use a desktop or tablet for admin tasks.

## Support

### Getting Help

- **Documentation**: Refer to this guide and related documentation
- **Audit Log**: Check audit logs for historical information
- **Support Team**: Contact support for technical issues
- **SuperAdmin**: Contact another SuperAdmin for role-related questions

### Reporting Issues

When reporting issues, include:

- Your role (Admin or SuperAdmin)
- What you were trying to do
- Error messages or unexpected behavior
- Screenshots if applicable
- Timestamp of the issue

## Related Documentation

- [Role Management Procedures](./ROLE_MANAGEMENT_PROCEDURES.md) - Detailed procedures for managing roles
- [Security Considerations](./SECURITY_CONSIDERATIONS.md) - Security best practices
- [API Documentation](./API_DOCUMENTATION.md) - Server action reference
- [Error Handling Quick Reference](./ERROR_HANDLING_QUICK_REFERENCE.md) - Troubleshooting guide
- [First User Bootstrap](./FIRST_USER_BOOTSTRAP.md) - First user setup process

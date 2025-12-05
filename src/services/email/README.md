# Email Notification Service

This directory contains email notification services for the Bayon Coagent platform.

## Role Notification Service

The `role-notification-service.ts` module handles email notifications for administrative role changes.

### Features

- **Role Assignment Emails**: Sent when a user is assigned an admin or superadmin role
- **Role Revocation Emails**: Sent when a user's admin privileges are revoked
- **HTML & Plain Text**: All emails include both HTML and plain text versions
- **Graceful Error Handling**: Email failures are logged but don't rollback role changes
- **Professional Templates**: Branded email templates with clear information

### Usage

#### Sending Role Assignment Email

```typescript
import { sendRoleAssignmentEmail } from "@/services/email/role-notification-service";

await sendRoleAssignmentEmail({
  recipientEmail: "user@example.com",
  recipientName: "John Doe",
  newRole: "admin",
  assignedBy: "Jane Smith",
  assignedByEmail: "jane@example.com",
});
```

#### Sending Role Revocation Email

```typescript
import { sendRoleRevocationEmail } from "@/services/email/role-notification-service";

await sendRoleRevocationEmail({
  recipientEmail: "user@example.com",
  recipientName: "John Doe",
  oldRole: "admin",
  revokedBy: "Jane Smith",
  revokedByEmail: "jane@example.com",
});
```

#### Sending Generic Role Change Email

The `sendRoleChangeEmail` function automatically determines whether to send an assignment or revocation email based on the role change:

```typescript
import { sendRoleChangeEmail } from "@/services/email/role-notification-service";

await sendRoleChangeEmail({
  recipientEmail: "user@example.com",
  recipientName: "John Doe",
  oldRole: "user",
  newRole: "admin",
  changedBy: "Jane Smith",
  changedByEmail: "jane@example.com",
});
```

### Integration with Server Actions

The email notification service is designed to be integrated into the `assignRole()` and `revokeRole()` server actions in `src/app/admin/actions.ts`.

**Example integration:**

```typescript
export async function assignRole(input: AssignRoleInput) {
  try {
    // ... authorization checks ...
    // ... update Cognito ...
    // ... update DynamoDB ...
    // ... create audit log ...

    // Send email notification (handle failures gracefully)
    try {
      await sendRoleChangeEmail({
        recipientEmail: targetUser.email,
        recipientName: targetUser.name || targetUser.email,
        oldRole: oldRole as UserRole,
        newRole: input.role,
        changedBy: currentUser.name || currentUser.email,
        changedByEmail: currentUser.email,
      });
      logger.info("Role assignment email sent", { userId: input.userId });
    } catch (emailError) {
      // Log but don't fail the role assignment
      logger.error(
        "Failed to send role assignment email",
        emailError as Error,
        {
          userId: input.userId,
        }
      );
    }

    return { success: true, message: "Role assigned successfully" };
  } catch (error) {
    // ... error handling ...
  }
}
```

### Environment Configuration

The service requires the following environment variables:

- `SES_SENDER_EMAIL` or `ADMIN_EMAIL`: The verified sender email address in AWS SES
- `NEXT_PUBLIC_APP_URL`: The base URL of the application (for links in emails)

**Example `.env` configuration:**

```bash
SES_SENDER_EMAIL=noreply@bayoncoagent.com
NEXT_PUBLIC_APP_URL=https://app.bayoncoagent.com
```

### AWS SES Setup

Before using this service, ensure that:

1. **SES is configured** in your AWS account
2. **Sender email is verified** in SES (or domain is verified)
3. **SES is out of sandbox mode** (for production) or recipient emails are verified (for sandbox)
4. **IAM permissions** are configured to allow sending emails

**Required IAM permissions:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["ses:SendEmail", "ses:SendRawEmail"],
      "Resource": "*"
    }
  ]
}
```

### Email Templates

#### Role Assignment Email

- **Subject**: "You've been assigned the [Role Name] role"
- **Content**:
  - Congratulatory message
  - New role badge
  - List of new privileges
  - Information about who assigned the role
  - Link to admin dashboard

#### Role Revocation Email

- **Subject**: "Your administrative role has been changed"
- **Content**:
  - Notification of role change
  - Previous role information
  - Explanation of what changed
  - Information about who made the change
  - Link to dashboard

### Error Handling

The service follows these error handling principles:

1. **Throw errors**: Functions throw errors on failure so callers can handle them
2. **Logging**: All operations are logged (success and failure)
3. **Graceful degradation**: Email failures should not rollback role changes
4. **Detailed context**: Error logs include relevant context (user IDs, roles, etc.)

### Testing

When testing the email service:

1. **Use LocalStack** for local development (if SES is configured in LocalStack)
2. **Verify sender email** in SES sandbox mode
3. **Check CloudWatch logs** for email sending status
4. **Test both HTML and text versions** of emails
5. **Test error scenarios** (invalid email, SES failures, etc.)

### Future Enhancements

Potential improvements for the email notification service:

- [ ] Email templates stored in SES (using `createEmailTemplate`)
- [ ] Batch email sending for multiple role changes
- [ ] Email preferences (allow users to opt-out of certain notifications)
- [ ] Email delivery tracking and bounce handling
- [ ] Internationalization (i18n) support for multiple languages
- [ ] Custom branding per organization/tenant

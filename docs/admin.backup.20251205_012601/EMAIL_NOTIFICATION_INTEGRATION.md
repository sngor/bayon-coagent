# Email Notification Integration Guide

This guide explains how to integrate email notifications into the admin role management server actions.

## Overview

The email notification service (`src/services/email/role-notification-service.ts`) is ready to be integrated into the `assignRole()` and `revokeRole()` server actions when they are implemented in task 4.1.

## Integration Points

### 1. Role Assignment (`assignRole` function)

After successfully updating both Cognito and DynamoDB, and creating the audit log entry, add the email notification:

```typescript
// After successful role assignment
try {
  await sendRoleChangeEmail({
    recipientEmail: targetUser.email,
    recipientName: targetUser.name || targetUser.email,
    oldRole: oldRole as UserRole,
    newRole: validatedInput.role,
    changedBy: currentUser.name || currentUser.email,
    changedByEmail: currentUser.email,
  });

  logger.info("Role assignment email sent", {
    userId: validatedInput.userId,
    role: validatedInput.role,
  });
} catch (emailError) {
  // IMPORTANT: Log but don't fail the role assignment
  // The role change has already succeeded
  logger.error("Failed to send role assignment email", emailError as Error, {
    userId: validatedInput.userId,
    role: validatedInput.role,
  });

  // Optionally, you could add a note to the response
  // message: 'Role assigned successfully (email notification may be delayed)'
}
```

### 2. Role Revocation (`revokeRole` function)

After successfully revoking the role in both Cognito and DynamoDB, and creating the audit log entry, add the email notification:

```typescript
// After successful role revocation
try {
  await sendRoleChangeEmail({
    recipientEmail: targetUser.email,
    recipientName: targetUser.name || targetUser.email,
    oldRole: oldRole as UserRole,
    newRole: "user",
    changedBy: currentUser.name || currentUser.email,
    changedByEmail: currentUser.email,
  });

  logger.info("Role revocation email sent", {
    userId: validatedInput.userId,
  });
} catch (emailError) {
  // IMPORTANT: Log but don't fail the role revocation
  // The role change has already succeeded
  logger.error("Failed to send role revocation email", emailError as Error, {
    userId: validatedInput.userId,
  });
}
```

## Key Principles

### 1. Graceful Error Handling

Email failures should **never** cause the role change to fail or rollback:

- ✅ **DO**: Wrap email sending in try-catch
- ✅ **DO**: Log email failures
- ✅ **DO**: Continue with successful response
- ❌ **DON'T**: Throw email errors to the caller
- ❌ **DON'T**: Rollback role changes on email failure

**Rationale**: The role change is the critical operation. Email is a nice-to-have notification. If SES is down or misconfigured, users should still be able to manage roles.

### 2. Use `sendRoleChangeEmail` Helper

The `sendRoleChangeEmail` function automatically determines whether to send an assignment or revocation email based on the role change:

- `user` → `admin` or `superadmin`: Sends assignment email
- `admin` or `superadmin` → `user`: Sends revocation email
- `admin` → `superadmin`: Sends assignment email (elevation)

This simplifies the integration code.

### 3. Logging

Always log email operations:

```typescript
// Success
logger.info("Role assignment email sent", { userId, role });

// Failure
logger.error("Failed to send role assignment email", error, { userId, role });
```

This helps with debugging and monitoring email delivery.

## Required Data

To send email notifications, you need:

1. **Target user information**:

   - `email`: User's email address
   - `name`: User's display name (fallback to email if not available)

2. **Role information**:

   - `oldRole`: User's previous role
   - `newRole`: User's new role

3. **Acting admin information**:
   - `name`: Admin's display name (fallback to email)
   - `email`: Admin's email address

All of this data should be available in the server action context.

## Environment Variables

Ensure these environment variables are set:

```bash
# Required: Verified sender email in AWS SES
SES_SENDER_EMAIL=noreply@bayoncoagent.com

# Required: Base URL for links in emails
NEXT_PUBLIC_APP_URL=https://app.bayoncoagent.com
```

## Testing

### Local Testing

1. **Configure LocalStack SES** (if available):

   ```bash
   # Check if SES is available in LocalStack
   aws --endpoint-url=http://localhost:4566 ses list-identities
   ```

2. **Verify sender email**:

   ```bash
   aws --endpoint-url=http://localhost:4566 ses verify-email-identity \
     --email-address noreply@bayoncoagent.com
   ```

3. **Test email sending**:
   - Assign a role to a test user
   - Check CloudWatch logs for email sending status
   - Check LocalStack logs for SES operations

### Production Testing

1. **Verify sender email in SES**:

   - Go to AWS SES Console
   - Verify the sender email address
   - Or verify the entire domain

2. **Move out of SES sandbox** (if needed):

   - Request production access in SES
   - Or verify recipient email addresses for testing

3. **Test with real email**:
   - Assign a role to a test user with a real email
   - Check that the email is received
   - Verify email formatting and links

## Troubleshooting

### Email not received

1. **Check SES configuration**:

   - Is sender email verified?
   - Is SES out of sandbox mode?
   - Are recipient emails verified (if in sandbox)?

2. **Check CloudWatch logs**:

   - Look for "Role assignment email sent" or error logs
   - Check for SES API errors

3. **Check spam folder**:
   - Emails from new senders may be marked as spam
   - Consider setting up SPF/DKIM/DMARC records

### Email sending fails

1. **Check IAM permissions**:

   - Does the Lambda/server have `ses:SendEmail` permission?

2. **Check environment variables**:

   - Is `SES_SENDER_EMAIL` set correctly?
   - Is `NEXT_PUBLIC_APP_URL` set correctly?

3. **Check SES quotas**:
   - Have you exceeded your sending quota?
   - Check SES dashboard for quota information

## Example Implementation

Here's a complete example of integrating email notifications into the `assignRole` function:

```typescript
export async function assignRole(
  input: AssignRoleInput
): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    // 1. Validate input
    const validatedInput = assignRoleSchema.parse(input);

    // 2. Authorization check
    const currentUser = await getCurrentUserServer();
    if (!currentUser || !hasSuperAdminAccess(currentUser.role)) {
      return {
        success: false,
        message: "Forbidden",
        error: "Only SuperAdmins can assign roles",
      };
    }

    // 3. Get target user
    const repository = getRepository();
    const targetUser = await repository.getUserProfile(validatedInput.userId);
    if (!targetUser) {
      return {
        success: false,
        message: "User not found",
        error: "The specified user does not exist",
      };
    }

    const oldRole = targetUser.role || "user";

    // 4. Update Cognito
    const cognitoClient = getCognitoClient();
    await cognitoClient.updateUserRole(
      validatedInput.userId,
      validatedInput.role
    );

    // 5. Update DynamoDB
    try {
      await repository.updateUserRole(
        validatedInput.userId,
        validatedInput.role,
        currentUser.userId
      );
    } catch (dbError) {
      // Rollback Cognito on DynamoDB failure
      await cognitoClient.updateUserRole(validatedInput.userId, oldRole);
      throw dbError;
    }

    // 6. Create audit log
    await repository.createRoleAuditLog({
      auditId: crypto.randomUUID(),
      timestamp: Date.now(),
      actingAdminId: currentUser.userId,
      actingAdminEmail: currentUser.email,
      affectedUserId: validatedInput.userId,
      affectedUserEmail: targetUser.email,
      oldRole,
      newRole: validatedInput.role,
      ipAddress: getClientIp(),
      userAgent: getUserAgent(),
      action: "assign",
    });

    // 7. Send email notification (graceful failure)
    try {
      await sendRoleChangeEmail({
        recipientEmail: targetUser.email,
        recipientName: targetUser.name || targetUser.email,
        oldRole: oldRole as UserRole,
        newRole: validatedInput.role,
        changedBy: currentUser.name || currentUser.email,
        changedByEmail: currentUser.email,
      });
      logger.info("Role assignment email sent", {
        userId: validatedInput.userId,
        role: validatedInput.role,
      });
    } catch (emailError) {
      logger.error(
        "Failed to send role assignment email",
        emailError as Error,
        {
          userId: validatedInput.userId,
          role: validatedInput.role,
        }
      );
      // Don't fail the operation - email is secondary
    }

    return {
      success: true,
      message: "Role assigned successfully",
    };
  } catch (error) {
    logger.error("Failed to assign role", error as Error, {
      userId: input.userId,
      role: input.role,
    });

    return {
      success: false,
      message: "Failed to assign role",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

## Validation

After integration, verify that:

- ✅ Role assignments send emails to affected users
- ✅ Role revocations send emails to affected users
- ✅ Emails contain correct information (role, admin name, etc.)
- ✅ Email failures don't prevent role changes
- ✅ Email failures are logged to CloudWatch
- ✅ Links in emails work correctly
- ✅ HTML and plain text versions render correctly

## Related Files

- **Email Service**: `src/services/email/role-notification-service.ts`
- **Server Actions**: `src/app/admin/actions.ts`
- **SES Client**: `src/aws/ses/client.ts`
- **Logger**: `src/aws/logging/logger.ts`
- **Documentation**: `src/services/email/README.md`

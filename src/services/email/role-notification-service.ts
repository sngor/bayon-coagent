/**
 * Role Notification Service
 * 
 * Handles email notifications for role changes (assignments and revocations).
 * Uses AWS SES for sending emails.
 */

import { sendEmail } from '@/aws/ses/client';
import { createLogger } from '@/aws/logging/logger';

const logger = createLogger({ service: 'role-notification' });

export type UserRole = 'user' | 'admin' | 'superadmin';

export interface RoleAssignmentEmailData {
    recipientEmail: string;
    recipientName: string;
    newRole: UserRole;
    assignedBy: string;
    assignedByEmail: string;
}

export interface RoleRevocationEmailData {
    recipientEmail: string;
    recipientName: string;
    oldRole: UserRole;
    revokedBy: string;
    revokedByEmail: string;
}

/**
 * Gets the sender email address from environment variables
 * Falls back to a default if not configured
 */
function getSenderEmail(): string {
    return process.env.SES_SENDER_EMAIL || process.env.ADMIN_EMAIL || 'noreply@bayoncoagent.com';
}

/**
 * Gets a human-readable role name
 */
function getRoleDisplayName(role: UserRole): string {
    switch (role) {
        case 'superadmin':
            return 'Super Administrator';
        case 'admin':
            return 'Administrator';
        case 'user':
            return 'User';
        default:
            return role;
    }
}

/**
 * Generates the HTML email body for role assignment
 */
function generateRoleAssignmentEmailHtml(data: RoleAssignmentEmailData): string {
    const roleDisplayName = getRoleDisplayName(data.newRole);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Role Assignment Notification</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
      border-radius: 0 0 8px 8px;
    }
    .role-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      margin: 10px 0;
    }
    .role-superadmin {
      background: #f3e8ff;
      color: #7c3aed;
    }
    .role-admin {
      background: #dbeafe;
      color: #2563eb;
    }
    .info-box {
      background: #f9fafb;
      border-left: 4px solid #667eea;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎉 Role Assignment</h1>
  </div>
  <div class="content">
    <p>Hi ${data.recipientName},</p>
    
    <p>Great news! You have been assigned a new administrative role on Bayon Coagent.</p>
    
    <div class="info-box">
      <p><strong>Your New Role:</strong></p>
      <span class="role-badge role-${data.newRole}">${roleDisplayName}</span>
    </div>
    
    <p><strong>What this means:</strong></p>
    <ul>
      ${data.newRole === 'superadmin' ? `
        <li>Full access to all administrative features</li>
        <li>Ability to manage user roles and permissions</li>
        <li>Access to audit logs and system settings</li>
        <li>Billing and security management</li>
      ` : `
        <li>Access to the admin dashboard</li>
        <li>User management capabilities</li>
        <li>Content moderation tools</li>
        <li>Platform monitoring features</li>
      `}
    </ul>
    
    <p>This role was assigned by <strong>${data.assignedBy}</strong> (${data.assignedByEmail}).</p>
    
    <p>You can start using your new privileges immediately by signing in to your account.</p>
    
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.bayoncoagent.com'}/admin" class="button">
      Go to Admin Dashboard
    </a>
    
    <p>If you have any questions about your new role or responsibilities, please contact the administrator who assigned this role.</p>
  </div>
  <div class="footer">
    <p>This is an automated notification from Bayon Coagent.</p>
    <p>© ${new Date().getFullYear()} Bayon Coagent. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generates the plain text email body for role assignment
 */
function generateRoleAssignmentEmailText(data: RoleAssignmentEmailData): string {
    const roleDisplayName = getRoleDisplayName(data.newRole);

    return `
Hi ${data.recipientName},

Great news! You have been assigned a new administrative role on Bayon Coagent.

Your New Role: ${roleDisplayName}

What this means:
${data.newRole === 'superadmin' ? `
- Full access to all administrative features
- Ability to manage user roles and permissions
- Access to audit logs and system settings
- Billing and security management
` : `
- Access to the admin dashboard
- User management capabilities
- Content moderation tools
- Platform monitoring features
`}

This role was assigned by ${data.assignedBy} (${data.assignedByEmail}).

You can start using your new privileges immediately by signing in to your account.

Admin Dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'https://app.bayoncoagent.com'}/admin

If you have any questions about your new role or responsibilities, please contact the administrator who assigned this role.

---
This is an automated notification from Bayon Coagent.
© ${new Date().getFullYear()} Bayon Coagent. All rights reserved.
  `.trim();
}

/**
 * Generates the HTML email body for role revocation
 */
function generateRoleRevocationEmailHtml(data: RoleRevocationEmailData): string {
    const roleDisplayName = getRoleDisplayName(data.oldRole);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Role Revocation Notification</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%);
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      background: #ffffff;
      padding: 30px;
      border: 1px solid #e5e7eb;
      border-top: none;
      border-radius: 0 0 8px 8px;
    }
    .role-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      margin: 10px 0;
    }
    .role-superadmin {
      background: #fee2e2;
      color: #dc2626;
    }
    .role-admin {
      background: #fef3c7;
      color: #d97706;
    }
    .info-box {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background: #667eea;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Role Change Notification</h1>
  </div>
  <div class="content">
    <p>Hi ${data.recipientName},</p>
    
    <p>This is to inform you that your administrative role on Bayon Coagent has been changed.</p>
    
    <div class="info-box">
      <p><strong>Previous Role:</strong></p>
      <span class="role-badge role-${data.oldRole}">${roleDisplayName}</span>
      <p style="margin-top: 10px;"><strong>New Role:</strong> User (Standard Access)</p>
    </div>
    
    <p><strong>What this means:</strong></p>
    <ul>
      <li>You no longer have access to administrative features</li>
      <li>Your account has been returned to standard user access</li>
      <li>All your personal data and content remain intact</li>
      <li>You can continue using all standard platform features</li>
    </ul>
    
    <p>This change was made by <strong>${data.revokedBy}</strong> (${data.revokedByEmail}).</p>
    
    <p>If you believe this change was made in error or have questions, please contact the administrator.</p>
    
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.bayoncoagent.com'}/dashboard" class="button">
      Go to Dashboard
    </a>
  </div>
  <div class="footer">
    <p>This is an automated notification from Bayon Coagent.</p>
    <p>© ${new Date().getFullYear()} Bayon Coagent. All rights reserved.</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generates the plain text email body for role revocation
 */
function generateRoleRevocationEmailText(data: RoleRevocationEmailData): string {
    const roleDisplayName = getRoleDisplayName(data.oldRole);

    return `
Hi ${data.recipientName},

This is to inform you that your administrative role on Bayon Coagent has been changed.

Previous Role: ${roleDisplayName}
New Role: User (Standard Access)

What this means:
- You no longer have access to administrative features
- Your account has been returned to standard user access
- All your personal data and content remain intact
- You can continue using all standard platform features

This change was made by ${data.revokedBy} (${data.revokedByEmail}).

If you believe this change was made in error or have questions, please contact the administrator.

Dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'https://app.bayoncoagent.com'}/dashboard

---
This is an automated notification from Bayon Coagent.
© ${new Date().getFullYear()} Bayon Coagent. All rights reserved.
  `.trim();
}

/**
 * Sends a role assignment notification email
 * 
 * @param data - Role assignment email data
 * @returns Promise that resolves when email is sent
 * @throws Error if email sending fails (caller should handle gracefully)
 */
export async function sendRoleAssignmentEmail(data: RoleAssignmentEmailData): Promise<void> {
    try {
        logger.info('Sending role assignment email', {
            recipientEmail: data.recipientEmail,
            newRole: data.newRole,
            assignedBy: data.assignedByEmail,
        });

        const subject = `You've been assigned the ${getRoleDisplayName(data.newRole)} role`;
        const htmlBody = generateRoleAssignmentEmailHtml(data);
        const textBody = generateRoleAssignmentEmailText(data);
        const senderEmail = getSenderEmail();

        // Send HTML email (SES will use HTML by default)
        await sendEmail(
            data.recipientEmail,
            subject,
            htmlBody,
            senderEmail,
            true // isHtml
        );

        logger.info('Role assignment email sent successfully', {
            recipientEmail: data.recipientEmail,
            newRole: data.newRole,
        });
    } catch (error) {
        logger.error('Failed to send role assignment email', error as Error, {
            recipientEmail: data.recipientEmail,
            newRole: data.newRole,
        });

        // Re-throw the error so caller can handle it
        throw error;
    }
}

/**
 * Sends a role revocation notification email
 * 
 * @param data - Role revocation email data
 * @returns Promise that resolves when email is sent
 * @throws Error if email sending fails (caller should handle gracefully)
 */
export async function sendRoleRevocationEmail(data: RoleRevocationEmailData): Promise<void> {
    try {
        logger.info('Sending role revocation email', {
            recipientEmail: data.recipientEmail,
            oldRole: data.oldRole,
            revokedBy: data.revokedByEmail,
        });

        const subject = 'Your administrative role has been changed';
        const htmlBody = generateRoleRevocationEmailHtml(data);
        const textBody = generateRoleRevocationEmailText(data);
        const senderEmail = getSenderEmail();

        // Send HTML email
        await sendEmail(
            data.recipientEmail,
            subject,
            htmlBody,
            senderEmail,
            true // isHtml
        );

        logger.info('Role revocation email sent successfully', {
            recipientEmail: data.recipientEmail,
            oldRole: data.oldRole,
        });
    } catch (error) {
        logger.error('Failed to send role revocation email', error as Error, {
            recipientEmail: data.recipientEmail,
            oldRole: data.oldRole,
        });

        // Re-throw the error so caller can handle it
        throw error;
    }
}

/**
 * Sends a role change notification email (wrapper that determines assignment vs revocation)
 * 
 * @param data - Combined role change data
 * @returns Promise that resolves when email is sent
 */
export async function sendRoleChangeEmail(data: {
    recipientEmail: string;
    recipientName: string;
    oldRole: UserRole;
    newRole: UserRole;
    changedBy: string;
    changedByEmail: string;
}): Promise<void> {
    // Determine if this is an assignment (elevation) or revocation (demotion)
    const isElevation = data.newRole !== 'user' && data.oldRole === 'user';
    const isDemotion = data.newRole === 'user' && data.oldRole !== 'user';

    if (isElevation) {
        // This is a role assignment
        await sendRoleAssignmentEmail({
            recipientEmail: data.recipientEmail,
            recipientName: data.recipientName,
            newRole: data.newRole,
            assignedBy: data.changedBy,
            assignedByEmail: data.changedByEmail,
        });
    } else if (isDemotion) {
        // This is a role revocation
        await sendRoleRevocationEmail({
            recipientEmail: data.recipientEmail,
            recipientName: data.recipientName,
            oldRole: data.oldRole,
            revokedBy: data.changedBy,
            revokedByEmail: data.changedByEmail,
        });
    } else {
        // This is a role change between admin levels (e.g., admin -> superadmin)
        // Treat as assignment to the new role
        await sendRoleAssignmentEmail({
            recipientEmail: data.recipientEmail,
            recipientName: data.recipientName,
            newRole: data.newRole,
            assignedBy: data.changedBy,
            assignedByEmail: data.changedByEmail,
        });
    }
}

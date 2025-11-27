import { sendEmail } from '@/aws/ses/client';
import { getConfig } from '@/aws/config';

interface SendInvitationEmailParams {
    to: string;
    inviterName: string;
    organizationName: string;
    invitationLink: string;
    role: string;
}

/**
 * Sends an invitation email to a user to join an organization.
 */
export async function sendInvitationEmail({
    to,
    inviterName,
    organizationName,
    invitationLink,
    role
}: SendInvitationEmailParams): Promise<void> {
    const config = getConfig();
    const from = config.ses.fromEmail;
    const subject = `You've been invited to join ${organizationName} on Bayon Coagent`;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invitation to join ${organizationName}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .content { background-color: #f9f9f9; padding: 30px; border-radius: 8px; }
        .button { display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Bayon Coagent</h1>
        </div>
        <div class="content">
            <h2>Hello!</h2>
            <p><strong>${inviterName}</strong> has invited you to join the organization <strong>${organizationName}</strong> as a <strong>${role}</strong>.</p>
            <p>Click the button below to accept the invitation and get started:</p>
            <div style="text-align: center;">
                <a href="${invitationLink}" class="button">Accept Invitation</a>
            </div>
            <p style="margin-top: 30px;">Or copy and paste this link into your browser:</p>
            <p><a href="${invitationLink}">${invitationLink}</a></p>
            <p>This invitation will expire in 7 days.</p>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Bayon Coagent. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;

    try {
        await sendEmail(to, subject, htmlBody, from);
        console.log(`Invitation email sent to ${to}`);
    } catch (error) {
        console.error('Failed to send invitation email:', error);
        // We don't throw here to avoid failing the whole transaction if email fails,
        // but in a production system we might want to handle this differently (e.g. queueing)
    }
}

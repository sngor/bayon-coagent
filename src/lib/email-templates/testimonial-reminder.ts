/**
 * Testimonial Email Templates
 * 
 * Email templates for testimonial requests and reminders
 */

export interface TestimonialEmailData {
    clientName: string;
    agentName: string;
    agencyName?: string;
    submissionLink: string;
    expiresAt: string;
}

/**
 * Generates the initial testimonial request email
 */
export function generateTestimonialRequestEmail(data: TestimonialEmailData): {
    subject: string;
    html: string;
    text: string;
} {
    const { clientName, agentName, agencyName, submissionLink, expiresAt } = data;
    const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

    const subject = `${agentName} would love your feedback`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
    <h1 style="color: #2563eb; margin-bottom: 20px;">Hi ${clientName},</h1>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Thank you for choosing ${agentName}${agencyName ? ` at ${agencyName}` : ''} for your real estate needs. 
      Your experience matters to us, and we'd love to hear about it!
    </p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Would you take a moment to share your thoughts? Your testimonial helps others make informed decisions 
      and helps us continue to improve our service.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${submissionLink}" 
         style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">
        Share Your Experience
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      This link will expire on ${expiryDate}. If you have any questions, please don't hesitate to reach out.
    </p>
    
    <p style="font-size: 16px; margin-top: 30px;">
      Thank you,<br>
      <strong>${agentName}</strong>
      ${agencyName ? `<br>${agencyName}` : ''}
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
    <p>This is an automated email. Please do not reply to this message.</p>
  </div>
</body>
</html>
  `.trim();

    const text = `
Hi ${clientName},

Thank you for choosing ${agentName}${agencyName ? ` at ${agencyName}` : ''} for your real estate needs. Your experience matters to us, and we'd love to hear about it!

Would you take a moment to share your thoughts? Your testimonial helps others make informed decisions and helps us continue to improve our service.

Share your experience here: ${submissionLink}

This link will expire on ${expiryDate}. If you have any questions, please don't hesitate to reach out.

Thank you,
${agentName}
${agencyName || ''}

---
This is an automated email. Please do not reply to this message.
  `.trim();

    return { subject, html, text };
}

/**
 * Generates the reminder email for pending testimonial requests
 */
export function generateTestimonialReminderEmail(data: TestimonialEmailData): {
    subject: string;
    html: string;
    text: string;
} {
    const { clientName, agentName, agencyName, submissionLink, expiresAt } = data;
    const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

    const subject = `Reminder: Share your experience with ${agentName}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
    <h1 style="color: #2563eb; margin-bottom: 20px;">Hi ${clientName},</h1>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      We noticed you haven't had a chance to share your experience with ${agentName}${agencyName ? ` at ${agencyName}` : ''} yet. 
      Your feedback would mean a lot!
    </p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      It only takes a few minutes, and your testimonial helps others in their real estate journey.
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${submissionLink}" 
         style="background-color: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">
        Share Your Experience Now
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      <strong>Reminder:</strong> This link will expire on ${expiryDate}.
    </p>
    
    <p style="font-size: 16px; margin-top: 30px;">
      Thank you for your time,<br>
      <strong>${agentName}</strong>
      ${agencyName ? `<br>${agencyName}` : ''}
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
    <p>This is an automated reminder. Please do not reply to this message.</p>
  </div>
</body>
</html>
  `.trim();

    const text = `
Hi ${clientName},

We noticed you haven't had a chance to share your experience with ${agentName}${agencyName ? ` at ${agencyName}` : ''} yet. Your feedback would mean a lot!

It only takes a few minutes, and your testimonial helps others in their real estate journey.

Share your experience here: ${submissionLink}

Reminder: This link will expire on ${expiryDate}.

Thank you for your time,
${agentName}
${agencyName || ''}

---
This is an automated reminder. Please do not reply to this message.
  `.trim();

    return { subject, html, text };
}

/**
 * Generates the submission confirmation email
 */
export function generateTestimonialConfirmationEmail(data: {
    clientName: string;
    agentName: string;
    agencyName?: string;
}): {
    subject: string;
    html: string;
    text: string;
} {
    const { clientName, agentName, agencyName } = data;

    const subject = `Thank you for your testimonial!`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 48px;">✅</div>
    </div>
    
    <h1 style="color: #2563eb; margin-bottom: 20px; text-align: center;">Thank You, ${clientName}!</h1>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Your testimonial has been successfully submitted. ${agentName} truly appreciates you taking the time 
      to share your experience.
    </p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Your feedback helps others make informed decisions and helps us continue to provide excellent service.
    </p>
    
    <p style="font-size: 16px; margin-top: 30px;">
      With gratitude,<br>
      <strong>${agentName}</strong>
      ${agencyName ? `<br>${agencyName}` : ''}
    </p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
    <p>This is an automated confirmation. Please do not reply to this message.</p>
  </div>
</body>
</html>
  `.trim();

    const text = `
Thank You, ${clientName}!

Your testimonial has been successfully submitted. ${agentName} truly appreciates you taking the time to share your experience.

Your feedback helps others make informed decisions and helps us continue to provide excellent service.

With gratitude,
${agentName}
${agencyName || ''}

---
This is an automated confirmation. Please do not reply to this message.
  `.trim();

    return { subject, html, text };
}

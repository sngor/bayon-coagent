/**
 * AWS SES Client Module
 * 
 * This module provides SES email operations including:
 * - Sending individual emails
 * - Sending bulk emails
 * - Template management
 * - Email verification
 */

import {
    SESClient,
    SendEmailCommand,
    SendBulkTemplatedEmailCommand,
    CreateTemplateCommand,
    UpdateTemplateCommand,
    DeleteTemplateCommand,
    GetTemplateCommand,
    ListTemplatesCommand,
    VerifyEmailIdentityCommand,
    type SendEmailCommandInput,
    type SendBulkTemplatedEmailCommandInput,
    type CreateTemplateCommandInput,
    type Template,
} from '@aws-sdk/client-ses';
import { getConfig, getAWSCredentials } from '../config';

let sesClient: SESClient | null = null;

/**
 * Gets or creates the SES client instance
 */
export function getSESClient(): SESClient {
    if (!sesClient) {
        const config = getConfig();
        const credentials = getAWSCredentials();

        sesClient = new SESClient({
            region: config.region,
            credentials: credentials.accessKeyId && credentials.secretAccessKey
                ? credentials
                : undefined,
        });
    }

    return sesClient;
}

/**
 * Resets the SES client instance
 * Useful for testing or when configuration changes
 */
export function resetSESClient(): void {
    sesClient = null;
}

/**
 * Sends a simple email
 * 
 * @param to - Recipient email address(es)
 * @param subject - Email subject
 * @param body - Email body (HTML or text)
 * @param from - Sender email address (must be verified in SES)
 * @param isHtml - Whether the body is HTML (default: true)
 * @returns Message ID from SES
 */
export async function sendEmail(
    to: string | string[],
    subject: string,
    body: string,
    from: string,
    isHtml: boolean = true
): Promise<string> {
    const client = getSESClient();

    const destinations = Array.isArray(to) ? to : [to];

    const command = new SendEmailCommand({
        Source: from,
        Destination: {
            ToAddresses: destinations,
        },
        Message: {
            Subject: {
                Data: subject,
                Charset: 'UTF-8',
            },
            Body: isHtml
                ? {
                    Html: {
                        Data: body,
                        Charset: 'UTF-8',
                    },
                }
                : {
                    Text: {
                        Data: body,
                        Charset: 'UTF-8',
                    },
                },
        },
    });

    const response = await client.send(command);
    return response.MessageId || '';
}

/**
 * Sends a templated email to multiple recipients
 * 
 * @param templateName - Name of the SES template
 * @param from - Sender email address (must be verified in SES)
 * @param destinations - Array of recipient data with email and template data
 * @param defaultTemplateData - Default template data for all recipients
 * @returns Array of message IDs from SES
 */
export async function sendBulkTemplatedEmail(
    templateName: string,
    from: string,
    destinations: Array<{
        email: string;
        templateData?: Record<string, any>;
    }>,
    defaultTemplateData?: Record<string, any>
): Promise<string[]> {
    const client = getSESClient();

    const command = new SendBulkTemplatedEmailCommand({
        Source: from,
        Template: templateName,
        DefaultTemplateData: defaultTemplateData ? JSON.stringify(defaultTemplateData) : '{}',
        Destinations: destinations.map(dest => ({
            Destination: {
                ToAddresses: [dest.email],
            },
            ReplacementTemplateData: dest.templateData ? JSON.stringify(dest.templateData) : '{}',
        })),
    });

    const response = await client.send(command);
    // SendBulkTemplatedEmailCommand doesn't return MessageId in the same way
    // It returns status information for each destination
    return response.Status?.map(status => status.MessageId || '').filter(Boolean) || [];
}

/**
 * Creates an email template in SES
 * 
 * @param templateName - Name of the template
 * @param subject - Email subject template
 * @param htmlBody - HTML body template
 * @param textBody - Text body template (optional)
 */
export async function createEmailTemplate(
    templateName: string,
    subject: string,
    htmlBody: string,
    textBody?: string
): Promise<void> {
    const client = getSESClient();

    const template: Template = {
        TemplateName: templateName,
        SubjectPart: subject,
        HtmlPart: htmlBody,
        TextPart: textBody,
    };

    const command = new CreateTemplateCommand({
        Template: template,
    });

    await client.send(command);
}

/**
 * Updates an existing email template in SES
 * 
 * @param templateName - Name of the template
 * @param subject - Email subject template
 * @param htmlBody - HTML body template
 * @param textBody - Text body template (optional)
 */
export async function updateEmailTemplate(
    templateName: string,
    subject: string,
    htmlBody: string,
    textBody?: string
): Promise<void> {
    const client = getSESClient();

    const template: Template = {
        TemplateName: templateName,
        SubjectPart: subject,
        HtmlPart: htmlBody,
        TextPart: textBody,
    };

    const command = new UpdateTemplateCommand({
        Template: template,
    });

    await client.send(command);
}

/**
 * Deletes an email template from SES
 * 
 * @param templateName - Name of the template to delete
 */
export async function deleteEmailTemplate(templateName: string): Promise<void> {
    const client = getSESClient();

    const command = new DeleteTemplateCommand({
        TemplateName: templateName,
    });

    await client.send(command);
}

/**
 * Gets an email template from SES
 * 
 * @param templateName - Name of the template
 * @returns Template object
 */
export async function getEmailTemplate(templateName: string): Promise<Template> {
    const client = getSESClient();

    const command = new GetTemplateCommand({
        TemplateName: templateName,
    });

    const response = await client.send(command);
    if (!response.Template) {
        throw new Error(`Template ${templateName} not found`);
    }
    return response.Template;
}

/**
 * Lists all email templates in SES
 * 
 * @param maxItems - Maximum number of templates to return (default: 50)
 * @returns Array of template metadata
 */
export async function listEmailTemplates(maxItems: number = 50): Promise<Array<{
    name: string;
    createdTimestamp?: Date;
}>> {
    const client = getSESClient();

    const command = new ListTemplatesCommand({
        MaxItems: maxItems,
    });

    const response = await client.send(command);

    return response.TemplatesMetadata?.map(template => ({
        name: template.Name || '',
        createdTimestamp: template.CreatedTimestamp,
    })) || [];
}

/**
 * Verifies an email address for sending
 * 
 * @param email - Email address to verify
 */
export async function verifyEmailAddress(email: string): Promise<void> {
    const client = getSESClient();

    const command = new VerifyEmailIdentityCommand({
        EmailAddress: email,
    });

    await client.send(command);
}

/**
 * Checks if an email template exists
 * 
 * @param templateName - Name of the template
 * @returns True if template exists, false otherwise
 */
export async function templateExists(templateName: string): Promise<boolean> {
    try {
        await getEmailTemplate(templateName);
        return true;
    } catch (error: any) {
        if (error.name === 'TemplateDoesNotExistException') {
            return false;
        }
        throw error;
    }
}

/**
 * Creates or updates an email template
 * 
 * @param templateName - Name of the template
 * @param subject - Email subject template
 * @param htmlBody - HTML body template
 * @param textBody - Text body template (optional)
 */
export async function upsertEmailTemplate(
    templateName: string,
    subject: string,
    htmlBody: string,
    textBody?: string
): Promise<void> {
    const exists = await templateExists(templateName);

    if (exists) {
        await updateEmailTemplate(templateName, subject, htmlBody, textBody);
    } else {
        await createEmailTemplate(templateName, subject, htmlBody, textBody);
    }
}
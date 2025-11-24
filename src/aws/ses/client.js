"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSESClient = getSESClient;
exports.resetSESClient = resetSESClient;
exports.sendEmail = sendEmail;
exports.sendBulkTemplatedEmail = sendBulkTemplatedEmail;
exports.createEmailTemplate = createEmailTemplate;
exports.updateEmailTemplate = updateEmailTemplate;
exports.deleteEmailTemplate = deleteEmailTemplate;
exports.getEmailTemplate = getEmailTemplate;
exports.listEmailTemplates = listEmailTemplates;
exports.verifyEmailAddress = verifyEmailAddress;
exports.templateExists = templateExists;
exports.upsertEmailTemplate = upsertEmailTemplate;
const client_ses_1 = require("@aws-sdk/client-ses");
const config_1 = require("../config");
let sesClient = null;
function getSESClient() {
    if (!sesClient) {
        const config = (0, config_1.getConfig)();
        const credentials = (0, config_1.getAWSCredentials)();
        sesClient = new client_ses_1.SESClient({
            region: config.region,
            credentials: credentials.accessKeyId && credentials.secretAccessKey
                ? credentials
                : undefined,
        });
    }
    return sesClient;
}
function resetSESClient() {
    sesClient = null;
}
async function sendEmail(to, subject, body, from, isHtml = true) {
    const client = getSESClient();
    const destinations = Array.isArray(to) ? to : [to];
    const command = new client_ses_1.SendEmailCommand({
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
async function sendBulkTemplatedEmail(templateName, from, destinations, defaultTemplateData) {
    const client = getSESClient();
    const command = new client_ses_1.SendBulkTemplatedEmailCommand({
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
    return response.Status?.map(status => status.MessageId || '').filter(Boolean) || [];
}
async function createEmailTemplate(templateName, subject, htmlBody, textBody) {
    const client = getSESClient();
    const template = {
        TemplateName: templateName,
        SubjectPart: subject,
        HtmlPart: htmlBody,
        TextPart: textBody,
    };
    const command = new client_ses_1.CreateTemplateCommand({
        Template: template,
    });
    await client.send(command);
}
async function updateEmailTemplate(templateName, subject, htmlBody, textBody) {
    const client = getSESClient();
    const template = {
        TemplateName: templateName,
        SubjectPart: subject,
        HtmlPart: htmlBody,
        TextPart: textBody,
    };
    const command = new client_ses_1.UpdateTemplateCommand({
        Template: template,
    });
    await client.send(command);
}
async function deleteEmailTemplate(templateName) {
    const client = getSESClient();
    const command = new client_ses_1.DeleteTemplateCommand({
        TemplateName: templateName,
    });
    await client.send(command);
}
async function getEmailTemplate(templateName) {
    const client = getSESClient();
    const command = new client_ses_1.GetTemplateCommand({
        TemplateName: templateName,
    });
    const response = await client.send(command);
    if (!response.Template) {
        throw new Error(`Template ${templateName} not found`);
    }
    return response.Template;
}
async function listEmailTemplates(maxItems = 50) {
    const client = getSESClient();
    const command = new client_ses_1.ListTemplatesCommand({
        MaxItems: maxItems,
    });
    const response = await client.send(command);
    return response.TemplatesMetadata?.map(template => ({
        name: template.Name || '',
        createdTimestamp: template.CreatedTimestamp,
    })) || [];
}
async function verifyEmailAddress(email) {
    const client = getSESClient();
    const command = new client_ses_1.VerifyEmailIdentityCommand({
        EmailAddress: email,
    });
    await client.send(command);
}
async function templateExists(templateName) {
    try {
        await getEmailTemplate(templateName);
        return true;
    }
    catch (error) {
        if (error.name === 'TemplateDoesNotExistException') {
            return false;
        }
        throw error;
    }
}
async function upsertEmailTemplate(templateName, subject, htmlBody, textBody) {
    const exists = await templateExists(templateName);
    if (exists) {
        await updateEmailTemplate(templateName, subject, htmlBody, textBody);
    }
    else {
        await createEmailTemplate(templateName, subject, htmlBody, textBody);
    }
}

/**
 * AWS Lambda Function for Trial Notifications
 * 
 * This function runs daily via EventBridge to send trial expiry notifications.
 * Much better than third-party cron services.
 */

import { Handler } from 'aws-lambda';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-west-2' });
const sesClient = new SESClient({ region: process.env.SES_REGION || process.env.AWS_REGION || 'us-west-2' });

interface TrialNotificationEvent {
  source: string;
  'detail-type': string;
  detail: any;
}

export const handler: Handler<TrialNotificationEvent> = async (event, context) => {
  console.log('Trial notifications Lambda triggered:', JSON.stringify(event, null, 2));

  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + (3 * 24 * 60 * 60 * 1000));
    const oneDayFromNow = new Date(now.getTime() + (1 * 24 * 60 * 60 * 1000));

    // Scan for users with trials expiring in 3 days or 1 day
    const scanCommand = new ScanCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME,
      FilterExpression: 'begins_with(SK, :sk) AND attribute_exists(#data.#trialEndsAt)',
      ExpressionAttributeNames: {
        '#data': 'Data',
        '#trialEndsAt': 'trialEndsAt',
      },
      ExpressionAttributeValues: {
        ':sk': { S: 'SUBSCRIPTION' },
      },
    });

    const result = await dynamoClient.send(scanCommand);
    const notifications = [];

    if (result.Items) {
      for (const item of result.Items) {
        const userId = item.PK?.S?.replace('USER#', '');
        const subscriptionData = item.Data?.M;
        const trialEndsAt = subscriptionData?.trialEndsAt?.S;

        if (!userId || !trialEndsAt) continue;

        const trialEndDate = new Date(trialEndsAt);
        const daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

        // Send notification for 3-day and 1-day warnings
        if (daysRemaining === 3 || daysRemaining === 1) {
          // Get user profile for email
          const userProfile = await getUserProfile(userId);
          if (userProfile?.email) {
            await sendTrialExpiryNotification(userProfile.email, userProfile.name, daysRemaining, trialEndDate);
            notifications.push({ userId, email: userProfile.email, daysRemaining });
          }
        }

        // Handle expired trials
        if (daysRemaining <= 0) {
          await handleExpiredTrial(userId);
          notifications.push({ userId, action: 'expired' });
        }
      }
    }

    console.log(`Processed ${notifications.length} trial notifications`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        processed: notifications.length,
        notifications,
      }),
    };

  } catch (error) {
    console.error('Error processing trial notifications:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};

async function getUserProfile(userId: string) {
  try {
    const scanCommand = new ScanCommand({
      TableName: process.env.DYNAMODB_TABLE_NAME,
      FilterExpression: 'PK = :pk AND SK = :sk',
      ExpressionAttributeValues: {
        ':pk': { S: `USER#${userId}` },
        ':sk': { S: 'PROFILE' },
      },
    });

    const result = await dynamoClient.send(scanCommand);
    const item = result.Items?.[0];
    
    if (!item?.Data?.M) return null;

    return {
      email: item.Data.M.email?.S,
      name: item.Data.M.firstName?.S || item.Data.M.name?.S || 'there',
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

async function sendTrialExpiryNotification(email: string, name: string, daysRemaining: number, trialEndDate: Date) {
  const subject = `Your Bayon CoAgent trial expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`;
  const upgradeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/settings?upgrade=true`;
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e1e5e9; }
            .btn { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .highlight { background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⏰ Your Trial is Ending Soon</h1>
            </div>
            <div class="content">
                <p>Hi ${name},</p>
                
                <div class="highlight">
                    <strong>Your 7-day free trial expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} (${trialEndDate.toLocaleDateString()})</strong>
                </div>
                
                <p>Don't lose access to unlimited AI content generation, image enhancements, research reports, and marketing plans!</p>
                
                <div style="text-align: center;">
                    <a href="${upgradeUrl}" class="btn">Continue with Professional Plan</a>
                </div>
                
                <p>Questions? Reply to this email or visit our support center.</p>
                
                <p>Best regards,<br>The Bayon CoAgent Team</p>
            </div>
        </div>
    </body>
    </html>
  `;

  const textBody = `
Hi ${name},

Your 7-day free trial expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} (${trialEndDate.toLocaleDateString()}).

Don't lose access to unlimited AI content generation, image enhancements, research reports, and marketing plans!

Continue with Professional Plan: ${upgradeUrl}

Best regards,
The Bayon CoAgent Team
  `;

  const command = new SendEmailCommand({
    Source: process.env.FROM_EMAIL || 'noreply@bayoncoagent.app',
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: 'UTF-8',
        },
        Text: {
          Data: textBody,
          Charset: 'UTF-8',
        },
      },
    },
  });

  await sesClient.send(command);
  console.log(`Trial expiry notification sent to ${email}`);
}

async function handleExpiredTrial(userId: string) {
  // Update subscription status to expired/free tier
  // This would be implemented based on your DynamoDB structure
  console.log(`Handling expired trial for user ${userId}`);
}
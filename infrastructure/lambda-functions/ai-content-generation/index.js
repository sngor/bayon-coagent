/**
 * AI Content Generation Lambda Function
 * Handles content generation requests for Studio Write features
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const bedrockClient = new BedrockRuntimeClient({ region: process.env.BEDROCK_REGION });

exports.handler = async (event) => {
    console.log('AI Content Generation Request:', JSON.stringify(event, null, 2));

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            },
            body: '',
        };
    }

    try {
        // Parse request body
        const requestBody = JSON.parse(event.body || '{}');
        const { type, input } = requestBody;

        // Validate request
        if (!type || !input) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify({
                    success: false,
                    error: {
                        code: 'INVALID_REQUEST',
                        message: 'Type and input are required'
                    }
                }),
            };
        }

        // Generate content based on type
        let result;
        switch (type) {
            case 'blog-post':
                result = await generateBlogPost(input);
                break;
            case 'social-media-post':
                result = await generateSocialPost(input);
                break;
            case 'video-script':
                result = await generateVideoScript(input);
                break;
            case 'market-update':
                result = await generateMarketUpdate(input);
                break;
            case 'neighborhood-guide':
                result = await generateNeighborhoodGuide(input);
                break;
            default:
                throw new Error(`Unsupported content type: ${type}`);
        }

        // Save to DynamoDB (optional - for tracking)
        const userId = getUserIdFromEvent(event);
        if (userId && result) {
            await saveContentGeneration(userId, type, input, result);
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                success: true,
                data: result,
            }),
        };

    } catch (error) {
        console.error('Content generation error:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                success: false,
                error: {
                    code: 'GENERATION_FAILED',
                    message: error.message
                }
            }),
        };
    }
};

// Helper function to generate blog post
async function generateBlogPost(input) {
    const { topic, audience, tone, keywords } = input;

    const prompt = `Write a professional blog post for a real estate agent about "${topic}".
    
Target audience: ${audience}
Tone: ${tone}
Keywords to include: ${keywords || 'N/A'}

Please create an engaging blog post with:
1. Compelling headline
2. Introduction that hooks the reader
3. 3-4 main sections with valuable insights
4. Conclusion with call-to-action
5. SEO-optimized content

Format as JSON with: { "title": "...", "content": "...", "metaDescription": "..." }`;

    const response = await invokeBedrockModel(prompt);
    return JSON.parse(response);
}

// Helper function to generate social media post
async function generateSocialPost(input) {
    const { platform, topic, tone, includeHashtags } = input;

    const prompt = `Create a ${platform} post for a real estate agent about "${topic}".
    
Tone: ${tone}
Include hashtags: ${includeHashtags ? 'Yes' : 'No'}

Requirements:
- Engaging and professional
- Appropriate length for ${platform}
- Include relevant real estate hashtags if requested
- Call-to-action for engagement

Format as JSON with: { "content": "...", "hashtags": [...] }`;

    const response = await invokeBedrockModel(prompt);
    return JSON.parse(response);
}

// Helper function to generate video script
async function generateVideoScript(input) {
    const { topic, duration, style } = input;

    const prompt = `Write a ${duration}-minute video script for a real estate agent about "${topic}".
    
Style: ${style}

Include:
1. Hook (first 5 seconds)
2. Introduction
3. Main content points
4. Call-to-action
5. Closing

Format as JSON with: { "title": "...", "script": "...", "duration": "${duration}", "keyPoints": [...] }`;

    const response = await invokeBedrockModel(prompt);
    return JSON.parse(response);
}

// Helper function to generate market update
async function generateMarketUpdate(input) {
    const { location, timeframe, focus } = input;

    const prompt = `Create a ${timeframe} market update for ${location} focusing on ${focus}.
    
Include:
1. Market overview
2. Key statistics and trends
3. What this means for buyers/sellers
4. Professional insights
5. Call-to-action

Format as JSON with: { "title": "...", "content": "...", "keyStats": [...], "insights": [...] }`;

    const response = await invokeBedrockModel(prompt);
    return JSON.parse(response);
}

// Helper function to generate neighborhood guide
async function generateNeighborhoodGuide(input) {
    const { neighborhood, focus } = input;

    const prompt = `Create a comprehensive neighborhood guide for ${neighborhood}.
    
Focus areas: ${focus}

Include:
1. Neighborhood overview
2. Demographics and lifestyle
3. Schools and amenities
4. Transportation and accessibility
5. Market trends and pricing
6. Why it's great for different buyer types

Format as JSON with: { "title": "...", "sections": [{"heading": "...", "content": "..."}], "highlights": [...] }`;

    const response = await invokeBedrockModel(prompt);
    return JSON.parse(response);
}

// Helper function to invoke Bedrock model
async function invokeBedrockModel(prompt) {
    const modelId = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0';

    const payload = {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 4000,
        messages: [
            {
                role: "user",
                content: prompt
            }
        ]
    };

    const command = new InvokeModelCommand({
        modelId,
        body: JSON.stringify(payload),
        contentType: 'application/json',
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    return responseBody.content[0].text;
}

// Helper function to extract user ID from event
function getUserIdFromEvent(event) {
    try {
        // Extract from JWT token in Authorization header
        const authHeader = event.headers.Authorization || event.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            // In production, you'd verify the JWT and extract the user ID
            // For now, return a placeholder
            return 'user-from-jwt';
        }
        return null;
    } catch (error) {
        console.error('Error extracting user ID:', error);
        return null;
    }
}

// Helper function to save content generation record
async function saveContentGeneration(userId, type, input, result) {
    try {
        const item = {
            PK: `USER#${userId}`,
            SK: `CONTENT#${Date.now()}`,
            EntityType: 'ContentGeneration',
            Data: {
                type,
                input,
                result,
                createdAt: new Date().toISOString(),
            },
            CreatedAt: Date.now(),
            UpdatedAt: Date.now(),
        };

        const command = new PutCommand({
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Item: item,
        });

        await docClient.send(command);
    } catch (error) {
        console.error('Error saving content generation:', error);
        // Don't throw - this is optional tracking
    }
}
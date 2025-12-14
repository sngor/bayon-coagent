/**
 * AI Brand Analysis Lambda Function
 * Handles Brand Hub features: competitor analysis, bio generation, and marketing plans
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const bedrockClient = new BedrockRuntimeClient({ region: process.env.BEDROCK_REGION });

exports.handler = async (event) => {
    console.log('AI Brand Analysis Request:', JSON.stringify(event, null, 2));

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

        // Generate brand analysis based on type
        let result;
        switch (type) {
            case 'find-competitors':
                result = await findCompetitors(input);
                break;
            case 'agent-bio':
                result = await generateAgentBio(input);
                break;
            case 'marketing-plan':
                result = await generateMarketingPlan(input);
                break;
            case 'enrich-competitor':
                result = await enrichCompetitorData(input);
                break;
            case 'nap-audit':
                result = await runNapAudit(input);
                break;
            default:
                throw new Error(`Unsupported brand analysis type: ${type}`);
        }

        // Save to DynamoDB (optional - for tracking)
        const userId = getUserIdFromEvent(event);
        if (userId && result) {
            await saveBrandAnalysis(userId, type, input, result);
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
        console.error('Brand analysis error:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                success: false,
                error: {
                    code: 'ANALYSIS_FAILED',
                    message: error.message
                }
            }),
        };
    }
};

// Helper function to find competitors
async function findCompetitors(input) {
    const { name, agencyName, address } = input;

    const prompt = `You are a real estate market analyst. Find top competitors for this agent:

Agent: ${name}
Agency: ${agencyName}  
Location: ${address}

Analyze the local real estate market and identify 5-8 top competing agents in this area. For each competitor, provide:

1. Agent name
2. Agency/brokerage name
3. Estimated review count (realistic numbers)
4. Average rating (4.0-5.0 range)
5. Estimated social media followers
6. Domain authority score (20-80 range)

Focus on agents who would realistically compete for the same clients in this market area.

Format as JSON array:
[
  {
    "name": "Agent Name",
    "agency": "Agency Name", 
    "reviewCount": 150,
    "avgRating": 4.8,
    "socialFollowers": 2500,
    "domainAuthority": 45
  }
]`;

    const response = await invokeBedrockModel(prompt);
    return parseJsonResponse(response);
}

// Helper function to generate agent bio
async function generateAgentBio(input) {
    const { name, experience, certifications, agencyName } = input;

    const prompt = `Write a professional bio for this real estate agent:

Name: ${name}
Years of Experience: ${experience}
Certifications: ${certifications}
Agency: ${agencyName}

Create a compelling 2-3 paragraph professional bio that:
1. Highlights their experience and expertise
2. Mentions key certifications and achievements
3. Emphasizes their commitment to clients
4. Uses a professional but approachable tone
5. Is optimized for websites and marketing materials

Keep it between 150-250 words. Make it sound authentic and trustworthy.

Return just the bio text, no JSON formatting needed.`;

    const response = await invokeBedrockModel(prompt);
    return response.trim();
}

// Helper function to generate marketing plan
async function generateMarketingPlan(input) {
    const { userId, brandAudit, competitors } = input;

    const prompt = `You are a real estate marketing strategist. Create a personalized 3-step marketing plan based on this data:

Brand Audit Results: ${JSON.stringify(brandAudit)}
Competitors: ${JSON.stringify(competitors)}

Analyze the agent's current position and competitive landscape to create a strategic action plan. 

For each step, provide:
1. A specific, actionable task
2. Clear rationale explaining why this step is important
3. The recommended tool/platform to use
4. A direct link to the relevant tool

Available tools and their links:
- Content Engine: /studio/write
- Brand Audit: /brand/audit  
- Competitive Analysis: /brand/competitors
- Profile Builder: /brand/profile

Focus on the biggest opportunities for improvement and competitive advantage.

Format as JSON:
{
  "plan": [
    {
      "task": "Specific action to take",
      "rationale": "Why this step is crucial for success", 
      "tool": "Tool Name",
      "toolLink": "/path/to/tool"
    }
  ]
}`;

    const response = await invokeBedrockModel(prompt);
    return parseJsonResponse(response);
}

// Helper function to enrich competitor data
async function enrichCompetitorData(input) {
    const { competitorName, location } = input;

    const prompt = `Research and provide detailed information about this real estate agent:

Agent: ${competitorName}
Market: ${location}

Provide realistic market data including:
- Estimated annual sales volume
- Average price point they work in
- Specialties (luxury, first-time buyers, etc.)
- Marketing strengths
- Online presence assessment

Format as JSON with detailed competitor profile.`;

    const response = await invokeBedrockModel(prompt);
    return parseJsonResponse(response);
}

// Helper function to run NAP audit
async function runNapAudit(input) {
    const { businessName, address, phone } = input;

    const prompt = `Perform a NAP (Name, Address, Phone) consistency audit for this business:

Business Name: ${businessName}
Address: ${address}
Phone: ${phone}

Analyze potential consistency issues and provide recommendations for:
1. Google Business Profile optimization
2. Directory listing consistency
3. Citation building opportunities
4. Local SEO improvements

Format as JSON with audit results and recommendations.`;

    const response = await invokeBedrockModel(prompt);
    return parseJsonResponse(response);
}

// Helper function to parse JSON responses safely
function parseJsonResponse(response) {
    let cleanResponse = response.trim();

    // Remove any markdown code blocks if present
    if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    }

    // Try to parse JSON, with fallback handling
    try {
        return JSON.parse(cleanResponse);
    } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('Raw response:', response);

        // Return a structured fallback response
        return {
            error: "Failed to parse response",
            rawResponse: cleanResponse
        };
    }
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

// Helper function to save brand analysis record
async function saveBrandAnalysis(userId, type, input, result) {
    try {
        const item = {
            PK: `USER#${userId}`,
            SK: `BRAND_ANALYSIS#${Date.now()}`,
            EntityType: 'BrandAnalysis',
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
        console.error('Error saving brand analysis:', error);
        // Don't throw - this is optional tracking
    }
}
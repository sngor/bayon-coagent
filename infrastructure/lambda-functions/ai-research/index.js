/**
 * AI Research Lambda Function
 * Handles research agent and analysis requests
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const bedrockClient = new BedrockRuntimeClient({ region: process.env.BEDROCK_REGION });

exports.handler = async (event) => {
    console.log('AI Research Request:', JSON.stringify(event, null, 2));

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

        // Process research request based on type
        let result;
        let reportId;

        switch (type) {
            case 'research-agent':
                result = await runResearchAgent(input);
                reportId = await saveResearchReport(getUserIdFromEvent(event), input, result);
                break;
            case 'property-valuation':
                result = await runPropertyValuation(input);
                break;
            case 'renovation-roi':
                result = await runRenovationROI(input);
                break;
            default:
                throw new Error(`Unsupported research type: ${type}`);
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
                reportId,
            }),
        };

    } catch (error) {
        console.error('Research error:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                success: false,
                error: {
                    code: 'RESEARCH_FAILED',
                    message: error.message
                }
            }),
        };
    }
};

// Research Agent function
async function runResearchAgent(input) {
    const { query, location, sources } = input;

    const prompt = `You are a real estate research agent. Research the following query: "${query}"
    
Location context: ${location || 'General'}
Preferred sources: ${sources || 'Market data, industry reports, local statistics'}

Provide a comprehensive research report including:
1. Executive Summary
2. Key Findings
3. Market Data and Statistics
4. Trends and Insights
5. Implications for Real Estate
6. Recommendations
7. Sources and References

Format as JSON with: {
    "summary": "...",
    "keyFindings": [...],
    "marketData": {...},
    "trends": [...],
    "implications": "...",
    "recommendations": [...],
    "sources": [...]
}`;

    const response = await invokeBedrockModel(prompt);
    return JSON.parse(response);
}

// Property Valuation function
async function runPropertyValuation(input) {
    const { address, propertyType, bedrooms, bathrooms, sqft, yearBuilt, condition, comparables } = input;

    const prompt = `Analyze the property valuation for:
    
Address: ${address}
Type: ${propertyType}
Bedrooms: ${bedrooms}
Bathrooms: ${bathrooms}
Square Feet: ${sqft}
Year Built: ${yearBuilt}
Condition: ${condition}
Comparables: ${JSON.stringify(comparables || [])}

Provide a detailed valuation analysis including:
1. Estimated Market Value Range
2. Price Per Square Foot Analysis
3. Comparable Sales Analysis
4. Market Condition Factors
5. Value Drivers and Detractors
6. Confidence Level and Methodology

Format as JSON with: {
    "estimatedValue": {"low": 0, "high": 0, "best": 0},
    "pricePerSqft": 0,
    "comparableAnalysis": [...],
    "marketFactors": [...],
    "valueDrivers": {"positive": [...], "negative": [...]},
    "confidenceLevel": "...",
    "methodology": "..."
}`;

    const response = await invokeBedrockModel(prompt);
    return JSON.parse(response);
}

// Renovation ROI function
async function runRenovationROI(input) {
    const { propertyValue, renovations, location, timeframe } = input;

    const prompt = `Calculate ROI for renovation project:
    
Current Property Value: $${propertyValue}
Planned Renovations: ${JSON.stringify(renovations)}
Location: ${location}
Timeframe: ${timeframe}

Analyze each renovation and provide:
1. Cost Estimates
2. Value Added
3. ROI Percentage
4. Payback Period
5. Market Appeal Impact
6. Recommendations

Format as JSON with: {
    "totalCost": 0,
    "totalValueAdded": 0,
    "overallROI": 0,
    "renovationAnalysis": [{"type": "...", "cost": 0, "valueAdded": 0, "roi": 0}],
    "marketImpact": "...",
    "recommendations": [...],
    "riskFactors": [...]
}`;

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
            return 'user-from-jwt';
        }
        return null;
    } catch (error) {
        console.error('Error extracting user ID:', error);
        return null;
    }
}

// Helper function to save research report
async function saveResearchReport(userId, input, result) {
    if (!userId) return null;

    try {
        const reportId = `research-${Date.now()}`;
        const item = {
            PK: `USER#${userId}`,
            SK: `REPORT#${reportId}`,
            EntityType: 'ResearchReport',
            Data: {
                reportId,
                userId,
                query: input.query,
                result,
                source: 'research-agent',
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
        return reportId;
    } catch (error) {
        console.error('Error saving research report:', error);
        return null;
    }
}
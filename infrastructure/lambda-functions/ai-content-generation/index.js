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
            case 'website-content':
                result = await generateWebsiteContent(input);
                break;
            case 'aeo-analysis':
                result = await analyzeContentAEO(input);
                break;
            case 'aeo-optimization':
                result = await optimizeContentAEO(input);
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

IMPORTANT: Return ONLY valid JSON in this exact format:
{
  "title": "Your compelling blog post title here",
  "content": "Your full blog post content here with proper formatting and line breaks",
  "metaDescription": "SEO-optimized meta description (150-160 characters)"
}

Do not include any text before or after the JSON. Do not use markdown code blocks.`;

    const response = await invokeBedrockModel(prompt);
    return parseJsonResponse(response);
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

IMPORTANT: Return ONLY valid JSON in this exact format:
{
  "content": "Your social media post content here",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
}

Do not include any text before or after the JSON. Do not use markdown code blocks.`;

    const response = await invokeBedrockModel(prompt);
    return parseJsonResponse(response);
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
    return parseJsonResponse(response);
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

IMPORTANT: Return ONLY valid JSON in this exact format:
{
  "title": "Market Update Title",
  "content": "Full market update content with proper formatting",
  "keyStats": ["Stat 1", "Stat 2", "Stat 3"],
  "insights": ["Insight 1", "Insight 2", "Insight 3"]
}

Do not include any text before or after the JSON. Do not use markdown code blocks.`;

    const response = await invokeBedrockModel(prompt);
    return parseJsonResponse(response);
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
    return parseJsonResponse(response);
}

// Helper function to generate website content
async function generateWebsiteContent(input) {
    const { contentType, businessName, location, specialties, experience, tone, targetAudience } = input;

    let prompt = '';

    switch (contentType) {
        case 'about-me':
            prompt = `Write a professional "About Me" page for a real estate agent.

Agent Details:
- Business Name: ${businessName}
- Location: ${location}
- Experience: ${experience}
- Specialties: ${specialties}
- Target Audience: ${targetAudience}
- Tone: ${tone}

Create compelling content that:
1. Builds trust and credibility
2. Highlights unique value proposition
3. Shows personality and approachability
4. Includes relevant experience and achievements
5. Optimized for local SEO

IMPORTANT: Return ONLY valid JSON in this exact format:
{
  "title": "About [Agent Name] - Your Local Real Estate Expert",
  "content": "Full about page content with proper formatting and paragraphs",
  "metaDescription": "SEO-optimized meta description about the agent"
}`;
            break;

        case 'services':
            prompt = `Write a comprehensive "Services" page for a real estate agent.

Agent Details:
- Business Name: ${businessName}
- Location: ${location}
- Experience: ${experience}
- Specialties: ${specialties}
- Target Audience: ${targetAudience}
- Tone: ${tone}

Include services like:
1. Buyer representation
2. Seller representation
3. Market analysis
4. Investment properties
5. Relocation services
6. First-time buyer programs

IMPORTANT: Return ONLY valid JSON in this exact format:
{
  "title": "Real Estate Services in ${location}",
  "content": "Detailed services page content with clear sections",
  "metaDescription": "Comprehensive real estate services in ${location}"
}`;
            break;

        case 'faq':
            prompt = `Create a comprehensive FAQ page for a real estate agent.

Agent Details:
- Business Name: ${businessName}
- Location: ${location}
- Target Audience: ${targetAudience}
- Tone: ${tone}

Include common questions about:
1. Buying process
2. Selling process
3. Market conditions
4. Financing
5. Local area information
6. Agent services

IMPORTANT: Return ONLY valid JSON in this exact format:
{
  "title": "Frequently Asked Questions - ${location} Real Estate",
  "content": "FAQ content with questions and detailed answers",
  "metaDescription": "Common real estate questions answered by local expert"
}`;
            break;

        case 'testimonial-request':
            prompt = `Write professional testimonial request scripts for a real estate agent.

Agent Details:
- Business Name: ${businessName}
- Location: ${location}
- Tone: ${tone}

Create multiple request templates for:
1. Email request
2. Text message request
3. In-person script
4. Follow-up reminder

IMPORTANT: Return ONLY valid JSON in this exact format:
{
  "title": "Client Testimonial Request Templates",
  "content": "Multiple testimonial request scripts and templates",
  "metaDescription": "Professional testimonial request templates for real estate agents"
}`;
            break;

        case 'landing-page':
            prompt = `Create a high-converting landing page for a real estate agent.

Agent Details:
- Business Name: ${businessName}
- Location: ${location}
- Experience: ${experience}
- Specialties: ${specialties}
- Target Audience: ${targetAudience}
- Tone: ${tone}

Include:
1. Compelling headline
2. Value proposition
3. Benefits and features
4. Social proof elements
5. Clear call-to-action
6. Lead capture optimization

IMPORTANT: Return ONLY valid JSON in this exact format:
{
  "title": "Get Expert Real Estate Help in ${location}",
  "content": "Complete landing page content with headlines, sections, and CTAs",
  "metaDescription": "Expert real estate services in ${location} - Get started today"
}`;
            break;

        default:
            throw new Error(`Unsupported website content type: ${contentType}`);
    }

    const response = await invokeBedrockModel(prompt);
    return parseJsonResponse(response);
}

// Helper function to analyze content for AEO
async function analyzeContentAEO(input) {
    const { content, contentType } = input;

    const prompt = `You are an expert in AEO (Answer Engine Optimization) - optimizing content for AI search engines and language models like ChatGPT, Claude, Perplexity, Google AI Overviews, and Bing Copilot.

Analyze the following ${contentType || 'content'} for AEO optimization:

**Content:**
${content.substring(0, 8000)}${content.length > 8000 ? '\n... (truncated)' : ''}

Evaluate how well this content is optimized for AI search engines and language models.

**Analysis Criteria:**

1. **AI Engine Compatibility (0-100 each):**
   - ChatGPT: How well structured for OpenAI's models
   - Claude: How well structured for Anthropic's models
   - Perplexity: How well suited for citation-based search
   - Google AI: How well optimized for AI Overviews
   - Bing Copilot: How well structured for Microsoft's AI

2. **Extractability (0-100 each):**
   - Key Facts: How easily AI can extract key information
   - Direct Answers: How well content answers questions directly
   - Context Clarity: How clear the context is for each statement
   - Structured Data: Presence of structured, parseable data

3. **Strengths & Weaknesses:**
   - What makes this content AI-friendly
   - What prevents AI from using it effectively

4. **Recommendations:**
   - Specific improvements for better AEO

IMPORTANT: Return ONLY valid JSON in this exact format:
{
  "score": 75,
  "strengths": ["Clear headings and structure", "Professional real estate terminology"],
  "weaknesses": ["Lacks direct question-answer format", "Could use more bullet points"],
  "aiEngineCompatibility": {
    "chatgpt": 78,
    "claude": 73,
    "perplexity": 71,
    "googleAI": 76,
    "bingCopilot": 74
  },
  "extractability": {
    "keyFacts": 72,
    "directAnswers": 68,
    "contextClarity": 80,
    "structuredData": 65
  },
  "recommendations": ["Add FAQ section with direct answers", "Use more bullet points for key information", "Include specific data and statistics"]
}

Do not include any text before or after the JSON. Do not use markdown code blocks.`;

    const response = await invokeBedrockModel(prompt);
    return parseJsonResponse(response);
}

// Helper function to optimize content for AEO
async function optimizeContentAEO(input) {
    const { content, contentType, targetKeywords } = input;

    const keywordsContext = targetKeywords && targetKeywords.length > 0
        ? `\n**Target Keywords:** ${targetKeywords.join(', ')}`
        : '';

    const prompt = `You are an expert in AEO (Answer Engine Optimization). Optimize the following content for AI search engines (ChatGPT, Claude, Perplexity, Google AI, Bing Copilot):

**Original Content:**
${content}${keywordsContext}

**Optimization Goals:**
1. Make content easily extractable by AI
2. Structure for direct answer presentation
3. Add clear context to all statements
4. Improve factual density
5. Enhance citation quality
6. Add structured data where appropriate

**Constraints:**
- Maintain the core message and intent
- Keep content accurate and factual
- Preserve real estate focus
- Use natural, conversational language
- Don't add false information

IMPORTANT: Return ONLY valid JSON in this exact format:
{
  "score": 85,
  "optimizedContent": "Your AEO-optimized content here with improved structure, bullet points, and direct answers",
  "improvements": [
    {
      "category": "Structure",
      "before": "Original paragraph text",
      "after": "Improved structured text with bullet points",
      "impact": "high"
    }
  ],
  "aiReadability": {
    "score": 85,
    "structureClarity": 88,
    "factualDensity": 82,
    "citationQuality": 80,
    "answerDirectness": 87
  },
  "recommendations": ["Consider adding FAQ section", "Include more specific data points"],
  "schemaMarkup": "Optional schema.org JSON-LD markup"
}

Do not include any text before or after the JSON. Do not use markdown code blocks.`;

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
        const parsed = JSON.parse(cleanResponse);
        console.log('Successfully parsed JSON response:', parsed);
        return parsed;
    } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('Raw response:', response);

        // Try to extract content if it looks like it might contain JSON
        if (cleanResponse.includes('"title"') && cleanResponse.includes('"content"')) {
            // Try to find and extract JSON from the response
            const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    const extracted = JSON.parse(jsonMatch[0]);
                    console.log('Extracted JSON from response:', extracted);
                    return extracted;
                } catch (extractError) {
                    console.error('Failed to extract JSON:', extractError);
                }
            }
        }

        // Return a structured fallback response with the raw content
        return {
            title: "Generated Content",
            content: cleanResponse,
            metaDescription: "AI-generated content for real estate professionals"
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
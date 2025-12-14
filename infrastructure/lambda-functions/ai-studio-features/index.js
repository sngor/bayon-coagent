/**
 * AI Studio Features Lambda Function
 * Handles Studio Describe (listing descriptions) and Studio Reimagine (image editing) features
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const bedrockClient = new BedrockRuntimeClient({ region: process.env.BEDROCK_REGION });
const s3Client = new S3Client({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
    console.log('AI Studio Features Request:', JSON.stringify(event, null, 2));

    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE, OPTIONS',
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

        // Route to appropriate handler based on type
        let result;
        switch (type) {
            // Studio Describe features
            case 'generate-listing-description':
                result = await generateListingDescription(input);
                break;
            case 'optimize-listing-description':
                result = await optimizeListingDescription(input);
                break;
            case 'generate-from-images':
                result = await generateFromImages(input);
                break;

            // Studio Reimagine features
            case 'upload-image':
                result = await uploadImage(input);
                break;
            case 'process-edit':
                result = await processEdit(input);
                break;
            case 'accept-edit':
                result = await acceptEdit(input);
                break;
            case 'get-original-image':
                result = await getOriginalImage(input);
                break;
            case 'get-edit-history':
                result = await getEditHistory(input);
                break;
            case 'delete-edit':
                result = await deleteEdit(input);
                break;
            case 'get-rate-limit-status':
                result = await getRateLimitStatus(input);
                break;

            default:
                throw new Error(`Unsupported studio feature type: ${type}`);
        }

        // Save to DynamoDB (optional - for tracking)
        const userId = getUserIdFromEvent(event);
        if (userId && result) {
            await saveStudioOperation(userId, type, input, result);
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
        console.error('Studio features error:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                success: false,
                error: {
                    code: 'STUDIO_OPERATION_FAILED',
                    message: error.message
                }
            }),
        };
    }
};

// ==========================================
// Studio Describe Functions
// ==========================================

async function generateListingDescription(input) {
    const { propertyType, bedrooms, bathrooms, squareFootage, lotSize, yearBuilt, features, location, price, buyerPersona } = input;

    const prompt = `Create a compelling listing description for this property:

Property Details:
- Type: ${propertyType}
- Bedrooms: ${bedrooms}
- Bathrooms: ${bathrooms}
- Square Footage: ${squareFootage}
- Lot Size: ${lotSize}
- Year Built: ${yearBuilt}
- Features: ${features}
- Location: ${location}
- Price: ${price}
- Target Buyer: ${buyerPersona}

Create a professional, engaging listing description that:
1. Highlights the most attractive features
2. Appeals to the target buyer persona
3. Uses descriptive, emotional language
4. Includes key details buyers want to know
5. Has a compelling opening and strong call-to-action
6. Is optimized for online listings (200-300 words)

Format as JSON: { "description": "...", "highlights": [...], "callToAction": "..." }`;

    const response = await invokeBedrockModel(prompt);
    return parseJsonResponse(response);
}

async function optimizeListingDescription(input) {
    const { originalDescription, buyerPersona, focus } = input;

    const prompt = `Optimize this existing listing description for the target buyer persona:

Original Description:
${originalDescription}

Target Buyer Persona: ${buyerPersona}
Optimization Focus: ${focus || 'General appeal'}

Rewrite the description to:
1. Better appeal to the target buyer persona
2. Improve emotional connection and urgency
3. Highlight features most important to this buyer type
4. Use more compelling, action-oriented language
5. Optimize length and readability
6. Include stronger call-to-action

Format as JSON: { "optimizedDescription": "...", "improvements": [...], "keyChanges": "..." }`;

    const response = await invokeBedrockModel(prompt);
    return parseJsonResponse(response);
}

async function generateFromImages(input) {
    const { images, propertyType, buyerPersona } = input;

    // For now, we'll generate based on property type and persona
    // In a full implementation, you'd analyze the actual images
    const prompt = `Generate a listing description based on property images:

Property Type: ${propertyType}
Target Buyer: ${buyerPersona}
Number of Images: ${images.length}

Based on typical ${propertyType} features and the target buyer persona, create an engaging listing description that:
1. Describes what buyers would see in the photos
2. Highlights visual appeal and key features
3. Appeals to the ${buyerPersona} buyer persona
4. Creates emotional connection through visual storytelling
5. Includes compelling call-to-action

Format as JSON: { "description": "...", "visualHighlights": [...], "personaAppeal": "..." }`;

    const response = await invokeBedrockModel(prompt);
    return parseJsonResponse(response);
}

// ==========================================
// Studio Reimagine Functions
// ==========================================

async function uploadImage(input) {
    const { userId, imageData, fileName, contentType } = input;

    try {
        // Generate unique image ID and S3 key
        const imageId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const s3Key = `users/${userId}/reimagine/images/${imageId}/${fileName}`;

        // Convert base64 to buffer if needed
        const buffer = Buffer.isBuffer(imageData) ? imageData : Buffer.from(imageData, 'base64');

        // Upload to S3
        const uploadCommand = new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: s3Key,
            Body: buffer,
            ContentType: contentType,
        });

        await s3Client.send(uploadCommand);

        // Save metadata to DynamoDB
        const metadata = {
            PK: `USER#${userId}`,
            SK: `IMAGE#${imageId}`,
            EntityType: 'ImageMetadata',
            Data: {
                imageId,
                originalKey: s3Key,
                fileName,
                contentType,
                uploadedAt: new Date().toISOString(),
                fileSize: buffer.length,
            },
            CreatedAt: Date.now(),
            UpdatedAt: Date.now(),
        };

        const putCommand = new PutCommand({
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Item: metadata,
        });

        await docClient.send(putCommand);

        // Generate AI suggestions (simplified for demo)
        const suggestions = await generateEditSuggestions(imageId, contentType);

        return {
            imageId,
            suggestions,
            uploadUrl: await getPresignedUrl(s3Key),
        };

    } catch (error) {
        console.error('Upload error:', error);
        throw new Error('Failed to upload image');
    }
}

async function processEdit(input) {
    const { userId, imageId, editType, params, parentEditId } = input;

    try {
        // Generate unique edit ID
        const editId = `edit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Get source image metadata
        const getCommand = new GetCommand({
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: {
                PK: `USER#${userId}`,
                SK: `IMAGE#${imageId}`,
            },
        });

        const imageResult = await docClient.send(getCommand);
        if (!imageResult.Item) {
            throw new Error('Source image not found');
        }

        // Simulate AI processing (in real implementation, this would call Bedrock/Gemini)
        const resultKey = `users/${userId}/reimagine/edits/${editId}/result.jpg`;

        // For demo, we'll just copy the original image as the "edited" result
        // In production, this would be the actual AI-processed image
        const originalKey = imageResult.Item.Data.originalKey;

        // Create edit record
        const editRecord = {
            PK: `USER#${userId}`,
            SK: `EDIT#${editId}`,
            EntityType: 'EditRecord',
            Data: {
                editId,
                imageId,
                editType,
                params,
                sourceKey: originalKey,
                resultKey,
                status: 'preview',
                createdAt: new Date().toISOString(),
                parentEditId,
            },
            CreatedAt: Date.now(),
            UpdatedAt: Date.now(),
        };

        const putCommand = new PutCommand({
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Item: editRecord,
        });

        await docClient.send(putCommand);

        return {
            editId,
            resultUrl: await getPresignedUrl(resultKey),
            status: 'preview',
        };

    } catch (error) {
        console.error('Process edit error:', error);
        throw new Error('Failed to process edit');
    }
}

async function acceptEdit(input) {
    const { userId, editId } = input;

    try {
        // Update edit status to completed
        const updateCommand = new UpdateCommand({
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: {
                PK: `USER#${userId}`,
                SK: `EDIT#${editId}`,
            },
            UpdateExpression: 'SET #data.#status = :status, #data.#completedAt = :completedAt, UpdatedAt = :updatedAt',
            ExpressionAttributeNames: {
                '#data': 'Data',
                '#status': 'status',
                '#completedAt': 'completedAt',
            },
            ExpressionAttributeValues: {
                ':status': 'completed',
                ':completedAt': new Date().toISOString(),
                ':updatedAt': Date.now(),
            },
        });

        await docClient.send(updateCommand);

        return { success: true };

    } catch (error) {
        console.error('Accept edit error:', error);
        throw new Error('Failed to accept edit');
    }
}

async function getOriginalImage(input) {
    const { userId, editId } = input;

    try {
        // Get edit record
        const getCommand = new GetCommand({
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: {
                PK: `USER#${userId}`,
                SK: `EDIT#${editId}`,
            },
        });

        const editResult = await docClient.send(getCommand);
        if (!editResult.Item) {
            throw new Error('Edit not found');
        }

        const imageId = editResult.Item.Data.imageId;

        // Get original image metadata
        const imageCommand = new GetCommand({
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: {
                PK: `USER#${userId}`,
                SK: `IMAGE#${imageId}`,
            },
        });

        const imageResult = await docClient.send(imageCommand);
        if (!imageResult.Item) {
            throw new Error('Original image not found');
        }

        return {
            imageId,
            originalUrl: await getPresignedUrl(imageResult.Item.Data.originalKey),
        };

    } catch (error) {
        console.error('Get original image error:', error);
        throw new Error('Failed to get original image');
    }
}

async function getEditHistory(input) {
    const { userId, limit = 50 } = input;

    try {
        // Query edit history (simplified - in production would use proper pagination)
        const edits = []; // Would query DynamoDB for user's edit history

        return { edits };

    } catch (error) {
        console.error('Get edit history error:', error);
        throw new Error('Failed to get edit history');
    }
}

async function deleteEdit(input) {
    const { userId, editId } = input;

    try {
        // Delete edit record from DynamoDB
        const deleteCommand = new DeleteCommand({
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: {
                PK: `USER#${userId}`,
                SK: `EDIT#${editId}`,
            },
        });

        await docClient.send(deleteCommand);

        return { success: true };

    } catch (error) {
        console.error('Delete edit error:', error);
        throw new Error('Failed to delete edit');
    }
}

async function getRateLimitStatus(input) {
    const { userId, operation } = input;

    // Simplified rate limit check
    return {
        allowed: true,
        remaining: 15,
        resetAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    };
}

// ==========================================
// Helper Functions
// ==========================================

async function generateEditSuggestions(imageId, contentType) {
    // Simplified suggestions - in production would analyze the actual image
    return [
        {
            editType: 'virtual-staging',
            priority: 'high',
            reason: 'Empty rooms can benefit from virtual furniture to help buyers visualize the space',
            confidence: 0.8,
        },
        {
            editType: 'enhance',
            priority: 'medium',
            reason: 'Image quality can be improved with AI enhancement',
            confidence: 0.7,
        },
        {
            editType: 'day-to-dusk',
            priority: 'medium',
            reason: 'Exterior shots look more appealing during golden hour',
            confidence: 0.6,
        },
    ];
}

async function getPresignedUrl(s3Key, expiresIn = 3600) {
    const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: s3Key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
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
        return parsed;
    } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('Raw response:', response);

        // If JSON parsing fails, return the raw response as description
        // This handles cases where the AI returns plain text instead of JSON
        return {
            description: cleanResponse
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

// Helper function to save studio operation record
async function saveStudioOperation(userId, type, input, result) {
    try {
        const item = {
            PK: `USER#${userId}`,
            SK: `STUDIO_OP#${Date.now()}`,
            EntityType: 'StudioOperation',
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
        console.error('Error saving studio operation:', error);
        // Don't throw - this is optional tracking
    }
}
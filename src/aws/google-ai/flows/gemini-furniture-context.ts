/**
 * Gemini AI Flow: Furniture Context Extraction
 * 
 * Analyzes a staged room image to extract furniture details, colors,
 * and styling information for consistent multi-angle staging.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { type FurnitureContext } from '@/ai/schemas/multi-angle-staging-schemas';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

interface ExtractFurnitureContextInput {
    imageData: string; // Base64 encoded image
    imageFormat: 'jpeg' | 'png' | 'webp';
    roomType: string;
    style: string;
}

interface ExtractFurnitureContextOutput {
    roomType: FurnitureContext['roomType'];
    style: FurnitureContext['style'];
    furnitureItems: string[];
    colorPalette: string[];
    description: string;
}

/**
 * Extracts furniture context from a staged room image
 */
export async function extractFurnitureContext(
    input: ExtractFurnitureContextInput
): Promise<FurnitureContext> {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `You are an expert interior designer analyzing a staged ${input.roomType} image. Extract EXTREMELY DETAILED furniture and styling information that will be used to recreate this exact staging from different camera angles.

CRITICAL: Be as specific as possible about every visible element. This information will be used to maintain perfect consistency across multiple angles.

Provide a JSON response with:

1. furnitureItems: Array of HIGHLY SPECIFIC furniture pieces with complete details:
   - Include: exact color, material, size/scale, shape, style details
   - Example: "charcoal gray L-shaped sectional sofa with tufted cushions and chrome legs"
   - Example: "round glass coffee table with gold metal base, approximately 36 inches diameter"
   - Example: "large abstract canvas art with navy blue and gold geometric patterns"
   - Include ALL visible items: seating, tables, lighting, artwork, plants, textiles, accessories

2. colorPalette: Array of specific colors with context:
   - Include: exact color names and where they appear
   - Example: "charcoal gray (sofa upholstery)"
   - Example: "warm beige (walls and rug)"
   - Example: "brass gold (table legs, picture frames, lamp base)"
   - Example: "navy blue accents (throw pillows, artwork)"

3. description: A COMPREHENSIVE description (4-5 sentences) that includes:
   - Overall style and aesthetic
   - Types of furniture and their characteristics
   - Key focal points and design elements
   - Color scheme and material palette
   - Lighting and atmosphere
   - NOTE: Focus on WHAT furniture is used, not WHERE it's placed

IMPORTANT: 
- Be exhaustive - list EVERY visible furniture piece and decor item
- Include exact colors, materials, and sizes
- Note any unique or distinctive features
- Focus on WHAT furniture is used (type, color, material, style)
- Avoid specific placement details - this will be adapted for different angles
- This will be used to match furniture STYLE across different camera angles

Return ONLY valid JSON in this exact format:
{
  "furnitureItems": ["detailed item 1", "detailed item 2", ...],
  "colorPalette": ["color 1 (context)", "color 2 (context)", ...],
  "description": "comprehensive detailed description here"
}`;

    try {
        const imagePart = {
            inlineData: {
                data: input.imageData,
                mimeType: `image/${input.imageFormat}`,
            },
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = result.response;
        const text = response.text();

        // Parse JSON response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in response');
        }

        const parsed = JSON.parse(jsonMatch[0]);

        return {
            roomType: input.roomType as FurnitureContext['roomType'],
            style: input.style as FurnitureContext['style'],
            furnitureItems: parsed.furnitureItems || [],
            colorPalette: parsed.colorPalette || [],
            description: parsed.description || `${input.style} ${input.roomType} staging`,
        };
    } catch (error) {
        console.error('Error extracting furniture context:', error);

        // Return fallback context
        return {
            roomType: input.roomType as FurnitureContext['roomType'],
            style: input.style as FurnitureContext['style'],
            furnitureItems: ['sofa', 'coffee table', 'rug', 'lighting', 'decor'],
            colorPalette: ['neutral tones', 'warm accents'],
            description: `${input.style} ${input.roomType} with coordinated furniture and decor`,
        };
    }
}

/**
 * Quick test script for Day To Dusk functionality
 */

const { geminiDayToDusk } = require('./src/aws/google-ai/flows/gemini-day-to-dusk.ts');

async function testDayToDusk() {
    try {
        // Create a simple test image (1x1 pixel PNG in base64)
        const testImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

        console.log('Testing Day To Dusk with Gemini 2.5 Flash...');

        const result = await geminiDayToDusk({
            imageData: testImageData,
            imageFormat: 'png',
            params: {
                intensity: 'moderate'
            }
        });

        console.log('Day To Dusk test result:');
        console.log('- Image data length:', result.duskImageData.length);
        console.log('- Image format:', result.imageFormat);
        console.log('- Analysis preview:', result.analysis?.substring(0, 100));

        if (result.duskImageData === testImageData) {
            console.log('⚠️  Returned original image (Gemini image generation not available yet)');
        } else {
            console.log('✅ Generated new image successfully!');
        }

    } catch (error) {
        console.error('❌ Day To Dusk test failed:', error.message);
    }
}

testDayToDusk();
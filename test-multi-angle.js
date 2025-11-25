/**
 * Test script for Multi-Angle Staging
 * 
 * Run this in the browser console to test the flow
 */

// Test 1: Check if session can be created
async function testCreateSession() {
    console.log('Test 1: Creating session...');

    const userId = 'test-user-id'; // Replace with actual user ID
    const roomType = 'living-room';
    const style = 'modern';

    try {
        const response = await fetch('/api/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'createSession',
                userId,
                roomType,
                style
            })
        });

        const result = await response.json();
        console.log('Session created:', result);
        return result.sessionId;
    } catch (error) {
        console.error('Failed to create session:', error);
    }
}

// Test 2: Check if image upload works
async function testImageUpload() {
    console.log('Test 2: Testing image upload...');

    // Create a test file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', 'test-user-id'); // Replace with actual user ID

        try {
            const response = await fetch('/api/reimagine/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            console.log('Upload result:', result);
            return result.imageId;
        } catch (error) {
            console.error('Upload failed:', error);
        }
    };

    input.click();
}

// Test 3: Check if staging works
async function testStaging(imageId) {
    console.log('Test 3: Testing staging...');

    const userId = 'test-user-id'; // Replace with actual user ID
    const editType = 'virtual-staging';
    const params = {
        roomType: 'living-room',
        style: 'modern'
    };

    try {
        // This would need to be a server action call
        console.log('Would call processEditAction with:', { userId, imageId, editType, params });
    } catch (error) {
        console.error('Staging failed:', error);
    }
}

// Run all tests
console.log('Multi-Angle Staging Test Suite');
console.log('================================');
console.log('');
console.log('Available tests:');
console.log('1. testCreateSession() - Test session creation');
console.log('2. testImageUpload() - Test image upload');
console.log('3. testStaging(imageId) - Test staging process');
console.log('');
console.log('To run: Copy and paste the function name in console');

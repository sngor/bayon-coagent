#!/usr/bin/env node

/**
 * Create PNG icons using canvas (requires canvas package)
 * Run: npm install canvas --save-dev
 * Then: node scripts/create-png-icons.js
 */

const fs = require('fs');
const path = require('path');

try {
    const { createCanvas } = require('canvas');

    function createIcon(size, filename) {
        const canvas = createCanvas(size, size);
        const ctx = canvas.getContext('2d');

        // Draw blue circle background
        ctx.fillStyle = '#3B82F6';
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw white "B" text
        ctx.fillStyle = 'white';
        ctx.font = `bold ${size * 0.625}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('B', size / 2, size / 2);

        // Save to file
        const buffer = canvas.toBuffer('image/png');
        const publicDir = path.join(__dirname, '..', 'public');
        fs.writeFileSync(path.join(publicDir, filename), buffer);
        console.log(`✓ Created ${filename}`);
    }

    createIcon(192, 'icon-192x192.png');
    createIcon(512, 'icon-512x512.png');

    console.log('\n✓ All PNG icons created successfully!');

} catch (error) {
    console.error('Error: canvas package not installed');
    console.log('\nTo create PNG icons, run:');
    console.log('  npm install canvas --save-dev');
    console.log('  node scripts/create-png-icons.js');
    console.log('\nOr use the SVG icons (already created) which work in modern browsers.');
    process.exit(1);
}

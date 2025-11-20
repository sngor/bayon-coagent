#!/usr/bin/env node

/**
 * Generate PWA icons from SVG
 * Creates favicon.ico and icon-192x192.png
 */

const fs = require('fs');
const path = require('path');

// Simple SVG icon (blue circle with white "B")
const svg = `<svg width="192" height="192" xmlns="http://www.w3.org/2000/svg">
  <circle cx="96" cy="96" r="96" fill="#3B82F6"/>
  <text x="96" y="140" font-family="Arial, sans-serif" font-size="120" font-weight="bold" fill="white" text-anchor="middle">B</text>
</svg>`;

const publicDir = path.join(__dirname, '..', 'public');

// Write SVG as icon-192x192.svg (browsers can use SVG)
fs.writeFileSync(path.join(publicDir, 'icon-192x192.svg'), svg);

// Create a simple HTML file that can be used to generate PNG manually
const htmlTemplate = `<!DOCTYPE html>
<html>
<head>
  <title>Icon Generator</title>
</head>
<body>
  <h1>Icon Preview</h1>
  <p>Right-click and save as PNG:</p>
  <img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}" width="192" height="192" />
  <hr>
  <p>Or use this SVG directly:</p>
  <pre>${svg}</pre>
</body>
</html>`;

fs.writeFileSync(path.join(publicDir, 'icon-preview.html'), htmlTemplate);

console.log('✓ Generated icon-192x192.svg');
console.log('✓ Generated icon-preview.html');
console.log('\nNote: For production, convert SVG to PNG using an online tool or image editor.');
console.log('Visit http://localhost:3000/icon-preview.html to preview and download.');

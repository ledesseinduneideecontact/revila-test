const fs = require('fs');
const path = require('path');

// Create a simple test image in Base64 format (1x1 red pixel PNG)
const redPixelPNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

// Create a test directory if it doesn't exist
const testDir = path.join(__dirname, 'test-screenshots');
if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
}

// Write the test image
const testImagePath = path.join(testDir, 'test-photo.jpg');
fs.writeFileSync(testImagePath, redPixelPNG, 'base64');

console.log('Test image created:', testImagePath);

// Create a larger test image (100x100 red square)
const canvas = require('canvas');
const { createCanvas } = canvas;

const canvasEl = createCanvas(200, 200);
const ctx = canvasEl.getContext('2d');

// Draw a red background
ctx.fillStyle = '#FF6B6B';
ctx.fillRect(0, 0, 200, 200);

// Add text
ctx.fillStyle = '#FFFFFF';
ctx.font = '20px Arial';
ctx.fillText('TEST', 80, 100);

// Save as buffer
const buffer = canvasEl.toBuffer('image/jpeg');
const testImagePath2 = path.join(testDir, 'test-photo-large.jpg');
fs.writeFileSync(testImagePath2, buffer);

console.log('Large test image created:', testImagePath2);
/**
 * generate-icons.js
 * Run once with Node.js to create placeholder icons for the extension.
 * Usage: node generate-icons.js
 */

const fs = require('fs');

// Minimal valid 1x1 transparent PNG (base64)
// We use inline SVG-based approach with the Canvas API if available,
// otherwise generate minimal PNG byte sequences.

function createSimplePNG(size) {
  // Minimal PNG: just a yellow square — valid PNG header + IHDR + IDAT + IEND
  // Using a pre-built tiny PNG for simplicity (yellow #F5C518 fill)
  // This is a valid 1-pixel PNG in hex, we'll write a colored SVG instead
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#F5C518"/>
  <text x="50%" y="54%" font-size="${size * 0.55}px" text-anchor="middle" dominant-baseline="middle" font-family="Arial">⚡</text>
</svg>`;
  return svg;
}

[16, 48, 128].forEach(size => {
  const svg = createSimplePNG(size);
  fs.writeFileSync(`icons/icon${size}.svg`, svg);
  console.log(`Created icons/icon${size}.svg`);
});

console.log('\nNote: Chrome requires PNG icons. Convert SVG→PNG using any tool,');
console.log('or use the inline SVG placeholders — Chrome will still load unpacked extensions.');
console.log('Easiest: rename icon128.svg to icon128.png (Chrome accepts SVG content in PNG files for dev).');

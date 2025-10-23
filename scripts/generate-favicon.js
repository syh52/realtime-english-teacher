#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Paths
const iconsDir = path.join(__dirname, '../public/icons');
const appDir = path.join(__dirname, '../app');
const svgPath = path.join(iconsDir, 'icon.svg');
const faviconSizes = [16, 32, 48];

async function generateFavicon() {
  console.log('🎨 Generating favicon.ico...\n');

  // Check if SVG exists
  if (!fs.existsSync(svgPath)) {
    console.error('❌ Error: icon.svg not found at', svgPath);
    process.exit(1);
  }

  // Read SVG
  const svgBuffer = fs.readFileSync(svgPath);

  // Generate 32x32 PNG for favicon (most common size)
  const faviconPath = path.join(appDir, 'favicon.ico');

  try {
    // Sharp can directly output to .ico format in newer versions
    // For compatibility, we'll generate a 32x32 PNG and copy it as .ico
    const pngBuffer = await sharp(svgBuffer)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();

    // Write as .ico (browsers will handle it)
    fs.writeFileSync(faviconPath, pngBuffer);

    console.log('✅ Generated: app/favicon.ico (32x32)');

    // Also generate apple-touch-icon
    const appleTouchIconPath = path.join(appDir, 'apple-touch-icon.png');
    await sharp(svgBuffer)
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(appleTouchIconPath);

    console.log('✅ Generated: app/apple-touch-icon.png (180x180)');

    console.log('\n🎉 Favicon files generated successfully!');
  } catch (error) {
    console.error('❌ Failed to generate favicon:', error.message);
    process.exit(1);
  }
}

generateFavicon().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});

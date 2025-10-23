#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Paths
const sourceImage = process.argv[2];
const iconsDir = path.join(__dirname, '../public/icons');

async function generateIconsFromImage() {
  console.log('🎨 从图片生成 PWA 图标...\n');

  // Check if source image exists
  if (!sourceImage || !fs.existsSync(sourceImage)) {
    console.error('❌ 错误: 请提供源图片路径');
    console.error('用法: node generate-icons-from-image.js <图片路径>');
    process.exit(1);
  }

  console.log('📁 源图片:', sourceImage);

  // Read image
  const imageBuffer = fs.readFileSync(sourceImage);
  const metadata = await sharp(imageBuffer).metadata();
  console.log(`📐 源图片尺寸: ${metadata.width}x${metadata.height}\n`);

  // Generate SVG (copy original as reference, we'll use PNG for actual icons)
  try {
    // Generate each PNG size
    for (const size of sizes) {
      const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);

      await sharp(imageBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 1 } // 黑色背景
        })
        .png()
        .toFile(outputPath);

      console.log(`✅ 生成: icon-${size}x${size}.png`);
    }

    // Generate favicon (32x32)
    const faviconPath = path.join(__dirname, '../app/favicon.ico');
    const faviconBuffer = await sharp(imageBuffer)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 1 }
      })
      .png()
      .toBuffer();

    fs.writeFileSync(faviconPath, faviconBuffer);
    console.log('✅ 生成: app/favicon.ico (32x32)');

    // Generate apple-touch-icon (180x180)
    const appleTouchIconPath = path.join(__dirname, '../app/apple-touch-icon.png');
    await sharp(imageBuffer)
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 1 }
      })
      .png()
      .toFile(appleTouchIconPath);

    console.log('✅ 生成: app/apple-touch-icon.png (180x180)');

    console.log('\n🎉 所有图标生成成功！');
    console.log(`📁 位置: ${iconsDir}`);
  } catch (error) {
    console.error('❌ 生成失败:', error.message);
    process.exit(1);
  }
}

generateIconsFromImage().catch(error => {
  console.error('❌ 错误:', error);
  process.exit(1);
});

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Paths
const sourceImage = process.argv[2];
const iconsDir = path.join(__dirname, '../public/icons');

// 圆角半径比例（相对于图标尺寸的百分比）
// 例如：0.22 表示 22% 的圆角，适用于 iOS 风格的图标
const CORNER_RADIUS_RATIO = 0.22;

// 创建圆角蒙版
function createRoundedCornerMask(size) {
  const radius = Math.round(size * CORNER_RADIUS_RATIO);
  return Buffer.from(
    `<svg width="${size}" height="${size}">
      <rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/>
    </svg>`
  );
}

// 应用圆角效果
function applyRoundedCorners(imageBuffer, size) {
  const roundedMask = createRoundedCornerMask(size);

  return sharp(imageBuffer)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 1 }
    })
    .composite([{
      input: roundedMask,
      blend: 'dest-in'
    }])
    .png();
}

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

  // Generate icons with rounded corners
  try {
    // Generate each PNG size with rounded corners
    for (const size of sizes) {
      const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);

      await applyRoundedCorners(imageBuffer, size)
        .toFile(outputPath);

      console.log(`✅ 生成: icon-${size}x${size}.png (圆角)`);
    }

    // Generate favicon (32x32) with rounded corners
    const faviconPath = path.join(__dirname, '../app/favicon.ico');
    const faviconBuffer = await applyRoundedCorners(imageBuffer, 32)
      .toBuffer();

    fs.writeFileSync(faviconPath, faviconBuffer);
    console.log('✅ 生成: app/favicon.ico (32x32, 圆角)');

    // Generate apple-touch-icon (180x180) with rounded corners
    const appleTouchIconPath = path.join(__dirname, '../app/apple-touch-icon.png');
    await applyRoundedCorners(imageBuffer, 180)
      .toFile(appleTouchIconPath);

    console.log('✅ 生成: app/apple-touch-icon.png (180x180, 圆角)');

    console.log('\n🎉 所有圆角图标生成成功！');
    console.log(`📁 位置: ${iconsDir}`);
    console.log(`📐 圆角比例: ${(CORNER_RADIUS_RATIO * 100).toFixed(0)}% (iOS 风格)`);
  } catch (error) {
    console.error('❌ 生成失败:', error.message);
    process.exit(1);
  }
}

generateIconsFromImage().catch(error => {
  console.error('❌ 错误:', error);
  process.exit(1);
});

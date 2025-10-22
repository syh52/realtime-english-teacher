# PWA Icons

This directory contains the icons for the Progressive Web App (PWA).

## Current Status

- ✅ `icon.svg` - Vector icon (works in modern browsers)
- ⚠️ PNG icons needed for better compatibility

## Generate PNG Icons

You have two options:

### Option 1: Use the Browser Tool (Recommended)

1. Open `generate-icons.html` in your browser:
   ```
   file:///path/to/public/icons/generate-icons.html
   ```
   Or run: `open public/icons/generate-icons.html` (macOS)

2. Click "Generate All Icons"

3. Download each icon and save it in this directory

### Option 2: Use Online Tool

1. Go to https://realfavicongenerator.net/
2. Upload `icon.svg`
3. Generate icons for all platforms
4. Download and extract to this directory

## Required Icon Sizes

The following PNG icons should be generated from `icon.svg`:

- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png` (minimum required for PWA)
- `icon-384x384.png`
- `icon-512x512.png` (required for PWA)

## Note

The app will work with just the SVG icon in modern browsers, but PNG icons provide better compatibility across all devices and browsers.

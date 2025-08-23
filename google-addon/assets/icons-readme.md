# Add-on Icons

Place the following icon files in this directory:

## Required Icons

1. **icon-32.png** - 32x32px PNG
   - Used in Drive sidebar header
   - Should be clear at small size

2. **icon-128.png** - 128x128px PNG
   - Used in add-on listings
   - Higher detail version

3. **logo.png** - 400x400px PNG (optional)
   - Used in authentication screens
   - Brand logo with transparency

## Icon Guidelines

- Use PNG format with transparency
- Ensure icons are crisp and clear
- Match Statement Desk brand colors (#4F46E5)
- Test visibility on both light and dark backgrounds

## Example Generation

Using ImageMagick to create icons from a source logo:

```bash
# Create 32x32 icon
convert logo.png -resize 32x32 icon-32.png

# Create 128x128 icon
convert logo.png -resize 128x128 icon-128.png
```

## Upload to Hosting

Icons referenced in the add-on should be hosted on a reliable CDN:

```javascript
// In Code.js, update URLs:
.setImageUrl('https://statementdesk.com/addon/icon-128.png')
```
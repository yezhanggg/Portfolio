# ZHAENG Camera Feature

## Overview
A mobile-first camera web application that allows users to take photos with custom ZHAENG watermarks, timestamps, and location data. Optimized for iPhone and mobile devices.

## Features

### Photo Capture
- Access front and rear cameras on mobile devices
- Full-screen camera preview
- Large, touch-friendly capture button
- Camera flip functionality

### Watermark System
- **Border Pattern**: "ZHAENG" text repeated around all four edges of the photo
- **Center Watermark**: Large, semi-transparent "ZHAENG" logo in the center
- **Professional Design**: Semi-transparent overlays that don't overwhelm the photo

### Metadata Overlay
- **Timestamp**: Displays the exact date and time the photo was taken
- **Location**: Shows GPS coordinates (latitude and longitude) when available
- **Format**: Clean, readable overlay at the bottom of the photo

### Save Functionality
- Download photos directly to your iPhone/device
- Photos saved as high-quality JPEG
- Filename includes "ZHAENG" prefix and timestamp

## How It Works

### 1. Permission Request
- App requests camera access
- App requests location access (optional, but adds location data to photos)

### 2. Camera Interface
- Video preview fills the screen
- Capture button at bottom center
- Flip camera button to switch between front/back cameras

### 3. Photo Capture
- Tap the large white capture button
- Photo is processed with watermarks and metadata
- Preview screen shows the final result

### 4. Save or Retake
- **Save Photo**: Downloads to your device
- **Retake**: Returns to camera to take another photo

## Technical Details

### Technologies Used
- **HTML5**: Structure and canvas for image manipulation
- **CSS3**: Mobile-first responsive design
- **Vanilla JavaScript**: No dependencies, fast loading
- **MediaDevices API**: Camera access
- **Geolocation API**: Location tracking
- **Canvas API**: Image processing and watermarking

### Mobile Optimizations
- `viewport` meta tag prevents zooming
- `playsinline` attribute for iOS video
- Touch-action manipulation for better button response
- Fixed positioning to prevent scrolling
- Gesture prevention for iOS
- Apple-specific meta tags for web app mode

### Browser Compatibility
- ✅ iPhone Safari (iOS 11+)
- ✅ Chrome Mobile
- ✅ Firefox Mobile
- ✅ Samsung Internet
- ⚠️ Desktop browsers (works but optimized for mobile)

## Integration with Wix

### Option 1: Embed as iFrame (Recommended)
1. Host the feature on a web server or GitHub Pages
2. In Wix, add an **HTML iframe** element
3. Paste this code:
```html
<iframe
    src="YOUR_HOSTED_URL/features/zhaeng-camera/index.html"
    style="width: 100%; height: 100vh; border: none;"
    allow="camera; geolocation">
</iframe>
```

### Option 2: Direct Link
1. Host the feature
2. Create a button on your Wix site
3. Link it to the hosted URL
4. Opens in full-screen mobile browser

### Option 3: Wix Code (Advanced)
1. Use Wix's Custom Element
2. Upload the HTML as a custom widget
3. Integrate with Wix's Velo platform

## Hosting Options

### GitHub Pages (Free)
1. Enable GitHub Pages for this repository
2. URL will be: `https://YOUR_USERNAME.github.io/ZHAENG/features/zhaeng-camera/`

### Other Options
- Netlify (free)
- Vercel (free)
- Your own web hosting

## Testing on iPhone

### Via USB and Safari
1. Open in Safari on your Mac
2. Use Safari's Developer Tools
3. Select your iPhone device
4. Test camera functionality

### Via HTTPS
⚠️ **Important**: Camera access requires HTTPS (or localhost)
- If hosting, ensure your server uses HTTPS
- GitHub Pages provides HTTPS automatically

## Customization

### Watermark Style
Edit the `drawWatermark()` function in the JavaScript section:
- Change font size: `ctx.font = 'bold 16px Arial'`
- Change opacity: `ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'`
- Change spacing: Modify the loop increment values
- Change position: Adjust x, y coordinates

### Colors
- Capture button color: `border: 4px solid #4A90E2`
- Button background: `background: #4A90E2`
- Change `#4A90E2` to your brand color

### Text
- Change "ZHAENG" to any text you want in the watermark
- Header text is in the HTML: `<div id="header">ZHAENG</div>`

## Privacy & Permissions

### What Data is Collected?
- **Camera**: Photos are processed locally, never uploaded
- **Location**: GPS coordinates are added to photos if permission granted
- **Storage**: Photos are saved only to the user's device

### Security
- All processing happens client-side (in the browser)
- No data sent to external servers
- No analytics or tracking

## Troubleshooting

### Camera Won't Start
- Check browser permissions
- Ensure you're using HTTPS (not HTTP)
- Try refreshing the page
- Check if another app is using the camera

### Location Not Showing
- Enable location services in device settings
- Grant permission when prompted
- Location may take a few seconds to acquire

### Photos Not Saving
- Check device storage space
- Check browser download permissions
- Try using a different browser

### Watermark Not Appearing
- Check JavaScript console for errors
- Ensure canvas is properly sized
- Verify video is playing before capture

## Future Enhancements

Potential features to add:
- [ ] Multiple watermark styles to choose from
- [ ] Adjustable watermark opacity slider
- [ ] Photo filters and effects
- [ ] Burst mode (multiple photos)
- [ ] Gallery view of taken photos
- [ ] Share to social media
- [ ] Custom text overlay option
- [ ] Photo editing tools (crop, rotate)

## Support
For issues or questions, please open an issue in the GitHub repository.

---
**ZHAENG Camera** - Created for www.zhaeng.net

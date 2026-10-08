# ZHAENG Camera - User Experience Flow

## What Users Will See

### Screen 1: Welcome / Permission Screen
```
┌─────────────────────┐
│                     │
│   ZHAENG CAMERA     │
│                     │
│  Take photos with   │
│  custom ZHAENG      │
│  watermarks,        │
│  timestamps, and    │
│  location data.     │
│                     │
│  This app needs     │
│  access to your     │
│  camera and         │
│  location.          │
│                     │
│  ┌───────────────┐  │
│  │ Start Camera  │  │
│  └───────────────┘  │
│                     │
└─────────────────────┘
```

**What happens:**
- User sees a clean welcome screen
- Explains what the app does
- Large "Start Camera" button
- Tapping starts the camera permission flow

---

### Screen 2: Camera View
```
┌─────────────────────┐
│      ZHAENG         │ ← Header
├─────────────────────┤
│                     │
│                     │
│   [CAMERA PREVIEW]  │
│   Live video feed   │
│   from phone        │
│   camera            │
│                     │
│                     │
├─────────────────────┤
│    🔄      ⚪       │ ← Controls
│   Flip   Capture    │
└─────────────────────┘
```

**What happens:**
- Full-screen live camera preview
- "ZHAENG" header at top
- Camera flip button (🔄) to switch front/back
- Large white capture button in center
- Gradient overlay at bottom for visibility
- User can see themselves/scene in real-time

---

### Screen 3: Photo Preview with Watermarks
```
┌─────────────────────┐
│      ZHAENG         │
├─────────────────────┤
│ ZHAENG ZHAENG ZHA...│← Top border watermark
│Z                   Z│
│H   [YOUR PHOTO]    H│← Side watermarks
│A                   A│
│E    ZHAENG         E│← Center watermark (large, transparent)
│N                   N│
│G                   G│
│ Dec 15, 2024       │← Timestamp
│ 📍 37.7749, 122... │← Location
│ZHAENG ZHAENG ZHA... │← Bottom border
├─────────────────────┤
│ ┌────────┐┌───────┐│
│ │ Retake ││ Save  ││← Action buttons
│ └────────┘└───────┘│
└─────────────────────┘
```

**What happens:**
- Photo displayed with all watermarks applied
- "ZHAENG" text repeated around all edges
- Large transparent center watermark
- Timestamp showing when photo was taken
- GPS coordinates at bottom (if permission granted)
- Two buttons: "Retake" and "Save Photo"

---

## Watermark Details

### Border Pattern
```
     ZHAENG ZHAENG ZHAENG ZHAENG
     ▲
     Top border - repeated text

Z    [PHOTO CONTENT]    Z
H                       H
A                       A  ◄── Side borders
E                       E      (rotated text)
N                       N
G                       G

     ZHAENG ZHAENG ZHAENG ZHAENG
     ▼
     Bottom border - repeated text
```

### Center Watermark
```
              ZHAENG
           (very large)
        (semi-transparent)
      (doesn't block view)
```

### Metadata Overlay
```
┌──────────────────────────┐
│ Dec 15, 2024 3:45:32 PM │ ◄── White background box
│ 📍 37.7749, -122.4194   │     with timestamp & location
└──────────────────────────┘
(bottom-left corner)
```

---

## User Journey

### Step 1: Discovery
User visits www.zhaeng.net on their iPhone
→ Sees "Camera" page or button
→ Taps to open the camera feature

### Step 2: Permissions
Browser asks for permissions:
- ✅ "Allow camera access"
- ✅ "Allow location access" (optional but recommended)

### Step 3: Taking Photos
- User sees live camera preview
- Can flip between front/back cameras
- Positions shot
- Taps large capture button

### Step 4: Preview & Save
- Sees photo with watermarks applied
- Checks if they like it
- Options:
  - **Retake**: Go back to camera
  - **Save Photo**: Download to device

### Step 5: Photo Saved
- Photo downloads to iPhone Photos app
- Filename: `ZHAENG_1702665932451.jpg`
- Contains all watermarks and metadata
- Ready to share on social media!

---

## Design Highlights

### Mobile-First Features
- ✅ Full-screen experience (no wasted space)
- ✅ Large touch targets (70px capture button)
- ✅ No typing required (all tap interactions)
- ✅ Portrait orientation optimized
- ✅ Fast loading (single HTML file, no external dependencies)
- ✅ Works offline after first load

### iPhone Specific
- ✅ Prevents pinch-zoom (better UX)
- ✅ Apple web app capable
- ✅ Plays video inline (no fullscreen popup)
- ✅ Respects safe areas
- ✅ Dark gradient overlays for readability

### Professional Touch
- ✅ Smooth transitions
- ✅ Button press animations
- ✅ Status messages ("Photo saved!")
- ✅ Clean, modern design
- ✅ Semi-transparent watermarks (not overwhelming)

---

## What Makes It Special

1. **Branded Photos**: Every photo clearly shows "ZHAENG"
2. **Professional Metadata**: Timestamp and location add credibility
3. **Easy to Use**: Three taps (Start → Capture → Save)
4. **No App Install**: Works directly in mobile browser
5. **Privacy Focused**: All processing happens on device
6. **Share Ready**: Photos are perfect for Instagram, Twitter, Facebook

---

## Perfect Use Cases

### Events
Take photos at events with automatic ZHAENG branding

### Social Media
Create branded content for your followers

### Documentation
Timestamp and location prove when/where photos were taken

### Marketing
Free advertising - every photo shared promotes ZHAENG

### Personal Memories
Special watermarked photos for keepsakes

---

## Technical Excellence

- **No Server Required**: Everything runs client-side
- **Fast Performance**: Optimized canvas operations
- **High Quality**: 1920x1080 capture when possible
- **Universal**: Works on all modern smartphones
- **Secure**: HTTPS required, no data leakage
- **Accessible**: Simple, intuitive interface

---

**Result**: A professional, mobile-first camera app that turns every photo into a ZHAENG marketing opportunity while providing real value to users! 📸

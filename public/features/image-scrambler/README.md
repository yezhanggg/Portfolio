# Image Scrambler

A powerful web-based tool that breaks images into hundreds or thousands of square tiles and shuffles them to create artistic chaos.

## Features

### Core Functionality
- **Upload Images**: Drag-and-drop or click to upload JPG, PNG, GIF, WebP
- **Break into Squares**: Automatically divides images into a grid of tiles
- **Shuffle Algorithm**: Uses Fisher-Yates shuffle for true randomization
- **Real-time Rendering**: Canvas-based rendering for smooth performance

### Grid Options
- **500 pieces** (22×23 grid)
- **1000 pieces** (40×25 grid) - Default
- **2000 pieces** (50×40 grid)
- **Custom grid** - Define your own rows and columns (5-100 each)

### Controls
- **Scramble**: Shuffle the tiles into random positions
- **Reset**: Restore original image arrangement
- **Download**: Save the scrambled image as PNG
- **New Image**: Load a different image
- **Grid Overlay**: Toggle visual grid lines

## Technical Architecture

### Canvas Strategy
The tool uses a dual-canvas approach:
1. **Source Canvas**: Hidden canvas storing the original image
2. **Display Canvas**: Visible canvas where scrambled tiles are rendered

### Tile System
Each tile is an object containing:
- `sourceX`, `sourceY`: Position in original image
- `width`, `height`: Tile dimensions
- `originalIndex`: Track original position

### Shuffling Algorithm
Implements the Fisher-Yates shuffle algorithm:
```javascript
for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
}
```

This ensures true randomization with O(n) time complexity.

### Rendering Process
1. Clear display canvas
2. For each tile in current order:
   - Calculate destination position based on index
   - Draw from source canvas at original position
   - Place at destination position on display canvas
3. Optionally draw grid overlay

## File Structure

```
image-scrambler/
├── index.html          # Main HTML structure
├── style.css           # Styling and responsive design
├── script.js           # Core scrambling logic
├── README.md           # Technical documentation
└── USER_EXPERIENCE.md  # User guide
```

## Performance Considerations

- **Memory Efficient**: Only stores tile metadata, not pixel data
- **Canvas Optimization**: Uses `drawImage()` for fast rendering
- **No Animation**: Instant scrambling for better performance with high tile counts
- **Responsive**: Automatically scales canvas to fit screen

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Supported with responsive design

## Usage in ZHAENG

This tool is part of the ZHAENG creative tools collection. It can be:
- Used standalone at `/features/image-scrambler/`
- Integrated into other projects
- Extended with additional features

## Future Enhancements

Potential additions:
- [ ] Animation during shuffle
- [ ] Progressive scrambling (gradual increase in chaos)
- [ ] Reverse scramble (unscramble puzzle mode)
- [ ] Different tile shapes (hexagons, triangles)
- [ ] Color-based sorting options
- [ ] Save/load scramble patterns
- [ ] Batch processing multiple images
- [ ] WebGL acceleration for larger grids

## Implementation Details

### Grid Size Calculation
The grid size is calculated to match the target number of pieces:
- 500 pieces ≈ √500 ≈ 22×23 = 506 pieces
- 1000 pieces ≈ √1000 ≈ 40×25 = 1000 pieces exactly
- 2000 pieces ≈ √2000 ≈ 50×40 = 2000 pieces exactly

### Tile Dimensions
Tiles are calculated based on image dimensions:
```javascript
tileWidth = imageWidth / columns
tileHeight = imageHeight / rows
```

This allows for non-uniform tile sizes that perfectly divide the image.

## Credits

Part of the ZHAENG project by Ye.
Built with vanilla JavaScript, HTML5 Canvas API, and CSS3.

// Create background particles (soda bubbles)
let isSlowMode = false;

// Create a single bubble
function createBubble() {
    const particlesContainer = document.getElementById('particles');
    const particle = document.createElement('div');
    particle.className = 'particle';

    // Random horizontal position
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = '100%';

    // Random sizes like soda bubbles (some tiny, some large)
    const sizeRandom = Math.random();
    let size;
    if (sizeRandom < 0.3) {
        size = Math.random() * 8 + 4; // small bubbles
    } else if (sizeRandom < 0.7) {
        size = Math.random() * 12 + 12; // medium bubbles
    } else {
        size = Math.random() * 15 + 20; // large bubbles
    }

    particle.style.width = size + 'px';
    particle.style.height = size + 'px';

    // Random horizontal drift
    const drift = (Math.random() - 0.5) * 100;
    particle.style.setProperty('--drift', drift + 'px');

    // Set duration based on mode (2x slower)
    if (isSlowMode) {
        particle.style.animationDuration = (Math.random() * 4 + 6) + 's'; // 6-10s
        particle.classList.add('slow');
    } else {
        particle.style.animationDuration = '3s'; // 3s
    }

    particlesContainer.appendChild(particle);

    // Remove bubble when animation ends and create a new one
    particle.addEventListener('animationend', () => {
        particle.remove();
        createBubble();
    });
}

// Create background particles
function createParticles() {
    // Create initial set of bubbles with continuous staggering
    for (let i = 0; i < 80; i++) {
        setTimeout(() => {
            createBubble();
        }, i * 50); // Create one every 50ms for continuous flow
    }

    // Slow down all bubbles after 0.5 seconds
    setTimeout(() => {
        isSlowMode = true;
    }, 500);
}

// Color Utilities
function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0;
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return { h: h * 360, s, l };
}

function getAverageColor(imageData) {
    let r = 0, g = 0, b = 0;
    const pixels = imageData.data.length / 4;

    for (let i = 0; i < imageData.data.length; i += 4) {
        r += imageData.data[i];
        g += imageData.data[i + 1];
        b += imageData.data[i + 2];
    }

    return {
        r: Math.round(r / pixels),
        g: Math.round(g / pixels),
        b: Math.round(b / pixels)
    };
}

class ImageScrambler {
    constructor() {
        // DOM Elements
        this.startScreen = document.getElementById('start-screen');
        this.startBtn = document.getElementById('start-btn');
        this.header = document.getElementById('header');
        this.mainView = document.getElementById('main-view');
        this.uploadZone = document.getElementById('upload-zone');
        this.fileInput = document.getElementById('fileInput');
        this.canvasContainer = document.getElementById('canvas-container');
        this.sourceCanvas = document.getElementById('sourceCanvas');
        this.displayCanvas = document.getElementById('displayCanvas');
        this.gridSizeSelect = document.getElementById('gridSize');
        this.customGridGroup = document.getElementById('customGridGroup');
        this.customCols = document.getElementById('customCols');
        this.customRows = document.getElementById('customRows');
        this.showGridCheckbox = document.getElementById('showGrid');
        this.statusEl = document.getElementById('status');

        // Buttons
        this.scrambleBtn = document.getElementById('scramble-btn');
        this.buildBtn = document.getElementById('build-btn');
        this.resetBtn = document.getElementById('reset-btn');
        this.downloadBtn = document.getElementById('download-btn');
        this.uploadBtn = document.getElementById('upload-btn');
        this.controls = document.getElementById('controls');

        // Art Mode
        this.artModeRow = document.getElementById('artModeRow');
        this.artModeSelect = document.getElementById('artMode');

        // Stats
        this.totalPiecesEl = document.getElementById('totalPieces');
        this.gridDimensionsEl = document.getElementById('gridDimensions');

        // Canvas contexts
        this.sourceCtx = this.sourceCanvas.getContext('2d');
        this.displayCtx = this.displayCanvas.getContext('2d');

        // State
        this.image = null;
        this.tiles = [];
        this.originalOrder = [];
        this.tileColors = [];
        this.cols = 40;
        this.rows = 25;
        this.tileWidth = 0;
        this.tileHeight = 0;
        this.isScrambled = false;
        this.hasScrambled = false;

        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Start button
        this.startBtn.addEventListener('click', () => this.showMainView());

        // File upload
        this.uploadZone.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Drag and drop
        this.uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadZone.classList.add('dragover');
        });

        this.uploadZone.addEventListener('dragleave', () => {
            this.uploadZone.classList.remove('dragover');
        });

        this.uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadZone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.loadImage(file);
            }
        });

        // Grid size selection
        this.gridSizeSelect.addEventListener('change', () => {
            const value = this.gridSizeSelect.value;
            if (value === 'custom') {
                this.customGridGroup.classList.remove('hidden');
            } else {
                this.customGridGroup.classList.add('hidden');
                this.updateGridSize(value);
            }
        });

        this.customCols.addEventListener('input', () => {
            if (this.gridSizeSelect.value === 'custom') {
                this.updateCustomGrid();
            }
        });

        this.customRows.addEventListener('input', () => {
            if (this.gridSizeSelect.value === 'custom') {
                this.updateCustomGrid();
            }
        });

        // Show grid checkbox
        this.showGridCheckbox.addEventListener('change', () => {
            if (this.image) {
                this.render();
            }
        });

        // Control buttons
        this.scrambleBtn.addEventListener('click', () => this.scramble());
        this.buildBtn.addEventListener('click', () => this.buildArt());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.downloadBtn.addEventListener('click', () => this.download());
        this.uploadBtn.addEventListener('click', () => this.fileInput.click());

        // Prevent pinch zoom on iOS
        document.addEventListener('gesturestart', (e) => e.preventDefault());
        document.addEventListener('gesturechange', (e) => e.preventDefault());
    }

    showMainView() {
        this.startScreen.classList.add('hidden');
        this.header.classList.remove('hidden');
        this.mainView.classList.remove('hidden');
    }

    updateGridSize(preset) {
        switch(preset) {
            case '500':
                this.cols = 22;
                this.rows = 23;
                break;
            case '1000':
                this.cols = 40;
                this.rows = 25;
                break;
            case '2000':
                this.cols = 50;
                this.rows = 40;
                break;
        }

        // Hide art mode if grid size changes to unsupported size
        this.checkArtModeAvailability();

        if (this.image) {
            this.processImage();
        }
    }

    updateCustomGrid() {
        this.cols = parseInt(this.customCols.value) || 40;
        this.rows = parseInt(this.customRows.value) || 25;

        // Hide art mode for custom grids
        this.checkArtModeAvailability();

        if (this.image) {
            this.processImage();
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.loadImage(file);
        }
    }

    loadImage(file) {
        this.showStatus('Loading image...');

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.image = img;
                this.processImage();
                this.showCanvas();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    processImage() {
        if (!this.image) return;

        this.showStatus('Processing image...');

        // Set source canvas size to match image
        this.sourceCanvas.width = this.image.width;
        this.sourceCanvas.height = this.image.height;

        // Draw image on source canvas
        this.sourceCtx.drawImage(this.image, 0, 0);

        // Calculate tile dimensions
        this.tileWidth = this.image.width / this.cols;
        this.tileHeight = this.image.height / this.rows;

        // Create tiles array
        this.createTiles();

        // Set display canvas size
        this.displayCanvas.width = this.image.width;
        this.displayCanvas.height = this.image.height;

        // Reset art mode state when reprocessing
        this.hasScrambled = false;
        this.checkArtModeAvailability();

        // Initial render
        this.isScrambled = false;
        this.render();
        this.updateStats();

        setTimeout(() => {
            this.hideStatus();
        }, 1000);
    }

    createTiles() {
        this.tiles = [];
        this.originalOrder = [];

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const tile = {
                    sourceX: col * this.tileWidth,
                    sourceY: row * this.tileHeight,
                    width: this.tileWidth,
                    height: this.tileHeight,
                    originalIndex: row * this.cols + col
                };
                this.tiles.push(tile);
                this.originalOrder.push(tile);
            }
        }
    }

    scramble() {
        if (!this.image) return;

        this.showStatus('Scrambling...');
        this.scrambleBtn.disabled = true;

        // Fisher-Yates shuffle algorithm
        const shuffled = [...this.tiles];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        this.tiles = shuffled;
        this.isScrambled = true;

        // Show BUILD button after first scramble (only for 1000 and 2000 grids)
        if (!this.hasScrambled && this.isArtModeSupported()) {
            this.hasScrambled = true;
            this.buildBtn.classList.remove('hidden');
            this.artModeRow.classList.remove('hidden');
            this.analyzeTileColors();
            this.updateControlsPosition();
        }

        // Animate the scramble
        setTimeout(() => {
            this.render();
            this.hideStatus();
            this.scrambleBtn.disabled = false;
        }, 100);
    }

    reset() {
        if (!this.image) return;

        this.showStatus('Resetting...');
        this.tiles = [...this.originalOrder];
        this.isScrambled = false;

        // Keep art mode available if it was already unlocked and grid size is supported
        if (this.hasScrambled && !this.isArtModeSupported()) {
            this.hasScrambled = false;
            this.checkArtModeAvailability();
        }

        setTimeout(() => {
            this.render();
            this.hideStatus();
        }, 100);
    }

    render() {
        if (!this.image) return;

        // Clear display canvas
        this.displayCtx.clearRect(0, 0, this.displayCanvas.width, this.displayCanvas.height);

        // Draw each tile in its current position
        for (let index = 0; index < this.tiles.length; index++) {
            const tile = this.tiles[index];

            // Safety check - ensure tile exists
            if (!tile) {
                console.warn(`Missing tile at index ${index}/${this.tiles.length}`);
                continue;
            }

            const destCol = index % this.cols;
            const destRow = Math.floor(index / this.cols);
            const destX = destCol * this.tileWidth;
            const destY = destRow * this.tileHeight;

            // Draw the tile from source canvas with proper rounding
            try {
                this.displayCtx.drawImage(
                    this.sourceCanvas,
                    Math.floor(tile.sourceX),
                    Math.floor(tile.sourceY),
                    Math.ceil(tile.width),
                    Math.ceil(tile.height),
                    Math.floor(destX),
                    Math.floor(destY),
                    Math.ceil(this.tileWidth),
                    Math.ceil(this.tileHeight)
                );
            } catch (e) {
                console.error(`Error drawing tile ${index}:`, e);
            }
        }

        // Draw grid overlay if enabled
        if (this.showGridCheckbox.checked) {
            this.drawGrid();
        }
    }

    drawGrid() {
        this.displayCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.displayCtx.lineWidth = 1;

        // Vertical lines
        for (let col = 0; col <= this.cols; col++) {
            const x = col * this.tileWidth;
            this.displayCtx.beginPath();
            this.displayCtx.moveTo(x, 0);
            this.displayCtx.lineTo(x, this.displayCanvas.height);
            this.displayCtx.stroke();
        }

        // Horizontal lines
        for (let row = 0; row <= this.rows; row++) {
            const y = row * this.tileHeight;
            this.displayCtx.beginPath();
            this.displayCtx.moveTo(0, y);
            this.displayCtx.lineTo(this.displayCanvas.width, y);
            this.displayCtx.stroke();
        }
    }

    download() {
        if (!this.image) return;

        const link = document.createElement('a');
        const filename = this.isScrambled ? 'ZHAENG_scrambled.png' : 'ZHAENG_image.png';
        link.download = filename;
        link.href = this.displayCanvas.toDataURL();
        link.click();

        this.showStatus('Downloaded!');
        setTimeout(() => {
            this.hideStatus();
        }, 2000);
    }

    showCanvas() {
        this.uploadZone.classList.add('hidden');
        this.canvasContainer.classList.remove('hidden');
    }

    updateStats() {
        this.totalPiecesEl.textContent = this.tiles.length;
        this.gridDimensionsEl.textContent = `${this.cols}×${this.rows}`;
    }

    showStatus(message) {
        this.statusEl.textContent = message;
        this.statusEl.classList.remove('hidden');
    }

    hideStatus() {
        this.statusEl.classList.add('hidden');
    }

    updateControlsPosition() {
        // Add class if art mode is visible, remove if not
        if (this.artModeRow && !this.artModeRow.classList.contains('hidden')) {
            this.controls.classList.add('with-art-mode');
        } else {
            this.controls.classList.remove('with-art-mode');
        }
    }

    isArtModeSupported() {
        // Art mode only works well with 1000 and 2000 grids
        const gridSize = this.cols * this.rows;
        return gridSize === 1000 || gridSize === 2000;
    }

    checkArtModeAvailability() {
        // Hide or show art mode based on grid size
        if (!this.isArtModeSupported()) {
            // Hide art mode controls
            this.buildBtn.classList.add('hidden');
            this.artModeRow.classList.add('hidden');
            this.hasScrambled = false;
            this.updateControlsPosition();
        }
    }

    // Art Building Methods
    analyzeTileColors() {
        this.showStatus('Analyzing colors...');
        this.tileColors = [];

        // Analyze all tiles
        for (let i = 0; i < this.tiles.length; i++) {
            const tile = this.tiles[i];

            // Get image data for this tile
            const imageData = this.sourceCtx.getImageData(
                Math.floor(tile.sourceX),
                Math.floor(tile.sourceY),
                Math.ceil(tile.width),
                Math.ceil(tile.height)
            );

            const avgColor = getAverageColor(imageData);
            const hsl = rgbToHsl(avgColor.r, avgColor.g, avgColor.b);

            this.tileColors.push({
                index: i,
                tile: tile,
                rgb: avgColor,
                hsl: hsl
            });
        }

        console.log(`Analyzed ${this.tileColors.length} tiles (grid: ${this.cols}×${this.rows})`);
        setTimeout(() => this.hideStatus(), 1000);
    }

    buildArt() {
        if (!this.hasScrambled || !this.isArtModeSupported()) {
            this.showStatus('Art mode not available for this grid size');
            setTimeout(() => this.hideStatus(), 2000);
            return;
        }

        const mode = this.artModeSelect.value;
        this.showStatus(`Building ${mode} art...`);
        this.buildBtn.disabled = true;

        setTimeout(() => {
            const expectedTiles = this.cols * this.rows;

            switch(mode) {
                case 'rainbow':
                    this.buildRainbow();
                    break;
                case 'brightness':
                    this.buildBrightness();
                    break;
                case 'spiral':
                    this.buildSpiral();
                    break;
                case 'circles':
                    this.buildCircles();
                    break;
                case 'mondrian':
                    this.buildMondrian();
                    break;
                case 'colorwheel':
                    this.buildColorWheel();
                    break;
                case 'diagonal':
                    this.buildDiagonal();
                    break;
            }

            // Validate tile count
            if (this.tiles.length !== expectedTiles) {
                console.error(`Tile count mismatch: ${this.tiles.length} vs expected ${expectedTiles}`);
            }

            this.render();
            this.hideStatus();
            this.buildBtn.disabled = false;
        }, 100);
    }

    buildRainbow() {
        // Sort by hue for rainbow effect
        const sorted = [...this.tileColors].sort((a, b) => a.hsl.h - b.hsl.h);
        this.tiles = sorted.map(tc => tc.tile);
    }

    buildBrightness() {
        // Sort by lightness (Rothko-inspired bands)
        const sorted = [...this.tileColors].sort((a, b) => a.hsl.l - b.hsl.l);
        this.tiles = sorted.map(tc => tc.tile);
    }

    buildSpiral() {
        // Create spiral pattern from center outward
        const sorted = [...this.tileColors].sort((a, b) => a.hsl.h - b.hsl.h);
        const newTiles = new Array(this.tiles.length).fill(null);
        const centerX = Math.floor(this.cols / 2);
        const centerY = Math.floor(this.rows / 2);

        // Generate spiral coordinates - improved algorithm
        const used = new Set();
        const coords = [];
        let x = centerX, y = centerY;
        let dx = 0, dy = -1;
        let steps = 1;
        let stepCount = 0;
        let turnCount = 0;

        while (coords.length < this.tiles.length) {
            if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
                const index = y * this.cols + x;
                if (!used.has(index)) {
                    coords.push({ x, y, index });
                    used.add(index);
                }
            }

            stepCount++;
            x += dx;
            y += dy;

            if (stepCount === steps) {
                stepCount = 0;
                turnCount++;
                // Turn right
                [dx, dy] = [-dy, dx];
                if (turnCount === 2) {
                    turnCount = 0;
                    steps++;
                }
            }
        }

        // Place tiles in spiral order
        coords.forEach((coord, i) => {
            if (i < sorted.length) {
                newTiles[coord.index] = sorted[i].tile;
            }
        });

        this.tiles = newTiles;
    }

    buildCircles() {
        // Concentric circles from center
        const sorted = [...this.tileColors].sort((a, b) => a.hsl.s - b.hsl.s);
        const centerX = this.cols / 2;
        const centerY = this.rows / 2;

        // Calculate distance from center for each position
        const distances = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const dx = col - centerX;
                const dy = row - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                distances.push({ index: row * this.cols + col, dist });
            }
        }

        // Sort by distance and map tiles
        distances.sort((a, b) => a.dist - b.dist);

        const newTiles = new Array(this.tiles.length);
        for (let i = 0; i < this.tiles.length; i++) {
            newTiles[distances[i].index] = sorted[i].tile;
        }

        this.tiles = newTiles;
    }

    buildMondrian() {
        // Group by primary colors (inspired by Mondrian)
        const groups = {
            red: [],
            yellow: [],
            blue: [],
            black: [],
            white: []
        };

        // Classify each tile by color
        this.tileColors.forEach(tc => {
            const { h, s, l } = tc.hsl;

            if (l < 0.15) {
                groups.black.push(tc);
            } else if (l > 0.85) {
                groups.white.push(tc);
            } else if (s > 0.5) {
                if (h < 30 || h > 330) groups.red.push(tc);
                else if (h < 70) groups.yellow.push(tc);
                else if (h < 250) groups.blue.push(tc);
                else groups.white.push(tc);
            } else {
                groups.white.push(tc);
            }
        });

        // Sort each group by lightness for smoother transitions
        Object.keys(groups).forEach(key => {
            groups[key].sort((a, b) => a.hsl.l - b.hsl.l);
        });

        // Arrange in blocks
        const newTiles = [];
        ['red', 'yellow', 'blue', 'black', 'white'].forEach(color => {
            newTiles.push(...groups[color].map(tc => tc.tile));
        });

        this.tiles = newTiles;
    }

    buildColorWheel() {
        // Circular color wheel arrangement
        const sorted = [...this.tileColors].sort((a, b) => a.hsl.h - b.hsl.h);
        const centerX = this.cols / 2;
        const centerY = this.rows / 2;

        // Calculate angle from center for each position
        const positions = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const dx = col - centerX;
                const dy = row - centerY;
                let angle = Math.atan2(dy, dx) * 180 / Math.PI;
                if (angle < 0) angle += 360;
                positions.push({ index: row * this.cols + col, angle });
            }
        }

        // Sort by angle and map tiles
        positions.sort((a, b) => a.angle - b.angle);

        const newTiles = new Array(this.tiles.length);
        for (let i = 0; i < this.tiles.length; i++) {
            newTiles[positions[i].index] = sorted[i].tile;
        }

        this.tiles = newTiles;
    }

    buildDiagonal() {
        // Diagonal gradient
        const sorted = [...this.tileColors].sort((a, b) => {
            return (a.hsl.h + a.hsl.l * 360) - (b.hsl.h + b.hsl.l * 360);
        });

        // Calculate diagonal position for each grid position
        const diagonals = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                diagonals.push({ index: row * this.cols + col, sum: row + col });
            }
        }

        // Sort by diagonal position and map tiles
        diagonals.sort((a, b) => a.sum - b.sum);

        const newTiles = new Array(this.tiles.length);
        for (let i = 0; i < this.tiles.length; i++) {
            newTiles[diagonals[i].index] = sorted[i].tile;
        }

        this.tiles = newTiles;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    const scrambler = new ImageScrambler();
});

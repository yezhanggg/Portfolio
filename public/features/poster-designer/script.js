// ==================== PARTICLE SYSTEM ====================

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

// Create background particles (soda bubbles)
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

// Initialize particles
createParticles();

// ==================== APPLICATION STATE ====================

const state = {
    image: null,
    layers: [],
    selectedLayerId: null,
    canvas: null,
    ctx: null,
    cropMode: false,
    cropBounds: null,
    originalImage: null,
    curveAmount: 0
};

// Text style presets
const textStyles = {
    impact: {
        fontFamily: 'Impact, Arial Black, sans-serif',
        fontWeight: '900',
        fontSize: 1,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        stroke: true,
        strokeWidth: 8,
        strokeColor: '#000',
        shadow: true,
        shadowBlur: 4,
        shadowColor: 'rgba(0,0,0,0.5)'
    },
    neon: {
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold',
        fontSize: 1,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        stroke: false,
        shadow: true,
        shadowBlur: 20,
        shadowColor: 'currentColor',
        glow: true
    },
    graffiti: {
        fontFamily: 'Comic Sans MS, cursive, sans-serif',
        fontWeight: 'bold',
        fontSize: 1.2,
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
        stroke: true,
        strokeWidth: 6,
        strokeColor: '#000',
        shadow: true,
        shadowBlur: 8,
        shadowColor: 'rgba(0,0,0,0.6)',
        skew: 5
    },
    retro: {
        fontFamily: 'Courier New, monospace',
        fontWeight: 'bold',
        fontSize: 1,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        stroke: true,
        strokeWidth: 4,
        strokeColor: '#ff6b6b',
        shadow: true,
        shadowBlur: 0,
        shadowColor: '#000',
        offsetShadow: true
    },
    brutalist: {
        fontFamily: 'Arial Black, sans-serif',
        fontWeight: '900',
        fontSize: 1.3,
        letterSpacing: '0',
        textTransform: 'uppercase',
        stroke: true,
        strokeWidth: 12,
        strokeColor: '#000',
        fill: false
    },
    pop3d: {
        fontFamily: 'Impact, sans-serif',
        fontWeight: '900',
        fontSize: 1,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        stroke: true,
        strokeWidth: 6,
        strokeColor: '#000',
        shadow: true,
        shadowBlur: 0,
        shadowColor: '#000',
        multiShadow: true
    },
    glitch: {
        fontFamily: 'Courier New, monospace',
        fontWeight: 'bold',
        fontSize: 1,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        stroke: false,
        glitchEffect: true
    },
    stencil: {
        fontFamily: 'Impact, sans-serif',
        fontWeight: '900',
        fontSize: 1,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        stroke: true,
        strokeWidth: 10,
        strokeColor: '#000',
        fill: false,
        shadow: true,
        shadowBlur: 6,
        shadowColor: 'rgba(0,0,0,0.3)'
    },
    outline: {
        fontFamily: 'Arial Black, sans-serif',
        fontWeight: '900',
        fontSize: 1,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        stroke: true,
        strokeWidth: 5,
        strokeColor: '#000',
        fill: true
    },
    shadow: {
        fontFamily: 'Arial Black, sans-serif',
        fontWeight: '900',
        fontSize: 1,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        stroke: false,
        shadow: true,
        shadowBlur: 0,
        shadowColor: '#000',
        offsetShadow: true,
        offsetX: 8,
        offsetY: 8
    },
    vintage: {
        fontFamily: 'Georgia, serif',
        fontWeight: 'bold',
        fontSize: 1,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        stroke: true,
        strokeWidth: 3,
        strokeColor: '#8b4513',
        shadow: true,
        shadowBlur: 4,
        shadowColor: 'rgba(0,0,0,0.4)'
    },
    marker: {
        fontFamily: 'Comic Sans MS, cursive',
        fontWeight: 'bold',
        fontSize: 1.1,
        letterSpacing: '0.05em',
        textTransform: 'none',
        stroke: false,
        shadow: true,
        shadowBlur: 3,
        shadowColor: 'rgba(0,0,0,0.3)'
    }
};

// ==================== DOM ELEMENTS ====================

const startScreen = document.getElementById('start-screen');
const mainView = document.getElementById('main-view');
const startBtn = document.getElementById('start-btn');
const uploadSection = document.getElementById('upload-section');
const editorSection = document.getElementById('editor-section');
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const canvas = document.getElementById('preview-canvas');
const ctx = canvas.getContext('2d');
const layersList = document.getElementById('layers-list');
const layerCount = document.getElementById('layer-count');
const addLayerBtn = document.getElementById('add-layer-btn');
const textInput = document.getElementById('text-input');
const sizeSlider = document.getElementById('size-slider');
const sizeValue = document.getElementById('size-value');
const xSlider = document.getElementById('x-slider');
const xValue = document.getElementById('x-value');
const ySlider = document.getElementById('y-slider');
const yValue = document.getElementById('y-value');
const rotationSlider = document.getElementById('rotation-slider');
const rotationValue = document.getElementById('rotation-value');
const colorPicker = document.getElementById('color-picker');
const curveSlider = document.getElementById('curve-slider');
const curveValueSpan = document.getElementById('curve-value');
const cropBtn = document.getElementById('crop-btn');
const applyCropBtn = document.getElementById('apply-crop-btn');
const cropOverlay = document.getElementById('crop-overlay');
const saveBtn = document.getElementById('save-btn');
const newBtn = document.getElementById('new-btn');
const autoDesignBtn = document.getElementById('auto-design-btn');
const designSuggestions = document.getElementById('design-suggestions');

state.canvas = canvas;
state.ctx = ctx;

// ==================== EVENT LISTENERS ====================

// Start button
startBtn.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    mainView.classList.remove('hidden');
});

// Upload area
uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#000';
});
uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = 'rgba(0,0,0,0.2)';
});
uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = 'rgba(0,0,0,0.2)';
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        loadImage(file);
    }
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        loadImage(file);
    }
});

// Layer management
addLayerBtn.addEventListener('click', addTextLayer);

// Text controls
textInput.addEventListener('input', updateSelectedLayer);

// Style buttons
document.querySelectorAll('.style-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const style = btn.dataset.style;
        if (state.selectedLayerId !== null) {
            const layer = state.layers.find(l => l.id === state.selectedLayerId);
            if (layer) {
                layer.style = style;
                render();
            }
        }
    });
});

// Transform sliders
sizeSlider.addEventListener('input', (e) => {
    sizeValue.textContent = e.target.value;
    updateSelectedLayer();
});

xSlider.addEventListener('input', (e) => {
    xValue.textContent = e.target.value;
    updateSelectedLayer();
});

ySlider.addEventListener('input', (e) => {
    yValue.textContent = e.target.value;
    updateSelectedLayer();
});

rotationSlider.addEventListener('input', (e) => {
    rotationValue.textContent = e.target.value;
    updateSelectedLayer();
});

colorPicker.addEventListener('input', updateSelectedLayer);

// Curve slider
curveSlider.addEventListener('input', (e) => {
    state.curveAmount = parseInt(e.target.value);
    curveValueSpan.textContent = state.curveAmount;
    render();
});

// Crop controls
cropBtn.addEventListener('click', enterCropMode);
applyCropBtn.addEventListener('click', applyCrop);

// Actions
saveBtn.addEventListener('click', savePoster);
newBtn.addEventListener('click', newPoster);
autoDesignBtn.addEventListener('click', generateAutoDesigns);

// ==================== IMAGE HANDLING ====================

function loadImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            state.image = img;
            state.originalImage = img;

            // Set canvas size to match image
            const maxWidth = 800;
            const maxHeight = 600;
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
            }

            canvas.width = width;
            canvas.height = height;

            // Show editor
            uploadSection.classList.add('hidden');
            editorSection.classList.remove('hidden');

            // Reset state
            state.layers = [];
            state.selectedLayerId = null;
            state.curveAmount = 0;
            curveSlider.value = 0;
            curveValueSpan.textContent = 0;

            render();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ==================== LAYER MANAGEMENT ====================

function addTextLayer() {
    const id = Date.now();
    const layer = {
        id,
        type: 'text',
        text: textInput.value || 'YOUR TEXT',
        style: 'impact',
        size: 80,
        x: 50,
        y: 50,
        rotation: 0,
        color: '#ffffff'
    };

    state.layers.push(layer);
    state.selectedLayerId = id;

    updateLayersList();
    updateControls();
    render();
}

function selectLayer(id) {
    state.selectedLayerId = id;
    updateLayersList();
    updateControls();
}

function deleteLayer(id) {
    state.layers = state.layers.filter(l => l.id !== id);
    if (state.selectedLayerId === id) {
        state.selectedLayerId = state.layers.length > 0 ? state.layers[0].id : null;
    }
    updateLayersList();
    updateControls();
    render();
}

function updateLayersList() {
    layersList.innerHTML = '';
    layerCount.textContent = state.layers.length;

    state.layers.forEach((layer, index) => {
        const layerDiv = document.createElement('div');
        layerDiv.className = 'layer-item' + (layer.id === state.selectedLayerId ? ' active' : '');
        layerDiv.innerHTML = `
            <span class="layer-name">${layer.text.substring(0, 20)}${layer.text.length > 20 ? '...' : ''}</span>
            <button class="delete-layer" data-id="${layer.id}">×</button>
        `;

        layerDiv.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-layer')) {
                selectLayer(layer.id);
            }
        });

        layerDiv.querySelector('.delete-layer').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteLayer(layer.id);
        });

        layersList.appendChild(layerDiv);
    });
}

function updateControls() {
    const layer = state.layers.find(l => l.id === state.selectedLayerId);

    if (layer) {
        textInput.value = layer.text;
        sizeSlider.value = layer.size;
        sizeValue.textContent = layer.size;
        xSlider.value = layer.x;
        xValue.textContent = layer.x;
        ySlider.value = layer.y;
        yValue.textContent = layer.y;
        rotationSlider.value = layer.rotation;
        rotationValue.textContent = layer.rotation;
        colorPicker.value = layer.color;

        // Update active style button
        document.querySelectorAll('.style-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.style === layer.style);
        });
    }
}

function updateSelectedLayer() {
    const layer = state.layers.find(l => l.id === state.selectedLayerId);

    if (layer) {
        layer.text = textInput.value;
        layer.size = parseInt(sizeSlider.value);
        layer.x = parseInt(xSlider.value);
        layer.y = parseInt(ySlider.value);
        layer.rotation = parseInt(rotationSlider.value);
        layer.color = colorPicker.value;

        updateLayersList();
        render();
    }
}

// ==================== RENDERING ====================

function render() {
    if (!state.image) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw image with curve effect
    if (state.curveAmount !== 0) {
        drawCurvedImage();
    } else {
        ctx.drawImage(state.image, 0, 0, canvas.width, canvas.height);
    }

    // Draw all text layers
    state.layers.forEach(layer => {
        if (layer.type === 'text') {
            drawTextLayer(layer);
        }
    });
}

function drawCurvedImage() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    tempCtx.drawImage(state.image, 0, 0, canvas.width, canvas.height);
    const imageData = tempCtx.getImageData(0, 0, canvas.width, canvas.height);
    const newImageData = ctx.createImageData(canvas.width, canvas.height);

    const curveIntensity = state.curveAmount / 100;

    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            // Calculate curve offset
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const dx = x - centerX;
            const dy = y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);

            const offset = (distance / maxDistance) * curveIntensity * 50;
            const angle = Math.atan2(dy, dx);

            const sourceX = Math.round(x + Math.cos(angle) * offset);
            const sourceY = Math.round(y + Math.sin(angle) * offset);

            if (sourceX >= 0 && sourceX < canvas.width && sourceY >= 0 && sourceY < canvas.height) {
                const sourceIndex = (sourceY * canvas.width + sourceX) * 4;
                const targetIndex = (y * canvas.width + x) * 4;

                newImageData.data[targetIndex] = imageData.data[sourceIndex];
                newImageData.data[targetIndex + 1] = imageData.data[sourceIndex + 1];
                newImageData.data[targetIndex + 2] = imageData.data[sourceIndex + 2];
                newImageData.data[targetIndex + 3] = imageData.data[sourceIndex + 3];
            }
        }
    }

    ctx.putImageData(newImageData, 0, 0);
}

function drawTextLayer(layer) {
    const style = textStyles[layer.style];
    if (!style) return;

    ctx.save();

    // Transform
    const x = (layer.x / 100) * canvas.width;
    const y = (layer.y / 100) * canvas.height;
    ctx.translate(x, y);
    ctx.rotate((layer.rotation * Math.PI) / 180);

    // Font
    const fontSize = (layer.size / 100) * canvas.height * (style.fontSize || 1);
    ctx.font = `${style.fontWeight || 'normal'} ${fontSize}px ${style.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Letter spacing
    if (style.letterSpacing) {
        ctx.letterSpacing = `${parseFloat(style.letterSpacing) * fontSize}px`;
    }

    let text = layer.text;
    if (style.textTransform === 'uppercase') {
        text = text.toUpperCase();
    } else if (style.textTransform === 'lowercase') {
        text = text.toLowerCase();
    }

    // Apply effects
    if (style.multiShadow) {
        // 3D effect with multiple shadows
        for (let i = 6; i > 0; i--) {
            ctx.fillStyle = `rgba(0,0,0,${0.8 - i * 0.1})`;
            ctx.fillText(text, i * 2, i * 2);
        }
    }

    if (style.offsetShadow) {
        const offsetX = style.offsetX || 6;
        const offsetY = style.offsetY || 6;
        ctx.fillStyle = style.shadowColor || '#000';
        ctx.fillText(text, offsetX, offsetY);
    } else if (style.shadow) {
        ctx.shadowBlur = style.shadowBlur || 0;
        ctx.shadowColor = style.shadowColor === 'currentColor' ? layer.color : style.shadowColor;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }

    // Stroke
    if (style.stroke) {
        ctx.strokeStyle = style.strokeColor || '#000';
        ctx.lineWidth = style.strokeWidth || 5;
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.strokeText(text, 0, 0);
    }

    // Fill
    if (style.fill !== false) {
        ctx.fillStyle = layer.color;
        ctx.fillText(text, 0, 0);
    }

    // Glitch effect
    if (style.glitchEffect) {
        ctx.fillStyle = 'rgba(255,0,0,0.7)';
        ctx.fillText(text, -2, 0);
        ctx.fillStyle = 'rgba(0,255,255,0.7)';
        ctx.fillText(text, 2, 0);
        ctx.fillStyle = layer.color;
        ctx.fillText(text, 0, 0);
    }

    ctx.restore();
}

// ==================== CROP FUNCTIONALITY ====================

let cropDragMode = null;
let cropDragStart = { x: 0, y: 0 };

function enterCropMode() {
    state.cropMode = true;
    cropBtn.style.display = 'none';
    applyCropBtn.style.display = 'inline-block';
    cropOverlay.classList.remove('hidden');

    // Initialize crop bounds
    state.cropBounds = {
        x: canvas.width * 0.1,
        y: canvas.height * 0.1,
        width: canvas.width * 0.8,
        height: canvas.height * 0.8
    };

    updateCropOverlay();
    setupCropHandlers();
}

function updateCropOverlay() {
    const bounds = state.cropBounds;
    cropOverlay.style.left = bounds.x + 'px';
    cropOverlay.style.top = bounds.y + 'px';
    cropOverlay.style.width = bounds.width + 'px';
    cropOverlay.style.height = bounds.height + 'px';
}

function setupCropHandlers() {
    const handles = cropOverlay.querySelectorAll('.crop-handle');

    handles.forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            cropDragMode = handle.classList.contains('tl') ? 'tl' :
                          handle.classList.contains('tr') ? 'tr' :
                          handle.classList.contains('bl') ? 'bl' : 'br';
            cropDragStart = { x: e.clientX, y: e.clientY };

            document.addEventListener('mousemove', handleCropDrag);
            document.addEventListener('mouseup', stopCropDrag);
        });
    });
}

function handleCropDrag(e) {
    if (!cropDragMode) return;

    const dx = e.clientX - cropDragStart.x;
    const dy = e.clientY - cropDragStart.y;
    const bounds = state.cropBounds;

    switch (cropDragMode) {
        case 'tl':
            bounds.x += dx;
            bounds.y += dy;
            bounds.width -= dx;
            bounds.height -= dy;
            break;
        case 'tr':
            bounds.y += dy;
            bounds.width += dx;
            bounds.height -= dy;
            break;
        case 'bl':
            bounds.x += dx;
            bounds.width -= dx;
            bounds.height += dy;
            break;
        case 'br':
            bounds.width += dx;
            bounds.height += dy;
            break;
    }

    // Constrain bounds
    bounds.x = Math.max(0, Math.min(bounds.x, canvas.width - 50));
    bounds.y = Math.max(0, Math.min(bounds.y, canvas.height - 50));
    bounds.width = Math.max(50, Math.min(bounds.width, canvas.width - bounds.x));
    bounds.height = Math.max(50, Math.min(bounds.height, canvas.height - bounds.y));

    cropDragStart = { x: e.clientX, y: e.clientY };
    updateCropOverlay();
}

function stopCropDrag() {
    cropDragMode = null;
    document.removeEventListener('mousemove', handleCropDrag);
    document.removeEventListener('mouseup', stopCropDrag);
}

function applyCrop() {
    if (!state.cropBounds) return;

    const bounds = state.cropBounds;

    // Create cropped image
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = bounds.width;
    croppedCanvas.height = bounds.height;
    const croppedCtx = croppedCanvas.getContext('2d');

    croppedCtx.drawImage(
        canvas,
        bounds.x, bounds.y, bounds.width, bounds.height,
        0, 0, bounds.width, bounds.height
    );

    // Update canvas size
    canvas.width = bounds.width;
    canvas.height = bounds.height;

    // Create new image from cropped data
    const img = new Image();
    img.onload = () => {
        state.image = img;
        exitCropMode();
        render();
    };
    img.src = croppedCanvas.toDataURL();
}

function exitCropMode() {
    state.cropMode = false;
    cropBtn.style.display = 'inline-block';
    applyCropBtn.style.display = 'none';
    cropOverlay.classList.add('hidden');
    state.cropBounds = null;
}

// ==================== AI AUTO DESIGN ====================

function generateAutoDesigns() {
    if (!state.image) return;

    autoDesignBtn.textContent = '✨ Generating...';
    autoDesignBtn.disabled = true;

    // Analyze image (simple color and composition analysis)
    const analysis = analyzeImage();

    // Generate 4 design suggestions
    const suggestions = [
        {
            text: analysis.suggestedText1,
            style: analysis.dominantColor === 'dark' ? 'neon' : 'impact',
            color: analysis.contrastColor,
            y: 20,
            rotation: 0
        },
        {
            text: analysis.suggestedText2,
            style: 'graffiti',
            color: '#ffffff',
            y: 80,
            rotation: -5
        },
        {
            text: analysis.suggestedText3,
            style: 'pop3d',
            color: analysis.accentColor,
            y: 50,
            rotation: 2
        },
        {
            text: analysis.suggestedText4,
            style: 'retro',
            color: '#ff6b6b',
            y: 35,
            rotation: 0
        }
    ];

    displaySuggestions(suggestions);

    setTimeout(() => {
        autoDesignBtn.textContent = '✨ Generate Designs';
        autoDesignBtn.disabled = false;
    }, 1000);
}

function analyzeImage() {
    // Sample image colors
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 50;
    tempCanvas.height = 50;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(state.image, 0, 0, 50, 50);

    const imageData = tempCtx.getImageData(0, 0, 50, 50);
    let totalR = 0, totalG = 0, totalB = 0;

    for (let i = 0; i < imageData.data.length; i += 4) {
        totalR += imageData.data[i];
        totalG += imageData.data[i + 1];
        totalB += imageData.data[i + 2];
    }

    const pixelCount = imageData.data.length / 4;
    const avgR = totalR / pixelCount;
    const avgG = totalG / pixelCount;
    const avgB = totalB / pixelCount;
    const brightness = (avgR + avgG + avgB) / 3;

    const dominantColor = brightness > 128 ? 'light' : 'dark';
    const contrastColor = dominantColor === 'dark' ? '#ffffff' : '#000000';

    // Determine accent color based on dominant channel
    let accentColor = '#ff6b6b';
    if (avgR > avgG && avgR > avgB) accentColor = '#ff6b6b';
    else if (avgG > avgR && avgG > avgB) accentColor = '#4ecdc4';
    else if (avgB > avgR && avgB > avgG) accentColor = '#6c5ce7';

    // Generate text suggestions
    const textSuggestions = [
        ['BOLD', 'STATEMENT', 'IMPACT', 'POWER'],
        ['CREATIVE', 'DESIGN', 'ART', 'STYLE'],
        ['ENERGY', 'VIBE', 'MOOD', 'FEEL'],
        ['RETRO', 'VINTAGE', 'CLASSIC', 'TIMELESS']
    ];

    return {
        dominantColor,
        contrastColor,
        accentColor,
        suggestedText1: textSuggestions[0][Math.floor(Math.random() * 4)],
        suggestedText2: textSuggestions[1][Math.floor(Math.random() * 4)],
        suggestedText3: textSuggestions[2][Math.floor(Math.random() * 4)],
        suggestedText4: textSuggestions[3][Math.floor(Math.random() * 4)]
    };
}

function displaySuggestions(suggestions) {
    designSuggestions.innerHTML = '';
    designSuggestions.classList.remove('hidden');

    suggestions.forEach((suggestion, index) => {
        const suggestionDiv = document.createElement('div');
        suggestionDiv.className = 'suggestion-card';
        suggestionDiv.innerHTML = `
            <div class="suggestion-preview" style="background: linear-gradient(135deg, ${suggestion.color}, ${adjustColor(suggestion.color, -20)})">
                <span style="font-size: 24px; font-weight: bold; color: white; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">${suggestion.text}</span>
            </div>
            <div class="suggestion-info">
                <strong>${suggestion.style.toUpperCase()}</strong>
                <button class="apply-suggestion" data-index="${index}">Apply</button>
            </div>
        `;

        suggestionDiv.querySelector('.apply-suggestion').addEventListener('click', () => {
            applySuggestion(suggestion);
        });

        designSuggestions.appendChild(suggestionDiv);
    });
}

function applySuggestion(suggestion) {
    // Add new layer with suggested design
    const id = Date.now();
    const layer = {
        id,
        type: 'text',
        text: suggestion.text,
        style: suggestion.style,
        size: 80,
        x: 50,
        y: suggestion.y,
        rotation: suggestion.rotation,
        color: suggestion.color
    };

    state.layers.push(layer);
    state.selectedLayerId = id;

    updateLayersList();
    updateControls();
    render();

    // Hide suggestions
    designSuggestions.classList.add('hidden');
}

function adjustColor(color, amount) {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// ==================== SAVE & NEW ====================

function savePoster() {
    if (!state.image) return;

    const link = document.createElement('a');
    link.download = `poster-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
}

function newPoster() {
    if (state.layers.length > 0 && !confirm('Start a new poster? Current work will be lost.')) {
        return;
    }

    // Reset state
    state.image = null;
    state.originalImage = null;
    state.layers = [];
    state.selectedLayerId = null;
    state.curveAmount = 0;

    // Reset UI
    editorSection.classList.add('hidden');
    uploadSection.classList.remove('hidden');
    fileInput.value = '';
    curveSlider.value = 0;
    curveValueSpan.textContent = 0;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

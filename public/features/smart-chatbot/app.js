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

// Initialize particles
createParticles();

// Chat Application Logic

// Initialize all engines
const aiIntegration = new AIIntegration();
const generativeEngine = new GenerativeEngine();
const githubLogger = new GitHubLogger();
const advancedNLP = new AdvancedNLP(); // NEW: Advanced NLP with memory, intent, sentiment

// Initialize chatbot with all enhancements
const chatbot = new ChatbotEngine(knowledgeBase, aiIntegration, generativeEngine, githubLogger, advancedNLP);

// DOM elements
const startScreen = document.getElementById('start-screen');
const mainView = document.getElementById('main-view');
const startBtn = document.getElementById('start-btn');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');

// Start button click
startBtn.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    mainView.classList.remove('hidden');
    chatInput.focus();
});

// Add message to chat
function addMessage(text, type = 'bot') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;

    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show typing indicator
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot';
    typingDiv.id = 'typing-indicator';

    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.innerHTML = '<span></span><span></span><span></span>';

    typingDiv.appendChild(indicator);
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Remove typing indicator
function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Handle sending message
async function sendMessage() {
    const question = chatInput.value.trim();

    if (!question) return;

    // Add user message
    addMessage(question, 'user');
    chatInput.value = '';

    // Show typing indicator
    showTypingIndicator();

    // Simulate thinking delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    // Get response from chatbot
    const response = await chatbot.getResponse(question);

    // Remove typing indicator
    removeTypingIndicator();

    // Add bot response
    addMessage(response.answer, 'bot');

    // If question was sent to email, show system message
    if (response.needsEmail) {
        setTimeout(() => {
            addMessage(
                "Your question will help me grow smarter!",
                'system'
            );
        }, 500);
    }
}

// Event listeners
sendButton.addEventListener('click', sendMessage);

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// ==================== SETTINGS REMOVED ====================
// All settings are now managed through the admin panel at /admin.html
// Regular users cannot access or view AI configuration

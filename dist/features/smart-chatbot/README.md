# Smart Chatbot - No AI API Required

A smart chatbot that understands natural language and provides answers **without using any AI APIs**. It uses advanced pattern matching, text similarity algorithms, and a knowledge base system.

**📚 370+ Q&A pairs across 15 categories!**
**🗣️ Enhanced with natural conversation training for human-like interactions!**
**🤖 Optional AI fallback with free APIs (Google Gemini, Groq, OpenRouter)!**
**🧠 Generative thinking engine for expanded, contextual responses!**
**📝 GitHub learning system - auto-logs unanswered questions for training!**

## How It Works

### The Magic Behind the Scenes

Instead of relying on expensive AI APIs, this chatbot uses:

1. **Knowledge Base**: A collection of question-answer pairs that the bot knows
2. **Text Similarity Algorithms**:
   - **Jaccard Similarity**: Compares word overlap between questions
   - **Cosine Similarity**: Measures semantic similarity using word vectors
   - **Pattern Matching**: Uses regex patterns for common question types
3. **Smart Preprocessing**:
   - Removes stop words (common words like "the", "is", "are")
   - Tokenization and normalization
   - Keyword extraction
4. **Confidence Scoring**: Only answers if it's confident enough
5. **Email Fallback**: Unknown questions are sent to you for learning

## Features

### Core Intelligence
- **370+ trained responses** - Comprehensive local knowledge base
- **Natural conversations** - Human-like interaction patterns
- **Emotional intelligence** - Responds to feelings and moods
- **Generative thinking** - Expands answers with context & reasoning
- **Fast responses** - No network calls for most questions
- **Privacy-friendly** - All processing happens locally

### Hybrid AI System (Optional)
- **AI Fallback** - Use free AI APIs when local knowledge fails
- **Multiple providers** - Google Gemini, Groq, or OpenRouter
- **Smart routing** - Local first, AI second (saves costs)
- **Easy setup** - Settings UI with 1-click configuration
- **No credit card** - All providers offer generous free tiers

### Self-Improving Learning (Optional)
- **GitHub Integration** - Auto-log unanswered questions to your repo
- **Review & Train** - Check logged questions, add to knowledge base
- **Continuous Growth** - Chatbot gets smarter over time
- **Analytics** - Track what users ask, identify patterns
- **Zero maintenance** - Fully automated logging

### User Experience
- **Beautiful UI** - Glassmorphism design matching ZHAENG's aesthetic
- **Animated particles** - Dynamic background effects
- **Start screen** - Engaging entry experience
- **Settings panel** - Configure AI & GitHub easily
- **Multiple fallbacks** - Local → AI → GitHub → Email

## Setup Instructions

### 1. Basic Setup (Local Only - No AI)

Simply open `index.html` in a web browser. That's it! No server required.

The chatbot works perfectly without any AI APIs, answering 370+ different questions using pattern matching.

### 2. Advanced Setup (With AI Fallback)

Want unlimited knowledge? Add free AI as a fallback:

1. **Choose a provider** (all free, no credit card):
   - [Google Gemini](https://aistudio.google.com/app/apikey) - Recommended, easiest
   - [Groq](https://console.groq.com/keys) - Fastest (300+ tokens/sec)
   - [OpenRouter](https://openrouter.ai/keys) - 50+ models

2. **Get free API key** from your chosen provider

3. **Configure in chatbot**:
   - Click ⚙️ settings button
   - Enable "AI Fallback"
   - Select provider
   - Paste API key
   - Save!

4. **Test it**: Ask anything! Local knowledge first, AI second.

**See [AI_SETUP_GUIDE.md](./AI_SETUP_GUIDE.md) for detailed instructions.**

### 3. Self-Improving Setup (With GitHub Logging)

Make your chatbot learn from users automatically:

1. **Create GitHub Personal Access Token**:
   - Visit [GitHub Tokens](https://github.com/settings/tokens/new)
   - Select "repo" scope
   - Generate & copy token

2. **Configure in chatbot**:
   - Click ⚙️ settings button
   - Scroll to "GitHub Learning System"
   - Enable GitHub Logging
   - Enter token, repo owner, repo name
   - Test connection
   - Save!

3. **How it works**:
   - Unanswered questions → Logged to GitHub (`unanswered_questions.json`)
   - You review questions periodically
   - Add popular ones to knowledge base
   - Chatbot gets smarter!

**See [GITHUB_LEARNING_GUIDE.md](./GITHUB_LEARNING_GUIDE.md) for complete setup.**

### 4. Customizing the Knowledge Base

Edit `knowledge-base.js` to add your own Q&A pairs:

```javascript
{
    question: "What is your question",
    answer: "Your short answer here",
    patterns: ["regex pattern"] // optional for better matching
}
```

**Tips for better matching:**
- Include variations of the same question
- Use patterns for flexible matching
- Keep answers short and clear
- Group related questions together

### 5. Email Configuration

The chatbot is already configured to send unknown questions to `yezhang0033@gmail.com` using FormSubmit.co (a free service).

**To change the email:**
1. Open `chatbot-engine.js`
2. Find `this.ownerEmail = 'yezhang0033@gmail.com'`
3. Replace with your email

**First time setup with FormSubmit:**
- The first email will be sent to confirm your email address
- Click the confirmation link they send you
- After that, all unknown questions will be forwarded automatically

## Design

The chatbot features a **glassmorphism** design aesthetic matching the ZHAENG image-scrambler:

- **Gray background** (#c9c9c9) with floating particles
- **Frosted glass containers** with backdrop blur
- **Smooth animations** using cubic-bezier transitions
- **Start screen** with glowing "CHAT" button
- **Circular send button** with hover effects
- **Responsive design** for all screen sizes

The UI creates a cohesive experience across all ZHAENG features!

## File Structure

```
smart-chatbot/
├── index.html                  # Chat interface UI with settings modal
├── style.css                   # Glassmorphism design & animations
├── chatbot-engine.js           # Core chatbot logic with all enhancements
├── knowledge-base.js           # 370+ Q&A pairs database
├── ai-integration.js           # AI API integration (Gemini, Groq, OpenRouter)
├── generative-engine.js        # Generative thinking & response expansion
├── github-logger.js            # GitHub integration for question logging
├── app.js                      # Application logic, particles & settings
├── README.md                   # This file (you are here)
├── AI_SETUP_GUIDE.md          # Detailed AI setup instructions
└── GITHUB_LEARNING_GUIDE.md   # Self-improving learning system guide
```

## Knowledge Base Categories

The chatbot comes pre-trained with **370+ Q&A pairs** across these categories:

### Core Knowledge (220 pairs)
1. **Greetings & Conversational** (10) - Hello, goodbye, thank you
2. **About ZHAENG** (6) - Site information and features
3. **Daily Questions** (8) - Time, date, day, weather
4. **General Knowledge** (15) - Geography, history, science
5. **Technology & Internet** (15) - Programming, internet, security
6. **Health & Wellness** (15) - Fitness, nutrition, mental health
7. **Food & Cooking** (15) - Recipes, cooking tips, diets
8. **Entertainment & Pop Culture** (14) - Movies, music, social media
9. **Travel & Geography** (14) - Travel tips, famous places
10. **Business & Work** (14) - Career advice, productivity
11. **Money & Finance** (10) - Saving, investing, budgeting
12. **Learning & Education** (8) - Study tips, concentration
13. **Random & Fun** (20) - Jokes, trivia, interesting facts
14. **Programming & Tech** (8) - Coding concepts, frameworks

### Conversational Training (150 pairs)
15. **Enhanced Greetings** - Good morning, evening, nice to meet you
16. **Small Talk** - How was your day, weekend plans, what's new
17. **Personal Questions** - Age, location, purpose, sleep, emotions
18. **Positive Emotions** - Happy, excited, grateful, proud, hopeful
19. **Negative Emotions** - Sad, stressed, frustrated, lonely, angry
20. **Requests & Commands** - Surprise me, make me laugh, cheer me up
21. **Enhanced Farewells** - Gotta run, catch you later, until next time
22. **Weather Talk** - Hot, cold, rainy, sunny, perfect weather
23. **Food Talk** - Hungry, cravings, diet, cooking
24. **Work Talk** - Exhausting day, promotion, job change, procrastination
25. **Hobbies** - Reading, guitar, photography, hiking, gaming
26. **Advice Seeking** - Friends, sleep, productivity, anxiety, confidence
27. **Compliments** - You're helpful, smart, understanding
28. **Opinions** - Social media, fate, colors, cats vs dogs
29. **Experiences** - Vacation, mistakes, achievements, dreams

**Dynamic Answers:** Time, date, day, month, and year questions update automatically!

## How to Expand the Knowledge Base

### Example 1: Simple Q&A

```javascript
{
    question: "What are your hours",
    answer: "We're open 24/7!",
    patterns: ["hours", "when (are|is) .* open"]
}
```

### Example 2: Dynamic Answers

```javascript
{
    question: "What time is it",
    answer: `It's ${new Date().toLocaleTimeString()}!`,
    patterns: ["what time", "current time"]
}
```

### Example 3: Multiple Patterns

```javascript
{
    question: "Help with pricing",
    answer: "Our basic plan is $10/month, pro is $30/month.",
    patterns: [
        "pricing",
        "how much (does|is|cost)",
        "price",
        "cost"
    ]
}
```

## Algorithm Details

### Text Similarity Calculation

The chatbot uses a weighted combination of multiple algorithms:

- **Jaccard Similarity (30%)**: Measures word overlap
  - Formula: `|A ∩ B| / |A ∪ B|`
  - Good for exact keyword matches

- **Cosine Similarity (40%)**: Measures semantic similarity
  - Formula: `(A · B) / (||A|| × ||B||)`
  - Better for understanding meaning

- **Keyword Bonus (30%)**: Extra score for phrase matches
  - Checks if important phrases appear in the question

- **Pattern Matching (50% bonus)**: Regex-based detection
  - Catches specific question formats

### Confidence Threshold

Default threshold: **0.4** (40%)
- Above 0.4: Bot answers confidently
- Below 0.4: Question sent to email

You can adjust this in `chatbot-engine.js`:
```javascript
this.confidenceThreshold = 0.4; // Lower = more answers, higher = more selective
```

## Advantages Over AI APIs

| Feature | This Chatbot | AI APIs |
|---------|-------------|---------|
| Cost | Free | $$ per request |
| Speed | Instant | 1-3 seconds |
| Privacy | 100% local | Data sent to servers |
| Customization | Full control | Limited |
| Offline | Works offline | Requires internet |
| Learning | Manual (via email) | Automatic |

## Future Enhancements

Want to make it even smarter? Consider adding:

1. **Spell correction** - Handle typos better
2. **Synonyms** - Recognize similar words
3. **Context memory** - Remember previous questions
4. **Auto-learning** - Automatically add approved Q&As
5. **Analytics** - Track which questions are most common
6. **Multi-language** - Support other languages

## Troubleshooting

**Q: Bot doesn't understand my question**
- Add more variations to knowledge base
- Check if patterns are too strict
- Lower the confidence threshold

**Q: Email fallback not working**
- Check FormSubmit.co is not blocked
- Verify email address is correct
- Check browser console for errors

**Q: Responses are too slow**
- Reduce knowledge base size
- Optimize pattern matching
- Check for infinite loops

## Try It Out!

Here are some example questions to test the chatbot's capabilities:

### General Knowledge
- "What is the capital of France?"
- "How many planets in solar system?"
- "Who painted the Mona Lisa?"
- "What is the speed of light?"

### Daily Questions
- "What time is it?"
- "What day is it?"
- "What's the weather?"

### Technology
- "What is blockchain?"
- "How does WiFi work?"
- "What is HTML?"
- "What is machine learning?"

### Conversational
- "Good morning!"
- "How was your day?"
- "I'm feeling happy today"
- "I'm stressed out"
- "Work was exhausting today"
- "Any plans for the weekend?"

### Emotional Support
- "I'm sad"
- "Cheer me up"
- "I'm worried"
- "I feel lonely"

### Fun & Helpful
- "Tell me a joke"
- "Surprise me"
- "Give me a fun fact"
- "Make me laugh"
- "How to save money?"
- "How to be more productive?"

The bot handles **370+ question variations** - try asking in different ways and watch it understand!

## Credits

Created for ZHAENG by Ye Zhang
- Email: yezhang0033@gmail.com
- No external libraries required
- Pure vanilla JavaScript

## License

Free to use and modify for your projects!

---

**Pro Tip**: Start with 20-30 common questions, then let the email system help you discover what users actually want to know. Add those questions to grow your knowledge base organically!

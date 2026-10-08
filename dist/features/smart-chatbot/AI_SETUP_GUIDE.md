# AI Integration Setup Guide

Your chatbot now has **hybrid intelligence**: local pattern matching + optional AI fallback!

## 🎯 How It Works

```
User asks question
    ↓
Try local knowledge base (370+ Q&A pairs)
    ↓
Found with >40% confidence? → Answer locally ✅ (Fast, Free, Private)
    ↓
Not found? → Query AI API 🤖 (Smart, Unlimited knowledge)
```

**Best of both worlds:**
- Known questions → Instant local answers (no cost, privacy-friendly)
- Unknown questions → AI handles it (unlimited knowledge)

---

## 🚀 Quick Start (5 Minutes)

### Option 1: Google Gemini (Recommended - Easiest)

1. **Get Free API Key**
   - Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Click "Create API Key"
   - Copy your key

2. **Configure Chatbot**
   - Open your chatbot
   - Click ⚙️ settings button
   - Enable "AI Fallback"
   - Select "Google Gemini"
   - Paste your API key
   - Click "Save Settings"

3. **Test It!**
   - Ask: "What's quantum computing?"
   - If local knowledge doesn't know → AI answers!

**Free Tier:**
- 15 requests/minute
- 1,500 requests/day
- Perfect for personal use!

---

### Option 2: Groq (Super Fast)

1. **Get Free API Key**
   - Go to [Groq Console](https://console.groq.com/keys)
   - Sign up (free)
   - Create API key

2. **Configure**
   - Settings → Select "Groq"
   - Paste API key → Save

**Free Tier:**
- 30 requests/minute
- 7,000 requests/day
- Lightning fast (300+ tokens/sec)!

---

### Option 3: OpenRouter (50+ Models)

1. **Get Free API Key**
   - Go to [OpenRouter](https://openrouter.ai/keys)
   - Sign up
   - Create key

2. **Configure**
   - Settings → Select "OpenRouter"
   - Paste API key → Save

**Free Tier:**
- Access to 50+ AI models
- Mix and match different AI providers

---

## ⚙️ Settings Explained

### AI Fallback Toggle
- **ON**: Unknown questions → AI answers
- **OFF**: Unknown questions → Email to owner

### AI Provider
Choose which free AI service to use:
- **Gemini**: Best for reliability, easiest setup
- **Groq**: Best for speed (300+ tokens/sec)
- **OpenRouter**: Best for variety (50+ models)

### API Key
Your personal key from the AI provider. Stored locally in your browser (private).

---

## 🧪 Testing Your Setup

### Test 1: Local Knowledge (Should be instant)
Ask: "What is ZHAENG?"
- ✅ Answered locally from knowledge base

### Test 2: AI Fallback (Requires API key)
Ask: "Explain quantum entanglement"
- ✅ AI provides answer (not in local knowledge)

### Test 3: Conversational
Ask: "I'm feeling stressed"
- ✅ Local empathetic response

### Test 4: Unknown to Both
Ask: "What's your favorite food?"
- ✅ Falls back to email notification

---

## 💡 Pro Tips

### 1. Start Local-First
Keep AI disabled initially. The 370+ local Q&A pairs handle most common questions for free!

### 2. Monitor Your Usage
Check your API provider's dashboard to track usage:
- Gemini: [Google AI Studio](https://aistudio.google.com/)
- Groq: [Groq Console](https://console.groq.com/)
- OpenRouter: [OpenRouter Dashboard](https://openrouter.ai/)

### 3. Expand Local Knowledge
Add common questions to `knowledge-base.js` instead of relying on AI:
- Saves API calls
- Faster responses
- More privacy

### 4. Switch Providers
Having issues? Try a different provider:
- Settings → Change provider → Save
- Each has different strengths

---

## 🔐 Privacy & Security

### Your API Key
- Stored **locally** in your browser (localStorage)
- **Never** sent to our servers
- Only sent to the AI provider you choose

### Data Flow
```
Your Browser → AI Provider (Google/Groq/OpenRouter)
              ↓
           Response back to your browser
```

### Clear Settings
To remove your API key:
- Settings → "Clear All" button
- Removes key from localStorage

---

## 📊 Comparison: Local vs AI

| Feature | Local (Pattern Matching) | AI Fallback |
|---------|-------------------------|-------------|
| Speed | Instant (<10ms) | 1-3 seconds |
| Cost | Free forever | Free tier limited |
| Privacy | 100% local | Sent to AI provider |
| Knowledge | 370+ trained topics | Unlimited |
| Internet | Works offline | Requires connection |
| Accuracy | High for trained topics | High for everything |

**Recommendation:** Use hybrid mode for best results!

---

## 🛠️ Troubleshooting

### "API Error" Messages

**Problem:** API key not working

**Solutions:**
1. Check key is copied correctly (no extra spaces)
2. Verify key is active in provider dashboard
3. Check free tier limits not exceeded
4. Try different provider

### "AI Not Responding"

**Problem:** No response from AI

**Solutions:**
1. Check internet connection
2. Verify AI toggle is ON
3. Confirm API key is saved
4. Check browser console for errors (F12)

### "Too Many Requests"

**Problem:** Hit rate limit

**Solutions:**
1. Wait a few minutes
2. Switch to different provider
3. Add common questions to local knowledge base

---

## 🎓 Example Use Cases

### Personal Assistant
- Local: Greetings, weather, time
- AI: Complex questions, advice, research

### Customer Support
- Local: FAQ, common issues, prices
- AI: Unique problems, detailed explanations

### Educational Tool
- Local: Basic facts, formulas, definitions
- AI: Explanations, examples, tutoring

### Creative Projects
- Local: Project info, features
- AI: Ideas, suggestions, brainstorming

---

## 📈 Scaling Up

### Need More Requests?

**Upgrade to Paid Tiers:**
- **Gemini**: $0.35 per 1M tokens (very affordable)
- **Groq**: Contact for pricing
- **OpenRouter**: Pay-as-you-go, various models

### Self-Hosting Option
Want complete control? Consider:
- Running local LLMs (Ollama, LM Studio)
- Requires more technical setup
- 100% private, unlimited usage

---

## 🤝 Best Practices

1. **Start Simple**
   - Enable AI for 1 week trial
   - Monitor which questions use AI
   - Add popular AI questions to local knowledge

2. **Optimize Costs**
   - Keep answers short (saves tokens)
   - Cache common AI responses locally
   - Set reasonable rate limits

3. **Maintain Balance**
   - Don't rely 100% on AI
   - Expand local knowledge base regularly
   - Use AI for truly novel questions

4. **User Experience**
   - Fast local answers = happy users
   - AI fallback = never say "I don't know"
   - Best of both approaches!

---

## 📚 Resources

### Official Documentation
- [Google Gemini API Docs](https://ai.google.dev/docs)
- [Groq Documentation](https://console.groq.com/docs)
- [OpenRouter Docs](https://openrouter.ai/docs)

### Community
- [Google AI Studio Forum](https://discuss.ai.google.dev/)
- [Groq Discord](https://groq.com/discord)
- [OpenRouter Discord](https://discord.gg/openrouter)

### Learning
- Free tier limits update regularly - check provider sites
- Test different models to find best fit
- Monitor usage patterns for optimization

---

## ✨ You're All Set!

Your chatbot now has:
- ✅ 370+ local Q&A pairs (fast, free, private)
- ✅ AI fallback for unlimited knowledge
- ✅ Beautiful glassmorphism UI
- ✅ Settings panel for easy configuration
- ✅ Hybrid intelligence system

**Enjoy your super-smart chatbot! 🚀**

---

Questions? Issues? Email: yezhang0033@gmail.com

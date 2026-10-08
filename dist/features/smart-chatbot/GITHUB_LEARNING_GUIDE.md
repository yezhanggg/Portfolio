# GitHub Learning System - Setup Guide

Transform your chatbot into a **self-improving AI** that learns from every unanswered question!

## 🎯 How It Works

```
User asks question online
    ↓
Chatbot tries to answer (370+ local Q&A)
    ↓
Can't answer with confidence?
    ↓
Automatically logs to GitHub → unanswered_questions.json
    ↓
You review & train locally
    ↓
Add to knowledge-base.js
    ↓
Chatbot gets smarter! 🚀
```

---

## 🚀 Quick Setup (10 Minutes)

### Step 1: Create GitHub Personal Access Token

1. **Go to GitHub Settings**
   - Visit: https://github.com/settings/tokens/new
   - Or: GitHub → Settings → Developer Settings → Personal Access Tokens → Tokens (classic)

2. **Configure Token**
   - **Note:** "Chatbot Learning System"
   - **Expiration:** No expiration (or your preference)
   - **Scopes:** Check ✓ `repo` (Full control of private repositories)

3. **Generate & Copy**
   - Click "Generate token"
   - **IMPORTANT:** Copy the token NOW (you won't see it again!)
   - Save it somewhere safe

### Step 2: Configure Chatbot

1. **Open your chatbot** and click ⚙️ settings

2. **Scroll to "GitHub Learning System"**

3. **Enable GitHub Logging**
   - ✓ Check "Enable GitHub Logging"

4. **Enter Your Details:**
   - **GitHub Token:** Paste the token you just created
   - **Repository Owner:** Your GitHub username (e.g., `ye`)
   - **Repository Name:** Your repo name (e.g., `ZHAENG`)

5. **Test Connection**
   - Click "Test GitHub Connection"
   - Should see: ✓ Connected to your-username/your-repo

6. **Save Settings**
   - Click "Save Settings"
   - Status should show: "GitHub Status: Enabled"

### Step 3: Deploy Online

When you publish your chatbot online, unanswered questions will automatically save to:
```
https://github.com/your-username/ZHAENG/blob/main/unanswered_questions.json
```

---

## 📊 Question Log Format

Questions are saved in JSON format:

```json
{
  "version": "1.0",
  "count": 3,
  "lastUpdated": "2025-01-18T10:30:00Z",
  "questions": [
    {
      "question": "What is quantum computing?",
      "timestamp": "2025-01-18T10:30:00Z",
      "confidence": 0.2,
      "userAgent": "Mozilla/5.0...",
      "referrer": "https://example.com",
      "sessionId": "session_1234567890_abc123"
    },
    {
      "question": "How do neural networks learn?",
      "timestamp": "2025-01-18T10:35:00Z",
      "confidence": 0.15,
      "userAgent": "Mozilla/5.0...",
      "referrer": "direct",
      "sessionId": "session_1234567890_xyz789"
    }
  ]
}
```

**Fields Explained:**
- `question`: The exact question asked
- `timestamp`: When it was asked
- `confidence`: How confident the chatbot was (0-1)
- `userAgent`: Browser/device info
- `referrer`: Where the user came from
- `sessionId`: Unique session identifier

---

## 🎓 Training Workflow

### 1. Review Questions

Periodically check your GitHub repo for new questions:
```
https://github.com/your-username/ZHAENG/blob/main/unanswered_questions.json
```

### 2. Analyze Patterns

Look for:
- **Common questions** - Asked multiple times
- **Topic clusters** - Related questions about same topic
- **High confidence misses** (0.3-0.4) - Close matches that need refinement

### 3. Add to Knowledge Base

For each question you want to answer, add to `knowledge-base.js`:

```javascript
{
    question: "What is quantum computing",
    answer: "Quantum computing uses quantum bits (qubits) to perform calculations exponentially faster than classical computers!",
    patterns: ["quantum computing", "quantum computer", "qubit"]
}
```

### 4. Deploy Updated Chatbot

Upload your updated `knowledge-base.js` to your server. The chatbot now knows these questions!

### 5. Clear Trained Questions (Optional)

You can manually edit `unanswered_questions.json` in GitHub to remove questions you've trained, or keep them for analytics.

---

## 💡 Advanced Features

### Auto-Categorization

Questions are logged with metadata that helps you:
- Identify peak usage times (timestamp)
- See which questions are almost-matches (confidence 0.3-0.4)
- Track user sessions for conversation analysis

### Batch Training

Process multiple questions at once:

1. Download `unanswered_questions.json`
2. Group similar questions
3. Create comprehensive answers
4. Add all to knowledge base
5. Test locally
6. Deploy

### Analytics Insights

Use the logged data to understand:
- **Most asked topics** - Prioritize these for training
- **Question patterns** - Identify gaps in knowledge
- **User behavior** - See how people interact with chatbot

---

## 🔧 Troubleshooting

### "Failed to log to GitHub"

**Possible causes:**
1. **Invalid token** - Regenerate and update
2. **Wrong repo details** - Check owner/name spelling
3. **Insufficient permissions** - Token needs `repo` scope
4. **Repository doesn't exist** - Create it first
5. **Private repo without access** - Token needs access

**Fix:**
- Click "Test GitHub Connection" to diagnose
- Check browser console (F12) for detailed errors

### "403 Forbidden"

**Cause:** Token doesn't have repo access

**Fix:**
1. Go to https://github.com/settings/tokens
2. Find your token
3. Edit scopes → Add `repo`
4. Save

### "404 Not Found"

**Cause:** Repository doesn't exist or token can't access it

**Fix:**
1. Create the repository if it doesn't exist
2. Make sure owner/name are exactly right
3. For private repos, ensure token has access

### File Too Large

If `unanswered_questions.json` grows too large (>1MB):

**Solution 1: Archive Old Questions**
```bash
# Download current file
# Rename it to unanswered_questions_archive_2025-01.json
# Upload to GitHub
# Delete original unanswered_questions.json
# System will create a fresh one
```

**Solution 2: Periodic Cleanup**
- Keep only last 100-200 questions
- Archive the rest
- Focus on recent patterns

---

## 🔐 Security Best Practices

### Token Security

**DO:**
- ✅ Use tokens with minimum required permissions
- ✅ Set expiration dates
- ✅ Store securely (saved in browser localStorage)
- ✅ Regenerate if compromised

**DON'T:**
- ❌ Commit tokens to code
- ❌ Share tokens publicly
- ❌ Use same token for multiple apps
- ❌ Give more permissions than needed

### Privacy Considerations

**User Data Logged:**
- Question text only
- No personal information
- IP not logged
- Anonymized session IDs

**GDPR Compliance:**
- Questions are not personal data
- No user tracking
- Can be deleted anytime
- No cookies used for logging

---

## 📈 Scaling Your Learning System

### For High Traffic Sites

**Option 1: Batching**
- Log questions locally (browser storage)
- Batch upload every 100 questions
- Reduces API calls

**Option 2: Rate Limiting**
- Limit to 1 log per user session
- Prevents spam
- Saves API quota

**Option 3: Sampling**
- Log only 10% of questions randomly
- Still get good insights
- Reduces storage

### Multi-Site Deployment

Use different repositories for different sites:
```
Site A → username/chatbot-site-a
Site B → username/chatbot-site-b
```

Or use different files in same repo:
```
Site A → unanswered_questions_site_a.json
Site B → unanswered_questions_site_b.json
```

---

## 🎯 Training Tips

### Prioritize What to Teach

**High Priority:**
1. Questions asked multiple times
2. Questions with 0.3-0.4 confidence (almost-matches)
3. Questions related to your core topics

**Medium Priority:**
1. Unique but relevant questions
2. Questions from engaged users (multiple questions per session)

**Low Priority:**
1. Off-topic questions
2. Nonsense/spam
3. Too specific to one user

### Writing Good Answers

**DO:**
- ✅ Keep answers short (1-2 sentences)
- ✅ Focus on key information
- ✅ Use simple language
- ✅ Add helpful patterns for variations

**DON'T:**
- ❌ Write essays (generative engine expands automatically)
- ❌ Use jargon without explanation
- ❌ Ignore common variations
- ❌ Forget to test

### Pattern Writing

Good patterns catch variations:
```javascript
patterns: [
    "quantum computing",      // Exact phrase
    "quantum computer",       // Singular
    "what.*quantum",         // Question format
    "how.*quantum.*work"     // How questions
]
```

---

## 🚀 Next Steps

### Week 1: Setup
- ✅ Configure GitHub integration
- ✅ Test with sample questions
- ✅ Deploy chatbot online

### Week 2: Monitor
- 📊 Check `unanswered_questions.json` daily
- 📝 Note common patterns
- 🎯 Identify top 10 questions

### Week 3: Train
- 📚 Add top 10 questions to knowledge base
- ✅ Test locally
- 🚀 Deploy updates

### Month 2+: Iterate
- 📈 Analyze trends
- 🔄 Continuous improvement
- 🧠 Chatbot gets smarter!

---

## 📊 Success Metrics

Track your chatbot's improvement:

**Initial State:**
- 370+ known questions
- ~40% confidence threshold
- Email fallback for unknown

**After 1 Month:**
- 400+ known questions (+30)
- Higher match rates
- Fewer emails/logs

**After 3 Months:**
- 500+ known questions (+130)
- Domain-specific expertise
- 80%+ local match rate

**Goal:**
- Cover 90% of user questions locally
- Use AI only for truly novel questions
- Continuous self-improvement

---

## 🤝 Example Training Session

### Before:
```
unanswered_questions.json shows:
- "How do I reset my password?" (asked 5 times)
- "What are your shipping costs?" (asked 3 times)
- "Do you ship to Canada?" (asked 3 times)
```

### Action:
Add to `knowledge-base.js`:
```javascript
{
    question: "How do I reset my password",
    answer: "Click 'Forgot Password' on the login page, enter your email, and follow the reset link!",
    patterns: ["reset password", "forgot password", "change password"]
},
{
    question: "What are shipping costs",
    answer: "Shipping is $5 flat rate in the US, free over $50!",
    patterns: ["shipping cost", "how much.*ship", "delivery price"]
},
{
    question: "Do you ship to Canada",
    answer: "Yes! We ship to Canada for $15 flat rate.",
    patterns: ["ship.*canada", "deliver.*canada", "canadian shipping"]
}
```

### After:
- Next time these questions are asked → Instant local answers!
- No more GitHub logs for these topics
- Users get faster responses

---

## 📚 Resources

### Official Links
- [GitHub Personal Access Tokens](https://github.com/settings/tokens)
- [GitHub API Documentation](https://docs.github.com/en/rest)
- [Repository Permissions](https://docs.github.com/en/repositories)

### Your Chatbot
- Question Log: `https://github.com/YOUR-USERNAME/YOUR-REPO/blob/main/unanswered_questions.json`
- Settings: Click ⚙️ in chatbot
- Knowledge Base: `knowledge-base.js`

---

## ✨ You're Ready!

Your chatbot now has a **self-improving learning system**:
- ✅ Automatically logs unanswered questions
- ✅ Stores to GitHub for review
- ✅ Enables continuous training
- ✅ Gets smarter over time

**The more people use it, the smarter it gets! 🚀**

---

Questions about the GitHub learning system?
Email: yezhang0033@gmail.com

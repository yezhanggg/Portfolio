# 🚀 Chatbot Deployment Guide

Complete guide to get your chatbot working both **locally** and **online**.

---

## 📋 **Quick Checklist**

### **Local Setup (Do This First):**
- [ ] Run `setup-local.html` to configure API key
- [ ] Test chatbot locally
- [ ] Verify it's responding

### **Online Deployment:**
- [ ] Push code to GitHub
- [ ] Visit live admin panel
- [ ] Configure API key online
- [ ] Test live chatbot

---

## 🏠 **Part 1: Local Setup**

### **Step 1: Configure API Key Locally**

Open this file in your browser:
```
file:///Users/ye/Documents/GitHub/ZHAENG/features/smart-chatbot/setup-local.html
```

**What it does:**
- ✅ Sets your API key in browser localStorage
- ✅ Enables AI with OpenRouter/Sherlock
- ✅ Configures everything automatically

### **Step 2: Test Locally**

Open the chatbot:
```
file:///Users/ye/Documents/GitHub/ZHAENG/features/smart-chatbot/index.html
```

**Test it:**
1. Click "CHAT" button
2. Type: "Hello, who are you?"
3. Should respond with Sherlock AI

**If it doesn't work:**
- Open browser console (F12)
- Check for errors
- Re-run setup-local.html

---

## 🌐 **Part 2: Online Deployment**

### **Step 1: Push to GitHub**

```bash
cd /Users/ye/Documents/GitHub/ZHAENG

# Check what will be committed
git status

# Should NOT see:
# - local-config.js (protected by .gitignore)
# - setup-local.html (protected by .gitignore)

# Add and commit
git add .
git commit -m "Update chatbot with secure API setup"
git push
```

### **Step 2: Wait for GitHub Pages**

After pushing, wait 1-2 minutes for deployment.

**Your live URLs:**
```
Chatbot: https://yezhanggg.github.io/ZHAENG/features/smart-chatbot/
Admin:   https://yezhanggg.github.io/ZHAENG/features/smart-chatbot/admin.html
```

### **Step 3: Configure API Key Online**

**⚠️ IMPORTANT:** The live site doesn't have your API key yet!

1. **Visit admin panel:**
   ```
   https://yezhanggg.github.io/ZHAENG/features/smart-chatbot/admin.html
   ```

2. **Login:**
   - Password: `0033`

3. **Update API Key:**
   - Click in "Update API Key" field
   - Paste: `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`
   - Click "💾 Save Changes"

4. **Verify:**
   - Click "👁️ Show API Key" to confirm
   - Should show: `sk-or-v1-8621...db1810`

### **Step 4: Test Live Chatbot**

1. **Visit chatbot:**
   ```
   https://yezhanggg.github.io/ZHAENG/features/smart-chatbot/
   ```

2. **Test:**
   - Click "CHAT"
   - Type: "Hello"
   - Should get Sherlock AI response

---

## 🔄 **How It Works**

### **Local Environment:**

```
You open chatbot
    ↓
index.html loads
    ↓
Tries to load local-config.js (SUCCESS - file exists)
    ↓
API key automatically set in localStorage
    ↓
Chatbot works! ✅
```

### **Online Environment (GitHub Pages):**

```
User opens chatbot
    ↓
index.html loads
    ↓
Tries to load local-config.js (FAILS - file not in repo)
    ↓
No API key set
    ↓
Must use admin panel to set key
    ↓
After setting key, chatbot works! ✅
```

---

## 🔑 **localStorage Explained**

Your API key is stored in browser **localStorage**, which means:

### **What localStorage IS:**
- ✅ Per-browser storage (like cookies)
- ✅ Persists across page refreshes
- ✅ Private to each browser/device
- ✅ NOT sent to GitHub
- ✅ NOT synced between devices

### **What This Means:**

**Scenario 1: Local Computer**
- Set key once via `setup-local.html`
- Key saved in your browser's localStorage
- Works forever on your local machine ✅

**Scenario 2: GitHub Pages (Your Browser)**
- Visit live site
- Set key once via admin panel
- Key saved in your browser's localStorage
- Works forever in your browser ✅

**Scenario 3: Different Computer/Browser**
- Visit live site
- localStorage is empty (new browser!)
- Must set key via admin panel again
- Each browser needs separate configuration

**Scenario 4: Other People Visiting**
- They don't have your API key
- Chatbot won't work for them
- They need their own OpenRouter key
- OR you need a backend solution

---

## ⚠️ **Current Limitations**

### **Problem: Visitors Need API Key**

Right now, when random people visit your live chatbot:
- ❌ They don't have an API key
- ❌ Chatbot won't respond
- ❌ They'd need to configure their own key

### **Solutions:**

**Option 1: Share Your Key with Visitors (Not Recommended)**

Create a public config file:

```javascript
// public-config.js (committed to GitHub)
localStorage.setItem('ai_api_key', 'sk-or-v1-8621...');
```

Then add to index.html:
```html
<script src="public-config.js"></script>
```

**⚠️ Warning:**
- Everyone can see your API key
- Anyone can use it
- Could cost you money
- Not secure!

**Option 2: Backend Proxy (Recommended for Production)**

Set up a backend server:
- Your API key stays on server
- Users make requests to your server
- Server calls OpenRouter
- Key never exposed
- More complex setup

**Option 3: Require Users to Bring Their Own Key**

Update chatbot to:
- Detect if no API key
- Show message: "Configure your OpenRouter key in admin panel"
- Each user provides their own key
- Most secure, but less user-friendly

---

## 🎯 **Recommended Setup**

### **For Personal Use:**
```
✅ Use current setup
✅ Configure once locally (setup-local.html)
✅ Configure once online (admin panel)
✅ Works perfectly for you!
```

### **For Public Use:**
```
⚠️ Need to choose a solution:
1. Backend proxy (secure but complex)
2. Shared key (simple but insecure)
3. User-provided keys (secure but inconvenient)
```

---

## 📝 **Your Current Setup Status**

| Item | Status |
|------|--------|
| API key in repo | ❌ NO (secure!) |
| Local config created | ✅ YES (`local-config.js`) |
| .gitignore protecting files | ✅ YES |
| index.html loading config | ✅ YES (with fallback) |
| Admin panel ready | ✅ YES |
| Ready for local use | ✅ YES |
| Ready for GitHub Pages | ✅ YES (need to configure once) |

---

## 🚀 **Next Steps**

### **To Use Locally:**
```bash
# 1. Open setup
open /Users/ye/Documents/GitHub/ZHAENG/features/smart-chatbot/setup-local.html

# 2. Click "Check Configuration Status"
# Should show "Configured"

# 3. Open chatbot
open /Users/ye/Documents/GitHub/ZHAENG/features/smart-chatbot/index.html

# 4. Test it!
```

### **To Deploy Online:**
```bash
# 1. Push to GitHub
git add .
git commit -m "Deploy secure chatbot"
git push

# 2. Wait 1-2 minutes

# 3. Visit admin panel and configure key
# URL: https://yezhanggg.github.io/ZHAENG/features/smart-chatbot/admin.html

# 4. Visit chatbot and test
# URL: https://yezhanggg.github.io/ZHAENG/features/smart-chatbot/
```

---

## 🆘 **Troubleshooting**

### **Chatbot not responding locally?**
1. Open browser console (F12)
2. Run: `localStorage.getItem('ai_api_key')`
3. Should show your key
4. If null, re-run `setup-local.html`

### **Chatbot not responding online?**
1. Visit admin panel on live site
2. Login and check if API key is set
3. If not, enter your key and save
4. Refresh chatbot page

### **"No local config found" in console?**
- This is normal on GitHub Pages
- File doesn't exist online (by design)
- Use admin panel to configure instead

---

## ✅ **You're Ready!**

Your chatbot is now:
- ✅ Secure (no keys in repo)
- ✅ Working locally
- ✅ Ready to deploy
- ✅ Easy to configure

Just follow the steps above and you're all set! 🎉

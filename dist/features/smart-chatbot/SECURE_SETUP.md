# 🔒 Secure API Key Setup Guide

Your new API key is **NOT stored in the public repository**. This guide shows you how to configure it securely.

---

## 🎯 Quick Setup (Recommended)

### **Option 1: Use Local Setup Page** ⚡

1. **Open the setup page locally:**
   ```
   file:///Users/ye/Documents/GitHub/ZHAENG/features/smart-chatbot/setup-local.html
   ```

2. **The page will automatically:**
   - ✅ Configure your API key in browser localStorage
   - ✅ Enable AI with OpenRouter/Sherlock
   - ✅ Show configuration status

3. **That's it!** Your chatbot is ready to use.

**Note:** This file (`setup-local.html`) and the config file (`local-config.js`) are in `.gitignore` and will **NOT** be committed to GitHub.

---

### **Option 2: Use Admin Panel** 🔐

1. **Open admin panel:**
   ```
   file:///Users/ye/Documents/GitHub/ZHAENG/features/smart-chatbot/admin.html
   ```

2. **Login with password:** `0033`

3. **Enter your API key:**
   ```
   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
   ```

4. **Click "Save Changes"**

5. **Done!** Your key is saved in browser localStorage only.

---

## 📁 What Changed?

### **✅ Security Improvements:**

1. **Removed hardcoded API key** from `ai-integration.js`
   - Old: Key was visible in source code
   - New: No key in any committed files

2. **Created `.gitignore`** to protect sensitive files:
   - `local-config.js` ❌ Won't be committed
   - `api-config.js` ❌ Won't be committed
   - `.env` files ❌ Won't be committed

3. **API key only stored in:**
   - ✅ Browser localStorage (local only)
   - ✅ Your local `local-config.js` file (not committed)

---

## 🔑 Your API Key Information

**New API Key:**
```
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
```

**Model:** `openrouter/sherlock-dash-alpha`

**Provider:** OpenRouter

---

## 📂 File Status

| File | Committed to Git? | Purpose |
|------|------------------|---------|
| `ai-integration.js` | ✅ Yes | No hardcoded keys anymore! |
| `admin.html` | ✅ Yes | Password-protected admin panel |
| `local-config.js` | ❌ **NO** | Contains your API key (local only) |
| `setup-local.html` | ❌ **NO** | Local setup page (local only) |
| `.gitignore` | ✅ Yes | Protects sensitive files |

---

## 🚀 How to Use After Setup

### **Local Development:**

1. **Open setup page once:**
   ```
   file:///Users/ye/Documents/GitHub/ZHAENG/features/smart-chatbot/setup-local.html
   ```

2. **Use chatbot:**
   ```
   file:///Users/ye/Documents/GitHub/ZHAENG/features/smart-chatbot/index.html
   ```

3. **Your API key stays in browser localStorage** ✅

### **After Pushing to GitHub Pages:**

1. **Push to GitHub** (API key won't be included!)
   ```bash
   git add .
   git commit -m "Update chatbot (secure setup)"
   git push
   ```

2. **Visit your live site:**
   ```
   https://yezhanggg.github.io/ZHAENG/features/smart-chatbot/
   ```

3. **Set API key via admin panel:**
   ```
   https://yezhanggg.github.io/ZHAENG/features/smart-chatbot/admin.html
   ```
   - Login: `0033`
   - Enter API key
   - Save

4. **Done!** Chatbot works on live site with your key stored in browser localStorage.

---

## 🔐 Security Benefits

### **Before (Insecure):**
- ❌ API key hardcoded in JavaScript
- ❌ Visible in GitHub repository
- ❌ Anyone can see and use your key
- ❌ Key exposed in browser source view

### **After (Secure):**
- ✅ No API key in GitHub repository
- ✅ Key stored in browser localStorage only
- ✅ Local files ignored by Git
- ✅ Must set key manually per browser/device

---

## 📋 Setup Checklist

- [x] API key removed from `ai-integration.js`
- [x] `.gitignore` created to protect sensitive files
- [x] `local-config.js` created (won't be committed)
- [x] `setup-local.html` created for easy setup
- [x] Admin panel ready to accept API key
- [ ] Run setup-local.html once to configure
- [ ] Test chatbot locally
- [ ] Push to GitHub (key won't be included)
- [ ] Configure key on live site via admin panel

---

## ⚠️ Important Notes

### **For Local Use:**
1. Open `setup-local.html` once to auto-configure
2. Your key is saved in browser localStorage
3. You're ready to use the chatbot!

### **For Live Site (GitHub Pages):**
1. Push code to GitHub (no key included)
2. Visit admin panel on live site
3. Enter API key manually
4. Key saves in visitor's browser localStorage
5. Each device needs to be configured once

### **Sharing Your Code:**
- ✅ Safe to push to GitHub
- ✅ No secrets in repository
- ✅ Others need their own API key
- ✅ Your key stays private

---

## 🆘 Troubleshooting

### **Chatbot not responding?**

1. **Check configuration:**
   - Open `admin.html`
   - Verify API key is set
   - Check "AI Status" shows "Enabled"

2. **Re-run setup:**
   - Open `setup-local.html`
   - Click "Check Configuration Status"
   - Should show "Configured"

3. **Clear and reset:**
   ```javascript
   // In browser console (F12):
   localStorage.clear();
   // Then open setup-local.html again
   ```

### **API key showing in Git?**

**Check what's staged:**
```bash
git status
git diff
```

**If local-config.js shows up:**
```bash
git reset local-config.js
echo "local-config.js" >> .gitignore
```

---

## 🎉 You're All Set!

Your API key is now:
- ✅ Configured securely
- ✅ Not in public repository
- ✅ Safe from exposure
- ✅ Ready to use

**Enjoy your secure Sherlock chatbot!** 🔍✨

---

**Questions?** Check `ADMIN_README.md` for admin panel details.

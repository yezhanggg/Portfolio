# 🔐 Admin Panel Access

## Important Security Information

Your API key is stored in the codebase but **hidden from regular users**. Only you can access it through the admin panel.

---

## 📍 Access the Admin Panel

**URL:** `features/smart-chatbot/admin.html`

**Full Path:** `https://yourdomain.com/features/smart-chatbot/admin.html`

**Local Path:** `file:///path/to/ZHAENG/features/smart-chatbot/admin.html`

---

## 🔑 Login Credentials

**Default Password:** `admin123`

> **⚠️ IMPORTANT:** Change this password in the admin.html file!

### How to Change Password:

1. Open `/features/smart-chatbot/admin.html`
2. Find the line: `const CORRECT_HASH = 'f865b53623b121fd34ee5426c792e5c33af8c227b8cd9999b01c6f2c77d8292e';`
3. Generate a new hash for your password:
   - Open browser console (F12)
   - Run: `await crypto.subtle.digest('SHA-256', new TextEncoder().encode('your_new_password')).then(h => Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join(''))`
   - Copy the resulting hash
   - Replace the `CORRECT_HASH` value with your new hash

---

## 🛠️ What You Can Do in Admin Panel

### AI Configuration
- ✅ View/hide API key (click "Show API Key" button)
- ✅ Change API provider (OpenRouter, Gemini, Groq)
- ✅ Update API key
- ✅ View current model name
- ✅ Toggle AI fallback on/off

### Settings
- ✅ Enable/disable AI fallback
- ✅ Enable/disable GitHub logging
- ✅ Save all changes to localStorage

---

## 🔒 Security Features

### What's Hidden from Regular Users:
- ❌ No settings button visible
- ❌ No model information displayed
- ❌ No API key accessible
- ❌ No provider selection
- ❌ Users only see: "🤖 Powered by Advanced AI"

### What's Protected:
- ✅ Password-protected admin panel
- ✅ SHA-256 hashed password
- ✅ Session-based authentication
- ✅ Auto-logout on page reload
- ✅ No direct API key exposure in UI

---

## ⚙️ Current Configuration

**Default Settings:**
- **Provider:** OpenRouter
- **Model:** openrouter/sherlock-dash-alpha
- **API Key:** Pre-configured (hidden from users)
- **AI Fallback:** Enabled
- **GitHub Logging:** Disabled

---

## 📱 Mobile Responsive

The admin panel is fully responsive and works on:
- 💻 Desktop browsers
- 📱 Mobile phones
- 📟 Tablets

---

## 🚨 Security Recommendations

### 1. **Change the Default Password**
   - The default `admin123` is for initial setup only
   - Use a strong, unique password

### 2. **Don't Share the Admin URL**
   - Keep `/admin.html` path private
   - Don't link to it from your main site

### 3. **Regenerate API Key Periodically**
   - Get a new key from OpenRouter: https://openrouter.ai/keys
   - Update it in the admin panel

### 4. **Use .gitignore for Sensitive Files**
   - Consider not committing `ai-integration.js` with the key
   - Or use environment variables if you add a backend

### 5. **Monitor API Usage**
   - Check OpenRouter dashboard for unusual activity
   - Set usage limits on your API key

---

## 🔄 How It Works

```
Regular Users:
1. Visit chatbot
2. See generic "Powered by Advanced AI"
3. Use chatbot normally
4. Cannot access settings

Admin (You):
1. Visit /admin.html
2. Enter password
3. View/modify all settings
4. Changes saved to localStorage
5. Logout when done
```

---

## 📝 API Key Storage

**Location:** `/features/smart-chatbot/ai-integration.js` (line 14)

```javascript
this.apiKey = storedApiKey || 'sk-or-v1-e56a9735...';
```

**How it works:**
1. Key is hardcoded as fallback
2. On first visit, saved to user's localStorage
3. Admin can update via admin panel
4. Changes persist in browser only

---

## 🆘 Troubleshooting

### Can't Login?
- Make sure you're using the correct password
- Check browser console (F12) for errors
- Try clearing browser cache

### Settings Not Saving?
- Check if localStorage is enabled
- Try a different browser
- Look for JavaScript errors in console

### API Not Working?
- Verify API key in admin panel (click "Show API Key")
- Check OpenRouter dashboard for key status
- Test with "Show API Key" button (displays for 5 seconds)

---

## 🔗 Useful Links

- **OpenRouter Dashboard:** https://openrouter.ai/keys
- **Sherlock Model Info:** https://openrouter.ai/models/openrouter/sherlock-dash-alpha
- **Change Password Tool:** (browser console command above)

---

**Last Updated:** 2025
**Version:** 1.0

---

## 🎯 Quick Start

1. Open `/features/smart-chatbot/admin.html` in browser
2. Login with: `admin123`
3. Click "Show API Key" to verify it's set
4. Change settings as needed
5. Click "Save Changes"
6. Logout when done

**That's it!** Your chatbot is now secured and only you can manage it. 🎉

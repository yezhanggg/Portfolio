// AI API Integration for Hybrid Chatbot
// Supports multiple free AI providers as fallback

class AIIntegration {
    constructor() {
        // Load API settings from localStorage only
        // NO hardcoded API keys for security!
        const storedEnabled = localStorage.getItem('ai_enabled');
        const storedProvider = localStorage.getItem('ai_provider');
        const storedApiKey = localStorage.getItem('ai_api_key');

        // Default to OpenRouter with sherlock-dash-alpha
        this.enabled = storedEnabled !== null ? storedEnabled === 'true' : true;
        this.provider = storedProvider || 'openrouter';
        this.apiKey = storedApiKey || ''; // No default key - must be set via admin panel

        // Save defaults if not already saved
        if (storedEnabled === null) {
            localStorage.setItem('ai_enabled', 'true');
        }
        if (storedProvider === null) {
            localStorage.setItem('ai_provider', 'openrouter');
        }
        // Don't auto-save empty API key

        // API endpoints
        this.endpoints = {
            gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
            groq: 'https://api.groq.com/openai/v1/chat/completions',
            openrouter: 'https://openrouter.ai/api/v1/chat/completions'
        };

        // Model names
        this.models = {
            gemini: 'gemini-2.0-flash-exp',
            groq: 'llama-3.3-70b-versatile',
            openrouter: 'openrouter/sherlock-dash-alpha'
        };
    }

    // Check if AI is enabled and configured
    isConfigured() {
        return this.enabled && this.apiKey.length > 0;
    }

    // Enable/disable AI fallback
    setEnabled(enabled) {
        this.enabled = enabled;
        localStorage.setItem('ai_enabled', enabled.toString());
    }

    // Set API provider
    setProvider(provider) {
        this.provider = provider;
        localStorage.setItem('ai_provider', provider);
    }

    // Set API key
    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('ai_api_key', key);
    }

    // Get response from AI API
    async getResponse(question) {
        if (!this.isConfigured()) {
            return null;
        }

        try {
            switch (this.provider) {
                case 'gemini':
                    return await this.queryGemini(question);
                case 'groq':
                    return await this.queryGroq(question);
                case 'openrouter':
                    return await this.queryOpenRouter(question);
                default:
                    return null;
            }
        } catch (error) {
            console.error('AI API Error:', error);
            return null;
        }
    }

    // Query Google Gemini API
    async queryGemini(question) {
        const url = `${this.endpoints.gemini}?key=${this.apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `You are a helpful chatbot. Keep answers short (1-2 sentences). Question: ${question}`
                    }]
                }],
                generationConfig: {
                    maxOutputTokens: 100,
                    temperature: 0.7
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }

    // Query Groq API
    async queryGroq(question) {
        const response = await fetch(this.endpoints.groq, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.models.groq,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful chatbot. Keep answers short (1-2 sentences).'
                    },
                    {
                        role: 'user',
                        content: question
                    }
                ],
                max_tokens: 100,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`Groq API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    // Query OpenRouter API (sherlock-dash-alpha)
    async queryOpenRouter(question) {
        const response = await fetch(this.endpoints.openrouter, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
                'HTTP-Referer': window.location.href,
                'X-Title': 'ZHAENG Chatbot'
            },
            body: JSON.stringify({
                model: this.models.openrouter,
                messages: [
                    {
                        role: 'system',
                        content: 'You are Sherlock, an intelligent and analytical assistant. Provide clear, thoughtful, and concise answers. Use reasoning and logic to help users understand complex topics. Keep responses helpful and conversational.'
                    },
                    {
                        role: 'user',
                        content: question
                    }
                ],
                max_tokens: 500,
                temperature: 0.7,
                top_p: 0.9,
                frequency_penalty: 0,
                presence_penalty: 0
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    // Clear all settings
    clearSettings() {
        localStorage.removeItem('ai_enabled');
        localStorage.removeItem('ai_provider');
        localStorage.removeItem('ai_api_key');
        this.enabled = false;
        this.provider = 'gemini';
        this.apiKey = '';
    }
}

// GitHub Logger - Auto-log unanswered questions for training
// Stores questions to GitHub repository for later review

class GitHubLogger {
    constructor() {
        // Load GitHub settings from localStorage
        this.enabled = localStorage.getItem('github_logging_enabled') === 'true';
        this.githubToken = localStorage.getItem('github_token') || '';
        this.repoOwner = localStorage.getItem('github_repo_owner') || '';
        this.repoName = localStorage.getItem('github_repo_name') || '';
        this.logFile = 'unanswered_questions.json';
        this.branch = 'main';
    }

    // Check if GitHub logging is configured
    isConfigured() {
        return this.enabled &&
               this.githubToken.length > 0 &&
               this.repoOwner.length > 0 &&
               this.repoName.length > 0;
    }

    // Enable/disable GitHub logging
    setEnabled(enabled) {
        this.enabled = enabled;
        localStorage.setItem('github_logging_enabled', enabled.toString());
    }

    // Set GitHub token
    setToken(token) {
        this.githubToken = token;
        localStorage.setItem('github_token', token);
    }

    // Set repository details
    setRepository(owner, name) {
        this.repoOwner = owner;
        this.repoName = name;
        localStorage.setItem('github_repo_owner', owner);
        localStorage.setItem('github_repo_name', name);
    }

    // Log unanswered question to GitHub
    async logQuestion(question, timestamp = new Date().toISOString(), context = {}) {
        if (!this.isConfigured()) {
            console.log('GitHub logging not configured, skipping...');
            return false;
        }

        try {
            // Create question entry
            const entry = {
                question: question,
                timestamp: timestamp,
                confidence: context.confidence || 0,
                userAgent: navigator.userAgent,
                referrer: document.referrer || 'direct',
                sessionId: this.getSessionId()
            };

            // Get existing log file
            const existingContent = await this.getLogFile();

            // Add new entry
            existingContent.questions.push(entry);
            existingContent.count = existingContent.questions.length;
            existingContent.lastUpdated = timestamp;

            // Save back to GitHub
            await this.saveLogFile(existingContent);

            console.log('Question logged to GitHub:', question);
            return true;

        } catch (error) {
            console.error('Failed to log question to GitHub:', error);
            return false;
        }
    }

    // Get current log file from GitHub
    async getLogFile() {
        const url = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${this.logFile}`;

        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `token ${this.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.status === 404) {
                // File doesn't exist, create initial structure
                return {
                    version: '1.0',
                    count: 0,
                    questions: [],
                    lastUpdated: new Date().toISOString()
                };
            }

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }

            const data = await response.json();
            const content = atob(data.content); // Decode base64
            const parsed = JSON.parse(content);

            // Store SHA for updating
            this.currentSha = data.sha;

            return parsed;

        } catch (error) {
            // If file doesn't exist or error, return fresh structure
            return {
                version: '1.0',
                count: 0,
                questions: [],
                lastUpdated: new Date().toISOString()
            };
        }
    }

    // Save log file to GitHub
    async saveLogFile(content) {
        const url = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${this.logFile}`;

        const body = {
            message: `Add unanswered question: ${content.questions[content.questions.length - 1].question.substring(0, 50)}...`,
            content: btoa(JSON.stringify(content, null, 2)), // Encode to base64
            branch: this.branch
        };

        // Add SHA if updating existing file
        if (this.currentSha) {
            body.sha = this.currentSha;
        }

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${this.githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to save to GitHub: ${error.message}`);
        }

        return await response.json();
    }

    // Get or create session ID
    getSessionId() {
        let sessionId = sessionStorage.getItem('chatbot_session_id');

        if (!sessionId) {
            sessionId = this.generateSessionId();
            sessionStorage.setItem('chatbot_session_id', sessionId);
        }

        return sessionId;
    }

    // Generate unique session ID
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Get statistics
    async getStats() {
        if (!this.isConfigured()) {
            return null;
        }

        try {
            const logFile = await this.getLogFile();

            return {
                totalQuestions: logFile.count,
                lastUpdated: logFile.lastUpdated,
                recentQuestions: logFile.questions.slice(-10).reverse()
            };
        } catch (error) {
            console.error('Failed to get stats:', error);
            return null;
        }
    }

    // Export questions for training
    async exportForTraining() {
        if (!this.isConfigured()) {
            return null;
        }

        try {
            const logFile = await this.getLogFile();

            // Convert to training format
            const trainingData = logFile.questions.map(q => ({
                question: q.question,
                timestamp: q.timestamp,
                confidence: q.confidence,
                // Placeholder for answer - to be filled during training
                answer: "",
                patterns: []
            }));

            return trainingData;

        } catch (error) {
            console.error('Failed to export for training:', error);
            return null;
        }
    }

    // Clear all settings
    clearSettings() {
        localStorage.removeItem('github_logging_enabled');
        localStorage.removeItem('github_token');
        localStorage.removeItem('github_repo_owner');
        localStorage.removeItem('github_repo_name');
        this.enabled = false;
        this.githubToken = '';
        this.repoOwner = '';
        this.repoName = '';
    }

    // Test GitHub connection
    async testConnection() {
        if (!this.githubToken || !this.repoOwner || !this.repoName) {
            throw new Error('Missing GitHub credentials');
        }

        const url = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${this.githubToken}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to connect to GitHub');
        }

        return await response.json();
    }

    // Batch log multiple questions (for periodic sync)
    async batchLog(questions) {
        if (!this.isConfigured()) {
            return false;
        }

        try {
            const existingContent = await this.getLogFile();

            // Add all new entries
            questions.forEach(q => {
                existingContent.questions.push({
                    question: q.question,
                    timestamp: q.timestamp || new Date().toISOString(),
                    confidence: q.confidence || 0,
                    userAgent: navigator.userAgent,
                    referrer: document.referrer || 'direct',
                    sessionId: this.getSessionId()
                });
            });

            existingContent.count = existingContent.questions.length;
            existingContent.lastUpdated = new Date().toISOString();

            // Save back to GitHub
            await this.saveLogFile(existingContent);

            console.log(`Batch logged ${questions.length} questions to GitHub`);
            return true;

        } catch (error) {
            console.error('Failed to batch log questions:', error);
            return false;
        }
    }
}

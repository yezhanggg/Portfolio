// Advanced NLP Engine - Ultra-Smart Chatbot Enhancement
// Conversation Memory, Intent Detection, Sentiment Analysis, Semantic Understanding

class AdvancedNLP {
    constructor() {
        this.conversationHistory = [];
        this.maxHistoryLength = 10;
        this.userProfile = {
            preferredTopics: new Map(),
            sentimentHistory: [],
            commonQuestions: new Map()
        };

        // Initialize sub-engines
        this.initializeSynonyms();
        this.initializeIntents();
        this.initializeSentiments();
        this.initializeEntities();
    }

    // ==================== SYNONYM & SEMANTIC UNDERSTANDING ====================

    initializeSynonyms() {
        this.synonyms = {
            // Action words
            'make': ['create', 'build', 'generate', 'produce', 'craft', 'construct'],
            'get': ['obtain', 'acquire', 'receive', 'fetch', 'retrieve'],
            'help': ['assist', 'aid', 'support', 'guide'],
            'show': ['display', 'demonstrate', 'present', 'reveal'],
            'tell': ['inform', 'explain', 'describe', 'say'],
            'fix': ['repair', 'solve', 'resolve', 'correct', 'debug'],
            'learn': ['study', 'understand', 'master', 'grasp'],
            'find': ['locate', 'discover', 'search', 'seek'],

            // Size/intensity
            'big': ['large', 'huge', 'massive', 'enormous', 'giant'],
            'small': ['tiny', 'little', 'mini', 'compact'],
            'good': ['great', 'excellent', 'wonderful', 'fantastic', 'amazing'],
            'bad': ['terrible', 'awful', 'horrible', 'poor'],
            'fast': ['quick', 'rapid', 'speedy', 'swift'],
            'slow': ['sluggish', 'gradual', 'leisurely'],

            // Emotions
            'happy': ['joyful', 'cheerful', 'glad', 'pleased', 'delighted'],
            'sad': ['unhappy', 'depressed', 'down', 'blue', 'melancholy'],
            'angry': ['mad', 'furious', 'enraged', 'irritated', 'annoyed'],
            'scared': ['afraid', 'frightened', 'terrified', 'fearful'],

            // Common tech terms
            'computer': ['pc', 'laptop', 'desktop', 'machine', 'device'],
            'phone': ['mobile', 'smartphone', 'cell', 'device'],
            'internet': ['web', 'online', 'net', 'cyberspace'],
            'program': ['software', 'app', 'application', 'code'],

            // Frequency
            'always': ['constantly', 'forever', 'perpetually', 'continually'],
            'never': ['not ever', 'at no time'],
            'often': ['frequently', 'regularly', 'commonly'],
            'sometimes': ['occasionally', 'now and then', 'from time to time']
        };

        // Create reverse mapping
        this.synonymMap = new Map();
        for (const [word, syns] of Object.entries(this.synonyms)) {
            this.synonymMap.set(word, word);
            syns.forEach(syn => this.synonymMap.set(syn, word));
        }
    }

    expandWithSynonyms(words) {
        const expanded = new Set(words);
        words.forEach(word => {
            const root = this.synonymMap.get(word);
            if (root && this.synonyms[root]) {
                this.synonyms[root].forEach(syn => expanded.add(syn));
            }
        });
        return Array.from(expanded);
    }

    // ==================== INTENT DETECTION ====================

    initializeIntents() {
        this.intentPatterns = {
            greeting: {
                patterns: [/^(hi|hello|hey|greetings|sup|yo|howdy)/i, /good (morning|afternoon|evening)/i],
                confidence: 0.9
            },
            farewell: {
                patterns: [/^(bye|goodbye|see you|later|cya|farewell|talk.*soon)/i, /gotta (go|run)/i],
                confidence: 0.9
            },
            question_what: {
                patterns: [/what (is|are|was|were|does|do)/i, /what'?s/i],
                confidence: 0.8
            },
            question_how: {
                patterns: [/how (do|does|can|to|should)/i, /how.*work/i],
                confidence: 0.8
            },
            question_why: {
                patterns: [/why (is|are|do|does|did|would)/i],
                confidence: 0.8
            },
            question_when: {
                patterns: [/when (is|are|do|does|should)/i],
                confidence: 0.8
            },
            question_where: {
                patterns: [/where (is|are|can|do)/i],
                confidence: 0.8
            },
            command: {
                patterns: [
                    /^(show|tell|give|make|create|help|find|search)/i,
                    /can you/i, /could you/i, /would you/i
                ],
                confidence: 0.7
            },
            emotion_positive: {
                patterns: [
                    /(i'?m|i am|feeling) (happy|good|great|excited|wonderful)/i,
                    /(love|like|enjoy)/i
                ],
                confidence: 0.8
            },
            emotion_negative: {
                patterns: [
                    /(i'?m|i am|feeling) (sad|bad|terrible|awful|depressed|down)/i,
                    /(hate|dislike)/i
                ],
                confidence: 0.8
            },
            gratitude: {
                patterns: [/thank/i, /appreciate/i, /grateful/i, /thx/i],
                confidence: 0.9
            },
            apology: {
                patterns: [/sorry/i, /apologize/i, /my bad/i, /excuse me/i],
                confidence: 0.9
            },
            agreement: {
                patterns: [/^(yes|yeah|yep|sure|okay|ok|right|exactly|absolutely)/i],
                confidence: 0.9
            },
            disagreement: {
                patterns: [/^(no|nope|nah|not really|i disagree)/i],
                confidence: 0.9
            }
        };
    }

    detectIntent(text) {
        const intents = [];

        for (const [intentName, intentData] of Object.entries(this.intentPatterns)) {
            for (const pattern of intentData.patterns) {
                if (pattern.test(text)) {
                    intents.push({
                        intent: intentName,
                        confidence: intentData.confidence
                    });
                    break;
                }
            }
        }

        // Return highest confidence intent
        if (intents.length === 0) {
            return { intent: 'unknown', confidence: 0 };
        }

        return intents.reduce((best, current) =>
            current.confidence > best.confidence ? current : best
        );
    }

    // ==================== SENTIMENT ANALYSIS ====================

    initializeSentiments() {
        this.sentimentLexicon = {
            positive: {
                high: ['amazing', 'excellent', 'fantastic', 'wonderful', 'brilliant', 'perfect', 'outstanding', 'superb', 'love', 'best'],
                medium: ['good', 'great', 'nice', 'happy', 'like', 'enjoy', 'pleasant', 'helpful', 'useful', 'glad'],
                low: ['okay', 'fine', 'alright', 'decent', 'fair']
            },
            negative: {
                high: ['terrible', 'awful', 'horrible', 'worst', 'hate', 'disgusting', 'pathetic', 'useless'],
                medium: ['bad', 'poor', 'sad', 'disappointed', 'frustrated', 'annoyed', 'unhappy', 'dislike'],
                low: ['not great', 'meh', 'could be better', 'somewhat bad']
            },
            intensifiers: ['very', 'really', 'extremely', 'super', 'incredibly', 'absolutely'],
            negations: ['not', 'no', 'never', "n't", 'neither', 'nor']
        };
    }

    analyzeSentiment(text) {
        const words = text.toLowerCase().split(/\s+/);
        let score = 0;
        let magnitude = 0;

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const prevWord = i > 0 ? words[i - 1] : null;

            // Check for negation
            const isNegated = prevWord && this.sentimentLexicon.negations.includes(prevWord);

            // Check intensifier
            const isIntensified = prevWord && this.sentimentLexicon.intensifiers.includes(prevWord);
            const multiplier = isIntensified ? 1.5 : 1.0;

            // Check positive words
            if (this.sentimentLexicon.positive.high.includes(word)) {
                score += (isNegated ? -3 : 3) * multiplier;
                magnitude += 3;
            } else if (this.sentimentLexicon.positive.medium.includes(word)) {
                score += (isNegated ? -2 : 2) * multiplier;
                magnitude += 2;
            } else if (this.sentimentLexicon.positive.low.includes(word)) {
                score += (isNegated ? -1 : 1) * multiplier;
                magnitude += 1;
            }

            // Check negative words
            else if (this.sentimentLexicon.negative.high.includes(word)) {
                score += (isNegated ? 3 : -3) * multiplier;
                magnitude += 3;
            } else if (this.sentimentLexicon.negative.medium.includes(word)) {
                score += (isNegated ? 2 : -2) * multiplier;
                magnitude += 2;
            } else if (this.sentimentLexicon.negative.low.includes(word)) {
                score += (isNegated ? 1 : -1) * multiplier;
                magnitude += 1;
            }
        }

        // Normalize score to -1 to 1
        const normalizedScore = Math.max(-1, Math.min(1, score / 10));

        return {
            score: normalizedScore,
            magnitude: magnitude / words.length,
            label: normalizedScore > 0.2 ? 'positive' :
                   normalizedScore < -0.2 ? 'negative' : 'neutral'
        };
    }

    // ==================== ENTITY EXTRACTION ====================

    initializeEntities() {
        this.entityPatterns = {
            email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
            url: /https?:\/\/[^\s]+/g,
            phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
            date: /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(,?\s+\d{4})?\b/gi,
            time: /\b\d{1,2}:\d{2}\s*(am|pm)?\b/gi,
            money: /\$\d+(\.\d{2})?|\d+\s*(dollars|usd|euros|pounds)/gi,
            number: /\b\d+(\.\d+)?\b/g
        };
    }

    extractEntities(text) {
        const entities = {};

        for (const [type, pattern] of Object.entries(this.entityPatterns)) {
            const matches = text.match(pattern);
            if (matches && matches.length > 0) {
                entities[type] = matches;
            }
        }

        return entities;
    }

    // ==================== CONVERSATION MEMORY ====================

    addToHistory(userMessage, botResponse) {
        this.conversationHistory.push({
            user: userMessage,
            bot: botResponse,
            timestamp: Date.now()
        });

        // Keep only last N messages
        if (this.conversationHistory.length > this.maxHistoryLength) {
            this.conversationHistory.shift();
        }
    }

    resolvePronouns(text) {
        // Simple pronoun resolution using conversation history
        if (!this.conversationHistory.length) return text;

        const lastMessage = this.conversationHistory[this.conversationHistory.length - 1];

        // Replace "it", "this", "that" with last topic
        let resolved = text;
        const pronouns = ['it', 'this', 'that'];

        pronouns.forEach(pronoun => {
            const pattern = new RegExp(`\\b${pronoun}\\b`, 'gi');
            if (pattern.test(text) && lastMessage.user) {
                // Extract main noun from last message (simplified)
                const words = lastMessage.user.toLowerCase().split(/\s+/);
                const nouns = words.filter(w => w.length > 4); // Simple heuristic
                if (nouns.length > 0) {
                    resolved = resolved.replace(pattern, nouns[0]);
                }
            }
        });

        return resolved;
    }

    getConversationContext() {
        if (!this.conversationHistory.length) return null;

        // Extract topics from recent conversation
        const recentMessages = this.conversationHistory.slice(-3);
        const topics = new Set();

        recentMessages.forEach(msg => {
            const words = msg.user.toLowerCase().split(/\s+/);
            words.filter(w => w.length > 5).forEach(w => topics.add(w));
        });

        return {
            topics: Array.from(topics),
            messageCount: this.conversationHistory.length,
            lastUserMessage: this.conversationHistory[this.conversationHistory.length - 1]?.user
        };
    }

    // ==================== LEARNING & PROFILING ====================

    updateUserProfile(topic, sentiment) {
        // Track preferred topics
        const count = this.userProfile.preferredTopics.get(topic) || 0;
        this.userProfile.preferredTopics.set(topic, count + 1);

        // Track sentiment history
        this.userProfile.sentimentHistory.push(sentiment);
        if (this.userProfile.sentimentHistory.length > 20) {
            this.userProfile.sentimentHistory.shift();
        }
    }

    getAverageSentiment() {
        if (this.userProfile.sentimentHistory.length === 0) return 0;

        const sum = this.userProfile.sentimentHistory.reduce((acc, s) => acc + s.score, 0);
        return sum / this.userProfile.sentimentHistory.length;
    }

    getTopTopics(limit = 3) {
        return Array.from(this.userProfile.preferredTopics.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([topic]) => topic);
    }

    // ==================== ADVANCED REASONING ====================

    generateChainOfThought(question, knowledgeItems) {
        // Break down complex questions into steps
        const steps = [];

        // Step 1: Identify sub-questions
        if (question.includes('and') || question.includes('or')) {
            const parts = question.split(/\s+(and|or)\s+/i);
            steps.push(`Let me break this down:`);
            parts.forEach((part, i) => {
                if (part !== 'and' && part !== 'or') {
                    steps.push(`${i + 1}. ${part.trim()}`);
                }
            });
        }

        // Step 2: Build reasoning chain
        if (knowledgeItems.length > 1) {
            steps.push('Here\'s what I know:');
            knowledgeItems.slice(0, 3).forEach((item, i) => {
                steps.push(`• ${item.answer}`);
            });
        }

        return steps.length > 0 ? steps.join('\n') : null;
    }

    generateAnalogy(concept) {
        // Simple analogy generator
        const analogies = {
            'api': 'An API is like a waiter in a restaurant - it takes your order (request), tells the kitchen (server), and brings back your food (response).',
            'cache': 'A cache is like a notepad where you write down things you use often, so you don\'t have to look them up every time.',
            'encryption': 'Encryption is like putting your message in a locked box - only someone with the key can open it and read it.',
            'cloud': 'The cloud is like a storage unit you rent - your stuff isn\'t at your house, but you can access it whenever you need it.',
            'algorithm': 'An algorithm is like a recipe - a step-by-step set of instructions to achieve a specific result.',
            'database': 'A database is like a filing cabinet where information is organized in folders and drawers for easy access.',
            'loop': 'A loop in programming is like doing your laundry - you repeat the same steps until all clothes are clean.'
        };

        for (const [key, analogy] of Object.entries(analogies)) {
            if (concept.toLowerCase().includes(key)) {
                return analogy;
            }
        }

        return null;
    }

    // ==================== RESPONSE ENHANCEMENT ====================

    enhanceResponse(baseResponse, userQuestion, intent, sentiment) {
        let enhanced = baseResponse;

        // Adjust tone based on sentiment
        if (sentiment.label === 'negative') {
            enhanced = this.addEmpatheticTone(enhanced);
        } else if (sentiment.label === 'positive') {
            enhanced = this.addEnthusiasticTone(enhanced);
        }

        // Add appropriate formatting based on intent
        if (intent.intent.startsWith('question_how')) {
            enhanced = this.formatAsSteps(enhanced);
        }

        // Add analogy if technical term detected
        const analogy = this.generateAnalogy(userQuestion);
        if (analogy) {
            enhanced += `\n\n${analogy}`;
        }

        return enhanced;
    }

    addEmpatheticTone(response) {
        const empathyPhrases = [
            'I understand that can be challenging.',
            'I hear you.',
            'That makes sense.',
            'I appreciate you sharing that.'
        ];

        const phrase = empathyPhrases[Math.floor(Math.random() * empathyPhrases.length)];
        return `${phrase} ${response}`;
    }

    addEnthusiasticTone(response) {
        if (!response.includes('!')) {
            // Add occasional exclamation
            return response.replace(/\.$/, '!');
        }
        return response;
    }

    formatAsSteps(response) {
        // If response contains commas or "and", format as steps
        if (response.includes(',') || response.includes(' and ')) {
            const parts = response.split(/,\s*|and\s+/);
            if (parts.length >= 2 && parts.length <= 5) {
                return 'Here are the steps:\n' + parts.map((p, i) => `${i + 1}. ${p.trim()}`).join('\n');
            }
        }
        return response;
    }

    // ==================== TYPO TOLERANCE ====================

    calculateLevenshteinDistance(str1, str2) {
        const matrix = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    }

    findClosestWord(word, vocabulary) {
        let closest = null;
        let minDistance = Infinity;

        for (const vocabWord of vocabulary) {
            const distance = this.calculateLevenshteinDistance(word, vocabWord);
            if (distance < minDistance && distance <= 2) { // Max 2 character difference
                minDistance = distance;
                closest = vocabWord;
            }
        }

        return closest;
    }

    correctTypos(text, vocabulary) {
        const words = text.toLowerCase().split(/\s+/);
        const corrected = words.map(word => {
            if (!vocabulary.includes(word)) {
                const suggestion = this.findClosestWord(word, vocabulary);
                return suggestion || word;
            }
            return word;
        });

        return corrected.join(' ');
    }

    // ==================== MAIN PROCESSING PIPELINE ====================

    process(userMessage, knowledgeBase) {
        // 1. Resolve pronouns from history
        const resolved = this.resolvePronouns(userMessage);

        // 2. Detect intent
        const intent = this.detectIntent(resolved);

        // 3. Analyze sentiment
        const sentiment = this.analyzeSentiment(resolved);

        // 4. Extract entities
        const entities = this.extractEntities(resolved);

        // 5. Expand with synonyms for better matching
        const words = resolved.toLowerCase().split(/\s+/);
        const expandedWords = this.expandWithSynonyms(words);

        // 6. Get conversation context
        const context = this.getConversationContext();

        // 7. Update user profile
        const topic = words.filter(w => w.length > 5)[0];
        if (topic) {
            this.updateUserProfile(topic, sentiment);
        }

        return {
            original: userMessage,
            resolved: resolved,
            intent: intent,
            sentiment: sentiment,
            entities: entities,
            expandedQuery: expandedWords.join(' '),
            context: context,
            userProfile: {
                avgSentiment: this.getAverageSentiment(),
                topTopics: this.getTopTopics()
            }
        };
    }

    // Reset conversation (for new session)
    reset() {
        this.conversationHistory = [];
        this.userProfile = {
            preferredTopics: new Map(),
            sentimentHistory: [],
            commonQuestions: new Map()
        };
    }
}

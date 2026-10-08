// Smart Chatbot Engine - No AI API Required
// Uses pattern matching, keyword extraction, and text similarity

class ChatbotEngine {
    constructor(knowledgeBase, aiIntegration = null, generativeEngine = null, githubLogger = null, advancedNLP = null) {
        this.knowledgeBase = knowledgeBase;
        this.confidenceThreshold = 0.35; // Lowered threshold for better matching
        this.ownerEmail = 'yezhang0033@gmail.com';
        this.aiIntegration = aiIntegration; // Optional AI fallback
        this.generativeEngine = generativeEngine; // Optional generative thinking
        this.githubLogger = githubLogger; // Optional GitHub logging
        this.advancedNLP = advancedNLP; // Advanced NLP engine
    }

    // Main function to get response
    async getResponse(userQuestion) {
        // Advanced NLP processing if available
        let nlpData = null;
        let enhancedQuery = userQuestion;

        if (this.advancedNLP) {
            nlpData = this.advancedNLP.process(userQuestion, this.knowledgeBase);
            enhancedQuery = nlpData.resolved; // Use pronoun-resolved query
        }

        // Preprocess the question
        const processedQuestion = this.preprocessText(enhancedQuery);

        // Find best matching question in knowledge base
        const match = this.findBestMatch(processedQuestion, enhancedQuery, nlpData);

        if (match && match.confidence >= this.confidenceThreshold) {
            // Enhance answer with generative thinking
            let finalAnswer = match.answer;

            // Apply advanced NLP enhancements
            if (this.advancedNLP && nlpData) {
                finalAnswer = this.advancedNLP.enhanceResponse(
                    finalAnswer,
                    userQuestion,
                    nlpData.intent,
                    nlpData.sentiment
                );
            }

            // Further enhance with generative engine
            if (this.generativeEngine) {
                const category = this.detectCategory(match.matchedQuestion);
                finalAnswer = this.generativeEngine.enhance(
                    finalAnswer,
                    userQuestion,
                    match.confidence,
                    category
                );
            }

            // Add to conversation history
            if (this.advancedNLP) {
                this.advancedNLP.addToHistory(userQuestion, finalAnswer);
            }

            return {
                answer: finalAnswer,
                confidence: match.confidence,
                needsEmail: false,
                source: 'local-enhanced',
                nlpData: nlpData // Include NLP analysis for debugging
            };
        } else {
            // Try AI fallback if configured
            if (this.aiIntegration && this.aiIntegration.isConfigured()) {
                try {
                    const aiResponse = await this.aiIntegration.getResponse(userQuestion);
                    if (aiResponse) {
                        return {
                            answer: aiResponse,
                            confidence: 1.0,
                            needsEmail: false,
                            source: 'ai'
                        };
                    }
                } catch (error) {
                    console.error('AI fallback failed:', error);
                }
            }

            // Question not understood - log to GitHub if configured
            const logged = await this.logToGitHub(userQuestion, match);

            if (logged) {
                return {
                    answer: "Interesting question! I've logged it for learning. My knowledge grows every day!",
                    confidence: match ? match.confidence : 0,
                    needsEmail: false,
                    source: 'logged'
                };
            }

            // Fallback to email
            this.sendToEmail(userQuestion);
            return {
                answer: "I'm not sure about that yet. I've sent your question to my creator who will help me learn the answer!",
                confidence: match ? match.confidence : 0,
                needsEmail: true,
                source: 'email'
            };
        }
    }

    // Detect category for generative enhancement
    detectCategory(question) {
        const lower = question ? question.toLowerCase() : '';

        if (this.containsKeywords(lower, ['work', 'job', 'career', 'business'])) return 'work';
        if (this.containsKeywords(lower, ['health', 'exercise', 'sleep'])) return 'health';
        if (this.containsKeywords(lower, ['learn', 'study', 'education'])) return 'learning';
        if (this.containsKeywords(lower, ['code', 'program', 'tech'])) return 'technology';

        return 'general';
    }

    // Check keywords helper
    containsKeywords(text, keywords) {
        return keywords.some(keyword => text.includes(keyword));
    }

    // Log question to GitHub
    async logToGitHub(question, match) {
        if (!this.githubLogger || !this.githubLogger.isConfigured()) {
            return false;
        }

        try {
            const context = {
                confidence: match ? match.confidence : 0,
                attemptedMatch: match ? match.matchedQuestion : null
            };

            await this.githubLogger.logQuestion(question, new Date().toISOString(), context);
            return true;
        } catch (error) {
            console.error('GitHub logging failed:', error);
            return false;
        }
    }

    // Preprocess text: lowercase, remove punctuation, tokenize
    preprocessText(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, '') // Remove punctuation
            .trim()
            .split(/\s+/) // Split into words
            .filter(word => word.length > 0);
    }

    // Remove common stop words
    removeStopWords(words) {
        const stopWords = new Set([
            'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'can', 'what', 'when', 'where', 'who', 'why',
            'how', 'which', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
            'she', 'it', 'we', 'they', 'am', 'to', 'of', 'in', 'for', 'on', 'at',
            'by', 'with', 'from', 'about', 'as', 'into', 'through', 'during'
        ]);

        return words.filter(word => !stopWords.has(word) && word.length > 2);
    }

    // Calculate similarity between two sets of words using Jaccard similarity
    jaccardSimilarity(set1, set2) {
        const s1 = new Set(set1);
        const s2 = new Set(set2);
        const intersection = new Set([...s1].filter(x => s2.has(x)));
        const union = new Set([...s1, ...s2]);

        return intersection.size / union.size;
    }

    // Calculate cosine similarity between two word arrays
    cosineSimilarity(words1, words2) {
        const set1 = new Set(words1);
        const set2 = new Set(words2);
        const allWords = new Set([...set1, ...set2]);

        // Create frequency vectors
        const vector1 = [];
        const vector2 = [];

        allWords.forEach(word => {
            vector1.push(words1.filter(w => w === word).length);
            vector2.push(words2.filter(w => w === word).length);
        });

        // Calculate dot product and magnitudes
        let dotProduct = 0;
        let magnitude1 = 0;
        let magnitude2 = 0;

        for (let i = 0; i < vector1.length; i++) {
            dotProduct += vector1[i] * vector2[i];
            magnitude1 += vector1[i] * vector1[i];
            magnitude2 += vector2[i] * vector2[i];
        }

        magnitude1 = Math.sqrt(magnitude1);
        magnitude2 = Math.sqrt(magnitude2);

        if (magnitude1 === 0 || magnitude2 === 0) return 0;

        return dotProduct / (magnitude1 * magnitude2);
    }

    // Check for exact keyword/phrase matches
    checkKeywordMatch(userWords, kbQuestion) {
        const kbLower = kbQuestion.toLowerCase();
        const userText = userWords.join(' ');

        // Check if any significant phrase from KB question appears in user question
        const kbPhrases = kbLower.split(/[,;.!?]/).map(p => p.trim());

        for (const phrase of kbPhrases) {
            if (phrase.length > 5 && userText.includes(phrase)) {
                return 0.3; // Bonus for phrase match
            }
        }

        return 0;
    }

    // Find best matching question in knowledge base
    findBestMatch(processedQuestion, originalQuestion, nlpData = null) {
        let bestMatch = null;
        let highestScore = 0;

        // Remove stop words for better matching
        let userKeywords = this.removeStopWords(processedQuestion);

        // Expand with synonyms if NLP is available
        if (nlpData && this.advancedNLP) {
            userKeywords = this.advancedNLP.expandWithSynonyms(userKeywords);
        }

        for (const item of this.knowledgeBase) {
            // Process each KB question
            const kbQuestion = this.preprocessText(item.question);
            const kbKeywords = this.removeStopWords(kbQuestion);

            // Calculate multiple similarity scores
            const jaccardScore = this.jaccardSimilarity(userKeywords, kbKeywords);
            const cosineScore = this.cosineSimilarity(processedQuestion, kbQuestion);
            const keywordBonus = this.checkKeywordMatch(processedQuestion, item.question);

            // Check for pattern matches if defined
            let patternScore = 0;
            if (item.patterns) {
                for (const pattern of item.patterns) {
                    const regex = new RegExp(pattern, 'i');
                    if (regex.test(originalQuestion)) {
                        patternScore = 0.5;
                        break;
                    }
                }
            }

            // Intent bonus if NLP detected strong intent
            let intentBonus = 0;
            if (nlpData && nlpData.intent && nlpData.intent.confidence > 0.7) {
                // Boost certain intent-matched questions
                if (nlpData.intent.intent === 'greeting' && item.question.toLowerCase().includes('hello')) {
                    intentBonus = 0.2;
                } else if (nlpData.intent.intent.startsWith('question_') && item.question.toLowerCase().includes('what')) {
                    intentBonus = 0.1;
                }
            }

            // Combined score with weights
            const combinedScore = (
                jaccardScore * 0.25 +
                cosineScore * 0.35 +
                keywordBonus * 0.15 +
                patternScore * 0.2 +
                intentBonus * 0.05
            );

            if (combinedScore > highestScore) {
                highestScore = combinedScore;
                bestMatch = {
                    answer: item.answer,
                    confidence: combinedScore,
                    matchedQuestion: item.question
                };
            }
        }

        return bestMatch;
    }

    // Send question to owner's email
    async sendToEmail(question) {
        try {
            // Using FormSubmit.co - free form submission service
            const formData = new FormData();
            formData.append('email', this.ownerEmail);
            formData.append('subject', 'New Chatbot Question');
            formData.append('message', `A user asked: "${question}"\n\nPlease add this to the knowledge base!`);

            // Send to FormSubmit
            await fetch(`https://formsubmit.co/ajax/${this.ownerEmail}`, {
                method: 'POST',
                body: formData
            });

            console.log('Question sent to email:', question);
        } catch (error) {
            console.error('Failed to send email:', error);
        }
    }

    // Add new Q&A to knowledge base (for future expansion)
    learn(question, answer, patterns = []) {
        this.knowledgeBase.push({
            question,
            answer,
            patterns
        });
    }
}

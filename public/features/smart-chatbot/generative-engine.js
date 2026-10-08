// Generative Thinking Engine
// Expands and enhances chatbot responses with creative reasoning

class GenerativeEngine {
    constructor() {
        // Response templates for different categories
        this.templates = {
            explanation: [
                "Let me break this down for you: {core}. {elaboration}",
                "Here's what you need to know: {core}. {elaboration}",
                "Think of it this way: {core}. {elaboration}"
            ],
            advice: [
                "{core}. Here's why this works: {elaboration}",
                "My suggestion: {core}. {elaboration}",
                "{core}. This approach helps because {elaboration}"
            ],
            conversational: [
                "{core}. {elaboration}",
                "{core}. Let me add: {elaboration}",
                "{core}. Also, {elaboration}"
            ]
        };

        // Context elaborations based on topics
        this.elaborations = {
            technology: [
                "This technology has revolutionized how we interact with digital systems.",
                "Understanding this concept helps you work more efficiently with modern tools.",
                "This is fundamental to many applications you use daily."
            ],
            health: [
                "Your health is important, so taking small steps makes a big difference.",
                "Remember, everyone's body is different, so listen to what works for you.",
                "Consistency is key when making lifestyle changes."
            ],
            learning: [
                "Learning is a journey, not a destination.",
                "Practice and repetition help solidify new knowledge.",
                "Don't be afraid to make mistakes - they're part of growth."
            ],
            work: [
                "Work-life balance is crucial for long-term success.",
                "Focus on progress, not perfection.",
                "Your well-being matters just as much as your productivity."
            ],
            general: [
                "Hope this helps clarify things!",
                "Feel free to ask if you want more details.",
                "This is a great question to explore."
            ]
        };
    }

    // Enhance a basic response with generative thinking
    enhanceResponse(basicAnswer, category = 'general', confidence = 0.5) {
        // If confidence is very high, return as-is
        if (confidence > 0.8) {
            return basicAnswer;
        }

        // Detect category from answer content
        const detectedCategory = this.detectCategory(basicAnswer);
        const finalCategory = category !== 'general' ? category : detectedCategory;

        // Choose appropriate elaboration
        const elaboration = this.getElaboration(finalCategory);

        // Check if answer is very short (might benefit from expansion)
        if (basicAnswer.length < 50) {
            return this.expandShortAnswer(basicAnswer, elaboration);
        }

        // Add thoughtful elaboration
        return this.addElaboration(basicAnswer, elaboration);
    }

    // Detect category from response content
    detectCategory(text) {
        const lower = text.toLowerCase();

        if (this.containsKeywords(lower, ['code', 'program', 'tech', 'computer', 'software', 'api', 'web'])) {
            return 'technology';
        }
        if (this.containsKeywords(lower, ['health', 'exercise', 'sleep', 'eat', 'stress', 'mental'])) {
            return 'health';
        }
        if (this.containsKeywords(lower, ['learn', 'study', 'practice', 'skill', 'education'])) {
            return 'learning';
        }
        if (this.containsKeywords(lower, ['work', 'job', 'career', 'productivity', 'business'])) {
            return 'work';
        }

        return 'general';
    }

    // Check if text contains any keywords
    containsKeywords(text, keywords) {
        return keywords.some(keyword => text.includes(keyword));
    }

    // Get appropriate elaboration
    getElaboration(category) {
        const elaborations = this.elaborations[category] || this.elaborations.general;
        return elaborations[Math.floor(Math.random() * elaborations.length)];
    }

    // Expand very short answers
    expandShortAnswer(answer, elaboration) {
        // Don't expand greetings or very simple confirmations
        if (answer.match(/^(hi|hello|yes|no|okay|thanks|bye)/i)) {
            return answer;
        }

        return `${answer} ${elaboration}`;
    }

    // Add elaboration to existing answer
    addElaboration(answer, elaboration) {
        // Check if answer already ends with punctuation
        const needsPunctuation = !answer.match(/[.!?]$/);

        if (needsPunctuation) {
            return `${answer}. ${elaboration}`;
        }

        return `${answer} ${elaboration}`;
    }

    // Generate multi-step reasoning for complex questions
    generateReasoning(question, relatedAnswers) {
        if (relatedAnswers.length === 0) {
            return null;
        }

        // Combine multiple related answers
        const reasoning = relatedAnswers
            .slice(0, 3) // Take top 3
            .map((item, index) => {
                if (index === 0) return item.answer;
                return this.connectIdeas(relatedAnswers[index - 1].answer, item.answer);
            })
            .join(' ');

        return reasoning;
    }

    // Connect two ideas smoothly
    connectIdeas(idea1, idea2) {
        const connectors = [
            'Additionally,',
            'Also,',
            'Furthermore,',
            'Moreover,',
            'On top of that,'
        ];

        const connector = connectors[Math.floor(Math.random() * connectors.length)];
        return `${connector} ${idea2}`;
    }

    // Synthesize answer from multiple knowledge pieces
    synthesizeAnswer(matches) {
        if (matches.length === 0) return null;
        if (matches.length === 1) return matches[0].answer;

        // Combine insights from multiple matches
        const primary = matches[0].answer;
        const secondary = matches.slice(1, 3)
            .map(m => m.answer)
            .join(' Also, ');

        return `${primary} ${secondary}`;
    }

    // Add contextual awareness
    addContext(answer, userQuestion) {
        // Detect if user is asking for help vs information
        if (userQuestion.match(/how (do|can|should|to)/i)) {
            // User wants actionable advice
            return this.makeActionable(answer);
        }

        if (userQuestion.match(/what (is|are|was|were)/i)) {
            // User wants explanation
            return this.makeExplanatory(answer);
        }

        if (userQuestion.match(/why/i)) {
            // User wants reasoning
            return this.addReasoning(answer);
        }

        return answer;
    }

    // Make answer more actionable
    makeActionable(answer) {
        if (answer.includes('Try') || answer.includes('Start')) {
            return answer; // Already actionable
        }

        return `Here's what you can do: ${answer}`;
    }

    // Make answer more explanatory
    makeExplanatory(answer) {
        if (answer.includes('is') || answer.includes('means')) {
            return answer; // Already explanatory
        }

        return `In simple terms: ${answer}`;
    }

    // Add reasoning to answer
    addReasoning(answer) {
        const reasoningPhrases = [
            'This is because',
            'The reason is',
            'This happens because',
            'It works this way because'
        ];

        // Check if answer already has reasoning
        const hasReasoning = reasoningPhrases.some(phrase =>
            answer.toLowerCase().includes(phrase.toLowerCase())
        );

        if (hasReasoning) {
            return answer;
        }

        // Add a reasoning connector
        return `${answer} This is a common pattern in many situations.`;
    }

    // Generate follow-up suggestions
    generateFollowUps(question, answer) {
        const followUps = [];

        // Suggest related topics
        if (question.toLowerCase().includes('what')) {
            followUps.push('Want to know how this works in practice?');
        }

        if (question.toLowerCase().includes('how')) {
            followUps.push('Need tips for getting started?');
        }

        return followUps;
    }

    // Apply all generative enhancements
    enhance(basicAnswer, userQuestion, confidence = 0.5, category = 'general') {
        let enhanced = basicAnswer;

        // Step 1: Add context based on question type
        enhanced = this.addContext(enhanced, userQuestion);

        // Step 2: Enhance with category-specific elaboration
        enhanced = this.enhanceResponse(enhanced, category, confidence);

        // Step 3: Ensure response feels complete
        enhanced = this.ensureCompleteness(enhanced);

        return enhanced;
    }

    // Ensure response feels complete and helpful
    ensureCompleteness(answer) {
        // Check if answer is too short and not a greeting
        if (answer.length < 30 && !answer.match(/^(hi|hello|yes|no|thanks|bye)/i)) {
            return `${answer} Let me know if you'd like more details!`;
        }

        // Check if answer ends abruptly
        if (!answer.match(/[.!?]$/)) {
            return `${answer}.`;
        }

        return answer;
    }
}

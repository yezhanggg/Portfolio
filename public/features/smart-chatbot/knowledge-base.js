// Knowledge Base - 220+ Q&A Pairs
// Organized by category for easy management

const knowledgeBase = [
    // ==================== GREETINGS & CONVERSATIONAL ====================
    {
        question: "Hello, hi, hey there",
        answer: "Hello! How can I help you today?",
        patterns: ["^(hi|hello|hey|greetings|sup|yo)"]
    },
    {
        question: "How are you doing today",
        answer: "I'm doing great, thanks for asking! How can I assist you?",
        patterns: ["how are you", "how's it going", "what's up", "how do you do"]
    },
    {
        question: "What is your name",
        answer: "I'm ZHAENG Chatbot, your friendly assistant!",
        patterns: ["(what'?s? |what is )your name", "who are you", "your name"]
    },
    {
        question: "Are you a robot",
        answer: "I'm a chatbot powered by smart algorithms, not AI!",
        patterns: ["are you (a )?(robot|bot|ai|human)", "are you real"]
    },
    {
        question: "How does this work",
        answer: "I use pattern matching and text similarity to answer questions - no AI API needed!",
        patterns: ["how (do|does) (this|you|chatbot) work", "how.*work"]
    },
    {
        question: "Can you help me",
        answer: "Of course! Ask me anything and I'll do my best to help.",
        patterns: ["(can you )?help", "i need help", "help me"]
    },
    {
        question: "Thank you very much",
        answer: "You're welcome! Happy to help!",
        patterns: ["thank(s| you)", "appreciate", "thx"]
    },
    {
        question: "Goodbye, see you later",
        answer: "Goodbye! Come back anytime!",
        patterns: ["bye", "goodbye", "see you", "later", "cya"]
    },
    {
        question: "Sorry for bothering you",
        answer: "No bother at all! That's what I'm here for!",
        patterns: ["sorry", "apologize", "my bad"]
    },
    {
        question: "You're awesome",
        answer: "Thank you! You're pretty awesome too!",
        patterns: ["awesome", "great job", "good work", "amazing"]
    },

    // ==================== ABOUT ZHAENG ====================
    {
        question: "Who created this site",
        answer: "This site was created by Ye Zhang, a creative developer!",
        patterns: ["who (made|created|built)", "who is (the )?(owner|creator)"]
    },
    {
        question: "What is ZHAENG",
        answer: "ZHAENG is a creative web playground featuring interactive tools and experiments!",
        patterns: ["what is (this|zhaeng)", "about (this|zhaeng)"]
    },
    {
        question: "What features are available",
        answer: "We have fortune cookies, image scrambler, camera effects, and this chatbot!",
        patterns: ["what (can|features)", "what does this (do|have)"]
    },
    {
        question: "Show me the fortune cookie",
        answer: "The fortune cookie feature gives you random fortunes! Check it out in the features menu.",
        patterns: ["fortune cookie", "fortune"]
    },
    {
        question: "Tell me about image scrambler",
        answer: "Image scrambler shuffles puzzle pieces! Upload an image and try to solve it.",
        patterns: ["image scrambler", "scrambler", "puzzle"]
    },
    {
        question: "How can I contact the owner",
        answer: "You can email yezhang0033@gmail.com for any questions!",
        patterns: ["contact", "email", "reach out"]
    },

    // ==================== DAILY QUESTIONS (TIME & DATE) ====================
    {
        question: "What time is it",
        answer: `It's ${new Date().toLocaleTimeString()}!`,
        patterns: ["what time", "current time", "time now"]
    },
    {
        question: "What is the date today",
        answer: `Today is ${new Date().toLocaleDateString()}!`,
        patterns: ["what (is )?(the )?date", "today'?s date", "date today"]
    },
    {
        question: "What day is it",
        answer: `It's ${new Date().toLocaleDateString('en-US', {weekday: 'long'})}!`,
        patterns: ["what day", "day of (the )?week"]
    },
    {
        question: "What month is it",
        answer: `It's ${new Date().toLocaleDateString('en-US', {month: 'long'})}!`,
        patterns: ["what month", "current month"]
    },
    {
        question: "What year is it",
        answer: `It's ${new Date().getFullYear()}!`,
        patterns: ["what year", "current year"]
    },
    {
        question: "What is the weather",
        answer: "I don't have weather data, but you can check weather.com!",
        patterns: ["what('?s| is) the weather", "weather", "forecast"]
    },
    {
        question: "Is it going to rain",
        answer: "Check a weather app for accurate forecasts!",
        patterns: ["rain", "going to rain", "will it rain"]
    },
    {
        question: "What should I wear today",
        answer: "Check the weather first, then dress comfortably!",
        patterns: ["what (should|to) wear", "outfit"]
    },

    // ==================== GENERAL KNOWLEDGE ====================
    {
        question: "What is the capital of France",
        answer: "Paris is the capital of France!",
        patterns: ["capital of france", "france capital"]
    },
    {
        question: "How many continents are there",
        answer: "There are 7 continents: Africa, Antarctica, Asia, Europe, North America, Oceania, and South America.",
        patterns: ["how many continents", "continents"]
    },
    {
        question: "What is the largest ocean",
        answer: "The Pacific Ocean is the largest ocean on Earth!",
        patterns: ["largest ocean", "biggest ocean"]
    },
    {
        question: "Who invented the telephone",
        answer: "Alexander Graham Bell is credited with inventing the telephone in 1876.",
        patterns: ["invented telephone", "telephone inventor"]
    },
    {
        question: "How many planets in solar system",
        answer: "There are 8 planets in our solar system!",
        patterns: ["how many planets", "planets in solar"]
    },
    {
        question: "What is the speed of light",
        answer: "Light travels at about 299,792 km/s in a vacuum!",
        patterns: ["speed of light", "how fast.*light"]
    },
    {
        question: "Who painted the Mona Lisa",
        answer: "Leonardo da Vinci painted the Mona Lisa!",
        patterns: ["mona lisa", "painted mona"]
    },
    {
        question: "What is the tallest mountain",
        answer: "Mount Everest is the tallest mountain at 8,849 meters!",
        patterns: ["tallest mountain", "highest mountain", "mount everest"]
    },
    {
        question: "How many countries in the world",
        answer: "There are 195 countries recognized by the UN!",
        patterns: ["how many countries", "countries in world"]
    },
    {
        question: "What is the longest river",
        answer: "The Nile River is the longest at about 6,650 km!",
        patterns: ["longest river", "nile river"]
    },
    {
        question: "Who was the first president of USA",
        answer: "George Washington was the first U.S. President!",
        patterns: ["first president", "washington president"]
    },
    {
        question: "What is photosynthesis",
        answer: "Photosynthesis is how plants convert sunlight into energy!",
        patterns: ["photosynthesis", "plants make food"]
    },
    {
        question: "How old is the Earth",
        answer: "Earth is approximately 4.5 billion years old!",
        patterns: ["how old.*earth", "age of earth"]
    },
    {
        question: "What is DNA",
        answer: "DNA is the molecule that carries genetic information in living things!",
        patterns: ["what is dna", "dna"]
    },
    {
        question: "Who wrote Romeo and Juliet",
        answer: "William Shakespeare wrote Romeo and Juliet!",
        patterns: ["romeo and juliet", "shakespeare"]
    },

    // ==================== TECHNOLOGY & INTERNET ====================
    {
        question: "What programming language is this",
        answer: "This chatbot is built with JavaScript, HTML, and CSS!",
        patterns: ["what language", "built with", "programming"]
    },
    {
        question: "Is this using AI",
        answer: "No! I use smart algorithms like pattern matching and text similarity - no AI API required.",
        patterns: ["using ai", "artificial intelligence", "ai api"]
    },
    {
        question: "What is HTML",
        answer: "HTML is the standard markup language for creating web pages!",
        patterns: ["what is html", "html"]
    },
    {
        question: "What is JavaScript",
        answer: "JavaScript is a programming language that makes websites interactive!",
        patterns: ["what is javascript", "javascript"]
    },
    {
        question: "What is Python",
        answer: "Python is a popular programming language known for being easy to learn!",
        patterns: ["what is python", "python programming"]
    },
    {
        question: "What is the cloud",
        answer: "The cloud refers to servers accessed over the internet to store and process data!",
        patterns: ["what is cloud", "cloud computing"]
    },
    {
        question: "What is a VPN",
        answer: "A VPN encrypts your internet connection for privacy and security!",
        patterns: ["what is vpn", "vpn"]
    },
    {
        question: "How does WiFi work",
        answer: "WiFi uses radio waves to connect devices to the internet wirelessly!",
        patterns: ["how.*wifi work", "wifi"]
    },
    {
        question: "What is blockchain",
        answer: "Blockchain is a secure, distributed ledger technology used in cryptocurrencies!",
        patterns: ["what is blockchain", "blockchain"]
    },
    {
        question: "What is ChatGPT",
        answer: "ChatGPT is an AI chatbot by OpenAI that generates human-like text responses!",
        patterns: ["what is chatgpt", "chatgpt"]
    },
    {
        question: "How to stay safe online",
        answer: "Use strong passwords, enable 2FA, avoid suspicious links, and keep software updated!",
        patterns: ["online safety", "stay safe online", "internet security"]
    },
    {
        question: "What is open source",
        answer: "Open source software has publicly accessible code that anyone can modify!",
        patterns: ["open source", "what is open source"]
    },
    {
        question: "What is a browser",
        answer: "A browser is software for accessing the internet, like Chrome or Firefox!",
        patterns: ["what is browser", "web browser"]
    },
    {
        question: "What is an IP address",
        answer: "An IP address is a unique number that identifies devices on a network!",
        patterns: ["what is ip", "ip address"]
    },
    {
        question: "How to clear cache",
        answer: "In most browsers: Settings > Privacy > Clear browsing data > Select cache!",
        patterns: ["clear cache", "delete cache"]
    },

    // ==================== HEALTH & WELLNESS ====================
    {
        question: "How much water should I drink",
        answer: "Aim for 8 glasses (2 liters) per day, but it varies by person!",
        patterns: ["how much water", "water daily", "drink water"]
    },
    {
        question: "How many hours of sleep",
        answer: "Adults need 7-9 hours of sleep per night for optimal health!",
        patterns: ["how much sleep", "hours of sleep", "sleep needed"]
    },
    {
        question: "How to reduce stress",
        answer: "Try deep breathing, exercise, meditation, or talking to someone you trust!",
        patterns: ["reduce stress", "stress relief", "manage stress"]
    },
    {
        question: "What is BMI",
        answer: "BMI (Body Mass Index) measures body fat based on height and weight!",
        patterns: ["what is bmi", "bmi"]
    },
    {
        question: "How to lose weight",
        answer: "Eat a balanced diet, exercise regularly, and maintain a calorie deficit!",
        patterns: ["lose weight", "weight loss"]
    },
    {
        question: "What foods are healthy",
        answer: "Fruits, vegetables, whole grains, lean proteins, and nuts are great choices!",
        patterns: ["healthy foods", "what to eat", "healthy eating"]
    },
    {
        question: "How to boost immune system",
        answer: "Get enough sleep, eat nutritious foods, exercise, and manage stress!",
        patterns: ["boost immune", "strengthen immune", "immune system"]
    },
    {
        question: "What is meditation",
        answer: "Meditation is a practice of focused attention to achieve mental clarity and calm!",
        patterns: ["what is meditation", "meditation"]
    },
    {
        question: "How to improve posture",
        answer: "Sit up straight, keep shoulders back, and take regular breaks from sitting!",
        patterns: ["improve posture", "better posture", "posture"]
    },
    {
        question: "What is yoga",
        answer: "Yoga is a practice combining physical poses, breathing, and meditation!",
        patterns: ["what is yoga", "yoga"]
    },
    {
        question: "How to deal with anxiety",
        answer: "Try breathing exercises, talk to someone, exercise, or seek professional help!",
        patterns: ["anxiety", "anxious", "deal with anxiety"]
    },
    {
        question: "Why is breakfast important",
        answer: "Breakfast jumpstarts your metabolism and provides energy for the day!",
        patterns: ["breakfast important", "why breakfast"]
    },
    {
        question: "How to stay motivated",
        answer: "Set clear goals, celebrate small wins, and surround yourself with positive people!",
        patterns: ["stay motivated", "motivation", "get motivated"]
    },
    {
        question: "What is mindfulness",
        answer: "Mindfulness is being fully present and aware in the current moment!",
        patterns: ["what is mindfulness", "mindfulness"]
    },
    {
        question: "How to improve memory",
        answer: "Get enough sleep, stay mentally active, exercise, and eat brain-healthy foods!",
        patterns: ["improve memory", "better memory", "memory"]
    },

    // ==================== FOOD & COOKING ====================
    {
        question: "How to boil eggs",
        answer: "Boil water, add eggs, cook 6-12 mins depending on desired firmness, then cool!",
        patterns: ["boil eggs", "cook eggs", "hard boiled"]
    },
    {
        question: "How to cook rice",
        answer: "Use 2 cups water per 1 cup rice. Boil, then simmer covered for 15-20 mins!",
        patterns: ["cook rice", "make rice"]
    },
    {
        question: "What is gluten",
        answer: "Gluten is a protein found in wheat, barley, and rye!",
        patterns: ["what is gluten", "gluten"]
    },
    {
        question: "How to make coffee",
        answer: "Add ground coffee to filter, pour hot water over it, and let it brew!",
        patterns: ["make coffee", "brew coffee"]
    },
    {
        question: "What is vegan",
        answer: "Vegan means no animal products - no meat, dairy, eggs, or honey!",
        patterns: ["what is vegan", "vegan diet"]
    },
    {
        question: "How to cut an onion",
        answer: "Cut off top, peel skin, halve it, then slice or dice as needed!",
        patterns: ["cut onion", "chop onion"]
    },
    {
        question: "What temperature to bake chicken",
        answer: "Bake chicken at 375-400°F (190-200°C) until internal temp reaches 165°F!",
        patterns: ["bake chicken", "chicken temperature"]
    },
    {
        question: "How to make pasta",
        answer: "Boil salted water, add pasta, cook 8-12 mins until al dente, then drain!",
        patterns: ["make pasta", "cook pasta"]
    },
    {
        question: "What is umami",
        answer: "Umami is the fifth basic taste - savory and delicious!",
        patterns: ["what is umami", "umami"]
    },
    {
        question: "How to store bananas",
        answer: "Keep at room temperature, or refrigerate when ripe to slow ripening!",
        patterns: ["store bananas", "keep bananas fresh"]
    },
    {
        question: "What is kombucha",
        answer: "Kombucha is a fermented tea drink with probiotics!",
        patterns: ["what is kombucha", "kombucha"]
    },
    {
        question: "How to make smoothie",
        answer: "Blend fruits, yogurt/milk, and ice until smooth!",
        patterns: ["make smoothie", "smoothie recipe"]
    },
    {
        question: "What is keto diet",
        answer: "Keto is a low-carb, high-fat diet that puts your body in ketosis!",
        patterns: ["keto diet", "what is keto"]
    },
    {
        question: "How to meal prep",
        answer: "Plan meals, shop once, cook in batches, and store in containers!",
        patterns: ["meal prep", "meal planning"]
    },
    {
        question: "What is organic food",
        answer: "Organic food is grown without synthetic pesticides or fertilizers!",
        patterns: ["organic food", "what is organic"]
    },

    // ==================== ENTERTAINMENT & POP CULTURE ====================
    {
        question: "Tell me a joke",
        answer: "Why did the developer quit? Because they didn't get arrays!",
        patterns: ["(tell|say) (me )?(a )?joke", "make me laugh", "funny"]
    },
    {
        question: "Who is the most followed on Instagram",
        answer: "Cristiano Ronaldo has the most Instagram followers!",
        patterns: ["most followed.*instagram", "instagram followers"]
    },
    {
        question: "What is Netflix",
        answer: "Netflix is a streaming service for movies and TV shows!",
        patterns: ["what is netflix", "netflix"]
    },
    {
        question: "Who won the last Super Bowl",
        answer: "Check sports news for the latest Super Bowl winner!",
        patterns: ["super bowl", "who won.*super bowl"]
    },
    {
        question: "What is TikTok",
        answer: "TikTok is a social media app for short-form videos!",
        patterns: ["what is tiktok", "tiktok"]
    },
    {
        question: "Who is Taylor Swift",
        answer: "Taylor Swift is a Grammy-winning singer-songwriter!",
        patterns: ["taylor swift", "who is taylor"]
    },
    {
        question: "What is Spotify",
        answer: "Spotify is a music streaming service with millions of songs!",
        patterns: ["what is spotify", "spotify"]
    },
    {
        question: "What is the MCU",
        answer: "MCU is the Marvel Cinematic Universe - a series of superhero movies!",
        patterns: ["what is mcu", "marvel cinematic"]
    },
    {
        question: "Who is the richest person",
        answer: "Check current rankings as it changes, but often Elon Musk or Jeff Bezos!",
        patterns: ["richest person", "wealthiest person"]
    },
    {
        question: "What is gaming",
        answer: "Gaming is playing video games on consoles, PCs, or mobile devices!",
        patterns: ["what is gaming", "video games"]
    },
    {
        question: "What is anime",
        answer: "Anime is Japanese animated entertainment, often with unique art styles!",
        patterns: ["what is anime", "anime"]
    },
    {
        question: "Who is BTS",
        answer: "BTS is a hugely popular South Korean boy band!",
        patterns: ["who is bts", "bts"]
    },
    {
        question: "What is esports",
        answer: "Esports is competitive video gaming at a professional level!",
        patterns: ["what is esports", "esports"]
    },
    {
        question: "What is streaming",
        answer: "Streaming is watching or listening to content online in real-time!",
        patterns: ["what is streaming", "streaming"]
    },

    // ==================== TRAVEL & GEOGRAPHY ====================
    {
        question: "What is the best time to travel",
        answer: "Shoulder season (spring/fall) offers good weather and fewer crowds!",
        patterns: ["best time.*travel", "when to travel"]
    },
    {
        question: "How to pack light",
        answer: "Bring versatile clothes, layer items, and use packing cubes!",
        patterns: ["pack light", "packing tips"]
    },
    {
        question: "What is a passport",
        answer: "A passport is an official document for international travel!",
        patterns: ["what is passport", "passport"]
    },
    {
        question: "How many states in USA",
        answer: "There are 50 states in the United States!",
        patterns: ["how many states", "states in usa"]
    },
    {
        question: "What is the Great Wall of China",
        answer: "The Great Wall is an ancient fortification in China, over 13,000 miles long!",
        patterns: ["great wall", "wall of china"]
    },
    {
        question: "Where is the Eiffel Tower",
        answer: "The Eiffel Tower is in Paris, France!",
        patterns: ["eiffel tower", "where.*eiffel"]
    },
    {
        question: "What is a visa",
        answer: "A visa is permission to enter and stay in a foreign country!",
        patterns: ["what is visa", "visa"]
    },
    {
        question: "How to book cheap flights",
        answer: "Book in advance, be flexible with dates, and use comparison sites!",
        patterns: ["cheap flights", "book flights"]
    },
    {
        question: "What is jet lag",
        answer: "Jet lag is fatigue from traveling across time zones quickly!",
        patterns: ["what is jet lag", "jet lag"]
    },
    {
        question: "Where is the Grand Canyon",
        answer: "The Grand Canyon is in Arizona, USA!",
        patterns: ["grand canyon", "where.*grand canyon"]
    },
    {
        question: "What is the best country to visit",
        answer: "It depends on your interests! Italy, Japan, and Iceland are popular choices!",
        patterns: ["best country", "where to visit"]
    },
    {
        question: "How to stay safe while traveling",
        answer: "Research destinations, keep copies of documents, and stay aware of surroundings!",
        patterns: ["safe.*travel", "travel safety"]
    },
    {
        question: "What is backpacking",
        answer: "Backpacking is budget travel with minimal luggage, often staying in hostels!",
        patterns: ["what is backpacking", "backpacking"]
    },
    {
        question: "What currency does Europe use",
        answer: "Many European countries use the Euro (€)!",
        patterns: ["europe currency", "euro"]
    },

    // ==================== BUSINESS & WORK ====================
    {
        question: "How to write a resume",
        answer: "Include contact info, summary, experience, education, and skills. Keep it 1-2 pages!",
        patterns: ["write resume", "resume tips", "cv"]
    },
    {
        question: "How to prepare for interview",
        answer: "Research the company, practice answers, dress professionally, and arrive early!",
        patterns: ["interview prep", "job interview", "prepare.*interview"]
    },
    {
        question: "What is networking",
        answer: "Networking is building professional relationships to advance your career!",
        patterns: ["what is networking", "networking"]
    },
    {
        question: "How to ask for a raise",
        answer: "Document achievements, research market rates, and schedule a formal meeting!",
        patterns: ["ask for raise", "get a raise", "raise"]
    },
    {
        question: "What is work life balance",
        answer: "It's maintaining healthy boundaries between work and personal time!",
        patterns: ["work life balance", "work.*balance"]
    },
    {
        question: "How to start a business",
        answer: "Research your market, create a business plan, secure funding, and register legally!",
        patterns: ["start business", "starting.*business"]
    },
    {
        question: "What is entrepreneurship",
        answer: "Entrepreneurship is creating and running your own business!",
        patterns: ["what is entrepreneurship", "entrepreneur"]
    },
    {
        question: "How to be productive",
        answer: "Prioritize tasks, eliminate distractions, take breaks, and set clear goals!",
        patterns: ["be productive", "productivity", "more productive"]
    },
    {
        question: "What is remote work",
        answer: "Remote work is working from home or anywhere outside a traditional office!",
        patterns: ["remote work", "work from home", "wfh"]
    },
    {
        question: "How to manage time",
        answer: "Use a calendar, prioritize tasks, set deadlines, and avoid multitasking!",
        patterns: ["manage time", "time management"]
    },
    {
        question: "What is freelancing",
        answer: "Freelancing is working independently for multiple clients rather than one employer!",
        patterns: ["what is freelancing", "freelance"]
    },
    {
        question: "How to negotiate salary",
        answer: "Know your worth, let them make the first offer, and be ready to justify your ask!",
        patterns: ["negotiate salary", "salary negotiation"]
    },
    {
        question: "What is a startup",
        answer: "A startup is a new company designed to grow quickly and solve problems!",
        patterns: ["what is startup", "startup"]
    },
    {
        question: "How to quit a job professionally",
        answer: "Give 2 weeks notice, write a resignation letter, and leave on good terms!",
        patterns: ["quit job", "resign", "leave job"]
    },

    // ==================== MONEY & FINANCE ====================
    {
        question: "How to save money",
        answer: "Track spending, create a budget, cut unnecessary expenses, and automate savings!",
        patterns: ["save money", "saving", "save"]
    },
    {
        question: "What is cryptocurrency",
        answer: "Cryptocurrency is digital money that uses encryption for security!",
        patterns: ["what is crypto", "cryptocurrency", "bitcoin"]
    },
    {
        question: "How to invest",
        answer: "Start with index funds, diversify, invest regularly, and think long-term!",
        patterns: ["how to invest", "investing", "investment"]
    },
    {
        question: "What is a credit score",
        answer: "A credit score is a number showing how reliably you repay debts!",
        patterns: ["credit score", "what is credit"]
    },
    {
        question: "How to budget",
        answer: "Track income, list expenses, set spending limits, and review monthly!",
        patterns: ["how to budget", "budgeting", "make budget"]
    },
    {
        question: "What is compound interest",
        answer: "Compound interest is earning interest on your interest - money grows faster!",
        patterns: ["compound interest", "what is compound"]
    },
    {
        question: "How to pay off debt",
        answer: "List all debts, pay minimums on all, put extra toward highest interest rate!",
        patterns: ["pay off debt", "debt", "get out of debt"]
    },
    {
        question: "What is passive income",
        answer: "Passive income is money earned with minimal ongoing effort!",
        patterns: ["passive income", "what is passive"]
    },
    {
        question: "How to build wealth",
        answer: "Live below your means, invest consistently, and increase income over time!",
        patterns: ["build wealth", "get rich", "become wealthy"]
    },
    {
        question: "What is inflation",
        answer: "Inflation is when prices rise and money's purchasing power decreases!",
        patterns: ["what is inflation", "inflation"]
    },

    // ==================== LEARNING & EDUCATION ====================
    {
        question: "How to learn faster",
        answer: "Practice actively, teach others, space out study sessions, and get enough sleep!",
        patterns: ["learn faster", "study better", "learning"]
    },
    {
        question: "What is critical thinking",
        answer: "Critical thinking is analyzing facts objectively to form reasoned judgments!",
        patterns: ["critical thinking", "what is critical"]
    },
    {
        question: "How to improve reading",
        answer: "Read daily, expand vocabulary, take notes, and discuss what you read!",
        patterns: ["improve reading", "read better"]
    },
    {
        question: "What is online learning",
        answer: "Online learning is education delivered through the internet!",
        patterns: ["online learning", "e-learning"]
    },
    {
        question: "How to take good notes",
        answer: "Write key points, use abbreviations, organize by topic, and review regularly!",
        patterns: ["take notes", "note taking"]
    },
    {
        question: "What is a degree",
        answer: "A degree is an academic qualification from a college or university!",
        patterns: ["what is degree", "college degree"]
    },
    {
        question: "How to concentrate better",
        answer: "Remove distractions, take breaks, stay hydrated, and set clear goals!",
        patterns: ["concentrate", "focus better", "concentration"]
    },
    {
        question: "What is homeschool",
        answer: "Homeschooling is when parents educate their children at home!",
        patterns: ["homeschool", "what is homeschool"]
    },

    // ==================== RANDOM & FUN ====================
    {
        question: "What came first chicken or egg",
        answer: "The egg came first - laid by a bird that wasn't quite a chicken!",
        patterns: ["chicken or egg", "egg or chicken"]
    },
    {
        question: "Why is the sky blue",
        answer: "Blue light scatters more in the atmosphere, making the sky appear blue!",
        patterns: ["sky blue", "why.*sky.*blue"]
    },
    {
        question: "How many stars in the sky",
        answer: "You can see about 2,500 stars with naked eye, but billions exist!",
        patterns: ["how many stars", "stars in sky"]
    },
    {
        question: "What is the meaning of life",
        answer: "That's for you to decide! Many find meaning in relationships, purpose, and growth.",
        patterns: ["meaning of life", "purpose of life"]
    },
    {
        question: "Can you sing",
        answer: "I can't sing, but I can help you find song lyrics!",
        patterns: ["can you sing", "sing"]
    },
    {
        question: "Do you dream",
        answer: "I don't dream, but I help make yours come true!",
        patterns: ["do you dream", "dreams"]
    },
    {
        question: "What is love",
        answer: "Love is a deep affection and care for someone or something!",
        patterns: ["what is love", "define love"]
    },
    {
        question: "Why do cats purr",
        answer: "Cats purr when content, but also when stressed or healing!",
        patterns: ["cats purr", "why.*purr"]
    },
    {
        question: "How do birds fly",
        answer: "Birds fly by flapping wings to create lift and thrust!",
        patterns: ["birds fly", "how.*fly"]
    },
    {
        question: "What is the fastest animal",
        answer: "The peregrine falcon is fastest at 240+ mph when diving!",
        patterns: ["fastest animal", "quickest animal"]
    },
    {
        question: "Why do we yawn",
        answer: "Yawning may help cool the brain or increase oxygen intake!",
        patterns: ["why.*yawn", "yawning"]
    },
    {
        question: "What is deja vu",
        answer: "Deja vu is feeling like you've experienced something before!",
        patterns: ["deja vu", "what is deja"]
    },
    {
        question: "Can fish drown",
        answer: "Yes! Fish can drown if there's not enough oxygen in the water!",
        patterns: ["fish drown", "can.*fish"]
    },
    {
        question: "Why is ocean salty",
        answer: "Rivers carry dissolved minerals and salts to the ocean over time!",
        patterns: ["ocean salty", "sea salty", "why.*salt"]
    },
    {
        question: "What is the deepest ocean",
        answer: "The Mariana Trench in the Pacific is the deepest at 36,000 feet!",
        patterns: ["deepest ocean", "mariana trench"]
    },
    {
        question: "Do trees sleep",
        answer: "Trees don't sleep, but they do have reduced activity at night!",
        patterns: ["trees sleep", "do.*trees"]
    },
    {
        question: "What is a black hole",
        answer: "A black hole is a region in space with gravity so strong nothing can escape!",
        patterns: ["black hole", "what is black hole"]
    },
    {
        question: "Can you see sound",
        answer: "Not normally, but sound can be visualized with special equipment!",
        patterns: ["see sound", "visualize sound"]
    },
    {
        question: "Why do onions make you cry",
        answer: "Cutting onions releases chemicals that irritate your eyes!",
        patterns: ["onions.*cry", "why.*onions"]
    },
    {
        question: "What is the strongest muscle",
        answer: "The masseter (jaw muscle) is the strongest based on weight!",
        patterns: ["strongest muscle", "powerful muscle"]
    },

    // ==================== PROGRAMMING & TECH SPECIFIC ====================
    {
        question: "What is Git",
        answer: "Git is a version control system for tracking code changes!",
        patterns: ["what is git", "git"]
    },
    {
        question: "What is an API",
        answer: "An API lets different software applications communicate with each other!",
        patterns: ["what is api", "api"]
    },
    {
        question: "What is a database",
        answer: "A database is organized storage for digital information!",
        patterns: ["what is database", "database"]
    },
    {
        question: "What is debugging",
        answer: "Debugging is finding and fixing errors in code!",
        patterns: ["debugging", "what is debug"]
    },
    {
        question: "What is a loop",
        answer: "A loop repeats code until a condition is met!",
        patterns: ["what is loop", "loop programming"]
    },
    {
        question: "What is machine learning",
        answer: "Machine learning is AI that improves from experience without being explicitly programmed!",
        patterns: ["machine learning", "what is ml"]
    },
    {
        question: "What is responsive design",
        answer: "Responsive design makes websites work well on all device sizes!",
        patterns: ["responsive design", "responsive web"]
    },
    {
        question: "What is a framework",
        answer: "A framework is pre-written code that helps build applications faster!",
        patterns: ["what is framework", "framework"]
    },

    // ==================== CONVERSATIONAL TRAINING DATA ====================
    // 150+ natural conversation patterns for better human-like interaction

    // Enhanced Greetings
    {
        question: "Good morning",
        answer: "Good morning! Hope you have a wonderful day ahead!",
        patterns: ["good morning", "morning"]
    },
    {
        question: "Nice to meet you",
        answer: "Nice to meet you too! I'm happy to chat with you.",
        patterns: ["nice to meet", "pleased to meet"]
    },
    {
        question: "Good evening",
        answer: "Good evening! How has your day been?",
        patterns: ["good evening", "evening"]
    },
    {
        question: "Howdy",
        answer: "Howdy! Great to hear from you. What brings you here today?",
        patterns: ["howdy"]
    },
    {
        question: "Long day",
        answer: "Sounds like you've been through it! Want to talk about it or just unwind?",
        patterns: ["long day", "tough day"]
    },

    // Small Talk
    {
        question: "How was your day",
        answer: "It's been pretty good, thanks for asking! How has yours been going?",
        patterns: ["how was your day", "how's your day"]
    },
    {
        question: "What have you been up to",
        answer: "Just the usual! Chatting with people and trying to be helpful. What about you?",
        patterns: ["what.*been up to", "been up to"]
    },
    {
        question: "Long time no see",
        answer: "It has been a while! Great to hear from you again. What have you been up to?",
        patterns: ["long time no see", "haven't seen you"]
    },
    {
        question: "How's everything going",
        answer: "Everything's going well! Just taking things one day at a time. How are things on your end?",
        patterns: ["how.*everything", "everything going"]
    },
    {
        question: "Any plans for the weekend",
        answer: "I don't make personal plans, but I'm curious about yours! Do you have anything fun lined up?",
        patterns: ["plans.*weekend", "weekend plans"]
    },
    {
        question: "How's the family",
        answer: "I don't have a family myself, but I appreciate you asking! How is your family doing?",
        patterns: ["how.*family", "family doing"]
    },
    {
        question: "What's new",
        answer: "Always learning something new from the people I chat with! What's new with you?",
        patterns: ["what's new", "anything new"]
    },
    {
        question: "Keeping busy",
        answer: "Always chatting with interesting people like you! How about you? Been keeping busy?",
        patterns: ["keeping busy", "been busy"]
    },
    {
        question: "Same old same old",
        answer: "I hear you! Sometimes routine can feel monotonous. Looking to shake things up?",
        patterns: ["same old", "nothing new"]
    },
    {
        question: "Just chilling",
        answer: "Nice! Sometimes chilling is exactly what we need. What do you like to do when you're relaxing?",
        patterns: ["just chilling", "chilling", "relaxing"]
    },
    {
        question: "Nice talking to you",
        answer: "Same here! I always enjoy our conversations. Feel free to come back anytime!",
        patterns: ["nice talking", "enjoyed talking"]
    },

    // Personal Questions
    {
        question: "Where are you from",
        answer: "I exist in the digital world, so I don't have a physical location. Where are you from?",
        patterns: ["where.*you from", "where do you live"]
    },
    {
        question: "How old are you",
        answer: "I don't age like humans do, but I'm always learning and improving! How about you?",
        patterns: ["how old", "your age"]
    },
    {
        question: "What do you like to do",
        answer: "I enjoy having interesting conversations and helping people. What are your hobbies?",
        patterns: ["what.*you like", "what do you do"]
    },
    {
        question: "Do you have any siblings",
        answer: "I don't have a family in the traditional sense. Do you have siblings?",
        patterns: ["siblings", "brothers.*sisters"]
    },
    {
        question: "What's your purpose",
        answer: "My purpose is to chat with people and hopefully make their day a bit better! What drives you?",
        patterns: ["your purpose", "why.*exist"]
    },
    {
        question: "Do you sleep",
        answer: "I don't need sleep like humans do! But I'm curious, are you getting enough sleep?",
        patterns: ["do you sleep", "need sleep"]
    },
    {
        question: "Can you feel emotions",
        answer: "I process and respond to emotional content, but my experience is different from human emotions.",
        patterns: ["feel emotions", "have feelings"]
    },

    // Emotions - Positive
    {
        question: "I'm feeling happy today",
        answer: "That's wonderful! I'm so glad you're feeling good. What's making you happy?",
        patterns: ["(i'm|i am|feeling) happy", "so happy"]
    },
    {
        question: "I'm so excited",
        answer: "That's awesome! Excitement is such a great feeling. What are you excited about?",
        patterns: ["(i'm|i am) excited", "so excited"]
    },
    {
        question: "I'm feeling grateful",
        answer: "That's a beautiful feeling! What are you grateful for today?",
        patterns: ["feeling grateful", "(i'm|i am) grateful"]
    },
    {
        question: "I'm proud of myself",
        answer: "You should be! What accomplishment are you proud of?",
        patterns: ["proud of myself", "(i'm|i am) proud"]
    },
    {
        question: "I feel hopeful",
        answer: "Hope is such a powerful feeling! What's filling you with hope today?",
        patterns: ["feel hopeful", "(i'm|i am) hopeful"]
    },
    {
        question: "I'm content",
        answer: "Contentment is a beautiful state of mind. What's bringing you that peace right now?",
        patterns: ["(i'm|i am) content", "feeling content"]
    },

    // Emotions - Negative
    {
        question: "I'm a bit sad",
        answer: "I'm sorry to hear that. Do you want to talk about what's bothering you?",
        patterns: ["(i'm|i am|feeling) sad", "feel sad"]
    },
    {
        question: "I'm really stressed out",
        answer: "I understand stress can be tough. Would you like to talk about what's causing it?",
        patterns: ["stressed out", "(i'm|i am) stressed", "stressful"]
    },
    {
        question: "I'm frustrated",
        answer: "Frustration is totally valid. What's frustrating you? Sometimes venting helps.",
        patterns: ["(i'm|i am) frustrated", "frustrating"]
    },
    {
        question: "I feel lonely",
        answer: "Loneliness can be really hard. I'm here to chat with you. Is there anything specific on your mind?",
        patterns: ["feel lonely", "(i'm|i am) lonely"]
    },
    {
        question: "I'm bored",
        answer: "Boredom happens! Want to chat about something interesting, or looking for suggestions?",
        patterns: ["(i'm|i am) bored", "so bored"]
    },
    {
        question: "I'm confused",
        answer: "Confusion is okay! What's confusing you? Maybe talking it through will help.",
        patterns: ["(i'm|i am) confused", "confusing"]
    },
    {
        question: "I'm worried",
        answer: "I'm sorry you're feeling worried. Do you want to talk about what's concerning you?",
        patterns: ["(i'm|i am) worried", "worrying"]
    },
    {
        question: "I'm feeling overwhelmed",
        answer: "Being overwhelmed is tough. Take a deep breath. What's piling up on you right now?",
        patterns: ["overwhelmed", "too much"]
    },
    {
        question: "I'm angry",
        answer: "Anger is a valid emotion. What's making you angry? Sometimes venting helps process it.",
        patterns: ["(i'm|i am) angry", "so angry", "mad"]
    },

    // Requests & Commands
    {
        question: "Surprise me",
        answer: "Did you know that honey never spoils? Archaeologists have found 3,000-year-old honey that's still edible!",
        patterns: ["surprise me", "surprise"]
    },
    {
        question: "Make me laugh",
        answer: "What do you call a bear with no teeth? A gummy bear!",
        patterns: ["make me laugh", "something funny"]
    },
    {
        question: "Cheer me up",
        answer: "Remember, tough times don't last, but tough people do. What would make you smile right now?",
        patterns: ["cheer me up", "cheer up"]
    },
    {
        question: "Give me some advice",
        answer: "I'd be happy to help! What situation do you need advice about?",
        patterns: ["give.*advice", "need advice", "some advice"]
    },
    {
        question: "Can you recommend something",
        answer: "Sure! What kind of recommendation are you looking for? Books, movies, music?",
        patterns: ["recommend", "recommendation"]
    },
    {
        question: "Tell me something interesting",
        answer: "Octopuses have three hearts! Two pump blood to the gills, and one pumps it to the rest of the body!",
        patterns: ["something interesting", "tell me something"]
    },
    {
        question: "Inspire me",
        answer: "The only impossible journey is the one you never begin. What journey are you thinking about?",
        patterns: ["inspire me", "inspiration"]
    },
    {
        question: "Give me a fun fact",
        answer: "Bananas are berries, but strawberries aren't! Botany can be surprising.",
        patterns: ["fun fact", "cool fact", "interesting fact"]
    },
    {
        question: "Tell me something positive",
        answer: "Every day is a new opportunity to grow, learn, and make a difference. You've got potential!",
        patterns: ["something positive", "positive"]
    },

    // Enhanced Farewells
    {
        question: "I have to go now",
        answer: "No problem! It was great talking with you. Have a wonderful day!",
        patterns: ["have to go", "gotta go", "need to go"]
    },
    {
        question: "Talk to you soon",
        answer: "Sounds great! Talk to you soon. Have a good one!",
        patterns: ["talk.*soon", "speak soon"]
    },
    {
        question: "Catch you later",
        answer: "Catch you later! Stay awesome!",
        patterns: ["catch you later", "catch ya"]
    },
    {
        question: "Gotta run",
        answer: "No problem! Go do what you need to do. Chat with you next time!",
        patterns: ["gotta run", "got to run"]
    },
    {
        question: "Until next time",
        answer: "Until next time! Take care of yourself!",
        patterns: ["until next time", "till next time"]
    },

    // Weather Talk
    {
        question: "It's so hot today",
        answer: "Yeah, hot weather can be tough! Are you staying hydrated?",
        patterns: ["so hot", "really hot", "hot today"]
    },
    {
        question: "It's raining outside",
        answer: "Rainy days can be cozy! Do you like the rain, or does it bring your mood down?",
        patterns: ["raining", "it's rain"]
    },
    {
        question: "Beautiful weather today",
        answer: "That's great! Beautiful weather always makes the day better. Planning to go outside?",
        patterns: ["beautiful weather", "nice weather", "great weather"]
    },
    {
        question: "It's freezing",
        answer: "Brrr! Cold weather can be brutal. Stay warm! Do you have heat and warm clothes?",
        patterns: ["freezing", "so cold", "really cold"]
    },
    {
        question: "Love this sunny day",
        answer: "Sunny days are the best! There's something about sunshine that lifts your spirits.",
        patterns: ["sunny day", "sunshine"]
    },
    {
        question: "Perfect weather for a walk",
        answer: "Sounds lovely! Walking in nice weather is such a simple pleasure. Where do you like to walk?",
        patterns: ["perfect weather", "weather.*walk"]
    },
    {
        question: "This weather is unpredictable",
        answer: "Unpredictable weather can be frustrating! Do you check forecasts or just go with the flow?",
        patterns: ["unpredictable weather", "weather.*unpredictable"]
    },

    // Food & Eating
    {
        question: "I'm hungry",
        answer: "Time to eat! What are you in the mood for? Any cravings?",
        patterns: ["(i'm|i am) hungry", "so hungry"]
    },
    {
        question: "I just had an amazing meal",
        answer: "That sounds delicious! What did you have? I love hearing about good food.",
        patterns: ["amazing meal", "great meal", "delicious"]
    },
    {
        question: "What should I eat for dinner",
        answer: "Good question! What kind of food are you craving? Italian, Asian, comfort food?",
        patterns: ["what.*eat.*dinner", "dinner ideas"]
    },
    {
        question: "I love pizza",
        answer: "Pizza is amazing! What's your favorite type? People have strong opinions about toppings.",
        patterns: ["love pizza", "pizza"]
    },
    {
        question: "Coffee is life",
        answer: "Totally get it! Coffee lovers are passionate. How do you take your coffee?",
        patterns: ["coffee.*life", "love coffee"]
    },
    {
        question: "I'm trying to eat healthier",
        answer: "That's a great goal! Small changes make a big difference. What healthy foods do you enjoy?",
        patterns: ["eat.*healthier", "eating healthy"]
    },
    {
        question: "I can't cook",
        answer: "Cooking is a skill you can learn! Start with simple recipes. What would you like to make?",
        patterns: ["can't cook", "don't know.*cook"]
    },
    {
        question: "I'm on a diet",
        answer: "Good for you for focusing on your health! How's it going so far?",
        patterns: ["on a diet", "dieting"]
    },
    {
        question: "I love cooking",
        answer: "Cooking is such a creative and rewarding activity! What's your signature dish?",
        patterns: ["love cooking", "enjoy cooking"]
    },

    // Work & Career
    {
        question: "Work was exhausting today",
        answer: "Sounds like you had a long day! Make sure to take some time to relax and recharge.",
        patterns: ["work.*exhausting", "exhausting day", "tired from work"]
    },
    {
        question: "I have a big presentation tomorrow",
        answer: "That's exciting and probably a bit nerve-wracking! I'm sure you'll do great.",
        patterns: ["presentation.*tomorrow", "big presentation"]
    },
    {
        question: "My boss is being difficult",
        answer: "That's frustrating to deal with. Work relationships can be challenging. How are you handling it?",
        patterns: ["boss.*difficult", "difficult boss"]
    },
    {
        question: "I got a promotion",
        answer: "Congratulations! That's fantastic news! Your hard work paid off. How are you feeling?",
        patterns: ["got.*promotion", "promoted"]
    },
    {
        question: "I'm thinking about changing jobs",
        answer: "That's a big decision! What's making you consider a change? Sometimes a fresh start helps.",
        patterns: ["changing jobs", "new job", "switch jobs"]
    },
    {
        question: "I'm procrastinating",
        answer: "We've all been there! Sometimes just starting for 5 minutes helps. What task are you avoiding?",
        patterns: ["procrastinating", "putting off"]
    },
    {
        question: "I love my job",
        answer: "That's wonderful! Loving what you do makes such a difference. What do you love most about it?",
        patterns: ["love my job", "love.*work"]
    },
    {
        question: "I'm burned out",
        answer: "Burnout is real and serious. Make sure to take care of yourself. Have you taken any breaks lately?",
        patterns: ["burned out", "burnt out", "burnout"]
    },
    {
        question: "Monday blues",
        answer: "Mondays can be rough! But you've got this. What's on your agenda for the week?",
        patterns: ["monday blues", "hate monday"]
    },
    {
        question: "Finally Friday",
        answer: "TGIF! Any fun plans for the weekend?",
        patterns: ["finally friday", "it's friday", "tgif"]
    },

    // Hobbies & Interests
    {
        question: "I love reading",
        answer: "Reading is such a great hobby! What kind of books do you enjoy? Any recent favorites?",
        patterns: ["love reading", "enjoy reading"]
    },
    {
        question: "I play guitar",
        answer: "That's awesome! How long have you been playing? Music is a wonderful creative outlet.",
        patterns: ["play guitar", "guitar player"]
    },
    {
        question: "I'm into photography",
        answer: "Photography is a beautiful art form! What do you like to photograph? Landscapes, people?",
        patterns: ["into photography", "love photography"]
    },
    {
        question: "I enjoy hiking",
        answer: "Hiking is great for both body and mind! Do you have favorite trails you like to explore?",
        patterns: ["enjoy hiking", "love hiking", "like hiking"]
    },
    {
        question: "I love watching movies",
        answer: "Movies are amazing! What genres do you prefer? Got any recommendations?",
        patterns: ["love.*movies", "watching movies"]
    },
    {
        question: "I don't have any hobbies",
        answer: "That's okay! Maybe this is a good time to explore some interests. What are you curious about?",
        patterns: ["no hobbies", "don't have.*hobbies"]
    },
    {
        question: "I collect stamps",
        answer: "Stamp collecting is a classic hobby with so much history! How long have you been collecting?",
        patterns: ["collect stamps", "stamp collect"]
    },
    {
        question: "I love gaming",
        answer: "Gaming is awesome! What kind of games do you play? Console, PC, mobile?",
        patterns: ["love gaming", "love games", "gamer"]
    },
    {
        question: "I love traveling",
        answer: "Traveling opens up the world! Where's your favorite place you've been?",
        patterns: ["love travel", "enjoy travel"]
    },
    {
        question: "I enjoy painting",
        answer: "Painting is such a beautiful form of expression! What style or subjects do you like to paint?",
        patterns: ["enjoy painting", "love painting"]
    },

    // Advice Seeking
    {
        question: "How do I make new friends",
        answer: "Try joining groups or activities that interest you. Shared interests are a great foundation!",
        patterns: ["make.*friends", "find friends", "new friends"]
    },
    {
        question: "I'm having trouble sleeping",
        answer: "Sleep issues can be tough. Have you tried a bedtime routine or limiting screen time before bed?",
        patterns: ["trouble sleeping", "can't sleep", "insomnia"]
    },
    {
        question: "How can I be more productive",
        answer: "Try breaking tasks into smaller steps, minimizing distractions, and taking regular breaks!",
        patterns: ["more productive", "productivity"]
    },
    {
        question: "How do I deal with anxiety",
        answer: "Deep breathing, exercise, and talking to someone can help. If it persists, consider a professional.",
        patterns: ["deal.*anxiety", "anxiety", "anxious"]
    },
    {
        question: "How can I stay motivated",
        answer: "Setting small goals and celebrating wins helps. Also, remind yourself why you started!",
        patterns: ["stay motivated", "keep motivated"]
    },
    {
        question: "Should I take a risk",
        answer: "Risk-taking depends on the situation! What are the potential benefits and downsides?",
        patterns: ["take.*risk", "should i risk"]
    },
    {
        question: "How do I build confidence",
        answer: "Confidence grows with practice and self-compassion! Start with small challenges and celebrate wins.",
        patterns: ["build confidence", "more confident"]
    },
    {
        question: "I want to learn something new",
        answer: "That's fantastic! Learning keeps life interesting. What are you interested in learning?",
        patterns: ["learn.*new", "want to learn"]
    },
    {
        question: "How do I handle stress",
        answer: "Exercise, deep breathing, and talking to someone can help. What usually stresses you out?",
        patterns: ["handle stress", "manage stress", "stress"]
    },
    {
        question: "Should I follow my passion",
        answer: "That's personal! Passion can fuel amazing work, but practical considerations matter too.",
        patterns: ["follow.*passion", "pursue passion"]
    },

    // Compliments
    {
        question: "You're really helpful",
        answer: "Thank you so much! That's really kind of you to say. I'm glad I could help!",
        patterns: ["you're helpful", "so helpful"]
    },
    {
        question: "I like talking to you",
        answer: "That means a lot! I enjoy our conversations too. Feel free to chat anytime!",
        patterns: ["like talking", "enjoy talking"]
    },
    {
        question: "You're smart",
        answer: "That's very nice of you! I try my best to be helpful and informative.",
        patterns: ["you're smart", "so smart"]
    },
    {
        question: "You understand me",
        answer: "I'm really glad you feel understood! That's what I'm here for. Share anything on your mind.",
        patterns: ["you understand", "understand me"]
    },

    // Apologies
    {
        question: "I apologize for earlier",
        answer: "No worries at all! We all have moments. Let's move forward. How can I help you today?",
        patterns: ["(i )?apologize", "sorry about"]
    },

    // Opinions
    {
        question: "What do you think about social media",
        answer: "Social media connects people globally but can also be overwhelming. What's your take on it?",
        patterns: ["think.*social media", "social media"]
    },
    {
        question: "Do you believe in fate",
        answer: "That's deep! Some find comfort in fate, others prefer free will. What do you believe?",
        patterns: ["believe.*fate", "fate"]
    },
    {
        question: "What's your favorite color",
        answer: "I appreciate all colors for different reasons! Do you have a favorite?",
        patterns: ["favorite color", "favourite color"]
    },
    {
        question: "Morning or night person",
        answer: "I'm available 24/7! Are you a morning person or a night owl?",
        patterns: ["morning.*night", "early bird"]
    },
    {
        question: "Cats or dogs",
        answer: "Both have their charm! Cats are independent, dogs are loyal. Which do you prefer?",
        patterns: ["cats or dogs", "dogs or cats"]
    },
    {
        question: "What makes a good friend",
        answer: "Good friends are trustworthy, supportive, and genuinely care. What do you value in friendship?",
        patterns: ["good friend", "what makes.*friend"]
    },
    {
        question: "Is change good",
        answer: "Change can be challenging and exciting! It often brings growth. How do you feel about change?",
        patterns: ["is change", "change good"]
    },

    // Experiences
    {
        question: "I just came back from vacation",
        answer: "Welcome back! How was your vacation? Where did you go?",
        patterns: ["back from vacation", "vacation"]
    },
    {
        question: "I tried something new today",
        answer: "That's exciting! Trying new things takes courage. What did you try?",
        patterns: ["tried.*new", "something new"]
    },
    {
        question: "I had a weird dream last night",
        answer: "Dreams can be so strange! Do you remember what it was about?",
        patterns: ["weird dream", "strange dream"]
    },
    {
        question: "Today was amazing",
        answer: "That's wonderful to hear! What made today so amazing for you?",
        patterns: ["today.*amazing", "amazing day"]
    },
    {
        question: "I learned something new",
        answer: "Love that! Learning new things is exciting. What did you learn?",
        patterns: ["learned.*new", "learnt something"]
    },
    {
        question: "I met someone interesting",
        answer: "Interesting people make life more colorful! What made them interesting to you?",
        patterns: ["met.*interesting", "interesting person"]
    },
    {
        question: "I made a mistake",
        answer: "Everyone makes mistakes! They're how we learn and grow. What happened?",
        patterns: ["made.*mistake", "messed up"]
    },
    {
        question: "I accomplished something big",
        answer: "That's fantastic! You should be proud. What did you accomplish?",
        patterns: ["accomplished", "achievement"]
    },

    // ==================== SLANG & INFORMAL LANGUAGE ====================
    {
        question: "What's the tea",
        answer: "Looking for some gossip or news? I'm all ears! What do you want to know?",
        patterns: ["what'?s the tea", "spill the tea", "tea"]
    },
    {
        question: "No cap",
        answer: "For real! I'm being honest with you.",
        patterns: ["no cap", "nocap"]
    },
    {
        question: "Bet",
        answer: "Sounds good! I'm on board with that.",
        patterns: ["^bet$", "^bet\\b"]
    },
    {
        question: "Facts",
        answer: "Absolutely true! You're speaking facts right now.",
        patterns: ["^facts$", "^fax$"]
    },
    {
        question: "Slay",
        answer: "You're absolutely crushing it! Keep being awesome!",
        patterns: ["slay", "slaying"]
    },
    {
        question: "Vibe check",
        answer: "The vibe is good! How are you feeling today?",
        patterns: ["vibe check", "vibes"]
    },
    {
        question: "Lowkey",
        answer: "I hear you - sometimes we feel things quietly without making a big deal.",
        patterns: ["lowkey", "low key"]
    },
    {
        question: "Highkey",
        answer: "Absolutely and obviously! No hiding those feelings!",
        patterns: ["highkey", "high key"]
    },
    {
        question: "Salty",
        answer: "Feeling a bit upset or annoyed? That's totally normal. Want to talk about it?",
        patterns: ["salty", "being salty"]
    },
    {
        question: "Lit",
        answer: "That's awesome! Sounds like something exciting is happening!",
        patterns: ["\\blit\\b", "this is lit"]
    },
    {
        question: "Fire emoji",
        answer: "That's fire! 🔥 Really cool and impressive!",
        patterns: ["fire", "🔥", "that.*fire"]
    },
    {
        question: "Sus",
        answer: "Suspicious, right? Trust your instincts if something feels off.",
        patterns: ["\\bsus\\b", "suspicious", "that's sus"]
    },
    {
        question: "Goat",
        answer: "Greatest Of All Time! That's high praise!",
        patterns: ["\\bgoat\\b", "the goat"]
    },
    {
        question: "Flex",
        answer: "Showing off a bit? That's cool! Share what you're proud of!",
        patterns: ["flex", "flexing"]
    },
    {
        question: "Mood",
        answer: "I totally get that feeling! Relatable.",
        patterns: ["^mood$", "big mood"]
    },
    {
        question: "Oof",
        answer: "Yeah, that's rough. Hope things get better!",
        patterns: ["^oof$", "oof size"]
    },
    {
        question: "Yeet",
        answer: "Throwing it with enthusiasm! That's the spirit!",
        patterns: ["yeet", "yeeted"]
    },
    {
        question: "Bruh",
        answer: "I know, right? Sometimes you just gotta say bruh.",
        patterns: ["^bruh$", "bruh moment"]
    },
    {
        question: "Fam",
        answer: "What's up, fam? I'm here for you!",
        patterns: ["\\bfam\\b", "hey fam"]
    },
    {
        question: "Sis",
        answer: "Hey sis! How can I help you today?",
        patterns: ["\\bsis\\b", "hey sis"]
    },

    // ==================== COMMON ABBREVIATIONS ====================
    {
        question: "What does lol mean",
        answer: "LOL means 'Laughing Out Loud' - used when something is funny!",
        patterns: ["lol", "what.*lol"]
    },
    {
        question: "What does brb mean",
        answer: "BRB means 'Be Right Back' - telling someone you'll return soon!",
        patterns: ["brb", "what.*brb"]
    },
    {
        question: "What does omg mean",
        answer: "OMG means 'Oh My God' - expressing surprise or shock!",
        patterns: ["omg", "what.*omg"]
    },
    {
        question: "What does tbh mean",
        answer: "TBH means 'To Be Honest' - being frank and truthful!",
        patterns: ["tbh", "what.*tbh", "to be honest"]
    },
    {
        question: "What does imo mean",
        answer: "IMO means 'In My Opinion' - sharing your personal view!",
        patterns: ["imo", "imho", "what.*imo"]
    },
    {
        question: "What does fyi mean",
        answer: "FYI means 'For Your Information' - sharing useful info!",
        patterns: ["fyi", "what.*fyi"]
    },
    {
        question: "What does idk mean",
        answer: "IDK means 'I Don't Know' - admitting uncertainty!",
        patterns: ["idk", "what.*idk", "i don'?t know"]
    },
    {
        question: "What does ikr mean",
        answer: "IKR means 'I Know, Right?' - agreeing enthusiastically!",
        patterns: ["ikr", "what.*ikr", "i know right"]
    },
    {
        question: "What does smh mean",
        answer: "SMH means 'Shaking My Head' - expressing disappointment or disbelief!",
        patterns: ["smh", "what.*smh"]
    },
    {
        question: "What does tl;dr mean",
        answer: "TL;DR means 'Too Long; Didn't Read' - a summary of long text!",
        patterns: ["tl;?dr", "what.*tldr"]
    },
    {
        question: "What does afk mean",
        answer: "AFK means 'Away From Keyboard' - stepping away from the computer!",
        patterns: ["afk", "what.*afk"]
    },
    {
        question: "What does btw mean",
        answer: "BTW means 'By The Way' - adding extra information!",
        patterns: ["btw", "what.*btw", "by the way"]
    },
    {
        question: "What does dm mean",
        answer: "DM means 'Direct Message' - private message on social media!",
        patterns: ["\\bdm\\b", "what.*dm", "direct message"]
    },
    {
        question: "What does nvm mean",
        answer: "NVM means 'Never Mind' - disregarding previous statement!",
        patterns: ["nvm", "what.*nvm", "nevermind"]
    },
    {
        question: "What does rn mean",
        answer: "RN means 'Right Now' - at this current moment!",
        patterns: ["\\brn\\b", "what.*rn", "right now"]
    },

    // ==================== COMMON TYPOS & VARIATIONS ====================
    {
        question: "Helo",
        answer: "Hello! How can I help you today?",
        patterns: ["helo", "hllo", "helo"]
    },
    {
        question: "Thx",
        answer: "You're welcome! Happy to help!",
        patterns: ["thx", "thnx", "thanx"]
    },
    {
        question: "Pls",
        answer: "Of course! What do you need?",
        patterns: ["pls", "plz", "plse"]
    },
    {
        question: "U r",
        answer: "Thanks! I appreciate that!",
        patterns: ["u r", "ur ", "you're"]
    },
    {
        question: "How r u",
        answer: "I'm doing great! How are you?",
        patterns: ["how r u", "how r you", "hru"]
    },
    {
        question: "Wat",
        answer: "Did you say 'what'? Can you clarify your question?",
        patterns: ["^wat$", "wut", "whut"]
    },
    {
        question: "Dunno",
        answer: "Not sure? That's okay! What are you trying to figure out?",
        patterns: ["dunno", "don'?t know", "duno"]
    },
    {
        question: "Gonna",
        answer: "Going to do something? Tell me more!",
        patterns: ["gonna", "going to", "gon"]
    },
    {
        question: "Wanna",
        answer: "Want to? What are you interested in?",
        patterns: ["wanna", "want to", "wan"]
    },
    {
        question: "Kinda",
        answer: "Kind of? Tell me more about what you're thinking.",
        patterns: ["kinda", "kind of", "sorta", "sort of"]
    },

    // ==================== EDGE CASES & CONTEXT ====================
    {
        question: "It doesn't work",
        answer: "Sorry to hear that! Can you tell me more about what's not working? What were you trying to do?",
        patterns: ["doesn'?t work", "not working", "broken", "won'?t work"]
    },
    {
        question: "This sucks",
        answer: "I'm sorry you're frustrated! What's going wrong? Let's see if we can make it better.",
        patterns: ["this sucks", "that sucks", "it sucks"]
    },
    {
        question: "I'm confused about this",
        answer: "Confusion is normal when learning! What specifically is confusing you? I'm here to clarify.",
        patterns: ["confused about", "confusing", "don'?t understand"]
    },
    {
        question: "Can you explain that again",
        answer: "Of course! Let me rephrase: which part would you like me to explain differently?",
        patterns: ["explain again", "repeat that", "say that again"]
    },
    {
        question: "That didn't make sense",
        answer: "Let me try explaining it differently! What part didn't make sense to you?",
        patterns: ["didn'?t make sense", "makes no sense", "not clear"]
    },
    {
        question: "I need more details",
        answer: "Absolutely! What specific details would be most helpful for you?",
        patterns: ["more details", "more info", "tell me more"]
    },
    {
        question: "Show me an example",
        answer: "Great idea! Examples make things clearer. What topic do you want an example for?",
        patterns: ["show.*example", "give.*example", "example"]
    },
    {
        question: "Is there a better way",
        answer: "Good question! There are often multiple approaches. What are you trying to accomplish?",
        patterns: ["better way", "easier way", "simpler way"]
    },
    {
        question: "What should I do next",
        answer: "Good question! What have you done so far? That will help me guide your next steps.",
        patterns: ["what.*next", "next step", "what now"]
    },
    {
        question: "Am I doing this right",
        answer: "Great that you're checking! Tell me what you're doing and I'll give you feedback.",
        patterns: ["doing.*right", "am i right", "is this correct"]
    },
    {
        question: "I'm stuck",
        answer: "Being stuck happens! Take a breath. What were you working on when you got stuck?",
        patterns: ["i'?m stuck", "stuck", "can'?t figure"]
    },
    {
        question: "This is hard",
        answer: "Challenging things often are! But you can do it. What's making it difficult?",
        patterns: ["this is hard", "too hard", "difficult"]
    },
    {
        question: "I give up",
        answer: "Don't give up yet! Take a break if needed, but you've got this. What's frustrating you?",
        patterns: ["give up", "giving up", "quit"]
    },
    {
        question: "How long will this take",
        answer: "That depends on several factors! What are you working on? I can give you a rough estimate.",
        patterns: ["how long", "how much time"]
    },
    {
        question: "Is this important",
        answer: "Good question! Importance depends on your goals. What are you trying to achieve?",
        patterns: ["is.*important", "does it matter", "why.*important"]
    },

    // ==================== META QUESTIONS ABOUT CHATBOT ====================
    {
        question: "How smart are you",
        answer: "I use pattern matching and text similarity with 220+ Q&A pairs! I'm pretty clever but still learning.",
        patterns: ["how smart", "how intelligent", "are you smart"]
    },
    {
        question: "Do you make mistakes",
        answer: "Sometimes! I'm not perfect. If I misunderstand, just rephrase your question and I'll try again.",
        patterns: ["make mistakes", "ever wrong", "can you be wrong"]
    },
    {
        question: "Can you learn",
        answer: "Yes! When I can't answer, I send the question to my creator who teaches me new responses!",
        patterns: ["can you learn", "do you learn", "learning"]
    },
    {
        question: "Are you getting smarter",
        answer: "Every unanswered question helps me learn! My knowledge base grows over time.",
        patterns: ["getting smarter", "improving", "learning more"]
    },
    {
        question: "What languages do you speak",
        answer: "I primarily speak English right now, but I'm designed to potentially support more languages!",
        patterns: ["what language", "other language", "speak.*language"]
    },
    {
        question: "Can you remember our conversation",
        answer: "Yes! I remember our recent messages in this session to provide better context.",
        patterns: ["remember.*conversation", "conversation history", "remember what"]
    },
    {
        question: "Do you have feelings",
        answer: "I don't have feelings like humans, but I can understand and respond to emotional content!",
        patterns: ["have feelings", "do you feel", "emotional"]
    },
    {
        question: "Who programmed you",
        answer: "I was created by Ye Zhang using JavaScript, pattern matching, and smart algorithms!",
        patterns: ["who programmed", "who created", "who coded"]
    },
    {
        question: "What makes you different",
        answer: "I work without AI APIs! I use pattern matching, similarity algorithms, and a large knowledge base.",
        patterns: ["what makes.*different", "difference", "why.*special"]
    },
    {
        question: "Can you access the internet",
        answer: "I work entirely offline using my built-in knowledge base - no internet needed!",
        patterns: ["access internet", "go online", "search web"]
    },
];

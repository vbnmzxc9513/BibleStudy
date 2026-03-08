export interface QuizResult {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    aiFeedback: string;
}

// Helper functions for API quota tracking
export const getDailyApiUsageKey = () => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `ai_api_usage_${today}`;
};

export const getDailyApiUsage = (): number => {
    const key = getDailyApiUsageKey();
    const usage = localStorage.getItem(key);
    return usage ? parseInt(usage, 10) : 0;
};

export const incrementDailyApiUsage = () => {
    const key = getDailyApiUsageKey();
    const usage = getDailyApiUsage();
    localStorage.setItem(key, (usage + 1).toString());
};

export const getModelDailyLimit = (model: string): number => {
    if (model.includes('gemini-1.5-flash')) return 1500;
    if (model.includes('gemini-2.5-flash')) return 1500;
    if (model.includes('gemini-1.5-pro')) return 50;
    if (model.includes('gpt-4o-mini')) return 200; // Estimated or placeholder for OpenAI
    if (model.includes('gpt-4o')) return 100; // Estimated or placeholder for OpenAI
    return 100; // Default fallback
};

export const generateCombinedAIContent = async (
    versesText: string,
    language: string,
    apiKey: string
): Promise<{ deepDive: string, quiz: QuizResult[] } | null> => {
    if (!apiKey) return null;

    const isGemini = apiKey.startsWith('AIza');
    const langInstructions = language === 'zh_TW'
        ? '請用繁體中文回答。'
        : 'Please answer in English.';

    const prompt = `Based on the following Bible verses, perform TWO tasks:
1. Generate an engaging theological explanation and insight for the chapter. Use Markdown formatting for this explanation (e.g., headings, bold text, lists).
2. Generate EXACTLY 3 multiple-choice questions to test reading comprehension and theological understanding.

${langInstructions}

Verses:
${versesText}

You MUST return the result as a raw JSON object with NO markdown formatting, NO \`\`\`json wrappers. Just the JSON object.
Format required:
{
  "deepDive": "The detailed theological explanation in Markdown format here...",
  "quiz": [
    {
      "question": "The question text here",
      "options": [
        "Option 1",
        "Option 2",
        "Option 3",
        "Option 4"
      ],
      "correctIndex": <0, 1, 2, or 3 representing the correct option>,
      "explanation": "Explanation of why the correct answer is right.",
      "aiFeedback": "An encouraging feedback message about the question or verse."
    }
  ]
}`;

    try {
        const defaultModel = isGemini ? 'gemini-2.5-flash' : 'gpt-4o-mini';
        const model = localStorage.getItem('ai_model') || defaultModel;

        if (isGemini) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        responseMimeType: "application/json"
                    }
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                if (response.status === 429 || errText.includes('quota')) {
                    throw new Error(`QUOTA_EXHAUSTED: Gemini API Error: ${response.status} ${errText}`);
                }
                throw new Error(`Gemini API Error: ${response.status} ${errText}`);
            }

            const data = await response.json();
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

            incrementDailyApiUsage();

            return JSON.parse(content) as { deepDive: string, quiz: QuizResult[] };

        } else {
            // Assume OpenAI
            const url = 'https://api.openai.com/v1/chat/completions';
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey.trim()}`
                },
                body: JSON.stringify({
                    model: model,
                    response_format: { type: "json_object" },
                    messages: [{ role: "user", content: prompt }]
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                if (response.status === 429 || errText.includes('quota')) {
                    throw new Error(`QUOTA_EXHAUSTED: OpenAI API Error: ${response.status} ${errText}`);
                }
                throw new Error(`OpenAI API Error: ${response.status} ${errText}`);
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content || "{}";

            incrementDailyApiUsage();

            return JSON.parse(content) as { deepDive: string, quiz: QuizResult[] };
        }
    } catch (e: any) {
        console.error("AI Combined Generation failed:", e);
        throw e;
    }
};

/**
 * Saves generated AI content to Firestore.
 */
export const saveAIContentToFirebase = async (uid: string, bookId: string, chapter: number, content: { deepDive: string, quiz: QuizResult[] }) => {
    if (!uid) return;

    // We must dynamically import firebase to avoid circular dependencies or initialization issues if 'db' is needed here, 
    // but we can assume 'db' is manageable if we import it at the top. Let's ensure db is imported.
    const { db } = await import('../firebase');
    const { doc, setDoc } = await import('firebase/firestore');

    const docId = `${bookId}_${chapter}`;
    const aiContentRef = doc(db, 'users', uid, 'ai_responses', docId);

    try {
        await setDoc(aiContentRef, {
            ...content,
            generatedAt: Date.now()
        }, { merge: true });
        console.log(`AI Content saved for ${docId}`);
    } catch (error) {
        console.error("Error saving AI content to Firebase:", error);
    }
};

/**
 * Fetches cached AI content from Firestore.
 */
export const fetchAIContentFromFirebase = async (uid: string, bookId: string, chapter: number): Promise<{ deepDive: string, quiz: QuizResult[] } | null> => {
    if (!uid) return null;

    const { db } = await import('../firebase');
    const { doc, getDoc } = await import('firebase/firestore');

    const docId = `${bookId}_${chapter}`;
    const aiContentRef = doc(db, 'users', uid, 'ai_responses', docId);

    try {
        const docSnap = await getDoc(aiContentRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.deepDive && data.quiz) {
                return { deepDive: data.deepDive, quiz: data.quiz as QuizResult[] };
            }
        }
        return null;
    } catch (error) {
        console.error("Error fetching AI content from Firebase:", error);
        return null;
    }
};

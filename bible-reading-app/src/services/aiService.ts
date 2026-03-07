export interface QuizResult {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    aiFeedback: string;
}

export const generateDeepDiveFromAI = async (
    versesText: string,
    language: string,
    apiKey: string
): Promise<string | null> => {
    if (!apiKey) return null;

    const isGemini = apiKey.startsWith('AIza');
    const langInstructions = language === 'zh_TW'
        ? '請用繁體中文回答，並且請務必使用 Markdown 語法來排版（例如使用標題、粗體、清單等），確保文章有良好的排版且易於閱讀。'
        : 'Please answer in English, and you MUST use Markdown formatting (e.g., headings, bold text, lists) to make the text well-structured and easy to read.';

    const prompt = `Based on the following Bible verses, generate an engaging theological explanation and insight for the chapter.
${langInstructions}

Verses:
${versesText}`;

    try {
        const defaultModel = isGemini ? 'gemini-2.5-flash' : 'gpt-4o-mini';
        const model = localStorage.getItem('ai_model') || defaultModel;

        if (isGemini) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            if (!response.ok) throw new Error("Gemini API Error");
            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
        } else {
            const url = 'https://api.openai.com/v1/chat/completions';
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{ role: "user", content: prompt }]
                })
            });

            if (!response.ok) throw new Error("OpenAI API Error");
            const data = await response.json();
            return data.choices?.[0]?.message?.content || null;
        }
    } catch (e) {
        console.error("AI Deep Dive Generation failed:", e);
        return null;
    }
};

export const generateQuizFromAI = async (
    versesText: string,
    language: string,
    apiKey: string
): Promise<QuizResult[] | null> => {

    if (!apiKey) return null;

    const isGemini = apiKey.startsWith('AIza');
    const langInstructions = language === 'zh_TW'
        ? '請用繁體中文回答。'
        : 'Please answer in English.';

    const prompt = `Based on the following Bible verses, generate EXACTLY 3 multiple-choice questions to test reading comprehension and theological understanding.
${langInstructions}

Verses:
${versesText}

You must return a raw JSON array of 3 objects with NO markdown formatting, NO \`\`\`json wrappers. Just the JSON array.
Format required:
[
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
]`;

    try {
        const defaultModel = isGemini ? 'gemini-2.5-flash' : 'gpt-4o-mini';
        const model = localStorage.getItem('ai_model') || defaultModel;

        if (isGemini) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
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

            if (!response.ok) throw new Error("Gemini API Error");

            const data = await response.json();
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

            return JSON.parse(content) as QuizResult[];

        } else {
            // Assume OpenAI
            const url = 'https://api.openai.com/v1/chat/completions';
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: model,
                    response_format: { type: "json_object" },
                    messages: [{ role: "user", content: prompt }]
                })
            });

            if (!response.ok) throw new Error("OpenAI API Error");

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content || "{}";

            return JSON.parse(content) as QuizResult[];
        }
    } catch (e) {
        console.error("AI Quiz Generation failed:", e);
        return null; // Fallback handled by UI
    }
};

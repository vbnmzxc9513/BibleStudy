export interface QuizResult {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    aiFeedback: string;
}

export const generateQuizFromAI = async (
    versesText: string,
    language: string,
    apiKey: string
): Promise<QuizResult | null> => {

    if (!apiKey) return null;

    const isGemini = apiKey.startsWith('AIza');
    const langInstructions = language === 'zh_TW'
        ? '請用繁體中文回答。'
        : 'Please answer in English.';

    const prompt = `Based on the following Bible verses, generate exactly ONE multiple-choice question to test reading comprehension and theological understanding.
${langInstructions}

Verses:
${versesText}

You must return a raw JSON object with NO markdown formatting, NO \`\`\`json wrappers. Just the JSON.
Format required:
{
  "question": "The question text here",
  "options": [
    "Option 1",
    "Option 2"
  ],
  "correctIndex": <0 or 1, representing the correct option>,
  "explanation": "Explanation of why the other answer is wrong.",
  "aiFeedback": "An encouraging feedback message about the chapter's core message."
}`;

    try {
        if (isGemini) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
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

            return JSON.parse(content) as QuizResult;

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
                    model: "gpt-4o-mini",
                    response_format: { type: "json_object" },
                    messages: [{ role: "user", content: prompt }]
                })
            });

            if (!response.ok) throw new Error("OpenAI API Error");

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content || "{}";

            return JSON.parse(content) as QuizResult;
        }
    } catch (e) {
        console.error("AI Generation failed:", e);
        return null; // Fallback handled by UI
    }
};

import { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';

type Language = 'zh_TW' | 'en';

type Translations = {
    [key in Language]: {
        [key: string]: string;
    };
};

const translations: Translations = {
    zh_TW: {
        // Layout
        home: '首頁',
        bible: '聖經',
        profile: '個人',
        aiSettings: 'AI 設定',

        // Dashboard
        greeting: '早安，閱讀者 ✨',
        subtitle: '讓我們繼續今日的屬靈旅程。',
        days: '天',
        resumeReading: '繼續閱讀',
        yourProgress: '您的進度',
        newTestament: '新約',
        chapters: '章',

        // Book Selection
        selectBook: '選擇書卷',
        searchPlaceholder: '搜尋書卷...',
        oldTestament: '舊約',

        // Reading View
        chapterStr: '第 {num} 章',
        deepenUnderstanding: '深入了解',
        aiPrompt: '您希望 AI 牧師為您解說本章的光照與神學意涵嗎？',
        aiBtn: '✨ AI 陪你解經',
        finishReading: '閱讀完畢並測驗',
        recapQuiz: '重點測驗',
        quizDesc: '5 道題目鞏固您的理解。',
        submitReturn: '送出並回首頁',

        // Profile
        yourProfile: '您的個人資料',
        guestUser: '訪客',
        anonymousAccount: '匿名帳號',
        linkedGoogleAccount: 'Google 帳號',
        signInGoogle: '連結 Google 帳號 (儲存進度)',
        aiSettingsTitle: 'AI 教練設定 (BYOK)',
        settingsDesc: '若要使用 AI 解經與自動測驗功能，請提供您的 API Key。您的金鑰會安全地儲存於瀏覽器本地端，不會傳送至我們的伺服器。',
        openAiKey: 'API Key (OpenAI / Gemini)',
        saveKey: '儲存 API Key',
        savedLocally: '已儲存於本機！',
        getApiKey: '取得 OpenAI 金鑰',
        getGeminiApiKey: '取得 Gemini 金鑰',
    },
    en: {
        // Layout
        home: 'Home',
        bible: 'Bible',
        profile: 'Profile',
        aiSettings: 'AI Settings',

        // Dashboard
        greeting: 'Good Morning, Reader ✨',
        subtitle: "Let's continue your spiritual journey today.",
        days: 'Days',
        resumeReading: 'Resume Reading',
        yourProgress: 'Your Progress',
        newTestament: 'New Testament',
        chapters: 'Chapters',

        // Book Selection
        selectBook: 'Select a Book',
        searchPlaceholder: 'Search for a book...',
        oldTestament: 'Old Testament',

        // Reading View
        chapterStr: 'Chapter {num}',
        deepenUnderstanding: 'Deepen Your Understanding',
        aiPrompt: 'Would you like an AI Pastor to explain the theological significance of this chapter?',
        aiBtn: '✨ AI Guide',
        finishReading: 'Finish Reading & Take Quiz',
        recapQuiz: 'Recap Quiz',
        quizDesc: '5 Questions to solidify your understanding.',
        submitReturn: 'Submit & Return Home',

        // Profile
        yourProfile: 'Your Profile',
        guestUser: 'Guest User',
        anonymousAccount: 'Anonymous Account',
        linkedGoogleAccount: 'Google Account',
        signInGoogle: 'Sign in / Link with Google',
        aiSettingsTitle: 'AI Coach Settings (BYOK)',
        settingsDesc: 'To use the AI Theological Guide and Auto-Quiz features, please provide your own API Key (Bring Your Own Key). Your key is stored locally in your browser and never sent to our servers.',
        openAiKey: 'API Key (OpenAI / Gemini)',
        saveKey: 'Save API Key',
        savedLocally: 'Saved Locally!',
        getApiKey: 'Get OpenAI Key',
        getGeminiApiKey: 'Get Gemini Key',
    }
};

interface LanguageContextType {
    language: Language;
    toggleLanguage: () => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    // Default to zh_TW as requested
    const [language, setLanguage] = useState<Language>('zh_TW');

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'zh_TW' ? 'en' : 'zh_TW');
    };

    const t = (key: string, params?: Record<string, string | number>) => {
        let str = translations[language][key] || key;
        if (params) {
            Object.entries(params).forEach(([k, v]) => {
                str = str.replace(`{${k}}`, String(v));
            });
        }
        return str;
    };

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { Sparkles, ArrowLeft, Loader2, CheckCircle, MessageCircle, ChevronLeft, ChevronRight, XCircle } from 'lucide-react';
import { bibleBooks } from '../../constants/bibleBooks';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { saveUserProgress } from '../../services/progressService';
import { generateQuizFromAI } from '../../services/aiService';
import type { QuizResult } from '../../services/aiService';
import './ReadingView.css';

interface Verse {
    number: number;
    text: string;
}

const ReadingView = () => {
    const { bookId, chapter } = useParams();
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const { user } = useAuth();

    const safeBookId = bookId || 'MAT';
    const safeChapter = chapter ? parseInt(chapter) : 1;

    const currentBibleBook = bibleBooks.find(b => b.id === safeBookId);
    const maxChapters = currentBibleBook ? currentBibleBook.chapters : 1;

    const hasNextChapter = safeChapter < maxChapters;
    const hasPrevChapter = safeChapter > 1;

    const [verses, setVerses] = useState<Verse[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const [showQuiz, setShowQuiz] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [quizData, setQuizData] = useState<QuizResult | null>(null);

    // Fetch actual data from Firestore
    useEffect(() => {
        const fetchChapterData = async () => {
            setIsLoadingData(true);
            try {
                const docRef = doc(db, 'bible_books', `${safeBookId}_${safeChapter}`);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setVerses(docSnap.data().verses as Verse[]);
                } else {
                    console.log("No such document in Firestore!");
                    // Fallback to empty if not uploaded yet
                    setVerses([]);
                }
            } catch (error) {
                console.error("Error fetching verses:", error);
                setVerses([]);
            } finally {
                setIsLoadingData(false);
            }
        };

        fetchChapterData();
    }, [safeBookId, safeChapter]);

    const mockQuizZh = {
        question: "1. 根據這段經文，以下哪一個描述最符合其核心神學意涵？",
        options: ["(錯誤示範) 這代表我們不應該依靠神，因為神很忙。", "(正確解答) 展現了神對人類無限的恩典與信實的應許。"],
        explanation: "答錯了。解析：這段經文的上下文強調的是神主動介入人類歷史，而不是說神過於忙碌。請重新選擇！",
        aiFeedback: "太棒了！您完全掌握了這段經文的重點。神的話語總是信實的。感謝您的用心閱讀，這個章節的閱讀進度已為您同步儲存！打卡成功！"
    };

    const mockQuizEn = {
        question: "1. Based on this passage, which description best fits the core theological meaning?",
        options: ["(Wrong Demo) It means we shouldn't rely on God because He is busy.", "(Correct Answer) It shows God's infinite grace and faithful promises to humanity."],
        explanation: "Incorrect. Analysis: The context emphasizes God's active intervention in human history, not that He is too busy. Please try again!",
        aiFeedback: "Excellent work! You've grasped the core message. God's word is always faithful. Your reading progress for this chapter has now been synchronized and saved! Check-in successful!"
    };

    const currentQuiz = quizData || (language === 'zh_TW' ? mockQuizZh : mockQuizEn) as any;

    const handleGenerateQuiz = async () => {
        setIsGenerating(true);
        const apiKey = localStorage.getItem('ai_api_key');

        if (!apiKey) {
            alert(language === 'zh_TW' ? '請先至個人頁面設定 AI API Key (BYOK)！' : 'Please set your AI API Key (BYOK) in the Profile page first!');
            setIsGenerating(false);
            return;
        }

        const versesText = verses.map(v => `${v.number} ${v.text}`).join('\n');
        const generated = await generateQuizFromAI(versesText, language, apiKey);

        if (generated) {
            setQuizData(generated);
            setShowQuiz(true);
        } else {
            alert(language === 'zh_TW' ? 'AI 題目生成失敗，請檢查 API Key 或網路連線。' : 'AI Generation failed. Please check your API Key or network.');
        }
        setIsGenerating(false);
    };

    const handleSubmitQuiz = async () => {
        // If correctIndex is missing due to AI glitch, fallback to 1
        const correctIdx = currentQuiz.correctIndex !== undefined ? currentQuiz.correctIndex : 1;

        if (selectedOption === correctIdx) {
            setQuizCompleted(true);
            if (user) {
                await saveUserProgress(user.uid, safeBookId, safeChapter);
            }
        }
    };

    return (
        <div className="reading-view-container pb-24">
            <header className="reading-header">
                <button className="back-btn" onClick={() => navigate('/books')}>
                    <ArrowLeft size={24} />
                </button>
                <div className="title-area">
                    <h3>{language === 'zh_TW' ? currentBibleBook?.cnName : currentBibleBook?.enName} - {t('chapterStr', { num: chapter || 1 })}</h3>
                </div>
            </header>

            <main className="reading-content delay-100 animate-fade-in-up">
                {isLoadingData ? (
                    <div className="flex justify-center items-center h-48 text-brand-color">
                        <Loader2 className="animate-spin mr-2" />
                        <span>{language === 'zh_TW' ? '載入經文中...' : 'Loading verses...'}</span>
                    </div>
                ) : verses.length > 0 ? (
                    verses.map((verse, index) => (
                        <div key={index} className="verse-row">
                            <span className="verse-number">{verse.number}</span>
                            <p className="verse-text">{verse.text}</p>
                        </div>
                    ))
                ) : (
                    <div className="p-4 text-center text-text-muted bg-bg-secondary rounded-lg">
                        {language === 'zh_TW'
                            ? '目前尚未同步此經文資料，請確認後端已執行 upload.js 上傳經文至 Firestore 喔！'
                            : 'Verses not found. Please ensure upload.js has pushed data to Firestore!'}
                    </div>
                )}
            </main>

            <div className="ai-companion-section glass-card delay-200 mt-8 relative">
                <div className="ai-companion-header">
                    <Sparkles size={24} className="icon-gold" />
                    <h4>{t('deepenUnderstanding')}</h4>
                </div>
                <p className="mb-4">{t('aiPrompt')}</p>
                <div className="quiz-trigger-section">
                    {!showQuiz ? (
                        <div className="flex flex-col gap-3">
                            <div className="text-sm px-3 py-2 bg-brand-color/10 text-brand-color rounded-md border border-brand-color/20 text-center font-medium">
                                💡 {language === 'zh_TW' ? '讀完這章了嗎？完成下方的 AI 測驗來為今天的進度打卡！' : 'Finished reading? Complete the AI quiz below to save your daily progress!'}
                            </div>
                            <button
                                className="btn w-full quiz-btn"
                                onClick={handleGenerateQuiz}
                                disabled={isGenerating || verses.length === 0}
                                style={{
                                    background: isGenerating || verses.length === 0 ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, var(--accent-primary), var(--brand-color))',
                                    color: isGenerating || verses.length === 0 ? 'var(--text-muted)' : 'white',
                                    border: 'none',
                                    opacity: verses.length === 0 ? 0.5 : 1
                                }}
                            >
                                {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                                <span>{isGenerating ? (language === 'zh_TW' ? '✨ AI 正在為您產生題目...' : '✨ AI is generating questions...') : t('finishReading')}</span>
                            </button>
                        </div>
                    ) : (
                        <div className="quiz-modal bg-bg-secondary p-5 rounded-xl border border-glass-border animate-fade-in-up mt-4">
                            <h4 className="text-lg font-semibold mb-2">{t('chapterStr', { num: chapter || 1 })} {t('recapQuiz')}</h4>
                            {!quizCompleted ? (
                                <>
                                    <p className="text-text-secondary text-sm mb-4">{t('quizDesc')}</p>
                                    <div className="quiz-question">
                                        <p className="question-text font-medium text-text-primary mb-3">{currentQuiz.question}</p>
                                        <div className="options mt-3 flex flex-col gap-2">
                                            {currentQuiz.options.map((opt: string, idx: number) => (
                                                <button
                                                    key={idx}
                                                    className={`w-full text-left p-3 rounded-md border transition-all duration-200 
                                                        ${selectedOption === idx
                                                            ? (idx === 0 ? 'bg-red-50 border-red-400 text-red-700' : 'bg-green-50 border-green-500 text-green-700')
                                                            : 'bg-bg-primary border-border-color hover:border-brand-color'}`}
                                                    onClick={() => setSelectedOption(idx)}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {selectedOption === 0 && (
                                        <div className="mt-4 p-3 bg-red-50/80 border border-red-200 rounded-md flex gap-2 items-start text-red-600 text-sm animate-fade-in-up">
                                            <XCircle size={18} className="shrink-0 mt-0.5" />
                                            <span>{currentQuiz.explanation}</span>
                                        </div>
                                    )}

                                    <button
                                        className="btn btn-primary w-full mt-5 font-bold tracking-wide"
                                        onClick={handleSubmitQuiz}
                                        disabled={selectedOption !== (currentQuiz.correctIndex !== undefined ? currentQuiz.correctIndex : 1)}
                                        style={{ opacity: selectedOption !== (currentQuiz.correctIndex !== undefined ? currentQuiz.correctIndex : 1) ? 0.5 : 1 }}
                                    >
                                        {language === 'zh_TW' ? '送出並打卡' : 'Submit & Save Progress'}
                                    </button>
                                </>
                            ) : (
                                <div className="quiz-feedback-section delay-100 animate-fade-in-up">
                                    <div className="flex items-center gap-2 mb-3 text-brand-color font-medium text-lg">
                                        <CheckCircle size={26} />
                                        <span>{language === 'zh_TW' ? '✅ 打卡成功！' : '✅ Progress Saved!'}</span>
                                    </div>
                                    <div className="ai-feedback-box p-4 bg-white/50 dark:bg-black/20 rounded-lg mb-4 border border-brand-color/30">
                                        <div className="flex items-center gap-2 mb-2 text-brand-color">
                                            <MessageCircle size={20} />
                                            <span className="font-semibold">{language === 'zh_TW' ? '✨ AI 解析：' : '✨ AI Feedback:'}</span>
                                        </div>
                                        <p className="text-text-secondary leading-relaxed text-sm">{currentQuiz.aiFeedback}</p>
                                    </div>
                                    <button className="btn btn-primary w-full mt-4" onClick={() => navigate('/')}>
                                        {t('submitReturn')}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="chapter-navigation mt-8 flex justify-between gap-4 delay-400 border-t border-glass-border pt-6">
                <button
                    className="btn btn-secondary flex-1 flex justify-center items-center gap-2"
                    onClick={() => {
                        window.scrollTo(0, 0);
                        navigate(`/read/${safeBookId}/${safeChapter - 1}`);
                    }}
                    disabled={!hasPrevChapter}
                    style={{ opacity: hasPrevChapter ? 1 : 0.5, cursor: hasPrevChapter ? 'pointer' : 'not-allowed' }}
                >
                    <ChevronLeft size={20} />
                    <span>{language === 'zh_TW' ? '上一章' : 'Previous'}</span>
                </button>
                <button
                    className="btn btn-secondary flex-1 flex justify-center items-center gap-2"
                    onClick={() => {
                        window.scrollTo(0, 0);
                        navigate(`/read/${safeBookId}/${safeChapter + 1}`);
                    }}
                    disabled={!hasNextChapter}
                    style={{ opacity: hasNextChapter ? 1 : 0.5, cursor: hasNextChapter ? 'pointer' : 'not-allowed' }}
                >
                    <span>{language === 'zh_TW' ? '下一章' : 'Next'}</span>
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
};

export default ReadingView;

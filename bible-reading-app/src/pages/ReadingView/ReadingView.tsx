import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { Sparkles, ArrowLeft, Loader2, CheckCircle, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { bibleBooks } from '../../constants/bibleBooks';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { saveUserProgress } from '../../services/progressService';
import { generateQuizFromAI, generateDeepDiveFromAI } from '../../services/aiService';
import type { QuizResult } from '../../services/aiService';
import './ReadingView.css';

interface Verse {
    number?: number;
    verse?: number;
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

    const [showDeepDive, setShowDeepDive] = useState(false);
    const [deepDiveText, setDeepDiveText] = useState<string | null>(null);
    const [isGeneratingDeepDive, setIsGeneratingDeepDive] = useState(false);

    const [showQuiz, setShowQuiz] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [quizData, setQuizData] = useState<QuizResult[] | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);

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

    const mockDeepDiveZh = "這段經文充滿了許多深刻的屬靈意義。它提醒我們，神的話語不僅是歷史的紀錄，更是要在我們現在的生活中產生功效的...";
    const mockDeepDiveEn = "This passage is full of profound spiritual meaning. It reminds us that God's word is not just a historical record, but meant to be active and alive in our lives today...";

    const currentDeepDiveText = deepDiveText || (language === 'zh_TW' ? mockDeepDiveZh : mockDeepDiveEn);

    const handleGenerateDeepDive = async () => {
        setIsGeneratingDeepDive(true);
        const apiKey = localStorage.getItem('ai_api_key');

        if (!apiKey) {
            alert(t('apiKeyWarning'));
            setIsGeneratingDeepDive(false);
            return;
        }

        const versesText = verses.map(v => `${v.number || v.verse} ${v.text}`).join('\n');
        const generated = await generateDeepDiveFromAI(versesText, language, apiKey);

        if (generated) {
            setDeepDiveText(generated);
            setShowDeepDive(true);
        } else {
        }
    };

    const handleGenerateQuiz = async () => {
        const apiKey = localStorage.getItem('ai_api_key');
        if (!apiKey) {
            alert(t('apiKeyWarning'));
            return;
        }

        setIsGenerating(true);
        setShowQuiz(true);
        const combinedText = verses.map(v => `${v.number || v.verse}: ${v.text}`).join('\n');

        try {
            const quiz = await generateQuizFromAI(combinedText, language, apiKey);
            if (quiz && Array.isArray(quiz) && quiz.length > 0) {
                setQuizData(quiz);
                setCurrentQuestionIndex(0);
                setScore(0);
                setQuizCompleted(false);
                setSelectedOption(null);
            } else {
                setShowQuiz(false);
                alert(t('apiErrorPleaseCheckKey'));
            }
        } catch (error) {
            setShowQuiz(false);
            alert(t('apiErrorPleaseCheckKey'));
        } finally {
            setIsGenerating(false);
        }
    };


    const handleSubmitQuiz = async () => {
        if (selectedOption === null || !quizData || quizData.length === 0) return;

        const currentQ = quizData[currentQuestionIndex];
        const isCorrect = selectedOption === currentQ.correctIndex;

        if (isCorrect) {
            setScore(prev => prev + 1);
        }

        // Always proceed to next after submitting (whether right or wrong) if there are more questions
        if (currentQuestionIndex < quizData.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedOption(null); // Reset option for next question
        } else {
            // Reached the end
            setQuizCompleted(true);
            if (user) {
                await saveUserProgress(user.uid, safeBookId, safeChapter);
            } else {
                alert(t('guestProgressWarning'));
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
                            <span className="verse-number">{verse.number || verse.verse}</span>
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
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <button
                            className="btn flex-1 quiz-btn"
                            onClick={handleGenerateDeepDive}
                            disabled={isGeneratingDeepDive || verses.length === 0}
                            style={{
                                background: isGeneratingDeepDive || verses.length === 0 ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, var(--accent-primary), var(--brand-color))',
                                color: isGeneratingDeepDive || verses.length === 0 ? 'var(--text-muted)' : 'white',
                                border: 'none',
                                opacity: verses.length === 0 ? 0.5 : 1
                            }}
                        >
                            {isGeneratingDeepDive ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                            <span>{isGeneratingDeepDive ? t('generatingContent') : t('deepenUnderstanding')}</span>
                        </button>

                        <button
                            className="btn flex-1 quiz-btn"
                            onClick={handleGenerateQuiz}
                            disabled={isGenerating || verses.length === 0}
                            style={{
                                background: isGenerating || verses.length === 0 ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                                color: isGenerating || verses.length === 0 ? 'var(--text-muted)' : 'var(--brand-color)',
                                border: '2px solid var(--brand-color)',
                                opacity: verses.length === 0 ? 0.5 : 1
                            }}
                        >
                            {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
                            <span>{isGenerating ? (language === 'zh_TW' ? '產生中...' : 'Generating...') : t('startQuiz')}</span>
                        </button>
                    </div>

                    {showDeepDive && (
                        <div className="deep-dive-modal bg-bg-secondary p-5 rounded-xl border border-glass-border animate-fade-in-up mt-4">
                            <div className="flex items-center gap-2 mb-3 text-brand-color">
                                <Sparkles size={20} />
                                <h4 className="text-lg font-semibold">{t('deepenUnderstanding')}</h4>
                            </div>
                            <div className="ai-feedback-box p-4 bg-white/50 dark:bg-black/20 rounded-lg border border-brand-color/30 text-text-secondary leading-relaxed text-sm whitespace-pre-wrap">
                                {currentDeepDiveText}
                            </div>
                        </div>
                    )}

                    {showQuiz && quizData && quizData.length > 0 && (
                        <div className="quiz-modal bg-bg-secondary p-5 rounded-xl border border-glass-border animate-fade-in-up mt-4">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-lg font-semibold">{t('chapterStr', { num: chapter || 1 })} {t('recapQuiz')}</h4>
                                {!quizCompleted && (
                                    <span className="text-sm font-medium text-brand-color bg-brand-color/10 px-2 py-1 rounded">
                                        {currentQuestionIndex + 1} / {quizData.length}
                                    </span>
                                )}
                            </div>

                            {!quizCompleted ? (
                                <>
                                    <div className="quiz-question">
                                        <p className="question-text font-medium text-text-primary mb-3">{quizData[currentQuestionIndex].question}</p>
                                        <div className="options mt-3 flex flex-col gap-2">
                                            {quizData[currentQuestionIndex].options.map((opt: string, idx: number) => (
                                                <button
                                                    key={idx}
                                                    className={`w-full text-left p-3 rounded-md border transition-all duration-200 
                                                        ${selectedOption === idx
                                                            ? 'bg-brand-color/10 border-brand-color text-brand-color'
                                                            : 'bg-bg-primary border-border-color hover:border-brand-color'}`}
                                                    onClick={() => setSelectedOption(idx)}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        className="btn btn-primary w-full mt-5 font-bold tracking-wide"
                                        onClick={handleSubmitQuiz}
                                        disabled={selectedOption === null}
                                        style={{ opacity: selectedOption === null ? 0.5 : 1 }}
                                    >
                                        {currentQuestionIndex < quizData.length - 1
                                            ? (language === 'zh_TW' ? '下一題' : 'Next Question')
                                            : (language === 'zh_TW' ? '送出並打卡' : 'Submit & Save Progress')}
                                    </button>
                                </>
                            ) : (
                                <div className="quiz-feedback-section delay-100 animate-fade-in-up">
                                    <div className="flex items-center gap-2 mb-3 text-brand-color font-medium text-lg">
                                        <CheckCircle size={26} />
                                        <span>{language === 'zh_TW' ? '✅ 測驗完成與打卡成功！' : '✅ Quiz Completed & Progress Saved!'}</span>
                                    </div>
                                    <div className="text-center my-4 font-semibold text-text-primary">
                                        {language === 'zh_TW' ? `您的總得分：${score} / ${quizData.length}` : `Your Score: ${score} / ${quizData.length}`}
                                    </div>
                                    <div className="ai-feedback-box p-4 bg-white/50 dark:bg-black/20 rounded-lg mb-4 border border-brand-color/30">
                                        <div className="flex items-center gap-2 mb-2 text-brand-color">
                                            <MessageCircle size={20} />
                                            <span className="font-semibold">{language === 'zh_TW' ? '✨ AI 總結回饋：' : '✨ AI Feedback:'}</span>
                                        </div>
                                        <p className="text-text-secondary leading-relaxed text-sm">{quizData[currentQuestionIndex].aiFeedback}</p>
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

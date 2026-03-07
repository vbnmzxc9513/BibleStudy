import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { Sparkles, ArrowLeft, Loader2, CheckCircle, MessageCircle, ChevronLeft, ChevronRight, XCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
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

    const [isAnswerChecked, setIsAnswerChecked] = useState(false);
    const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | null>(null);

    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState(false);

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

        try {
            const generated = await generateDeepDiveFromAI(versesText, language, apiKey);
            if (generated) {
                setDeepDiveText(generated);
                setShowDeepDive(true);
                setShowQuiz(false);
            }
        } catch (error: any) {
            alert(
                (language === 'zh_TW' ? '產生內容時發生錯誤：\n' : 'Error generating content:\n') +
                (error.message || 'Unknown error')
            );
        } finally {
            setIsGeneratingDeepDive(false);
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
        setShowDeepDive(false);
        const combinedText = verses.map(v => `${v.number || v.verse}: ${v.text}`).join('\n');

        try {
            const quiz = await generateQuizFromAI(combinedText, language, apiKey);
            if (quiz && Array.isArray(quiz) && quiz.length > 0) {
                setQuizData(quiz);
                setCurrentQuestionIndex(0);
                setScore(0);
                setQuizCompleted(false);
                setSelectedOption(null);
                setIsAnswerChecked(false);
                setIsAnswerCorrect(null);
            } else {
                setShowQuiz(false);
                alert(t('apiErrorPleaseCheckKey'));
            }
        } catch (error: any) {
            setShowQuiz(false);
            alert(
                (language === 'zh_TW' ? '產生測驗時發生錯誤：\n' : 'Error generating quiz:\n') +
                (error.message || t('apiErrorPleaseCheckKey'))
            );
        } finally {
            setIsGenerating(false);
        }
    };


    const handleCheckAnswer = () => {
        if (selectedOption === null || !quizData) return;

        const currentQ = quizData[currentQuestionIndex];
        const isCorrect = selectedOption === currentQ.correctIndex;
        setIsAnswerCorrect(isCorrect);
        setIsAnswerChecked(true);

        if (isCorrect) {
            setScore(prev => prev + 1);
        }
    };

    const handleNextQuestionOrRetry = async () => {
        if (!quizData) return;

        if (isAnswerCorrect === false) {
            setSelectedOption(null);
            setIsAnswerChecked(false);
            setIsAnswerCorrect(null);
            return;
        }

        if (currentQuestionIndex < quizData.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsAnswerChecked(false);
            setIsAnswerCorrect(null);
        } else {
            // Save progress FIRST, then show completion UI
            if (user && !user.isAnonymous) {
                setIsSaving(true);
                setSaveError(false);
                try {
                    await saveUserProgress(user.uid, safeBookId, safeChapter);
                    setQuizCompleted(true);
                } catch {
                    setSaveError(true);
                } finally {
                    setIsSaving(false);
                }
            } else {
                // Anonymous / unauthenticated users: progress not saved to Firebase
                setQuizCompleted(true);
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
                    <div className="quiz-trigger-buttons">
                        <button
                            className={`btn flex-1 premium-deep-dive-btn ${isGeneratingDeepDive || verses.length === 0 ? 'disabled-btn' : ''}`}
                            onClick={handleGenerateDeepDive}
                            disabled={isGeneratingDeepDive || verses.length === 0}
                        >
                            <div className="btn-content">
                                {isGeneratingDeepDive ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} className="icon-glow" />}
                                <span>{isGeneratingDeepDive ? t('generatingContent') : t('deepenUnderstanding')}</span>
                            </div>
                            <div className="btn-glow"></div>
                        </button>

                        <button
                            className={`btn flex-1 premium-quiz-btn ${isGenerating || verses.length === 0 ? 'disabled-btn' : ''}`}
                            onClick={handleGenerateQuiz}
                            disabled={isGenerating || verses.length === 0}
                        >
                            <div className="btn-content">
                                {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle size={20} />}
                                <span>{isGenerating ? (language === 'zh_TW' ? '產生中...' : 'Generating...') : t('startQuiz')}</span>
                            </div>
                        </button>
                    </div>

                    {showDeepDive && (
                        <div className="deep-dive-modal bg-bg-secondary p-5 rounded-xl border border-glass-border animate-fade-in-up mt-4">
                            <div className="flex items-center gap-2 mb-3 text-brand-color">
                                <Sparkles size={20} />
                                <h4 className="text-lg font-semibold">{t('deepenUnderstanding')}</h4>
                            </div>
                            <div className="ai-feedback-box p-4 bg-white/50 dark:bg-black/20 rounded-lg border border-brand-color/30 text-text-secondary leading-relaxed text-sm markdown-prose">
                                <ReactMarkdown>{currentDeepDiveText}</ReactMarkdown>
                            </div>
                        </div>
                    )}

                    {showQuiz && quizData && quizData.length > 0 && (
                        <div className="quiz-modal bg-bg-secondary p-5 rounded-xl border border-glass-border animate-fade-in-up mt-4">
                            <div className="quiz-header-section mb-4">
                                <h4 className="text-lg font-semibold">{t('chapterStr', { num: chapter || 1 })} {t('recapQuiz')}</h4>
                                {!quizCompleted && (
                                    <div className="quiz-progress-track">
                                        <div
                                            className="quiz-progress-fill"
                                            style={{ width: `${((currentQuestionIndex + 1) / quizData.length) * 100}%` }}
                                        ></div>
                                    </div>
                                )}
                            </div>

                            {!quizCompleted ? (
                                <>
                                    <div className="quiz-question">
                                        <p className="question-text font-medium text-text-primary mb-3">{quizData[currentQuestionIndex].question}</p>
                                        <div className="options mt-3 flex flex-col gap-3">
                                            {quizData[currentQuestionIndex].options.map((opt: string, idx: number) => {
                                                let btnClass = '';

                                                if (isAnswerChecked) {
                                                    if (idx === quizData[currentQuestionIndex].correctIndex) {
                                                        btnClass = 'quiz-option-correct';
                                                    } else if (idx === selectedOption && !isAnswerCorrect) {
                                                        btnClass = 'quiz-option-wrong';
                                                    } else {
                                                        btnClass = 'quiz-option-disabled';
                                                    }
                                                } else if (selectedOption === idx) {
                                                    btnClass = 'quiz-option-selected';
                                                }

                                                return (
                                                    <button
                                                        key={idx}
                                                        disabled={isAnswerChecked}
                                                        className={`quiz-option ${btnClass}`}
                                                        onClick={() => setSelectedOption(idx)}
                                                    >
                                                        <div className="radio-circle">
                                                            <div className="radio-dot"></div>
                                                        </div>
                                                        <span className="flex-1 leading-snug">{opt}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {isAnswerChecked && (
                                        <div className={`mt-5 p-5 rounded-xl border-2 animate-fade-in-up ${isAnswerCorrect ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200' : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-200'}`}>
                                            <div className="font-bold flex items-center gap-2 mb-2 text-lg">
                                                {isAnswerCorrect ? <CheckCircle className="text-emerald-500" size={24} /> : <XCircle className="text-rose-500" size={24} />}
                                                {isAnswerCorrect ? (language === 'zh_TW' ? '太棒了！答對了 🎉' : 'Excellent! Correct 🎉') : (language === 'zh_TW' ? '哎呀！答錯了 💡' : 'Oops! Incorrect 💡')}
                                            </div>
                                            <p className="text-sm md:text-base opacity-90 leading-relaxed">{quizData[currentQuestionIndex].explanation}</p>
                                        </div>
                                    )}

                                    {!isAnswerChecked ? (
                                        <button
                                            className={`btn w-full mt-6 font-bold tracking-wide py-4 text-lg rounded-xl transition-all duration-300 ${selectedOption !== null ? 'bg-brand-color text-white shadow-lg hover:shadow-xl hover:-translate-y-1' : 'bg-bg-tertiary text-text-muted cursor-not-allowed border-none'}`}
                                            onClick={handleCheckAnswer}
                                            disabled={selectedOption === null}
                                        >
                                            {language === 'zh_TW' ? '檢查答案' : 'Check Answer'}
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                className={`btn w-full mt-6 font-bold tracking-wide py-4 text-lg rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${isAnswerCorrect ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-none' : 'bg-amber-500 hover:bg-amber-400 text-white border-none'} ${isSaving ? 'opacity-70 cursor-wait' : ''}`}
                                                onClick={handleNextQuestionOrRetry}
                                                disabled={isSaving}
                                            >
                                                {isSaving
                                                    ? (language === 'zh_TW' ? '⏳ 儲存中...' : '⏳ Saving...')
                                                    : isAnswerCorrect === false
                                                        ? (language === 'zh_TW' ? '重新挑戰這題 🔄' : 'Try Again 🔄')
                                                        : (currentQuestionIndex < quizData.length - 1
                                                            ? (language === 'zh_TW' ? '繼續下一題 ➡️' : 'Next Question ➡️')
                                                            : (language === 'zh_TW' ? '🎉 完成並打卡 🎉' : '🎉 Complete & Save Progress 🎉'))}
                                            </button>
                                            {saveError && (
                                                <div className="mt-3 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-sm text-center">
                                                    {language === 'zh_TW' ? '❌ 打卡儲存失敗，請再試一次' : '❌ Failed to save progress, please try again'}
                                                </div>
                                            )}
                                        </>
                                    )}
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

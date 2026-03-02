import { useState, useEffect } from 'react';
import { Flame, Trophy, Play, BookOpen, Calendar as CalendarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { fetchUserProgress } from '../../services/progressService';
import type { ReadingProgress } from '../../services/progressService';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { subDays, format } from 'date-fns';
import { bibleBooks } from '../../constants/bibleBooks';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const { user } = useAuth();

    const [history, setHistory] = useState<ReadingProgress[]>([]);
    const [heatmapValues, setHeatmapValues] = useState<{ date: string, count: number }[]>([]);
    const [currentStreak, setCurrentStreak] = useState(0);

    useEffect(() => {
        const loadProgress = async () => {
            if (user) {
                const data = await fetchUserProgress(user.uid);
                setHistory(data);

                // Group history by date (YYYY-MM-DD) for the heatmap
                const dateCounts: { [key: string]: number } = {};
                data.forEach(pr => {
                    const dateStr = format(new Date(pr.completedAt), 'yyyy-MM-dd');
                    dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
                });

                const values = Object.keys(dateCounts).map(date => ({
                    date,
                    count: dateCounts[date]
                }));

                setHeatmapValues(values);
            } else {
                setHistory([]);
                setHeatmapValues([]);
            }
        };

        loadProgress();
    }, [user]);

    // Calculate streak from heatmap values
    useEffect(() => {
        if (heatmapValues.length === 0) {
            setCurrentStreak(0);
            return;
        }

        const sortedDates = [...heatmapValues].map(v => v.date).sort().reverse();

        let streak = 0;
        let cDate = new Date();
        cDate.setHours(0, 0, 0, 0);

        const firstDateStr = sortedDates[0];
        const firstDate = new Date(firstDateStr);
        firstDate.setHours(0, 0, 0, 0);

        const diffTime = Math.abs(cDate.getTime() - firstDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 1) {
            streak = 1;
            let expectedNextDate = new Date(firstDate);
            expectedNextDate.setDate(expectedNextDate.getDate() - 1);

            for (let i = 1; i < sortedDates.length; i++) {
                const nextDate = new Date(sortedDates[i]);
                nextDate.setHours(0, 0, 0, 0);

                if (nextDate.getTime() === expectedNextDate.getTime()) {
                    streak++;
                    expectedNextDate.setDate(expectedNextDate.getDate() - 1);
                } else if (nextDate.getTime() < expectedNextDate.getTime()) {
                    break;
                }
            }
        }

        setCurrentStreak(streak);
    }, [heatmapValues]);

    // Calculate dates for the heatmap (last 180 days)
    const today = new Date();
    const startDate = subDays(today, 180);

    const heatmapTitle = language === 'zh_TW' ? '閱讀足跡 (最近半年)' : 'Reading Footprint (Last 6 Months)';

    // Localization helpers for hardcoded Matthew data
    const matthewBook = bibleBooks.find(b => b.id === 'MAT');
    const matthewName = language === 'zh_TW' ? matthewBook?.cnName : matthewBook?.enName;
    const heroSubtitle = language === 'zh_TW' ? '耶穌基督的家譜' : 'The Genealogy of Jesus';

    return (
        <div className="dashboard-container pb-24 animate-fade-in-up">
            <header className="dashboard-header mb-6">
                <div>
                    <h1 className="greeting font-serif">{t('greeting')}</h1>
                    <p className="subtitle text-text-secondary">{t('subtitle')}</p>
                </div>
                <div className="streak-badge bg-brand-color/10 text-brand-color px-4 py-2 rounded-full flex items-center gap-2 border border-brand-color/20 shadow-sm">
                    <Flame size={20} className="flame-icon text-orange-500" />
                    <span className="streak-count font-bold">{currentStreak} {t('days')}</span>
                </div>
            </header>

            <div className="hero-card glass-card delay-100 mb-8 border border-glass-border">
                <div className="hero-content">
                    <div className="bg-bg-secondary p-3 rounded-full hidden sm:block">
                        <BookOpen size={40} className="text-brand-color" />
                    </div>
                    <div className="hero-text">
                        <h2 className="text-xl font-bold font-serif mb-1">{matthewName} - {t('chapterStr', { num: 1 })}</h2>
                        <p className="text-text-secondary text-sm">{heroSubtitle}</p>
                    </div>
                </div>
                <div className="hero-actions mt-4 sm:mt-0">
                    <button className="btn btn-primary w-full sm:w-auto px-6 py-2.5 shadow-md flex items-center justify-center gap-2" onClick={() => navigate('/read/MAT/1')}>
                        <Play size={18} fill="currentColor" />
                        <span className="font-medium">{t('resumeReading')}</span>
                    </button>
                </div>
            </div>

            {/* Heatmap Section */}
            <section className="heatmap-section delay-150 mb-8">
                <div className="section-title flex items-center gap-2 mb-4">
                    <CalendarIcon size={20} className="text-brand-color" />
                    <h3 className="font-semibold">{heatmapTitle}</h3>
                </div>
                <div className="glass-card p-4 overflow-x-auto custom-scrollbar border border-glass-border">
                    <div className="min-w-[600px]">
                        <CalendarHeatmap
                            startDate={startDate}
                            endDate={today}
                            values={heatmapValues}
                            classForValue={(value: { count: number } | undefined) => {
                                if (!value) {
                                    return 'color-empty';
                                }
                                return `color-scale-${Math.min(value.count, 4)}`;
                            }}
                            tooltipDataAttrs={((value: { date: string, count: number }) => {
                                return {
                                    'data-tooltip': value && value.date ? `${value.date}: ${value.count} chapters` : 'No reading on this day',
                                };
                            }) as any}
                            showWeekdayLabels={true}
                        />
                    </div>
                </div>
            </section>

            <section className="progress-section delay-200">
                <div className="section-title flex items-center gap-2 mb-4">
                    <Trophy size={20} className="icon-gold text-yellow-500" />
                    <h3 className="font-semibold">{t('yourProgress')}</h3>
                </div>

                <div className="progress-grid grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="progress-card glass-card border border-glass-border">
                        <div className="progress-card-header flex justify-between mb-2">
                            <h4 className="font-medium">{t('newTestament')}</h4>
                            <span className="percentage text-brand-color font-bold">{(history.length / 260 * 100).toFixed(1)}%</span>
                        </div>
                        <div className="progress-container bg-bg-secondary h-2.5 rounded-full overflow-hidden mb-2">
                            <div className="progress-bar bg-gradient-brand h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min((history.length / 260 * 100), 100)}%` }}></div>
                        </div>
                        <p className="progress-detail text-xs text-text-muted text-right">{history.length} / 260 {t('chapters')}</p>
                    </div>

                    <div className="progress-card glass-card border border-glass-border">
                        <div className="progress-card-header flex justify-between mb-2">
                            <h4 className="font-medium">{matthewName}</h4>
                            <span className="percentage text-brand-color font-bold">{(history.filter((h: ReadingProgress) => h.bookId === 'MAT').length / 28 * 100).toFixed(1)}%</span>
                        </div>
                        <div className="progress-container bg-bg-secondary h-2.5 rounded-full overflow-hidden mb-2">
                            <div className="progress-bar bg-gradient-brand h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min((history.filter((h: ReadingProgress) => h.bookId === 'MAT').length / 28 * 100), 100)}%` }}></div>
                        </div>
                        <p className="progress-detail text-xs text-text-muted text-right">{history.filter((h: ReadingProgress) => h.bookId === 'MAT').length} / 28 {t('chapters')}</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Dashboard;

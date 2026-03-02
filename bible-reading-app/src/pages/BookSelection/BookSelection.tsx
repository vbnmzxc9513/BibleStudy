import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, ChevronRight, Search } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import './BookSelection.css';

import { bibleBooks } from '../../constants/bibleBooks';

const BookSelection = () => {
    const [testament, setTestament] = useState<'OT' | 'NT'>('NT');
    const [expandedBook, setExpandedBook] = useState<string | null>(null);
    const navigate = useNavigate();
    const { t, language } = useLanguage();

    const handleBookClick = (bookId: string) => {
        setExpandedBook(expandedBook === bookId ? null : bookId);
    };

    const handleChapterClick = (bookId: string, chapter: number) => {
        navigate(`/read/${bookId}/${chapter}`);
    };

    return (
        <div className="book-selection-container animate-fade-in-up">
            <header className="page-header">
                <h2>{t('selectBook')}</h2>
                <div className="search-bar">
                    <Search size={20} className="text-muted" />
                    <input type="text" placeholder={t('searchPlaceholder')} className="search-input" />
                </div>
            </header>

            <div className="testament-tabs">
                <button
                    className={`tab-btn ${testament === 'OT' ? 'active' : ''}`}
                    onClick={() => setTestament('OT')}
                >
                    {t('oldTestament')}
                </button>
                <button
                    className={`tab-btn ${testament === 'NT' ? 'active' : ''}`}
                    onClick={() => setTestament('NT')}
                >
                    {t('newTestament')}
                </button>
            </div>

            <div className="book-list">
                {bibleBooks.filter(book => book.testament === testament).map((book, index) => (
                    <div key={book.id} className="book-card glass-card" style={{ animationDelay: `${(index % 10) * 50}ms` }}>
                        <div
                            className="book-card-header"
                            onClick={() => handleBookClick(book.id)}
                        >
                            <div className="book-info">
                                <Book className="book-icon" size={24} />
                                <span className="book-name">
                                    {language === 'zh_TW' ? book.cnName : book.enName}
                                </span>
                            </div>
                            <ChevronRight
                                className={`chevron-icon ${expandedBook === book.id ? 'rotated' : ''}`}
                                size={20}
                            />
                        </div>

                        {expandedBook === book.id && (
                            <div className="chapter-grid animate-fade-in-up">
                                {Array.from({ length: book.chapters }, (_, i) => i + 1).map(chapter => (
                                    <button
                                        key={chapter}
                                        className="chapter-btn"
                                        onClick={() => handleChapterClick(book.id, chapter)}
                                    >
                                        {chapter}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BookSelection;

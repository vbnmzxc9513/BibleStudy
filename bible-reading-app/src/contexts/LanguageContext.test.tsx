import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageProvider, useLanguage } from './LanguageContext';

const TestComponent = () => {
    const { language, toggleLanguage, t } = useLanguage();

    return (
        <div>
            <div data-testid="current-lang">{language}</div>
            <div data-testid="translated-home">{t('home')}</div>
            <div data-testid="translated-param">{t('chapterStr', { num: 5 })}</div>
            <button onClick={toggleLanguage} data-testid="toggle-btn">Toggle</button>
        </div>
    );
};

describe('LanguageContext', () => {
    it('provides default language zh_TW', () => {
        render(
            <LanguageProvider>
                <TestComponent />
            </LanguageProvider>
        );
        expect(screen.getByTestId('current-lang')).toHaveTextContent('zh_TW');
        expect(screen.getByTestId('translated-home')).toHaveTextContent('首頁');
        expect(screen.getByTestId('translated-param')).toHaveTextContent('第 5 章');
    });

    it('toggles language to en', () => {
        render(
            <LanguageProvider>
                <TestComponent />
            </LanguageProvider>
        );

        const toggleBtn = screen.getByTestId('toggle-btn');
        fireEvent.click(toggleBtn);

        expect(screen.getByTestId('current-lang')).toHaveTextContent('en');
        expect(screen.getByTestId('translated-home')).toHaveTextContent('Home');
        expect(screen.getByTestId('translated-param')).toHaveTextContent('Chapter 5');
    });
});

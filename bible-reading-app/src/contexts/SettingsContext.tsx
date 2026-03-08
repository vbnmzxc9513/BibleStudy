import { createContext, useState, useContext, useEffect, type ReactNode } from 'react';

type FontSize = '1' | '2' | '3' | '4' | '5';

interface SettingsContextType {
    fontSize: FontSize;
    setFontSize: (size: FontSize) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
    // Initialize from localStorage or default to '3' (medium)
    const [fontSize, setFontSizeState] = useState<FontSize>(() => {
        const saved = localStorage.getItem('app_font_size');
        // Handle migration from old 'small/medium/large'
        if (saved === 'small') return '2';
        if (saved === 'medium') return '3';
        if (saved === 'large') return '4';
        return (saved as FontSize) || '3';
    });

    const setFontSize = (size: FontSize) => {
        setFontSizeState(size);
        localStorage.setItem('app_font_size', size);
    };

    // Apply the class to body whenever it changes
    useEffect(() => {
        document.body.classList.remove('theme-font-1', 'theme-font-2', 'theme-font-3', 'theme-font-4', 'theme-font-5', 'theme-font-small', 'theme-font-medium', 'theme-font-large');
        document.body.classList.add(`theme-font-${fontSize}`);
    }, [fontSize]);

    return (
        <SettingsContext.Provider value={{ fontSize, setFontSize }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

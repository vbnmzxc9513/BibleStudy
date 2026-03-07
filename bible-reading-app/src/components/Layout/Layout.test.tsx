import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from './Layout';
import { LanguageProvider } from '../../contexts/LanguageContext';

vi.mock('../AISettingsModal/AISettingsModal', () => ({
    default: ({ isOpen, onClose }: any) => isOpen ? <div data-testid="settings-modal"><button onClick={onClose}>Close</button></div> : null
}));

describe('Layout', () => {
    it('renders navigation items and toggles language', () => {
        render(
            <MemoryRouter>
                <LanguageProvider>
                    <Layout />
                </LanguageProvider>
            </MemoryRouter>
        );

        // Initial language is zh_TW
        expect(screen.getAllByText('首頁').length).toBeGreaterThan(0);

        // Find language toggle button
        const desktopToggleBtn = screen.getByTitle('Switch Language');
        fireEvent.click(desktopToggleBtn); // Desktop toggle

        // Language should be en
        expect(screen.getAllByText('Home').length).toBeGreaterThan(0);
    });

    it('opens AI settings modal', () => {
        render(
            <MemoryRouter>
                <LanguageProvider>
                    <Layout />
                </LanguageProvider>
            </MemoryRouter>
        );

        // Language default is zh_TW => 'AI 設定'
        const settingsBtns = screen.getAllByText('AI 設定');
        fireEvent.click(settingsBtns[0]);

        expect(screen.getByTestId('settings-modal')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Close'));
        expect(screen.queryByTestId('settings-modal')).not.toBeInTheDocument();
    });
});

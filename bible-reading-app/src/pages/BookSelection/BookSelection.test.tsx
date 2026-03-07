import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BookSelection from './BookSelection';
import { LanguageProvider } from '../../contexts/LanguageContext';

// mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('BookSelection', () => {
    it('renders testament tabs and switches them', () => {
        render(
            <MemoryRouter>
                <LanguageProvider>
                    <BookSelection />
                </LanguageProvider>
            </MemoryRouter>
        );

        // Initial should be New Testament (NT)
        expect(screen.getByText('馬太福音')).toBeInTheDocument();
        // Switch to Old Testament
        fireEvent.click(screen.getByText('舊約'));
        expect(screen.getByText('創世記')).toBeInTheDocument();
        expect(screen.queryByText('馬太福音')).not.toBeInTheDocument();
    });

    it('expands book to show chapters and navigates on click', () => {
        render(
            <MemoryRouter>
                <LanguageProvider>
                    <BookSelection />
                </LanguageProvider>
            </MemoryRouter>
        );

        // Find Matthew in NT
        const matthew = screen.getByText('馬太福音');
        fireEvent.click(matthew);

        // Should show chapters
        // Matthew has 28 chapters, we use a custom matcher because there might be other '1's
        // Or we just find all buttons with text '1' 
        const chapter1 = screen.getAllByRole('button', { name: '1' })[0];
        expect(chapter1).toBeInTheDocument();

        // Click chapter 1
        fireEvent.click(chapter1);
        expect(mockNavigate).toHaveBeenCalledWith('/read/MAT/1');
    });
});

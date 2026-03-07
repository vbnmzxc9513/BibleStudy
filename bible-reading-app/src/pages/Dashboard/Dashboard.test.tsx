import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard';
import { LanguageProvider } from '../../contexts/LanguageContext';
import * as AuthContext from '../../contexts/AuthContext';
import * as ProgressService from '../../services/progressService';

// Mock react-calendar-heatmap to prevent issues with jsdom throwing on SVG or complex components
vi.mock('react-calendar-heatmap', () => ({
    default: () => <div data-testid="calendar-heatmap" />
}));

vi.mock('../../services/progressService', () => ({
    fetchUserProgress: vi.fn(),
}));

describe('Dashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders greeting for guest user without progress', async () => {
        vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ user: null, loading: false } as any);
        vi.mocked(ProgressService.fetchUserProgress).mockResolvedValue([]);

        render(
            <MemoryRouter>
                <LanguageProvider>
                    <Dashboard />
                </LanguageProvider>
            </MemoryRouter>
        );

        expect(screen.getByText('早安，閱讀者 ✨')).toBeInTheDocument();
        expect(screen.getByText('0 天')).toBeInTheDocument();
    });

    it('fetches and displays progress for logged in user', async () => {
        vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
            user: { uid: 'user123', email: 'doc@medical.org', isAnonymous: false } as any,
            loading: false
        });

        // Mock some progress data
        const mockProgress = [
            { id: '1', bookId: 'MAT', chapter: 1, completedAt: Date.now(), userId: 'user123' },
            { id: '2', bookId: 'GEN', chapter: 1, completedAt: Date.now(), userId: 'user123' }
        ];

        vi.mocked(ProgressService.fetchUserProgress).mockResolvedValue(mockProgress);

        render(
            <MemoryRouter>
                <LanguageProvider>
                    <Dashboard />
                </LanguageProvider>
            </MemoryRouter>
        );

        // Wait for progress to be fetched and set
        await waitFor(() => {
            expect(ProgressService.fetchUserProgress).toHaveBeenCalledWith('user123');
        });

        // OT has 929 chapters, NT has 260 chapters
        await waitFor(() => {
            // Check if OT and NT correctly parsed 1 chapter each
            expect(screen.getByText('1 / 929 章')).toBeInTheDocument();
            expect(screen.getByText('1 / 260 章')).toBeInTheDocument();
        });

        // Streak calculation should identify today as 1 day
        await waitFor(() => {
            expect(screen.getByText('1 天')).toBeInTheDocument();
        });
    });
});

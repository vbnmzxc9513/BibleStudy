import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { onAuthStateChanged } from 'firebase/auth';
import { handlePostLoginRedirect } from '../firebase';

vi.mock('firebase/auth', () => ({
    onAuthStateChanged: vi.fn(),
    getAuth: vi.fn(),
}));

vi.mock('../firebase', () => ({
    auth: {},
    handlePostLoginRedirect: vi.fn(),
}));

const TestComponent = () => {
    const { user, loading } = useAuth();
    if (loading) return <div data-testid="loading">Loading...</div>;
    return <div data-testid="user">{user ? user.email : 'No user'}</div>;
};

describe('AuthContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(handlePostLoginRedirect).mockResolvedValue(null);
    });

    it('shows loading initially', () => {
        vi.mocked(onAuthStateChanged).mockImplementation((_auth, _callback) => {
            return () => { }; // return mock unsubscribe
        });

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );
        expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('sets user to null if unauthenticated', () => {
        vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
            // @ts-ignore
            callback(null);
            return () => { };
        });

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
        expect(screen.getByTestId('user')).toHaveTextContent('No user');
    });

    it('sets valid user if authenticated and not anonymous', () => {
        const mockUser = { isAnonymous: false, email: 'test@doctor.com' };
        vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
            // @ts-ignore
            callback(mockUser);
            return () => { };
        });

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
        expect(screen.getByTestId('user')).toHaveTextContent('test@doctor.com');
    });

    it('sets user to null if signin is anonymous', () => {
        const mockUser = { isAnonymous: true };
        vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
            // @ts-ignore
            callback(mockUser);
            return () => { };
        });

        render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
        expect(screen.getByTestId('user')).toHaveTextContent('No user');
    });
});

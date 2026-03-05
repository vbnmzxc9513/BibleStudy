import { createContext, useState, useEffect, useContext, useRef } from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, loginAnonymously, getRedirectResult } from '../firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const isInitializing = useRef(false);

    useEffect(() => {
        // On app load, check if we're returning from a Google redirect login
        getRedirectResult(auth).then((result) => {
            if (result?.user) {
                // User just logged in via redirect — onAuthStateChanged will also fire,
                // but this ensures we can log the result or handle link errors here.
                console.log("Google redirect login successful:", result.user.email);
            }
        }).catch((error) => {
            // Handle link errors: if this Google account already exists as a separate
            // Firebase account, just sign in normally with redirect.
            if (error.code === 'auth/credential-already-in-use' || error.code === 'auth/email-already-in-use') {
                console.warn("Account already exists, credential conflict handled by redirect.");
            } else {
                console.error("Redirect result error:", error);
            }
        });

        const unsubscribe = onAuthStateChanged(auth, async (currentUser: User | null) => {
            if (currentUser) {
                // User is signed in
                setUser(currentUser);
                setLoading(false);
            } else if (!isInitializing.current) {
                // User is not signed in and we haven't started initializing yet
                isInitializing.current = true;
                console.log("No user found. Triggering lazy login...");
                try {
                    const newAnonUser = await loginAnonymously();
                    if (newAnonUser) {
                        setUser(newAnonUser);
                    }
                } finally {
                    setLoading(false);
                    // note: we do not reset isInitializing.current to false here on purpose
                    // so it doesn't infinite loop if the login fails or redirects momentarily.
                }
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

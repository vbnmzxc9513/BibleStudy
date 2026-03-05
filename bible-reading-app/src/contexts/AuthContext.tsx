import { createContext, useState, useEffect, useContext, useRef } from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, loginAnonymously } from '../firebase';

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

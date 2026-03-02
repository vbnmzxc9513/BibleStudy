import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, GoogleAuthProvider, signInWithPopup, linkWithPopup } from 'firebase/auth';
import type { User } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyBQMLMPSMuFBLBTsNAGB1f2zQPkgMGDfdc",
    authDomain: "biblereadingapp-872fd.firebaseapp.com",
    projectId: "biblereadingapp-872fd",
    storageBucket: "biblereadingapp-872fd.firebasestorage.app",
    messagingSenderId: "1073048920830",
    appId: "1:1073048920830:web:e6b022fef6be33ed23bbaf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services and export them when ready to use
export const db = getFirestore(app);
export const auth = getAuth(app);

// Lazy Login Helper
export const loginAnonymously = async () => {
    try {
        const userCredential = await signInAnonymously(auth);
        return userCredential.user;
    } catch (error) {
        console.error("Error signing in anonymously:", error);
        return null;
    }
};

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async (currentUser: User | null) => {
    try {
        if (currentUser && currentUser.isAnonymous) {
            // Try linking the anonymous account to Google to save progress
            const result = await linkWithPopup(currentUser, googleProvider);
            return result.user;
        } else {
            // Fallback to normal sign in
            const result = await signInWithPopup(auth, googleProvider);
            return result.user;
        }
    } catch (error: any) {
        if (error.code === 'auth/credential-already-in-use') {
            // The Google account is already linked to another Firebase account.
            // We just sign them in to that existing account.
            const result = await signInWithPopup(auth, googleProvider);
            return result.user;
        }
        console.error("Error signing in with Google:", error);
        throw error;
    }
};

export default app;

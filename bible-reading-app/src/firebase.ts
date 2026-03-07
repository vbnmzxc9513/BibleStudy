import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
} from 'firebase/auth';

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

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Login with Google: tries popup first, falls back to redirect if blocked.
export const loginWithGoogle = async () => {
    try {
        await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
        if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
            console.warn('Popup blocked, falling back to redirect...');
            await signInWithRedirect(auth, googleProvider);
        } else {
            throw error;
        }
    }
};

// Called on app load to complete redirect-based login (fallback case).
export const handlePostLoginRedirect = async () => {
    try {
        const result = await getRedirectResult(auth);
        return result?.user ?? null;
    } catch (error: any) {
        console.error("Redirect result error:", error);
        return null;
    }
};

export default app;

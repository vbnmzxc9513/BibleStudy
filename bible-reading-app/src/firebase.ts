import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
    getAuth,
    signInAnonymously,
    GoogleAuthProvider,
    signInWithPopup,
    linkWithPopup,
} from 'firebase/auth';
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

// Initiates the Google login popup flow.
export const loginWithGoogle = async (currentUser: User | null) => {
    if (currentUser && currentUser.isAnonymous) {
        // Link the anonymous account to Google to preserve their progress
        await linkWithPopup(currentUser, googleProvider);
    } else {
        await signInWithPopup(auth, googleProvider);
    }
    // This function now uses a popup; it updates the auth state and closes.
};

export default app;

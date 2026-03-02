import { db } from '../firebase';
import { doc, setDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';

export interface ReadingProgress {
    bookId: string;
    chapter: number;
    completedAt: number; // Timestamp
}

/**
 * Saves the user's completed chapter to Firestore.
 */
export const saveUserProgress = async (uid: string, bookId: string, chapter: number) => {
    if (!uid) return;

    // Create a document ID like "GEN_1"
    const docId = `${bookId}_${chapter}`;
    const progressRef = doc(db, 'users', uid, 'history', docId);

    try {
        await setDoc(progressRef, {
            bookId,
            chapter,
            completedAt: Date.now()
        }, { merge: true });
        console.log(`Progress saved for ${docId}`);
    } catch (error) {
        console.error("Error saving progress to Firebase:", error);
    }
};

/**
 * Fetches the user's complete reading history from Firestore.
 */
export const fetchUserProgress = async (uid: string): Promise<ReadingProgress[]> => {
    if (!uid) return [];

    try {
        const historyRef = collection(db, 'users', uid, 'history');
        const q = query(historyRef, orderBy('completedAt', 'desc'));
        const querySnapshot = await getDocs(q);

        const history: ReadingProgress[] = [];
        querySnapshot.forEach((doc) => {
            history.push(doc.data() as ReadingProgress);
        });

        return history;
    } catch (error) {
        console.error("Error fetching progress from Firebase:", error);
        return [];
    }
};

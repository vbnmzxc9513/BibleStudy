const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin (Needs a Service Account Key)
// The user needs to generate this from Firebase Console: Project Settings -> Service Accounts -> Generate new private key
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
    console.error("CRITICAL ERROR: serviceAccountKey.json not found!");
    console.error("Please download it from Firebase Console -> Project Settings -> Service Accounts -> Generate new private key.");
    console.error("Place it in the 'scraper' directory as 'serviceAccountKey.json'.");
    process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const DATA_FILE = path.join(__dirname, 'data', 'taiwanbible_full.json');

const ID_MAP = {
    "JUG": "JDG",
    "PSM": "PSA",
    "SON": "SNG",
    "EZE": "EZK",
    "JOE": "JOL",
    "NAH": "NAM",
    "MAK": "MRK",
    "MAR": "MRK",
    "1TS": "1TH",
    "2TS": "2TH",
    "MON": "PHM",
    "PHL": "PHP"
};

async function uploadToFirestore() {
    if (!fs.existsSync(DATA_FILE)) {
        console.error(`Data file not found at ${DATA_FILE}. Please run fetchBibleJson.js first.`);
        return;
    }

    const bibleData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    console.log(`Loaded ${bibleData.length} books for upload.`);

    let batch = db.batch();
    let count = 0;
    let totalUploaded = 0;

    for (const book of bibleData) {
        // Map the book ID if it's in our mismatch list
        const bookId = ID_MAP[book.book_id] || book.book_id;

        for (const chapter of book.chapters) {
            // Document ID format: GEN_1
            const docId = `${bookId}_${chapter.chapter}`;
            const docRef = db.collection('bible_books').doc(docId);

            batch.set(docRef, {
                bookId: bookId,
                chapter: chapter.chapter,
                verses: chapter.verses
            });
            count++;

            // Firestore batch limit is 500 operations
            if (count === 400) {
                await batch.commit();
                totalUploaded += count;
                console.log(`Committed batch of 400. Total uploaded: ${totalUploaded}`);
                batch = db.batch(); // Create a new batch
                count = 0;
            }
        }
    }

    // Commit any remaining documents
    if (count > 0) {
        await batch.commit();
        totalUploaded += count;
        console.log(`Committed final batch of ${count}. Total uploaded: ${totalUploaded}`);
    }

    console.log("Upload completed successfully! The Bible data is now live on Firestore.");
}

uploadToFirestore();

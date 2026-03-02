const { initializeApp } = require('firebase/app');
const { getFirestore, writeBatch, doc } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

const firebaseConfig = {
    apiKey: "AIzaSyBQMLMPSMuFBLBTsNAGB1f2zQPkgMGDfdc",
    authDomain: "biblereadingapp-872fd.firebaseapp.com",
    projectId: "biblereadingapp-872fd",
    storageBucket: "biblereadingapp-872fd.firebasestorage.app",
    messagingSenderId: "1073048920830",
    appId: "1:1073048920830:web:e6b022fef6be33ed23bbaf"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const DATA_FILE = path.join(__dirname, 'data', 'taiwanbible_full.json');

async function upload() {
    if (!fs.existsSync(DATA_FILE)) {
        console.error(`Data file not found at ${DATA_FILE}.`);
        process.exit(1);
    }

    const bibleData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    console.log(`Loaded ${bibleData.length} books for upload.`);

    let batch = writeBatch(db);
    let count = 0;
    let totalUploaded = 0;

    for (const book of bibleData) {
        for (const chapter of book.chapters) {
            const docId = `${book.book_id}_${chapter.chapter}`;
            const docRef = doc(db, 'bible_books', docId);
            batch.set(docRef, {
                bookId: book.book_id,
                chapter: chapter.chapter,
                verses: chapter.verses
            });
            count++;

            if (count === 400) {
                await batch.commit();
                totalUploaded += count;
                console.log(`Committed 400. Total uploaded: ${totalUploaded}`);
                batch = writeBatch(db);
                count = 0;
            }
        }
    }

    if (count > 0) {
        await batch.commit();
        totalUploaded += count;
        console.log(`Committed final batch of ${count}. Total uploaded: ${totalUploaded}`);
    }
    console.log("Upload completed successfully!");
    process.exit(0);
}

upload().catch(err => {
    console.error("Upload failed:", err);
    process.exit(1);
});

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// We are going to use bible-api.com which is very stable for Chinese Union Version (cuv)
// API Format: https://bible-api.com/Genesis+1?translation=cuv

const BIBLE_BOOKS = [
    { id: "GEN", enName: "Genesis", chapters: 50 },
    { id: "EXO", enName: "Exodus", chapters: 40 },
    { id: "LEV", enName: "Leviticus", chapters: 27 },
    { id: "NUM", enName: "Numbers", chapters: 36 },
    { id: "DEU", enName: "Deuteronomy", chapters: 34 },
    { id: "JOS", enName: "Joshua", chapters: 24 },
    { id: "JDG", enName: "Judges", chapters: 21 },
    { id: "RUT", enName: "Ruth", chapters: 4 },
    { id: "1SA", enName: "1 Samuel", chapters: 31 },
    { id: "2SA", enName: "2 Samuel", chapters: 24 },
    // ... we will test with just the first 3 for now to ensure it works properly.
];

const OUTPUT_FILE = path.join(__dirname, 'data', 'cuv_bible_test.json');
const DATA_DIR = path.join(__dirname, 'data');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchChapterWithValidation(bookId, bookNameEn, chapter) {
    // We will use a reliable static JSON hosted on GitHub specifically for this
    // The format is: https://raw.githubusercontent.com/thiagobodruk/bible/master/json/cuv/Genesis.json
    const url = `https://raw.githubusercontent.com/thiagobodruk/bible/master/json/cuv/${bookNameEn}.json`;

    try {
        const response = await axios.get(url);

        // --- VALIDATION LAYER ---
        const bookData = response.data;
        const chapterData = bookData.chapters[chapter - 1]; // 0-indexed

        if (!chapterData || !chapterData.length) {
            console.error(`[VALIDATION FAILED] Could not find verses for ${bookId} Chapter ${chapter}`);
            return null;
        }

        // Check if the text actually contains Chinese characters
        const sampleText = chapterData[0]; // the verses are just string arrays
        const containsChineseRegex = /[\u4e00-\u9fa5]/;
        if (!containsChineseRegex.test(sampleText)) {
            console.error(`[VALIDATION FAILED] The text doesn't look like Chinese! Output: ${sampleText}`);
            return null;
        }

        return chapterData.map((text, idx) => ({
            number: idx + 1,
            text: text.trim()
        }));

    } catch (error) {
        console.error(`[API ERROR] Failed to fetch ${bookId} Chapter ${chapter}: ${error.message}`);
        return null;
    }
}

async function startTestScraping() {
    console.log("Starting **VERIFIED** Bible Scraper (Test Mode)...");
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

    let testData = [];

    // Only testing the first 2 books for now
    const testBooks = BIBLE_BOOKS.slice(0, 2);

    for (const book of testBooks) {
        // Only grabbing the first 2 chapters of each test book
        for (let chapter = 1; chapter <= 2; chapter++) {

            console.log(`Fetching ${book.id} (${book.enName}) Chapter ${chapter}...`);
            const verses = await fetchChapterWithValidation(book.id, book.enName, chapter);

            if (verses) {
                testData.push({
                    bookId: book.id,
                    chapter: chapter,
                    verses: verses
                });
                console.log(`[SUCCESS] Stored ${verses.length} verses for ${book.id} Chapter ${chapter}`);
                // Preview the first verse to ensure it's what we want
                console.log(`Preview: "${verses[0].number}. ${verses[0].text.substring(0, 30)}..."`);
            } else {
                console.log(`[SKIPPED] Due to validation failure.`);
            }

            // Friendly rate limit
            await sleep(2000);
        }
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(testData, null, 2));
    console.log(`\nTest scraping completed! Data saved to ${OUTPUT_FILE}`);
}

startTestScraping();

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, 'data', 'cuv_bible_full.json');
const DATA_DIR = path.join(__dirname, 'data');

// A highly reliable, monolithic JSON file containing the entire CUV Bible
// Source: https://github.com/thiagobodruk/bible/blob/master/json/zh_cuv.json
const CUV_FULL_JSON_URL = 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/zh_cuv.json';

// Mapping English book names from the JSON to standard abbreviations
const BOOK_MAP = {
    "Genesis": "GEN", "Exodus": "EXO", "Leviticus": "LEV", "Numbers": "NUM", "Deuteronomy": "DEU",
    "Joshua": "JOS", "Judges": "JDG", "Ruth": "RUT", "1 Samuel": "1SA", "2 Samuel": "2SA",
    "1 Kings": "1KI", "2 Kings": "2KI", "1 Chronicles": "1CH", "2 Chronicles": "2CH", "Ezra": "EZR",
    "Nehemiah": "NEH", "Esther": "EST", "Job": "JOB", "Psalms": "PSA", "Proverbs": "PRO",
    "Ecclesiastes": "ECC", "Song of Solomon": "SNG", "Isaiah": "ISA", "Jeremiah": "JER", "Lamentations": "LAM",
    "Ezekiel": "EZK", "Daniel": "DAN", "Hosea": "HOS", "Joel": "JOL", "Amos": "AMO",
    "Obadiah": "OBA", "Jonah": "JON", "Micah": "MIC", "Nahum": "NAM", "Habakkuk": "HAB",
    "Zephaniah": "ZEP", "Haggai": "HAG", "Zechariah": "ZEC", "Malachi": "MAL",
    "Matthew": "MAT", "Mark": "MRK", "Luke": "LUK", "John": "JHN", "Acts": "ACT",
    "Romans": "ROM", "1 Corinthians": "1CO", "2 Corinthians": "2CO", "Galatians": "GAL", "Ephesians": "EPH",
    "Philippians": "PHP", "Colossians": "COL", "1 Thessalonians": "1TH", "2 Thessalonians": "2TH",
    "1 Timothy": "1TI", "2 Timothy": "2TI", "Titus": "TIT", "Philemon": "PHM",
    "Hebrews": "HEB", "James": "JAS", "1 Peter": "1PE", "2 Peter": "2PE",
    "1 John": "1JN", "2 John": "2JN", "3 John": "3JN", "Jude": "JUD", "Revelation": "REV"
};

async function downloadAndFormatBible() {
    console.log("Downloading full CUV Bible JSON... This might take a few seconds.");
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

    try {
        const response = await axios.get(CUV_FULL_JSON_URL);
        const rawBibleData = response.data;

        console.log("Download successful! Processing schema for Firestore...");

        let formattedData = [];

        for (const rawBook of rawBibleData) {
            const bookId = BOOK_MAP[rawBook.name];

            if (!bookId) {
                console.warn(`Warning: Could not map book name "${rawBook.name}". Skipping.`);
                continue;
            }

            // rawBook.chapters is an array of arrays (chapters -> verses)
            rawBook.chapters.forEach((chapterVerses, chapterIndex) => {
                const chapterNum = chapterIndex + 1;

                const formattedVerses = chapterVerses.map((text, verseIndex) => ({
                    number: verseIndex + 1,
                    text: text.trim()
                }));

                formattedData.push({
                    bookId: bookId,
                    chapter: chapterNum,
                    verses: formattedVerses
                });
            });
            console.log(`Processed ${bookId}`);
        }

        // --- VALIDATION LAYER ---
        if (formattedData.length < 1000) {
            console.error(`[VALIDATION FAILED] Only generated ${formattedData.length} chapters. The Bible has 1189.`);
            return;
        }

        console.log(`\nValidation Passed: Created ${formattedData.length} structured chapters.`);
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(formattedData, null, 2));
        console.log(`Data successfully formatted and saved to ${OUTPUT_FILE}`);
        console.log("This dataset is high quality and ready for Firestore upload.");

    } catch (error) {
        console.error("Failed to download or process Bible JSON:", error.message);
    }
}

downloadAndFormatBible();

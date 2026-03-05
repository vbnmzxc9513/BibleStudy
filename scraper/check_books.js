const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data', 'taiwanbible_full.json');

const BIBLE_BOOKS = [
    "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
    "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah", "Esther", "Job", "Psalms", "Proverbs",
    "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
    "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi", "Matthew", "Mark",
    "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians", "Philippians",
    "Colossians", "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews",
    "James", "1 Peter", "2 Peter", "1 John", "2 John", "3 John", "Jude", "Revelation"
];

const BIBLE_IDS = [
    "GEN", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG", "RUT", "1SA", "2SA",
    "1KI", "2KI", "1CH", "2CH", "EZR", "NEH", "EST", "JOB", "PSA", "PRO",
    "ECC", "SNG", "ISA", "JER", "LAM", "EZE", "DAN", "HOS", "JOE", "AMO",
    "OBA", "JON", "MIC", "NAM", "HAB", "ZEP", "HAG", "ZEC", "MAL", "MAT",
    "MRK", "LUK", "JHN", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH", "PHP",
    "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB", "JAS", "1PE",
    "2PE", "1JN", "2JN", "3JN", "JUD", "REV"
];

async function checkBooks(filename) {
    const filePath = path.join(__dirname, 'data', filename);
    if (!fs.existsSync(filePath)) {
        console.error(`File ${filename} not found!`);
        return;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const foundIds = new Set();

    const ID_MAP = {
        "JUG": "JDG", "PSM": "PSA", "SON": "SNG", "EZK": "EZE", "JOL": "JOE",
        "NAH": "NAM", "MAK": "MRK", "MAR": "MRK", "1TS": "1TH", "2TS": "2TH",
        "MON": "PHM", "PHL": "PHP"
    };

    data.forEach(item => {
        let id = item.bookId || item.book_id;
        id = ID_MAP[id] || id; // Apply mapping
        if (id) {
            foundIds.add(id);
        }
    });

    console.log(`\n--- Checking ${filename} with ID Mapping ---`);
    console.log(`Found ${foundIds.size} books.`);

    const missing = [];
    BIBLE_IDS.forEach((id, index) => {
        if (!foundIds.has(id)) {
            missing.push(`${BIBLE_BOOKS[index]} (${id})`);
        }
    });

    if (missing.length > 0) {
        console.log("Missing books:");
        missing.forEach(m => console.log("- " + m));
    } else {
        console.log("All 66 books match the app's expected IDs!");
    }
}

async function run() {
    await checkBooks('taiwanbible_full.json');
    await checkBooks('cuv_bible_full.json');
}

run();

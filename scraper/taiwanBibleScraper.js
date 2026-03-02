const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const bibleBooks = [
    { id: 'GEN', name: 'Genesis', chapters: 50 },
    { id: 'EXO', name: 'Exodus', chapters: 40 },
    { id: 'LEV', name: 'Leviticus', chapters: 27 },
    { id: 'NUM', name: 'Numbers', chapters: 36 },
    { id: 'DEU', name: 'Deuteronomy', chapters: 34 },
    { id: 'JOS', name: 'Joshua', chapters: 24 },
    { id: 'JUG', name: 'Judges', chapters: 21 },
    { id: 'RUT', name: 'Ruth', chapters: 4 },
    { id: '1SA', name: '1 Samuel', chapters: 31 },
    { id: '2SA', name: '2 Samuel', chapters: 24 },
    { id: '1KI', name: '1 Kings', chapters: 22 },
    { id: '2KI', name: '2 Kings', chapters: 25 },
    { id: '1CH', name: '1 Chronicles', chapters: 29 },
    { id: '2CH', name: '2 Chronicles', chapters: 36 },
    { id: 'EZR', name: 'Ezra', chapters: 10 },
    { id: 'NEH', name: 'Nehemiah', chapters: 13 },
    { id: 'EST', name: 'Esther', chapters: 10 },
    { id: 'JOB', name: 'Job', chapters: 42 },
    { id: 'PSM', name: 'Psalms', chapters: 150 },
    { id: 'PRO', name: 'Proverbs', chapters: 31 },
    { id: 'ECC', name: 'Ecclesiastes', chapters: 12 },
    { id: 'SON', name: 'Song of Solomon', chapters: 8 },
    { id: 'ISA', name: 'Isaiah', chapters: 66 },
    { id: 'JER', name: 'Jeremiah', chapters: 52 },
    { id: 'LAM', name: 'Lamentations', chapters: 5 },
    { id: 'EZE', name: 'Ezekiel', chapters: 48 },
    { id: 'DAN', name: 'Daniel', chapters: 12 },
    { id: 'HOS', name: 'Hosea', chapters: 14 },
    { id: 'JOE', name: 'Joel', chapters: 3 },
    { id: 'AMO', name: 'Amos', chapters: 9 },
    { id: 'OBA', name: 'Obadiah', chapters: 1 },
    { id: 'JON', name: 'Jonah', chapters: 4 },
    { id: 'MIC', name: 'Micah', chapters: 7 },
    { id: 'NAH', name: 'Nahum', chapters: 3 },
    { id: 'HAB', name: 'Habakkuk', chapters: 3 },
    { id: 'ZEP', name: 'Zephaniah', chapters: 3 },
    { id: 'HAG', name: 'Haggai', chapters: 2 },
    { id: 'ZEC', name: 'Zechariah', chapters: 14 },
    { id: 'MAL', name: 'Malachi', chapters: 4 },
    { id: 'MAT', name: 'Matthew', chapters: 28 },
    { id: 'MAR', name: 'Mark', chapters: 16 },
    { id: 'LUK', name: 'Luke', chapters: 24 },
    { id: 'JHN', name: 'John', chapters: 21 },
    { id: 'ACT', name: 'Acts', chapters: 28 },
    { id: 'ROM', name: 'Romans', chapters: 16 },
    { id: '1CO', name: '1 Corinthians', chapters: 16 },
    { id: '2CO', name: '2 Corinthians', chapters: 13 },
    { id: 'GAL', name: 'Galatians', chapters: 6 },
    { id: 'EPH', name: 'Ephesians', chapters: 6 },
    { id: 'PHL', name: 'Philippians', chapters: 4 },
    { id: 'COL', name: 'Colossians', chapters: 4 },
    { id: '1TS', name: '1 Thessalonians', chapters: 5 },
    { id: '2TS', name: '2 Thessalonians', chapters: 3 },
    { id: '1TI', name: '1 Timothy', chapters: 6 },
    { id: '2TI', name: '2 Timothy', chapters: 4 },
    { id: 'TIT', name: 'Titus', chapters: 3 },
    { id: 'MON', name: 'Philemon', chapters: 1 },
    { id: 'HEB', name: 'Hebrews', chapters: 13 },
    { id: 'JAS', name: 'James', chapters: 5 },
    { id: '1PE', name: '1 Peter', chapters: 5 },
    { id: '2PE', name: '2 Peter', chapters: 3 },
    { id: '1JN', name: '1 John', chapters: 5 },
    { id: '2JN', name: '2 John', chapters: 1 },
    { id: '3JN', name: '3 John', chapters: 1 },
    { id: 'JUD', name: 'Jude', chapters: 1 },
    { id: 'REV', name: 'Revelation', chapters: 22 }
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function scrapeTaiwanBible() {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
    }

    const outputFile = path.join(dataDir, 'taiwanbible_full.json');
    let fullBibleData = [];

    // If restarting a partial run, load existing data
    if (fs.existsSync(outputFile)) {
        try {
            fullBibleData = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
            console.log(`Resuming from existing save file. Currently has ${fullBibleData.length} books.`);
        } catch (e) {
            console.log("Could not parse existing save file, starting fresh.");
        }
    }

    console.log("Starting TaiwanBible Scraper for 66 Books (1189 Chapters)...");

    for (const book of bibleBooks) {
        // Check if book already scraped
        const existingBook = fullBibleData.find(b => b.book_id === book.id);
        if (existingBook && existingBook.chapters.length === book.chapters) {
            console.log(`[SKIP] ${book.id} - Already perfectly scraped.`);
            continue;
        }

        console.log(`\n📚 Starting Book: ${book.id} (${book.chapters} chapters)`);

        let bookData = {
            book_id: book.id,
            chapters: []
        };

        for (let chapterNum = 1; chapterNum <= book.chapters; chapterNum++) {
            const url = `https://taiwanbible.com/m/bible/readChapter.jsp?Book=${book.id}&Chapter=${chapterNum}`;

            try {
                // Rate Limiter
                await delay(500);

                process.stdout.write(`  ↳ Fetching Ch ${chapterNum}... `);
                let response = null;
                let retries = 3;
                while (retries > 0) {
                    try {
                        response = await axios.get(url, {
                            timeout: 20000,
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                            }
                        });
                        break; // If successful, break out of loop
                    } catch (axiosError) {
                        retries--;
                        if (retries === 0) throw axiosError; // If out of retries, actually crash and save progress
                        process.stdout.write(` [Retry ${3 - retries}] `);
                        await delay(2000); // Wait 2s before retrying
                    }
                }

                const $ = cheerio.load(response.data);
                let verses = [];

                const contentDiv = $('.content');
                if (contentDiv.length > 0) {
                    const paragraphs = contentDiv.find('p');
                    paragraphs.each((i, el) => {
                        const links = $(el).find('a');
                        links.each((j, linkEl) => {
                            const href = $(linkEl).attr('href');
                            if (href && href.includes('bibleVerseTool.jsp')) {
                                const verseNumText = $(linkEl).text().trim();
                                const verseNum = parseInt(verseNumText, 10);

                                let verseText = '';
                                let nextNode = linkEl.nextSibling;
                                while (nextNode && nextNode.type === 'text') {
                                    verseText += nextNode.data;
                                    nextNode = nextNode.nextSibling;
                                }

                                verseText = verseText.trim();
                                // Clean up non-breaking spaces and double spaces
                                verseText = verseText.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');

                                if (!isNaN(verseNum) && verseText) {
                                    verses.push({ verse: verseNum, text: verseText });
                                }
                            }
                        });
                    });
                }

                if (verses.length > 0) {
                    bookData.chapters.push({
                        chapter: chapterNum,
                        verses: verses
                    });
                    console.log(`OK (${verses.length} verses)`);
                } else {
                    console.log(`WARNING - No verses found!`);
                }

            } catch (err) {
                console.log(`ERROR: ${err.message}`);
                // Stop the script gracefully to not lose progress
                console.log("Saving current progress and aborting due to error...");

                // Overwrite the existing logic if partway done
                const existingIndex = fullBibleData.findIndex(b => b.book_id === book.id);
                if (existingIndex > -1) {
                    fullBibleData[existingIndex] = bookData;
                } else {
                    fullBibleData.push(bookData);
                }

                fs.writeFileSync(outputFile, JSON.stringify(fullBibleData, null, 2));
                process.exit(1);
            }
        }

        // Successfully finished a book, add it to our full data payload
        const existingIndex = fullBibleData.findIndex(b => b.book_id === book.id);
        if (existingIndex > -1) {
            fullBibleData[existingIndex] = bookData;
        } else {
            fullBibleData.push(bookData);
        }

        // Save progress after EVERY book to avoid catastrophic data loss
        fs.writeFileSync(outputFile, JSON.stringify(fullBibleData, null, 2));
    }

    console.log(`\n✅ Scraping Complete! All Data saved to: ${outputFile}`);
}

scrapeTaiwanBible();

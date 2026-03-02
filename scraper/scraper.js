const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Target URLs and selectors might need adjustment based on the actual chosen source.
// We are using a generic structure for demonstration/implementation purposes.
// A common reliable source for TCV is bible.fhl.net or crosswire, but for simplicity
// and robustness in generic scraping environments, we'll design a modular parser.

const BIBLE_BOOKS = [
    { id: "GEN", cnName: "創世記", chapters: 50 },
    { id: "EXO", cnName: "出埃及記", chapters: 40 },
    { id: "LEV", cnName: "利未記", chapters: 27 },
    { id: "NUM", cnName: "民數記", chapters: 36 },
    { id: "DEU", cnName: "申命記", chapters: 34 },
    { id: "JOS", cnName: "約書亞記", chapters: 24 },
    { id: "JDG", cnName: "士師記", chapters: 21 },
    { id: "RUT", cnName: "路得記", chapters: 4 },
    { id: "1SA", cnName: "撒母耳記上", chapters: 31 },
    { id: "2SA", cnName: "撒母耳記下", chapters: 24 },
    { id: "1KI", cnName: "列王紀上", chapters: 22 },
    { id: "2KI", cnName: "列王紀下", chapters: 25 },
    { id: "1CH", cnName: "歷代志上", chapters: 29 },
    { id: "2CH", cnName: "歷代志下", chapters: 36 },
    { id: "EZR", cnName: "以斯拉記", chapters: 10 },
    { id: "NEH", cnName: "尼希米記", chapters: 13 },
    { id: "EST", cnName: "以斯帖記", chapters: 10 },
    { id: "JOB", cnName: "約伯記", chapters: 42 },
    { id: "PSA", cnName: "詩篇", chapters: 150 },
    { id: "PRO", cnName: "箴言", chapters: 31 },
    { id: "ECC", cnName: "傳道書", chapters: 12 },
    { id: "SNG", cnName: "雅歌", chapters: 8 },
    { id: "ISA", cnName: "以賽亞書", chapters: 66 },
    { id: "JER", cnName: "耶利米書", chapters: 52 },
    { id: "LAM", cnName: "耶利米哀歌", chapters: 5 },
    { id: "EZK", cnName: "以西結書", chapters: 48 },
    { id: "DAN", cnName: "但以理書", chapters: 12 },
    { id: "HOS", cnName: "何西阿書", chapters: 14 },
    { id: "JOL", cnName: "約珥書", chapters: 3 },
    { id: "AMO", cnName: "阿摩司書", chapters: 9 },
    { id: "OBA", cnName: "俄巴底亞書", chapters: 1 },
    { id: "JON", cnName: "約拿書", chapters: 4 },
    { id: "MIC", cnName: "彌迦書", chapters: 7 },
    { id: "NAM", cnName: "那鴻書", chapters: 3 },
    { id: "HAB", cnName: "哈巴谷書", chapters: 3 },
    { id: "ZEP", cnName: "西番雅書", chapters: 3 },
    { id: "HAG", cnName: "哈該書", chapters: 2 },
    { id: "ZEC", cnName: "撒迦利亞書", chapters: 14 },
    { id: "MAL", cnName: "瑪拉基書", chapters: 4 },
    { id: "MAT", cnName: "馬太福音", chapters: 28 },
    { id: "MRK", cnName: "馬可福音", chapters: 16 },
    { id: "LUK", cnName: "路加福音", chapters: 24 },
    { id: "JHN", cnName: "約翰福音", chapters: 21 },
    { id: "ACT", cnName: "使徒行傳", chapters: 28 },
    { id: "ROM", cnName: "羅馬書", chapters: 16 },
    { id: "1CO", cnName: "哥林多前書", chapters: 16 },
    { id: "2CO", cnName: "哥林多後書", chapters: 13 },
    { id: "GAL", cnName: "加拉太書", chapters: 6 },
    { id: "EPH", cnName: "以弗所書", chapters: 6 },
    { id: "PHP", cnName: "腓立比書", chapters: 4 },
    { id: "COL", cnName: "歌羅西書", chapters: 4 },
    { id: "1TH", cnName: "帖撒羅尼迦前書", chapters: 5 },
    { id: "2TH", cnName: "帖撒羅尼迦後書", chapters: 3 },
    { id: "1TI", cnName: "提摩太前書", chapters: 6 },
    { id: "2TI", cnName: "提摩太後書", chapters: 4 },
    { id: "TIT", cnName: "提多書", chapters: 3 },
    { id: "PHM", cnName: "腓利門書", chapters: 1 },
    { id: "HEB", cnName: "希伯來書", chapters: 13 },
    { id: "JAS", cnName: "雅各書", chapters: 5 },
    { id: "1PE", cnName: "彼得前書", chapters: 5 },
    { id: "2PE", cnName: "彼得後書", chapters: 3 },
    { id: "1JN", cnName: "約翰一書", chapters: 5 },
    { id: "2JN", cnName: "約翰二書", chapters: 1 },
    { id: "3JN", cnName: "約翰三書", chapters: 1 },
    { id: "JUD", cnName: "猶大書", chapters: 1 },
    { id: "REV", cnName: "啟示錄", chapters: 22 }
];

const OUTPUT_FILE = path.join(__dirname, 'data', 'tcv_bible.json');
const DATA_DIR = path.join(__dirname, 'data');

// Sleep function for rate limiting
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Generic Fetcher
async function fetchChapterHTML(bookId, chapter) {
    // Modify this URL according to the actual target source
    // Example using bible.fhl.net format for demonstration
    // Note: FHL relies on Big5 or specific encodings often, so an external generic JSON API is often safer.
    // We will simulate the request for now and structure the logic.

    // In a real scenario, finding an open API for TCV is best. If none exist, we scrape.
    // For this example, let's target a hypothetical clean HTML source or use a mock API if web scraping fails.
    const url = `https://bolls.life/get-chapter/TCV/${bookId}/${chapter}/`;
    // Bolls Life API provides a free json endpoint for many translations. We will try TCV.
    // If TCV isn't mapped there, we'll fall back to CUV (Chinese Union Version).

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        return response.data;
    } catch (error) {
        console.error(`Failed to fetch ${bookId} Chapter ${chapter}: ${error.message}`);
        return null;
    }
}

async function startScraping() {
    console.log("Starting Bible Scraper...");
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR);
    }

    let existingData = [];
    if (fs.existsSync(OUTPUT_FILE)) {
        try {
            existingData = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
            console.log(`Found existing data with ${existingData.length} chapters.`);
        } catch (e) {
            console.log("Existing data is corrupted. Starting fresh.");
        }
    }

    // Determine where we left off
    const isChapterDone = (bookId, chapter) => {
        return existingData.some(d => d.bookId === bookId && d.chapter === chapter);
    };

    for (const book of BIBLE_BOOKS) {
        for (let chapter = 1; chapter <= book.chapters; chapter++) {
            if (isChapterDone(book.id, chapter)) {
                console.log(`Skipping ${book.id} Chapter ${chapter} (Already exists)`);
                continue;
            }

            console.log(`Fetching ${book.id} Chapter ${chapter}...`);
            const chapterData = await fetchChapterHTML(book.id, chapter);

            if (chapterData && Array.isArray(chapterData)) {
                // Formatting data from the JSON API
                const verses = chapterData.map(v => ({
                    number: v.verse,
                    text: v.text.replace(/<[^>]+>/g, '').trim() // Strip any HTML tags
                }));

                const record = {
                    bookId: book.id,
                    bookName: book.cnName,
                    chapter: chapter,
                    verses: verses
                };

                existingData.push(record);

                // Save after every chapter to prevent data loss
                fs.writeFileSync(OUTPUT_FILE, JSON.stringify(existingData, null, 2));
                console.log(`Saved ${book.id} Chapter ${chapter}`);
            } else {
                console.log(`No valid data found for ${book.id} Chapter ${chapter}, will retry later.`);
            }

            // Rate Limiting (1.5 seconds)
            await sleep(1500);
        }
    }

    console.log("Scraping completed! Data saved to tcv_bible.json");
}

startScraping();

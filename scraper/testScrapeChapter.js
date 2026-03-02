const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeChapter() {
    try {
        const url = 'https://taiwanbible.com/m/bible/readChapter.jsp?Book=GEN&Chapter=1';
        console.log(`Fetching ${url}...`);
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        let verses = [];
        // The verses are inside a <p> tag inside the <div class="content ..."> 
        // after the <h4> tag which contains the chapter number.

        const contentDiv = $('.content');
        if (contentDiv.length > 0) {
            const paragraphs = contentDiv.find('p');

            paragraphs.each((i, el) => {
                // The verse number is in an <a> tag
                const links = $(el).find('a');
                links.each((j, linkEl) => {
                    const href = $(linkEl).attr('href');
                    if (href && href.includes('bibleVerseTool.jsp')) {
                        const verseNumText = $(linkEl).text().trim();
                        const verseNum = parseInt(verseNumText, 10);

                        // The verse text is the text node immediately following the <a> tag
                        let verseText = '';
                        let nextNode = linkEl.nextSibling;
                        while (nextNode && nextNode.type === 'text') {
                            verseText += nextNode.data;
                            nextNode = nextNode.nextSibling;
                        }

                        verseText = verseText.trim();
                        if (!isNaN(verseNum) && verseText) {
                            verses.push({ verse: verseNum, text: verseText });
                        }
                    }
                });
            });
        }

        console.log(`Found ${verses.length} verses.`);
        console.dir(verses, { depth: null, maxArrayLength: null });

    } catch (e) {
        console.error(e.message);
    }
}
scrapeChapter();

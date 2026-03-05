const fs = require('fs');
const path = require('path');

// Mocking the bibleBooks.ts content for analysis
const appBooks = [
    { id: "GEN", cnName: "創世記" }, { id: "EXO", cnName: "出埃及記" }, { id: "LEV", cnName: "利未記" },
    { id: "NUM", cnName: "民數記" }, { id: "DEU", cnName: "申命記" }, { id: "JOS", cnName: "約書亞記" },
    { id: "JDG", cnName: "士師記" }, { id: "RUT", cnName: "路得記" }, { id: "1SA", cnName: "撒母耳記上" },
    { id: "2SA", cnName: "撒母耳記下" }, { id: "1KI", cnName: "列王紀上" }, { id: "2KI", cnName: "列王紀下" },
    { id: "1CH", cnName: "歷代志上" }, { id: "2CH", cnName: "歷代志下" }, { id: "EZR", cnName: "以斯拉記" },
    { id: "NEH", cnName: "尼希米記" }, { id: "EST", cnName: "以斯帖記" }, { id: "JOB", cnName: "約伯記" },
    { id: "PSA", cnName: "詩篇" }, { id: "PRO", cnName: "箴言" }, { id: "ECC", cnName: "傳道書" },
    { id: "SNG", cnName: "雅歌" }, { id: "ISA", cnName: "以賽亞書" }, { id: "JER", cnName: "耶利米書" },
    { id: "LAM", cnName: "耶利米哀歌" }, { id: "EZK", cnName: "以西結書" }, { id: "DAN", cnName: "但以理書" },
    { id: "HOS", cnName: "何西阿書" }, { id: "JOL", cnName: "約珥書" }, { id: "AMO", cnName: "阿摩司書" },
    { id: "OBA", cnName: "俄巴底亞書" }, { id: "JON", cnName: "約拿書" }, { id: "MIC", cnName: "彌迦書" },
    { id: "NAM", cnName: "那鴻書" }, { id: "HAB", cnName: "哈巴谷書" }, { id: "ZEP", cnName: "西番雅書" },
    { id: "HAG", cnName: "哈該書" }, { id: "ZEC", cnName: "撒迦利亞書" }, { id: "MAL", cnName: "瑪拉基書" },
    { id: "MAT", cnName: "馬太福音" }, { id: "MRK", cnName: "馬可福音" }, { id: "LUK", cnName: "路加福音" },
    { id: "JHN", cnName: "約翰福音" }, { id: "ACT", cnName: "使徒行傳" }, { id: "ROM", cnName: "羅馬書" },
    { id: "1CO", cnName: "哥林多前書" }, { id: "2CO", cnName: "哥林多後書" }, { id: "GAL", cnName: "加拉太書" },
    { id: "EPH", cnName: "以弗所書" }, { id: "PHP", cnName: "腓立比書" }, { id: "COL", cnName: "歌羅西書" },
    { id: "1TH", cnName: "帖撒羅尼迦前書" }, { id: "2TH", cnName: "帖撒羅尼迦後書" }, { id: "1TI", cnName: "提摩太前書" },
    { id: "2TI", cnName: "提摩太後書" }, { id: "TIT", cnName: "提多書" }, { id: "PHM", cnName: "腓利門書" },
    { id: "HEB", cnName: "希伯來書" }, { id: "JAS", cnName: "雅各書" }, { id: "1PE", cnName: "彼得前書" },
    { id: "2PE", cnName: "彼得後書" }, { id: "1JN", cnName: "約翰一書" }, { id: "2JN", cnName: "約翰二書" },
    { id: "3JN", cnName: "約翰三書" }, { id: "JUD", cnName: "猶大書" }, { id: "REV", cnName: "啟示錄" }
];

const DATA_FILE = path.join(__dirname, 'data', 'taiwanbible_full.json');

function compare() {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const firestoreIds = new Set(data.map(b => b.book_id));

    console.log("Book Name | App ID | Firestore ID | Status");
    console.log("----------|--------|--------------|-------");

    appBooks.forEach(book => {
        let status = "OK";
        let firestoreId = book.id;

        if (!firestoreIds.has(book.id)) {
            // Try to find the closest match in firestoreIds
            // This is a manual mapping based on previous findings
            const mapping = {
                "JDG": "JUG",
                "PSA": "PSM",
                "SNG": "SON",
                "EZK": "EZE",
                "JOL": "JOE",
                "NAM": "NAH",
                "MRK": "MAK", // or MAR
                "1TH": "1TS",
                "2TH": "2TS",
                "PHM": "MON",
                "PHP": "PHL"
            };

            const mappedId = mapping[book.id];
            if (mappedId && firestoreIds.has(mappedId)) {
                status = "MISMATCH (ID)";
                firestoreId = mappedId;
            } else {
                status = "MISSING";
                firestoreId = "NONE";
            }
        }

        console.log(`${book.cnName} | ${book.id} | ${firestoreId} | ${status}`);
    });
}

compare();

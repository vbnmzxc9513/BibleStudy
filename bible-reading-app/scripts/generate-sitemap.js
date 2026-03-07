// @ts-check
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import bibleBooks directly - ensure we are reading from the source
// We will read the TS file and extract the data since it's an ESM ESbuild process
const constantsPath = path.resolve(__dirname, '../src/constants/bibleBooks.ts');
const rawData = fs.readFileSync(constantsPath, 'utf8');

const regex = /id:\s*['"]([A-Z0-9]{3})['"],\s*cnName:.*chapters:\s*(\d+)/g;

let books = [];
let match;
while ((match = regex.exec(rawData)) !== null) {
    books.push({ id: match[1], chapters: parseInt(match[2], 10) });
}

// Generate Sitemap XML
const BASE_URL = 'https://biblestudy-633.pages.dev';

let sitemapStr = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Core pages -->
  <url>
    <loc>${BASE_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${BASE_URL}/books</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${BASE_URL}/profile</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
`;

// Add every bible chapter
books.forEach(book => {
    for (let chapter = 1; chapter <= book.chapters; chapter++) {
        sitemapStr += `  <url>
    <loc>${BASE_URL}/read/${book.id}/${chapter}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
    }
});

sitemapStr += `</urlset>`;

// Ensure output is placed in the dist/ folder during build
const targetDir = path.resolve(__dirname, '../dist');
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir);
}

const targetPath = path.resolve(targetDir, 'sitemap.xml');
// Also write to public/ so it's committed and served locally if needed
const publicPath = path.resolve(__dirname, '../public/sitemap.xml');

fs.writeFileSync(publicPath, sitemapStr);
console.log('Sitemap successfully generated at public/sitemap.xml');

// If dist exists, we copy it there too for the final build
if (fs.existsSync(targetDir)) {
    fs.writeFileSync(targetPath, sitemapStr);
    console.log('Sitemap successfully generated at dist/sitemap.xml');
}

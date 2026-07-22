/**
 * scraper.mjs — Google Search Scraper + Full Website Audit CLI
 *
 * Usage:
 *   node scraper/scraper.mjs "FBI apostille" "apostille services"
 *   node scraper/scraper.mjs --file scraper/keywords.txt
 *   node scraper/scraper.mjs "keyword" --results 10 --depth 3 --max-pages 25 --output ./reports
 *   node scraper/scraper.mjs "keyword" --results 5 --screenshot
 *
 * Options:
 *   --results N      Google results per keyword (default: 10)
 *   --depth N        Max crawl depth from landing page (default: 3)
 *   --max-pages N    Max pages to crawl per domain (default: 25)
 *   --output path    Output directory (default: ./scraper-reports)
 *   --file path      Read keywords from a file (one per line)
 *   --screenshot     Save a screenshot of each page visited
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { crawlSite } from './crawler.mjs';
import { writeReports, writeSummary } from './reporter.mjs';

// ── Config defaults ──────────────────────────────────────────────────────────

const DEFAULTS = {
  results: 10,
  depth: 3,
  maxPages: 25,
  output: './scraper-reports',
  screenshot: false,
};

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

// ── Helpers ──────────────────────────────────────────────────────────────────

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
function randomDelay(min, max) { return delay(Math.floor(Math.random() * (max - min + 1)) + min); }

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = { ...DEFAULTS, keywords: [] };
  let i = 0;
  while (i < args.length) {
    switch (args[i]) {
      case '--results':   opts.results   = parseInt(args[++i]) || DEFAULTS.results; break;
      case '--depth':     opts.depth     = parseInt(args[++i]) || DEFAULTS.depth; break;
      case '--max-pages': opts.maxPages  = parseInt(args[++i]) || DEFAULTS.maxPages; break;
      case '--output':    opts.output    = args[++i]; break;
      case '--file':      opts.keywordFile = args[++i]; break;
      case '--screenshot': opts.screenshot = true; break;
      default:
        if (!args[i].startsWith('--')) opts.keywords.push(args[i]);
    }
    i++;
  }
  return opts;
}

function loadKeywordsFromFile(filePath) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    console.error(`Keywords file not found: ${abs}`);
    process.exit(1);
  }
  return fs.readFileSync(abs, 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));
}

function getDomain(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return url; }
}

function isGoogleCaptcha(page) {
  const url = page.url();
  return url.includes('/sorry/') || url.includes('recaptcha');
}

// ── Google search ────────────────────────────────────────────────────────────

async function searchGoogle(page, keyword, maxResults) {
  const query = encodeURIComponent(keyword);
  const url = `https://www.google.com/search?q=${query}&num=${maxResults}&hl=en&gl=us`;

  console.log(`\n🔍 Searching Google for: "${keyword}"`);

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
  } catch (err) {
    console.warn(`  ⚠ Could not load Google search: ${err.message}`);
    return [];
  }

  if (isGoogleCaptcha(page)) {
    console.warn(`  ⚠ Google captcha detected — skipping this keyword. Try again later or use a VPN.`);
    return [];
  }

  // Check for cookie consent dialog (EU/region-based)
  try {
    const acceptBtn = page.locator('button:has-text("Accept all"), button:has-text("I agree"), #L2AGLb');
    if (await acceptBtn.count() > 0) {
      await acceptBtn.first().click();
      await page.waitForTimeout(1000);
    }
  } catch (_) {}

  // Extract organic results
  const results = await page.evaluate((max) => {
    const items = [];

    // Google organic result selectors (may need updating if Google changes layout)
    const cards = document.querySelectorAll('div[data-sokoban-container], div.g, div[jscontroller][data-hveid]');

    for (const card of cards) {
      if (items.length >= max) break;

      // Skip ads
      const adIndicators = card.querySelector('[data-text-ad], .ads-fr, [aria-label*="Ad"]');
      if (adIndicators) continue;

      const link = card.querySelector('a[href]');
      const titleEl = card.querySelector('h3');
      const snippetEl = card.querySelector('[data-sncf], .VwiC3b, span[style*="-webkit-line-clamp"]');

      if (!link || !titleEl) continue;

      const href = link.getAttribute('href');
      if (!href || !href.startsWith('http')) continue;
      // Skip Google's own results and known non-website results
      if (href.includes('google.com') || href.includes('youtube.com/watch')) continue;

      const title = titleEl.textContent?.trim() || '';
      const snippet = snippetEl?.textContent?.trim() || '';

      items.push({ url: href, title, snippet });
    }

    return items;
  }, maxResults);

  // Deduplicate by domain
  const seen = new Set();
  const deduped = results.filter(r => {
    const domain = (() => { try { return new URL(r.url).hostname; } catch { return r.url; } })();
    if (seen.has(domain)) return false;
    seen.add(domain);
    return true;
  });

  console.log(`  Found ${deduped.length} organic results`);
  return deduped;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs(process.argv);

  if (opts.keywordFile) {
    opts.keywords.push(...loadKeywordsFromFile(opts.keywordFile));
  }

  if (opts.keywords.length === 0) {
    console.error('No keywords provided.\n\nUsage:\n  node scraper/scraper.mjs "keyword 1" "keyword 2"\n  node scraper/scraper.mjs --file scraper/keywords.txt\n');
    process.exit(1);
  }

  const date = new Date().toISOString().slice(0, 10);
  const timestamp = new Date().toISOString().slice(0, 16).replace('T', 'T').replace(':', '-');
  const outputBase = path.resolve(opts.output, timestamp);
  fs.mkdirSync(outputBase, { recursive: true });

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  Google Search Scraper + Website Auditor`);
  console.log(`${'═'.repeat(60)}`);
  console.log(`  Keywords  : ${opts.keywords.join(', ')}`);
  console.log(`  Results   : ${opts.results} per keyword`);
  console.log(`  Crawl     : depth ${opts.depth}, max ${opts.maxPages} pages/site`);
  console.log(`  Output    : ${outputBase}`);
  console.log(`${'═'.repeat(60)}\n`);

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  });

  // Google search context (separate from crawl context)
  const searchContext = await browser.newContext({
    userAgent: USER_AGENT,
    viewport: { width: 1440, height: 900 },
    extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' },
  });
  const searchPage = await searchContext.newPage();

  for (const keyword of opts.keywords) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`  KEYWORD: "${keyword}"`);
    console.log(`${'─'.repeat(60)}`);

    const googleResults = await searchGoogle(searchPage, keyword, opts.results);

    if (googleResults.length === 0) {
      console.warn(`  No results found for "${keyword}" — skipping`);
      continue;
    }

    await randomDelay(2000, 4000);

    const sitesAudited = [];

    for (let i = 0; i < googleResults.length; i++) {
      const result = googleResults[i];
      const rank = i + 1;
      const domain = getDomain(result.url);

      console.log(`\n[${rank}/${googleResults.length}] Auditing: ${domain}`);
      console.log(`  URL: ${result.url}`);
      console.log(`  Title: ${result.title}`);

      const screenshotDir = opts.screenshot
        ? path.join(outputBase, keyword.replace(/[^a-z0-9]+/gi, '-'), domain.replace(/[^a-z0-9.]/gi, '-'), 'screenshots')
        : null;
      if (screenshotDir) fs.mkdirSync(screenshotDir, { recursive: true });

      let crawlResult;
      try {
        crawlResult = await crawlSite({
          browser,
          startUrl: result.url,
          maxDepth: opts.depth,
          maxPages: opts.maxPages,
          keyword,
          takeScreenshot: opts.screenshot,
          screenshotDir,
        });
      } catch (err) {
        console.error(`  ✗ Crawl failed for ${domain}: ${err.message}`);
        continue;
      }

      const siteDir = await writeReports({
        outputBase,
        keyword,
        rank,
        domain,
        startUrl: result.url,
        crawlResult,
        date,
      });

      sitesAudited.push({ rank, domain, startUrl: result.url, crawlResult });

      const validPages = crawlResult.pages.filter(p => !p.error);
      const avgScore = validPages.length
        ? Math.round(validPages.reduce((s, p) => s + p.scores.overall, 0) / validPages.length)
        : 0;
      console.log(`  ✓ Done — ${crawlResult.totalCrawled} pages, avg score: ${avgScore}/100`);
      console.log(`  📄 Report: ${siteDir}`);

      await randomDelay(1500, 3000);
    }

    // Write summary for this keyword
    if (sitesAudited.length > 0) {
      const summaryPath = writeSummary({ outputBase, keyword, date, sites: sitesAudited });
      console.log(`\n  📊 Summary: ${summaryPath}`);
    }
  }

  await searchContext.close();
  await browser.close();

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  All done! Reports saved to:`);
  console.log(`  ${outputBase}`);
  console.log(`${'═'.repeat(60)}\n`);
}

main().catch(err => {
  console.error('\n✗ Fatal error:', err.message);
  console.error(err.stack);
  process.exit(1);
});

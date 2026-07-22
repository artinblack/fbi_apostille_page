/**
 * crawler.mjs — BFS deep-crawl engine
 * Visits a site starting from a seed URL, follows internal links, and audits each page.
 */

import { analyzePage } from './analyzer.mjs';

const BLOCKED_EXTENSIONS = /\.(pdf|zip|docx?|xlsx?|pptx?|png|jpe?g|gif|webp|svg|mp4|mp3|woff2?|ttf|eot|ico|css)(\?.*)?$/i;
const BLOCKED_PARAMS_PATTERNS = [/#/, /\?print=/, /\/feed\/?$/, /\/rss\/?$/, /\/amp\/?/];

function normalizeUrl(href, base) {
  try {
    const u = new URL(href, base);
    u.hash = '';
    // Drop query params that create duplicate content
    return u.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

function isSameDomain(url, origin) {
  try {
    return new URL(url).hostname === new URL(origin).hostname;
  } catch {
    return false;
  }
}

function shouldSkip(url) {
  if (BLOCKED_EXTENSIONS.test(url)) return true;
  if (BLOCKED_PARAMS_PATTERNS.some(p => p.test(url))) return true;
  if (url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('javascript:')) return true;
  return false;
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function randomDelay(minMs, maxMs) {
  return delay(Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs);
}

export async function crawlSite({ browser, startUrl, maxDepth, maxPages, keyword, takeScreenshot, screenshotDir }) {
  const visited = new Map(); // url → audit result
  const broken404 = [];
  const queue = [{ url: startUrl, depth: 0 }];
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    viewport: { width: 1440, height: 900 },
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  // Block heavy resources — we only need HTML/CSS/JS for analysis
  await context.route('**/*', (route) => {
    const rt = route.request().resourceType();
    if (['image', 'media', 'font'].includes(rt)) {
      route.abort();
    } else {
      route.continue();
    }
  });

  const origin = startUrl;

  while (queue.length > 0 && visited.size < maxPages) {
    const { url, depth } = queue.shift();

    if (visited.has(url)) continue;
    if (shouldSkip(url)) continue;

    let page;
    try {
      page = await context.newPage();
      let httpStatus = 200;

      page.on('response', (resp) => {
        if (resp.url() === url || resp.url() === url + '/') {
          httpStatus = resp.status();
        }
      });

      const startTime = Date.now();
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      } catch (navErr) {
        console.warn(`  ⚠ Timeout/nav error on ${url}: ${navErr.message}`);
        await page.close();
        visited.set(url, { url, error: navErr.message, scores: { seo: 0, ux: 0, overall: 0 }, issues: { critical: [`Failed to load: ${navErr.message}`], warnings: [], suggestions: [] } });
        continue;
      }

      if (httpStatus === 404) {
        broken404.push(url);
        console.warn(`  ✗ 404 Not Found: ${url}`);
        await page.close();
        continue;
      }

      const audit = await analyzePage(page, url, keyword);
      audit.httpStatus = httpStatus;
      visited.set(url, audit);

      const slug = url.replace(/^https?:\/\//, '').replace(/[^a-z0-9]/gi, '-').substring(0, 60);
      console.log(`  ✓ [depth ${depth}] ${url} — overall: ${audit.scores.overall}/100 (${audit.loadMs}ms)`);

      if (takeScreenshot && screenshotDir) {
        try {
          const fs = await import('fs');
          const path = await import('path');
          const screenshotPath = path.join(screenshotDir, `${slug}.png`);
          await page.screenshot({ path: screenshotPath, fullPage: false });
        } catch (_) {}
      }

      // Discover more internal links
      if (depth < maxDepth) {
        const links = await page.evaluate(() => {
          return [...document.querySelectorAll('a[href]')]
            .map(a => a.getAttribute('href'))
            .filter(Boolean);
        });

        for (const href of links) {
          const normalized = normalizeUrl(href, url);
          if (!normalized) continue;
          if (!isSameDomain(normalized, origin)) continue;
          if (shouldSkip(normalized)) continue;
          if (visited.has(normalized)) continue;
          if (queue.some(q => q.url === normalized)) continue;
          queue.push({ url: normalized, depth: depth + 1 });
        }
      }

      await page.close();
      await randomDelay(1000, 2500);

    } catch (err) {
      console.warn(`  ✗ Error crawling ${url}: ${err.message}`);
      if (page && !page.isClosed()) await page.close();
    }
  }

  await context.close();

  return {
    pages: [...visited.values()],
    broken404,
    totalCrawled: visited.size,
  };
}

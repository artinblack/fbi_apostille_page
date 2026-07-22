/**
 * analyzer.mjs — Per-page SEO + UI/UX audit engine
 * Takes a Playwright page object (already loaded) and returns a structured audit object.
 */

export async function analyzePage(page, url, keyword = '') {
  const startTime = Date.now();

  const data = await page.evaluate((kw) => {
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => [...document.querySelectorAll(sel)];
    const text = (el) => el?.textContent?.trim() || '';
    const attr = (el, a) => el?.getAttribute(a) || '';

    // ── Title ──────────────────────────────────────────────────────────────
    const titleEl = $('title');
    const title = text(titleEl);

    // ── Meta tags ──────────────────────────────────────────────────────────
    const metaDesc = attr($('meta[name="description"]'), 'content');
    const metaKeywords = attr($('meta[name="keywords"]'), 'content');
    const canonical = attr($('link[rel="canonical"]'), 'href');
    const robotsMeta = attr($('meta[name="robots"]'), 'content').toLowerCase();
    const viewportMeta = attr($('meta[name="viewport"]'), 'content');
    const langAttr = document.documentElement.getAttribute('lang') || '';

    // ── Open Graph ─────────────────────────────────────────────────────────
    const og = {
      title: attr($('meta[property="og:title"]'), 'content'),
      description: attr($('meta[property="og:description"]'), 'content'),
      image: attr($('meta[property="og:image"]'), 'content'),
      type: attr($('meta[property="og:type"]'), 'content'),
    };

    // ── Twitter Card ───────────────────────────────────────────────────────
    const tw = {
      card: attr($('meta[name="twitter:card"]'), 'content'),
      title: attr($('meta[name="twitter:title"]'), 'content'),
      description: attr($('meta[name="twitter:description"]'), 'content'),
    };

    // ── Headings ───────────────────────────────────────────────────────────
    const h1s = $$('h1').map(text);
    const h2s = $$('h2').map(text);
    const h3s = $$('h3').map(text);
    const h4s = $$('h4').map(text);

    // Check heading hierarchy (skip levels)
    const headingLevels = [];
    $$('h1,h2,h3,h4,h5,h6').forEach(el => {
      headingLevels.push(parseInt(el.tagName[1]));
    });
    const headingSkips = [];
    for (let i = 1; i < headingLevels.length; i++) {
      if (headingLevels[i] - headingLevels[i - 1] > 1) {
        headingSkips.push(`H${headingLevels[i - 1]} → H${headingLevels[i]}`);
      }
    }

    // ── Images ─────────────────────────────────────────────────────────────
    const allImgs = $$('img');
    const missingAlt = allImgs.filter(img => !img.getAttribute('alt') || img.getAttribute('alt').trim() === '').length;
    const brokenImgs = allImgs.filter(img => !img.src || img.src === window.location.href).length;
    const imgsWithoutDimensions = allImgs.filter(img => !img.getAttribute('width') && !img.getAttribute('height') && !img.getAttribute('srcset')).length;

    // ── Schema ─────────────────────────────────────────────────────────────
    const schemaScripts = $$('script[type="application/ld+json"]');
    const schemaTypes = [];
    schemaScripts.forEach(s => {
      try {
        const json = JSON.parse(s.textContent);
        const types = Array.isArray(json) ? json.map(j => j['@type']) : [json['@type']];
        schemaTypes.push(...types.filter(Boolean));
      } catch (_) {}
    });

    // ── Links ──────────────────────────────────────────────────────────────
    const origin = window.location.origin;
    const allLinks = $$('a[href]');
    const internalLinks = allLinks.filter(a => {
      const href = a.getAttribute('href') || '';
      return href.startsWith('/') || href.startsWith(origin);
    });
    const externalLinks = allLinks.filter(a => {
      const href = a.getAttribute('href') || '';
      return href.startsWith('http') && !href.startsWith(origin);
    });
    const externalNoOpener = externalLinks.filter(a => {
      const rel = (a.getAttribute('rel') || '').toLowerCase();
      return !rel.includes('noopener');
    }).length;

    // ── Word count ─────────────────────────────────────────────────────────
    const bodyText = document.body?.innerText || '';
    const wordCount = bodyText.split(/\s+/).filter(w => w.length > 1).length;

    // ── Keyword density ────────────────────────────────────────────────────
    let keywordCount = 0;
    if (kw) {
      const kwLower = kw.toLowerCase();
      const bodyLower = bodyText.toLowerCase();
      let pos = 0;
      while ((pos = bodyLower.indexOf(kwLower, pos)) !== -1) { keywordCount++; pos++; }
    }

    // ── UI/UX checks ───────────────────────────────────────────────────────
    const hasNav = !!$('nav, [role="navigation"]');
    const hasFooter = !!$('footer, [role="contentinfo"]');
    const hasMain = !!$('main, [role="main"]');
    const hasSkipLink = !!$('a[href="#main"], a[href="#content"], a[href="#maincontent"], .skip-link');
    const hasH1 = h1s.length > 0;
    const hasCTA = $$('a,button').some(el => {
      const t = text(el).toLowerCase();
      return t.length > 0 && t.length < 60;
    });

    // Form inputs without labels
    const inputs = $$('input:not([type="hidden"]):not([type="submit"]):not([type="reset"])');
    const unlabeledInputs = inputs.filter(inp => {
      const id = inp.id;
      const hasLabel = id && document.querySelector(`label[for="${id}"]`);
      const hasAriaLabel = inp.getAttribute('aria-label') || inp.getAttribute('aria-labelledby');
      return !hasLabel && !hasAriaLabel;
    }).length;

    // Render-blocking scripts in <head>
    const headScripts = $$('head script[src]').filter(s => {
      const defer = s.hasAttribute('defer');
      const async_ = s.hasAttribute('async');
      return !defer && !async_;
    }).length;

    // Inline style overuse
    const inlineStyleCount = $$('[style]').length;

    // Sticky/fixed elements
    const fixedElements = $$('*').filter(el => {
      try {
        const pos = window.getComputedStyle(el).position;
        return pos === 'fixed' || pos === 'sticky';
      } catch (_) { return false; }
    }).length;

    // Basic font size check (body)
    let bodyFontSize = 0;
    try {
      const bodyStyle = window.getComputedStyle(document.body);
      bodyFontSize = parseFloat(bodyStyle.fontSize) || 0;
    } catch (_) {}

    // ARIA roles
    const ariaRoles = $$('[role]').map(el => el.getAttribute('role')).filter(Boolean);

    return {
      title, metaDesc, metaKeywords, canonical, robotsMeta, viewportMeta, langAttr,
      og, tw,
      h1s, h2s, h3s, h4s, headingSkips,
      images: { total: allImgs.length, missingAlt, brokenImgs, imgsWithoutDimensions },
      schemaTypes,
      links: {
        internal: internalLinks.length,
        external: externalLinks.length,
        externalNoOpener,
      },
      wordCount, keywordCount,
      ui: {
        hasNav, hasFooter, hasMain, hasSkipLink, hasCTA,
        unlabeledInputs, headScripts, inlineStyleCount, fixedElements, bodyFontSize,
        ariaRoles,
      },
    };
  }, keyword);

  const loadMs = Date.now() - startTime;
  const finalUrl = page.url();
  const httpsEnabled = finalUrl.startsWith('https://');

  // ── Build issues ─────────────────────────────────────────────────────────
  const critical = [];
  const warnings = [];
  const suggestions = [];

  // SEO criticals
  if (!data.title) critical.push('Missing title tag');
  if (data.robotsMeta.includes('noindex')) critical.push('Page is set to noindex — blocked from Google');
  if (!data.viewportMeta) critical.push('Missing viewport meta tag — not mobile-friendly');
  if (!httpsEnabled) critical.push('Page not served over HTTPS');
  if (data.h1s.length === 0) critical.push('No H1 tag found');
  if (data.h1s.length > 1) critical.push(`Multiple H1 tags (${data.h1s.length}) — should be exactly 1`);
  if (!data.metaDesc) critical.push('Missing meta description');

  // SEO warnings
  if (data.title && data.title.length < 30) warnings.push(`Title too short (${data.title.length} chars, ideal 50–60)`);
  if (data.title && data.title.length > 70) warnings.push(`Title too long (${data.title.length} chars, ideal 50–60)`);
  if (data.metaDesc && data.metaDesc.length < 100) warnings.push(`Meta description too short (${data.metaDesc.length} chars, ideal 120–158)`);
  if (data.metaDesc && data.metaDesc.length > 160) warnings.push(`Meta description too long (${data.metaDesc.length} chars, ideal 120–158)`);
  if (!data.canonical) warnings.push('No canonical URL specified');
  if (data.images.missingAlt > 0) warnings.push(`${data.images.missingAlt} image(s) missing alt text`);
  if (data.wordCount < 300) warnings.push(`Thin content — only ${data.wordCount} words (aim for 800+)`);
  if (!data.og.title || !data.og.description || !data.og.image) warnings.push('Incomplete Open Graph tags (missing title, description, or image)');
  if (data.headingSkips.length > 0) warnings.push(`Heading hierarchy skips: ${data.headingSkips.join(', ')}`);
  if (!data.langAttr) warnings.push('No lang attribute on <html> tag');
  if (data.ui.headScripts > 0) warnings.push(`${data.ui.headScripts} render-blocking script(s) in <head> (add defer/async)`);
  if (!data.ui.hasNav) warnings.push('No <nav> element found');
  if (data.ui.unlabeledInputs > 0) warnings.push(`${data.ui.unlabeledInputs} form input(s) missing labels`);
  if (data.images.brokenImgs > 0) warnings.push(`${data.images.brokenImgs} broken image(s) found`);
  if (data.ui.bodyFontSize > 0 && data.ui.bodyFontSize < 14) warnings.push(`Body font size is ${data.ui.bodyFontSize}px — aim for 14–16px minimum`);
  if (loadMs > 4000) warnings.push(`Slow page load: ${loadMs}ms (aim for <2000ms)`);

  // SEO / UX suggestions
  if (keyword && data.title && !data.title.toLowerCase().includes(keyword.toLowerCase())) suggestions.push('Title does not contain the target keyword');
  if (keyword && data.h1s.length > 0 && !data.h1s[0].toLowerCase().includes(keyword.toLowerCase())) suggestions.push('H1 does not contain the target keyword');
  if (data.schemaTypes.length === 0) suggestions.push('No JSON-LD schema markup found — add LocalBusiness/Service/Organization schema');
  if (!data.tw.card) suggestions.push('No Twitter Card meta tags');
  if (!data.ui.hasSkipLink) suggestions.push('No skip-to-content link (accessibility)');
  if (!data.ui.hasMain) suggestions.push('No <main> or role="main" landmark element');
  if (!data.ui.hasFooter) suggestions.push('No <footer> element found');
  if (data.links.externalNoOpener > 0) suggestions.push(`${data.links.externalNoOpener} external link(s) missing rel="noopener"`);
  if (data.images.imgsWithoutDimensions > 3) suggestions.push(`${data.images.imgsWithoutDimensions} images missing width/height/srcset attributes`);
  if (data.wordCount >= 300 && data.wordCount < 800) suggestions.push(`Content is ${data.wordCount} words — expanding to 800+ improves SEO`);
  if (!data.metaKeywords) suggestions.push('Consider adding meta keywords (minor signal, but still used by some engines)');

  // ── Score ─────────────────────────────────────────────────────────────────
  let seoScore = 100;
  let uxScore = 100;

  // SEO deductions
  const seoCriticals = [
    !data.title, data.robotsMeta.includes('noindex'), !data.viewportMeta, !httpsEnabled,
    data.h1s.length === 0, data.h1s.length > 1, !data.metaDesc,
  ].filter(Boolean).length;
  const seoWarnings = [
    data.title && (data.title.length < 30 || data.title.length > 70),
    data.metaDesc && (data.metaDesc.length < 100 || data.metaDesc.length > 160),
    !data.canonical, data.images.missingAlt > 0,
    data.wordCount < 300,
    !data.og.title || !data.og.description || !data.og.image,
    data.headingSkips.length > 0,
  ].filter(Boolean).length;
  seoScore = Math.max(5, 100 - Math.min(seoCriticals * 15, 60) - Math.min(seoWarnings * 5, 25));

  // UX deductions
  const uxCriticals = [!data.viewportMeta].filter(Boolean).length;
  const uxWarnings = [
    !data.langAttr, data.ui.headScripts > 0, !data.ui.hasNav,
    data.ui.unlabeledInputs > 0, data.images.brokenImgs > 0,
    data.ui.bodyFontSize > 0 && data.ui.bodyFontSize < 14,
    loadMs > 4000,
  ].filter(Boolean).length;
  const uxSuggestions = [
    !data.ui.hasSkipLink, !data.ui.hasMain, !data.ui.hasFooter,
    data.links.externalNoOpener > 0,
  ].filter(Boolean).length;
  uxScore = Math.max(5, 100 - Math.min(uxCriticals * 15, 45) - Math.min(uxWarnings * 5, 30) - Math.min(uxSuggestions * 2, 10));

  const overallScore = Math.round((seoScore * 0.6) + (uxScore * 0.4));

  return {
    url,
    finalUrl,
    httpsEnabled,
    loadMs,
    keyword,
    ...data,
    issues: { critical, warnings, suggestions },
    scores: { seo: seoScore, ux: uxScore, overall: overallScore },
  };
}

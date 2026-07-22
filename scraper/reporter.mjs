/**
 * reporter.mjs — Generates .md and .txt audit reports from crawl results.
 */

import fs from 'fs';
import path from 'path';

// ── Helpers ──────────────────────────────────────────────────────────────────

function score2bar(score) {
  const filled = Math.round(score / 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled) + ` ${score}/100`;
}

function scoreLabel(score) {
  if (score >= 80) return 'Good';
  if (score >= 60) return 'Needs Work';
  if (score >= 40) return 'Poor';
  return 'Critical';
}

function stripMd(str) {
  return str
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\|/g, ' | ')
    .replace(/❌/g, '[FAIL]')
    .replace(/✅/g, '[OK]')
    .replace(/⚠️/g, '[WARN]')
    .replace(/💡/g, '[TIP]')
    .replace(/🔴/g, '[CRITICAL]')
    .replace(/🟡/g, '[WARNING]')
    .replace(/🟢/g, '[SUGGESTION]')
    .replace(/📄/g, '')
    .replace(/---+/g, '─'.repeat(60));
}

function yesNo(val) { return val ? '✅ Yes' : '❌ No'; }
function present(val) { return val ? '✅ Present' : '❌ Missing'; }

// ── Per-page markdown ────────────────────────────────────────────────────────

function renderPageReport(audit, rank, keyword, domain) {
  const { url, finalUrl, httpsEnabled, loadMs, title, metaDesc, metaKeywords, canonical,
    robotsMeta, viewportMeta, langAttr, og, tw, h1s, h2s, h3s, h4s, headingSkips,
    images, schemaTypes, links, wordCount, keywordCount, ui, issues, scores } = audit;

  const pagePath = (() => {
    try { return new URL(finalUrl || url).pathname || '/'; } catch { return url; }
  })();

  const lines = [];

  lines.push(`# Page Audit: ${pagePath}`);
  lines.push(`**URL:** ${finalUrl || url}`);
  lines.push(`**Domain:** ${domain}  |  **Keyword:** ${keyword || '—'}  |  **Rank:** #${rank}`);
  lines.push(`**Load time:** ${loadMs}ms  |  **HTTPS:** ${yesNo(httpsEnabled)}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Score bar
  lines.push(`## Score: ${scores.overall}/100 — ${scoreLabel(scores.overall)}`);
  lines.push('');
  lines.push(`| Category | Score | Rating |`);
  lines.push(`|---|---|---|`);
  lines.push(`| Overall | ${score2bar(scores.overall)} | ${scoreLabel(scores.overall)} |`);
  lines.push(`| SEO | ${score2bar(scores.seo)} | ${scoreLabel(scores.seo)} |`);
  lines.push(`| UI / UX | ${score2bar(scores.ux)} | ${scoreLabel(scores.ux)} |`);
  lines.push('');

  // Issues summary
  if (issues.critical.length > 0) {
    lines.push('## ❌ Critical Issues');
    issues.critical.forEach(i => lines.push(`- ❌ ${i}`));
    lines.push('');
  }
  if (issues.warnings.length > 0) {
    lines.push('## ⚠️ Warnings');
    issues.warnings.forEach(i => lines.push(`- ⚠️ ${i}`));
    lines.push('');
  }
  if (issues.suggestions.length > 0) {
    lines.push('## 💡 Suggestions');
    issues.suggestions.forEach(i => lines.push(`- 💡 ${i}`));
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  // ── SEO section ────────────────────────────────────────────────────────────
  lines.push('## SEO Analysis');
  lines.push('');

  // Title
  lines.push('### Title Tag');
  lines.push(`- **Present:** ${present(title)}`);
  if (title) {
    lines.push(`- **Value:** \`${title}\``);
    lines.push(`- **Length:** ${title.length} chars ${title.length >= 50 && title.length <= 60 ? '✅' : '⚠️'} (ideal: 50–60)`);
    if (keyword) lines.push(`- **Contains keyword:** ${yesNo(title.toLowerCase().includes(keyword.toLowerCase()))}`);
  }
  lines.push('');

  // Meta description
  lines.push('### Meta Description');
  lines.push(`- **Present:** ${present(metaDesc)}`);
  if (metaDesc) {
    lines.push(`- **Value:** \`${metaDesc}\``);
    lines.push(`- **Length:** ${metaDesc.length} chars ${metaDesc.length >= 120 && metaDesc.length <= 158 ? '✅' : '⚠️'} (ideal: 120–158)`);
  } else {
    lines.push('- **Recommendation:** Write a 120–158 char summary with your target keyword. Google will auto-generate a poor one otherwise.');
  }
  lines.push('');

  // Headings
  lines.push('### Heading Structure');
  lines.push(`- **H1 count:** ${h1s.length} ${h1s.length === 1 ? '✅' : '❌'}`);
  if (h1s.length > 0) lines.push(`- **H1 text:** "${h1s[0]}"`);
  if (h2s.length > 0) lines.push(`- **H2 tags (${h2s.length}):** ${h2s.slice(0, 5).map(h => `"${h}"`).join(', ')}${h2s.length > 5 ? '…' : ''}`);
  if (h3s.length > 0) lines.push(`- **H3 tags (${h3s.length}):** ${h3s.slice(0, 3).map(h => `"${h}"`).join(', ')}${h3s.length > 3 ? '…' : ''}`);
  if (headingSkips.length > 0) lines.push(`- **Hierarchy issue ⚠️:** Skipped levels — ${headingSkips.join(', ')}`);
  else if (h1s.length > 0) lines.push('- **Hierarchy:** ✅ No skipped heading levels');
  lines.push('');

  // Images
  lines.push('### Images');
  lines.push(`- **Total images:** ${images.total}`);
  lines.push(`- **Missing alt text:** ${images.missingAlt} ${images.missingAlt === 0 ? '✅' : '❌'}`);
  lines.push(`- **Broken images:** ${images.brokenImgs} ${images.brokenImgs === 0 ? '✅' : '❌'}`);
  if (images.imgsWithoutDimensions > 0) lines.push(`- **No width/height/srcset:** ${images.imgsWithoutDimensions} ⚠️`);
  lines.push('');

  // Technical SEO
  lines.push('### Technical SEO');
  lines.push(`- **Canonical URL:** ${present(canonical)}${canonical ? ` → \`${canonical}\`` : ''}`);
  lines.push(`- **Robots meta:** ${robotsMeta || '(not set — defaults to index, follow)'}`);
  lines.push(`- **Viewport meta:** ${present(viewportMeta)}`);
  lines.push(`- **HTTPS:** ${yesNo(httpsEnabled)}`);
  lines.push(`- **Lang attribute:** ${present(langAttr)}${langAttr ? ` (\`${langAttr}\`)` : ''}`);
  lines.push(`- **Schema markup:** ${schemaTypes.length > 0 ? `✅ ${schemaTypes.join(', ')}` : '❌ None found'}`);
  lines.push('');

  // Open Graph & Social
  lines.push('### Social / Open Graph');
  lines.push(`- **og:title:** ${present(og.title)}`);
  lines.push(`- **og:description:** ${present(og.description)}`);
  lines.push(`- **og:image:** ${present(og.image)}`);
  lines.push(`- **og:type:** ${present(og.type)}`);
  lines.push(`- **Twitter card:** ${present(tw.card)}`);
  lines.push('');

  // Content
  lines.push('### Content');
  lines.push(`- **Word count:** ${wordCount} ${wordCount >= 800 ? '✅' : wordCount >= 300 ? '⚠️' : '❌'} (aim for 800+)`);
  if (keyword && keywordCount !== undefined) {
    const density = wordCount > 0 ? ((keywordCount / wordCount) * 100).toFixed(2) : '0.00';
    lines.push(`- **Keyword "${keyword}" count:** ${keywordCount} (density: ${density}%)`);
  }
  lines.push('');

  // Links
  lines.push('### Link Analysis');
  lines.push(`- **Internal links:** ${links.internal}`);
  lines.push(`- **External links:** ${links.external}`);
  if (links.externalNoOpener > 0) lines.push(`- **External links missing rel="noopener":** ${links.externalNoOpener} ⚠️`);
  lines.push('');

  lines.push('---');
  lines.push('');

  // ── UI/UX section ──────────────────────────────────────────────────────────
  lines.push('## UI / UX Analysis');
  lines.push('');

  lines.push('### Layout & Navigation');
  lines.push(`- **\`<nav>\` element:** ${yesNo(ui.hasNav)}`);
  lines.push(`- **\`<main>\` element:** ${yesNo(ui.hasMain)}`);
  lines.push(`- **\`<footer>\` element:** ${yesNo(ui.hasFooter)}`);
  lines.push(`- **Sticky/fixed elements:** ${ui.fixedElements > 0 ? `${ui.fixedElements} found (e.g. sticky nav, floating CTA)` : 'None'}`);
  lines.push(`- **Has visible CTA:** ${yesNo(ui.hasCTA)}`);
  lines.push('');

  lines.push('### Accessibility');
  lines.push(`- **Skip-to-content link:** ${yesNo(ui.hasSkipLink)}`);
  lines.push(`- **Form inputs without labels:** ${ui.unlabeledInputs} ${ui.unlabeledInputs === 0 ? '✅' : '❌'}`);
  lines.push(`- **ARIA roles used:** ${ui.ariaRoles.length > 0 ? ui.ariaRoles.slice(0, 8).join(', ') : '❌ None found'}`);
  lines.push(`- **Lang on \`<html>\`:** ${present(langAttr)}`);
  lines.push('');

  lines.push('### Performance Signals');
  lines.push(`- **Page load time:** ${loadMs}ms ${loadMs < 2000 ? '✅' : loadMs < 4000 ? '⚠️' : '❌'}`);
  lines.push(`- **Render-blocking scripts in \`<head>\`:** ${ui.headScripts} ${ui.headScripts === 0 ? '✅' : '⚠️'}`);
  lines.push(`- **Inline style attribute overuse:** ${ui.inlineStyleCount} elements ${ui.inlineStyleCount > 20 ? '⚠️' : '✅'}`);
  if (ui.bodyFontSize > 0) lines.push(`- **Body font size:** ${ui.bodyFontSize}px ${ui.bodyFontSize >= 14 ? '✅' : '⚠️'}`);
  lines.push('');

  return lines.join('\n');
}

// ── Site-wide report markdown ────────────────────────────────────────────────

function renderSiteReport({ domain, keyword, rank, crawlResult, startUrl, date }) {
  const { pages, broken404, totalCrawled } = crawlResult;
  const validPages = pages.filter(p => p.scores && !p.error);

  if (validPages.length === 0) {
    return `# Site Audit: ${domain}\n\n**No pages could be crawled.** Check the URL and try again.\n`;
  }

  const avgOverall = Math.round(validPages.reduce((s, p) => s + p.scores.overall, 0) / validPages.length);
  const avgSeo = Math.round(validPages.reduce((s, p) => s + p.scores.seo, 0) / validPages.length);
  const avgUx = Math.round(validPages.reduce((s, p) => s + p.scores.ux, 0) / validPages.length);

  // Aggregate issues across all pages
  const allCriticals = {};
  const allWarnings = {};
  const allSuggestions = {};
  const siteHasSchema = validPages.some(p => p.schemaTypes?.length > 0);
  const totalMissingAlt = validPages.reduce((s, p) => s + (p.images?.missingAlt || 0), 0);
  const noindexPages = validPages.filter(p => p.robotsMeta?.includes('noindex')).map(p => p.finalUrl || p.url);
  const noMetaDesc = validPages.filter(p => !p.metaDesc).length;
  const noCanonical = validPages.filter(p => !p.canonical).length;
  const slowPages = validPages.filter(p => p.loadMs > 3000).length;
  const duplicateTitles = (() => {
    const seen = {}; const dups = [];
    validPages.forEach(p => { if (p.title) { seen[p.title] = (seen[p.title] || 0) + 1; } });
    Object.entries(seen).forEach(([t, c]) => { if (c > 1) dups.push(`"${t}" (${c} pages)`); });
    return dups;
  })();
  const duplicateMeta = (() => {
    const seen = {}; const dups = [];
    validPages.forEach(p => { if (p.metaDesc) { seen[p.metaDesc] = (seen[p.metaDesc] || 0) + 1; } });
    Object.entries(seen).forEach(([t, c]) => { if (c > 1) dups.push(`${c} pages share the same meta description`); });
    return dups;
  })();

  const lines = [];

  lines.push(`# Site Audit: ${domain}`);
  lines.push(`**Keyword:** ${keyword || '—'}  |  **Google Rank:** #${rank}  |  **Crawled:** ${date}`);
  lines.push(`**Entry URL:** ${startUrl}`);
  lines.push(`**Pages Crawled:** ${totalCrawled}  |  **Broken 404s Found:** ${broken404.length}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Overall scores
  lines.push('## Overall Scores');
  lines.push('');
  lines.push(`| Category | Score | Rating |`);
  lines.push(`|---|---|---|`);
  lines.push(`| Overall | ${score2bar(avgOverall)} | ${scoreLabel(avgOverall)} |`);
  lines.push(`| SEO (avg) | ${score2bar(avgSeo)} | ${scoreLabel(avgSeo)} |`);
  lines.push(`| UI / UX (avg) | ${score2bar(avgUx)} | ${scoreLabel(avgUx)} |`);
  lines.push('');

  // Critical site-wide issues
  const siteCriticals = [];
  if (noMetaDesc > 0) siteCriticals.push(`${noMetaDesc} page(s) missing meta description`);
  if (noindexPages.length > 0) siteCriticals.push(`${noindexPages.length} page(s) set to noindex — hidden from Google: ${noindexPages.join(', ')}`);
  if (broken404.length > 0) siteCriticals.push(`${broken404.length} broken internal link(s) returning 404: ${broken404.slice(0, 3).join(', ')}${broken404.length > 3 ? '…' : ''}`);
  if (totalMissingAlt > 0) siteCriticals.push(`${totalMissingAlt} image(s) missing alt text across site`);

  const siteWarnings = [];
  if (noCanonical > 0) siteWarnings.push(`${noCanonical} page(s) have no canonical URL`);
  if (!siteHasSchema) siteWarnings.push('No JSON-LD schema markup found anywhere on the site');
  if (slowPages > 0) siteWarnings.push(`${slowPages} page(s) loaded in >3s`);
  if (duplicateTitles.length > 0) siteWarnings.push(`Duplicate page titles: ${duplicateTitles.join('; ')}`);
  if (duplicateMeta.length > 0) siteWarnings.push(`Duplicate meta descriptions: ${duplicateMeta.join('; ')}`);
  const pagesNoLang = validPages.filter(p => !p.langAttr).length;
  if (pagesNoLang > 0) siteWarnings.push(`${pagesNoLang} page(s) missing lang attribute on <html>`);

  if (siteCriticals.length > 0) {
    lines.push('## ❌ Critical Issues (Site-Wide)');
    siteCriticals.forEach(i => lines.push(`- ❌ ${i}`));
    lines.push('');
  }
  if (siteWarnings.length > 0) {
    lines.push('## ⚠️ Warnings (Site-Wide)');
    siteWarnings.forEach(i => lines.push(`- ⚠️ ${i}`));
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  // ── Improvement Roadmap ────────────────────────────────────────────────────
  lines.push('## Improvement Roadmap');
  lines.push('');

  const roadmapCritical = [];
  const roadmapWarnings = [];
  const roadmapSuggestions = [];

  if (broken404.length > 0) roadmapCritical.push(`**Fix ${broken404.length} broken link(s)** — Pages returning 404 hurt user experience and waste crawl budget. Update or remove these links: ${broken404.slice(0, 3).join(', ')}`);
  if (noindexPages.length > 0) roadmapCritical.push(`**Remove noindex from ${noindexPages.length} page(s)** — These pages are invisible to Google: ${noindexPages.join(', ')}`);
  if (totalMissingAlt > 0) roadmapCritical.push(`**Add alt text to ${totalMissingAlt} image(s)** — Alt text is required for accessibility (WCAG 2.1 AA) and helps images rank in Google Images.`);
  if (noMetaDesc > 0) roadmapCritical.push(`**Write meta descriptions for ${noMetaDesc} page(s)** — Without one, Google picks arbitrary text from the page, often reducing click-through rates.`);

  if (noCanonical > 0) roadmapWarnings.push(`**Add canonical URLs to ${noCanonical} page(s)** — Canonicals tell Google which URL to rank when duplicate content exists.`);
  if (!siteHasSchema) roadmapWarnings.push(`**Add JSON-LD schema markup** — Implement \`LocalBusiness\` or \`Service\` schema. This enables rich results (star ratings, address, hours) in Google — a direct traffic driver.`);
  const avgWords = Math.round(validPages.reduce((s, p) => s + (p.wordCount || 0), 0) / validPages.length);
  if (avgWords < 600) roadmapWarnings.push(`**Expand content** — Average page is ${avgWords} words. Pages with 800–1500 words tend to rank significantly higher for competitive keywords.`);
  if (duplicateTitles.length > 0) roadmapWarnings.push(`**Fix duplicate page titles** — Each page needs a unique title. Currently ${duplicateTitles.length} title(s) are shared across multiple pages.`);
  if (slowPages > 0) roadmapWarnings.push(`**Improve page speed on ${slowPages} page(s)** — Pages loading >3s lose ~50% of mobile visitors. Defer render-blocking scripts, compress images, and use a CDN.`);

  const pagesNoTwitter = validPages.filter(p => !p.tw?.card).length;
  if (pagesNoTwitter > 0) roadmapSuggestions.push(`**Add Twitter Card meta tags to ${pagesNoTwitter} page(s)** — Improves social media preview appearance when links are shared.`);
  if (pagesNoLang > 0) roadmapSuggestions.push(`**Add lang attribute to <html>** — \`<html lang="en">\` is required for screen readers and improves accessibility compliance.`);
  const pagesNoSkip = validPages.filter(p => !p.ui?.hasSkipLink).length;
  if (pagesNoSkip > 0) roadmapSuggestions.push(`**Add skip-to-content link** — Required for keyboard navigation compliance (WCAG 2.1). Add \`<a href="#main" class="skip-link">Skip to content</a>\` at the top of each page.`);

  if (roadmapCritical.length > 0) {
    lines.push('### 🔴 Do This Week (Critical)');
    roadmapCritical.forEach((item, i) => lines.push(`${i + 1}. ${item}`));
    lines.push('');
  }
  if (roadmapWarnings.length > 0) {
    lines.push('### 🟡 Do This Month (Important)');
    roadmapWarnings.forEach((item, i) => lines.push(`${i + 1}. ${item}`));
    lines.push('');
  }
  if (roadmapSuggestions.length > 0) {
    lines.push('### 🟢 Nice to Have (Suggestions)');
    roadmapSuggestions.forEach((item, i) => lines.push(`${i + 1}. ${item}`));
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  // ── Crawlability ───────────────────────────────────────────────────────────
  lines.push('## Crawlability & Technical');
  lines.push('');
  lines.push(`- **Total pages crawled:** ${totalCrawled}`);
  lines.push(`- **Broken 404 URLs:** ${broken404.length === 0 ? '✅ None' : `❌ ${broken404.join(', ')}`}`);
  lines.push(`- **HTTPS:** ${yesNo(validPages[0]?.httpsEnabled)}`);
  lines.push(`- **Schema markup on site:** ${siteHasSchema ? `✅ Yes — ${[...new Set(validPages.flatMap(p => p.schemaTypes || []))].join(', ')}` : '❌ Not found'}`);
  lines.push(`- **Average page load:** ${Math.round(validPages.reduce((s, p) => s + p.loadMs, 0) / validPages.length)}ms`);
  lines.push('');

  // ── SEO Deep Dive ──────────────────────────────────────────────────────────
  lines.push('## SEO Deep-Dive');
  lines.push('');

  lines.push('### Homepage SEO');
  const homepage = validPages[0];
  if (homepage) {
    lines.push(`- **Title:** ${homepage.title ? `"${homepage.title}"` : '❌ Missing'}`);
    lines.push(`- **Meta desc:** ${homepage.metaDesc ? `"${homepage.metaDesc.substring(0, 100)}…"` : '❌ Missing'}`);
    lines.push(`- **H1:** ${homepage.h1s?.length > 0 ? `"${homepage.h1s[0]}"` : '❌ Missing'}`);
    lines.push(`- **Word count:** ${homepage.wordCount}`);
    lines.push(`- **Schema:** ${homepage.schemaTypes?.length > 0 ? homepage.schemaTypes.join(', ') : '❌ None'}`);
  }
  lines.push('');

  if (duplicateTitles.length > 0 || duplicateMeta.length > 0) {
    lines.push('### Duplicate Content');
    duplicateTitles.forEach(d => lines.push(`- ⚠️ Duplicate title: ${d}`));
    duplicateMeta.forEach(d => lines.push(`- ⚠️ ${d}`));
    lines.push('');
  }

  // ── UX Deep Dive ───────────────────────────────────────────────────────────
  lines.push('## UI / UX Deep-Dive');
  lines.push('');

  const pagesNoNav = validPages.filter(p => !p.ui?.hasNav).length;
  const pagesNoFooter = validPages.filter(p => !p.ui?.hasFooter).length;
  const pagesWithUnlabeledInputs = validPages.filter(p => (p.ui?.unlabeledInputs || 0) > 0);
  const totalUnlabeled = validPages.reduce((s, p) => s + (p.ui?.unlabeledInputs || 0), 0);
  const pagesWithBlockingScripts = validPages.filter(p => (p.ui?.headScripts || 0) > 0);

  lines.push('### Mobile & Accessibility');
  lines.push(`- **Viewport meta (mobile-ready):** ${yesNo(validPages.every(p => p.viewportMeta))}`);
  lines.push(`- **Pages with <nav>:** ${validPages.length - pagesNoNav}/${validPages.length}`);
  lines.push(`- **Pages with <footer>:** ${validPages.length - pagesNoFooter}/${validPages.length}`);
  lines.push(`- **Unlabeled form inputs (total):** ${totalUnlabeled} ${totalUnlabeled === 0 ? '✅' : '❌'}`);
  lines.push(`- **Pages with skip link:** ${validPages.filter(p => p.ui?.hasSkipLink).length}/${validPages.length}`);
  lines.push('');

  lines.push('### Performance');
  lines.push(`- **Average load time:** ${Math.round(validPages.reduce((s, p) => s + p.loadMs, 0) / validPages.length)}ms`);
  lines.push(`- **Pages loading >3s:** ${slowPages}`);
  lines.push(`- **Pages with render-blocking scripts:** ${pagesWithBlockingScripts.length}`);
  lines.push('');

  // ── Page-by-page breakdown ─────────────────────────────────────────────────
  lines.push('---');
  lines.push('');
  lines.push('## Page-by-Page Breakdown');
  lines.push('');
  lines.push('| Page | Overall | SEO | UX | Critical | Warnings | Load (ms) | Words |');
  lines.push('|---|---|---|---|---|---|---|---|');
  validPages.forEach(p => {
    const pagePath = (() => { try { return new URL(p.finalUrl || p.url).pathname || '/'; } catch { return p.url; } })();
    lines.push(`| ${pagePath} | ${p.scores.overall} | ${p.scores.seo} | ${p.scores.ux} | ${p.issues.critical.length} | ${p.issues.warnings.length} | ${p.loadMs} | ${p.wordCount || 0} |`);
  });
  lines.push('');

  return lines.join('\n');
}

// ── Summary report (across all sites for a keyword) ──────────────────────────

function renderSummary({ keyword, date, sites }) {
  const lines = [];
  lines.push(`# Search Results Audit Summary`);
  lines.push(`**Keyword:** "${keyword}"  |  **Date:** ${date}  |  **Sites Analyzed:** ${sites.length}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  lines.push('## Comparison Table');
  lines.push('');
  lines.push('| Rank | Site | Overall | SEO | UX | Critical | Warnings | Pages Crawled |');
  lines.push('|---|---|---|---|---|---|---|---|');

  sites.forEach(s => {
    const vp = s.crawlResult.pages.filter(p => !p.error);
    const avgOverall = vp.length ? Math.round(vp.reduce((a, p) => a + p.scores.overall, 0) / vp.length) : 0;
    const avgSeo = vp.length ? Math.round(vp.reduce((a, p) => a + p.scores.seo, 0) / vp.length) : 0;
    const avgUx = vp.length ? Math.round(vp.reduce((a, p) => a + p.scores.ux, 0) / vp.length) : 0;
    const criticals = vp.reduce((a, p) => a + p.issues.critical.length, 0);
    const warnings = vp.reduce((a, p) => a + p.issues.warnings.length, 0);
    lines.push(`| #${s.rank} | ${s.domain} | ${avgOverall} | ${avgSeo} | ${avgUx} | ${criticals} | ${warnings} | ${s.crawlResult.totalCrawled} |`);
  });
  lines.push('');

  // Competitive gaps
  lines.push('## Competitive Gaps (Opportunities)');
  lines.push('');
  const allValid = sites.flatMap(s => s.crawlResult.pages.filter(p => !p.error));
  const pctNoSchema = Math.round(sites.filter(s => !s.crawlResult.pages.some(p => p.schemaTypes?.length > 0)).length / sites.length * 100);
  const avgWords = allValid.length ? Math.round(allValid.reduce((a, p) => a + (p.wordCount || 0), 0) / allValid.length) : 0;
  const pctNoMetaDesc = Math.round(allValid.filter(p => !p.metaDesc).length / allValid.length * 100);

  if (pctNoSchema > 50) lines.push(`- **${pctNoSchema}% of sites lack JSON-LD schema** — Adding schema gives you a significant edge in rich results`);
  if (avgWords < 700) lines.push(`- **Average content length is only ${avgWords} words** — More comprehensive content outranks thin pages`);
  if (pctNoMetaDesc > 30) lines.push(`- **${pctNoMetaDesc}% of pages are missing meta descriptions** — Writing them is a quick SEO win`);
  const pctNoCanonical = Math.round(allValid.filter(p => !p.canonical).length / allValid.length * 100);
  if (pctNoCanonical > 40) lines.push(`- **${pctNoCanonical}% of pages lack canonical URLs** — Canonicals prevent duplicate content penalties`);
  lines.push('');

  return lines.join('\n');
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function writeReports({ outputBase, keyword, rank, domain, startUrl, crawlResult, date }) {
  const keywordSlug = keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const domainSlug = domain.replace(/^www\./, '').replace(/[^a-z0-9.]/gi, '-');

  const siteDir = path.join(outputBase, keywordSlug, domainSlug);
  const pagesDir = path.join(siteDir, 'pages');
  fs.mkdirSync(pagesDir, { recursive: true });

  // Per-page detail reports
  const validPages = crawlResult.pages.filter(p => p.scores && !p.error);
  for (const audit of validPages) {
    const pagePath = (() => { try { return new URL(audit.finalUrl || audit.url).pathname || '/'; } catch { return '/'; } })();
    const pageSlug = pagePath.replace(/^\//, '').replace(/\//g, '_').replace(/[^a-z0-9_-]/gi, '') || 'homepage';
    const md = renderPageReport(audit, rank, keyword, domain);
    const txt = stripMd(md);
    fs.writeFileSync(path.join(pagesDir, `${pageSlug}.md`), md, 'utf8');
    fs.writeFileSync(path.join(pagesDir, `${pageSlug}.txt`), txt, 'utf8');
  }

  // Site-wide report
  const siteMd = renderSiteReport({ domain, keyword, rank, crawlResult, startUrl, date });
  const siteTxt = stripMd(siteMd);
  fs.writeFileSync(path.join(siteDir, 'report.md'), siteMd, 'utf8');
  fs.writeFileSync(path.join(siteDir, 'report.txt'), siteTxt, 'utf8');

  return siteDir;
}

export function writeSummary({ outputBase, keyword, date, sites }) {
  const keywordSlug = keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const dir = path.join(outputBase, keywordSlug);
  fs.mkdirSync(dir, { recursive: true });

  const md = renderSummary({ keyword, date, sites });
  const txt = stripMd(md);
  fs.writeFileSync(path.join(dir, 'summary.md'), md, 'utf8');
  fs.writeFileSync(path.join(dir, 'summary.txt'), txt, 'utf8');
  return path.join(dir, 'summary.md');
}
